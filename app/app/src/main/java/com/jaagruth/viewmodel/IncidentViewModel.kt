package com.jaagruth.viewmodel

import androidx.lifecycle.ViewModel
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.Incident
import com.jaagruth.data.models.IncidentStatus
import com.jaagruth.data.models.User
import com.jaagruth.data.repository.AuthRepository
import com.jaagruth.data.repository.IncidentRepository
import com.jaagruth.services.EscalationEngine
import com.jaagruth.services.EscalationState
import com.jaagruth.services.LocationService
import com.jaagruth.services.SmsCallService
import kotlinx.coroutines.flow.StateFlow

class IncidentViewModel(
    private val incidentRepository: IncidentRepository,
    private val authRepository: AuthRepository,
    private val escalationEngine: EscalationEngine,
    private val locationService: LocationService,
    private val smsCallService: SmsCallService
) : ViewModel() {

    val activeIncident: StateFlow<Incident?> = incidentRepository.activeIncident
    val escalationState: StateFlow<EscalationState> = escalationEngine.escalationState
    val isDemoMode: StateFlow<Boolean> = authRepository.isDemoMode
    val isOffline: StateFlow<Boolean> = authRepository.isOfflineSimulated

    fun onCountdownFinished(): Incident {
        val user = authRepository.currentUser.value ?: MockDataSource.defaultUser
        val loc = locationService.locationState.value
        val isOfflineSim = authRepository.isOfflineSimulated.value

        locationService.startEmergencyTracking()

        val incident = incidentRepository.createIncident(
            user = user,
            latitude = loc.latitude,
            longitude = loc.longitude,
            address = loc.address,
            isOffline = isOfflineSim
        )

        val fastMode = authRepository.escalationSpeedFast.value
        escalationEngine.startEscalation(incident, fastMode = fastMode)

        return incident
    }

    fun cancelActiveIncident(asFalseAlarm: Boolean = true) {
        escalationEngine.stopEscalation()
        locationService.stopEmergencyTracking()
        incidentRepository.cancelActiveIncident(asFalseAlarm = asFalseAlarm)
    }

    fun callEmergency112() {
        smsCallService.dialEmergency112()
    }

    // Demo actions
    fun demoContactAcknowledges() = escalationEngine.demoContactAcknowledges()
    fun demoResponderAccepts() = escalationEngine.demoResponderAccepts()
    fun demoSimulateResponderArrival() = escalationEngine.demoSimulateResponderArrival()
    fun demoMarkResolved() {
        escalationEngine.demoMarkResolved()
        locationService.stopEmergencyTracking()
    }
    fun demoResetIncident() {
        escalationEngine.demoResetIncident()
        locationService.stopEmergencyTracking()
    }
}
