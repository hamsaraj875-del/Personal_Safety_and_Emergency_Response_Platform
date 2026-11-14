# Jaagruth / RakshaChain Emergency Platform — Backend Server

High-reliability Node.js / Express / MongoDB / WebSocket backend powering the citizen safety application and authority command dashboard.

---

## 1. Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas or local MongoDB instance

### Environment Setup
Create `server/.env` (see `.env.example`):
```bash
PORT=4000
MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<HOST>/?appName=bnb
MONGODB_DB=rakshachain
JWT_SECRET=jaagruth-super-secret-jwt-key-32-chars-minimum
DEMO_MODE=true
```

### Install & Run
```bash
cd server
npm install

# Start server (auto-runs idempotent seed on first boot)
npm start

# Run unit tests
npm test
```

---

## 2. Default Seed Credentials

| Role | Identifier | Password | Safe PIN | Duress PIN |
|---|---|---|---|---|
| **Citizen** | `+91 98765 43210` or `jenifer.pilman@bmsce.ac.in` | `password123` | `1234` | `9999` |
| **Authority** | Badge ID: `BLR-OPS-892` | `password123` | — | — |

---

## 3. Core Capabilities

1. **Deterministic Cryptographic Audit Trail (Blockchain Ledger):**
   - Every emergency trigger, ladder escalation, responder dispatch, and resolution appends an immutable block.
   - Hash: `SHA-256(prevHash | timestamp | actorId | eventType | canonicalJson(payload))`.
   - Genesis: `0000000000000000000000000000000000000000000000000000000000000000`.
   - Single source of truth for verification: `GET /api/v1/incidents/:id/ledger/verify`.

2. **5-Second SOS Cancel Buffer & Covert Duress PIN:**
   - 5-second grace window after SOS trigger allows zero-consequence false alarm cancellation (`POST /api/v1/incidents/:id/cancel`).
   - Entering Safe PIN `1234` marks incident `RESOLVED`.
   - Entering Duress PIN `9999` returns a byte-identical `RESOLVED` success response to deceive coercers, while silently escalating severity to 5 and broadcasting a covert siren alert to the Authority Command Deck.

3. **5-Step Escalation Ladder:**
   - Step 1: Alert Contact 1 (SMS + push with live tracking token link).
   - Step 2: Notify Full Emergency Circle & Voice Relay.
   - Step 3: Automated Haversine + Multi-Factor Dispatch of Top Verified Responder.
   - Step 4: Command Deck High-Priority Siren Alert.
   - Step 5: 112 / ERSS Standardized CAD Handoff Packet Assembly.

4. **Authority Command Center Realtime Sector:**
   - Realtime sector state matching `generateSectorData()` schema:
     - `accidentHotspots`
     - `licensePlateDetections` (ANPR)
     - `ambulanceFleet` + `displacementPlan`
     - `activeIncidents`
     - `falseCaseStats`

---

## 4. API Endpoints

### Health Check
- `GET /health` — Check server status & MongoDB connection.

### Authentication
- `POST /api/v1/auth/register` — Register citizen account.
- `POST /api/v1/auth/login` — Login citizen with phone or email.
- `POST /api/v1/auth/authority/login` — Login authority officer with badge ID.

### User & Profile (`/api/v1/me`)
- `GET /api/v1/me` — Current user profile.
- `PATCH /api/v1/me` — Update profile & emergency notes.
- `PUT /api/v1/me/pins` — Update safe and duress PINs.
- `POST /api/v1/me/device-token` — Register FCM device token.

### Emergency Contacts (`/api/v1/contacts`)
- `GET /api/v1/contacts` — List contacts (ordered by priority 1..5).
- `POST /api/v1/contacts` — Add contact (max 5).
- `PUT /api/v1/contacts/:id` — Update contact.
- `DELETE /api/v1/contacts/:id` — Remove contact.
- `PUT /api/v1/contacts/reorder` — Reorder priorities.

### Incidents (`/api/v1/incidents`)
- `POST /api/v1/incidents` — Trigger SOS.
- `GET /api/v1/incidents/active` — Active incident for citizen.
- `GET /api/v1/incidents/:id` — Get incident detail.
- `POST /api/v1/incidents/:id/cancel` — Abort within 5s cancel window.
- `POST /api/v1/incidents/:id/resolve` — Resolve with PIN (safe or duress).
- `POST /api/v1/incidents/:id/location` — Send live GPS telemetry ping.
- `GET /api/v1/incidents/:id/ledger` — Get full block chain.
- `GET /api/v1/incidents/:id/ledger/verify` — Cryptographic integrity check.
- `GET /api/v1/incidents/:id/events` — Incident timeline events.
- `POST /api/v1/incidents/:id/triage` — AI triage report generation.
- `POST /api/v1/incidents/sync` — Offline queue sync.

### Responders & Hubs
- `GET /api/v1/responders/nearby` — Ranked responders (Haversine + score).
- `POST /api/v1/responders/:id/accept` — Responder accepts dispatch.
- `POST /api/v1/responders/:id/decline` — Responder declines dispatch.
- `GET /api/v1/hubs/nearby` — Safe zones & police stations.

### Public Live Tracking
- `GET /track/:token` — JSON live tracking telemetry.
- `GET /t/:token` — Mobile-responsive live tracking HTML page.

### Authority Dashboard (`/api/v1/authority`)
- `GET /api/v1/authority/sector` — Complete sector dashboard snapshot.
- `GET /api/v1/authority/incidents` — All active and recent incidents.
- `POST /api/v1/authority/incidents/:id/resolve` — Authority forced resolution.
- `POST /api/v1/authority/incidents/:id/handoff-112` — ERSS 112 dispatch handoff.
- `POST /api/v1/authority/fleet/rebalance` — Authorize fleet displacement.
- `POST /api/v1/authority/anpr/broadcast` — Issue ANPR broadcast to patrol cars.

### Demo & Simulation (`/api/v1/demo`, enabled when `DEMO_MODE=true`)
- `POST /api/v1/demo/benchmark` — Run 1,000 incident simulation benchmark.
- `POST /api/v1/demo/simulate-movement` — Simulate responder movement.
- `POST /api/v1/demo/incidents/:id/tamper` — Tamper ledger block payload.
- `POST /api/v1/demo/incidents/:id/restore` — Restore tampered block payload.

---

## 5. WebSocket (`/ws?token=<JWT>`)

### Client -> Server:
- `subscribe`: `{ "type": "subscribe", "incidentId": "inc_..." }`
- `location.ping`: `{ "type": "location.ping", "incidentId": "inc_...", "lat": 12.93, "lng": 77.53 }`

### Server -> Client:
- `incident.created`: SOS trigger broadcast.
- `ladder.step`: Escalation step update (1..5) with remaining countdown seconds.
- `responder.assigned`: Assigned verified responder details.
- `responder.location`: Live responder GPS movement.
- `ledger.block`: New immutable block appended.
- `incident.resolved`: Incident resolved.
- `authority.alert`: High-priority siren alert sent to Command Deck.
