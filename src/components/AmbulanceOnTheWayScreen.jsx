import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ShieldAlert,
  Navigation,
  Phone,
  ShieldCheck,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Info,
  RefreshCw,
  Compass
} from 'lucide-react';
import LiveEmergencyMap from './LiveEmergencyMap';
import { MAP_CONFIG, getNearbyResponders, getLocalRoutePoints } from '../constants/initialData';
import { getCurrentDeviceLocation, requestLocationPermission } from '../services/locationService';
import {
  getLiveSurroundingEmergencyHubs,
  getVerifiedBengaluruFacilities,
  getDistanceKm,
  formatDistance
} from '../services/emergencyPlacesService';

export default function AmbulanceOnTheWayScreen({
  onBack,
  onSeeMap,
  onCancelRequest,
  escalationStep = 4,
  elapsedSeconds = 42,
  userCoords,
  onUpdateUserCoords,
  activeResponder,
  onCall,
  onRequestLocationPermission
}) {
  // 1. Live User position (Defaults to campus or device GPS)
  const [pos, setPos] = useState(() => {
    if (userCoords?.lat && userCoords?.lng) return userCoords;
    return { lat: MAP_CONFIG.userPos[0], lng: MAP_CONFIG.userPos[1] };
  });

  // Helper to ensure responder is strictly within local sector (< 20 km)
  const getSafeResponder = (uPos, resp) => {
    const nearby = getNearbyResponders(uPos);
    if (!resp || !resp.location) return nearby[0];
    const dist = getDistanceKm(uPos.lat, uPos.lng, resp.location.lat, resp.location.lng);
    // If distance > 20 km (e.g. legacy North America coordinates), discard and anchor locally
    if (dist > 20) {
      return nearby[0];
    }
    return resp;
  };

  // 2. Active Local Responder
  const [responder, setResponder] = useState(() => getSafeResponder(pos, activeResponder));
  const [responderPos, setResponderPos] = useState(() => responder.location);

  // 3. Surrounding emergency hubs & hospital analysis (Initialized immediately with verified local hubs)
  const [safetyHubs, setSafetyHubs] = useState(() => {
    try {
      const v = getVerifiedBengaluruFacilities(pos);
      return [
        { ...v.hospitals[1], id: "hub_primary_hospital", category: "Hospital / Medical Center" },
        { ...v.police, id: "hub_primary_police", category: "Law Enforcement" },
        { ...v.safeZone, id: "hub_primary_safezone", category: "Guarded Safe Haven" },
        { ...v.fireStation, id: "hub_primary_fire", category: "Fire & Rescue Station" }
      ];
    } catch (e) {
      return [];
    }
  });
  const [hospitalAnalysis, setHospitalAnalysis] = useState(null);
  const [selectedHub, setSelectedHub] = useState(null);
  const [simulateClosed, setSimulateClosed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingHubs, setIsLoadingHubs] = useState(false);

  // 4. Street-level Route Polyline connecting local responder to user
  const [route, setRoute] = useState(() => getLocalRoutePoints(pos, responder.location));

  // Sync positions when userCoords change
  useEffect(() => {
    if (userCoords?.lat && userCoords?.lng) {
      setPos(userCoords);
      const safeResp = getSafeResponder(userCoords, activeResponder);
      setResponder(safeResp);
      setResponderPos(safeResp.location);
      setRoute(getLocalRoutePoints(userCoords, safeResp.location));
    }
  }, [userCoords, activeResponder]);

  // Fetch live real-world surrounding emergency hubs (20 km radius) & hospital availability
  useEffect(() => {
    let isMounted = true;
    async function loadHubs() {
      setIsLoadingHubs(true);
      try {
        const result = await getLiveSurroundingEmergencyHubs(pos, simulateClosed);
        if (isMounted && result) {
          setSafetyHubs(result.hubs);
          setHospitalAnalysis(result.hospitalAnalysis);
        }
      } catch (err) {
        console.warn("Failed to load live surrounding hubs:", err);
      } finally {
        if (isMounted) setIsLoadingHubs(false);
      }
    }
    loadHubs();
    return () => {
      isMounted = false;
    };
  }, [pos, simulateClosed]);

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

      // Re-anchor responder & local route to user's local neighborhood
      const updatedNearby = getNearbyResponders(newPos);
      setResponder(updatedNearby[0]);
      setResponderPos(updatedNearby[0].location);
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
      <div className="pt-2 px-4 pb-1.5 flex items-center justify-between z-20 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Live Elapsed Incident Timer Badge */}
        <div className="bg-black/35 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-white">
            ACTIVE {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Quick GPS Refresh */}
        <button
          onClick={handleLocateMe}
          className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1 border border-white/20 active:scale-95 transition-all shadow-xs"
        >
          <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Locating...' : 'GPS'}</span>
        </button>
      </div>

      {/* Main Title Banner */}
      <div className="px-4 pb-1 z-10 flex-shrink-0 text-left">
        <h1 className="text-[20px] font-medium tracking-tight leading-tight text-white drop-shadow-sm">
          Ambulance & responders on the way
        </h1>
        <p className="text-[13px] text-white/90 font-normal leading-snug mt-0.5">
          Approaching from your local sector (~{responder.distanceKm || 0.9} km). Real surrounding emergency facilities mapped below.
        </p>
      </div>

      {/* Hospital Opening / Closing Hours & Intelligent Rerouting Status Banner */}
      {hospitalAnalysis && (
        <div className="px-4 py-0.5 z-20 flex-shrink-0">
          {hospitalAnalysis.isRerouted ? (
            <div className="bg-amber-950/80 backdrop-blur-md border border-amber-400/50 rounded-xl p-2.5 text-left shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Closest Facility Closed • Rerouted to 24/7 Center</span>
                </div>
                <button
                  onClick={() => setSimulateClosed(!simulateClosed)}
                  className="text-[9px] font-semibold bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 px-2 py-0.5 rounded-full border border-amber-400/30 transition-colors"
                >
                  Live Mode
                </button>
              </div>
              <p className="text-[10px] text-white/90 mt-1 leading-snug">
                Nearest clinic <strong>{hospitalAnalysis.closestFacility.name}</strong> ({formatDistance(hospitalAnalysis.closestFacility.distanceMeters)}) is <span className="text-rose-300 font-bold uppercase">CLOSED</span> ({hospitalAnalysis.closestFacility.closingTime || 'Closed after-hours'}).
              </p>
              <div className="mt-1.5 pt-1.5 border-t border-white/15 flex items-center justify-between">
                <div className="text-[10px] text-white truncate max-w-[210px]">
                  🏥 Active: <strong className="text-emerald-300">{hospitalAnalysis.activeHospital.name}</strong> ({formatDistance(hospitalAnalysis.activeHospital.distanceMeters)} · <span className="text-emerald-300 font-bold">24/7</span>)
                </div>
                <button
                  onClick={() => setSelectedHub(hospitalAnalysis.activeHospital)}
                  className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-0.5 rounded-md transition-colors"
                >
                  Briefing →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/70 backdrop-blur-md border border-emerald-400/40 rounded-xl px-2.5 py-1.5 text-left flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate max-w-[210px]">
                  <strong>{hospitalAnalysis.activeHospital?.name || 'KIMS Hospital'}</strong> • <span className="text-emerald-300 font-bold">OPEN 24/7</span> ({formatDistance(hospitalAnalysis.activeHospital?.distanceMeters || 1100)})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedHub(hospitalAnalysis.activeHospital)}
                  className="text-[10px] bg-white/15 hover:bg-white/25 text-white font-bold px-1.5 py-0.5 rounded transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => setSimulateClosed(!simulateClosed)}
                  title="Simulate nearest facility closing to test automated reroute"
                  className="text-[9px] bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 px-1.5 py-0.5 rounded border border-amber-300/30 font-medium"
                >
                  Test Closed
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded Live Map Container (Zero-Watermark Leaflet + Google Maps toggle) */}
      <div className="relative flex-1 w-full my-1 rounded-2xl overflow-hidden border-y border-white/15 shadow-inner bg-slate-900 min-h-[220px]">
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

        {/* Selected Hub Comprehensive Briefing Modal / Card */}
        {selectedHub && (
          <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-white text-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-200 animate-fadeIn text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-1 bg-slate-100 rounded-xl">{selectedHub.icon}</span>
                <div>
                  <h4 className="text-[12px] font-extrabold text-slate-900 leading-tight">
                    {selectedHub.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <span>{formatDistance(selectedHub.distanceMeters)} away</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{selectedHub.etaMins}m ETA</span>
                    <span>•</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded-full text-[9px] ${
                        selectedHub.openNow === false
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {selectedHub.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedHub(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-[10px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
              📍 {selectedHub.address}
            </p>

            <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{selectedHub.hoursDescription || selectedHub.openingHoursText || 'Operating 24/7'}</span>
            </div>

            <p className="text-[10px] text-slate-700 bg-amber-50/70 p-1.5 rounded-lg border border-amber-200/50 mt-1.5 leading-snug">
              ℹ️ {selectedHub.briefing || "Grounded emergency response location verified within active sector."}
            </p>

            <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => alert(`Dialing emergency facility: ${selectedHub.name} (${selectedHub.emergencyPhone || selectedHub.phone})...`)}
                className="flex-1 py-1.5 bg-[#EA3B52] text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[#d92d44] transition-all shadow-xs"
              >
                <Phone className="w-3 h-3 fill-current" />
                <span>Call ({selectedHub.emergencyPhone || selectedHub.phone})</span>
              </button>
              <button
                onClick={() => setSelectedHub(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Surrounding Areas 4 Major Real Facilities Quick Badges */}
      <div className="px-3 py-1 flex gap-1.5 overflow-x-auto no-scrollbar z-10 flex-shrink-0">
        {safetyHubs.map((hub) => (
          <button
            key={hub.id}
            onClick={() => setSelectedHub(hub)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap active:scale-95 transition-all shadow-xs ${
              hub.openNow === false
                ? 'bg-rose-950/70 border-rose-400/50 text-rose-200'
                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
            }`}
          >
            <span>{hub.icon}</span>
            <span className="font-bold">{hub.shortName || hub.name}</span>
            <span className="text-amber-300 font-mono font-bold">({formatDistance(hub.distanceMeters)})</span>
            {hub.openNow === false && <span className="text-[9px] bg-rose-600 px-1 rounded text-white font-bold">CLOSED</span>}
          </button>
        ))}
      </div>

      {/* Escalation Progress & Actions */}
      <div className="p-3 pt-0 z-20 flex-shrink-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/25 to-transparent">
        {/* Escalation Ladder Status */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/15 flex items-center justify-between text-[11px]">
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
            className="flex-1 py-2.5 px-4 bg-white text-[#EA3B52] hover:bg-slate-50 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Call {responder.name}</span>
          </button>

          <button
            onClick={onSeeMap}
            className="py-2.5 px-4 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Full Map</span>
          </button>
        </div>

        <button
          onClick={onCancelRequest}
          className="text-white/80 hover:text-white text-[11px] font-medium tracking-wide py-0.5 transition-colors text-center"
        >
          Cancel request (Requires PIN)
        </button>
      </div>
    </div>
  );
}
