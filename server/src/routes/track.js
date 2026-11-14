import express from 'express';
import { Incident } from '../models/Incident.js';
import { LocationPing } from '../models/LocationPing.js';
import { AppError } from '../middleware/error.js';

const router = express.Router();

router.get('/track/:token', async (req, res, next) => {
  try {
    const incident = await Incident.findOne({ trackingToken: req.params.token });
    if (!incident) throw new AppError('Tracking link is invalid or expired.', 'NOT_FOUND', 404);

    const latestPing = await LocationPing.findOne({ incidentId: incident.id }).sort({ ts: -1 });

    const [lng, lat] = incident.location?.coordinates || [77.5358, 12.9352];

    res.json({
      incidentCode: incident.code,
      personName: incident.userName,
      status: incident.status,
      severity: incident.severity,
      address: incident.address,
      coordinates: {
        lat: latestPing?.lat || lat,
        lng: latestPing?.lng || lng
      },
      lastPingTime: latestPing?.ts || incident.updatedAt,
      assignedResponder: incident.assignedResponder
        ? {
            name: incident.assignedResponder.name,
            badge: incident.assignedResponder.badge,
            etaMinutes: incident.assignedResponder.etaMinutes
          }
        : null
    });
  } catch (err) {
    next(err);
  }
});

router.get('/t/:token', async (req, res, next) => {
  try {
    const incident = await Incident.findOne({ trackingToken: req.params.token });
    if (!incident) {
      return res.status(404).send('<h2>Tracking link is invalid or expired.</h2>');
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Emergency Live Tracker - ${incident.code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .card { max-width: 480px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-weight: 700; font-size: 13px; text-transform: uppercase; }
    .badge-red { background: #ef4444; color: #fff; }
    .badge-green { background: #10b981; color: #fff; }
    .btn { display: block; width: 100%; text-align: center; background: #ef4444; color: #fff; font-weight: bold; padding: 14px 0; border-radius: 12px; text-decoration: none; margin-top: 16px; }
    .info { margin: 16px 0; border-top: 1px solid #334155; padding-top: 16px; font-size: 14px; color: #94a3b8; }
    .highlight { color: #f8fafc; font-weight: 600; font-size: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span class="badge ${incident.status === 'RESOLVED' ? 'badge-green' : 'badge-red'}" id="status-badge">${incident.status}</span>
      <span style="font-size:12px; color:#64748b;">${incident.code}</span>
    </div>
    <h2 style="margin: 12px 0 4px;">${incident.userName}</h2>
    <p style="margin: 0; font-size: 14px; color: #ef4444;">Live Emergency Telemetry & Location Broadcast</p>

    <div class="info">
      <div>Location: <span class="highlight" id="address">${incident.address}</span></div>
      <div style="margin-top: 8px;">Coordinates: <span class="highlight" id="coords">Fetching live GPS...</span></div>
      <div style="margin-top: 8px;">Assigned Unit: <span class="highlight" id="unit">${incident.assignedResponder?.name || 'In Ladder Dispatch'}</span></div>
    </div>

    <a href="#" class="btn" id="maps-link" target="_blank">Open in Google Maps</a>
    <p style="font-size: 11px; text-align: center; color: #64748b; margin-top: 16px;">Telemetry updates automatically every 3 seconds via Jaagruth Realtime Protocol.</p>
  </div>

  <script>
    async function update() {
      try {
        const res = await fetch('/api/v1/track/${req.params.token}');
        if (!res.ok) return;
        const data = await res.json();
        document.getElementById('status-badge').innerText = data.status;
        document.getElementById('coords').innerText = data.coordinates.lat.toFixed(5) + ', ' + data.coordinates.lng.toFixed(5);
        document.getElementById('maps-link').href = 'https://www.google.com/maps/search/?api=1&query=' + data.coordinates.lat + ',' + data.coordinates.lng;
        if (data.assignedResponder) {
          document.getElementById('unit').innerText = data.assignedResponder.name + ' (' + data.assignedResponder.etaMinutes + ' min ETA)';
        }
      } catch (e) {}
    }
    update();
    setInterval(update, 3000);
  </script>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
