package com.jaagruth.crypto

import com.google.gson.Gson
import com.jaagruth.model.IncidentBlock
import com.jaagruth.model.VerificationResult
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.TreeMap

object CryptoLedger {
    val GENESIS_HASH: String = "0".repeat(64)
    private val gson = Gson()

    fun sha256(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(input.toByteArray(Charsets.UTF_8))
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    private fun toCanonicalJson(payload: Map<String, Any>): String {
        val sortedMap = TreeMap<String, Any>(payload)
        return gson.toJson(sortedMap)
    }

    fun getIsoTimestamp(): String {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        sdf.timeZone = TimeZone.getTimeZone("UTC")
        return sdf.format(Date())
    }

    fun createIncidentBlock(
        index: Int,
        prevHash: String,
        timestamp: String = getIsoTimestamp(),
        actorId: String,
        actorRole: String,
        eventType: String,
        payload: Map<String, Any>
    ): IncidentBlock {
        val canonicalPayload = toCanonicalJson(payload)
        val preImage = "$prevHash|$timestamp|$actorId|$eventType|$canonicalPayload"
        val hash = sha256(preImage)

        return IncidentBlock(
            index = index,
            prevHash = prevHash,
            hash = hash,
            timestamp = timestamp,
            actorId = actorId,
            actorRole = actorRole,
            eventType = eventType,
            payload = payload,
            tampered = false
        )
    }

    fun verifyChainIntegrity(chain: List<IncidentBlock>): VerificationResult {
        if (chain.isEmpty()) {
            return VerificationResult(isValid = true, brokenIndex = null, reason = "Empty chain", checkedCount = 0)
        }

        var expectedPrevHash = GENESIS_HASH

        for (i in chain.indices) {
            val block = chain[i]

            // Check 1: Does this block link to the expected previous hash?
            if (block.prevHash != expectedPrevHash) {
                return VerificationResult(
                    isValid = false,
                    brokenIndex = i,
                    reason = "Broken chain link at Block #$i: Expected previous hash \"${expectedPrevHash.take(8)}...\" but found \"${block.prevHash.take(8)}...\"",
                    checkedCount = i + 1
                )
            }

            // Check 2: Does the block's current content recompute to its recorded hash?
            val canonicalPayload = toCanonicalJson(block.payload)
            val preImage = "${block.prevHash}|${block.timestamp}|${block.actorId}|${block.eventType}|$canonicalPayload"
            val recomputedHash = sha256(preImage)

            if (recomputedHash != block.hash) {
                return VerificationResult(
                    isValid = false,
                    brokenIndex = i,
                    reason = "Cryptographic payload mismatch at Block #$i: Payload or metadata was modified after generation! Recomputed: ${recomputedHash.take(10)}... vs Recorded: ${block.hash.take(10)}...",
                    checkedCount = i + 1
                )
            }

            expectedPrevHash = block.hash
        }

        return VerificationResult(
            isValid = true,
            brokenIndex = null,
            reason = "All ${chain.size} cryptographic blocks verified sequentially from Genesis H_0. Zero tampering detected.",
            checkedCount = chain.size
        )
    }
}
