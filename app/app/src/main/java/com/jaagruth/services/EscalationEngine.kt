package com.jaagruth.services

import com.jaagruth.data.models.Contact
import com.jaagruth.data.models.Incident
import com.jaagruth.data.models.IncidentStatus
import com.jaagruth.data.models.Responder
import com.jaagruth.data.repository.ContactRepository
import com.jaagruth.data.repository.IncidentRepository
import com.jaagruth.data.repository.ResponderRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

enum class StepState {
    PENDING,
    ACTIVE,
    COMPLETED,
    FAILED_OR_TIMED_OUT
}

data class LadderStep(
    val stepIndex: Int,
    val title: String,
    val subtitle: String,
    val state: StepState = StepState.PENDING
)

data class EscalationState(
    val currentStepIndex: Int = 1,
    val currentStepName: String = "Contact 1",
    val nextStepName: String = "Contact 2",
    val secondsRemaining: Int = 10,
    val totalSecondsForStep: Int = 10,
    val steps: List<LadderStep> = emptyList(),
    val isRunning: Boolean = false,
    val currentStatus: IncidentStatus = IncidentStatus.TRIGGERED,
    val assignedResponder: Responder? = null,
    val rankingExplanation: String = ""
)

class EscalationEngine(
    private val incidentRepository: IncidentRepository,
    private val contactRepository: ContactRepository,
    private val responderRepository: ResponderRepository,
    private val notificationService: NotificationService,
    private val smsCallService: SmsCallService
) {

    private val scope = CoroutineScope(Dispatchers.Default)
    private var timerJob: Job? = null

    private val _escalationState = MutableStateFlow(createInitialLadder(10))
    val escalationState: StateFlow<EscalationState> = _escalationState.asStateFlow()

    private var currentIncident: Incident? = null
    private var isFastMode: Boolean = true

    private fun getStepDuration(): Int = if (isFastMode) 10 else 60

    fun startEscalation(incident: Incident, fastMode: Boolean = true) {
        stopEscalation()
        currentIncident = incident
        isFastMode = fastMode

        val duration = getStepDuration()
        _escalationState.value = createInitialLadder(duration).copy(
            isRunning = true,
            currentStatus = IncidentStatus.NOTIFYING
        )

        notificationService.showEmergencyTriggered(incident.id)

        // Notify step 1: Contact 1
        notifyContactStep(1)

        startStepTimer(1)
    }

    private fun startStepTimer(stepIndex: Int) {
        timerJob?.cancel()
        val stepDuration = getStepDuration()

        timerJob = scope.launch {
            for (sec in stepDuration downTo 0) {
                if (!isActive) break

                updateStepCountdown(stepIndex, sec, stepDuration)
                delay(1000L)
            }

            if (isActive) {
                onStepTimedOut(stepIndex)
            }
        }
    }

    private fun updateStepCountdown(stepIndex: Int, remainingSeconds: Int, totalSeconds: Int) {
        val currentSteps = _escalationState.value.steps.map { step ->
            when {
                step.stepIndex < stepIndex -> step.copy(state = if (step.state == StepState.PENDING || step.state == StepState.ACTIVE) StepState.FAILED_OR_TIMED_OUT else step.state)
                step.stepIndex == stepIndex -> step.copy(state = StepState.ACTIVE)
                else -> step.copy(state = StepState.PENDING)
            }
        }

        val nextIndex = (stepIndex + 1).coerceAtMost(5)
        val currentName = getStepName(stepIndex)
        val nextName = if (stepIndex < 5) getStepName(nextIndex) else "112 Prompt"

        _escalationState.value = _escalationState.value.copy(
            currentStepIndex = stepIndex,
            currentStepName = currentName,
            nextStepName = nextName,
            secondsRemaining = remainingSeconds,
            totalSecondsForStep = totalSeconds,
            steps = currentSteps
        )
    }

    private fun onStepTimedOut(stepIndex: Int) {
        val inc = currentIncident ?: return

        when (stepIndex) {
            1 -> {
                incidentRepository.addEvent(
                    "Contact 1 Did Not Acknowledge",
                    "No response received from primary contact within timeout window.",
                    IncidentStatus.NOTIFYING,
                    inc.isOffline
                )
                // Advance to Contact 2
                notifyContactStep(2)
                startStepTimer(2)
            }
            2 -> {
                incidentRepository.addEvent(
                    "Contact 2 Did Not Acknowledge",
                    "No response from secondary contact. Escalating to nearest responder.",
                    IncidentStatus.NOTIFYING,
                    inc.isOffline
                )
                // Advance to Nearest Responder
                executeSmartResponderDispatch()
                startStepTimer(3)
            }
            3 -> {
                incidentRepository.addEvent(
                    "Responder Dispatch Pending",
                    "Escalating incident notification to central emergency administration.",
                    IncidentStatus.EN_ROUTE,
                    inc.isOffline
                )
                // Advance to Admin
                notifyAdminStep()
                startStepTimer(4)
            }
            4 -> {
                incidentRepository.addEvent(
                    "Central Admin Notified",
                    "Emergency dispatch supervisory prompt initiated.",
                    IncidentStatus.EN_ROUTE,
                    inc.isOffline
                )
                // Advance to Call 112
                promptEmergency112Step()
                startStepTimer(5)
            }
            5 -> {
                incidentRepository.addEvent(
                    "Emergency 112 Ready",
                    "Emergency direct dial 112 prompt active on screen.",
                    IncidentStatus.EN_ROUTE,
                    inc.isOffline
                )
            }
        }
    }

    private fun notifyContactStep(contactNumber: Int) {
        val inc = currentIncident ?: return
        val contacts = contactRepository.contacts.value
        val contact = contacts.getOrNull(contactNumber - 1)

        val contactName = contact?.name ?: "Contact $contactNumber"
        val relationship = contact?.relationship ?: "Emergency Network"

        incidentRepository.addEvent(
            "$contactName Notified",
            "Emergency notification sent to $contactName ($relationship)",
            IncidentStatus.NOTIFYING,
            inc.isOffline
        )
        notificationService.showEscalationAlert("Contact Alerted", "Notified $contactName ($relationship)")

        if (inc.isOffline && contact != null) {
            smsCallService.prepareEmergencySms(
                phoneNumber = contact.phoneNumber,
                userName = inc.userName,
                latitude = inc.latitude,
                longitude = inc.longitude,
                incidentId = inc.id
            )
        }
    }

    private fun executeSmartResponderDispatch() {
        val inc = currentIncident ?: return
        val (best, _) = responderRepository.findBestResponder(inc.latitude, inc.longitude)

        if (best != null) {
            inc.assignedResponder = best
            val reason = best.rankingReason
            incidentRepository.addEvent(
                "Nearest Responder Selected",
                "$reason (Score: ${String.format("%.1f", best.score)})",
                IncidentStatus.RESPONDER_ASSIGNED,
                inc.isOffline
            )
            notificationService.showEscalationAlert("Responder Selected", "${best.name} (${best.category}) matched")

            _escalationState.value = _escalationState.value.copy(
                assignedResponder = best,
                rankingExplanation = reason,
                currentStatus = IncidentStatus.RESPONDER_ASSIGNED
            )
        }
    }

    private fun notifyAdminStep() {
        val inc = currentIncident ?: return
        incidentRepository.addEvent(
            "Admin Coordination Center Alerted",
            "Incident forwarded to Jaagruth emergency supervisor dashboard.",
            IncidentStatus.EN_ROUTE,
            inc.isOffline
        )
        notificationService.showEscalationAlert("Admin Alerted", "Incident logged with emergency response monitor")
    }

    private fun promptEmergency112Step() {
        val inc = currentIncident ?: return
        incidentRepository.addEvent(
            "Call 112 Option Active",
            "Direct National Emergency Services (112) dialer handoff prompted to user.",
            IncidentStatus.EN_ROUTE,
            inc.isOffline
        )
        notificationService.showEscalationAlert("Call 112", "Emergency Services dialer ready")
    }

    // --- Developer Demo Controls ---

    fun demoContactAcknowledges() {
        val inc = currentIncident ?: return
        timerJob?.cancel()

        val updatedSteps = _escalationState.value.steps.mapIndexed { index, step ->
            if (index == 0) step.copy(state = StepState.COMPLETED) else step
        }

        incidentRepository.addEvent(
            "Contact Acknowledged",
            "Ananya verified emergency message and acknowledged response.",
            IncidentStatus.ACKNOWLEDGED,
            inc.isOffline
        )

        _escalationState.value = _escalationState.value.copy(
            steps = updatedSteps,
            currentStatus = IncidentStatus.ACKNOWLEDGED
        )

        // Continue escalation to responder dispatch
        executeSmartResponderDispatch()
        startStepTimer(3)
    }

    fun demoResponderAccepts() {
        val inc = currentIncident ?: return
        val responder = _escalationState.value.assignedResponder ?: run {
            executeSmartResponderDispatch()
            _escalationState.value.assignedResponder
        }

        val responderName = responder?.name ?: "Ravi Kumar"
        incidentRepository.addEvent(
            "Responder Accepted",
            "$responderName accepted emergency dispatch and is en route.",
            IncidentStatus.EN_ROUTE,
            inc.isOffline
        )

        val updatedSteps = _escalationState.value.steps.mapIndexed { index, step ->
            if (index <= 2) step.copy(state = StepState.COMPLETED) else step
        }

        _escalationState.value = _escalationState.value.copy(
            steps = updatedSteps,
            currentStatus = IncidentStatus.EN_ROUTE
        )
    }

    fun demoSimulateResponderArrival() {
        val inc = currentIncident ?: return
        val responderName = _escalationState.value.assignedResponder?.name ?: "Ravi Kumar"

        incidentRepository.addEvent(
            "Responder On Scene",
            "$responderName has arrived at the emergency location.",
            IncidentStatus.ON_SCENE,
            inc.isOffline
        )

        val updatedSteps = _escalationState.value.steps.map { it.copy(state = StepState.COMPLETED) }

        _escalationState.value = _escalationState.value.copy(
            steps = updatedSteps,
            currentStatus = IncidentStatus.ON_SCENE
        )
    }

    fun demoMarkResolved() {
        val inc = currentIncident ?: return
        timerJob?.cancel()

        incidentRepository.addEvent(
            "Incident Resolved",
            "Emergency situation handled and marked resolved.",
            IncidentStatus.RESOLVED,
            inc.isOffline
        )
        incidentRepository.updateStatus(IncidentStatus.RESOLVED)

        _escalationState.value = _escalationState.value.copy(
            isRunning = false,
            currentStatus = IncidentStatus.RESOLVED
        )
        notificationService.cancelActiveNotification()
    }

    fun demoResetIncident() {
        stopEscalation()
        incidentRepository.cancelActiveIncident(asFalseAlarm = true)
        _escalationState.value = createInitialLadder(getStepDuration())
    }

    fun stopEscalation() {
        timerJob?.cancel()
        timerJob = null
        currentIncident = null
        notificationService.cancelActiveNotification()
    }

    private fun getStepName(stepIndex: Int): String = when (stepIndex) {
        1 -> "Contact 1"
        2 -> "Contact 2"
        3 -> "Nearest Responder"
        4 -> "Admin Notification"
        5 -> "Call 112"
        else -> "Call 112"
    }

    private fun createInitialLadder(stepDuration: Int): EscalationState {
        val steps = listOf(
            LadderStep(1, "Contact 1", "Ananya (Sister)", StepState.PENDING),
            LadderStep(2, "Contact 2", "Rahul (Friend)", StepState.PENDING),
            LadderStep(3, "Nearest Responder", "Smart Responder Matching", StepState.PENDING),
            LadderStep(4, "Admin", "Incident Supervision", StepState.PENDING),
            LadderStep(5, "Call 112", "Emergency Dialing Prompt", StepState.PENDING)
        )
        return EscalationState(
            currentStepIndex = 1,
            currentStepName = "Contact 1",
            nextStepName = "Contact 2",
            secondsRemaining = stepDuration,
            totalSecondsForStep = stepDuration,
            steps = steps,
            isRunning = false,
            currentStatus = IncidentStatus.TRIGGERED
        )
    }
}
