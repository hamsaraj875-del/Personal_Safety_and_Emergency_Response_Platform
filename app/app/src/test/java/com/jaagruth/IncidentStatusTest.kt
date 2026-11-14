package com.jaagruth

import com.jaagruth.data.models.Incident
import com.jaagruth.data.models.IncidentEvent
import com.jaagruth.data.models.IncidentStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class IncidentStatusTest {

    @Test
    fun testIncidentDurationFormatting() {
        val now = 1700000000000L
        val resolved = now + (4 * 60 + 32) * 1000L // 4m 32s

        val incident = Incident(
            id = "INC-TEST-01",
            userId = "user_01",
            userName = "Test User",
            userPhone = "9999999999",
            latitude = 12.97,
            longitude = 77.59,
            locationAddress = "Test Location",
            status = IncidentStatus.RESOLVED,
            createdAt = now,
            resolvedAt = resolved
        )

        assertEquals("04:32", incident.durationFormatted)
    }

    @Test
    fun testIncidentStatusTransitions() {
        val incident = Incident(
            id = "INC-TEST-02",
            userId = "user_01",
            userName = "Test User",
            userPhone = "9999999999",
            latitude = 12.97,
            longitude = 77.59,
            locationAddress = "Test Location"
        )

        assertEquals(IncidentStatus.TRIGGERED, incident.status)

        incident.status = IncidentStatus.NOTIFYING
        incident.events.add(IncidentEvent("e1", incident.id, "Notifying", "Notifying Contact 1", System.currentTimeMillis(), IncidentStatus.NOTIFYING))
        assertEquals(IncidentStatus.NOTIFYING, incident.status)
        assertTrue(incident.events.size == 1)
    }
}
