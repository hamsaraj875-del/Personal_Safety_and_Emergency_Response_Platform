# Jaagruth — Emergency Response & Personal Safety Coordination Platform

Jaagruth is a native Android emergency response coordination platform designed to protect users through rapid multi-tier escalation, automated contact notification, smart verified responder matching, live GPS tracking, and comprehensive incident history auditing.

> **Note:** This repository contains the complete native Android frontend application. All backend-dependent operations (user authentication, cloud dispatch, responder telematics, and audit ledgers) currently operate via local business logic and centralized mock data sources.

---

## 1. Project Overview & Features

Jaagruth bridges the critical response gap during emergencies with an intuitive red-and-white safety design system:

- **Instant SOS Activation:** Large circular pulsing SOS button with concentric animated glow rings and haptic feedback.
- **5-Second Safeguard Countdown:** Full-screen red gradient countdown with immediate one-tap cancellation to prevent accidental alerts.
- **Dynamic 5-Stage Escalation Ladder:** Automatically escalates through:
  1. Primary Contact notification
  2. Secondary Contact notification
  3. Smart Verified Responder dispatch
  4. Central Admin Emergency Operations coordination
  5. Direct National Emergency Services (112) dialer prompt
- **Smart Responder Matching Algorithm:** Multi-criteria weighted ranking algorithm that evaluates responder distance, estimated arrival time (ETA), verification status, emergency category (Security, Medical, Volunteer), and historical response performance.
- **Live OpenStreetMap Tracking:** Full-screen osmdroid map showing user and responder markers, route polyline, and simulated real-time movement with ETA updates and automatic `ON_SCENE` status triggers.
- **Trusted Contacts Management:** Priority-ordered emergency contacts list (up to 5 contacts) with phone validation, explicit consent enforcement, and real-time deletion/reordering.
- **Incident History & Audit Verification:** Complete log of historical incidents with detailed timelines and interactive local verification simulation.
- **Simulated Offline Mode:** Instant fallback to native Android `ACTION_SENDTO` SMS preparation and `ACTION_DIAL` emergency calling, with automatic reconnect synchronization.
- **Developer Demo Controls:** Built-in floating controls dialog (accessible via badge or long-press on active incident) allowing hackathon judges to simulate contact acknowledgement, responder acceptance, arrival, and resolution without external servers.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Language** | Kotlin |
| **UI** | Native Android XML Layouts |
| **Design System** | Material Design 3 (`Theme.Material3.Light.NoActionBar`) |
| **Architecture** | MVVM (Model-View-ViewModel) + Clean Architecture |
| **Navigation** | Android Jetpack Navigation Component |
| **State Management** | Kotlin Coroutines & `StateFlow` |
| **Dependency Injection**| Manual Dependency Injection (`JaagruthApp` Service Locator) |
| **Maps** | OpenStreetMap via osmdroid (`org.osmdroid:osmdroid-android:6.1.20`) |
| **Location** | Google Play Services Fused Location Provider |
| **Serialization** | Google Gson |
| **Image Loading** | Coil |
| **Testing** | JUnit 4 |

---

## 3. Project Structure

```text
hackathon/
│
├── app/
│   ├── build.gradle.kts
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/jaagruth/
│       │   │   ├── MainActivity.kt
│       │   │   ├── JaagruthApp.kt
│       │   │   ├── data/
│       │   │   │   ├── local/
│       │   │   │   │   └── MockDataSource.kt
│       │   │   │   ├── models/
│       │   │   │   │   ├── Contact.kt
│       │   │   │   │   ├── Incident.kt
│       │   │   │   │   ├── IncidentEvent.kt
│       │   │   │   │   ├── IncidentStatus.kt
│       │   │   │   │   ├── Responder.kt
│       │   │   │   │   └── User.kt
│       │   │   │   └── repository/
│       │   │   │       ├── AuthRepository.kt
│       │   │   │       ├── ContactRepository.kt
│       │   │   │       ├── IncidentRepository.kt
│       │   │   │       └── ResponderRepository.kt
│       │   │   ├── services/
│       │   │   │   ├── EscalationEngine.kt
│       │   │   │   ├── LocationService.kt
│       │   │   │   ├── NotificationService.kt
│       │   │   │   └── SmsCallService.kt
│       │   │   ├── ui/
│       │   │   │   ├── splash/
│       │   │   │   │   └── SplashFragment.kt
│       │   │   │   ├── auth/
│       │   │   │   │   ├── LoginFragment.kt
│       │   │   │   │   └── RegisterFragment.kt
│       │   │   │   ├── home/
│       │   │   │   │   └── HomeFragment.kt
│       │   │   │   ├── incident/
│       │   │   │   │   ├── ActiveIncidentFragment.kt
│       │   │   │   │   └── SosCountdownFragment.kt
│       │   │   │   ├── tracking/
│       │   │   │   │   └── LiveTrackingFragment.kt
│       │   │   │   ├── contacts/
│       │   │   │   │   └── ContactsFragment.kt
│       │   │   │   ├── history/
│       │   │   │   │   ├── HistoryFragment.kt
│       │   │   │   │   └── IncidentDetailFragment.kt
│       │   │   │   └── profile/
│       │   │   │       └── ProfileFragment.kt
│       │   │   ├── viewmodel/
│       │   │   │   ├── AuthViewModel.kt
│       │   │   │   ├── ContactViewModel.kt
│       │   │   │   ├── HistoryViewModel.kt
│       │   │   │   ├── HomeViewModel.kt
│       │   │   │   ├── IncidentViewModel.kt
│       │   │   │   ├── ProfileViewModel.kt
│       │   │   │   └── TrackingViewModel.kt
│       │   │   ├── adapters/
│       │   │   │   ├── ContactAdapter.kt
│       │   │   │   ├── IncidentAdapter.kt
│       │   │   │   └── TimelineAdapter.kt
│       │   │   └── utils/
│       │   │       ├── Constants.kt
│       │   │       └── Extensions.kt
│       │   └── res/
│       │       ├── anim/
│       │       ├── color/
│       │       ├── drawable/
│       │       ├── font/
│       │       ├── layout/
│       │       ├── menu/
│       │       ├── navigation/
│       │       └── values/
│       └── test/java/com/jaagruth/
│           ├── IncidentStatusTest.kt
│           └── ResponderMatcherTest.kt
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── local.properties
└── README.md
```

---

## 4. Android Studio Setup & How to Run

### Prerequisites
- Android Studio Ladybug / Koala / Meerkat (or newer)
- Android SDK 35/36 installed (API 26 minimum supported)
- JDK 17 or JDK 21

### Opening the Project in Android Studio
1. Launch Android Studio.
2. Select **Open** and choose the `app/` directory from this repository.
3. Wait for Gradle to sync.
4. Select `app` in the run configuration drop-down.
5. Select a connected physical Android device or an Android Emulator (API 26+).
6. Click **Run (Shift + F10)**.

### Building from Terminal
To build the debug APK directly:
```bash
./gradlew assembleDebug
```
The compiled APK will be located at:
`app/build/outputs/apk/debug/app-debug.apk`

To execute all unit tests:
```bash
./gradlew test
```

---

## 5. Required Permissions

The application requests only necessary permissions in `AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`: To obtain the user's location when an SOS is triggered. If permissions are withheld, the app gracefully falls back to predefined Bengaluru coordinates (`12.9716, 77.5946`).
- `INTERNET`: For loading OpenStreetMap map tiles via osmdroid.
- `VIBRATE`: For tactile haptic confirmation during SOS initiation.
- `POST_NOTIFICATIONS`: For displaying urgent incident status and escalation updates.

*Note: Telephony dialer (`ACTION_DIAL`) and SMS composer (`ACTION_SENDTO`) use Android system intents that require user confirmation, eliminating the need for invasive `CALL_PHONE` or `SEND_SMS` permissions.*

---

## 6. End-to-End Demo Workflow for Judges

1. **Launch:** App displays the splash screen with branding and animates into the **Home** screen.
2. **Review Home:** Notice user greeting, GPS status badge, current location card, and trusted contacts preview.
3. **Trigger SOS:** Tap the circular pulsing **SOS** button.
4. **Countdown Screen:** A 5-second animated countdown begins with haptic feedback. (Tap *Cancel* to safely abort at any time).
5. **Active Emergency:** Once the countdown reaches 0:
   - Incident is registered with a unique ID (e.g. `#INC-2026-xxxx`).
   - Dynamic heading displays current escalation status.
   - Escalation countdown timer ticks down to the next stage (10s in Fast Mode, 60s in Normal Mode).
   - Escalation ladder displays visual states: Pending, Active, Completed, or Timed Out.
   - Event timeline updates in real-time.
6. **Developer Demo Controls:**
   - Tap the red **DEMO CONTROLS** chip in the hero header (or long-press the title).
   - Tap **Contact acknowledges** → Updates ladder state.
   - Tap **Responder accepts** → Triggers smart responder matching and assigns top-rated responder (e.g., Ravi Kumar).
   - Tap **Simulate responder arrival** → Changes status to `ON_SCENE`.
7. **Live Tracking:**
   - Tap **See responders on map**.
   - View user marker, responder marker, and red route polyline on OpenStreetMap.
   - Watch the responder move 25% closer every 2 seconds with dynamic ETA and distance updates.
   - Tap **Call Responder** or **Message** to trigger Android system intents.
8. **Resolution & History:**
   - Return to Active Incident and tap **I am safe / Cancel request** → choose **I am Safe (Resolved)**.
   - Open the **History** tab from the bottom navigation to inspect the archived incident with full duration and event chain.
   - Tap the incident card and click **Verify record** to simulate hash-chain audit integrity.
9. **Settings & Offline Testing:**
   - Open the **Profile** tab.
   - Toggle **Simulate Offline Mode** → observe the yellow offline warning banner.
   - Triggering SOS in offline mode prepares a pre-formatted emergency SMS via `ACTION_SENDTO`.
   - Turn off Offline Mode → observe the reconnect synchronization toast.

---

## 7. Mock Data & Future Backend Integration Points

All server-dependent features currently read from and write to clean repository abstractions backed by `MockDataSource.kt` and `SharedPreferences`.

When connecting a real production backend in the future, replace the repository internals as follows:

| Repository / Service | Current Simulation | Future Backend Replacement |
|---|---|---|
| `AuthRepository.kt` | Local SharedPreferences session with `MockDataSource.defaultUser` | Retrofit Auth API (`/api/v1/auth/login`, `/register`, JWT Bearer token storage) |
| `IncidentRepository.kt` | Local state flow with in-memory list and SharedPreferences persistence | WebSocket / Server-Sent Events (SSE) connection to Incident Dispatch Engine (`/api/v1/incidents/active`) |
| `ResponderRepository.kt` | Local weighted scoring algorithm in `ResponderRepository.findBestResponder()` | Backend Geo-spatial matching engine (PostGIS + Uber H3 / OSRM routing) |
| `EscalationEngine.kt` | Coroutine ladder timer with demo override hooks | Backend push notifications via FCM + Twilio Programmable Voice/SMS webhook events |
| `IncidentDetailFragment.kt` | Local hash check simulation | Cryptographic hash-chain verification endpoint (`// TODO: Replace mock verification with server-side hash-chain verification.`) |
| `LocationService.kt` | FusedLocationProviderClient with local geocoder | Continuous GPS telemetry stream to backend WebSocket during active incident |
