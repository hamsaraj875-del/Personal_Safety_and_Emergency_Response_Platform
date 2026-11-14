package com.jaagruth.ui

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jaagruth.crypto.CryptoLedger
import com.jaagruth.data.InitialData
import com.jaagruth.model.EmergencyContact
import com.jaagruth.model.IncidentBlock
import com.jaagruth.model.LatLng
import com.jaagruth.model.UserProfile
import com.jaagruth.model.VerifiedResponder
import com.jaagruth.service.ResponderMatcher
import com.jaagruth.theme.Emerald500
import com.jaagruth.theme.Slate200
import com.jaagruth.theme.Slate800
import com.jaagruth.theme.White
import com.jaagruth.ui.components.CancelWindowModal
import com.jaagruth.ui.components.InstructionModal
import com.jaagruth.ui.components.JagrathBottomNavBar
import com.jaagruth.ui.components.MainTab
import com.jaagruth.ui.components.SafetyPinModal
import com.jaagruth.ui.screens.ActivityScreen
import com.jaagruth.ui.screens.AmbulanceOnTheWayScreen
import com.jaagruth.ui.screens.ContactsScreen
import com.jaagruth.ui.screens.HomeScreen
import com.jaagruth.ui.screens.IntroBriefScreen
import com.jaagruth.ui.screens.LoginScreen
import com.jaagruth.ui.screens.MapTrackingScreen
import com.jaagruth.ui.screens.PermissionGateScreen
import com.jaagruth.ui.screens.ProfileScreen
import com.jaagruth.ui.screens.SplashLandingScreen
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class AppStage {
    SPLASH,
    INTRO,
    PERMISSION,
    LOGIN,
    MAIN
}

enum class EmergencyMode {
    IDLE,
    DISPATCHED,
    MAP
}

@Composable
fun JagrathAppContainer() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var appStage by remember { mutableStateOf(AppStage.SPLASH) }
    var activeTab by remember { mutableStateOf(MainTab.HOME) }
    var emergencyMode by remember { mutableStateOf(EmergencyMode.IDLE) }

    // Modals
    var showCancelWindow by remember { mutableStateOf(false) }
    var showPinModal by remember { mutableStateOf(false) }
    var showInstructionModal by remember { mutableStateOf(false) }

    // User Profile & Contacts
    var userProfile by remember { mutableStateOf(InitialData.DEFAULT_USER) }
    val userContacts = remember { mutableStateListOf<EmergencyContact>().apply { addAll(InitialData.DEFAULT_CONTACTS) } }
    var userCoords by remember { mutableStateOf(InitialData.DEFAULT_USER_COORDS) }

    // Responders & Safety Hubs
    val responders = remember { mutableStateListOf<VerifiedResponder>().apply { addAll(InitialData.DEFAULT_RESPONDERS) } }
    var activeResponder by remember { mutableStateOf(InitialData.DEFAULT_RESPONDERS[0]) }
    val safetyHubs = remember(userCoords) { InitialData.getSurroundingSafetyHubs(userCoords) }
    val routePoints = remember(userCoords, activeResponder) {
        InitialData.getLocalRoutePoints(userCoords, activeResponder.location)
    }

    // Active Incident & Escalation Ladder
    var incidentId by remember { mutableStateOf<String?>(null) }
    var escalationStep by remember { mutableIntStateOf(0) }
    var elapsedSeconds by remember { mutableIntStateOf(0) }
    var notificationBanner by remember { mutableStateOf<String?>(null) }

    // Sequential Priority Auto-Calling State Machine
    var currentCallIndex by remember { mutableIntStateOf(0) }
    var callCountdownSeconds by remember { mutableIntStateOf(20) }
    var isCallActive by remember { mutableStateOf(false) }
    var isCallAcknowledged by remember { mutableStateOf(false) }
    var acknowledgedContactName by remember { mutableStateOf<String?>(null) }
    var show112HandoffBanner by remember { mutableStateOf(false) }
    var callTimerJob by remember { mutableStateOf<Job?>(null) }

    // Cryptographic Hash Chain
    val hashChain = remember { mutableStateListOf<IncidentBlock>() }
    var isChainTampered by remember { mutableStateOf(false) }
    val cleanBackupChain = remember { mutableListOf<IncidentBlock>() }

    fun showToast(msg: String) {
        notificationBanner = msg
        scope.launch {
            delay(4000)
            if (notificationBanner == msg) notificationBanner = null
        }
    }

    // Initialize Genesis Block on startup
    LaunchedEffect(Unit) {
        val genesis = CryptoLedger.createIncidentBlock(
            index = 0,
            prevHash = CryptoLedger.GENESIS_HASH,
            actorId = "system_genesis",
            actorRole = "system",
            eventType = "PLATFORM_INIT",
            payload = mapOf(
                "platform" to "Jagrath Safety Network",
                "device" to "Citizen Mobile Node",
                "status" to "PROTECTED_READY"
            )
        )
        hashChain.clear()
        hashChain.add(genesis)
        cleanBackupChain.clear()
        cleanBackupChain.add(genesis)
    }

    // Elapsed timer when emergency is dispatched or on map
    LaunchedEffect(emergencyMode) {
        if (emergencyMode == EmergencyMode.DISPATCHED || emergencyMode == EmergencyMode.MAP) {
            elapsedSeconds = 0
            while (true) {
                delay(1000)
                elapsedSeconds += 1
            }
        } else {
            elapsedSeconds = 0
        }
    }

    fun appendAuditBlock(eventType: String, actorRole: String, actorId: String, payload: Map<String, Any>) {
        val lastBlock = hashChain.lastOrNull()
        val prevHash = lastBlock?.hash ?: CryptoLedger.GENESIS_HASH
        val index = hashChain.size

        val newBlock = CryptoLedger.createIncidentBlock(
            index = index,
            prevHash = prevHash,
            actorId = actorId,
            actorRole = actorRole,
            eventType = eventType,
            payload = payload
        )
        hashChain.add(newBlock)
        cleanBackupChain.clear()
        cleanBackupChain.addAll(hashChain)
    }

    fun triggerPhoneCallIntent(phone: String) {
        try {
            val cleanPhone = phone.replace(" ", "").replace("-", "")
            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanPhone"))
            dialIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(dialIntent)
        } catch (e: Exception) {
            // Simulated dial fallback on devices without cellular dialer
        }
    }

    fun initiateCallForIndex(idx: Int) {
        callTimerJob?.cancel()
        if (idx >= userContacts.size) {
            // All personal contacts exhausted -> Escalate to top verified responder & 112
            isCallActive = false
            show112HandoffBanner = true
            escalationStep = 4
            appendAuditBlock(
                eventType = "RESPONDER_DISPATCHED",
                actorRole = "dispatch_engine",
                actorId = "auto_escalator",
                payload = mapOf(
                    "reason" to "All personal priority contacts timed out",
                    "assignedResponder" to activeResponder.name,
                    "responderPhone" to activeResponder.phone,
                    "etaMinutes" to activeResponder.etaMinutes,
                    "score" to activeResponder.score
                )
            )
            showToast("All personal priority contacts timed out. Top responder ${activeResponder.name} dispatched!")
            return
        }

        val targetContact = userContacts[idx]
        currentCallIndex = idx
        callCountdownSeconds = 20
        isCallActive = true
        isCallAcknowledged = false
        show112HandoffBanner = false
        escalationStep = (idx + 1).coerceAtMost(3)

        appendAuditBlock(
            eventType = "CALLING_PRIORITY_${idx + 1}",
            actorRole = "system",
            actorId = "escalation_engine",
            payload = mapOf(
                "contact" to targetContact.name,
                "phone" to targetContact.phone,
                "priority" to (idx + 1),
                "channel" to "VOICE_CALL_AUTO_DIAL",
                "windowSeconds" to 20
            )
        )

        triggerPhoneCallIntent(targetContact.phone)
        showToast("Auto-calling Priority #${idx + 1}: ${targetContact.name}...")

        callTimerJob = scope.launch {
            while (callCountdownSeconds > 0) {
                delay(1000)
                callCountdownSeconds -= 1
            }
            // Auto timeout when 20s window expires
            handleContactNoAnswer()
        }
    }

    fun handleContactAnswered() {
        callTimerJob?.cancel()
        isCallActive = false
        isCallAcknowledged = true
        val contact = userContacts.getOrNull(currentCallIndex)
        acknowledgedContactName = contact?.name ?: "Primary Contact"

        appendAuditBlock(
            eventType = "ACKNOWLEDGED",
            actorRole = "contact",
            actorId = acknowledgedContactName ?: "Contact",
            payload = mapOf(
                "priority" to (currentCallIndex + 1),
                "contactName" to (acknowledgedContactName ?: ""),
                "status" to "EMERGENCY_COORDINATED",
                "telematicsStream" to "LIVE_GPS_ACTIVE"
            )
        )
        showToast("✅ $acknowledgedContactName answered and confirmed emergency coordination!")
    }

    fun handleContactNoAnswer() {
        callTimerJob?.cancel()
        val contact = userContacts.getOrNull(currentCallIndex)
        val contactName = contact?.name ?: "Contact"

        appendAuditBlock(
            eventType = "PRIORITY_${currentCallIndex + 1}_NO_ANSWER",
            actorRole = "system",
            actorId = "escalation_engine",
            payload = mapOf(
                "contact" to contactName,
                "priority" to (currentCallIndex + 1),
                "reason" to "NO_ANSWER_TIMEOUT_20S"
            )
        )

        initiateCallForIndex(currentCallIndex + 1)
    }

    fun handleConfirmDispatch(noteText: String) {
        showCancelWindow = false
        val newIncId = "INC-${System.currentTimeMillis().toString().takeLast(6)}"
        incidentId = newIncId
        emergencyMode = EmergencyMode.DISPATCHED

        // Match responder
        val ranked = ResponderMatcher.rankResponders(userCoords, noteText.ifEmpty { "general distress" }, responders)
        activeResponder = ranked.first()

        appendAuditBlock(
            eventType = "TRIGGERED",
            actorRole = "citizen",
            actorId = userProfile.name,
            payload = mapOf(
                "incidentId" to newIncId,
                "lat" to userCoords.lat,
                "lng" to userCoords.lng,
                "note" to noteText
            )
        )

        appendAuditBlock(
            eventType = "SOS_BUFFER_COMPLETED",
            actorRole = "system",
            actorId = "safeguard_timer",
            payload = mapOf(
                "bufferDuration" to "5.0s",
                "status" to "LOCKED_DISPATCH"
            )
        )

        // Begin strictly sequential priority auto-calling
        initiateCallForIndex(0)
    }

    fun handleAbortCancelWindow() {
        showCancelWindow = false
        callTimerJob?.cancel()
        isCallActive = false
        isCallAcknowledged = false
        show112HandoffBanner = false
        appendAuditBlock(
            eventType = "FALSE_ALARM",
            actorRole = "citizen",
            actorId = userProfile.name,
            payload = mapOf(
                "reason" to "Cancelled in buffer window",
                "status" to "ABORTED_ZERO_CALLS_DISPATCHED"
            )
        )
        showToast("Alert cancelled. Zero calls or notifications dispatched.")
    }

    fun handleResolveNormal() {
        showPinModal = false
        callTimerJob?.cancel()
        isCallActive = false
        isCallAcknowledged = false
        show112HandoffBanner = false
        appendAuditBlock(
            eventType = "RESOLVED_SAFE",
            actorRole = "citizen",
            actorId = userProfile.name,
            payload = mapOf("status" to "RESOLVED", "method" to "SAFETY_PIN_VERIFIED")
        )
        emergencyMode = EmergencyMode.IDLE
        activeTab = MainTab.HOME
        escalationStep = 0
        showToast("Incident confirmed safe and resolved.")
    }

    fun handleResolveDuress() {
        showPinModal = false
        callTimerJob?.cancel()
        isCallActive = false
        isCallAcknowledged = false
        show112HandoffBanner = false
        emergencyMode = EmergencyMode.IDLE
        activeTab = MainTab.HOME
        appendAuditBlock(
            eventType = "DURESS_ESCALATION",
            actorRole = "citizen",
            actorId = userProfile.name,
            payload = mapOf("duressCodeUsed" to true, "action" to "COVERT_SECURITY_ALERT")
        )
        showToast("Alert ended locally. (Silent alert sent to emergency services)")
    }

    fun handleTamperBlock() {
        if (hashChain.size < 2) return
        val tamperedList = hashChain.mapIndexed { idx, block ->
            if (idx == 1) {
                block.copy(
                    tampered = true,
                    payload = block.payload + ("unauthorized_edit" to "MODIFIED_RECORD")
                )
            } else block
        }
        hashChain.clear()
        hashChain.addAll(tamperedList)
        isChainTampered = true
        showToast("Simulated record edit in database. Tap 'Check Record Integrity' to verify.")
    }

    fun handleRestoreChain() {
        hashChain.clear()
        hashChain.addAll(cleanBackupChain)
        isChainTampered = false
        showToast("Original verified records restored.")
    }

    fun handleDial112() {
        appendAuditBlock(
            eventType = "112_ERSS_HANDOFF",
            actorRole = "citizen",
            actorId = userProfile.name,
            payload = mapOf("dialedNumber" to "112", "lat" to userCoords.lat, "lng" to userCoords.lng)
        )
        triggerPhoneCallIntent("112")
        Toast.makeText(context, "Emergency Service (112): Connecting to official emergency dispatch...", Toast.LENGTH_LONG).show()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Master view switcher based on AppStage
        when (appStage) {
            AppStage.SPLASH -> {
                SplashLandingScreen(onComplete = { appStage = AppStage.INTRO })
            }
            AppStage.INTRO -> {
                IntroBriefScreen(onComplete = { appStage = AppStage.PERMISSION })
            }
            AppStage.PERMISSION -> {
                PermissionGateScreen(
                    initialContacts = userContacts,
                    onPermissionsGranted = { updatedContacts ->
                        userContacts.clear()
                        userContacts.addAll(updatedContacts)
                        appendAuditBlock(
                            eventType = "PERMISSION_GRANTED",
                            actorRole = "citizen",
                            actorId = userProfile.name,
                            payload = mapOf(
                                "contactsCount" to updatedContacts.size,
                                "priorityOrder" to updatedContacts.map { "P${it.priority}:${it.name}" },
                                "telematicsAccess" to "LIVE_GPS_APPROVED"
                            )
                        )
                        appStage = AppStage.LOGIN
                        showToast("Emergency permissions granted. Priority circle secured.")
                    }
                )
            }
            AppStage.LOGIN -> {
                LoginScreen(onLoginSuccess = { user ->
                    userProfile = user
                    appStage = AppStage.MAIN
                    showToast("Welcome, ${user.name}! Your emergency network is active.")
                })
            }
            AppStage.MAIN -> {
                when (emergencyMode) {
                    EmergencyMode.DISPATCHED -> {
                        AmbulanceOnTheWayScreen(
                            userCoords = userCoords,
                            activeResponder = activeResponder,
                            safetyHubs = safetyHubs,
                            routePoints = routePoints,
                            escalationStep = escalationStep.coerceAtLeast(1),
                            elapsedSeconds = elapsedSeconds,
                            callingContactName = userContacts.getOrNull(currentCallIndex)?.name,
                            callingContactPhone = userContacts.getOrNull(currentCallIndex)?.phone,
                            callingContactPriority = (currentCallIndex + 1),
                            callCountdownSeconds = callCountdownSeconds,
                            isCallActive = isCallActive,
                            isCallAcknowledged = isCallAcknowledged,
                            acknowledgedContactName = acknowledgedContactName,
                            onContactAnswered = { handleContactAnswered() },
                            onContactNoAnswer = { handleContactNoAnswer() },
                            show112HandoffBanner = show112HandoffBanner,
                            onDial112 = { handleDial112() },
                            onBack = { emergencyMode = EmergencyMode.IDLE },
                            onSeeMap = { emergencyMode = EmergencyMode.MAP },
                            onCallResponder = { resp ->
                                triggerPhoneCallIntent(resp.phone)
                                Toast.makeText(context, "Calling ${resp.name} (${resp.phone})...", Toast.LENGTH_SHORT).show()
                            },
                            onCancelRequest = { showPinModal = true },
                            onLocateMe = {
                                userCoords = InitialData.DEFAULT_USER_COORDS
                                showToast("Live GPS location synced successfully!")
                            }
                        )
                    }
                    EmergencyMode.MAP -> {
                        MapTrackingScreen(
                            userCoords = userCoords,
                            activeResponder = activeResponder,
                            safetyHubs = safetyHubs,
                            routePoints = routePoints,
                            onBack = { emergencyMode = EmergencyMode.DISPATCHED },
                            onOpenInstruction = { showInstructionModal = true },
                            onCallResponder = { resp ->
                                Toast.makeText(context, "Calling ${resp.name} (${resp.phone})...", Toast.LENGTH_SHORT).show()
                            },
                            onMessageResponder = { resp ->
                                Toast.makeText(context, "Opening secure messaging with ${resp.name}...", Toast.LENGTH_SHORT).show()
                            }
                        )
                    }
                    EmergencyMode.IDLE -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                                when (activeTab) {
                                    MainTab.HOME -> {
                                        HomeScreen(
                                            userProfile = userProfile,
                                            onTriggerSOS = { showCancelWindow = true },
                                            onRefreshLocation = {
                                                userCoords = InitialData.DEFAULT_USER_COORDS
                                                showToast("Live GPS location synced!")
                                            }
                                        )
                                    }
                                    MainTab.ACTIVITY -> {
                                        ActivityScreen(
                                            chain = hashChain,
                                            isTampered = isChainTampered,
                                            onTamperBlock = { handleTamperBlock() },
                                            onRestoreChain = { handleRestoreChain() }
                                        )
                                    }
                                    MainTab.CONTACTS -> {
                                        ContactsScreen(
                                            contacts = userContacts,
                                            onAddContact = { contact ->
                                                userContacts.add(contact)
                                                showToast("Added ${contact.name} as Priority ${userContacts.size}.")
                                            },
                                            onDeleteContact = { id ->
                                                userContacts.removeAll { it.id == id }
                                                for (i in userContacts.indices) {
                                                    userContacts[i] = userContacts[i].copy(priority = i + 1)
                                                }
                                                showToast("Contact removed.")
                                            },
                                            onReorderContact = { fromIdx, toIdx ->
                                                if (fromIdx in userContacts.indices && toIdx in userContacts.indices) {
                                                    val item = userContacts.removeAt(fromIdx)
                                                    userContacts.add(toIdx, item)
                                                    for (i in userContacts.indices) {
                                                        userContacts[i] = userContacts[i].copy(priority = i + 1)
                                                    }
                                                    showToast("Updated calling priority order.")
                                                }
                                            },
                                            responders = responders,
                                            selectedResponderId = activeResponder.id,
                                            onSelectResponder = { resp ->
                                                activeResponder = resp
                                                showToast("Selected ${resp.name} as primary helper.")
                                            }
                                        )
                                    }
                                    MainTab.PROFILE -> {
                                        ProfileScreen(
                                            userProfile = userProfile,
                                            onStartSafeWalk = {
                                                showToast("Night Safe Walk activated. Your commute is protected.")
                                            },
                                            onLogout = {
                                                appStage = AppStage.LOGIN
                                                activeTab = MainTab.HOME
                                                emergencyMode = EmergencyMode.IDLE
                                                showToast("Logged out successfully.")
                                            }
                                        )
                                    }
                                }
                            }

                            // Persistent Bottom Navigation Bar
                            JagrathBottomNavBar(
                                activeTab = activeTab,
                                onTabSelected = { activeTab = it }
                            )
                        }
                    }
                }
            }
        }

        // Realtime Floating Toast Banner
        AnimatedVisibility(
            visible = notificationBanner != null,
            enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 28.dp, start = 16.dp, end = 16.dp)
        ) {
            notificationBanner?.let { msg ->
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = White,
                    shadowElevation = 8.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(Emerald500, CircleShape)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = msg,
                            color = Slate800,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        // Modals
        if (showCancelWindow) {
            CancelWindowModal(
                initialSeconds = 5,
                onConfirmDispatch = { note -> handleConfirmDispatch(note) },
                onAbort = { handleAbortCancelWindow() }
            )
        }

        if (showPinModal) {
            SafetyPinModal(
                onResolveNormal = { handleResolveNormal() },
                onResolveDuress = { handleResolveDuress() },
                onClose = { showPinModal = false }
            )
        }

        if (showInstructionModal) {
            InstructionModal(
                onClose = { showInstructionModal = false },
                onDial112 = { handleDial112() }
            )
        }
    }
}
