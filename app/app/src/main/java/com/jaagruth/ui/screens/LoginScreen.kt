package com.jaagruth.ui.screens

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
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jaagruth.R
import com.jaagruth.model.UserProfile
import com.jaagruth.theme.JagrathDeepRed
import com.jaagruth.theme.JagrathLightRose
import com.jaagruth.theme.JagrathPrimaryRed
import com.jaagruth.theme.Slate100
import com.jaagruth.theme.Slate200
import com.jaagruth.theme.Slate400
import com.jaagruth.theme.Slate50
import com.jaagruth.theme.Slate500
import com.jaagruth.theme.Slate700
import com.jaagruth.theme.Slate800
import com.jaagruth.theme.Slate900
import com.jaagruth.theme.White
import kotlin.random.Random

@Composable
fun LoginScreen(
    onLoginSuccess: (UserProfile) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var generatedOtp by remember { mutableStateOf<String?>(null) }
    val otpDigits = remember { mutableStateListOf("", "", "", "", "", "") }
    var errorMessage by remember { mutableStateOf("") }
    var isLocating by remember { mutableStateOf(false) }

    fun generateOtp() {
        if (phone.length < 10) {
            errorMessage = "Please enter a valid 10-digit mobile number first."
            return
        }
        errorMessage = ""
        val code = (100000 + Random.nextInt(900000)).toString()
        generatedOtp = code
    }

    fun autoFillOtp() {
        generatedOtp?.let { code ->
            for (i in 0 until 6) {
                if (i < code.length) otpDigits[i] = code[i].toString()
            }
        }
    }

    fun handleContinue() {
        if (name.isBlank()) {
            errorMessage = "Please enter your full name."
            return
        }
        if (address.isBlank()) {
            errorMessage = "Please enter your location or tap 'Use Current GPS'."
            return
        }
        if (phone.length < 10) {
            errorMessage = "Please enter a valid 10-digit mobile number."
            return
        }
        val enteredOtp = otpDigits.joinToString("")
        if (enteredOtp.length != 6) {
            errorMessage = "Please generate and enter the 6-digit OTP code."
            return
        }
        if (generatedOtp != null && enteredOtp != generatedOtp) {
            errorMessage = "Invalid OTP code. Tap 'Auto-fill' or enter the simulated code shown above."
            return
        }

        val user = UserProfile(
            name = name.trim(),
            address = address.trim(),
            phone = "+91 $phone"
        )
        onLoginSuccess(user)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(White)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp, vertical = 16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            // Top Header with Logo
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .border(1.dp, Slate100, RoundedCornerShape(16.dp))
                    .background(White)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.ic_shield),
                    contentDescription = "Jagrath Logo",
                    modifier = Modifier.size(30.dp)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "Welcome to Jagrath",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )

            Text(
                text = "Create or log in to your personal emergency safety profile.",
                fontSize = 13.sp,
                color = Slate500,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            // Full Name Field
            Text(
                text = "FULL NAME",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Slate700
            )
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                placeholder = { Text("Enter your name", fontSize = 13.sp, color = Slate400) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = Slate400,
                        modifier = Modifier.size(18.dp)
                    )
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = JagrathPrimaryRed,
                    unfocusedBorderColor = Slate200,
                    focusedContainerColor = Slate50,
                    unfocusedContainerColor = Slate50
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Address / Home Zone Field
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "ADDRESS / HOME ZONE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Slate700
                )
                Row(
                    modifier = Modifier.clickable {
                        isLocating = true
                        address = "BMSCE Campus, Bull Temple Rd, Basavanagudi, Bengaluru"
                        isLocating = false
                    },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.NearMe,
                        contentDescription = null,
                        tint = JagrathPrimaryRed,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (isLocating) "Detecting..." else "Use Current GPS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = JagrathPrimaryRed
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                placeholder = { Text("e.g. BMSCE Campus, Bull Temple Rd, Bengaluru", fontSize = 13.sp, color = Slate400) },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = Slate400,
                        modifier = Modifier.size(18.dp)
                    )
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = JagrathPrimaryRed,
                    unfocusedBorderColor = Slate200,
                    focusedContainerColor = Slate50,
                    unfocusedContainerColor = Slate50
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Mobile Number Field
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "MOBILE NUMBER",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Slate700
                )
                Row(
                    modifier = Modifier.clickable { generateOtp() },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Key,
                        contentDescription = null,
                        tint = JagrathPrimaryRed,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (generatedOtp != null) "Regenerate OTP" else "Send OTP",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = JagrathPrimaryRed
                    )
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .height(52.dp)
                        .background(Slate100, RoundedCornerShape(14.dp))
                        .border(1.dp, Slate200, RoundedCornerShape(14.dp))
                        .padding(horizontal = 14.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "+91", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                }

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it.filter { c -> c.isDigit() }.take(10) },
                    placeholder = { Text("10-digit mobile number", fontSize = 13.sp, color = Slate400) },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Default.Phone,
                            contentDescription = null,
                            tint = Slate400,
                            modifier = Modifier.size(18.dp)
                        )
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(14.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = JagrathPrimaryRed,
                        unfocusedBorderColor = Slate200,
                        focusedContainerColor = Slate50,
                        unfocusedContainerColor = Slate50
                    ),
                    singleLine = true
                )
            }

            // Generated OTP banner
            if (generatedOtp != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(JagrathLightRose.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                        .border(1.dp, JagrathLightRose, RoundedCornerShape(14.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = JagrathPrimaryRed,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Verification OTP (Simulated SMS):",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = JagrathDeepRed
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(JagrathPrimaryRed)
                                .clickable { autoFillOtp() }
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(text = "Auto-fill", color = White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = generatedOtp ?: "",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            color = JagrathPrimaryRed,
                            letterSpacing = 2.sp
                        )
                        Text(
                            text = "Tap auto-fill or enter below",
                            fontSize = 10.sp,
                            color = Slate500
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 6-digit OTP code inputs
            Text(
                text = "ENTER 6-DIGIT CODE",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Slate700
            )
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                for (i in 0 until 6) {
                    OutlinedTextField(
                        value = otpDigits[i],
                        onValueChange = { value ->
                            val digit = value.filter { it.isDigit() }.takeLast(1)
                            otpDigits[i] = digit
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        textStyle = androidx.compose.ui.text.TextStyle(
                            textAlign = TextAlign.Center,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        ),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = JagrathPrimaryRed,
                            unfocusedBorderColor = Slate200,
                            focusedContainerColor = Slate50,
                            unfocusedContainerColor = Slate50
                        ),
                        singleLine = true
                    )
                }
            }

            if (errorMessage.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = errorMessage,
                    color = JagrathPrimaryRed,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Submit Button
            Button(
                onClick = { handleContinue() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = JagrathPrimaryRed)
            ) {
                Text(text = "Continue to Jagrath", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
            }
        }

        // Demo quick login options
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.weight(1f).height(1.dp).background(Slate100))
                Text(
                    text = "or quick demo fill",
                    fontSize = 11.sp,
                    color = Slate400,
                    modifier = Modifier.padding(horizontal = 10.dp)
                )
                Box(modifier = Modifier.weight(1f).height(1.dp).background(Slate100))
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(42.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Slate50)
                        .border(1.dp, Slate200, RoundedCornerShape(12.dp))
                        .clickable {
                            name = "Jenifer Pilman"
                            address = "BMSCE Campus, Bull Temple Rd, Bengaluru"
                            phone = "9876543210"
                            val code = "849201"
                            generatedOtp = code
                            for (i in 0 until 6) otpDigits[i] = code[i].toString()
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "Jenifer (Campus)", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(42.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Slate50)
                        .border(1.dp, Slate200, RoundedCornerShape(12.dp))
                        .clickable {
                            name = "Rajesh Kumar"
                            address = "Jayanagar 4th Block, Bengaluru"
                            phone = "9845012345"
                            val code = "736192"
                            generatedOtp = code
                            for (i in 0 until 6) otpDigits[i] = code[i].toString()
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "Rajesh (Jayanagar)", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                }
            }
        }
    }
}
