package com.jaagruth.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jaagruth.crypto.CryptoLedger
import com.jaagruth.model.IncidentBlock
import com.jaagruth.model.VerificationResult
import com.jaagruth.theme.Emerald100
import com.jaagruth.theme.Emerald50
import com.jaagruth.theme.Emerald600
import com.jaagruth.theme.JagrathLightRose
import com.jaagruth.theme.JagrathPrimaryRed
import com.jaagruth.theme.Sky100
import com.jaagruth.theme.Sky600
import com.jaagruth.theme.Slate100
import com.jaagruth.theme.Slate200
import com.jaagruth.theme.Slate400
import com.jaagruth.theme.Slate50
import com.jaagruth.theme.Slate500
import com.jaagruth.theme.Slate600
import com.jaagruth.theme.Slate700
import com.jaagruth.theme.Slate800
import com.jaagruth.theme.Slate900
import com.jaagruth.theme.White

@Composable
fun ActivityScreen(
    chain: List<IncidentBlock>,
    isTampered: Boolean,
    onTamperBlock: () -> Unit,
    onRestoreChain: () -> Unit,
    onVerifyRecord: ((onResult: (VerificationResult) -> Unit) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var verificationResult by remember { mutableStateOf<VerificationResult?>(null) }
    var isVerifying by remember { mutableStateOf(false) }

    fun handleVerify() {
        isVerifying = true
        if (onVerifyRecord != null) {
            onVerifyRecord { result ->
                verificationResult = result
                isVerifying = false
            }
        } else {
            val result = CryptoLedger.verifyChainIntegrity(chain)
            verificationResult = result
            isVerifying = false
        }
    }

    fun getEventFriendlyName(type: String): String = when (type) {
        "PLATFORM_INIT" -> "Safety Network Connected"
        "PERMISSION_GRANTED" -> "Permissions & Priority Circle Verified"
        "TRIGGERED" -> "SOS Alert Initiated"
        "SOS_BUFFER_COMPLETED" -> "5.0s Buffer Completed (Locked Dispatch)"
        "CALLING_PRIORITY_1" -> "Calling Priority #1 (Voice Auto-Dial)"
        "PRIORITY_1_NO_ANSWER" -> "Priority #1 No Answer (20s Timeout)"
        "CALLING_PRIORITY_2" -> "Calling Priority #2 (Voice Auto-Dial)"
        "PRIORITY_2_NO_ANSWER" -> "Priority #2 No Answer (20s Timeout)"
        "CALLING_PRIORITY_3" -> "Calling Priority #3 (Voice Auto-Dial)"
        "PRIORITY_3_NO_ANSWER" -> "Priority #3 No Answer (20s Timeout)"
        "ACKNOWLEDGED" -> "Contact Answered & Coordinated"
        "RESPONDER_DISPATCHED" -> "Top Verified Responder Dispatched"
        "112_ERSS_HANDOFF" -> "112 ERSS Official Handoff"
        "LADDER_STEP_1" -> "Contact 1 (Family) Alerted"
        "LADDER_STEP_2" -> "Contact 2 Alerted"
        "RESPONDER_ASSIGNED" -> "First Responder Dispatched"
        "RESOLVED_SAFE" -> "Alert Resolved Safely"
        "FALSE_ALARM" -> "Cancelled in Buffer (Zero Calls Dispatched)"
        "DURESS_ESCALATION" -> "Silent Duress Escalation"
        else -> type.replace("_", " ")
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(White)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(JagrathLightRose),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Description,
                    contentDescription = null,
                    tint = JagrathPrimaryRed,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column {
                Text(
                    text = "Activity & Safety Log",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900
                )
                Text(
                    text = "Unaltered records of every emergency response",
                    fontSize = 12.sp,
                    color = Slate500
                )
            }
        }

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                // Verification Control Banner
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    color = Slate50,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                onClick = { handleVerify() },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                                modifier = Modifier.height(38.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Security,
                                    contentDescription = null,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(text = "Check Record Integrity", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            if (!isTampered) {
                                Button(
                                    onClick = onTamperBlock,
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Slate200,
                                        contentColor = Slate700
                                    ),
                                    modifier = Modifier.height(38.dp)
                                ) {
                                    Text(text = "Simulate Edit (Demo)", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                }
                            } else {
                                Button(
                                    onClick = {
                                        onRestoreChain()
                                        verificationResult = null
                                    },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Sky100,
                                        contentColor = Sky600
                                    ),
                                    modifier = Modifier.height(38.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Refresh,
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(text = "Restore Original", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        // Verification Status Details
                        verificationResult?.let { result ->
                            Spacer(modifier = Modifier.height(10.dp))
                            if (result.isValid) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Emerald50, RoundedCornerShape(12.dp))
                                        .border(1.dp, Emerald100, RoundedCornerShape(12.dp))
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = null,
                                        tint = Emerald600,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "100% Authentic: All ${result.checkedCount} records are unaltered and cryptographically verified.",
                                        color = Color(0xFF065F46),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            } else {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(JagrathLightRose.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                        .border(1.dp, JagrathPrimaryRed, RoundedCornerShape(12.dp))
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = JagrathPrimaryRed,
                                        modifier = Modifier
                                            .size(16.dp)
                                            .padding(top = 2.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text(
                                            text = "UNAUTHORIZED EDIT DETECTED!",
                                            color = JagrathPrimaryRed,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = "Record #${result.brokenIndex} was modified. The integrity chain flagged this mismatch.",
                                            color = Slate700,
                                            fontSize = 11.sp,
                                            modifier = Modifier.padding(top = 2.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                Text(
                    text = "RECORDED EVENTS (${chain.size})",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate400,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(top = 6.dp)
                )
            }

            itemsIndexed(chain) { index, block ->
                val isBroken = verificationResult != null && !verificationResult!!.isValid && verificationResult!!.brokenIndex == index

                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    color = if (isBroken || block.tampered) JagrathLightRose.copy(alpha = 0.4f) else White,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isBroken) JagrathPrimaryRed else Slate200
                    ),
                    shadowElevation = 2.dp
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = getEventFriendlyName(block.eventType),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )

                            Text(
                                text = block.timestamp.takeLast(13).take(8),
                                fontSize = 11.sp,
                                color = Slate400,
                                fontFamily = FontFamily.Monospace
                            )
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        val explanation = when (block.eventType) {
                            "TRIGGERED" -> "Emergency alert created with live GPS telemetry."
                            "LADDER_STEP_1" -> "Contact 1 (Family) notified via priority alarm."
                            "LADDER_STEP_2" -> "Contact 2 notified automatically."
                            "RESPONDER_ASSIGNED" -> "First responder Emily Dayton dispatched (5 min away)."
                            "RESOLVED_SAFE" -> "Alert confirmed safe and finalized with PIN."
                            "PLATFORM_INIT" -> "Monitoring active and ready."
                            "FALSE_ALARM" -> "Cancelled locally within 5-second buffer window."
                            "DURESS_ESCALATION" -> "Silent alert escalated to security control."
                            else -> "Event recorded securely in cryptographic ledger."
                        }

                        Text(text = explanation, fontSize = 11.sp, color = Slate600)

                        if (isBroken || block.tampered) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = JagrathPrimaryRed,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Digital signature mismatch — data was modified!",
                                    color = JagrathPrimaryRed,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
