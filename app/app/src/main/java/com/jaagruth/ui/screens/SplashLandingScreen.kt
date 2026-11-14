package com.jaagruth.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jaagruth.R
import com.jaagruth.theme.JagrathDeepRed
import com.jaagruth.theme.JagrathPrimaryRed
import com.jaagruth.theme.JagrathRoseStart
import com.jaagruth.theme.White
import kotlinx.coroutines.delay

@Composable
fun SplashLandingScreen(
    onComplete: () -> Unit
) {
    val fullText = "JAGRATH"
    var charCount by remember { mutableIntStateOf(0) }
    var isFinished by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        for (i in 1..fullText.length) {
            delay(140)
            charCount = i
        }
        isFinished = true
        delay(800)
        onComplete()
    }

    val pulseScale = remember { Animatable(1f) }
    LaunchedEffect(Unit) {
        pulseScale.animateTo(
            targetValue = 1.05f,
            animationSpec = infiniteRepeatable(
                animation = tween(1000),
                repeatMode = RepeatMode.Reverse
            )
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        JagrathRoseStart,
                        JagrathPrimaryRed,
                        JagrathDeepRed
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Soft glowing ambient circles
        Box(
            modifier = Modifier
                .size(260.dp)
                .offset(x = (-80).dp, y = (-120).dp)
                .blur(70.dp)
                .background(White.copy(alpha = 0.15f), CircleShape)
        )

        Box(
            modifier = Modifier
                .size(280.dp)
                .offset(x = 100.dp, y = 160.dp)
                .blur(80.dp)
                .background(Color.Black.copy(alpha = 0.2f), CircleShape)
        )

        // Center content
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Emblem logo card
            Box(
                modifier = Modifier
                    .scale(pulseScale.value)
                    .size(96.dp)
                    .shadow(24.dp, RoundedCornerShape(24.dp))
                    .clip(RoundedCornerShape(24.dp))
                    .border(2.dp, White.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                    .background(White),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_shield),
                    contentDescription = "Jagrath Logo",
                    modifier = Modifier.size(56.dp)
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Animated Letters
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                val currentText = fullText.take(charCount)
                for (char in currentText) {
                    Text(
                        text = char.toString(),
                        color = White,
                        fontSize = 38.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 4.sp,
                        textAlign = TextAlign.Center
                    )
                }

                // Blinking cursor
                if (!isFinished) {
                    Box(
                        modifier = Modifier
                            .padding(start = 4.dp)
                            .size(width = 3.dp, height = 28.dp)
                            .background(White.copy(alpha = 0.8f))
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Subtitle tag
            if (isFinished) {
                Text(
                    text = "VIGILANT PROTECTION",
                    color = White.copy(alpha = 0.85f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = 3.sp
                )
            }
        }

        // Tap to Skip button
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
                .clip(CircleShape)
                .background(White.copy(alpha = 0.15f))
                .clickable { onComplete() }
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text(
                text = "TAP TO SKIP",
                color = White.copy(alpha = 0.75f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
        }
    }
}
