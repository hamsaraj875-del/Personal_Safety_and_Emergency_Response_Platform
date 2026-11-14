import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, ChevronLeft, ShieldCheck, Navigation, Crosshair, AlertCircle } from 'lucide-react';
import LiveEmergencyMap from './LiveEmergencyMap';
import { MAP_CONFIG, getNearbyResponders, getSurroundingSafetyHubs, getLocalRoutePoints } from '../constants/initialData';
import { getCurrentDeviceLocation, requestLocationPermission, reverseGeocodeCoords } from '../services/locationService';

export default function MapTrackingView({
  onBack,
  onOpenInstruction,
  currentResponder,
  onCall,
  onMessage,
  userCoords,
  onUpdateUserCoords
}) {
  // Live User Location state
  const [userPos, setUserPos] = useState(() => {
    if (userCoords?.lat && userCoords?.lng) return userCoords;
    return { lat: MAP_CONFIG.userPos[0], lng: MAP_CONFIG.userPos[1] };
  });

  const localResponders = getNearbyResponders(userPos);
  const activeResp = currentResponder || localResponders[0];
  const [responderPos, setResponderPos] = useState(() => activeResp.location);

  // Surrounding emergency hubs around user
  const [safetyHubs, setSafetyHubs] = useState(() => getSurroundingSafetyHubs(userPos));
  const [selectedHub, setSelectedHub] = useState(null);
  const [routePoints, setRoutePoints] = useState(() => getLocalRoutePoints(userPos, responderPos));
  const [isLocating, setIsLocating] = useState(false);

  // Keep surrounding hubs and route synced with userCoords
  useEffect(() => {
    if (userCoords?.lat && userCoords?.lng) {
      setUserPos(userCoords);
      const updatedNearby = getNearbyResponders(userCoords);
      const resp = currentResponder || updatedNearby[0];
      setResponderPos(resp.location);
      setSafetyHubs(getSurroundingSafetyHubs(userCoords));
      setRoutePoints(getLocalRoutePoints(userCoords, resp.location));
    }
  }, [userCoords, currentResponder]);

  // Fetch real device location with user permission
  const handleFetchCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const perm = await requestLocationPermission();
      if (!perm.granted) {
        alert(perm.error || "Please allow location access to pinpoint your emergency coordinates.");
        setIsLocating(false);
        return;
      }

      const coords = await getCurrentDeviceLocation();
      const newPos = { lat: coords.lat, lng: coords.lng };
      setUserPos(newPos);
      if (onUpdateUserCoords) onUpdateUserCoords(newPos);

      const updatedNearby = getNearbyResponders(newPos);
      const resp = currentResponder || updatedNearby[0];
      setResponderPos(resp.location);
      setSafetyHubs(getSurroundingSafetyHubs(newPos));
      setRoutePoints(getLocalRoutePoints(newPos, resp.location));

      const addr = await reverseGeocodeCoords(coords.lat, coords.lng);
      alert(`Location Acquired!\nLatitude: ${coords.lat.toFixed(5)}\nLongitude: ${coords.lng.toFixed(5)}\nAddress: ${addr}`);
    } catch (err) {
      console.error("Failed to get device location:", err);
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
            ● Live Local Dispatch Active
          </span>
        </div>

        <h1 className="text-[18px] sm:text-[20px] font-extrabold text-slate-900 leading-tight">
          Ambulance and responders on the way
        </h1>

        <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
          Approaching from ~{activeResp.distanceKm || 0.9} km away. Tap surrounding hubs to inspect.
        </p>

        <button
          onClick={onOpenInstruction}
          className="text-[12px] font-bold text-[#EA3B52] hover:text-[#BE123C] mt-0.5 inline-block transition-colors underline-offset-2 hover:underline"
        >
          Open full emergency instruction →
        </button>
      </div>

      {/* Main Map Container (LiveEmergencyMap with Leaflet zero-watermark + Google Maps toggle) */}
      <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
        <LiveEmergencyMap
          userPos={userPos}
          responderPos={responderPos}
          safetyHubs={safetyHubs}
          routePoints={routePoints}
          activeResp={activeResp}
          onSelectHub={setSelectedHub}
          isLocating={isLocating}
          onLocateMe={handleFetchCurrentLocation}
        />

        {/* Selected Hub Card */}
        {selectedHub && (
          <div className="absolute top-14 left-3 right-3 z-[1000] bg-white text-slate-900 p-3.5 rounded-2xl shadow-floating border border-slate-200 flex items-center justify-between animate-fadeIn">
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
                  {activeResp.title} • ({activeResp.etaMinutes} min away · {activeResp.distanceKm} km)
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
