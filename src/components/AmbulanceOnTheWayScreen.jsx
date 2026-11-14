import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShieldAlert, Navigation, Phone, ShieldCheck, MapPin, Crosshair, AlertCircle } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import GoogleMapsRoutePolyline from './GoogleMapsRoutePolyline';
import AmbulanceIllustration from './AmbulanceIllustration';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ID, GOOGLE_MAPS_ATTRIBUTION } from '../constants/mapsConfig';
import { MAP_CONFIG, VERIFIED_RESPONDERS, getSurroundingSafetyHubs } from '../constants/initialData';
import { getCurrentDeviceLocation, requestLocationPermission, reverseGeocodeCoords } from '../services/locationService';

function CameraPan({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
}

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
  const responder = activeResponder || VERIFIED_RESPONDERS[0];

  // User position
  const [pos, setPos] = useState(() => {
    if (userCoords?.lat && userCoords?.lng) return userCoords;
    return { lat: MAP_CONFIG.userPos[0], lng: MAP_CONFIG.userPos[1] };
  });

  const [responderPos] = useState({
    lat: MAP_CONFIG.responderPos[0],
    lng: MAP_CONFIG.responderPos[1]
  });

  // Surrounding emergency hubs
  const [safetyHubs, setSafetyHubs] = useState(() => getSurroundingSafetyHubs(pos));
  const [selectedHub, setSelectedHub] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Live GPS Ready");

  // Route points
  const [route, setRoute] = useState(() => [
    { lat: MAP_CONFIG.responderPos[0], lng: MAP_CONFIG.responderPos[1] },
    { lat: (MAP_CONFIG.responderPos[0] + pos.lat) / 2 + 0.001, lng: (MAP_CONFIG.responderPos[1] + pos.lng) / 2 - 0.001 },
    pos
  ]);

  // Keep safety hubs synced when coordinates change
  useEffect(() => {
    if (userCoords?.lat && userCoords?.lng) {
      setPos(userCoords);
      setSafetyHubs(getSurroundingSafetyHubs(userCoords));
      setRoute([
        responderPos,
        { lat: (responderPos.lat + userCoords.lat) / 2 + 0.001, lng: (responderPos.lng + userCoords.lng) / 2 - 0.001 },
        userCoords
      ]);
    }
  }, [userCoords, responderPos]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationStatus("Locating...");
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
      setSafetyHubs(getSurroundingSafetyHubs(newPos));
      setLocationStatus("Live GPS Synced");
    } catch (err) {
      console.warn("GPS sync error:", err);
      setLocationStatus("GPS Timeout");
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

        {/* Locate Me Trigger */}
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
        <h1 className="text-[20px] font-extrabold tracking-tight leading-tight text-white drop-shadow-sm flex items-center gap-2">
          <span>Ambulance & responders on the way</span>
        </h1>
        <p className="text-[11px] text-white/90 leading-snug mt-0.5">
          Speak calmly until responders arrive. Surrounding emergency facilities mapped below.
        </p>
      </div>

      {/* Embedded Google Map Container */}
      <div className="relative flex-1 w-full my-1 rounded-2xl overflow-hidden border-y border-white/15 shadow-inner bg-slate-900">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry']}>
          <Map
            mapId={GOOGLE_MAPS_ID}
            internalUsageAttributionIds={GOOGLE_MAPS_ATTRIBUTION}
            defaultCenter={pos}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={true}
            style={{ width: '100%', height: '100%' }}
          >
            <CameraPan center={pos} />

            {/* 1. Live User Marker */}
            <AdvancedMarker position={pos} title="Your Live Location">
              <div className="relative flex flex-col items-center cursor-pointer">
                <div className="px-2 py-0.5 bg-white text-slate-900 rounded-full shadow-lg border border-slate-200 text-[10px] font-extrabold mb-0.5 whitespace-nowrap">
                  You are here
                </div>
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <div className="absolute w-5 h-5 bg-rose-500/40 rounded-full animate-ping" />
                  <div className="w-3.5 h-3.5 bg-[#EA3B52] border-2 border-white rounded-full shadow-md z-10" />
                </div>
              </div>
            </AdvancedMarker>

            {/* 2. Approaching Ambulance / 1st Responder */}
            <AdvancedMarker position={responderPos} title={`${responder.name} (Approaching)`}>
              <div className="relative flex flex-col items-center cursor-pointer animate-bounce">
                <div className="px-2 py-0.5 bg-rose-600 text-white rounded-full shadow-lg text-[10px] font-bold mb-0.5 whitespace-nowrap flex items-center gap-1 border border-white">
                  <span>🚑 Ambulance ({responder.etaMinutes}m)</span>
                </div>
                <div className="w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-md" />
              </div>
            </AdvancedMarker>

            {/* 3. Surrounding Safety Hubs Markers */}
            {safetyHubs.map((hub) => (
              <AdvancedMarker
                key={hub.id}
                position={hub.location}
                title={hub.name}
                onClick={() => setSelectedHub(hub)}
              >
                <div className="relative flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-7 h-7 rounded-full bg-white shadow-md border-2 border-slate-800 flex items-center justify-center text-xs">
                    {hub.icon}
                  </div>
                  <div className="px-1.5 py-0.2 bg-slate-900/90 text-white rounded text-[8px] font-bold mt-0.5 whitespace-nowrap">
                    {hub.distanceMeters}m
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* 4. Active Route Polyline */}
            <GoogleMapsRoutePolyline path={route} color="#FFFFFF" weight={4} />
          </Map>
        </APIProvider>

        {/* Live Surrounding Hubs Pill Overlay */}
        <div className="absolute top-2 left-2 z-10 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white">4 Surrounding Safety Hubs Mapped</span>
        </div>

        {/* Selected Hub Popup Card */}
        {selectedHub && (
          <div className="absolute bottom-2 left-2 right-2 z-20 bg-white text-slate-900 p-2.5 rounded-xl shadow-2xl border border-slate-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedHub.icon}</span>
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{selectedHub.name}</h4>
                <p className="text-[10px] text-slate-500">{selectedHub.address} • <strong>{selectedHub.distanceMeters}m away</strong></p>
              </div>
            </div>
            <button
              onClick={() => setSelectedHub(null)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-800 p-1"
            >
              ✕
            </button>
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
