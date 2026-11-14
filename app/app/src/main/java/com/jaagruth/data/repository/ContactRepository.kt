package com.jaagruth.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.Contact
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class ContactRepository(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jaagruth_contact_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    private val _contacts = MutableStateFlow<List<Contact>>(emptyList())
    val contacts: StateFlow<List<Contact>> = _contacts.asStateFlow()

    init {
        loadContacts()
    }

    private fun loadContacts() {
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

        val newContact = Contact(
            id = "c_${System.currentTimeMillis() % 10000}",
            name = name.trim(),
            phoneNumber = cleanPhone,
            relationship = relationship.trim().ifBlank { "Emergency Contact" },
            priority = currentList.size + 1,
            consentGiven = true
        )
        currentList.add(newContact)
        saveContacts(currentList)
        return Result.success(newContact)
    }

    fun deleteContact(contactId: String): Boolean {
        val currentList = _contacts.value.toMutableList()
        val removed = currentList.removeAll { it.id == contactId }
        if (removed) {
            // Re-index priority
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
