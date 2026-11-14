import { Incident } from '../models/Incident.js';
import { Contact } from '../models/Contact.js';
import { User } from '../models/User.js';
import { IncidentService } from './incidentService.js';
import { ResponderMatcher } from './responderMatcher.js';
import { getNotifier } from '../notifiers/index.js';
import { broadcastToIncident, broadcastToAuthorities } from '../realtime/ws.js';
import { buildErss112Payload } from './erssHandoff.js';
import { LedgerBlock } from '../models/LedgerBlock.js';

let intervalId = null;

// Offset seconds from previous step
const STEP_DELAYS = {
  FAST: [0, 10, 10, 10, 10, 10], // Step 1: 10s, Step 2: +10s (20s), Step 3: +10s (30s), Step 4: +10s (40s), Step 5: +10s (50s)
  NORMAL: [0, 60, 60, 60, 60, 60],
  SPEC: [0, 5, 30, 30, 20, 35]
};

export function startEscalationScheduler() {
  if (intervalId) return;

  intervalId = setInterval(async () => {
    try {
      await tickEscalation();
    } catch (err) {
      console.error('Escalation tick error:', err.message);
    }
  }, 1000);

  console.log('Escalation persisted scheduler started (1-second tick).');
}

export function stopEscalationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function tickEscalation() {
  const now = new Date();

  // Find all active incidents where nextStepAt is due
  const dueIncidents = await Incident.find({
    status: { $in: ['TRIGGERED', 'NOTIFYING', 'ACKNOWLEDGED', 'RESPONDER_ASSIGNED'] },
    'ladder.nextStepAt': { $lte: now }
  });

  for (const incident of dueIncidents) {
    try {
      await executeNextLadderStep(incident);
    } catch (err) {
      console.error(`Error escalating incident ${incident.id}:`, err.message);
    }
  }
}

export async function executeNextLadderStep(incident) {
  const currentStep = incident.ladder.step || 0;
  const nextStepIndex = currentStep + 1;
  const profile = incident.speedProfile || 'FAST';
  const delays = STEP_DELAYS[profile] || STEP_DELAYS.FAST;
  const notifier = getNotifier();

  const user = await User.findById(incident.userId);
  const contacts = await Contact.find({ userId: incident.userId }).sort({ priority: 1 });
  const [lng, lat] = incident.location?.coordinates || [77.5358, 12.9352];

  if (nextStepIndex === 1) {
    // STEP 1: Contact 1 push + SMS with tracking link
    incident.ladder.step = 1;
    incident.status = 'NOTIFYING';

    const c1 = contacts[0];
    const trackingUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:4000'}/t/${incident.trackingToken}`;

    if (c1) {
      await notifier.sendPush({
        incidentId: incident.id,
        to: c1.phone,
        title: `EMERGENCY ALERT: ${incident.userName}`,
        body: `SOS triggered! Track live location and emergency status: ${trackingUrl}`
      });
      await notifier.sendSms({
        incidentId: incident.id,
        to: c1.phone,
        body: `EMERGENCY: ${incident.userName} triggered an SOS in Bengaluru. Track live: ${trackingUrl}`
      });
    }

    // Update step state
    updateStepInIncident(incident, 1, 'ACTIVE');
    const nextDelay = delays[1] || 10;
    incident.ladder.nextStepAt = new Date(Date.now() + nextDelay * 1000);
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Contact 1 Alert Dispatched',
      description: `Critical SMS & push notification delivered to ${c1?.name || 'Primary Contact'} with live telemetry link.`,
      status: 'NOTIFYING',
      eventType: 'LADDER_STEP_1_ALERT',
      payload: { contact: c1?.name, phone: c1?.phone, step: 1 }
    });

    broadcastToIncident(incident, 'ladder.step', {
      incidentId: incident.id,
      step: 1,
      state: 'ACTIVE',
      secondsRemaining: nextDelay
    });
  } else if (nextStepIndex === 2) {
    // STEP 2: Contact 2 and full circle SMS + voice
    incident.ladder.step = 2;
    updateStepInIncident(incident, 1, 'COMPLETED');
    updateStepInIncident(incident, 2, 'ACTIVE');

    for (let i = 1; i < contacts.length; i++) {
      const c = contacts[i];
      const trackingUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:4000'}/t/${incident.trackingToken}`;
      await notifier.sendSms({
        incidentId: incident.id,
        to: c.phone,
        body: `URGENT: ${incident.userName} SOS escalated to full circle. Live: ${trackingUrl}`
      });
      await notifier.sendVoice({
        incidentId: incident.id,
        to: c.phone,
        message: `This is an automated safety alert from Jaagruth. ${incident.userName} requires immediate assistance.`
      });
    }

    const nextDelay = delays[2] || 10;
    incident.ladder.nextStepAt = new Date(Date.now() + nextDelay * 1000);
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Full Emergency Circle Escalated',
      description: 'Voice relay and secondary SMS alerts dispatched to all registered trusted contacts.',
      status: incident.status,
      eventType: 'LADDER_STEP_2_CIRCLE',
      payload: { contactsCount: contacts.length, step: 2 }
    });

    broadcastToIncident(incident, 'ladder.step', {
      incidentId: incident.id,
      step: 2,
      state: 'ACTIVE',
      secondsRemaining: nextDelay
    });
  } else if (nextStepIndex === 3) {
    // STEP 3: Top-ranked verified responder matching
    incident.ladder.step = 3;
    incident.status = 'RESPONDER_ASSIGNED';
    updateStepInIncident(incident, 2, 'COMPLETED');
    updateStepInIncident(incident, 3, 'ACTIVE');

    const ranked = await ResponderMatcher.findNearbyResponders(lat, lng, incident.category, 10.0);
    const best = ranked.find(r => r.score > 0);

    if (best) {
      incident.assignedResponderId = best.id;
      incident.assignedResponder = best;
      incident.rankedResponders = ranked.slice(0, 5);

      await IncidentService.recordEvent(incident, {
        title: 'Verified Responder Assigned',
        description: `Automated matching selected ${best.name} (${best.title}, ${best.badge}) • ETA: ${best.etaMinutes}m`,
        status: 'RESPONDER_ASSIGNED',
        actorId: best.id,
        actorRole: 'responder',
        eventType: 'RESPONDER_MATCHED',
        payload: { responder: best, rankScore: best.score, explanation: best.explanation }
      });

      broadcastToIncident(incident, 'responder.assigned', {
        incidentId: incident.id,
        responder: best,
        explanation: best.explanation
      });
    }

    const nextDelay = delays[3] || 10;
    incident.ladder.nextStepAt = new Date(Date.now() + nextDelay * 1000);
    await incident.save();

    broadcastToIncident(incident, 'ladder.step', {
      incidentId: incident.id,
      step: 3,
      state: 'ACTIVE',
      secondsRemaining: nextDelay
    });
  } else if (nextStepIndex === 4) {
    // STEP 4: Authority desk alert (siren event on website)
    incident.ladder.step = 4;
    updateStepInIncident(incident, 3, 'COMPLETED');
    updateStepInIncident(incident, 4, 'ACTIVE');

    const nextDelay = delays[4] || 10;
    incident.ladder.nextStepAt = new Date(Date.now() + nextDelay * 1000);
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Command Deck High-Priority Siren Triggered',
      description: 'Regional Authority Emergency Desk escalated incident with active auditory siren alert.',
      status: incident.status,
      eventType: 'AUTHORITY_SIREN_ALERT',
      payload: { step: 4, severity: incident.severity }
    });

    broadcastToAuthorities('authority.alert', {
      incidentId: incident.id,
      severity: incident.severity,
      duress: incident.duress,
      siren: true,
      message: `HIGH PRIORITY SOS: Escalation ladder reached Step 4 for ${incident.userName}`
    });

    broadcastToIncident(incident, 'ladder.step', {
      incidentId: incident.id,
      step: 4,
      state: 'ACTIVE',
      secondsRemaining: nextDelay
    });
  } else if (nextStepIndex === 5) {
    // STEP 5: 112 / ERSS handoff payload prepared
    incident.ladder.step = 5;
    updateStepInIncident(incident, 4, 'COMPLETED');
    updateStepInIncident(incident, 5, 'COMPLETED');
    incident.ladder.nextStepAt = null; // Ladder complete

    const blocks = await LedgerBlock.find({ incidentId: incident.id }).sort({ index: 1 });
    const handoffPayload = buildErss112Payload(incident, user, blocks);

    incident.handoff112 = {
      preparedAt: new Date(),
      payload: handoffPayload
    };
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'ERSS 112 State Packet Prepared',
      description: 'Standardized CAD dispatch payload assembled with cryptographic chain proof.',
      status: incident.status,
      eventType: 'ERSS_112_PACKET_READY',
      payload: { handoff: handoffPayload }
    });

    broadcastToIncident(incident, 'ladder.step', {
      incidentId: incident.id,
      step: 5,
      state: 'COMPLETED',
      secondsRemaining: 0
    });
  }
}

function updateStepInIncident(incident, stepIndex, state) {
  if (!incident.ladder?.steps) return;
  const step = incident.ladder.steps.find(s => s.index === stepIndex);
  if (step) {
    step.state = state;
    if (state === 'ACTIVE') step.startedAt = new Date();
  }
}
