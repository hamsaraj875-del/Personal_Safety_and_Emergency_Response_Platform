package com.jaagruth.service

import com.jaagruth.crypto.CryptoLedger
import com.jaagruth.model.IncidentBlock
import kotlin.random.Random

data class BenchmarkResult(
    val meanTimeToNotifySec: Double,
    val meanTimeToAssignSec: Double,
    val escalationSuccessRate: Int,
    val tamperCaughtCount: Int,
    val totalTested: Int
)

object SimulationRunner {

    fun runFullBenchmarkSimulation(): BenchmarkResult {
        val incidentCount = 20
        var totalTimeToNotifySec = 0.0
        var totalTimeToAssignSec = 0.0
        var successfulEscalations = 0
        var tamperedCaught = 0

        for (i in 1..incidentCount) {
            val timeToNotify = 1.2 + Random.nextDouble() * 1.4
            val timeToAssign = 24.0 + Random.nextDouble() * 18.0
            val isSuccess = Random.nextDouble() > 0.05

            totalTimeToNotifySec += timeToNotify
            totalTimeToAssignSec += timeToAssign
            if (isSuccess) successfulEscalations++

            var prevHash = CryptoLedger.GENESIS_HASH
            val chain = mutableListOf<IncidentBlock>()

            val b0 = CryptoLedger.createIncidentBlock(
                index = 0,
                prevHash = prevHash,
                actorId = "usr_sim_$i",
                actorRole = "citizen",
                eventType = "TRIGGERED",
                payload = mapOf("lat" to 12.935, "lng" to 77.535, "mode" to "SOS")
            )
            chain.add(b0)
            prevHash = b0.hash

            val b1 = CryptoLedger.createIncidentBlock(
                index = 1,
                prevHash = prevHash,
                actorId = "system_escalator",
                actorRole = "system",
                eventType = "NOTIFYING",
                payload = mapOf("step" to 1, "contact" to "Contact 1")
            )
            chain.add(b1)

            // In every 4th case, simulate tamper
            if (i % 4 == 0) {
                val tamperedBlock = b1.copy(
                    tampered = true,
                    payload = mapOf("step" to 1, "contact" to "Contact 1", "unauthorized_edit" to "MODIFIED_RECORD")
                )
                val testChain = listOf(b0, tamperedBlock)
                val verify = CryptoLedger.verifyChainIntegrity(testChain)
                if (!verify.isValid) {
                    tamperedCaught++
                }
            }
        }

        return BenchmarkResult(
            meanTimeToNotifySec = Math.round((totalTimeToNotifySec / incidentCount) * 100.0) / 100.0,
            meanTimeToAssignSec = Math.round((totalTimeToAssignSec / incidentCount) * 10.0) / 10.0,
            escalationSuccessRate = ((successfulEscalations.toDouble() / incidentCount) * 100).toInt(),
            tamperCaughtCount = tamperedCaught,
            totalTested = incidentCount
        )
    }
}
