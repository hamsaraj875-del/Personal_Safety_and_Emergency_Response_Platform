import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { LocationPing } from '../models/LocationPing.js';
import { Incident } from '../models/Incident.js';

let wss = null;
const clients = new Map(); // ws -> { userId, role, sector, authenticated }

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate from query param ?token=...
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let clientInfo = { userId: null, role: 'anonymous', sector: null };

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        clientInfo = {
          userId: decoded.id,
          role: decoded.role,
          sector: decoded.sector || null
        };
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid JWT token' }, ts: new Date().toISOString() }));
      }
    }

    clients.set(ws, clientInfo);

    ws.on('message', async rawData => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
        } else if (msg.type === 'location' && clientInfo.userId) {
          const { incidentId, lat, lng, accuracy, battery, speed } = msg;
          if (incidentId && lat !== undefined && lng !== undefined) {
            const ping = await LocationPing.create({
              incidentId,
              userId: clientInfo.userId,
              lat: Number(lat),
              lng: Number(lng),
              accuracy: Number(accuracy || 0),
              speed: Number(speed || 0),
              battery: String(battery || '100%')
            });

            // Update incident coordinates
            await Incident.findByIdAndUpdate(incidentId, {
              'location.coordinates': [Number(lng), Number(lat)]
            });

            // Broadcast to authorities and assigned responder
            broadcastToAuthorities('incident.location', {
              incidentId,
              userId: clientInfo.userId,
              lat: Number(lat),
              lng: Number(lng),
              accuracy,
              battery
            });
          }
        }
      } catch (e) {
        console.error('WS message handling error:', e.message);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', err => {
      console.error('WS client error:', err.message);
      clients.delete(ws);
    });

    // Send connection greeting
    ws.send(
      JSON.stringify({
        type: 'connected',
        data: { role: clientInfo.role, userId: clientInfo.userId },
        ts: new Date().toISOString()
      })
    );
  });

  return wss;
}

export function broadcast(type, data, filterFn) {
  if (!wss) return;
  const payload = JSON.stringify({ type, data, ts: new Date().toISOString() });

  for (const [ws, info] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      if (!filterFn || filterFn(info)) {
        try {
          ws.send(payload);
        } catch (e) {
          console.error('Broadcast send error:', e.message);
        }
      }
    }
  }
}

export function broadcastToIncident(incident, type, data) {
  broadcast(type, data, info => {
    // Authorities receive all incidents (or sector matching)
    if (info.role === 'authority' || info.role === 'admin') return true;
    // Citizen receives their own
    if (info.userId && info.userId === incident.userId) return true;
    // Assigned responder receives it
    if (incident.assignedResponderId && info.userId === incident.assignedResponderId) return true;
    return false;
  });
}

export function broadcastToAuthorities(type, data) {
  broadcast(type, data, info => info.role === 'authority' || info.role === 'admin');
}

export function closeWebSocketServer() {
  if (wss) {
    for (const ws of clients.keys()) {
      ws.terminate();
    }
    wss.close();
    wss = null;
  }
}
