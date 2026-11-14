package com.jaagruth.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AuthRepository(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jaagruth_auth_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _isDemoMode = MutableStateFlow(true)
    val isDemoMode: StateFlow<Boolean> = _isDemoMode.asStateFlow()

    private val _isOfflineSimulated = MutableStateFlow(false)
    val isOfflineSimulated: StateFlow<Boolean> = _isOfflineSimulated.asStateFlow()

    private val _escalationSpeedFast = MutableStateFlow(true) // Fast: 10s, Normal: 60s
    val escalationSpeedFast: StateFlow<Boolean> = _escalationSpeedFast.asStateFlow()

    init {
        // Load persisted state or default to logged-in mock user
        val userJson = prefs.getString(KEY_USER, null)
        if (userJson != null) {
            try {
                _currentUser.value = gson.fromJson(userJson, User::class.java)
            } catch (e: Exception) {
                _currentUser.value = MockDataSource.defaultUser
            }
        } else {
            // By default, initialize with mock user for instant testability
            _currentUser.value = MockDataSource.defaultUser
            saveUser(MockDataSource.defaultUser)
        }

        _isDemoMode.value = prefs.getBoolean(KEY_DEMO_MODE, true)
        _isOfflineSimulated.value = prefs.getBoolean(KEY_OFFLINE, false)
        _escalationSpeedFast.value = prefs.getBoolean(KEY_SPEED_FAST, true)
    }

    fun login(emailOrPhone: String, password: String):Result<User> {
        if (emailOrPhone.isBlank() || password.isBlank()) {
            return Result.failure(IllegalArgumentException("Please enter your credentials."))
        }
        val user = MockDataSource.defaultUser.copy(
            name = if (emailOrPhone.contains("@")) emailOrPhone.substringBefore("@").replaceFirstChar { it.uppercase() } else "Manoj",
            phoneNumber = if (!emailOrPhone.contains("@")) emailOrPhone else MockDataSource.defaultUser.phoneNumber,
            email = if (emailOrPhone.contains("@")) emailOrPhone else MockDataSource.defaultUser.email
        )
        saveUser(user)
        return Result.success(user)
    }

    fun register(name: String, phone: String, email: String, password: String): Result<User> {
        if (name.isBlank() || phone.isBlank() || email.isBlank() || password.length < 4) {
            return Result.failure(IllegalArgumentException("Please fill in valid registration details."))
        }
        val user = User(
            id = "user_${System.currentTimeMillis() % 10000}",
            name = name,
            phoneNumber = phone,
            email = email
        )
        saveUser(user)
        return Result.success(user)
    }

    fun logout() {
        _currentUser.value = null
        prefs.edit().remove(KEY_USER).apply()
    }

    fun updateUser(user: User) {
        saveUser(user)
    }

    private fun saveUser(user: User) {
        _currentUser.value = user
        prefs.edit().putString(KEY_USER, gson.toJson(user)).apply()
    }

    fun setDemoMode(enabled: Boolean) {
        _isDemoMode.value = enabled
        prefs.edit().putBoolean(KEY_DEMO_MODE, enabled).apply()
    }

    fun setOfflineSimulated(enabled: Boolean) {
        _isOfflineSimulated.value = enabled
        prefs.edit().putBoolean(KEY_OFFLINE, enabled).apply()
    }

    fun setEscalationSpeedFast(isFast: Boolean) {
        _escalationSpeedFast.value = isFast
        prefs.edit().putBoolean(KEY_SPEED_FAST, isFast).apply()
    }

    companion object {
        private const val KEY_USER = "key_logged_user"
        private const val KEY_DEMO_MODE = "key_demo_mode"
        private const val KEY_OFFLINE = "key_offline_simulated"
        private const val KEY_SPEED_FAST = "key_escalation_speed_fast"
    }
}
