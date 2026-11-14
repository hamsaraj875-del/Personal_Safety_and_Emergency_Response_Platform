import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShieldAlert, Navigation, Phone, ShieldCheck, MapPin, Crosshair, AlertCircle } from 'lucide-react';
import LiveEmergencyMap from './LiveEmergencyMap';
import { MAP_CONFIG, getNearbyResponders, getSurroundingSafetyHubs, getLocalRoutePoints } from '../constants/initialData';
import { getCurrentDeviceLocation, requestLocationPermission, reverseGeocodeCoords } from '../services/locationService';

export default function AmbulanceOnTheWayScreen({
  onBack,
  onSeeMap,
  onCancelRequest,
  escalationStep = 3,
  elapsedSeconds = 42,
  userCoords,
  onUpdateUserCoords,
  activeResponder,
  onCall,
  onRequestLocationPermission
}) {
  // 1. Live User position (Defaults to campus or actual device GPS)
  const [pos, setPos] = useState(() => {
    if (userCoords?.lat && userCoords?.lng) return userCoords;
    return { lat: MAP_CONFIG.userPos[0], lng: MAP_CONFIG.userPos[1] };
  });

  // 2. Dynamically calculate Local Responder in the SAME neighborhood/city as user
  const localResponders = getNearbyResponders(pos);
  const responder = activeResponder || localResponders[0];
  const [responderPos, setResponderPos] = useState(() => responder.location);

  // 3. Surrounding emergency hubs relative to user's real location
  const [safetyHubs, setSafetyHubs] = useState(() => getSurroundingSafetyHubs(pos));
  const [selectedHub, setSelectedHub] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // 4. Street-level Route Polyline connecting local responder to user
  const [route, setRoute] = useState(() => getLocalRoutePoints(pos, responder.location));

  // Sync positions whenever userCoords change
  useEffect(() => {
    if (userCoords?.lat && userCoords?.lng) {
      setPos(userCoords);
      const updatedNearby = getNearbyResponders(userCoords);
      const activeResp = activeResponder || updatedNearby[0];
      setResponderPos(activeResp.location);
      setSafetyHubs(getSurroundingSafetyHubs(userCoords));
      setRoute(getLocalRoutePoints(userCoords, activeResp.location));
    }
  }, [userCoords, activeResponder]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const perm = await requestLocationPermission();
      if (!perm.granted) {
        if (onRequestLocationPermission) {
          onRequestLocationPermission();
        } else {
          alert("Location permission is needed to pinpoint approaching ambulances to your live position.");
        }
        setIsLocating(false);
        return;
      }
      const coords = await getCurrentDeviceLocation();
      const newPos = { lat: coords.lat, lng: coords.lng };
      setPos(newPos);
      if (onUpdateUserCoords) onUpdateUserCoords(newPos);

      // Dynamically reposition responder & hubs to user's local neighborhood
      const updatedNearby = getNearbyResponders(newPos);
      setResponderPos(updatedNearby[0].location);
      setSafetyHubs(getSurroundingSafetyHubs(newPos));
      setRoute(getLocalRoutePoints(newPos, updatedNearby[0].location));
    } catch (err) {
      console.warn("GPS sync error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#E11D48] via-[#BE123C] to-[#9F1239] text-white overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="pt-2 px-4 pb-2 flex items-center justify-between z-20 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Live Elapsed Incident Timer Badge */}
        <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-white">
            ACTIVE {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Quick GPS Refresh */}
        <button
          onClick={handleLocateMe}
          className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1 border border-white/20 active:scale-95 transition-all"
        >
          <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'GPS'}</span>
        </button>
      </div>

      {/* Main Title Banner */}
      <div className="px-5 pb-1 z-10 flex-shrink-0 text-left">
        <h1 className="text-[19px] sm:text-[21px] font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
          Ambulance & responders on the way
        </h1>
        <p className="text-[11px] text-white/90 leading-snug mt-0.5">
          Approaching from your local sector (~{responder.distanceKm || 0.9} km away). Surrounding safety hubs mapped below.
        </p>
      </div>

      {/* Embedded Live Map Container (Zero-Watermark Emergency Map with Google Maps toggle) */}
      <div className="relative flex-1 w-full my-1 rounded-2xl overflow-hidden border-y border-white/15 shadow-inner bg-slate-900">
        <LiveEmergencyMap
          userPos={pos}
          responderPos={responderPos}
          safetyHubs={safetyHubs}
          routePoints={route}
          activeResp={responder}
          onSelectHub={setSelectedHub}
          isLocating={isLocating}
          onLocateMe={handleLocateMe}
        />

        {/* Selected Hub Popup Card */}
        {selectedHub && (
          <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-white text-slate-900 p-2.5 rounded-xl shadow-2xl border border-slate-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedHub.icon}</span>
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{selectedHub.name}</h4>
                <p className="text-[10px] text-slate-500">{selectedHub.address} • <strong>{selectedHub.distanceMeters}m away</strong></p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => alert(`Dialing ${selectedHub.name} (${selectedHub.phone})...`)}
                className="px-2 py-1 bg-[#EA3B52] text-white rounded-lg text-[10px] font-bold hover:bg-[#d92d44]"
              >
                Call
              </button>
              <button
                onClick={() => setSelectedHub(null)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-800 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Surrounding Areas Quick Badges */}
      <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar z-10 flex-shrink-0">
        {safetyHubs.map((hub) => (
          <button
            key={hub.id}
            onClick={() => setSelectedHub(hub)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-semibold whitespace-nowrap active:scale-95 transition-all text-white/95"
          >
            <span>{hub.icon}</span>
            <span>{hub.category}</span>
            <span className="text-amber-300 font-bold">({hub.distanceMeters}m)</span>
          </button>
        ))}
      </div>

      {/* Escalation Progress & Actions */}
      <div className="p-4 pt-1 z-20 flex-shrink-0 flex flex-col gap-2 bg-gradient-to-t from-black/20 to-transparent">
        {/* Escalation Ladder Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/15 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold text-white/95">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>Escalation Ladder: Step {escalationStep} of 5</span>
          </div>
          <span className="text-amber-300 font-bold">{responder.name} Assigned</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCall && onCall(responder)}
            className="flex-1 py-3 px-4 bg-white text-[#EA3B52] hover:bg-slate-50 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Call {responder.name}</span>
          </button>

          <button
            onClick={onSeeMap}
            className="py-3 px-4 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Full Map</span>
          </button>
        </div>

        <button
          onClick={onCancelRequest}
          className="text-white/80 hover:text-white text-[12px] font-medium tracking-wide py-0.5 transition-colors text-center"
        >
          Cancel request (Requires PIN)
        </button>
      </div>
    </div>
  );
}
