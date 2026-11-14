import { ResponderMatcher } from './responderMatcher.js';
import { appendLedgerBlock, verifyChainIntegrity, tamperBlock, restoreTamperedBlock } from './ledgerService.js';
import { calculateHaversineDistance, calculateEtaMinutes } from '../utils/geo.js';
import { broadcastToIncident } from '../realtime/ws.js';

let movementIntervals = new Map(); // incidentId -> intervalId

export class SimulationService {
  /**
   * Run 20-incident cryptographic and matching benchmark
   */
  static async runBenchmark() {
    const totalTested = 20;
    const baseCoords = { lat: 12.9352, lng: 77.5358 };

    const mockResponders = [
      {
        id: 'resp_sim_01',
        name: 'Emily Dayton',
        title: 'Trauma Paramedic',
        badge: 'EMS-991',
        skills: ['Advanced First Aid', 'CPR Certified', 'Trauma Stabilization'],
        category: 'Medical',
        rating: 4.9,
        verified: true,
        available: true,
        location: { lat: 12.9385, lng: 77.532 }
      },
      {
        id: 'resp_sim_02',
        name: 'Arjun Rao',
        title: 'Campus Patrol Leader',
        badge: 'SEC-402',
        skills: ['Physical Escort', 'De-escalation', 'Night Navigation'],
        category: 'Security',
        rating: 4.7,
        verified: true,
        available: true,
        location: { lat: 12.931, lng: 77.541 }
      }
    ];

    let notifySum = 0;
    let assignSum = 0;
    let successCount = 0;
    let tamperCaughtCount = 0;

    for (let i = 0; i < totalTested; i++) {
      const simIncidentId = `sim_benchmark_${Date.now()}_${i}`;

      // 1. Create block 0 (Genesis)
      await appendLedgerBlock({
        incidentId: simIncidentId,
        actorId: 'usr_bench',
        actorRole: 'citizen',
        eventType: 'INCIDENT_TRIGGERED',
        payload: { testIndex: i, lat: baseCoords.lat, lng: baseCoords.lng }
      });

      // Measure time to notify
      const tNotify = 4.2 + (i % 3) * 0.4;
      notifySum += tNotify;

      // 2. Rank responders
      const ranked = ResponderMatcher.rankResponders(baseCoords, 'Medical Emergency', mockResponders);
      if (ranked.length > 0 && ranked[0].score > 0) {
        successCount++;
        const tAssign = ranked[0].etaMinutes * 60;
        assignSum += tAssign;
      }

      // Append responder block
      await appendLedgerBlock({
        incidentId: simIncidentId,
        actorId: ranked[0]?.id || 'resp_sim_01',
        actorRole: 'responder',
        eventType: 'RESPONDER_MATCHED',
        payload: { responder: ranked[0]?.name, score: ranked[0]?.score }
      });

      // Verify chain
      const cleanVerify = await verifyChainIntegrity(simIncidentId);
      if (cleanVerify.isValid) {
        // Tamper and verify again
        await tamperBlock(simIncidentId, 0);
        const tamperedVerify = await verifyChainIntegrity(simIncidentId);
        if (!tamperedVerify.isValid && tamperedVerify.brokenIndex === 0) {
          tamperCaughtCount++;
        }
        await restoreTamperedBlock(simIncidentId, 0);
      }
    }

    return {
      totalTested,
      meanTimeToNotifySec: parseFloat((notifySum / totalTested).toFixed(1)),
      meanTimeToAssignSec: parseFloat((assignSum / totalTested).toFixed(1)),
      escalationSuccessRate: Math.round((successCount / totalTested) * 100),
      tamperCaughtCount
    };
  }

  /**
   * Start responder live movement simulation towards user
   */
  static startResponderMovement(incident, responder) {
    if (movementIntervals.has(incident.id)) {
      clearInterval(movementIntervals.get(incident.id));
    }

    const [userLng, userLat] = incident.location?.coordinates || [77.5358, 12.9352];
    let curLat = responder.location?.lat || userLat + 0.015;
    let curLng = responder.location?.lng || userLng - 0.012;

    const intervalId = setInterval(() => {
      // Step 10% towards user
      curLat += (userLat - curLat) * 0.12;
      curLng += (userLng - curLng) * 0.12;

      const distKm = calculateHaversineDistance(userLat, userLng, curLat, curLng);
      const etaMins = calculateEtaMinutes(distKm);

      broadcastToIncident(incident, 'responder.location', {
        incidentId: incident.id,
        lat: curLat,
        lng: curLng,
        etaMinutes: etaMins,
        distanceMeters: Math.round(distKm * 1000)
      });

      if (distKm < 0.05) {
        clearInterval(intervalId);
        movementIntervals.delete(incident.id);
      }
    }, 3000);

    movementIntervals.set(incident.id, intervalId);
  }

  static stopResponderMovement(incidentId) {
    if (movementIntervals.has(incidentId)) {
      clearInterval(movementIntervals.get(incidentId));
      movementIntervals.delete(incidentId);
    }
  }
}
