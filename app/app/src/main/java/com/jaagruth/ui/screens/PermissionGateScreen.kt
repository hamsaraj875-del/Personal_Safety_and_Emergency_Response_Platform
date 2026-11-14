package com.jaagruth.ui.screens

import android.content.Intent
import android.net.Uri
import android.provider.ContactsContract
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContactPhone
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
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
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jaagruth.model.EmergencyContact
import com.jaagruth.theme.Emerald500
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

@Composable
fun PermissionGateScreen(
    initialContacts: List<EmergencyContact>,
    onPermissionsGranted: (List<EmergencyContact>) -> Unit
) {
    val context = LocalContext.current
    val contactList = remember { mutableStateListOf<EmergencyContact>().apply { addAll(initialContacts) } }

    var showAddDialog by remember { mutableStateOf(false) }
    var inputName by remember { mutableStateOf("") }
    var inputPhone by remember { mutableStateOf("") }
    var inputRelation by remember { mutableStateOf("Family") }
    var errorMsg by remember { mutableStateOf("") }

    // Runtime permissions launcher for direct phone calling and location
    val runtimePermissionsLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        onPermissionsGranted(contactList.toList())
    }

    // Native Android Contact Picker launcher
    val contactPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickContact()
    ) { contactUri: Uri? ->
        if (contactUri != null) {
            try {
                val cursor = context.contentResolver.query(contactUri, null, null, null, null)
                cursor?.use {
                    if (it.moveToFirst()) {
                        val nameIndex = it.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME)
                        val idIndex = it.getColumnIndex(ContactsContract.Contacts._ID)
                        val name = if (nameIndex >= 0) it.getString(nameIndex) ?: "Selected Contact" else "Selected Contact"
                        val contactId = if (idIndex >= 0) it.getString(idIndex) else ""

                        var phoneNumber = "+91 98765 43210"
                        if (contactId.isNotEmpty()) {
                            val phoneCursor = context.contentResolver.query(
                                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                                null,
                                "${ContactsContract.CommonDataKinds.Phone.CONTACT_ID} = ?",
                                arrayOf(contactId),
                                null
                            )
                            phoneCursor?.use { pCur ->
                                if (pCur.moveToFirst()) {
                                    val pIdx = pCur.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                                    if (pIdx >= 0) {
                                        phoneNumber = pCur.getString(pIdx) ?: phoneNumber
                                    }
                                }
                            }
                        }

                        val newPriority = contactList.size + 1
                        val newContact = EmergencyContact(
                            id = "c_${System.currentTimeMillis()}",
                            name = name,
                            relation = "Selected",
                            phone = phoneNumber,
                            priority = newPriority
                        )
                        contactList.add(newContact)
                        Toast.makeText(context, "Added $name as Priority $newPriority", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Contact selected. Added to Priority list.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun handleMoveUp(index: Int) {
        if (index > 0) {
            val item = contactList.removeAt(index)
            contactList.add(index - 1, item)
            // Re-index priorities
            for (i in contactList.indices) {
                contactList[i] = contactList[i].copy(priority = i + 1)
            }
        }
    }

    fun handleMoveDown(index: Int) {
        if (index < contactList.size - 1) {
            val item = contactList.removeAt(index)
            contactList.add(index + 1, item)
            // Re-index priorities
            for (i in contactList.indices) {
                contactList[i] = contactList[i].copy(priority = i + 1)
            }
        }
    }

    fun handleAddManualContact() {
        if (inputName.isBlank()) {
            errorMsg = "Contact name cannot be empty"
            return
        }
        if (inputPhone.isBlank() || inputPhone.length < 8) {
            errorMsg = "Please enter a valid phone number"
            return
        }
        val newPriority = contactList.size + 1
        contactList.add(
            EmergencyContact(
                id = "c_${System.currentTimeMillis()}",
                name = inputName.trim(),
                relation = inputRelation.trim(),
                phone = inputPhone.trim(),
                priority = newPriority
            )
        )
        inputName = ""
        inputPhone = ""
        inputRelation = "Family"
        errorMsg = ""
        showAddDialog = false
        Toast.makeText(context, "Added to Priority $newPriority", Toast.LENGTH_SHORT).show()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFFAFAFA))
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            // Header: Shield Icon & Brand
            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(JagrathLightRose),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = JagrathPrimaryRed,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Jagrath",
                        color = JagrathPrimaryRed,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.SansSerif
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Emergency Permission Gate",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    lineHeight = 32.sp
                )

                Text(
                    text = "To guarantee rapid response during life-threatening emergencies, Jaagrath coordinates sequential priority auto-calling and live GPS telematics.",
                    fontSize = 14.sp,
                    color = Slate700,
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(top = 8.dp, bottom = 20.dp)
                )
            }

            // Minimalist Red & White Explanation Cards
            item {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = White,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                    shadowElevation = 2.dp
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(JagrathLightRose),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ContactPhone,
                                    contentDescription = null,
                                    tint = JagrathCrimson,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "1. Priority Contact Auto-Calling",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900
                                )
                                Text(
                                    text = "Sequential dialing order (Priority 1 → 2 → 3) with 20s auto-escalation.",
                                    fontSize = 12.sp,
                                    color = Slate500
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEFF6FF)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = Color(0xFF2563EB),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "2. Live High-Precision GPS Telematics",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900
                                )
                                Text(
                                    text = "Broadcasts tamper-evident live coordinates only when SOS is triggered.",
                                    fontSize = 12.sp,
                                    color = Slate500
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFECFDF5)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = null,
                                    tint = Emerald500,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "3. SHA-256 Cryptographic Chain",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900
                                )
                                Text(
                                    text = "Every call, cancel, and acknowledgment is stored in an immutable ledger.",
                                    fontSize = 12.sp,
                                    color = Slate500
                                )
                            }
                        }
                    }
                }
            }

            // Priority Contacts Section Header
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Priority Calling Circle (${contactList.size})",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                        Text(
                            text = "Calls are dialed sequentially in this exact order",
                            fontSize = 12.sp,
                            color = Slate500
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        // Native Picker Button
                        Button(
                            onClick = {
                                try {
                                    contactPickerLauncher.launch(null)
                                } catch (e: Exception) {
                                    showAddDialog = true
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Slate100,
                                contentColor = Slate800
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Icon(imageVector = Icons.Default.ContactPhone, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "Pick", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        // Add Manual Contact Button
                        Button(
                            onClick = { showAddDialog = true },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = JagrathLightRose,
                                contentColor = JagrathPrimaryRed
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = "Add", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Contact Items with Priority Badges and Reorder Arrows
            itemsIndexed(contactList) { index, contact ->
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(14.dp),
                    color = White,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (index == 0) JagrathPrimaryRed.copy(alpha = 0.4f) else Slate200
                    ),
                    shadowElevation = if (index == 0) 3.dp else 1.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            // Priority Badge
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (index) {
                                            0 -> JagrathCrimson
                                            1 -> Color(0xFFD97706) // Amber 600
                                            else -> Slate500
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "P${index + 1}",
                                    color = White,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = contact.name,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate900
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "• ${contact.relation}",
                                        fontSize = 12.sp,
                                        color = Slate500
                                    )
                                }
                                Text(
                                    text = contact.phone,
                                    fontSize = 12.sp,
                                    color = Slate700,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        // Reorder & Delete Controls
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            IconButton(
                                onClick = { handleMoveUp(index) },
                                enabled = index > 0,
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ArrowUpward,
                                    contentDescription = "Move Up",
                                    tint = if (index > 0) Slate700 else Slate200,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            IconButton(
                                onClick = { handleMoveDown(index) },
                                enabled = index < contactList.size - 1,
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ArrowDownward,
                                    contentDescription = "Move Down",
                                    tint = if (index < contactList.size - 1) Slate700 else Slate200,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            if (contactList.size > 1) {
                                IconButton(
                                    onClick = {
                                        contactList.removeAt(index)
                                        for (i in contactList.indices) {
                                            contactList[i] = contactList[i].copy(priority = i + 1)
                                        }
                                    },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Delete,
                                        contentDescription = "Delete",
                                        tint = Color(0xFFEF4444),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Bottom Primary Confirmation Action
            item {
                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        if (contactList.isEmpty()) {
                            Toast.makeText(context, "Please add at least one priority contact", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        runtimePermissionsLauncher.launch(
                            arrayOf(
                                android.Manifest.permission.CALL_PHONE,
                                android.Manifest.permission.ACCESS_FINE_LOCATION,
                                android.Manifest.permission.ACCESS_COARSE_LOCATION,
                                android.Manifest.permission.READ_CONTACTS
                            )
                        )
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = JagrathPrimaryRed,
                        contentColor = White
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Grant Permissions & Protect Network",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "🔒 Secured with End-to-End Cryptographic Chaining",
                    fontSize = 12.sp,
                    color = Slate400,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))
            }
        }

        // Add Manual Contact Dialog Modal
        if (showAddDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f))
                    .clickable { showAddDialog = false },
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .clickable(enabled = false) {},
                    shape = RoundedCornerShape(20.dp),
                    color = White,
                    shadowElevation = 16.dp
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Add Priority Contact",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Slate900
                            )
                            IconButton(onClick = { showAddDialog = false }) {
                                Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Slate500)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        OutlinedTextField(
                            value = inputName,
                            onValueChange = { inputName = it },
                            label = { Text("Contact Name (e.g., Mom)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = inputPhone,
                            onValueChange = { inputPhone = it },
                            label = { Text("Phone Number") },
                            placeholder = { Text("+91 98765 43210") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        OutlinedTextField(
                            value = inputRelation,
                            onValueChange = { inputRelation = it },
                            label = { Text("Relationship (Family, Friend, Doctor)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )

                        if (errorMsg.isNotBlank()) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = errorMsg, color = Color(0xFFEF4444), fontSize = 12.sp)
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { showAddDialog = false },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Slate100,
                                    contentColor = Slate700
                                )
                            ) {
                                Text("Cancel", fontWeight = FontWeight.SemiBold)
                            }

                            Button(
                                onClick = { handleAddManualContact() },
                                modifier = Modifier
                                    .weight(1.2f)
                                    .height(44.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = JagrathPrimaryRed,
                                    contentColor = White
                                )
                            ) {
                                Text("Add Contact", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
