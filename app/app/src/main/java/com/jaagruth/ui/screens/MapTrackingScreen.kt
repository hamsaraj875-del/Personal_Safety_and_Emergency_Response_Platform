package com.jaagruth.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.jaagruth.model.LatLng
import com.jaagruth.model.SafetyHub
import com.jaagruth.model.VerifiedResponder
import com.jaagruth.theme.Emerald50
import com.jaagruth.theme.Emerald500
import com.jaagruth.theme.Emerald600
import com.jaagruth.theme.JagrathCrimson
import com.jaagruth.theme.JagrathLightRose
import com.jaagruth.theme.JagrathPrimaryRed
import com.jaagruth.theme.Slate100
import com.jaagruth.theme.Slate200
import com.jaagruth.theme.Slate50
import com.jaagruth.theme.Slate500
import com.jaagruth.theme.Slate600
import com.jaagruth.theme.Slate700
import com.jaagruth.theme.Slate800
import com.jaagruth.theme.Slate900
import com.jaagruth.theme.White
import com.jaagruth.ui.components.LiveEmergencyMapView

@Composable
fun MapTrackingScreen(
    userCoords: LatLng,
    activeResponder: VerifiedResponder,
    safetyHubs: List<SafetyHub>,
    routePoints: List<LatLng>,
    onBack: () -> Unit,
    onOpenInstruction: () -> Unit,
    onCallResponder: (VerifiedResponder) -> Unit,
    onMessageResponder: (VerifiedResponder) -> Unit
) {
    var selectedHub by remember { mutableStateOf<SafetyHub?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(White)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        // Top Header Card
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ChevronLeft,
                        contentDescription = "Back",
                        tint = Slate900,
                        modifier = Modifier.size(24.dp)
                    )
                }

                Row(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(Emerald50)
                        .border(1.dp, Emerald600.copy(alpha = 0.3f), CircleShape)
                        .padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(Emerald600, CircleShape)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Local Dispatch Active (~${activeResponder.distanceKm} km)",
                        color = Emerald600,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Ambulance and responders on the way",
                fontSize = 19.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )

            Text(
                text = "Approaching from your local sector. Real facilities in 20km radius mapped below.",
                fontSize = 12.sp,
                color = Slate500,
                modifier = Modifier.padding(top = 2.dp)
            )

            Text(
                text = "Open full emergency instruction →",
                fontSize = 12.sp,
                color = JagrathCrimson,
                fontWeight = FontWeight.SemiBold,
                textDecoration = TextDecoration.Underline,
                modifier = Modifier
                    .clickable { onOpenInstruction() }
                    .padding(vertical = 4.dp)
            )
        }

        // Map Area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Slate100)
        ) {
            LiveEmergencyMapView(
                userPos = userCoords,
                responderPos = activeResponder.location,
                safetyHubs = safetyHubs,
                routePoints = routePoints,
                activeResponder = activeResponder,
                onSelectHub = { selectedHub = it }
            )

            // Selected Hub Pop-up Card
            Column(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(12.dp)
            ) {
                androidx.compose.animation.AnimatedVisibility(
                    visible = selectedHub != null,
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    selectedHub?.let { hub ->
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            color = White,
                            shadowElevation = 8.dp,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(text = hub.icon, fontSize = 20.sp)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text(text = hub.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Slate900)
                                            Text(
                                                text = "${hub.distanceMeters}m away • ${hub.etaMins}m ETA • ${hub.status}",
                                                fontSize = 11.sp,
                                                color = Slate500
                                            )
                                        }
                                    }
                                    IconButton(
                                        onClick = { selectedHub = null },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Slate500)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Surroundings Quick Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Slate50)
                .padding(horizontal = 12.dp, vertical = 6.dp)
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = "Surroundings:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate500)
            safetyHubs.forEach { hub ->
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(White)
                        .border(1.dp, Slate200, RoundedCornerShape(8.dp))
                        .clickable { selectedHub = hub }
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = hub.icon, fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = hub.shortName, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "(${hub.distanceMeters}m)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = JagrathPrimaryRed)
                }
            }
        }

        // Floating Bottom Responder Carousel Card
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            shape = RoundedCornerShape(20.dp),
            color = Slate50,
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
            shadowElevation = 6.dp
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Image(
                        painter = rememberAsyncImagePainter(activeResponder.avatar),
                        contentDescription = activeResponder.name,
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .border(2.dp, JagrathLightRose, CircleShape),
                        contentScale = ContentScale.Crop
                    )

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = activeResponder.name,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.Security,
                                contentDescription = null,
                                tint = Emerald500,
                                modifier = Modifier.size(14.dp)
                            )
                        }

                        Text(
                            text = "${activeResponder.title} • (${activeResponder.etaMinutes} min away · ${activeResponder.distanceKm} km)",
                            fontSize = 11.sp,
                            color = Slate500,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { onCallResponder(activeResponder) },
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = JagrathPrimaryRed)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Call,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Call", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = { onMessageResponder(activeResponder) },
                        modifier = Modifier
                            .weight(1f)
                            .height(40.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = White,
                            contentColor = Slate700
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Chat,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Message", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
