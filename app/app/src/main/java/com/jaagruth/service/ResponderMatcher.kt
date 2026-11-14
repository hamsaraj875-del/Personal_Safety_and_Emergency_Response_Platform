package com.jaagruth.service

import com.jaagruth.model.LatLng
import com.jaagruth.model.VerifiedResponder
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

object ResponderMatcher {

    fun calculateHaversineDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0 // Radius of Earth in km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }

    fun rankResponders(
        userCoords: LatLng,
        category: String,
        responders: List<VerifiedResponder>
    ): List<VerifiedResponder> {
        val maxDistanceKm = 10.0
        val wProximity = 0.40
        val wSkill = 0.30
        val wAvailability = 0.15
        val wRating = 0.15

        return responders.map { resp ->
            val distanceKm = calculateHaversineDistance(
                userCoords.lat,
                userCoords.lng,
                resp.location.lat,
                resp.location.lng
            )
            val proximityScore = maxOf(0.0, 1.0 - (distanceKm / maxDistanceKm))
            val etaMins = maxOf(1, Math.round(distanceKm * 2.4 + 1).toInt())

            var skillScore = 0.5
            val catLower = category.lowercase()
            if (catLower.contains("med") && resp.skills.any {
                    it.lowercase().contains("aid") || it.lowercase().contains("med") || it.lowercase().contains("cpr")
                }) {
                skillScore = 1.0
            } else if (catLower.contains("harass") || catLower.contains("stalk") || catLower.contains("unsafe")) {
                if (resp.skills.any {
                        it.lowercase().contains("security") || it.lowercase().contains("escort")
                    }) {
                    skillScore = 1.0
                }
            } else if (catLower.contains("accident")) {
                skillScore = if (resp.skills.any {
                        it.lowercase().contains("trauma") || it.lowercase().contains("aid")
                    }) 1.0 else 0.8
            }

            val availabilityScore = if (resp.verified) 1.0 else 0.7
            val ratingScore = minOf(1.0, resp.rating / 5.0)

            val totalScore = (wProximity * proximityScore +
                    wSkill * skillScore +
                    wAvailability * availabilityScore +
                    wRating * ratingScore)

            val roundedDist = Math.round(distanceKm * 10.0) / 10.0
            val roundedScore = Math.round(totalScore * 1000.0) / 1000.0

            resp.copy(
                distanceKm = roundedDist,
                etaMinutes = etaMins,
                score = roundedScore,
                explanation = "$roundedDist km away ($etaMins min ETA) • ${resp.badge} • Score: ${(roundedScore * 100).toInt()}%"
            )
        }.sortedByDescending { it.score }
    }
}
