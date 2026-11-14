import express from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/error.js';
import { Responder } from '../models/Responder.js';
import { Incident } from '../models/Incident.js';
import { ResponderMatcher } from '../services/responderMatcher.js';
import { IncidentService } from '../services/incidentService.js';
import { SimulationService } from '../services/simulation.js';
import { broadcastToIncident } from '../realtime/ws.js';

const router = express.Router();

router.get('/responders/nearby', authenticate, async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat) || 12.9352;
    const lng = parseFloat(req.query.lng) || 77.5358;
    const category = req.query.category || 'General Emergency';

    const ranked = await ResponderMatcher.findNearbyResponders(lat, lng, category);
    res.json({ responders: ranked });
  } catch (err) {
    next(err);
  }
});

router.post('/incidents/:id/responder/accept', authenticate, requireRole('responder', 'authority', 'admin'), async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    incident.status = 'EN_ROUTE';
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Responder Accepted Dispatch',
      description: `Responder confirmed immediate deployment and is en-route.`,
      status: 'EN_ROUTE',
      actorId: req.user.id,
      actorRole: 'responder',
      eventType: 'RESPONDER_ACCEPTED',
      payload: { responderId: req.user.id, status: 'EN_ROUTE' }
    });

    if (incident.assignedResponder) {
      SimulationService.startResponderMovement(incident, incident.assignedResponder);
    }

    broadcastToIncident(incident, 'incident.updated', incident);
    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
});

router.post('/incidents/:id/responder/decline', authenticate, requireRole('responder', 'authority', 'admin'), async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    // Re-match next ranked responder
    const [lng, lat] = incident.location?.coordinates || [77.5358, 12.9352];
    const ranked = await ResponderMatcher.findNearbyResponders(lat, lng, incident.category);
    const nextBest = ranked.find(r => r.id !== incident.assignedResponderId && r.score > 0);

    if (nextBest) {
      incident.assignedResponderId = nextBest.id;
      incident.assignedResponder = nextBest;
      await incident.save();

      await IncidentService.recordEvent(incident, {
        title: 'Dispatch Re-routed to Next Responder',
        description: `Primary responder declined; re-assigned to ${nextBest.name} (${nextBest.badge}).`,
        status: incident.status,
        actorId: nextBest.id,
        actorRole: 'responder',
        eventType: 'RESPONDER_REROUTED',
        payload: { responder: nextBest }
      });

      broadcastToIncident(incident, 'responder.assigned', {
        incidentId: incident.id,
        responder: nextBest,
        explanation: nextBest.explanation
      });
    }

    res.json({ success: true, message: 'Dispatch declined, re-routed.' });
  } catch (err) {
    next(err);
  }
});

router.post('/responders/me/location', authenticate, requireRole('responder', 'admin'), async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    await Responder.findByIdAndUpdate(req.user.id, {
      location: {
        type: 'Point',
        coordinates: [Number(lng), Number(lat)]
      }
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
