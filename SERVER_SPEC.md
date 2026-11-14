# Jaagruth — Server Architecture + Antigravity Prompts

Save this file in the **repo root** (next to `app/` and `website/`) as `SERVER_SPEC.md`.
Then paste **Prompt 1** into Antigravity, and later Prompt 2 and Prompt 3.

---

## 0. Do this before anything else (security)

1. **Rotate your MongoDB password now.** It was pasted in a chat, so treat it as exposed. Atlas → Database Access → Edit user → new password.
2. **Never put the URI in a prompt, in source code, or in git.** It goes only in `server/.env` (which must be in `.gitignore`):
   ```
   MONGODB_URI=mongodb+srv://<USER>:<NEW_PASSWORD>@bnb.jzkkvzd.mongodb.net/?appName=bnb
   MONGODB_DB=rakshachain
   ```
   Your URI has no database name, so the server must pass `dbName: process.env.MONGODB_DB` to Mongoose.
3. **Atlas → Network Access:** add your current IP, or `0.0.0.0/0` for the hackathon only. If the connection times out, this is the cause 9 times out of 10.
4. `website/.env.example` and `website/src/constants/mapsConfig.js` contain a real-looking **Google Maps key**, and the repo has a GitHub remote. Restrict that key in Google Cloud (HTTP referrers / Android package) or regenerate it, and remove the hard-coded fallback.

---

## 1. What exists today (from reading your code)

| Part | Reality today | What the server must replace |
|---|---|---|
| **Website** (`website/`, React 19 + Vite, port 3000, Capacitor wrapper) | It is only the **Authority Command dashboard**: badge login modal, then 5 views (accident hotspots, ANPR vehicle scanner, ambulance fleet + rebalance, false-alarm stats, live map) and an incident drawer (verify chain, direct 112, resolve). All data comes from `generateSectorData()` in `authorityAnalytics.js`. | Login, sector data, incident list, resolve, 112 handoff, fleet rebalance, ANPR broadcast, chain verify. |
| **Android app** (`app/`, Kotlin + Jetpack Compose, package `com.jaagruth`) | Citizen app: splash, intro, login, home with SOS, 5 s cancel window, escalation screen, live map, contacts, activity/history, profile with offline mode. Everything is local: `AuthRepository`, `IncidentRepository`, `EscalationEngine`, `ResponderMatcher`, `CryptoLedger`, `SimulationRunner`, all on mock data. **No Retrofit/OkHttp/WebSocket dependency exists yet.** | Auth, contacts, incident lifecycle, escalation, responder matching, live GPS, ledger, history, benchmark. |
| **Server** | Does not exist. | Build it in `/server`. |

Things I found that will break the integration if ignored:

- **Two model layers in the Android app.** `data/models/*` (old XML-style) and `model/Models.kt` (Compose, the one actually used by `JagrathAppContainer`). The API should follow the **Compose models** (`UserProfile`, `EmergencyContact`, `VerifiedResponder`, `SafetyHub`, `IncidentBlock`, `VerificationResult`) plus the `IncidentStatus` enum.
- **The hash chain is computed differently on each client.** Android uses a sorted `TreeMap` + Gson (Gson escapes `=`, `<`, `>`, `&`, `'` and prints `12.0` for doubles). The website uses `JSON.stringify(payload, Object.keys(payload).sort())` (that array replacer also strips nested keys and prints `12` for `12.0`). The same block can therefore verify on one client and fail on the other. **Fix: the server is the single source of truth for hashing and verifying.** Clients call the verify endpoint and never recompute.
- **PINs are checked on the device** (`1234` safe, `9999` duress) and are in plaintext in `InitialData`. The server must own PIN verification so the duress flow actually alerts authorities.
- **Ladder timings disagree.** The README says T+5/35/65/85/120 s, while the app uses 10 s (fast) or 60 s (normal) per step. The server supports all three as profiles.
- **IDs disagree** (`usr_jenifer_01`, `user_01`, `INC-892401`, `INC-1234`). The server issues real ids; clients stop hard-coding them.
- **Android** needs `INTERNET` (already there) plus cleartext/HTTPS handling. **Capacitor** uses `androidScheme: "https"`, so an `http://` API will be blocked as mixed content. Use HTTPS (a tunnel or a deployed host) for anything that is not the emulator.

---

## 2. Target architecture

```
 ┌────────────────────┐      ┌─────────────────────────┐
 │ Android app        │      │ Website: Authority      │
 │ (Compose, citizen) │      │ Command (React/Vite)    │
 └─────────┬──────────┘      └────────────┬────────────┘
   REST /api/v1 + WebSocket /ws      REST /api/v1 + WebSocket /ws
           └───────────────┬───────────────┘
                 ┌─────────▼──────────────────────────────┐
                 │  server/  (Node 20 + Express + ws)     │
                 │  auth · contacts · incidents · ledger  │
                 │  escalation scheduler · matcher        │
                 │  triage (PII scrub) · authority API    │
                 │  notifier adapters (mock|FCM|Twilio)   │
                 └─────────┬──────────────────────────────┘
                           │ Mongoose
                 ┌─────────▼──────────┐
                 │ MongoDB Atlas      │  db: rakshachain
                 └────────────────────┘
```

### Tech decisions

- **Node 20, Express, Mongoose, `ws` (raw WebSocket), zod, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, pino.** Raw WebSocket is used because OkHttp on Android and the browser both speak it natively, so there is no extra client library.
- **JWT access tokens** with a role claim: `citizen | responder | authority | admin`.
- **Escalation is a persisted scheduler, not `setTimeout`.** Each active incident stores `ladder.nextStepAt`. One tick every 1 s runs the due steps. A server restart or crash does not lose an emergency.
- **Notifier adapters** (`push`, `sms`, `voice`) with a default **mock driver that logs and records to `notifications_log`**. Real FCM/Twilio are enabled by env vars. Nothing fails when keys are missing.
- **REST polling fallback.** If the WebSocket drops, clients poll `GET /incidents/active` every 3 s.
- **Mock fallback stays in the clients.** If the server is unreachable, the Android app keeps its existing local/offline mode, and the website shows a clear "server offline" banner instead of crashing.

---

## 3. MongoDB collections

All documents carry `createdAt`, `updatedAt`. Use string ids exposed as `id`.

| Collection | Key fields | Indexes |
|---|---|---|
| `users` | `name, phone, phoneNormalized, email, passwordHash, avatar, bloodGroup, emergencyNotes, address, safetyPinHash, duressPinHash, role, deviceTokens[], settings{demoMode, escalationSpeed:'FAST'|'NORMAL'|'SPEC'}` | unique `phoneNormalized`, sparse unique `email` |
| `contacts` | `userId, name, relation, phone, priority(1-5), consentGiven, avatar, status` | `{userId, priority}` |
| `responders` | `name, title, badge, skills[], category('Security'|'Medical'|'Volunteer'), phone, avatar, rating, verified, available, historicalResponseMinutes, location{type:'Point',coordinates:[lng,lat]}` | `2dsphere(location)` |
| `incidents` | `code('INC-…'), userId, userName, userPhone, status, mode('SOS'|'OFFLINE_SYNC'), duress(bool), severity(1-5), category, location{GeoJSON}, address, trackingToken, speedProfile, cancelWindowEndsAt, ladder{step, nextStepAt, steps[{index,title,state,startedAt}]}, assignedResponderId, rankedResponders[], falseAlarmKind('BUFFER'|'FIELD'|null), clientId, resolvedAt, handoff112{preparedAt,payload}` | `{status}`, `{userId, createdAt}`, `2dsphere(location)`, unique sparse `clientId` |
| `incident_events` | `incidentId, title, description, status, timestamp, isOffline, actorId, actorRole` | `{incidentId, timestamp}` |
| `ledger_blocks` | `incidentId, index, prevHash, hash, timestamp(ISO string), actorId, actorRole, eventType, payload` | **unique `{incidentId, index}`** |
| `location_pings` | `incidentId, userId, lat, lng, accuracy, speed, battery, ts` | `{incidentId, ts}`, TTL 30 days |
| `safety_hubs` | fields of `SafetyHub` (type hospital/police/safe_zone/fire_rescue, location GeoJSON) | `2dsphere` |
| `authority_officers` | `badgeId, passwordHash, name, sector, role:'authority'` | unique `badgeId` |
| `fleet_vehicles` | `vehicleNo, type, driver, status('Ready'|'Dispatched'|'On Scene'), location, fuel, depot, isDisplaceCandidate` | `2dsphere` |
| `anpr_detections` | `plateNumber, vehicleModel, ts, locationName, speedKmh, status, alertType, confidence, reason, image` | `{ts}` |
| `hotspots` | `name, location, collisionCount, riskLevel, peakHours, primaryCause, radiusMeters, trend, dangerScore` | `2dsphere` |
| `notifications_log` | `incidentId, channel('push'|'sms'|'voice'), to, body, driver, status, ts` | `{incidentId}` |
| `idempotency_keys` | `key, response, createdAt` | TTL 24 h |

ANPR, fleet and the camera-based parts of the hotspots are **simulated, seeded data** (there is no real camera feed). Mark them `simulated: true` in responses. Real parts: active incidents, response times, false-alarm statistics, incident-derived hotspots.

---

## 4. REST API (`/api/v1`)

Error shape everywhere: `{ "error": { "code": "STRING", "message": "text" } }`.
Mutating incident calls accept an `Idempotency-Key` header.

**Auth**
- `POST /auth/register` `{name, phone, email, password}` → `{token, user}`
- `POST /auth/login` `{emailOrPhone, password}` → `{token, user}`
- `POST /auth/authority/login` `{badgeId, password, lat?, lng?}` → `{token, officer}`
- `GET /me`, `PATCH /me` (profile, bloodGroup, emergencyNotes, address, avatar, settings)
- `PUT /me/pins` `{safetyPin, duressPin}` (4 digits, must differ, stored hashed)
- `POST /me/device-token` `{token, platform}`

**Contacts** (max 5, consent required): `GET/POST /contacts`, `PATCH/DELETE /contacts/:id`, `PUT /contacts/reorder` `{ids:[…]}`

**Incidents (citizen)**
- `POST /incidents` `{lat, lng, address, clientId?, offline?, createdAtClient?}` → incident in `TRIGGERED` with a 5 s cancel window (server-side buffer; the SOS still fires if the app is killed).
- `POST /incidents/:id/cancel` (only inside the window → `FALSE_ALARM`, kind `BUFFER`)
- `POST /incidents/:id/location` `{lat,lng,accuracy,speed,battery}`
- `POST /incidents/:id/resolve` `{pin, outcome:'SAFE'|'FALSE_ALARM'}` — **duress rule below**
- `GET /incidents/active`, `GET /incidents` (history, paginated), `GET /incidents/:id`
- `GET /incidents/:id/events`, `GET /incidents/:id/ledger`, `GET /incidents/:id/ledger/verify`
- `POST /incidents/sync` — bulk idempotent upload of offline incidents/events (keeps original timestamps, deduped by `clientId`)
- `POST /incidents/:id/triage` `{text}` → PII-scrubbed severity/category

**Responders**: `GET /responders/nearby?lat&lng&category` (ranked with explanation), `POST /incidents/:id/responder/accept|decline` (responder role), `POST /responders/me/location`.

**Safety hubs**: `GET /hubs/nearby?lat&lng`

**Public tracking (no login, token-gated)**: `GET /track/:trackingToken` → minimal live JSON, plus a tiny HTML page at `/t/:trackingToken` that polls it. This is the link sent in the SMS.

**Authority (role `authority`)**
- `GET /authority/sector?lat&lng&radiusKm` → exactly the shape of `generateSectorData()` (`sectorName, centerCoords, telemetry, accidentHotspots, licensePlateDetections, activeIncidents, ambulanceFleet, coverageBlindSpot, displacementPlan, falseCaseStats`) so the website only swaps the data source.
- `GET /authority/incidents/active`
- `POST /authority/incidents/:id/resolve`
- `POST /authority/incidents/:id/direct-112` → builds and stores the ERSS handoff payload
- `POST /authority/fleet/rebalance` `{planId}` → moves candidate vehicles, sets `isExecuted`, ETA becomes optimized
- `POST /authority/anpr/:id/broadcast`

**Demo / admin (only when `DEMO_MODE=true`)** — these mirror the app's "DEMO CONTROLS":
- `POST /demo/incidents/:id/contact-ack`, `/responder-accept`, `/responder-arrive`, `/resolve`
- `POST /demo/incidents/:id/tamper` and `/demo/incidents/:id/restore` (the climax tamper demo, flips a stored block)
- `POST /demo/benchmark` → runs the 20-incident simulation against the real engine and ledger, returns `meanTimeToNotifySec, meanTimeToAssignSec, escalationSuccessRate, tamperCaughtCount, totalTested`
- `POST /demo/reset`

`GET /health` → `{ok, mongo:'up'|'down', uptime}` (no auth).

---

## 5. Realtime (`wss://host/ws?token=JWT`)

Server → client messages: `{type, payload, data, ts}`. `payload` is the canonical event field; `data` remains as a temporary compatibility alias. Greeting, pong, and error envelopes follow the same shape.

| type | sent to | data |
|---|---|---|
| `incident.created` / `incident.updated` / `incident.resolved` | the owner, all authorities | full incident |
| `ladder.step` | owner, authorities | `{incidentId, step, state, secondsRemaining}` |
| `responder.assigned` | owner, authorities | responder + ranking explanation |
| `responder.location` | owner, authorities | `{incidentId, lat, lng, etaMinutes, distanceMeters}` |
| `incident.location` | authorities, responder | latest user ping |
| `authority.alert` | authorities | `{incidentId, severity, duress, siren:true}` (ladder step 4 and duress) |
| `ledger.block` | owner, authorities | new block |

Client → server: `{type:'ping'}`, `{type:'location', incidentId, lat, lng, accuracy, battery}`. Room subscription messages are unnecessary: the server filters incident broadcasts by owner, assigned responder, and authority/admin role. Authenticated sockets receive server pings every 25 seconds and stale sockets are terminated.
Authorities are scoped to their sector; a citizen only ever receives their own incidents.

---

## 6. Core engines

**Escalation ladder** (`startsAt = cancelWindowEndsAt`)

| Step | Action | Spec offset | FAST | NORMAL |
|---|---|---|---|---|
| 1 | Contact 1: critical push + SMS with tracking link | +5 s | +10 s | +60 s |
| 2 | Contact 2 and full circle: SMS + voice | +35 s | +20 s | +120 s |
| 3 | Top-ranked verified responder, one-tap accept/decline; on decline or timeout go to the next ranked | +65 s | +30 s | +180 s |
| 4 | Authority desk alert (siren event on the website) | +85 s | +40 s | +240 s |
| 5 | 112 / ERSS handoff payload prepared | +120 s | +50 s | +300 s |

Profile comes from the user's setting (app toggle "fast mode") or `DEFAULT_ESCALATION_SPEED`. A contact acknowledging sets `ACKNOWLEDGED` and completes that step but does not stop responder dispatch and the authority alert (`ACK_STOPS_LADDER=false` default). Every transition calls one function, `recordEvent()`, which in a single flow writes the timeline event, the ledger block and the WebSocket broadcast.

**Responder matching** (port of `ResponderMatcher.kt` exactly so the existing unit tests pass in JS):
`score = 0.40·proximity + 0.30·skill + 0.15·availability + 0.15·rating`, proximity = `max(0, 1 − km/10)`, Haversine with R = 6371, `eta = max(1, round(km·2.4 + 1))`, rating = `min(1, rating/5)`. Skill match is 1.0 for medical + (aid/med/cpr), harassment/stalking + (security/escort), accident + (trauma/aid) else 0.8, default 0.5. Pre-filter with `$geoNear` (10 km), then score in code and return `explanation` text.

**Ledger** (server-authoritative)
`hash = SHA-256( prevHash | timestamp | actorId | eventType | canonicalPayload )`, genesis `"0"×64`. Canonical payload = recursive key-sorted compact JSON with no HTML escaping; timestamps stored and hashed as the ISO string. Append is atomic via the unique `{incidentId,index}` index with retry. Verify walks from genesis and returns `{isValid, brokenIndex, reason, checkedCount}` (same fields the app's `VerificationResult` already has). Tamper demo edits a stored block's payload and verify then reports that exact `brokenIndex`.

**Duress rule** (`POST /incidents/:id/resolve`)
- Safety PIN → `RESOLVED`.
- Duress PIN → respond with **exactly the same body and status as a safe resolve** (the attacker sees a normal close), but internally: `duress=true`, severity 5, status stays active, ledger event `DURESS_PIN_USED`, `authority.alert` with `duress:true`, ladder jumps to step 4. Location pings continue.
- Wrong PIN → `401` and a ledger event; 3 wrong attempts lock resolve for 60 s.

**Triage**: regex scrubber removes phone numbers, emails, names from the user's contacts and street-address patterns before anything is stored. A deterministic keyword engine returns `{severity 1-5, category, recommendedResponder, confidence}`. An LLM call is optional and only when `TRIAGE_LLM_KEY` is set; otherwise, or on any error, the deterministic engine answers.

**Authority analytics**: `activeIncidents` and `telemetry` (active SOS count, median response time) come from real incidents. `falseCaseStats` is computed from history (confirmed vs cancelled-in-buffer vs field false alarm). Hotspots combine seeded points with clustering of real resolved incidents. Fleet, ANPR and blind-spot data are seeded and flagged `simulated`.

---

## 7. Server folder structure

```
server/
├─ package.json            (type: module, scripts: dev, start, seed, test)
├─ .env.example            (placeholders only, no real secrets)
├─ .gitignore              (.env, node_modules)
├─ src/
│  ├─ index.js             (boot: env → mongo → http → ws → scheduler)
│  ├─ config/env.js        (zod-validated env, fails fast with clear message)
│  ├─ db/connect.js        (mongoose.connect with dbName, retry/backoff)
│  ├─ models/              (one file per collection above)
│  ├─ middleware/          (auth, role, validate, error, rateLimit, idempotency)
│  ├─ routes/              (auth, me, contacts, incidents, responders, hubs, track, authority, demo, health)
│  ├─ services/
│  │  ├─ incidentService.js   (create, cancel, resolve, recordEvent)
│  │  ├─ escalationScheduler.js
│  │  ├─ responderMatcher.js
│  │  ├─ ledgerService.js
│  │  ├─ triageService.js
│  │  ├─ authorityAnalytics.js
│  │  ├─ erssHandoff.js
│  │  └─ simulation.js        (benchmark + responder movement)
│  ├─ notifiers/           (index.js picks driver; mock.js, fcm.js, twilio.js)
│  ├─ realtime/ws.js       (auth, rooms, broadcast helpers)
│  ├─ seed/seed.js         (idempotent)
│  └─ utils/               (geo, phone, canonicalJson, ids)
└─ test/                   (matcher, ledger, ladder, duress, api smoke)
```

### `.env.example`

```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USER:PASSWORD@bnb.jzkkvzd.mongodb.net/?appName=bnb
MONGODB_DB=rakshachain
JWT_SECRET=change-me-long-random
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://localhost,capacitor://localhost
PUBLIC_BASE_URL=http://localhost:4000
DEMO_MODE=true
DEFAULT_ESCALATION_SPEED=FAST
ACK_STOPS_LADDER=false
SEED_DEMO=true
NOTIFIER_DRIVER=mock
FCM_SERVICE_ACCOUNT_JSON=
TWILIO_SID=
TWILIO_TOKEN=
TWILIO_FROM=
TRIAGE_LLM_KEY=
```

---

## 8. "Nothing fails" checklist

1. Server boot fails fast with a readable message if `MONGODB_URI` is missing or Atlas rejects the IP.
2. Seeding is idempotent and creates: demo citizen (phone `+91 98765 43210`), 3 contacts, 3 responders, 4 safety hubs, authority officer `BLR-OPS-892`, 6 vehicles, 4 ANPR rows, 5 hotspots. Seed passwords are printed once in the console, not hard-coded in clients.
3. Every client request has a timeout, and on failure the client falls back to its existing local behaviour.
4. CORS allows the Vite dev server, the Capacitor origins, and the production site.
5. Android emulator base URL is `http://10.0.2.2:4000`; a real phone needs a tunnel or deployed HTTPS URL (e.g. `cloudflared tunnel --url http://localhost:4000`). The same HTTPS URL goes into the website env.
6. Clocks: the server stamps all trusted times; client times are stored separately as `createdAtClient`.
7. One active incident per user; a second `POST /incidents` returns the existing one (matches `IncidentRepository.createIncident`).
8. Graceful shutdown: close ws, stop scheduler, close Mongo.

---

# PROMPT 1 — Build the server (paste into Antigravity)

```
You are building the backend for the RakshaChain / Jaagruth emergency platform in a NEW folder /server at the repo root. Do NOT modify /app or /website in this task.

First read SERVER_SPEC.md in the repo root completely, then read these files so your API matches the real clients:
- app/app/src/main/java/com/jaagruth/model/Models.kt, data/models/*.kt, crypto/CryptoLedger.kt, service/ResponderMatcher.kt, services/EscalationEngine.kt, data/InitialData.kt, data/repository/*.kt
- app/app/src/test/java/com/jaagruth/ResponderMatcherTest.kt
- website/src/services/authorityAnalytics.js, cryptoLedger.js, constants/initialData.js, components/authority/*.jsx

Build exactly what SERVER_SPEC.md describes: Node 20, Express, Mongoose, ws, zod, JWT, bcryptjs, helmet, cors, express-rate-limit, pino. ES modules.

Hard rules:
1. Read MONGODB_URI and MONGODB_DB from server/.env. NEVER hard-code or print the URI. Create server/.env.example with placeholders and add .env to .gitignore. Connect with mongoose.connect(uri, { dbName }) and retry with backoff.
2. Implement every collection, index, REST route, WebSocket message and engine in SERVER_SPEC.md sections 3 to 6. The GET /authority/sector response must have the exact same shape as generateSectorData() in website/src/services/authorityAnalytics.js.
3. The ledger is server-authoritative: SHA-256 of prevHash|timestamp|actorId|eventType|canonicalPayload with recursive key-sorted JSON, genesis 64 zeros, unique {incidentId,index} index, atomic append with retry. Provide verify and the demo tamper/restore endpoints.
4. The escalation ladder is a persisted scheduler (ladder.nextStepAt, 1 s tick), not setTimeout, with three speed profiles SPEC, FAST, NORMAL. The 5 s cancel window is server-side. All state changes go through one recordEvent() that writes the event, the ledger block and the WebSocket broadcast.
5. Port ResponderMatcher.kt exactly (weights, Haversine, ETA formula, skill rules) and port its unit tests to the server test suite.
6. Duress PIN: response must be byte-identical to a safe resolve, while internally raising a severity-5 authority alert. PINs are stored hashed and never returned by any endpoint.
7. Notifier adapters with a default mock driver that logs and writes notifications_log. Real FCM/Twilio only when env vars exist. Nothing may crash when keys are missing.
8. Add /health, request validation with zod, the standard error shape, rate limiting, idempotency keys on POST /incidents and /incidents/sync, and graceful shutdown.
9. Add an idempotent seed script (npm run seed) that creates the demo data listed in section 8 of the spec.
10. Demo endpoints exist only when DEMO_MODE=true, including /demo/benchmark running the 20-incident simulation through the real engine and ledger.

Work in these phases. After each phase run the tests and a curl smoke test, fix problems, then continue:
Phase 1 skeleton, env, Mongo connect, health, auth (citizen + authority), seed.
Phase 2 contacts, profile, PINs, safety hubs, responders and matcher + tests.
Phase 3 incidents, cancel window, events, ledger + verify + tamper tests.
Phase 4 escalation scheduler, notifier adapters, WebSocket, location pings, responder movement simulation, tracking link page.
Phase 5 duress flow, triage, offline sync, ERSS handoff.
Phase 6 authority API (sector, resolve, direct-112, rebalance, ANPR broadcast) and demo/benchmark endpoints.
Phase 7 end-to-end test script that runs: register, add contacts, trigger SOS, wait for ladder, accept as responder, location pings, resolve with duress PIN, verify chain, tamper, verify again showing the broken block index.

Finish by writing server/README.md with run instructions, the full endpoint list with example requests/responses, and the WebSocket message list. Print the seeded demo credentials once at the end of the seed run.
```

---

# PROMPT 2 — Wire the website (after the server runs)

```
Server is running on http://localhost:4000 (see SERVER_SPEC.md and server/README.md). Update ONLY /website.

1. Add src/services/api.js: base URL from import.meta.env.VITE_API_BASE_URL (default http://localhost:4000/api/v1), fetch wrapper with JWT from memory (not localStorage), 8 s timeout, standard error handling. Add src/services/socket.js for the /ws WebSocket with auto-reconnect and a 3 s polling fallback.
2. Add VITE_API_BASE_URL and VITE_WS_URL to .env.example. Remove the hard-coded Google Maps key fallback in src/constants/mapsConfig.js.
3. AuthorityLoginModal.jsx: call POST /auth/authority/login with badgeId, password and the GPS coordinates. Empty the default password field. Show real errors.
4. AuthorityDashboard.jsx: replace generateSectorData() with GET /authority/sector?lat&lng&radiusKm (re-fetch when the radius chip changes). Subscribe to incident.*, ladder.step, responder.location and authority.alert so activeIncidents and telemetry update live. Play the siren and highlight on authority.alert (red and "DURESS" label when duress is true).
5. handleResolveIncident, handleAuthorizeDisplacement, the ANPR broadcast button and onDirect112 must call their server endpoints, then update state from the response.
6. IncidentInspectDrawer.jsx: "Verify Record Integrity" calls GET /incidents/:id/ledger/verify and shows the broken block index on failure. Add a visible block list with the tamper highlight for demo mode.
7. If the server is unreachable, keep generateSectorData() as an offline fallback and show a "Server offline - showing simulated data" banner. Do not crash.
8. vite.config.js: add a dev proxy for /api and /ws to avoid CORS during development. Make sure npm run build and the Capacitor build still work.

Test by logging in with the seeded officer and triggering an SOS from curl (see server/README.md).
```

---

# PROMPT 3 — Wire the Android app (after the server runs)

```
Server is running (see SERVER_SPEC.md). Update ONLY /app. Keep every existing screen and the offline mode working.

1. Add dependencies in app/app/build.gradle.kts: Retrofit 2 + Gson converter, OkHttp + logging-interceptor (debug only). Use OkHttp WebSocket for /ws.
2. BASE_URL from BuildConfig: debug = http://10.0.2.2:4000/api/v1 for the emulator, with an overridable local.properties value for a real device or tunnel HTTPS URL; release = HTTPS. Add a debug-only network_security_config that allows cleartext to 10.0.2.2 and the LAN. Never ship cleartext in release.
3. Create data/remote/ApiService.kt, DTOs that follow model/Models.kt (UserProfile, EmergencyContact, VerifiedResponder, SafetyHub, IncidentBlock, VerificationResult) and IncidentStatus, a TokenStore (EncryptedSharedPreferences), and an auth interceptor.
4. Keep the existing repository classes as the public interface used by the UI. Change their internals to call the server first and fall back to the current local logic if the call fails or Offline Mode is on:
   - AuthRepository: register, login, profile, PINs.
   - ContactRepository: CRUD and reorder via /contacts.
   - IncidentRepository: POST /incidents when SOS is pressed (the server owns the 5 s cancel window and the ladder), /cancel, /location, /resolve, history, and sync of offline incidents via POST /incidents/sync with a client-generated clientId.
   - ResponderRepository: GET /responders/nearby; keep ResponderMatcher only as the offline fallback.
   - IncidentDetailFragment / Activity "Verify record": call GET /incidents/:id/ledger/verify instead of recomputing locally. Remove the TODO.
5. EscalationEngine becomes a client of server state: render ladder.step and incident.updated WebSocket messages into the existing EscalationState StateFlow. Keep the local timer only for offline mode. The demo controls call /demo/incidents/:id/* when DEMO_MODE is on.
6. LocationService: during an active incident send a ping every 3 s to POST /incidents/:id/location (or the WS location message), using a foreground service so tracking survives a duress close and the screen turning off.
7. Safety PIN / Duress PIN: stop comparing locally. Call POST /incidents/:id/resolve {pin}. Show the normal "closed" UI for both safe and duress responses; the server handles the covert alert. Do not show any difference in the UI.
8. Add FCM only if google-services.json is present; otherwise skip silently. Register the token via POST /me/device-token.
9. Handle 401 by returning to the login screen, handle timeouts with a snackbar and the local fallback. Replace hard-coded user ids with ids from the server.
10. Run ./gradlew assembleDebug and ./gradlew test and fix all errors.
```

---

## 9. Final end-to-end acceptance test (do this before the demo)

1. Server starts, `/health` shows `mongo: up`, seed ran.
2. Website login with the seeded badge works; the dashboard shows real (seeded) data and no offline banner.
3. App login works; contacts list comes from Mongo; changing a contact on the app persists after reinstall.
4. Press SOS in the app: the website shows the incident within about 1 s; cancelling inside 5 s appears in the false-alarm stats.
5. Let the ladder run: contact step, responder assigned (Emily Dayton ranked first near campus), authority alert with siren, then the 112 payload.
6. Responder marker moves on the app map and on the website map.
7. Resolve with the **duress PIN**: the app closes normally, the website shows a red DURESS alert and tracking continues.
8. Verify chain = valid; run tamper demo; verify again = invalid with the correct block index; restore.
9. Switch the phone to airplane mode, trigger SOS (SMS fallback opens), turn it off, and the incident syncs once (no duplicate).
10. Run `POST /demo/benchmark` and show the numbers on the admin controls.
