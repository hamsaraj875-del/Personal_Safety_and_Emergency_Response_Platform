package com.jaagruth.ui.components

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jaagruth.theme.Emerald600
import com.jaagruth.theme.JagrathLightRose
import com.jaagruth.theme.JagrathPrimaryRed
import com.jaagruth.theme.Slate100
import com.jaagruth.theme.Slate200
import com.jaagruth.theme.Slate400
import com.jaagruth.theme.Slate50
import com.jaagruth.theme.Slate500
import com.jaagruth.theme.Slate600
import com.jaagruth.theme.Slate700
import com.jaagruth.theme.Slate900
import com.jaagruth.theme.White

@Composable
fun InstructionModal(
    onClose: () -> Unit,
    onDial112: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f))
            .clickable(enabled = false) {},
        contentAlignment = Alignment.BottomCenter
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(28.dp),
            color = White,
            shadowElevation = 16.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(JagrathLightRose, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.MedicalServices,
                                contentDescription = null,
                                tint = JagrathPrimaryRed,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "First-Aid & Emergency Guide",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Text(
                                text = "Immediate actions while help is on the way",
                                fontSize = 11.sp,
                                color = Slate400
                            )
                        }
                    }

                    IconButton(
                        onClick = onClose,
                        modifier = Modifier
                            .size(32.dp)
                            .background(Slate100, CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = Slate500,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Steps Card
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate50, RoundedCornerShape(16.dp))
                        .border(1.dp, Slate200, RoundedCornerShape(16.dp))
                        .padding(14.dp)
                ) {
                    Text(
                        text = "Important Immediate Steps:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    InstructionItem(
                        boldText = "Stay on the line: ",
                        normalText = "Keep your phone screen on so approaching responders can see you."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    InstructionItem(
                        boldText = "Speak calmly: ",
                        normalText = "Reassure the person that first responders have been dispatched."
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    InstructionItem(
                        boldText = "Clear space: ",
                        normalText = "Move to a well-lit open area if safe to do so."
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // 112 India Statutory Box
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(JagrathLightRose.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                        .border(1.dp, JagrathLightRose, RoundedCornerShape(16.dp))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Call 112 India Directly",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                        Text(
                            text = "Government police & ambulance",
                            fontSize = 11.sp,
                            color = Slate500
                        )
                    }

                    Button(
                        onClick = onDial112,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = JagrathPrimaryRed),
                        modifier = Modifier.height(38.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Call,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Dial 112", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onClose,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Slate100, contentColor = Slate700)
                ) {
                    Text(text = "Back to Map", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun InstructionItem(boldText: String, normalText: String) {
    Row(verticalAlignment = Alignment.Top) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = Emerald600,
            modifier = Modifier
                .size(16.dp)
                .padding(top = 2.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = androidx.compose.ui.text.buildAnnotatedString {
                pushStyle(androidx.compose.ui.text.SpanStyle(fontWeight = FontWeight.Bold, color = Slate900))
                append(boldText)
                pop()
                pushStyle(androidx.compose.ui.text.SpanStyle(color = Slate600))
                append(normalText)
                pop()
            },
            fontSize = 12.sp,
            lineHeight = 16.sp
        )
    }
}
