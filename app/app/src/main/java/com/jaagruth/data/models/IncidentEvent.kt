package com.jaagruth.data.models

data class IncidentEvent(
    val id: String,
    val incidentId: String,
    val title: String,
    val description: String,
    val timestamp: Long = System.currentTimeMillis(),
    val status: IncidentStatus,
    val isOffline: Boolean = false
)
