package com.jaagruth.data.remote

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object TokenStore {
    private const val PREF_FILE = "jaagruth_secure_prefs"
    private const val KEY_JWT = "jwt_token"
    private const val KEY_USER_ID = "user_id"
    private const val KEY_USER_PHONE = "user_phone"
    private const val KEY_USER_NAME = "user_name"

    private var prefs: SharedPreferences? = null

    fun init(context: Context) {
        if (prefs == null) {
            try {
                val masterKey = MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build()

                prefs = EncryptedSharedPreferences.create(
                    context,
                    PREF_FILE,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                )
            } catch (e: Exception) {
                // Fallback to standard private preferences if keystore is unavailable (e.g. older emulators)
                prefs = context.getSharedPreferences(PREF_FILE, Context.MODE_PRIVATE)
            }
        }
    }

    fun saveToken(token: String) {
        prefs?.edit()?.putString(KEY_JWT, token)?.apply()
    }

    fun getToken(): String? {
        return prefs?.getString(KEY_JWT, null)
    }

    fun saveUser(id: String, name: String, phone: String) {
        prefs?.edit()
            ?.putString(KEY_USER_ID, id)
            ?.putString(KEY_USER_NAME, name)
            ?.putString(KEY_USER_PHONE, phone)
            ?.apply()
    }

    fun getUserId(): String? = prefs?.getString(KEY_USER_ID, null)
    fun getUserName(): String? = prefs?.getString(KEY_USER_NAME, null)
    fun getUserPhone(): String? = prefs?.getString(KEY_USER_PHONE, null)

    fun clear() {
        prefs?.edit()?.clear()?.apply()
    }
}
