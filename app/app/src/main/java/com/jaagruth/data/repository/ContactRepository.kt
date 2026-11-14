package com.jaagruth.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.reflect.TypeToken
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.Contact
import com.jaagruth.data.remote.CreateContactRequest
import com.jaagruth.data.remote.NetworkClient
import com.jaagruth.data.remote.ReorderContactsRequest
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ContactRepository(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jaagruth_contact_prefs", Context.MODE_PRIVATE)
    private val gson = NetworkClient.gson
    private val apiService by lazy { NetworkClient.getApiService(context) }
    private val repoScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _contacts = MutableStateFlow<List<Contact>>(emptyList())
    val contacts: StateFlow<List<Contact>> = _contacts.asStateFlow()

    private val _isOfflineSimulated = MutableStateFlow(false)
    val isOfflineSimulated: StateFlow<Boolean> = _isOfflineSimulated.asStateFlow()

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

    suspend fun fetchContactsFromServer(): Result<List<Contact>> = withContext(Dispatchers.IO) {
        try {
            val res = apiService.getContacts()
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
                return@withContext Result.success(serverList)
            }
        } catch (e: Exception) {
            // Network fallback
        }
        return@withContext Result.success(_contacts.value)
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

        val newPriority = currentList.size + 1
        val newContact = Contact(
            id = "c_${System.currentTimeMillis() % 10000}",
            name = name.trim(),
            phoneNumber = cleanPhone,
            relationship = relationship.trim().ifEmpty { "Emergency Network" },
            priority = newPriority,
            consentGiven = true
        )

        currentList.add(newContact)
        saveContacts(currentList)

        if (!_isOfflineSimulated.value) {
            repoScope.launch {
                try {
                    val res = apiService.createContact(
                        CreateContactRequest(
                            name = newContact.name,
                            phone = newContact.phoneNumber,
                            relation = newContact.relationship,
                            priority = newContact.priority
                        )
                    )
                    if (res.isSuccessful && res.body() != null) {
                        val serverDto = res.body()!!
                        val updated = _contacts.value.map {
                            if (it.id == newContact.id) it.copy(id = serverDto.id) else it
                        }
                        saveContacts(updated)
                    }
                } catch (e: Exception) {
                    // Local copy preserved
                }
            }
        }

        return Result.success(newContact)
    }

    fun deleteContact(contactId: String): Boolean {
        val currentList = _contacts.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == contactId }
        if (index == -1) return false

        currentList.removeAt(index)
        currentList.forEachIndexed { idx, contact ->
            contact.priority = idx + 1
        }
        saveContacts(currentList)

        if (!_isOfflineSimulated.value) {
            repoScope.launch {
                try {
                    apiService.deleteContact(contactId)
                } catch (e: Exception) {
                    // Ignore
                }
            }
        }

        return true
    }

    fun updatePriority(contactId: String, moveUp: Boolean): Boolean {
        val currentList = _contacts.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == contactId }
        if (index == -1) return false

        val targetIndex = if (moveUp) index - 1 else index + 1
        if (targetIndex !in currentList.indices) return false

        val contact = currentList.removeAt(index)
        currentList.add(targetIndex, contact)

        currentList.forEachIndexed { i, c ->
            c.priority = i + 1
        }
        saveContacts(currentList)

        if (!_isOfflineSimulated.value) {
            repoScope.launch {
                try {
                    apiService.reorderContacts(ReorderContactsRequest(currentList.map { it.id }))
                } catch (e: Exception) {
                    // Ignore
                }
            }
        }
        return true
    }

    fun reorderContacts(fromPriority: Int, toPriority: Int) {
        val currentList = _contacts.value.toMutableList()
        val fromIndex = currentList.indexOfFirst { it.priority == fromPriority }
        val toIndex = currentList.indexOfFirst { it.priority == toPriority }

        if (fromIndex != -1 && toIndex != -1) {
            val item = currentList.removeAt(fromIndex)
            currentList.add(toIndex, item)

            currentList.forEachIndexed { idx, contact ->
                contact.priority = idx + 1
            }
            saveContacts(currentList)

            if (!_isOfflineSimulated.value) {
                repoScope.launch {
                    try {
                        apiService.reorderContacts(ReorderContactsRequest(currentList.map { it.id }))
                    } catch (e: Exception) {
                        // Ignore
                    }
                }
            }
        }
    }

    fun setOfflineSimulated(isOffline: Boolean) {
        _isOfflineSimulated.value = isOffline
    }

    private fun saveContacts(list: List<Contact>) {
        _contacts.value = list
        prefs.edit().putString(KEY_CONTACTS, gson.toJson(list)).apply()
    }

    companion object {
        const val MAX_CONTACTS = 5
        private const val KEY_CONTACTS = "key_emergency_contacts"
    }
}
