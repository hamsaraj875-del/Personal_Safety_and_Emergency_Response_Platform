package com.jaagruth.model

data class LatLng(
    val lat: Double = 12.9352,
    val lng: Double = 77.5358
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
    val id: String = "",
    val name: String = "",
    val relation: String = "Emergency Network",
    val phone: String = "",
    val priority: Int = 1,
    val avatar: String = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    val status: String = "Active"
)

data class VerifiedResponder(
    val id: String = "resp_1",
    val name: String = "Emily Dayton",
    val title: String = "Tactical Field Specialist",
    val badge: String = "KSP-8821",
    val etaMinutes: Int = 4,
    val distanceKm: Double = 1.1,
    val rating: Double = 4.9,
    val verified: Boolean = true,
    val phone: String = "+91 94491 12233",
    val avatar: String = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    val skills: List<String> = listOf("Advanced Trauma", "First Aid", "Taser Certified"),
    val location: LatLng = LatLng(12.9362, 77.5368),
    val explanation: String = "",
    val score: Double = 0.0
)

data class SafetyHub(
    val id: String = "",
    val name: String = "",
    val shortName: String = "",
    val type: String = "hospital", // "hospital", "police", "safe_zone", "fire_rescue"
    val icon: String = "🏥",
    val category: String = "Emergency",
    val distanceMeters: Int = 0,
    val etaMins: Int = 5,
    val location: LatLng = LatLng(12.9352, 77.5358),
    val address: String = "",
    val phone: String = "112",
    val status: String = "OPEN 24/7",
    val openNow: Boolean = true,
    val openingHoursText: String = "Open 24 Hours",
    val isTraumaCenter: Boolean = false,
    val briefing: String = ""
)

data class IncidentBlock(
    val index: Int = 0,
    val prevHash: String = "0".repeat(64),
    val hash: String = "",
    val timestamp: String = "",
    val actorId: String = "",
    val actorRole: String = "system",
    val eventType: String = "",
    val payload: Map<String, Any> = emptyMap(),
    val tampered: Boolean = false
)

data class VerificationResult(
    val isValid: Boolean = true,
    val brokenIndex: Int? = null,
    val reason: String = "",
    val checkedCount: Int = 0
)
