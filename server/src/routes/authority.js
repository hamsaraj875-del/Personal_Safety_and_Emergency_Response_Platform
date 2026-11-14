import express from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/error.js';
import { getSectorData } from '../services/authorityAnalytics.js';
import { Incident } from '../models/Incident.js';
import { User } from '../models/User.js';
import { LedgerBlock } from '../models/LedgerBlock.js';
import { AnprDetection } from '../models/AnprDetection.js';
import { FleetVehicle } from '../models/FleetVehicle.js';
import { IncidentService } from '../services/incidentService.js';
import { buildErss112Payload } from '../services/erssHandoff.js';
import { broadcastToAuthorities, broadcastToIncident } from '../realtime/ws.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole('authority', 'admin'));

router.get('/authority/sector', async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat) || 12.9352;
    const lng = parseFloat(req.query.lng) || 77.5358;
    const radiusKm = parseFloat(req.query.radiusKm) || 10;

    const data = await getSectorData(lat, lng, radiusKm);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/authority/incidents/active', async (req, res, next) => {
  try {
    const incidents = await Incident.find({
      status: { $in: ['TRIGGERED', 'NOTIFYING', 'ACKNOWLEDGED', 'RESPONDER_ASSIGNED', 'EN_ROUTE', 'ON_SCENE'] }
    }).sort({ createdAt: -1 });

    res.json({ incidents });
  } catch (err) {
    next(err);
  }
});

router.post('/authority/incidents/:id/resolve', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date();
    incident.ladder.nextStepAt = null;
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Resolved by Sector Authority Officer',
      description: `Incident cleared by Officer ${req.user.name || req.user.badgeId}.`,
      status: 'RESOLVED',
      actorId: req.user.id || req.user.badgeId,
      actorRole: 'authority',
      eventType: 'AUTHORITY_RESOLVED',
      payload: { resolvedBy: req.user.badgeId || req.user.name }
    });

    broadcastToIncident(incident, 'incident.resolved', incident);
    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
});

router.post('/authority/incidents/:id/direct-112', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    const user = await User.findById(incident.userId);
    const blocks = await LedgerBlock.find({ incidentId: incident.id }).sort({ index: 1 });

    const handoffPayload = buildErss112Payload(incident, user, blocks);
    incident.handoff112 = {
      preparedAt: new Date(),
      payload: handoffPayload
    };
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Manual 112 / ERSS Direct Dispatch',
      description: 'Authority officer initiated direct state emergency handoff.',
      status: incident.status,
      actorId: req.user.badgeId || req.user.id,
      actorRole: 'authority',
      eventType: 'MANUAL_112_HANDOFF',
      payload: { handoff: handoffPayload }
    });

    res.json({ success: true, handoff: handoffPayload });
  } catch (err) {
    next(err);
  }
});

router.post('/authority/fleet/rebalance', async (req, res, next) => {
  try {
    const { planId } = req.body;

    // Shift candidate vehicles to Outer Ring Rd
    await FleetVehicle.updateMany(
      { isDisplaceCandidate: true },
      {
        status: 'Dispatched',
        'location.coordinates': [77.5358 - 0.011, 12.9352 + 0.018]
      }
    );

    const plan = {
      planId: planId || 'disp_plan_south_09',
      isExecuted: true,
      executedAt: new Date().toISOString(),
      optimizedEta: '4.2 min',
      message: '2 ALS Ambulances successfully rebalanced to Outer Ring Junction.'
    };

    broadcastToAuthorities('fleet.rebalanced', plan);
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
});

router.post('/authority/anpr/:id/broadcast', async (req, res, next) => {
  try {
    const detection = await AnprDetection.findById(req.params.id);
    if (!detection) throw new AppError('ANPR detection record not found.', 'NOT_FOUND', 404);

    detection.broadcasted = true;
    await detection.save();

    const alert = {
      plateNumber: detection.plateNumber,
      vehicleModel: detection.vehicleModel,
      reason: detection.reason,
      status: 'REGIONAL_INTERCEPT_BROADCAST_ACTIVE',
      broadcastedAt: new Date().toISOString()
    };

    broadcastToAuthorities('anpr.broadcast', alert);
    res.json({ success: true, broadcast: alert });
  } catch (err) {
    next(err);
  }
});

export default router;
