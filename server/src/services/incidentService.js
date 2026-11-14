import bcrypt from 'bcryptjs';
import { Incident } from '../models/Incident.js';
import { IncidentEvent } from '../models/IncidentEvent.js';
import { appendLedgerBlock } from './ledgerService.js';
import { broadcastToIncident, broadcastToAuthorities } from '../realtime/ws.js';
import { AppError } from '../middleware/error.js';
import { User } from '../models/User.js';
import { Contact } from '../models/Contact.js';
import { ResponderMatcher } from './responderMatcher.js';

export class IncidentService {
  /**
   * Central atomic event recorder:
   * Writes timeline event -> appends to crypto ledger -> broadcasts via WebSocket
   */
  static async recordEvent(incident, { title, description, status, actorId, actorRole, eventType, payload }) {
    const timestamp = new Date().toISOString();

    // 1. Timeline event
    const event = await IncidentEvent.create({
      incidentId: incident.id,
      title,
      description: description || title,
      status: status || incident.status,
      timestamp,
      actorId: actorId || 'system',
      actorRole: actorRole || 'system'
    });

    // 2. Cryptographic ledger block
    const block = await appendLedgerBlock({
      incidentId: incident.id,
      actorId: actorId || 'system',
      actorRole: actorRole || 'system',
      eventType: eventType || title.toUpperCase().replace(/\s+/g, '_'),
      payload: payload || { title, status: status || incident.status, timestamp }
    });

    // 3. Realtime WebSocket broadcast
    broadcastToIncident(incident, 'ledger.block', block);

    return { event, block };
  }

  /**
   * Create SOS incident with server-side 5-second cancel buffer
   */
  static async createIncident(user, { lat, lng, address, clientId, offline, createdAtClient, speedProfile }) {
    // If user already has an active incident, return it
    const existing = await Incident.findOne({
      userId: user.id,
      status: { $in: ['TRIGGERED', 'NOTIFYING', 'ACKNOWLEDGED', 'RESPONDER_ASSIGNED', 'EN_ROUTE', 'ON_SCENE'] }
    });
    if (existing) {
      return existing;
    }

    const cancelWindowSeconds = 5;
    const now = new Date();
    const cancelWindowEndsAt = new Date(now.getTime() + cancelWindowSeconds * 1000);

    const speed = speedProfile || user.settings?.escalationSpeed || 'FAST';

    // Ladder steps definitions
    const ladderSteps = [
      { index: 1, title: 'Alerting Contact 1', state: 'PENDING' },
      { index: 2, title: 'Notifying Emergency Circle & Voice Relay', state: 'PENDING' },
      { index: 3, title: 'Dispatching Verified Campus/Community Responder', state: 'PENDING' },
      { index: 4, title: 'Command Desk High-Priority Siren Dispatch', state: 'PENDING' },
      { index: 5, title: 'ERSS 112 State Emergency Handoff Packet Ready', state: 'PENDING' }
    ];

    const incident = await Incident.create({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      status: 'TRIGGERED',
      mode: offline ? 'OFFLINE_SYNC' : 'SOS',
      severity: 3,
      category: 'General Emergency',
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      },
      address: address || 'Current User Coordinates',
      speedProfile: speed,
      cancelWindowEndsAt,
      ladder: {
        step: 0,
        nextStepAt: cancelWindowEndsAt, // Ladder starts when cancel window ends
        steps: ladderSteps
      },
      ...(clientId ? { clientId } : {}),
      createdAtClient: createdAtClient ? new Date(createdAtClient) : now
    });

    // Record initial ledger block
    await this.recordEvent(incident, {
      title: 'SOS Emergency Triggered',
      description: `SOS initiated at ${address || `${lat}, ${lng}`} with 5-second cancel buffer.`,
      status: 'TRIGGERED',
      actorId: user.id,
      actorRole: 'citizen',
      eventType: 'INCIDENT_TRIGGERED',
      payload: {
        incidentId: incident.id,
        code: incident.code,
        userId: user.id,
        userName: user.name,
        location: { lat, lng },
        speedProfile: speed
      }
    });

    // Broadcast creation
    broadcastToIncident(incident, 'incident.created', incident);
    broadcastToAuthorities('authority.alert', {
      incidentId: incident.id,
      severity: incident.severity,
      duress: false,
      siren: true,
      title: '🚨 LIVE EMERGENCY SOS ALERT — IMMEDIATE ACTION REQUIRED',
      message: `Emergency SOS triggered by ${incident.userName} (${incident.userPhone}) at ${incident.address || 'User Location'}`,
      incident
    });

    return incident;
  }

  /**
   * Cancel incident during the 5s buffer window
   */
  static async cancelIncident(incidentId, user) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    if (incident.userId !== user.id && user.role !== 'admin') {
      throw new AppError('Unauthorized to cancel this incident.', 'FORBIDDEN', 403);
    }

    if (incident.status === 'RESOLVED' || incident.status === 'FALSE_ALARM') {
      return incident;
    }

    const now = new Date();
    const isInsideBuffer = now <= new Date(incident.cancelWindowEndsAt);

    if (!isInsideBuffer && incident.status !== 'TRIGGERED') {
      throw new AppError('Cancel window has expired. Please resolve the incident using your PIN.', 'BUFFER_EXPIRED', 400);
    }

    incident.status = 'FALSE_ALARM';
    incident.falseAlarmKind = 'BUFFER';
    incident.resolvedAt = now;
    incident.ladder.nextStepAt = null;
    await incident.save();

    await this.recordEvent(incident, {
      title: 'Cancelled in Safety Window',
      description: 'User safely aborted trigger during the 5-second countdown buffer.',
      status: 'FALSE_ALARM',
      actorId: user.id,
      actorRole: 'citizen',
      eventType: 'CANCELLED_IN_BUFFER',
      payload: { incidentId: incident.id, falseAlarmKind: 'BUFFER' }
    });

    broadcastToIncident(incident, 'incident.resolved', incident);
    return incident;
  }

  /**
   * Resolve incident with safety PIN or covert duress PIN
   */
  static async resolveIncident(incidentId, user, { pin, outcome = 'SAFE' }) {
    const incident = await Incident.findById(incidentId);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    // Check PIN lockout
    if (incident.pinLockedUntil && new Date() < new Date(incident.pinLockedUntil)) {
      const waitSec = Math.ceil((new Date(incident.pinLockedUntil) - new Date()) / 1000);
      throw new AppError(`Too many incorrect PIN attempts. Locked for ${waitSec} seconds.`, 'PIN_LOCKED', 429);
    }

    const userDoc = await User.findById(incident.userId);
    if (!userDoc) throw new AppError('User account not found.', 'NOT_FOUND', 404);
    if (user.id !== incident.userId && !['authority', 'admin'].includes(user.role)) throw new AppError('Unauthorized to resolve this incident.', 'FORBIDDEN', 403);

    const isSafePin = userDoc.safetyPinHash && (await bcrypt.compare(pin, userDoc.safetyPinHash));
    const isDuressPin = userDoc.duressPinHash && (await bcrypt.compare(pin, userDoc.duressPinHash));

    // Fallback for default demo seed PINs (1234 safe, 9999 duress) if unhashed in migration
    const matchesSafe = Boolean(isSafePin);
    const matchesDuress = Boolean(isDuressPin);

    if (!matchesSafe && !matchesDuress) {
      incident.failedPinAttempts = (incident.failedPinAttempts || 0) + 1;
      if (incident.failedPinAttempts >= 3) {
        incident.pinLockedUntil = new Date(Date.now() + 60 * 1000); // 60s lock
      }
      await incident.save();

      await this.recordEvent(incident, {
        title: 'Incorrect PIN Attempt',
        description: `Failed PIN validation attempt (${incident.failedPinAttempts}/3).`,
        status: incident.status,
        actorId: user.id,
        actorRole: user.role,
        eventType: 'INVALID_PIN_ATTEMPT',
        payload: { attempt: incident.failedPinAttempts }
      });

      throw new AppError('Incorrect Safety PIN.', 'INVALID_PIN', 401);
    }

    // Reset failed attempts on valid PIN
    incident.failedPinAttempts = 0;
    incident.pinLockedUntil = null;

    // DURESS PIN FLOW
    if (matchesDuress) {
      incident.duress = true;
      incident.severity = 5;
      incident.ladder.step = 4; // Jump directly to authority siren step
      incident.ladder.nextStepAt = null;
      await incident.save();

      await this.recordEvent(incident, {
        title: 'DURESS PIN DETECTED',
        description: 'Covert duress signal triggered! Attacker forced resolve; tracking active.',
        status: incident.status,
        actorId: user.id,
        actorRole: 'citizen',
        eventType: 'DURESS_PIN_USED',
        payload: { duress: true, severity: 5, covert: true }
      });

      // Broadcast covert authority siren alert
      broadcastToAuthorities('authority.alert', {
        incidentId: incident.id,
        severity: 5,
        duress: true,
        siren: true,
        message: `COVERT DURESS ALERT: Citizen ${incident.userName} entered duress PIN under coercion!`
      });

      // Byte-identical normal resolution response to fool attacker
      return {
        status: 'RESOLVED',
        incidentId: incident.id,
        resolvedAt: new Date().toISOString(),
        outcome: 'SAFE',
        message: 'Incident successfully resolved and logged.'
      };
    }

    // NORMAL SAFE RESOLUTION
    incident.status = outcome === 'FALSE_ALARM' ? 'FALSE_ALARM' : 'RESOLVED';
    incident.falseAlarmKind = outcome === 'FALSE_ALARM' ? 'FIELD' : null;
    incident.resolvedOutcome = outcome;
    incident.resolvedAt = new Date();
    incident.ladder.nextStepAt = null;
    await incident.save();

    await this.recordEvent(incident, {
      title: outcome === 'FALSE_ALARM' ? 'Reported as False Alarm' : 'Incident Resolved Safely',
      description: `Emergency cleared by user using Safety PIN. Outcome: ${outcome}.`,
      status: incident.status,
      actorId: user.id,
      actorRole: user.role,
      eventType: 'INCIDENT_RESOLVED',
      payload: { outcome, resolvedAt: incident.resolvedAt }
    });

    broadcastToIncident(incident, 'incident.resolved', incident);

    return {
      status: 'RESOLVED',
      incidentId: incident.id,
      resolvedAt: incident.resolvedAt.toISOString(),
      outcome,
      message: 'Incident successfully resolved and logged.'
    };
  }
}
