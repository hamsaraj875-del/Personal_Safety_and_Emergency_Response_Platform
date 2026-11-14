package com.jaagruth.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.Incident
import com.jaagruth.data.models.IncidentEvent
import com.jaagruth.data.models.IncidentStatus
import com.jaagruth.data.models.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class IncidentRepository(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jaagruth_incident_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    private val _activeIncident = MutableStateFlow<Incident?>(null)
    val activeIncident: StateFlow<Incident?> = _activeIncident.asStateFlow()

    private val _history = MutableStateFlow<List<Incident>>(emptyList())
    val history: StateFlow<List<Incident>> = _history.asStateFlow()

    init {
        loadHistory()
    }

    private fun loadHistory() {
        val json = prefs.getString(KEY_HISTORY, null)
        if (json != null) {
            try {
                val type = object : TypeToken<List<Incident>>() {}.type
                val list: List<Incident> = gson.fromJson(json, type)
                _history.value = list
            } catch (e: Exception) {
                _history.value = MockDataSource.getInitialHistoricalIncidents()
                saveHistory(_history.value)
            }
        } else {
            _history.value = MockDataSource.getInitialHistoricalIncidents()
            saveHistory(_history.value)
        }
    }

    fun createIncident(
        user: User,
        latitude: Double,
        longitude: Double,
        address: String,
        isOffline: Boolean
    ): Incident {
        val existing = _activeIncident.value
        if (existing != null && existing.status != IncidentStatus.RESOLVED && existing.status != IncidentStatus.FALSE_ALARM) {
            return existing
        }

        val incidentId = "INC-${System.currentTimeMillis() % 10000}"
        val incident = Incident(
            id = incidentId,
            userId = user.id,
            userName = user.name,
            userPhone = user.phoneNumber,
            latitude = latitude,
            longitude = longitude,
            locationAddress = address,
            status = IncidentStatus.TRIGGERED,
            createdAt = System.currentTimeMillis(),
            isOffline = isOffline,
            isSynced = !isOffline
        )

        incident.events.add(
            IncidentEvent(
                id = "evt_${System.currentTimeMillis()}",
                incidentId = incidentId,
                title = if (isOffline) "SOS Triggered (Offline)" else "SOS Triggered",
                description = "Emergency SOS button triggered by user",
                status = IncidentStatus.TRIGGERED,
                isOffline = isOffline
            )
        )

        _activeIncident.value = incident
        return incident
    }

    fun addEvent(title: String, description: String, status: IncidentStatus, isOffline: Boolean = false) {
        val current = _activeIncident.value ?: return
        val event = IncidentEvent(
            id = "evt_${System.currentTimeMillis()}",
            incidentId = current.id,
            title = title,
            description = description,
            status = status,
            isOffline = isOffline
        )
        current.events.add(0, event) // Latest first
        current.status = status
        _activeIncident.value = current.copy()
    }

    fun updateStatus(status: IncidentStatus) {
        val current = _activeIncident.value ?: return
        current.status = status
        if (status == IncidentStatus.RESOLVED || status == IncidentStatus.FALSE_ALARM) {
            current.resolvedAt = System.currentTimeMillis()
            archiveIncident(current)
            _activeIncident.value = null
        } else {
            _activeIncident.value = current.copy()
        }
    }

    fun cancelActiveIncident(asFalseAlarm: Boolean = true) {
        val current = _activeIncident.value ?: return
        val finalStatus = if (asFalseAlarm) IncidentStatus.FALSE_ALARM else IncidentStatus.RESOLVED
        val title = if (asFalseAlarm) "Cancelled (False Alarm)" else "Marked Safe / Resolved"
        val desc = "User reported safe and cancelled emergency response."
        addEvent(title, desc, finalStatus, current.isOffline)
        updateStatus(finalStatus)
    }

    private fun archiveIncident(incident: Incident) {
        val currentList = _history.value.toMutableList()
        currentList.removeAll { it.id == incident.id }
        currentList.add(0, incident) // Most recent first
        saveHistory(currentList)
    }

    private fun saveHistory(list: List<Incident>) {
        _history.value = list
        prefs.edit().putString(KEY_HISTORY, gson.toJson(list)).apply()
    }

    fun syncOfflineEvents() {
        val historyList = _history.value.map { incident ->
            if (!incident.isSynced) {
                incident.copy(isSynced = true)
            } else {
                incident
            }
        }
        saveHistory(historyList)

        _activeIncident.value?.let { active ->
            if (!active.isSynced) {
                active.isSynced = true
                _activeIncident.value = active.copy()
            }
        }
    }

    /**
     * Simulates cryptographic / server-side verification of incident records.
     * // TODO: Replace mock verification with server-side hash-chain verification.
     */
    fun verifyIncidentRecord(incidentId: String): Boolean {
        // TODO: Replace mock verification with server-side hash-chain verification.
        val incident = _history.value.find { it.id == incidentId }
        return incident != null && incident.events.isNotEmpty()
    }

    companion object {
        private const val KEY_HISTORY = "key_incident_history"
    }
}
