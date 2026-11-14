import express from 'express';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.js';
import { Incident } from '../models/Incident.js';
import { IncidentService } from '../services/incidentService.js';
import { tamperBlock, restoreTamperedBlock, verifyChainIntegrity } from '../services/ledgerService.js';
import { SimulationService } from '../services/simulation.js';
import { broadcastToIncident } from '../realtime/ws.js';
import { seedDatabase } from '../seed/seed.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = express.Router();
router.use(authenticate, requireRole('admin', 'authority'));

// Middleware: Only active if DEMO_MODE === true
router.use((req, res, next) => {
  if (!env.DEMO_MODE) {
    return next(new AppError('Demo controls disabled in this environment.', 'FORBIDDEN', 403));
  }
  next();
});

router.post('/demo/incidents/:id/contact-ack', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    incident.status = 'ACKNOWLEDGED';
    if (incident.ladder?.steps) {
      const step1 = incident.ladder.steps.find(s => s.index === 1);
      if (step1) step1.state = 'ACKNOWLEDGED';
    }
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Contact Acknowledged Alert',
      description: 'Primary emergency contact tapped confirmation link via SMS.',
      status: 'ACKNOWLEDGED',
      actorId: 'contact_01',
      actorRole: 'contact',
      eventType: 'CONTACT_ACKNOWLEDGED',
      payload: { contact: 'Ananya Sharma', status: 'ACKNOWLEDGED' }
    });

    broadcastToIncident(incident, 'incident.updated', incident);
    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
});

router.post('/demo/incidents/:id/responder-accept', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    incident.status = 'EN_ROUTE';
    await incident.save();

    await IncidentService.recordEvent(incident, {
      title: 'Responder Accepted Dispatch',
      description: 'Emily Dayton (Trauma Paramedic) confirmed dispatch and is en route.',
      status: 'EN_ROUTE',
      actorId: 'resp_emily_01',
      actorRole: 'responder',
      eventType: 'RESPONDER_EN_ROUTE',
      payload: { responder: 'Emily Dayton', status: 'EN_ROUTE' }
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

router.post('/demo/incidents/:id/responder-arrive', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    incident.status = 'ON_SCENE';
    await incident.save();

    SimulationService.stopResponderMovement(incident.id);

    await IncidentService.recordEvent(incident, {
      title: 'Responder On Scene',
      description: 'Verified responder has arrived at user location and commenced field assistance.',
      status: 'ON_SCENE',
      actorId: 'resp_emily_01',
      actorRole: 'responder',
      eventType: 'RESPONDER_ON_SCENE',
      payload: { status: 'ON_SCENE' }
    });

    broadcastToIncident(incident, 'incident.updated', incident);
    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
});

router.post('/demo/incidents/:id/resolve', async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) throw new AppError('Incident not found.', 'NOT_FOUND', 404);

    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date();
    incident.ladder.nextStepAt = null;
    await incident.save();

    SimulationService.stopResponderMovement(incident.id);

    await IncidentService.recordEvent(incident, {
      title: 'Incident Resolved via Demo Controls',
      description: 'Emergency cleared by operator via administrative testing deck.',
      status: 'RESOLVED',
      actorId: 'operator_demo',
      actorRole: 'admin',
      eventType: 'DEMO_RESOLVED',
      payload: { resolvedAt: incident.resolvedAt }
    });

    broadcastToIncident(incident, 'incident.resolved', incident);
    res.json({ success: true, incident });
  } catch (err) {
    next(err);
  }
});

router.post('/demo/incidents/:id/tamper', async (req, res, next) => {
  try {
    const blockIndex = parseInt(req.body.blockIndex) || 0;
    const result = await tamperBlock(req.params.id, blockIndex);
    const verification = await verifyChainIntegrity(req.params.id);

    broadcastToIncident({ id: req.params.id }, 'ledger.tampered', { blockIndex, verification });
    res.json({ success: true, result, verification });
  } catch (err) {
    next(err);
  }
});

router.post('/demo/incidents/:id/restore', async (req, res, next) => {
  try {
    const blockIndex = parseInt(req.body.blockIndex) || 0;
    const result = await restoreTamperedBlock(req.params.id, blockIndex);
    const verification = await verifyChainIntegrity(req.params.id);

    broadcastToIncident({ id: req.params.id }, 'ledger.restored', { blockIndex, verification });
    res.json({ success: true, result, verification });
  } catch (err) {
    next(err);
  }
});

router.post('/demo/benchmark', async (req, res, next) => {
  try {
    const benchmarkResults = await SimulationService.runBenchmark();
    res.json(benchmarkResults);
  } catch (err) {
    next(err);
  }
});

router.post('/demo/reset', async (req, res, next) => {
  try {
    if (process.env.ALLOW_DEMO_RESET !== 'true') throw new AppError('Demo reset is disabled.', 'FORBIDDEN', 403);
    // Keep this operation non-destructive: seedDatabase(false) only inserts missing demo records.
    await seedDatabase(false);
    res.json({ success: true, message: 'Missing demo records were seeded; existing records were preserved.' });
  } catch (err) {
    next(err);
  }
});

export default router;
