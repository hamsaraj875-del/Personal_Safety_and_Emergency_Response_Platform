package com.jaagruth.viewmodel

import androidx.lifecycle.ViewModel
import com.jaagruth.data.models.Contact
import com.jaagruth.data.repository.ContactRepository
import kotlinx.coroutines.flow.StateFlow

class ContactViewModel(private val contactRepository: ContactRepository) : ViewModel() {

    val contacts: StateFlow<List<Contact>> = contactRepository.contacts

    fun addContact(name: String, phone: String, relationship: String, consentGiven: Boolean): Result<Contact> {
        return contactRepository.addContact(name, phone, relationship, consentGiven)
    }

    fun deleteContact(contactId: String): Boolean {
        return contactRepository.deleteContact(contactId)
    }

    fun updatePriority(contactId: String, moveUp: Boolean): Boolean {
        return contactRepository.updatePriority(contactId, moveUp)
    }
}
