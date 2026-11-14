package com.jaagruth.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.jaagruth.model.UserProfile
import com.jaagruth.theme.JagrathCrimson
import com.jaagruth.theme.JagrathLightRose
import com.jaagruth.theme.JagrathPrimaryRed
import com.jaagruth.theme.JagrathRoseStart
import com.jaagruth.theme.JagrathSoftPink
import com.jaagruth.theme.Slate100
import com.jaagruth.theme.Slate200
import com.jaagruth.theme.Slate400
import com.jaagruth.theme.Slate500
import com.jaagruth.theme.Slate800
import com.jaagruth.theme.Slate900
import com.jaagruth.theme.White
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    userProfile: UserProfile,
    onTriggerSOS: () -> Unit,
    onRefreshLocation: () -> Unit,
    isLocating: Boolean = false,
    modifier: Modifier = Modifier
) {
    var isHolding by remember { mutableStateOf(false) }
    var holdProgress by remember { mutableFloatStateOf(0f) }
    val scope = rememberCoroutineScope()
    var holdJob by remember { mutableStateOf<Job?>(null) }

    val pulseScale = remember { Animatable(1f) }
    LaunchedEffect(Unit) {
        pulseScale.animateTo(
            targetValue = 1.08f,
            animationSpec = infiniteRepeatable(
                animation = tween(1200),
                repeatMode = RepeatMode.Reverse
            )
        )
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(White)
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Welcome back,",
                    fontSize = 13.sp,
                    color = Slate400,
                    fontWeight = FontWeight.Normal
                )
                Text(
                    text = userProfile.name,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Slate900
                )
            }

            // User Avatar with Red Badge '2'
            Box(modifier = Modifier.size(46.dp)) {
                Image(
                    painter = rememberAsyncImagePainter(userProfile.avatar),
                    contentDescription = userProfile.name,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .border(2.dp, Slate100, CircleShape),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .align(Alignment.TopEnd)
                        .clip(CircleShape)
                        .background(JagrathCrimson)
                        .border(2.dp, White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "2",
                        color = White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Center Emergency Section
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "Are you in emergency?",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900,
                textAlign = TextAlign.Center
            )

            Text(
                text = "Press the button below help will reach you soon.",
                fontSize = 14.sp,
                color = Slate500,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .padding(top = 6.dp)
                    .fillMaxWidth(0.85f)
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Central Concentric Pulsing SOS Button
            Box(
                modifier = Modifier.size(260.dp),
                contentAlignment = Alignment.Center
            ) {
                // Layer 1: Outermost breathing soft pink halo
                Box(
                    modifier = Modifier
                        .size(260.dp)
                        .scale(pulseScale.value)
                        .background(JagrathSoftPink.copy(alpha = 0.6f), CircleShape)
                )

                // Layer 2: Middle coral gradient ring
                Box(
                    modifier = Modifier
                        .size(205.dp)
                        .background(JagrathPrimaryRed.copy(alpha = 0.15f), CircleShape)
                )

                // Layer 3: Progress Ring for hold
                CircularProgressIndicator(
                    progress = { if (isHolding) holdProgress else 0f },
                    modifier = Modifier.size(175.dp),
                    color = JagrathPrimaryRed,
                    strokeWidth = 6.dp,
                    trackColor = JagrathPrimaryRed.copy(alpha = 0.1f)
                )

                // Layer 4: Central Rich Red SOS Button
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .shadow(20.dp, CircleShape)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(
                                    Color(0xFFFF576D),
                                    JagrathPrimaryRed
                                )
                            )
                        )
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onPress = {
                                    isHolding = true
                                    holdProgress = 0f
                                    val startTime = System.currentTimeMillis()
                                    val duration = 1800L
                                    holdJob = scope.launch {
                                        while (isHolding) {
                                            val elapsed = System.currentTimeMillis() - startTime
                                            holdProgress = (elapsed.toFloat() / duration).coerceIn(0f, 1f)
                                            if (holdProgress >= 1f) {
                                                isHolding = false
                                                holdProgress = 0f
                                                onTriggerSOS()
                                                break
                                            }
                                            delay(20)
                                        }
                                    }
                                    tryAwaitRelease()
                                    holdJob?.cancel()
                                    if (holdProgress > 0.15f && holdProgress < 1f) {
                                        onTriggerSOS()
                                    }
                                    isHolding = false
                                    holdProgress = 0f
                                },
                                onTap = {
                                    onTriggerSOS()
                                }
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "SOS",
                            color = White,
                            fontSize = 34.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.sp
                        )
                        Text(
                            text = if (isHolding) "${(holdProgress * 100).toInt()}%" else "Hold 2s",
                            color = White.copy(alpha = 0.85f),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Floating Address Card
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
                .clickable { onRefreshLocation() },
            shape = RoundedCornerShape(18.dp),
            color = White,
            border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
            shadowElevation = 4.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Image(
                    painter = rememberAsyncImagePainter(userProfile.avatar),
                    contentDescription = null,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .border(1.dp, Slate200, CircleShape),
                    contentScale = ContentScale.Crop
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = JagrathPrimaryRed,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Your current address",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Slate800
                            )
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.NearMe,
                                contentDescription = null,
                                tint = JagrathCrimson,
                                modifier = Modifier.size(11.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = if (isLocating) "Locating..." else "GPS Sync",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = JagrathCrimson
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = userProfile.address,
                        fontSize = 12.sp,
                        color = Slate500,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}
