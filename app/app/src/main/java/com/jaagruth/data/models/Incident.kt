package com.jaagruth.data.models

data class Incident(
    val id: String,
    val userId: String,
    val userName: String,
    val userPhone: String,
    var latitude: Double,
    var longitude: Double,
    var locationAddress: String,
    var status: IncidentStatus = IncidentStatus.TRIGGERED,
    val createdAt: Long = System.currentTimeMillis(),
    var resolvedAt: Long? = null,
    var assignedResponder: Responder? = null,
    val events: MutableList<IncidentEvent> = mutableListOf(),
    var isOffline: Boolean = false,
    var isSynced: Boolean = true
) {
    val durationFormatted: String
        get() {
            val end = resolvedAt ?: System.currentTimeMillis()
            val seconds = ((end - createdAt) / 1000).coerceAtLeast(0)
            val mins = seconds / 60
            val secs = seconds % 60
            return String.format("%02d:%02d", mins, secs)
        }
}
