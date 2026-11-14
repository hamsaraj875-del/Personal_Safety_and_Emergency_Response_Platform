package com.jaagruth.data.models

enum class IncidentStatus(val displayName: String) {
    TRIGGERED("SOS Triggered"),
    NOTIFYING("Alerting Contacts"),
    ACKNOWLEDGED("Contact Notified"),
    RESPONDER_ASSIGNED("Responder Assigned"),
    EN_ROUTE("Help is on the Way"),
    ON_SCENE("On Scene"),
    RESOLVED("Resolved"),
    FALSE_ALARM("False Alarm")
}
