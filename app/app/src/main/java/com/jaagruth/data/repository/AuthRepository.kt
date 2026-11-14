package com.jaagruth.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.User
import com.jaagruth.data.remote.LoginRequest
import com.jaagruth.data.remote.NetworkClient
import com.jaagruth.data.remote.RegisterRequest
import com.jaagruth.data.remote.TokenStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthRepository(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jaagruth_auth_prefs", Context.MODE_PRIVATE)
    private val gson = NetworkClient.gson
    private val apiService by lazy { NetworkClient.getApiService(context) }
    private val repoScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _isDemoMode = MutableStateFlow(true)
    val isDemoMode: StateFlow<Boolean> = _isDemoMode.asStateFlow()

    private val _isOfflineSimulated = MutableStateFlow(false)
    val isOfflineSimulated: StateFlow<Boolean> = _isOfflineSimulated.asStateFlow()

    private val _escalationSpeedFast = MutableStateFlow(true)
    val escalationSpeedFast: StateFlow<Boolean> = _escalationSpeedFast.asStateFlow()

    init {
        TokenStore.init(context)

        val userJson = prefs.getString(KEY_USER, null)
        if (userJson != null) {
            try {
                _currentUser.value = gson.fromJson(userJson, User::class.java)
            } catch (e: Exception) {
                _currentUser.value = MockDataSource.defaultUser
            }
        } else {
            _currentUser.value = MockDataSource.defaultUser
            saveUser(MockDataSource.defaultUser)
        }

        _isDemoMode.value = prefs.getBoolean(KEY_DEMO_MODE, true)
        _isOfflineSimulated.value = prefs.getBoolean(KEY_OFFLINE, false)
        _escalationSpeedFast.value = prefs.getBoolean(KEY_SPEED_FAST, true)
    }

    fun login(emailOrPhone: String, password: String): Result<User> {
        if (emailOrPhone.isBlank() || password.isBlank()) {
            return Result.failure(IllegalArgumentException("Please enter your credentials."))
        }

        val localUser = MockDataSource.defaultUser.copy(
            name = if (emailOrPhone.contains("@")) emailOrPhone.substringBefore("@").replaceFirstChar { it.uppercase() } else "Citizen User",
            phoneNumber = if (!emailOrPhone.contains("@")) emailOrPhone else MockDataSource.defaultUser.phoneNumber,
            email = if (emailOrPhone.contains("@")) emailOrPhone else MockDataSource.defaultUser.email
        )
        saveUser(localUser)

        if (!_isOfflineSimulated.value) {
            repoScope.launch {
                try {
                    val res = apiService.login(LoginRequest(emailOrPhone = emailOrPhone.trim(), password = password.trim()))
                    if (res.isSuccessful && res.body() != null) {
                        val auth = res.body()!!
                        TokenStore.saveToken(auth.token)
                        TokenStore.saveUser(auth.user.id, auth.user.name, auth.user.phone)

                        val serverUser = User(
                            id = auth.user.id,
                            name = auth.user.name,
                            phoneNumber = auth.user.phone,
                            email = auth.user.email
                        )
                        saveUser(serverUser)
                    }
                } catch (e: Exception) {
                    // Local fallback preserved
                }
            }
        }

        return Result.success(localUser)
    }

    fun register(name: String, phone: String, email: String, password: String): Result<User> {
        if (name.isBlank() || phone.isBlank() || email.isBlank() || password.length < 4) {
            return Result.failure(IllegalArgumentException("Please fill in valid registration details."))
        }

        val localUser = User(
            id = "usr_${System.currentTimeMillis()}",
            name = name.trim(),
            phoneNumber = phone.trim(),
            email = email.trim()
        )
        saveUser(localUser)

        if (!_isOfflineSimulated.value) {
            repoScope.launch {
                try {
                    val res = apiService.register(
                        RegisterRequest(
                            name = name.trim(),
                            phone = phone.trim(),
                            email = email.trim(),
                            password = password.trim()
                        )
                    )
                    if (res.isSuccessful && res.body() != null) {
                        val auth = res.body()!!
                        TokenStore.saveToken(auth.token)
                        TokenStore.saveUser(auth.user.id, auth.user.name, auth.user.phone)
                        val serverUser = User(
                            id = auth.user.id,
                            name = auth.user.name,
                            phoneNumber = auth.user.phone,
                            email = auth.user.email
                        )
                        saveUser(serverUser)
                    }
                } catch (e: Exception) {
                    // Local fallback preserved
                }
            }
        }

        return Result.success(localUser)
    }

    fun logout() {
        TokenStore.clear()
        _currentUser.value = MockDataSource.defaultUser
        saveUser(MockDataSource.defaultUser)
    }

    fun setDemoMode(isDemo: Boolean) {
        _isDemoMode.value = isDemo
        prefs.edit().putBoolean(KEY_DEMO_MODE, isDemo).apply()
    }

    fun setOfflineSimulated(isOffline: Boolean) {
        _isOfflineSimulated.value = isOffline
        prefs.edit().putBoolean(KEY_OFFLINE, isOffline).apply()
    }

    fun setEscalationSpeedFast(isFast: Boolean) {
        _escalationSpeedFast.value = isFast
        prefs.edit().putBoolean(KEY_SPEED_FAST, isFast).apply()
    }

    fun updateSafetyPin(pin: String): Boolean {
        if (pin.length == 4 && pin.all { it.isDigit() }) {
            prefs.edit().putString(KEY_SAFETY_PIN, pin).apply()
            return true
        }
        return false
    }

    fun updateDuressPin(pin: String): Boolean {
        if (pin.length == 4 && pin.all { it.isDigit() }) {
            prefs.edit().putString(KEY_DURESS_PIN, pin).apply()
            return true
        }
        return false
    }

    fun getSafetyPin(): String = prefs.getString(KEY_SAFETY_PIN, "1234") ?: "1234"
    fun getDuressPin(): String = prefs.getString(KEY_DURESS_PIN, "9999") ?: "9999"

    private fun saveUser(user: User) {
        _currentUser.value = user
        prefs.edit().putString(KEY_USER, gson.toJson(user)).apply()
    }

    companion object {
        private const val KEY_USER = "key_logged_user"
        private const val KEY_DEMO_MODE = "key_demo_mode"
        private const val KEY_OFFLINE = "key_offline_simulated"
        private const val KEY_SPEED_FAST = "key_speed_fast"
        private const val KEY_SAFETY_PIN = "key_safety_pin"
        private const val KEY_DURESS_PIN = "key_duress_pin"
    }
}
