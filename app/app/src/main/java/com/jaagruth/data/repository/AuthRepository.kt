package com.jaagruth.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.User
import com.jaagruth.data.remote.LoginRequest
import com.jaagruth.data.remote.NetworkClient
import com.jaagruth.data.remote.RegisterRequest
import com.jaagruth.data.remote.TokenStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.runBlocking

class AuthRepository(private val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("jaagruth_auth_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()
    private val apiService by lazy { NetworkClient.getApiService(context) }

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

        if (!_isOfflineSimulated.value) {
            try {
                val res = runBlocking(Dispatchers.IO) {
                    apiService.login(LoginRequest(emailOrPhone = emailOrPhone.trim(), password = password.trim()))
                }
                if (res.isSuccessful && res.body() != null) {
                    val auth = res.body()!!
                    TokenStore.saveToken(auth.token)
                    TokenStore.saveUser(auth.user.id, auth.user.name, auth.user.phone)

                    val user = User(
                        id = auth.user.id,
                        name = auth.user.name,
                        phoneNumber = auth.user.phone,
                        email = auth.user.email
                    )
                    saveUser(user)
                    return Result.success(user)
                }
            } catch (e: Exception) {
                // Fallback to local on network error
            }
        }

        // Local fallback
        val user = MockDataSource.defaultUser.copy(
            name = if (emailOrPhone.contains("@")) emailOrPhone.substringBefore("@").replaceFirstChar { it.uppercase() } else "Citizen User",
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

        if (!_isOfflineSimulated.value) {
            try {
                val res = runBlocking(Dispatchers.IO) {
                    apiService.register(
                        RegisterRequest(
                            name = name.trim(),
                            phone = phone.trim(),
                            email = email.trim(),
                            password = password.trim()
                        )
                    )
                }
                if (res.isSuccessful && res.body() != null) {
                    val auth = res.body()!!
                    TokenStore.saveToken(auth.token)
                    TokenStore.saveUser(auth.user.id, auth.user.name, auth.user.phone)

                    val user = User(
                        id = auth.user.id,
                        name = auth.user.name,
                        phoneNumber = auth.user.phone,
                        email = auth.user.email
                    )
                    saveUser(user)
                    return Result.success(user)
                }
            } catch (e: Exception) {
                // Fallback to local
            }
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
        TokenStore.clear()
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
