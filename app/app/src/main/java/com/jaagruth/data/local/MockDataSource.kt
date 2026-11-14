package com.jaagruth.data.local

import com.jaagruth.data.models.Contact
import com.jaagruth.data.models.Incident
import com.jaagruth.data.models.IncidentEvent
import com.jaagruth.data.models.IncidentStatus
import com.jaagruth.data.models.Responder
import com.jaagruth.data.models.User

object MockDataSource {

    const val DEFAULT_LATITUDE = 12.9716
    const val DEFAULT_LONGITUDE = 77.5946
    const val DEFAULT_ADDRESS = "Cubbon Park, Bengaluru, Karnataka"

    val defaultUser = User(
        id = "user_001",
        name = "Manoj Kumar",
        phoneNumber = "+91 98765 43210",
        email = "manoj.k@example.com",
        bloodGroup = "O+",
        emergencyNotes = "No known drug allergies. Carries inhaler.",
        safetyPin = "1234"
    )

    fun getInitialContacts(): List<Contact> = listOf(
        Contact(
            id = "c_01",
            name = "Ananya",
            phoneNumber = "+91 98765 11111",
            relationship = "Sister",
            priority = 1,
            consentGiven = true
        ),
        Contact(
            id = "c_02",
            name = "Rahul",
            phoneNumber = "+91 98765 22222",
            relationship = "Friend",
            priority = 2,
            consentGiven = true
        ),
        Contact(
            id = "c_03",
            name = "Mom",
            phoneNumber = "+91 98765 33333",
            relationship = "Family",
            priority = 3,
            consentGiven = true
        )
    )

    fun getAvailableResponders(userLat: Double = DEFAULT_LATITUDE, userLng: Double = DEFAULT_LONGITUDE): List<Responder> = listOf(
        Responder(
            id = "resp_01",
            name = "Ravi Kumar",
            category = "Security",
            latitude = userLat + 0.0035, // ~400m
            longitude = userLng + 0.0025,
            isVerified = true,
            isAvailable = true,
            historicalResponseMinutes = 3,
            phone = "+91 98111 22233"
        ),
        Responder(
            id = "resp_02",
            name = "Dr. Meera",
            category = "Medical",
            latitude = userLat + 0.0090, // ~1.2km
            longitude = userLng - 0.0070,
            isVerified = true,
            isAvailable = true,
            historicalResponseMinutes = 4,
            phone = "+91 98222 33344"
        ),
        Responder(
            id = "resp_03",
            name = "Sana",
            category = "Volunteer",
            latitude = userLat + 0.0020, // ~250m
            longitude = userLng + 0.0015,
            isVerified = false,
            isAvailable = true,
            historicalResponseMinutes = 5,
            phone = "+91 98333 44455"
        ),
        Responder(
            id = "resp_04",
            name = "Arjun",
            category = "Security",
            latitude = userLat - 0.0150, // ~2.0km
            longitude = userLng + 0.0120,
            isVerified = true,
            isAvailable = false,
            historicalResponseMinutes = 8,
            phone = "+91 98444 55566"
        ),
        Responder(
            id = "resp_05",
            name = "Priya",
            category = "Medical",
            latitude = userLat - 0.0060, // ~800m
            longitude = userLng + 0.0050,
            isVerified = true,
            isAvailable = true,
            historicalResponseMinutes = 6,
            phone = "+91 98555 66677"
        )
    )

    fun getInitialHistoricalIncidents(): List<Incident> {
        val now = System.currentTimeMillis()
        val oneHour = 3600 * 1000L
        val oneDay = 24 * oneHour

        val inc1 = Incident(
            id = "INC-2026-1042",
            userId = defaultUser.id,
            userName = defaultUser.name,
            userPhone = defaultUser.phoneNumber,
            latitude = 12.9750,
            longitude = 77.6050,
            locationAddress = "MG Road Metro Station, Bengaluru",
            status = IncidentStatus.RESOLVED,
            createdAt = now - (2 * oneDay + 3 * oneHour),
            resolvedAt = now - (2 * oneDay + 3 * oneHour - 272 * 1000L), // 4 mins 32 sec
            assignedResponder = Responder(
                id = "resp_01",
                name = "Ravi Kumar",
                category = "Security",
                latitude = 12.9752,
                longitude = 77.6052,
                isVerified = true,
                isAvailable = true,
                historicalResponseMinutes = 3,
                phone = "+91 98111 22233"
            ),
            isOffline = false,
            isSynced = true
        ).apply {
            events.addAll(
                listOf(
                    IncidentEvent("e1", id, "SOS Triggered", "Emergency button held for 2s", createdAt, IncidentStatus.TRIGGERED),
                    IncidentEvent("e2", id, "Contact 1 Notified", "Ananya notified via alert system", createdAt + 2000, IncidentStatus.NOTIFYING),
                    IncidentEvent("e3", id, "Contact Acknowledged", "Ananya acknowledged emergency", createdAt + 12000, IncidentStatus.ACKNOWLEDGED),
                    IncidentEvent("e4", id, "Responder Assigned", "Ravi Kumar (Security) assigned via smart matching", createdAt + 15000, IncidentStatus.RESPONDER_ASSIGNED),
                    IncidentEvent("e5", id, "Responder En Route", "Ravi Kumar moving toward scene", createdAt + 22000, IncidentStatus.EN_ROUTE),
                    IncidentEvent("e6", id, "Responder On Scene", "Ravi Kumar arrived on scene", createdAt + 190000, IncidentStatus.ON_SCENE),
                    IncidentEvent("e7", id, "Incident Resolved", "Assistance rendered and verified safe", resolvedAt!!, IncidentStatus.RESOLVED)
                )
            )
        }

        val inc2 = Incident(
            id = "INC-2026-0921",
            userId = defaultUser.id,
            userName = defaultUser.name,
            userPhone = defaultUser.phoneNumber,
            latitude = 12.9784,
            longitude = 77.6408,
            locationAddress = "100ft Road, Indiranagar, Bengaluru",
            status = IncidentStatus.FALSE_ALARM,
            createdAt = now - (7 * oneDay + 5 * oneHour),
            resolvedAt = now - (7 * oneDay + 5 * oneHour - 45 * 1000L), // 45 sec
            isOffline = false,
            isSynced = true
        ).apply {
            events.addAll(
                listOf(
                    IncidentEvent("e21", id, "SOS Triggered", "SOS activated from lockscreen widget", createdAt, IncidentStatus.TRIGGERED),
                    IncidentEvent("e22", id, "False Alarm Cancelled", "User reported accidental activation", resolvedAt!!, IncidentStatus.FALSE_ALARM)
                )
            )
        }

        val inc3 = Incident(
            id = "INC-2026-0814",
            userId = defaultUser.id,
            userName = defaultUser.name,
            userPhone = defaultUser.phoneNumber,
            latitude = 12.9352,
            longitude = 77.6245,
            locationAddress = "80ft Road, Koramangala 4th Block, Bengaluru",
            status = IncidentStatus.RESOLVED,
            createdAt = now - (21 * oneDay),
            resolvedAt = now - (21 * oneDay - 72 * 1000L), // 1 min 12 sec
            isOffline = true,
            isSynced = true
        ).apply {
            events.addAll(
                listOf(
                    IncidentEvent("e31", id, "SOS Triggered (Offline)", "SOS initiated without data connectivity", createdAt, IncidentStatus.TRIGGERED, isOffline = true),
                    IncidentEvent("e32", id, "SMS Handoff Prepared", "Emergency SMS generated for primary contact", createdAt + 3000, IncidentStatus.NOTIFYING, isOffline = true),
                    IncidentEvent("e33", id, "Local Resolution", "User marked safe before responder arrival", resolvedAt!!, IncidentStatus.RESOLVED, isOffline = true)
                )
            )
        }

        return listOf(inc1, inc2, inc3)
    }
}
