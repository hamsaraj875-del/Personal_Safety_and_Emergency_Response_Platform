package com.jaagruth.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.jaagruth.model.EmergencyContact
import com.jaagruth.model.VerifiedResponder
import com.jaagruth.theme.Emerald500
import com.jaagruth.theme.Emerald600
import com.jaagruth.theme.JagrathCrimson
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

private val AVATAR_PRESETS = listOf(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"
)

@Composable
fun ContactsScreen(
    contacts: List<EmergencyContact>,
    onAddContact: (EmergencyContact) -> Unit,
    onDeleteContact: (String) -> Unit,
    responders: List<VerifiedResponder>,
    selectedResponderId: String?,
    onSelectResponder: (VerifiedResponder) -> Unit,
    modifier: Modifier = Modifier
) {
    var showAddModal by remember { mutableStateOf(false) }
    var newName by remember { mutableStateOf("") }
    var newPhone by remember { mutableStateOf("") }
    var newRelation by remember { mutableStateOf("Family") }
    var selectedAvatar by remember { mutableStateOf(AVATAR_PRESETS[0]) }
    var error by remember { mutableStateOf("") }

    fun handleSaveContact() {
        if (newName.isBlank()) {
            error = "Please enter the contact's name."
            return
        }
        if (newPhone.length < 10) {
            error = "Please enter a valid 10-digit phone number."
            return
        }

        val newContact = EmergencyContact(
            id = "ct_${System.currentTimeMillis()}",
            name = newName.trim(),
            phone = "+91 $newPhone",
            relation = newRelation,
            avatar = selectedAvatar,
            priority = contacts.size + 1
        )
        onAddContact(newContact)
        newName = ""
        newPhone = ""
        error = ""
        showAddModal = false
    }

    Box(modifier = modifier.fillMaxSize().background(White)) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(JagrathLightRose),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.People,
                            contentDescription = null,
                            tint = JagrathPrimaryRed,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = "Trusted Contacts",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                        Text(
                            text = "Who receives your SOS alerts",
                            fontSize = 12.sp,
                            color = Slate500
                        )
                    }
                }

                Button(
                    onClick = { showAddModal = true },
                    shape = CircleShape,
                    colors = ButtonDefaults.buttonColors(containerColor = JagrathCrimson),
                    modifier = Modifier.height(36.dp)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Add", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }

            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Section 1: User's Emergency Contacts
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "YOUR EMERGENCY CIRCLE (${contacts.size})",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate400,
                            letterSpacing = 1.sp
                        )
                        Text(text = "Alerted in order", fontSize = 11.sp, color = Slate400)
                    }
                }

                itemsIndexed(contacts) { index, contact ->
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = Slate50,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Image(
                                    painter = rememberAsyncImagePainter(contact.avatar),
                                    contentDescription = contact.name,
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(CircleShape)
                                        .border(1.dp, White, CircleShape),
                                    contentScale = ContentScale.Crop
                                )

                                Spacer(modifier = Modifier.width(12.dp))

                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = contact.name,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate900
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(JagrathLightRose)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = "Priority ${index + 1}",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = JagrathPrimaryRed
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(2.dp))

                                    Text(
                                        text = "${contact.phone} • ${contact.relation}",
                                        fontSize = 11.sp,
                                        color = Slate500
                                    )
                                }
                            }

                            IconButton(
                                onClick = { onDeleteContact(contact.id) },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete",
                                    tint = Slate400,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }

                // Section 2: Nearby Verified Responders
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "NEARBY VERIFIED RESPONDERS",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate400,
                            letterSpacing = 1.sp
                        )
                        Text(text = "● Active in your area", fontSize = 11.sp, color = Emerald600, fontWeight = FontWeight.SemiBold)
                    }
                }

                itemsIndexed(responders) { _, resp ->
                    val isSelected = selectedResponderId == resp.id

                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        color = if (isSelected) JagrathLightRose.copy(alpha = 0.4f) else White,
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isSelected) JagrathPrimaryRed else Slate200
                        ),
                        shadowElevation = 2.dp
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Image(
                                painter = rememberAsyncImagePainter(resp.avatar),
                                contentDescription = resp.name,
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .border(2.dp, White, CircleShape),
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
                                        Text(
                                            text = resp.name,
                                            fontSize = 13.sp,
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
                                        text = "${resp.etaMinutes} min away",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = JagrathPrimaryRed
                                    )
                                }

                                Text(text = resp.badge, fontSize = 11.sp, color = Slate500)

                                Spacer(modifier = Modifier.height(4.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.LocationOn,
                                            contentDescription = null,
                                            tint = Slate400,
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Spacer(modifier = Modifier.width(2.dp))
                                        Text(text = "${resp.distanceKm} km away", fontSize = 11.sp, color = Slate400)
                                    }

                                    Button(
                                        onClick = { onSelectResponder(resp) },
                                        shape = RoundedCornerShape(10.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (isSelected) JagrathPrimaryRed else Slate100,
                                            contentColor = if (isSelected) White else Slate700
                                        ),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text(
                                            text = if (isSelected) "Active Helper" else "Select",
                                            fontSize = 11.sp,
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

        // Add Contact Modal Sheet
        AnimatedVisibility(
            visible = showAddModal,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .clickable { showAddModal = false },
                contentAlignment = Alignment.BottomCenter
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(enabled = false) {},
                    shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
                    color = White,
                    shadowElevation = 16.dp
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Add Emergency Contact",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            IconButton(onClick = { showAddModal = false }) {
                                Icon(Icons.Default.Close, contentDescription = "Close", tint = Slate500)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Choose photo
                        Text(text = "CHOOSE PHOTO", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate700)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            AVATAR_PRESETS.forEach { av ->
                                Image(
                                    painter = rememberAsyncImagePainter(av),
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .border(
                                            if (selectedAvatar == av) 3.dp else 1.dp,
                                            if (selectedAvatar == av) JagrathPrimaryRed else Slate200,
                                            CircleShape
                                        )
                                        .clickable { selectedAvatar = av },
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(text = "CONTACT NAME", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate700)
                        Spacer(modifier = Modifier.height(4.dp))
                        OutlinedTextField(
                            value = newName,
                            onValueChange = { newName = it },
                            placeholder = { Text("e.g. Priyatev", fontSize = 13.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(text = "MOBILE NUMBER", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate700)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .height(52.dp)
                                    .background(Slate100, RoundedCornerShape(12.dp))
                                    .padding(horizontal = 14.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = "+91", fontWeight = FontWeight.Bold, color = Slate700)
                            }

                            OutlinedTextField(
                                value = newPhone,
                                onValueChange = { newPhone = it.filter { c -> c.isDigit() }.take(10) },
                                placeholder = { Text("10-digit number", fontSize = 13.sp) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        if (error.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = error, color = JagrathPrimaryRed, fontSize = 11.sp)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(
                                onClick = { showAddModal = false },
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Slate100, contentColor = Slate700)
                            ) {
                                Text(text = "Cancel", fontSize = 12.sp)
                            }

                            Button(
                                onClick = { handleSaveContact() },
                                modifier = Modifier.weight(1f).height(44.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = JagrathPrimaryRed)
                            ) {
                                Text(text = "Save Contact", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
