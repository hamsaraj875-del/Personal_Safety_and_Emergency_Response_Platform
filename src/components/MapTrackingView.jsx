import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, ChevronLeft, ShieldCheck, Navigation, Crosshair, AlertCircle, Key, Info } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import GoogleMapsRoutePolyline from './GoogleMapsRoutePolyline';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ID, GOOGLE_MAPS_ATTRIBUTION } from '../constants/mapsConfig';
import { MAP_CONFIG, VERIFIED_RESPONDERS, getSurroundingSafetyHubs } from '../constants/initialData';
import { getCurrentDeviceLocation, requestLocationPermission, reverseGeocodeCoords } from '../services/locationService';

// Controller to smoothly pan the Google Map when center changes
function CameraController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
}

export default function MapTrackingView({
  onBack,
  onOpenInstruction,
  currentResponder,
  onCall,
  onMessage,
  userCoords,
  onUpdateUserCoords
}) {
  const activeResp = currentResponder || VERIFIED_RESPONDERS[0];

  // API Key handling
  const [apiKey] = useState(() => {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY;
  });

  // Live User Location state
  const [userPos, setUserPos] = useState(() => {
    if (userCoords?.lat && userCoords?.lng) return userCoords;
    return { lat: MAP_CONFIG.userPos[0], lng: MAP_CONFIG.userPos[1] };
  });

  const [responderPos] = useState({
    lat: MAP_CONFIG.responderPos[0],
    lng: MAP_CONFIG.responderPos[1]
  });

  // Surrounding emergency hubs around user
  const [safetyHubs, setSafetyHubs] = useState(() => getSurroundingSafetyHubs(userPos));
  const [selectedHub, setSelectedHub] = useState(null);

  const [routePoints, setRoutePoints] = useState(() => {
    return [
      { lat: MAP_CONFIG.responderPos[0], lng: MAP_CONFIG.responderPos[1] },
      { lat: (MAP_CONFIG.responderPos[0] + userPos.lat) / 2 + 0.001, lng: (MAP_CONFIG.responderPos[1] + userPos.lng) / 2 - 0.001 },
      userPos
    ];
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Live GPS Ready");

  // Keep surrounding hubs synced with userCoords
  useEffect(() => {
    if (userCoords?.lat && userCoords?.lng) {
      setUserPos(userCoords);
      setSafetyHubs(getSurroundingSafetyHubs(userCoords));
      setRoutePoints([
        responderPos,
        { lat: (responderPos.lat + userCoords.lat) / 2 + 0.001, lng: (responderPos.lng + userCoords.lng) / 2 - 0.001 },
        userCoords
      ]);
    }
  }, [userCoords, responderPos]);

  // Fetch real device location with user permission
  const handleFetchCurrentLocation = async () => {
    setIsLocating(true);
    setLocationStatus("Requesting GPS Permission...");

    try {
      const perm = await requestLocationPermission();
      if (!perm.granted) {
        setLocationStatus("Permission Denied");
        alert(perm.error || "Please allow location access to pinpoint your emergency coordinates.");
        setIsLocating(false);
        return;
      }

      setLocationStatus("Pinpointing Device Location...");
      const coords = await getCurrentDeviceLocation();
      const newPos = { lat: coords.lat, lng: coords.lng };
      setUserPos(newPos);
      if (onUpdateUserCoords) onUpdateUserCoords(newPos);
      setSafetyHubs(getSurroundingSafetyHubs(newPos));

      setRoutePoints([
        responderPos,
        { lat: (responderPos.lat + newPos.lat) / 2 + 0.001, lng: (responderPos.lng + newPos.lng) / 2 - 0.001 },
        newPos
      ]);

      const addr = await reverseGeocodeCoords(coords.lat, coords.lng);
      setLocationStatus(`Live: ${coords.accuracy ? `±${Math.round(coords.accuracy)}m` : 'Accurate'}`);
      alert(`Location Acquired!\nLatitude: ${coords.lat.toFixed(5)}\nLongitude: ${coords.lng.toFixed(5)}\nAddress: ${addr}`);
    } catch (err) {
      console.error("Failed to get device location:", err);
      setLocationStatus("GPS Timeout · Using Backup");
      alert("Unable to fetch device GPS. Please check location settings.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden select-none">
      {/* Top Header Card */}
      <div className="pt-3 px-5 pb-2.5 bg-white z-20 shadow-sm border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={onBack}
            className="w-8 h-8 -ml-1 flex items-center justify-center text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ● Google Maps Active
          </span>
        </div>

        <h1 className="text-[18px] sm:text-[20px] font-extrabold text-slate-900 leading-tight">
          Ambulance and responders on the way
        </h1>

        <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
          Live Google Maps tracking with certified first-aid escorts.
        </p>

        <button
          onClick={onOpenInstruction}
          className="text-[12px] font-bold text-[#EA3B52] hover:text-[#BE123C] mt-0.5 inline-block transition-colors underline-offset-2 hover:underline"
        >
          Open full emergency instruction →
        </button>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
        {/* Google Maps Container */}
        <APIProvider apiKey={apiKey} libraries={['marker', 'geometry']}>
          <Map
            mapId={GOOGLE_MAPS_ID}
            internalUsageAttributionIds={GOOGLE_MAPS_ATTRIBUTION}
            defaultCenter={userPos}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={true}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
            <CameraController center={userPos} />

            {/* 1. "You are here" Custom Advanced Marker */}
            <AdvancedMarker position={userPos} title="You are here">
              <div className="relative flex flex-col items-center cursor-pointer">
                <div className="px-3 py-1 bg-white text-slate-900 rounded-full shadow-lg border border-slate-200 text-[11px] font-bold mb-1 whitespace-nowrap">
                  You are here
                </div>
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <div className="absolute w-6 h-6 bg-rose-500/30 rounded-full animate-ping" />
                  <div className="w-4 h-4 bg-[#EA3B52] border-2 border-white rounded-full shadow-md z-10" />
                </div>
              </div>
            </AdvancedMarker>

            {/* 2. "1st Responder" Advanced Marker */}
            <AdvancedMarker position={responderPos} title={`${activeResp.name} (1st Responder)`}>
              <div className="relative flex flex-col items-center cursor-pointer">
                <div className="px-3 py-1 bg-slate-900 text-white rounded-full shadow-lg text-[11px] font-bold mb-1 whitespace-nowrap flex items-center gap-1">
                  <span>1st Responder</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="w-4 h-4 bg-slate-700 border-2 border-white rounded-full shadow-md" />
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
                  <div className="w-8 h-8 rounded-full bg-white shadow-lg border-2 border-slate-900 flex items-center justify-center text-sm">
                    {hub.icon}
                  </div>
                  <div className="px-2 py-0.5 bg-slate-900 text-white rounded-full text-[9px] font-bold mt-1 shadow-sm whitespace-nowrap">
                    {hub.category} ({hub.distanceMeters}m)
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* 4. Red Route Polyline */}
            <GoogleMapsRoutePolyline path={routePoints} color="#EA3B52" weight={4.5} />
          </Map>
        </APIProvider>

        {/* Live GPS Status Pill */}
        <div className="absolute top-3 left-3 z-[10] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-700">{locationStatus}</span>
        </div>

        {/* Live "Locate Me" Button */}
        <button
          onClick={handleFetchCurrentLocation}
          disabled={isLocating}
          className="absolute top-3 right-3 z-[10] bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 rounded-full shadow-lg border border-slate-200 flex items-center gap-1.5 active:scale-95 transition-all"
          title="Fetch Real Device Location"
        >
          <Crosshair className={`w-3.5 h-3.5 text-[#EA3B52] ${isLocating ? 'animate-spin' : ''}`} />
          <span className="text-[11px] font-bold">{isLocating ? 'Locating...' : 'Locate Me'}</span>
        </button>

        {/* Surrounding Hub Details Card */}
        {selectedHub && (
          <div className="absolute top-14 left-3 right-3 z-[20] bg-white text-slate-900 p-3.5 rounded-2xl shadow-floating border border-slate-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedHub.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-slate-900">{selectedHub.name}</h4>
                <p className="text-[11px] text-slate-500">{selectedHub.address} • <strong>{selectedHub.distanceMeters}m ({selectedHub.etaMins}m ETA)</strong></p>
                <span className="text-[10px] text-emerald-600 font-semibold">{selectedHub.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => alert(`Calling ${selectedHub.name} (${selectedHub.phone})...`)}
                className="p-2 bg-[#EA3B52] text-white rounded-xl hover:bg-[#d92d44] transition-all"
                title="Call Emergency Hub"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                onClick={() => setSelectedHub(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Surrounding Areas Quick Bar */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar z-20 flex-shrink-0">
        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Surroundings:</span>
        {safetyHubs.map((hub) => (
          <button
            key={hub.id}
            onClick={() => setSelectedHub(hub)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 whitespace-nowrap hover:border-rose-300 active:scale-95 transition-all shadow-2xs"
          >
            <span>{hub.icon}</span>
            <span>{hub.category}</span>
            <span className="text-[#EA3B52] font-bold">({hub.distanceMeters}m)</span>
          </button>
        ))}
      </div>

      {/* Floating Bottom Responder Carousel Card */}
      <div className="w-full bg-white px-4 py-3 border-t border-slate-100 shadow-lg z-20 flex-shrink-0">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-0.5 snap-x">
          {/* Active 1st Responder Card */}
          <div className="min-w-[280px] w-full bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70 snap-center">
            <div className="flex items-center gap-3">
              <img
                src={activeResp.avatar}
                alt={activeResp.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-rose-200 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-[14px] font-bold text-slate-900 truncate">
                    {activeResp.name}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {activeResp.title} • ({activeResp.etaMinutes} min away)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => onCall && onCall(activeResp)}
                className="flex-1 py-2 px-3 bg-[#EA3B52] hover:bg-[#d92d44] text-white rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                Call
              </button>
              <button
                onClick={() => onMessage && onMessage(activeResp)}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
