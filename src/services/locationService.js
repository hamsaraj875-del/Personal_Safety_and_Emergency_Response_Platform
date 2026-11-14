// Unified Device Geolocation Service (Capacitor Native + Web Geolocation API)
import { Geolocation } from '@capacitor/geolocation';

/**
 * Checks and requests device location permission.
 * Works seamlessly across Android, iOS, and Mobile/Desktop Browsers.
 */
export async function requestLocationPermission() {
  try {
    // 1. Try Capacitor Native Plugin first (if running on Android/iOS/Hybrid)
    if (typeof Geolocation?.checkPermissions === 'function') {
      const status = await Geolocation.checkPermissions();
      if (status.location === 'granted') {
        return { granted: true };
      }
      const req = await Geolocation.requestPermissions();
      if (req.location === 'granted') {
        return { granted: true };
      }
    }
  } catch (capErr) {
    console.warn("Capacitor Geolocation check fallback to Web API:", capErr);
  }

  // 2. Standard Web Geolocation API
  if (!navigator?.geolocation) {
    return { granted: false, error: "Geolocation is not supported by this device/browser." };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve({ granted: true }),
      (err) => {
        let msg = "Location permission denied.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Please allow location access in your device/browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out.";
        }
        resolve({ granted: false, error: msg });
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  });
}

/**
 * Fetches the user's current physical coordinates with high accuracy.
 */
export async function getCurrentDeviceLocation() {
  try {
    // 1. Try Capacitor Native Plugin
    if (typeof Geolocation?.getCurrentPosition === 'function') {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      });
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp
      };
    }
  } catch (capErr) {
    console.warn("Capacitor getCurrentPosition fallback to Web API:", capErr);
  }

  // 2. Standard Web Geolocation API
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error("Geolocation is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        });
      },
      (err) => {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  });
}

/**
 * Reverse geocodes latitude & longitude into a readable address.
 * Prioritizes Google Maps Geocoder if loaded, falling back gracefully.
 */
export async function reverseGeocodeCoords(lat, lng) {
  // Option 1: Use window.google.maps.Geocoder if API is initialized
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
    } catch (gErr) {
      console.warn("Google Maps Geocoder error, using fallback:", gErr);
    }
  }

  // Option 2: Fallback to OpenStreetMap reverse geocoding
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (fetchErr) {
    console.warn("Reverse geocode fetch failed:", fetchErr);
  }

  return `Near GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
