package com.jaagruth

import com.jaagruth.data.local.MockDataSource
import com.jaagruth.data.repository.ResponderRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ResponderMatcherTest {

    private lateinit var responderRepository: ResponderRepository

    @Before
    fun setup() {
        responderRepository = ResponderRepository()
    }

    @Test
    fun testBestResponderSelection() {
        val (best, list) = responderRepository.findBestResponder(
            MockDataSource.DEFAULT_LATITUDE,
            MockDataSource.DEFAULT_LONGITUDE
        )

        assertNotNull("Best responder must not be null", best)
        assertTrue("Best responder must be available", best!!.isAvailable)
        assertTrue("Best responder should be verified", best.isVerified)
        assertTrue("Scored list must have responders", list.isNotEmpty())

        // Verify that unavailable responder (Arjun) is filtered or has negative score
        val arjun = list.find { it.name == "Arjun" }
        assertNotNull(arjun)
        assertTrue(!arjun!!.isAvailable)
        assertEquals(-1.0, arjun.score, 0.01)
    }

    @Test
    fun testRankingReasonContainsExpectedCriteria() {
        val (best, _) = responderRepository.findBestResponder(
            MockDataSource.DEFAULT_LATITUDE,
            MockDataSource.DEFAULT_LONGITUDE
        )

        assertNotNull(best)
        val reason = best!!.rankingReason
        assertTrue("Reason should mention name", reason.contains(best.name))
        assertTrue("Reason should mention verified", reason.contains("verified"))
        assertTrue("Reason should mention arrival time", reason.contains("estimated arrival time"))
    }
}
