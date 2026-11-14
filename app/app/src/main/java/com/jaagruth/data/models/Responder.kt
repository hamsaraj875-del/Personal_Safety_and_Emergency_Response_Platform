package com.jaagruth.data.models

data class Responder(
    val id: String,
    val name: String,
    val category: String, // "Security", "Medical", "Volunteer"
    val latitude: Double,
    val longitude: Double,
    val isVerified: Boolean,
    val isAvailable: Boolean,
    val historicalResponseMinutes: Int,
    val phone: String = "+91 98450 11223",
    var distanceMeters: Int = 0,
    var etaMinutes: Int = 0,
    var score: Double = 0.0,
    var rankingReason: String = ""
)
