package com.jaagruth.data.models

data class User(
    val id: String = "user_01",
    val name: String = "Manoj Kumar",
    val phoneNumber: String = "+91 98765 43210",
    val email: String = "manoj.k@example.com",
    val bloodGroup: String = "O+",
    val emergencyNotes: String = "Allergic to penicillin. Carries inhaler.",
    val safetyPin: String = "1234"
)
