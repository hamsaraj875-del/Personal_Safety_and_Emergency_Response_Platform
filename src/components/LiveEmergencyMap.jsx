import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import GoogleMapsRoutePolyline from './GoogleMapsRoutePolyline';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ID, GOOGLE_MAPS_ATTRIBUTION } from '../constants/mapsConfig';
import { ShieldCheck, Crosshair, AlertTriangle, Layers } from 'lucide-react';

function GoogleCameraPan({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
}

export default function LiveEmergencyMap({
  userPos,
  responderPos,
  safetyHubs = [],
  routePoints = [],
  activeResp,
  onSelectHub,
  isLocating = false,
  onLocateMe
}) {
  // Default to Google Maps when API key is provided
  const [engine, setEngine] = useState(GOOGLE_MAPS_API_KEY ? 'google' : 'emergency');
  const [googleAuthError, setGoogleAuthError] = useState(false);

  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef([]);

  // Detect Google Maps Auth Failure (e.g. unbilled GCP key)
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn("Google Maps Auth Failure detected (unbilled or restricted key). Gracefully switching to Emergency Map.");
      setGoogleAuthError(true);
      setEngine('emergency');
    };
    return () => {
      window.gm_authFailure = null;
    };
  }, []);

  // Initialize & update Leaflet Emergency Map
  useEffect(() => {
    if (engine !== 'emergency' || !leafletContainerRef.current || !window.L) return;

    if (!leafletMapRef.current) {
      const map = window.L.map(leafletContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([userPos.lat, userPos.lng], 15);

      leafletMapRef.current = map;

      // Clean, high-performance, zero-watermark vector tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);
    }

    const map = leafletMapRef.current;

    // Clear previous markers & polylines
    leafletMarkersRef.current.forEach(layer => layer.remove());
    leafletMarkersRef.current = [];

    // 1. User Marker (Pulsing Red)
    const userIcon = window.L.divIcon({
      className: 'emergency-user-pin',
      html: `
        <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 26px; height: 26px; background: rgba(234, 59, 82, 0.35); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; background: #EA3B52; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.35); z-index: 2;"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const userMarker = window.L.marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(map);
    userMarker.bindTooltip("You are here", {
      permanent: true,
      direction: 'top',
      offset: [0, -10],
      className: 'custom-bubble-tooltip'
    });
    leafletMarkersRef.current.push(userMarker);

    // 2. Ambulance / 1st Responder Marker
    const ambulanceIcon = window.L.divIcon({
      className: 'emergency-ambulance-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #E11D48; color: #FFFFFF; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(225,29,72,0.4); border: 1.5px solid #FFFFFF; white-space: nowrap; margin-bottom: 2px;">
            🚑 Ambulance (${activeResp?.etaMinutes || 4}m)
          </div>
          <div style="width: 16px; height: 16px; background: #FFFFFF; border: 3px solid #E11D48; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);"></div>
        </div>
      `,
      iconSize: [120, 36],
      iconAnchor: [60, 34]
    });

    const responderMarker = window.L.marker([responderPos.lat, responderPos.lng], { icon: ambulanceIcon }).addTo(map);
    leafletMarkersRef.current.push(responderMarker);

    // 3. Surrounding Safety Hubs Markers
    safetyHubs.forEach(hub => {
      const hubIcon = window.L.divIcon({
        className: 'emergency-hub-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 28px; height: 28px; background: #FFFFFF; border: 2px solid #0F172A; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 3px 8px rgba(0,0,0,0.18);">
              ${hub.icon}
            </div>
            <div style="background: rgba(15,23,42,0.9); color: #FFFFFF; font-weight: 700; font-size: 8px; padding: 1px 5px; border-radius: 6px; margin-top: 2px; white-space: nowrap;">
              ${hub.distanceMeters}m
            </div>
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 21]
      });

      const hubMarker = window.L.marker([hub.location.lat, hub.location.lng], { icon: hubIcon }).addTo(map);
      hubMarker.on('click', () => onSelectHub && onSelectHub(hub));
      leafletMarkersRef.current.push(hubMarker);
    });

    // 4. Red Route Polyline connecting ambulance to user
    const polylineCoords = routePoints.map(p => [p.lat, p.lng]);
    const routeLine = window.L.polyline(polylineCoords, {
      color: '#EA3B52',
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '8, 6'
    }).addTo(map);
    leafletMarkersRef.current.push(routeLine);

    // Frame both user and responder
    const bounds = window.L.latLngBounds([
      [userPos.lat, userPos.lng],
      [responderPos.lat, responderPos.lng]
    ]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });

    // Invalidate size in case container resized
    setTimeout(() => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    }, 150);

  }, [engine, userPos, responderPos, safetyHubs, routePoints, activeResp]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden select-none">
      {/* Engine 1: Zero-Watermark Emergency Vector Map */}
      {engine === 'emergency' && (
        <div ref={leafletContainerRef} className="w-full h-full z-1" />
      )}

      {/* Engine 2: Google Maps Platform SDK */}
      {engine === 'google' && (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry']}>
          <Map
            mapId={GOOGLE_MAPS_ID}
            internalUsageAttributionIds={GOOGLE_MAPS_ATTRIBUTION}
            defaultCenter={userPos}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={true}
            style={{ width: '100%', height: '100%' }}
          >
            <GoogleCameraPan center={userPos} />

            {/* User Marker */}
            <AdvancedMarker position={userPos} title="You are here">
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

            {/* Ambulance Marker */}
            <AdvancedMarker position={responderPos} title={`${activeResp?.name || 'Ambulance'} (Approaching)`}>
              <div className="relative flex flex-col items-center cursor-pointer animate-bounce">
                <div className="px-2 py-0.5 bg-[#EA3B52] text-white rounded-full shadow-lg text-[10px] font-bold mb-0.5 whitespace-nowrap flex items-center gap-1 border border-white">
                  <span>🚑 Ambulance ({activeResp?.etaMinutes || 4}m)</span>
                </div>
                <div className="w-4 h-4 bg-white border-2 border-[#EA3B52] rounded-full shadow-md" />
              </div>
            </AdvancedMarker>

            {/* Surrounding Safety Hubs */}
            {safetyHubs.map(hub => (
              <AdvancedMarker
                key={hub.id}
                position={hub.location}
                title={hub.name}
                onClick={() => onSelectHub && onSelectHub(hub)}
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

            <GoogleMapsRoutePolyline path={routePoints} color="#EA3B52" weight={4.5} />
          </Map>
        </APIProvider>
      )}

      {/* Top Left: Provider Toggle Pill */}
      <div className="absolute top-2.5 left-2.5 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-full shadow-md border border-slate-200 text-[10px] font-bold">
        <button
          onClick={() => setEngine('emergency')}
          className={`px-2 py-0.5 rounded-full transition-all ${
            engine === 'emergency'
              ? 'bg-[#EA3B52] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Zero-Watermark High Performance Emergency Map"
        >
          🗺️ Live Map (Active)
        </button>

        <button
          onClick={() => setEngine('google')}
          className={`px-2 py-0.5 rounded-full transition-all ${
            engine === 'google'
              ? 'bg-[#EA3B52] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Google Maps Platform Engine"
        >
          🌐 Google Maps
        </button>
      </div>

      {/* Top Right: GPS Locate Me Button */}
      <button
        onClick={onLocateMe}
        disabled={isLocating}
        className="absolute top-2.5 right-2.5 z-[1000] bg-white hover:bg-slate-50 text-slate-800 px-2.5 py-1 rounded-full shadow-md border border-slate-200 flex items-center gap-1 text-[11px] font-bold active:scale-95 transition-all"
        title="Refresh Device GPS Location"
      >
        <Crosshair className={`w-3.5 h-3.5 text-[#EA3B52] ${isLocating ? 'animate-spin' : ''}`} />
        <span>{isLocating ? 'Locating...' : 'Locate Me'}</span>
      </button>

      {/* Google Auth Notice Banner (if unbilled key triggers watermark) */}
      {googleAuthError && engine === 'google' && (
        <div className="absolute top-12 left-2.5 right-2.5 z-[1000] bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-amber-900 text-xs shadow-lg flex items-start gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Google Cloud Notice:</span>
            <p className="text-[10px] text-amber-800 mt-0.5">
              Google Maps requires billing enabled on your GCP project. We have automatically switched you to the 100% active Emergency Vector Map so tracking is never blocked!
            </p>
            <button
              onClick={() => setEngine('emergency')}
              className="mt-1 px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold"
            >
              Use 100% Active Live Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
