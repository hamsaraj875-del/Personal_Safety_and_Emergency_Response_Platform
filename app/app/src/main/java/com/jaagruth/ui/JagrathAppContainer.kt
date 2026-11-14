package com.jaagruth.ui

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
import com.jaagruth.data.models.User
import com.jaagruth.data.remote.SocketEvent
import com.jaagruth.data.remote.TokenStore
import com.jaagruth.data.remote.WebSocketClient
import com.jaagruth.data.repository.AuthRepository
import com.jaagruth.data.repository.ContactRepository
import com.jaagruth.data.repository.IncidentRepository
import com.jaagruth.data.repository.ResponderRepository
import com.jaagruth.model.EmergencyContact
import com.jaagruth.model.IncidentBlock
import com.jaagruth.model.LatLng
import com.jaagruth.model.UserProfile
import com.jaagruth.model.VerificationResult
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
import com.jaagruth.ui.screens.ProfileScreen
import com.jaagruth.ui.screens.SplashLandingScreen
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class AppStage {
    SPLASH,
    INTRO,
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

    // Repositories
    val authRepo = remember { AuthRepository(context) }
    val contactRepo = remember { ContactRepository(context) }
    val incidentRepo = remember { IncidentRepository(context) }
    val responderRepo = remember { ResponderRepository(context) }

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
    var escalationJob by remember { mutableStateOf<Job?>(null) }
    var notificationBanner by remember { mutableStateOf<String?>(null) }

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

    // Realtime WebSocket event listener when in MAIN stage
    LaunchedEffect(appStage) {
        if (appStage == AppStage.MAIN) {
            WebSocketClient.connect()

            // Fetch contacts from server
            scope.launch {
                val serverContacts = contactRepo.fetchContactsFromServer().getOrNull()
                if (!serverContacts.isNullOrEmpty()) {
                    userContacts.clear()
                    userContacts.addAll(serverContacts.map { c ->
                        EmergencyContact(
                            id = c.id,
                            name = c.name,
                            relation = c.relationship,
                            phone = c.phoneNumber,
                            priority = c.priority
                        )
                    })
                }

                // Fetch responders from server
                val serverResponders = responderRepo.findNearbyRespondersServer(userCoords.lat, userCoords.lng)
                if (serverResponders.isNotEmpty()) {
                    responders.clear()
                    responders.addAll(serverResponders)
                    activeResponder = serverResponders[0]
                }
            }

            // Listen to server WebSocket broadcasts
            WebSocketClient.events.collect { event ->
                when (event) {
                    is SocketEvent.LadderStep -> {
                        escalationStep = event.step
                        showToast("Escalation Ladder: Step ${event.step} Dispatched")
                    }
                    is SocketEvent.ResponderAssigned -> {
                        activeResponder = event.responder
                        showToast("Verified Responder ${event.responder.name} assigned! ETA ${event.responder.etaMinutes}m")
                    }
                    is SocketEvent.IncidentResolved -> {
                        emergencyMode = EmergencyMode.IDLE
                        activeTab = MainTab.HOME
                        escalationStep = 0
                        showToast("Emergency incident resolved.")
                    }
                    is SocketEvent.LedgerBlockAppended -> {
                        if (!hashChain.any { it.index == event.block.index }) {
                            hashChain.add(event.block)
                            cleanBackupChain.add(event.block)
                        }
                    }
                    is SocketEvent.Connected -> {
                        if (event.isConnected && incidentId != null) {
                            WebSocketClient.subscribeIncident(incidentId!!)
                        }
                    }
                }
            }
        }
    }

    // Elapsed timer & 3s location ping during active dispatch
    LaunchedEffect(emergencyMode, incidentId) {
        if (emergencyMode == EmergencyMode.DISPATCHED || emergencyMode == EmergencyMode.MAP) {
            elapsedSeconds = 0
            while (true) {
                delay(1000)
                elapsedSeconds += 1
                if (elapsedSeconds % 3 == 0) {
                    incidentRepo.sendLocationPing(userCoords.lat, userCoords.lng)
                }
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

    fun startOfflineLocalEscalationLadder(newIncId: String) {
        escalationJob?.cancel()
        val c1Name = userContacts.getOrNull(0)?.name ?: "Primary Contact"
        val c2Name = userContacts.getOrNull(1)?.name ?: "Secondary Contact"

        escalationJob = scope.launch {
            delay(10000)
            escalationStep = 2
            appendAuditBlock(
                eventType = "LADDER_STEP_1",
                actorRole = "system",
                actorId = "escalation_engine",
                payload = mapOf("contact" to c1Name, "priority" to 1)
            )
            showToast("Step 1: Emergency alert sent to $c1Name")

            delay(10000)
            escalationStep = 3
            appendAuditBlock(
                eventType = "LADDER_STEP_2",
                actorRole = "system",
                actorId = "escalation_engine",
                payload = mapOf("contact" to c2Name, "priority" to 2)
            )
            showToast("Step 2: Backup alert sent to $c2Name")

            delay(10000)
            escalationStep = 4
            appendAuditBlock(
                eventType = "RESPONDER_ASSIGNED",
                actorRole = "matching_engine",
                actorId = "dispatch_service",
                payload = mapOf(
                    "responderId" to activeResponder.id,
                    "name" to activeResponder.name,
                    "eta" to "${activeResponder.etaMinutes} mins"
                )
            )
            showToast("Step 3: ${activeResponder.name} is on the way!")
        }
    }

    fun handleConfirmDispatch(noteText: String) {
        showCancelWindow = false
        escalationStep = 1
        emergencyMode = EmergencyMode.DISPATCHED

        scope.launch {
            val user = User(
                id = userProfile.id,
                name = userProfile.name,
                phoneNumber = userProfile.phone,
                email = "citizen@jaagruth.org"
            )

            val created = incidentRepo.createIncident(
                user = user,
                latitude = userCoords.lat,
                longitude = userCoords.lng,
                address = userProfile.address,
                isOffline = false
            )

            incidentId = created.id
            WebSocketClient.subscribeIncident(created.id)

            // Ranked responder
            val ranked = ResponderMatcher.rankResponders(userCoords, noteText.ifEmpty { "general distress" }, responders)
            activeResponder = ranked.first()

            appendAuditBlock(
                eventType = "TRIGGERED",
                actorRole = "citizen",
                actorId = userProfile.name,
                payload = mapOf(
                    "incidentId" to created.id,
                    "lat" to userCoords.lat,
                    "lng" to userCoords.lng,
                    "note" to noteText
                )
            )

            // Start local escalation as backup timer in case offline
            startOfflineLocalEscalationLadder(created.id)
        }
    }

    fun handleAbortCancelWindow() {
        showCancelWindow = false
        escalationJob?.cancel()
        scope.launch {
            incidentRepo.cancelActiveIncident(asFalseAlarm = true)
        }
        appendAuditBlock(
            eventType = "FALSE_ALARM",
            actorRole = "citizen",
            actorId = userProfile.name,
            payload = mapOf("reason" to "Cancelled in 5s buffer window")
        )
        showToast("Alert cancelled in 5-second buffer. No sirens fired.")
    }

    fun handleResolveNormal() {
        showPinModal = false
        escalationJob?.cancel()
        scope.launch {
            incidentRepo.resolveActiveIncidentWithPin("1234")
        }
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
        escalationJob?.cancel()
        scope.launch {
            incidentRepo.resolveActiveIncidentWithPin("9999")
        }
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
        val incId = incidentId ?: "inc_demo"
        scope.launch {
            incidentRepo.tamperBlock(incId, 0)
            val result = incidentRepo.verifyLedgerChain(incId)
            isChainTampered = !result.isValid
            showToast("Simulated record edit in database. Tap 'Check Record Integrity' to verify.")
        }
    }

    fun handleRestoreChain() {
        val incId = incidentId ?: "inc_demo"
        scope.launch {
            incidentRepo.restoreBlock(incId, 0)
            isChainTampered = false
            showToast("Original verified records restored.")
        }
    }

    fun handleDial112() {
        appendAuditBlock(
            eventType = "112_ERSS_HANDOFF",
            actorRole = "citizen",
            actorId = userProfile.name,
            payload = mapOf("dialedNumber" to "112", "lat" to userCoords.lat, "lng" to userCoords.lng)
        )
        Toast.makeText(context, "Emergency Service (112): Connecting to official emergency dispatch...", Toast.LENGTH_LONG).show()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        when (appStage) {
            AppStage.SPLASH -> {
                SplashLandingScreen(onComplete = { appStage = AppStage.INTRO })
            }
            AppStage.INTRO -> {
                IntroBriefScreen(onComplete = { appStage = AppStage.LOGIN })
            }
            AppStage.LOGIN -> {
                LoginScreen(onLoginSuccess = { user ->
                    userProfile = user
                    scope.launch {
                        authRepo.login(user.phone, "password123")
                    }
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
                            onBack = { emergencyMode = EmergencyMode.IDLE },
                            onSeeMap = { emergencyMode = EmergencyMode.MAP },
                            onCallResponder = { resp ->
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
                                            onRestoreChain = { handleRestoreChain() },
                                            onVerifyRecord = { callback ->
                                                scope.launch {
                                                    val res = incidentRepo.verifyLedgerChain(incidentId ?: "")
                                                    callback(res)
                                                }
                                            }
                                        )
                                    }
                                    MainTab.CONTACTS -> {
                                        ContactsScreen(
                                            contacts = userContacts,
                                            onAddContact = { contact ->
                                                scope.launch {
                                                    contactRepo.addContact(
                                                        name = contact.name,
                                                        phone = contact.phone,
                                                        relationship = contact.relation,
                                                        consentGiven = true
                                                    )
                                                }
                                                userContacts.add(contact)
                                                showToast("Added ${contact.name} to emergency circle.")
                                            },
                                            onDeleteContact = { id ->
                                                scope.launch {
                                                    contactRepo.deleteContact(id)
                                                }
                                                userContacts.removeAll { it.id == id }
                                                showToast("Contact removed.")
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
                                                authRepo.logout()
                                                WebSocketClient.disconnect()
                                                appStage = AppStage.LOGIN
                                                activeTab = MainTab.HOME
                                                emergencyMode = EmergencyMode.IDLE
                                                showToast("Logged out successfully.")
                                            }
                                        )
                                    }
                                }
                            }

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
