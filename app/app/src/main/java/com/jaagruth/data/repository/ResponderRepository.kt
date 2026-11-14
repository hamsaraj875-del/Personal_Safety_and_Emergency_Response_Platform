package com.jaagruth.data.repository

import android.content.Context
import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.models.Responder
import com.jaagruth.data.remote.NetworkClient
import com.jaagruth.model.LatLng
import com.jaagruth.model.VerifiedResponder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

class ResponderRepository(private val context: Context? = null) {

    private val apiService by lazy {
        context?.let { NetworkClient.getApiService(it) }
    }

    suspend fun findNearbyRespondersServer(
        lat: Double,
        lng: Double,
        category: String? = null
    ): List<VerifiedResponder> = withContext(Dispatchers.IO) {
        if (apiService != null) {
            try {
                val res = apiService!!.getNearbyResponders(lat, lng, category, 10.0)
                if (res.isSuccessful && res.body() != null) {
                    return@withContext res.body()!!.responders
                }
            } catch (e: Exception) {
                // Network error, fallback
            }
        }
        emptyList()
    }

    /**
     * Smart Responder Matching Algorithm (Offline Fallback)
     */
    fun findBestResponder(
        userLat: Double,
        userLng: Double,
        preferredCategory: String? = null
    ): Pair<Responder?, List<Responder>> {
        val pool = MockDataSource.getAvailableResponders(userLat, userLng)

        // 1. Calculate distances & ETA for all responders
        val scoredList = pool.map { responder ->
            val distance = calculateDistanceMeters(userLat, userLng, responder.latitude, responder.longitude)
            val computedEtaMinutes = ((distance / 400.0) + (responder.historicalResponseMinutes * 0.4)).roundToInt().coerceAtLeast(1)

            responder.distanceMeters = distance
            responder.etaMinutes = computedEtaMinutes

            var score = 100.0

            if (!responder.isAvailable) {
                responder.score = -1.0
                responder.rankingReason = "Unavailable (Busy)"
                return@map responder
            }

            if (responder.isVerified) {
                score += 35.0
            } else {
                score -= 15.0
            }

            score -= (computedEtaMinutes * 5.0)

            when (responder.category) {
                "Security" -> score += 15.0
                "Medical" -> score += 15.0
                "Volunteer" -> score += 5.0
            }

            if (preferredCategory != null && responder.category.equals(preferredCategory, ignoreCase = true)) {
                score += 20.0
            }

            val historicalBonus = (10 - responder.historicalResponseMinutes).coerceIn(0, 10) * 1.5
            score += historicalBonus

            responder.score = score

            val reason = buildString {
                append("${responder.name} selected because ")
                if (responder.isVerified) append("they are verified, ")
                append("available, ")
                append("and have an estimated arrival time of $computedEtaMinutes minutes.")
            }
            responder.rankingReason = reason

            responder
        }

        val sortedAvailable = scoredList
            .filter { it.isAvailable }
            .sortedByDescending { it.score }

        val best = sortedAvailable.firstOrNull()
        return Pair(best, scoredList)
    }

    private fun calculateDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Int {
        val r = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return (r * c).roundToInt()
    }
}
