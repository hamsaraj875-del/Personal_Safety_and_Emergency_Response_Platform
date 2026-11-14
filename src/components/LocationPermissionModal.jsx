import React, { useState } from 'react';
import { MapPin, ShieldCheck, Navigation, AlertTriangle, X } from 'lucide-react';
import { requestLocationPermission, getCurrentDeviceLocation, reverseGeocodeCoords } from '../services/locationService';

export default function LocationPermissionModal({ onLocationAcquired, onClose }) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleGrantPermission = async () => {
    setIsRequesting(true);
    setErrorMsg(null);

    try {
      // 1. Request OS / Browser Permission
      const perm = await requestLocationPermission();
      if (!perm.granted) {
        setErrorMsg(perm.error || "Location access was denied. Please allow location permissions in your browser or device settings.");
        setIsRequesting(false);
        return;
      }

      // 2. Fetch actual hardware coordinates
      const coords = await getCurrentDeviceLocation();
      const addr = await reverseGeocodeCoords(coords.lat, coords.lng);

      // 3. Pass acquired location back to parent
      if (onLocationAcquired) {
        onLocationAcquired({
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          address: addr
        });
      }
    } catch (err) {
      console.error("Permission flow error:", err);
      setErrorMsg("Failed to retrieve GPS signal. Please ensure location services are enabled on your device.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex flex-col justify-end p-4 select-none animate-fadeIn">
      {/* Clean White Bottom Card */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
        {/* Top Handle */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mb-3" />

        {/* Animated Location Beacon Icon */}
        <div className="relative w-16 h-16 my-2 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-100 animate-ping opacity-75" />
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF576D] to-[#EA3B52] text-white flex items-center justify-center shadow-lg shadow-rose-500/30 z-10">
            <Navigation className={`w-7 h-7 stroke-[2.5] ${isRequesting ? 'animate-spin' : ''}`} />
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">
          Allow Device Location
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-relaxed">
          Jagrath requires real-time GPS access to dispatch nearby responders to your exact spot and map surrounding emergency hubs.
        </p>

        {/* Benefits Box */}
        <div className="w-full my-4 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-left space-y-2 text-xs">
          <div className="flex items-start gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span><strong>Live Victim Pinpoint:</strong> Incoming ambulances can navigate to you with sub-meter accuracy.</span>
          </div>
          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-[#EA3B52] flex-shrink-0 mt-0.5" />
            <span><strong>Surrounding Area Safety:</strong> Displays nearby hospitals, police posts, and safe zones on Google Maps.</span>
          </div>
        </div>

        {errorMsg && (
          <div className="w-full p-2.5 mb-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs text-left">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#EA3B52]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={handleGrantPermission}
            disabled={isRequesting}
            className="w-full py-3.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            <Navigation className={`w-4 h-4 ${isRequesting ? 'animate-spin' : ''}`} />
            <span>{isRequesting ? 'Accessing Device Location...' : 'Grant Location Access'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-2xl text-xs transition-colors"
          >
            Continue with Default Coordinates
          </button>
        </div>
      </div>
    </div>
  );
}
