package com.jaagruth.viewmodel

import androidx.lifecycle.ViewModel
import com.jaagruth.data.models.User
import com.jaagruth.data.repository.AuthRepository
import kotlinx.coroutines.flow.StateFlow

class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {

    val currentUser: StateFlow<User?> = authRepository.currentUser
    val isDemoMode: StateFlow<Boolean> = authRepository.isDemoMode
    val isOfflineSimulated: StateFlow<Boolean> = authRepository.isOfflineSimulated

    fun login(emailOrPhone: String, password: String): Result<User> {
        return authRepository.login(emailOrPhone, password)
    }

    fun register(name: String, phone: String, email: String, password: String): Result<User> {
        return authRepository.register(name, phone, email, password)
    }

    fun logout() {
        authRepository.logout()
    }
}
