package com.jaagruth.viewmodel

import androidx.lifecycle.ViewModel
import com.jaagruth.data.models.Contact
import com.jaagruth.data.models.Incident
import com.jaagruth.data.models.User
import com.jaagruth.data.repository.AuthRepository
import com.jaagruth.data.repository.ContactRepository
import com.jaagruth.data.repository.IncidentRepository
import com.jaagruth.services.LocationService
import kotlinx.coroutines.flow.StateFlow

class HomeViewModel(
    private val authRepository: AuthRepository,
    private val contactRepository: ContactRepository,
    private val incidentRepository: IncidentRepository,
    private val locationService: LocationService
) : ViewModel() {

    val currentUser: StateFlow<User?> = authRepository.currentUser
    val contacts: StateFlow<List<Contact>> = contactRepository.contacts
    val activeIncident: StateFlow<Incident?> = incidentRepository.activeIncident
    val locationState: StateFlow<LocationService.LocationState> = locationService.locationState
    val isOffline: StateFlow<Boolean> = authRepository.isOfflineSimulated

    fun refreshLocation() {
        locationService.refreshCurrentLocation()
    }
}
