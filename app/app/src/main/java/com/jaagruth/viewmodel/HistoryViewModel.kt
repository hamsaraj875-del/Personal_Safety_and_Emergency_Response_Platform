package com.jaagruth.viewmodel

import androidx.lifecycle.ViewModel
import com.jaagruth.data.models.Incident
import com.jaagruth.data.repository.IncidentRepository
import kotlinx.coroutines.flow.StateFlow

class HistoryViewModel(private val incidentRepository: IncidentRepository) : ViewModel() {

    val history: StateFlow<List<Incident>> = incidentRepository.history

    fun getIncidentById(incidentId: String): Incident? {
        return history.value.find { it.id == incidentId }
    }

    fun verifyIncidentRecord(incidentId: String): Boolean {
        // TODO: Replace mock verification with server-side hash-chain verification.
        return incidentRepository.verifyIncidentRecord(incidentId)
    }
}
