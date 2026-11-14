# Jaagruth Node server

Express, MongoDB/Mongoose, JWT, and WebSocket server. It is the source of truth for authentication, contacts, incidents, escalation, responder assignment, and the incident ledger.

## Run locally

Requirements: Node.js 20+ and a reachable MongoDB database.

```bash
cp .env.example .env
# Set MONGODB_URI and a unique JWT_SECRET; configure CORS_ORIGINS
npm ci
npm run dev
```

The REST API is mounted at `/api/v1`, WebSocket at `/ws`, and health at `/health`. `SEED_DEMO=true` creates the demo accounts and records. Do not expose demo controls publicly; demo routes are mounted only when `DEMO_MODE=true` and require authority/admin auth. Production requires a non-placeholder JWT secret of at least 32 characters.

## Main API contracts

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/authority/login`, OTP endpoints in demo mode.
- Contacts: `GET/POST /contacts`, `PATCH/DELETE /contacts/:id`, `PUT /contacts/reorder` with `{ "ids": [...] }`.
- Incidents: `POST /incidents`, `POST /incidents/:id/cancel`, `POST /incidents/:id/location`, `POST /incidents/:id/resolve`, active/history/ledger endpoints, and `/incidents/sync`.
- Authority routes require authority/admin JWTs. Demo controls are mounted only when demo mode is enabled.
- WebSocket messages use `{type, payload, data, ts}`. `payload` is canonical and `data` is a temporary compatibility alias.

## Checks

```bash
npm test
node --check src/index.js
```

`server/.env` is local-only and ignored by Git. Never commit it or paste credential values into reports. Rotate exposed Atlas credentials and restrict the Atlas network allowlist.
