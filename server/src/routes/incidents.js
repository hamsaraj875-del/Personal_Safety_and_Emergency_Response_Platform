import express from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idempotency } from '../middleware/idempotency.js';
import { AppError } from '../middleware/error.js';
import { Incident } from '../models/Incident.js';
import { IncidentEvent } from '../models/IncidentEvent.js';
import { LedgerBlock } from '../models/LedgerBlock.js';
import { LocationPing } from '../models/LocationPing.js';
import { Contact } from '../models/Contact.js';
import { IncidentService } from '../services/incidentService.js';
import { verifyChainIntegrity } from '../services/ledgerService.js';
import { TriageService } from '../services/triageService.js';
import { broadcastToAuthorities } from '../realtime/ws.js';

const router = express.Router();
router.use('/incidents', authenticate);

const createIncidentSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional(),
  clientId: z.string().optional(),
  offline: z.boolean().optional(),
  createdAtClient: z.string().optional(),
  speedProfile: z.enum(['FAST', 'NORMAL', 'SPEC']).optional()
});

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  battery: z.string().optional()
});

const resolveSchema = z.object({
  pin: z.string().min(4).max(6),
  outcome: z.enum(['SAFE', 'FALSE_ALARM']).default('SAFE')
});

const triageSchema = z.object({
  text: z.string().min(1)
});

router.post('/incidents', idempotency(), validate(createIncidentSchema), async (req, res, next) => {
  try {
    const incident = await IncidentService.createIncident(req.user, req.body);
    res.status(201).json({ incident });
  } catch (err) {
    next(err);
  }
});

router.post('/incidents/:id/cancel', async (req, res, next) => {
  try {
    const incident = await IncidentService.cancelIncident(req.params.id, req.user);
    res.json({ incident, message: 'Incident cancelled within safety window.' });
  } catch (err) {
    next(err);
  }
});

router.post('/incidents/:id/location', validate(locationSchema), async (req, res, next) => {
  try {
    const { lat, lng, accuracy, speed, battery } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    const ping = await LocationPing.create({
      incidentId: incident.id,
      userId: req.user.id,
      lat,
      lng,
      accuracy: accuracy || 0,
      speed: speed || 0,
      battery: battery || '100%'
    });

    incident.location.coordinates = [lng, lat];
    await incident.save();

    broadcastToAuthorities('incident.location', {
      incidentId: incident.id,
      userId: req.user.id,
      lat,
      lng,
      accuracy,
      battery
    });

    res.json({ success: true, ping });
  } catch (err) {
    next(err);
  }
});

router.post('/incidents/:id/resolve', validate(resolveSchema), async (req, res, next) => {
  try {
    const response = await IncidentService.resolveIncident(req.params.id, req.user, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

router.get('/incidents/active', async (req, res, next) => {
  try {
    const query = {
      status: { $in: ['TRIGGERED', 'NOTIFYING', 'ACKNOWLEDGED', 'RESPONDER_ASSIGNED', 'EN_ROUTE', 'ON_SCENE'] }
    };
    if (req.user.role === 'citizen') {
      query.userId = req.user.id;
    }

    const incident = await Incident.findOne(query).sort({ createdAt: -1 });
    res.json({ incident: incident || null });
  } catch (err) {
    next(err);
  }
});

router.get('/incidents', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = {};
    if (req.user.role === 'citizen') {
      query.userId = req.user.id;
    }

    const total = await Incident.countDocuments(query);
    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      incidents,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/incidents/:id', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);
    res.json({ incident });
  } catch (err) {
    next(err);
  }
});

router.get('/incidents/:id/events', async (req, res, next) => {
  try {
    const events = await IncidentEvent.find({ incidentId: req.params.id }).sort({ timestamp: 1 });
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

router.get('/incidents/:id/ledger', async (req, res, next) => {
  try {
    const blocks = await LedgerBlock.find({ incidentId: req.params.id }).sort({ index: 1 });
    res.json({ blocks });
  } catch (err) {
    next(err);
  }
});

router.get('/incidents/:id/ledger/verify', async (req, res, next) => {
  try {
    const result = await verifyChainIntegrity(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/incidents/:id/triage', validate(triageSchema), async (req, res, next) => {
  try {
    const { text } = req.body;
    const contacts = await Contact.find({ userId: req.user.id }).lean();
    const contactNames = contacts.map(c => c.name);

    const scrubbed = TriageService.scrubPII(text, contactNames);
    const triageResult = TriageService.triageText(scrubbed);

    // Update incident severity and category if elevated
    await Incident.findByIdAndUpdate(req.params.id, {
      severity: triageResult.severity,
      category: triageResult.category
    });

    res.json({
      scrubbedText: scrubbed,
      triage: triageResult
    });
  } catch (err) {
    next(err);
  }
});

router.post('/incidents/sync', idempotency(), async (req, res, next) => {
  try {
    const { incidents = [], events = [] } = req.body;
    const syncedIncidents = [];

    for (const inc of incidents) {
      if (inc.clientId) {
        let existing = await Incident.findOne({ clientId: inc.clientId });
        if (!existing) {
          existing = await IncidentService.createIncident(req.user, {
            lat: inc.lat || inc.location?.lat || 12.9352,
            lng: inc.lng || inc.location?.lng || 77.5358,
            address: inc.address || 'Offline Synced Location',
            clientId: inc.clientId,
            offline: true,
            createdAtClient: inc.createdAtClient || inc.createdAt
          });
        }
        syncedIncidents.push(existing);
      }
    }

    res.json({
      success: true,
      syncedCount: syncedIncidents.length,
      incidents: syncedIncidents
    });
  } catch (err) {
    next(err);
  }
});

export default router;
