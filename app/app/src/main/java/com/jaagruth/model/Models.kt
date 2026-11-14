package com.jaagruth.model

data class LatLng(
    val lat: Double,
    val lng: Double
)

data class UserProfile(
    val id: String = "usr_jenifer_01",
    val name: String = "Jenifer Pilman",
    val phone: String = "+91 98765 43210",
    val avatar: String = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    val bloodGroup: String = "O+",
    val address: String = "BMSCE Campus, Bull Temple Rd, Basavanagudi, Bengaluru, KA 560019",
    val safetyPin: String = "1234",
    val duressPin: String = "9999",
    val batteryLevel: String = "88%",
    val gpsStatus: String = "Protected · GPS Ready"
)

data class EmergencyContact(
    val id: String,
    val name: String,
    val relation: String,
    val phone: String,
    val priority: Int,
    val avatar: String = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    val status: String = "Active"
)

data class VerifiedResponder(
    val id: String,
    val name: String,
    val title: String,
    val badge: String,
    val etaMinutes: Int,
    val distanceKm: Double,
    val rating: Double,
    val verified: Boolean = true,
    val phone: String,
    val avatar: String,
    val skills: List<String>,
    val location: LatLng,
    val explanation: String = "",
    val score: Double = 0.0
)

data class SafetyHub(
    val id: String,
    val name: String,
    val shortName: String,
    val type: String, // "hospital", "police", "safe_zone", "fire_rescue"
    val icon: String,
    val category: String,
    val distanceMeters: Int,
    val etaMins: Int,
    val location: LatLng,
    val address: String,
    val phone: String,
    val status: String,
    val openNow: Boolean = true,
    val openingHoursText: String,
    val isTraumaCenter: Boolean = false,
    val briefing: String
)

data class IncidentBlock(
    val index: Int,
    val prevHash: String,
    val hash: String,
    val timestamp: String,
    val actorId: String,
    val actorRole: String,
    val eventType: String,
    val payload: Map<String, Any>,
    val tampered: Boolean = false
)

data class VerificationResult(
    val isValid: Boolean,
    val brokenIndex: Int? = null,
    val reason: String,
    val checkedCount: Int
)
