package com.jaagruth.viewmodel

import androidx.lifecycle.ViewModel
import com.jaagruth.data.models.User
import com.jaagruth.data.repository.AuthRepository
import com.jaagruth.data.repository.IncidentRepository
import kotlinx.coroutines.flow.StateFlow

class ProfileViewModel(
    private val authRepository: AuthRepository,
    private val incidentRepository: IncidentRepository
) : ViewModel() {

    val currentUser: StateFlow<User?> = authRepository.currentUser
    val isDemoMode: StateFlow<Boolean> = authRepository.isDemoMode
    val isOfflineSimulated: StateFlow<Boolean> = authRepository.isOfflineSimulated
    val escalationSpeedFast: StateFlow<Boolean> = authRepository.escalationSpeedFast

    fun setDemoMode(enabled: Boolean) {
        authRepository.setDemoMode(enabled)
    }

    fun setOfflineSimulated(enabled: Boolean) {
        authRepository.setOfflineSimulated(enabled)
        if (!enabled) {
            // When turning offline mode off, trigger sync
            incidentRepository.syncOfflineEvents()
        }
    }

    fun setEscalationSpeedFast(isFast: Boolean) {
        authRepository.setEscalationSpeedFast(isFast)
    }

    fun updateProfile(name: String, phone: String, email: String, bloodGroup: String, notes: String) {
        val current = currentUser.value ?: return
        val updated = current.copy(
            name = name,
            phoneNumber = phone,
            email = email,
            bloodGroup = bloodGroup,
            emergencyNotes = notes
        )
        authRepository.updateUser(updated)
    }

    fun logout() {
        authRepository.logout()
    }
}
