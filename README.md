# Jaagruth (जागृत)
### Unified Personal Safety & Emergency Response Platform
**Build Beyond'26 · Problem Statement 3.1**  
*Gradient Club, Department of AIML, BMS College of Engineering*  
**Team Pointers (DSCE):** Chandhan Kumar GV (Lead), Manoj KN, Hamsaraj VC

---

> *"Most safety apps send an alert and hope. Ours runs the whole response: escalation, assignment, tracking, and a tamper-proof record, with privacy built in."*

### 📁 Project Architecture
- **`/app`**: **Native Android Citizen Application** built with Kotlin, Jetpack Compose, Material Design 3, and OpenStreetMap (osmdroid).
- **`/website`**: **Authority Command & Surveillance Deck** built with React, Vite, Tailwind CSS, and Google Maps Platform.

---

## 🚨 The Problem & The Government Gap
Traditional safety apps fire an isolated SMS and leave the victim in the dark. State dispatch platforms (like 112 India / ERSS) dispatch formal police/ambulance resources, but the victim's personal circle remains uncoordinated and unaware.

**RakshaChain is explicitly engineered as the personal coordination, escalation, and verifiable record layer that sits *alongside* 112 India**, concluding in a structured statutory ERSS 2.0 handoff as the final escalation step.

---

## 🛠️ Key Technical Moats & Architecture

### 1. Zero-Clutter Minimalist UI (UX4G Case Study Aligned)
- **Central SOS Button**: Concentric multi-ring pulse design requiring a 2-second press-and-hold to eliminate pocket dials under panic.
- **5-Second Pre-Dispatch Buffer**: Visual amber countdown to instantly abort accidental triggers before external channels fire.
- **Safety PIN vs. Duress PIN Resolution**:
  - Safe PIN (`1234`): Confirms normal resolution and closes tracking.
  - Duress PIN (`9999`): If coerced by an attacker, the UI appears to close normally while silently escalating to high-severity covert tracking and an immediate red alert on the Admin Command Center.

### 2. Timed Escalation State Machine Ladder
An automated server-side timer engine that refuses to let an alert stall if a phone is on silent or out of coverage:
- **T + 0s**: `TRIGGERED` (5-second local cancel window).
- **T + 5s**: **Contact 1** receives critical push alarm bypassing silent mode + SMS with live tracking link.
- **T + 35s**: **Contact 2 & Full Circle** escalated via SMS + automated voice bridge.
- **T + 65s**: **Top-Ranked Verified Responder** dispatched with one-tap Accept/Decline.
- **T + 85s**: **Campus / Institutional Admin Desk** sirens sound for live takeover.
- **T + 120s**: **112 / ERSS Statutory Handoff** payload prepared.

### 3. Explainable Multi-Factor Responder Matching
Instead of opaque black-box dispatch, responders are ranked using transparent weighted criteria:
$$\text{Score} = 0.40 \times \text{Proximity (Haversine ETA)} + 0.30 \times \text{Skill Match} + 0.15 \times \text{Availability} + 0.15 \times \text{Verification/Rating}$$
- Delivers human-readable justifications (e.g. *"1.2 km away (5 min ETA) • First-Aid Certified • Campus Verified"*).

### 4. Tamper-Evident SHA-256 Hash Chain (The Climax Demo)
Every single state transition, GPS ping, and responder handoff is written to an immutable cryptographic ledger:
$$H_n = \text{SHA-256}(H_{n-1} \parallel \text{timestamp} \parallel \text{actor\_id} \parallel \text{event\_type} \parallel \text{canonical\_payload})$$
- **One-Click Integrity Verification**: Recomputes hashes from Genesis $H_0$ to latest event.
- **Immediate Tamper Localization**: Injected database tampering instantly highlights the corrupted block in glowing red while preserving green checkmarks for all prior intact blocks.

### 5. Privacy-Preserving AI Severity Triage
- Text and transcribed audio are scrubbed of all PII (names, phone numbers, exact street addresses).
- Structured JSON output tags severity (1–5), category, recommended responder, and confidence.
- Deterministic regex keyword engine serves as an ultra-reliable offline fallback.

---

## 📱 The Three Primary Screens (Exact Match to Figma Design)
1. **Home Screen**: Minimalist white canvas, user profile greeting with notification badge, "Are you in emergency?" heading, central concentric pulsating SOS button, and "Your current address" floating card.
2. **Emergency Dispatched ("Ambulance on the Way")**: High-contrast rich crimson gradient, emergency vehicle illustration with active blue sirens, guidance copy, "See responders on map", and "Cancel request".
3. **Live Map & Responder Tracking**: OpenStreetMap integration, red route polyline, "You are here" vs. "1st Responder" markers, and floating swipeable responder carousel (Emily Dayton - 5 min away) with instant Call and Message triggers.

---

## ⚡ Quick Start & Running Locally

```bash
# Clone the repository
git clone https://github.com/hamsaraj875-del/Personal_Safety_and_Emergency_Response_Platform.git
cd Personal_Safety_and_Emergency_Response_Platform

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🏆 3-Minute Demo Flow for Hackathon Judges
1. **0:00 - 0:30**: Open Home Screen. Explain the 2-second hold-for-SOS to prevent pocket dials. Trigger SOS and show the 5-second amber cancel window.
2. **0:30 - 1:10**: Enter "Ambulance on the Way" screen. Explain the timed escalation ladder automatically advancing from Contact 1 to Contact 2 and dispatching Emily Dayton.
3. **1:10 - 1:50**: Tap "See responders on map". Show the live OpenStreetMap tracking view, the red route polyline, and the floating responder action card.
4. **1:50 - 2:30**: Open the **Audit Ledger**. Click "Verify Chain Integrity" (100% Valid). Click "Simulate DB Tampering" and hit Verify again—watch the system immediately flag the corrupted block in bright red!
5. **2:30 - 3:00**: Open Admin Controls and run the **20-Incident Benchmark Simulation**, presenting hard numbers for MTTN (< 2s) and 100% tamper detection accuracy.
