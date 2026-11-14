package com.jaagruth.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.Incident
import com.jaagruth.data.models.IncidentStatus
import com.jaagruth.data.models.Responder
import com.jaagruth.data.repository.IncidentRepository
import com.jaagruth.data.repository.ResponderRepository
import com.jaagruth.services.EscalationEngine
import com.jaagruth.services.SmsCallService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.osmdroid.util.GeoPoint
import kotlin.math.roundToInt

data class TrackingState(
    val userGeoPoint: GeoPoint = GeoPoint(MockDataSource.DEFAULT_LATITUDE, MockDataSource.DEFAULT_LONGITUDE),
    val responderGeoPoint: GeoPoint = GeoPoint(MockDataSource.DEFAULT_LATITUDE + 0.0035, MockDataSource.DEFAULT_LONGITUDE + 0.0025),
    val responder: Responder? = null,
    val distanceMeters: Int = 400,
    val etaMinutes: Int = 3,
    val isArrived: Boolean = false,
    val isSimulationRunning: Boolean = false
)

class TrackingViewModel(
    private val incidentRepository: IncidentRepository,
    private val responderRepository: ResponderRepository,
    private val escalationEngine: EscalationEngine,
    private val smsCallService: SmsCallService
) : ViewModel() {

    private val _trackingState = MutableStateFlow(TrackingState())
    val trackingState: StateFlow<TrackingState> = _trackingState.asStateFlow()

    private var simulationJob: Job? = null

    init {
        initializeTracking()
    }

    private fun initializeTracking() {
        val incident = incidentRepository.activeIncident.value
        val userLat = incident?.latitude ?: MockDataSource.DEFAULT_LATITUDE
        val userLng = incident?.longitude ?: MockDataSource.DEFAULT_LONGITUDE
        val userPoint = GeoPoint(userLat, userLng)

        val responder = incident?.assignedResponder ?: responderRepository.findBestResponder(userLat, userLng).first
        ?: MockDataSource.getAvailableResponders(userLat, userLng).first()

        val respPoint = GeoPoint(responder.latitude, responder.longitude)

        _trackingState.value = TrackingState(
            userGeoPoint = userPoint,
            responderGeoPoint = respPoint,
            responder = responder,
            distanceMeters = responder.distanceMeters.coerceAtLeast(400),
            etaMinutes = responder.etaMinutes.coerceAtLeast(3)
        )

        startResponderMovementSimulation()
    }

    fun startResponderMovementSimulation() {
        simulationJob?.cancel()
        simulationJob = viewModelScope.launch {
            _trackingState.value = _trackingState.value.copy(isSimulationRunning = true)

            while (isActive) {
                delay(2000L) // Move every 2 seconds

                val current = _trackingState.value
                val userPoint = current.userGeoPoint
                val respPoint = current.responderGeoPoint

                val dLat = userPoint.latitude - respPoint.latitude
                val dLng = userPoint.longitude - respPoint.longitude

                // Calculate distance
                val currentDist = (current.distanceMeters * 0.75).roundToInt()
                val currentEta = ((currentDist / 400.0) * 1.5).roundToInt().coerceAtLeast(1)

                if (currentDist <= 40) {
                    // Arrived on scene
                    _trackingState.value = current.copy(
                        responderGeoPoint = userPoint,
                        distanceMeters = 0,
                        etaMinutes = 0,
                        isArrived = true,
                        isSimulationRunning = false
                    )
                    escalationEngine.demoSimulateResponderArrival()
                    break
                } else {
                    // Move 25% closer towards user
                    val newLat = respPoint.latitude + (dLat * 0.25)
                    val newLng = respPoint.longitude + (dLng * 0.25)

                    _trackingState.value = current.copy(
                        responderGeoPoint = GeoPoint(newLat, newLng),
                        distanceMeters = currentDist,
                        etaMinutes = currentEta
                    )
                }
            }
        }
    }

    fun callResponder() {
        val phone = _trackingState.value.responder?.phone ?: "+91 98111 22233"
        smsCallService.dialNumber(phone)
    }

    fun messageResponder() {
        val phone = _trackingState.value.responder?.phone ?: "+91 98111 22233"
        val inc = incidentRepository.activeIncident.value
        smsCallService.prepareEmergencySms(
            phoneNumber = phone,
            userName = inc?.userName ?: "Manoj",
            latitude = _trackingState.value.userGeoPoint.latitude,
            longitude = _trackingState.value.userGeoPoint.longitude,
            incidentId = inc?.id ?: "INC-2026"
        )
    }

    override fun onCleared() {
        super.onCleared()
        simulationJob?.cancel()
    }
}
