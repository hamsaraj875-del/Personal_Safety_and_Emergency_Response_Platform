package com.jaagruth.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.Contact
import com.jaagruth.data.remote.CreateContactRequest
import com.jaagruth.data.remote.NetworkClient
import com.jaagruth.data.remote.ReorderContactsRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.runBlocking

class ContactRepository(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jaagruth_contact_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()
    private val apiService by lazy { NetworkClient.getApiService(context) }

    private val _contacts = MutableStateFlow<List<Contact>>(emptyList())
    val contacts: StateFlow<List<Contact>> = _contacts.asStateFlow()

    init {
        loadLocalContacts()
    }

    private fun loadLocalContacts() {
        val json = prefs.getString(KEY_CONTACTS, null)
        if (json != null) {
            try {
                val type = object : TypeToken<List<Contact>>() {}.type
                val list: List<Contact> = gson.fromJson(json, type)
                _contacts.value = list.sortedBy { it.priority }
            } catch (e: Exception) {
                _contacts.value = MockDataSource.getInitialContacts()
                saveContacts(_contacts.value)
            }
        } else {
            _contacts.value = MockDataSource.getInitialContacts()
            saveContacts(_contacts.value)
        }
    }

    fun fetchContactsFromServer(): Result<List<Contact>> {
        try {
            val res = runBlocking(Dispatchers.IO) { apiService.getContacts() }
            if (res.isSuccessful && res.body() != null) {
                val serverList = res.body()!!.contacts.map { dto ->
                    Contact(
                        id = dto.id,
                        name = dto.name,
                        phoneNumber = dto.phone,
                        relationship = dto.relation,
                        priority = dto.priority,
                        consentGiven = true
                    )
                }
                saveContacts(serverList)
                return Result.success(serverList)
            }
        } catch (e: Exception) {
            // Network fallback
        }
        return Result.success(_contacts.value)
    }

    fun addContact(name: String, phone: String, relationship: String, consentGiven: Boolean): Result<Contact> {
        if (!consentGiven) {
            return Result.failure(IllegalStateException("Emergency contact consent is required."))
        }
        if (name.isBlank()) {
            return Result.failure(IllegalArgumentException("Please enter a contact name."))
        }
        val cleanPhone = phone.trim()
        if (cleanPhone.length < 10) {
            return Result.failure(IllegalArgumentException("Please enter a valid phone number (at least 10 digits)."))
        }
        val currentList = _contacts.value.toMutableList()
        if (currentList.size >= MAX_CONTACTS) {
            return Result.failure(IllegalStateException("Maximum of $MAX_CONTACTS contacts allowed."))
        }

        val priority = currentList.size + 1
        var contactId = "c_${System.currentTimeMillis() % 10000}"

        try {
            val res = runBlocking(Dispatchers.IO) {
                apiService.createContact(
                    CreateContactRequest(
                        name = name.trim(),
                        phone = cleanPhone,
                        relation = relationship.trim().ifBlank { "Emergency Contact" },
                        priority = priority
                    )
                )
            }
            if (res.isSuccessful && res.body() != null) {
                contactId = res.body()!!.id
            }
        } catch (e: Exception) {
            // Local fallback
        }

        val newContact = Contact(
            id = contactId,
            name = name.trim(),
            phoneNumber = cleanPhone,
            relationship = relationship.trim().ifBlank { "Emergency Contact" },
            priority = priority,
            consentGiven = true
        )
        currentList.add(newContact)
        saveContacts(currentList)
        return Result.success(newContact)
    }

    fun deleteContact(contactId: String): Boolean {
        try {
            runBlocking(Dispatchers.IO) { apiService.deleteContact(contactId) }
        } catch (e: Exception) {
            // Local fallback
        }

        val currentList = _contacts.value.toMutableList()
        val removed = currentList.removeAll { it.id == contactId }
        if (removed) {
            currentList.forEachIndexed { index, contact ->
                contact.priority = index + 1
            }
            saveContacts(currentList)
        }
        return removed
    }

    fun updatePriority(contactId: String, moveUp: Boolean): Boolean {
        val currentList = _contacts.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == contactId }
        if (index == -1) return false

        val targetIndex = if (moveUp) index - 1 else index + 1
        if (targetIndex < 0 || targetIndex >= currentList.size) return false

        val item = currentList.removeAt(index)
        currentList.add(targetIndex, item)

        currentList.forEachIndexed { i, c ->
            c.priority = i + 1
        }
        saveContacts(currentList)

        try {
            runBlocking(Dispatchers.IO) {
                apiService.reorderContacts(ReorderContactsRequest(currentList.map { it.id }))
            }
        } catch (e: Exception) {
            // Local fallback
        }

        return true
    }

    private fun saveContacts(list: List<Contact>) {
        val sorted = list.sortedBy { it.priority }
        _contacts.value = sorted
        prefs.edit().putString(KEY_CONTACTS, gson.toJson(sorted)).apply()
    }

    companion object {
        const val MAX_CONTACTS = 5
        private const val KEY_CONTACTS = "key_trusted_contacts"
    }
}
