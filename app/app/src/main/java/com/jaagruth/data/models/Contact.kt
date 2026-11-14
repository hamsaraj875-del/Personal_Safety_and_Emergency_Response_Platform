package com.jaagruth.data.models

data class Contact(
    val id: String,
    val name: String,
    val phoneNumber: String,
    val relationship: String,
    var priority: Int,
    val consentGiven: Boolean = true
)
