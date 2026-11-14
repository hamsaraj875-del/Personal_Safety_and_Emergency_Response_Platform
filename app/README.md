# Jaagruth Android app

Native citizen app built with Kotlin, Jetpack Compose, Retrofit/OkHttp, osmdroid, and the `/api/v1` Node server. The UI is Compose based; the backend integration is in progress, so some screens and offline flows may still be local.

## Prerequisites

- Android Studio with Android SDK 35/36
- JDK 17
- A running Jaagruth server (see [server/README.md](../server/README.md))

## Configure and run

1. Open this `app/` directory in Android Studio and sync Gradle.
2. In `app/local.properties`, set the server URL for a physical device or tunnel:
   ```properties
   jaagruth.baseUrl=https://YOUR_REACHABLE_HOST/api/v1/
   jaagruth.wsUrl=wss://YOUR_REACHABLE_HOST/ws
   ```
   The debug build defaults to the Android emulator host `10.0.2.2` if these values are absent.
3. Select an emulator or connected device and run the `app` configuration.

The seeded demo login is phone `+91 98765 43210` and password `password123`. Seeded safety and duress PINs are `1234` and `9999`; change them before using a non-demo account.

Build and test from this folder:

```bash
./gradlew testDebugUnitTest assembleDebug
```

The debug APK is written to `app/build/outputs/apk/debug/app-debug.apk`. Do not commit `local.properties`, build output, or credentials. A physical device must be able to reach the server; use HTTPS for a tunnel or deployed endpoint.
