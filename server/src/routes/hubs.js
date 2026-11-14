import express from 'express';
import { SafetyHub } from '../models/SafetyHub.js';
import { calculateHaversineDistance, calculateEtaMinutes } from '../utils/geo.js';

const router = express.Router();

router.get('/hubs/nearby', async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat) || 12.9352;
    const lng = parseFloat(req.query.lng) || 77.5358;

    const hubs = await SafetyHub.find().lean();

    const formatted = hubs.map(h => {
      const hubLng = h.location?.coordinates ? h.location.coordinates[0] : 77.5358;
      const hubLat = h.location?.coordinates ? h.location.coordinates[1] : 12.9352;
      const distKm = calculateHaversineDistance(lat, lng, hubLat, hubLng);
      const distanceMeters = Math.round(distKm * 1000);
      const etaMins = calculateEtaMinutes(distKm);

      return {
        ...h,
        id: h._id,
        distanceMeters,
        etaMins,
        location: { lat: hubLat, lng: hubLng }
      };
    });

    formatted.sort((a, b) => a.distanceMeters - b.distanceMeters);
    res.json({ hubs: formatted });
  } catch (err) {
    next(err);
  }
});

export default router;
