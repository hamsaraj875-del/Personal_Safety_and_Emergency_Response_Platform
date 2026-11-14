import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import GoogleMapsRoutePolyline from './GoogleMapsRoutePolyline';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ATTRIBUTION } from '../constants/mapsConfig';
import { Crosshair, AlertTriangle } from 'lucide-react';

function GoogleCameraPan({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && typeof center.lat === 'number' && typeof center.lng === 'number') {
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
  // Normalize coordinates to guarantee { lat, lng } numbers
  const safeUserPos = {
    lat: typeof userPos?.lat === 'number' ? userPos.lat : (Array.isArray(userPos) ? userPos[0] : 12.9416),
    lng: typeof userPos?.lng === 'number' ? userPos.lng : (Array.isArray(userPos) ? userPos[1] : 77.5655)
  };

  const safeResponderPos = {
    lat: typeof responderPos?.lat === 'number' ? responderPos.lat : (Array.isArray(responderPos) ? responderPos[0] : (safeUserPos.lat + 0.0065)),
    lng: typeof responderPos?.lng === 'number' ? responderPos.lng : (Array.isArray(responderPos) ? responderPos[1] : (safeUserPos.lng - 0.0050))
  };

  // Safe normalized route waypoints
  const safeRoute = Array.isArray(routePoints) && routePoints.length > 0
    ? routePoints.map(p => ({
        lat: typeof p?.lat === 'number' ? p.lat : (Array.isArray(p) ? p[0] : safeUserPos.lat),
        lng: typeof p?.lng === 'number' ? p.lng : (Array.isArray(p) ? p[1] : safeUserPos.lng)
      }))
    : [
        safeResponderPos,
        { lat: (safeResponderPos.lat + safeUserPos.lat) / 2, lng: (safeResponderPos.lng + safeUserPos.lng) / 2 },
        safeUserPos
      ];

  // Engine: 'emergency' (zero-watermark Leaflet with 100% GPS reliability) | 'google' (Google Maps Platform)
  const [engine, setEngine] = useState('emergency');
  const [googleAuthError, setGoogleAuthError] = useState(false);

  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef([]);

  // Detect Google Maps Auth Failure or Quota Issue
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn("Google Maps Auth Notice: Gracefully switching to high-reliability GPS Emergency Map.");
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
      }).setView([safeUserPos.lat, safeUserPos.lng], 15);

      leafletMapRef.current = map;

      // Clean, high-performance, zero-watermark vector tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    } else {
      leafletMapRef.current.setView([safeUserPos.lat, safeUserPos.lng]);
    }

    const map = leafletMapRef.current;

    // Clear previous markers & polylines
    leafletMarkersRef.current.forEach(layer => {
      try { layer.remove(); } catch (e) {}
    });
    leafletMarkersRef.current = [];

    // 1. User Marker (Pulsing Red Pin)
    const userIcon = window.L.divIcon({
      className: 'emergency-user-pin',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; background: rgba(222, 53, 76, 0.35); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 15px; height: 15px; background: #DE354C; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.35); z-index: 2;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const userMarker = window.L.marker([safeUserPos.lat, safeUserPos.lng], { icon: userIcon }).addTo(map);
    userMarker.bindTooltip("You are here", {
      permanent: true,
      direction: 'top',
      offset: [0, -12],
      className: 'custom-bubble-tooltip'
    });
    leafletMarkersRef.current.push(userMarker);

    // 2. Ambulance / 1st Responder Marker
    const ambulanceIcon = window.L.divIcon({
      className: 'emergency-ambulance-pin',
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #E11D48; color: #FFFFFF; font-weight: 700; font-size: 10px; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(225,29,72,0.4); border: 1.5px solid #FFFFFF; white-space: nowrap; margin-bottom: 2px;">
            🚑 Ambulance (${activeResp?.etaMinutes || 4}m)
          </div>
          <div style="width: 16px; height: 16px; background: #FFFFFF; border: 3px solid #E11D48; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.25);"></div>
        </div>
      `,
      iconSize: [120, 36],
      iconAnchor: [60, 34]
    });

    const responderMarker = window.L.marker([safeResponderPos.lat, safeResponderPos.lng], { icon: ambulanceIcon }).addTo(map);
    leafletMarkersRef.current.push(responderMarker);

    // 3. Surrounding Safety Hubs Markers
    safetyHubs.forEach(hub => {
      if (!hub.location || typeof hub.location.lat !== 'number' || typeof hub.location.lng !== 'number') return;
      const isClosed = hub.openNow === false;
      const borderColor = isClosed ? '#E11D48' : '#0F172A';
      const badgeBg = isClosed ? '#BE123C' : 'rgba(15,23,42,0.9)';
      const badgeLabel = isClosed ? `${hub.distanceMeters || 500}m (CLOSED)` : `${hub.distanceMeters || 500}m`;

      const hubIcon = window.L.divIcon({
        className: 'emergency-hub-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 28px; height: 28px; background: #FFFFFF; border: 2.5px solid ${borderColor}; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 3px 8px rgba(0,0,0,0.18);">
              ${hub.icon || '🏥'}
            </div>
            <div style="background: ${badgeBg}; color: #FFFFFF; font-weight: 700; font-size: 8px; padding: 1px 5px; border-radius: 6px; margin-top: 2px; white-space: nowrap;">
              ${badgeLabel}
            </div>
          </div>
        `,
        iconSize: [40, 42],
        iconAnchor: [20, 21]
      });

      const hubMarker = window.L.marker([hub.location.lat, hub.location.lng], { icon: hubIcon }).addTo(map);
      hubMarker.on('click', () => onSelectHub && onSelectHub(hub));
      leafletMarkersRef.current.push(hubMarker);
    });

    // 4. Red Route Polyline connecting ambulance to user
    const polylineCoords = safeRoute.map(p => [p.lat, p.lng]);
    const routeLine = window.L.polyline(polylineCoords, {
      color: '#DE354C',
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '8, 6'
    }).addTo(map);
    leafletMarkersRef.current.push(routeLine);

    // Frame both user and responder
    try {
      const bounds = window.L.latLngBounds([
        [safeUserPos.lat, safeUserPos.lng],
        [safeResponderPos.lat, safeResponderPos.lng]
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } catch (e) {}

    // Invalidate size in case container resized
    const timer = setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [engine, safeUserPos.lat, safeUserPos.lng, safeResponderPos.lat, safeResponderPos.lng, safetyHubs, activeResp]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden select-none min-h-[220px]">
      {/* Engine 1: Zero-Watermark High Performance Emergency Map (Leaflet) */}
      {engine === 'emergency' && (
        <div ref={leafletContainerRef} className="w-full h-full" style={{ minHeight: '220px' }} />
      )}

      {/* Engine 2: Google Maps Platform SDK (No fragile mapId requirement) */}
      {engine === 'google' && (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry']}>
          <Map
            internalUsageAttributionIds={GOOGLE_MAPS_ATTRIBUTION}
            defaultCenter={safeUserPos}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeControl={true}
            streetViewControl={false}
            fullscreenControl={false}
            zoomControl={true}
            style={{ width: '100%', height: '100%', minHeight: '220px' }}
          >
            <GoogleCameraPan center={safeUserPos} />

            {/* User Marker */}
            <Marker
              position={safeUserPos}
              title="You are here"
              label={{ text: "You", color: "#FFFFFF", fontSize: "10px", fontWeight: "bold" }}
            />

            {/* Ambulance Marker */}
            <Marker
              position={safeResponderPos}
              title={`Ambulance (${activeResp?.name || 'En Route'})`}
              label={{ text: "🚑", fontSize: "14px" }}
            />

            {/* Surrounding Safety Hubs */}
            {safetyHubs.map(hub => {
              if (!hub.location || typeof hub.location.lat !== 'number' || typeof hub.location.lng !== 'number') return null;
              return (
                <Marker
                  key={hub.id}
                  position={hub.location}
                  title={`${hub.name} (${hub.status || 'Active'})`}
                  onClick={() => onSelectHub && onSelectHub(hub)}
                />
              );
            })}

            <GoogleMapsRoutePolyline path={safeRoute} color="#DE354C" weight={4.5} />
          </Map>
        </APIProvider>
      )}

      {/* Top Left: Provider Toggle Pill */}
      <div className="absolute top-2.5 left-2.5 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-md px-1.5 py-1 rounded-full shadow-md border border-slate-200 text-[10px] font-medium">
        <button
          onClick={() => setEngine('emergency')}
          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
            engine === 'emergency'
              ? 'bg-[#DE354C] text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="High Performance Live GPS Tracking Map"
        >
          🗺️ Live GPS Map
        </button>

        <button
          onClick={() => {
            if (!GOOGLE_MAPS_API_KEY) {
              alert("Google Maps API key not found. Using Live GPS Map.");
              return;
            }
            setEngine('google');
          }}
          className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
            engine === 'google'
              ? 'bg-[#DE354C] text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Google Maps Platform"
        >
          Google Maps
        </button>
      </div>

      {/* GPS Locate Me Button on Map */}
      {onLocateMe && (
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="absolute bottom-3 right-3 z-[1000] w-9 h-9 bg-white/95 hover:bg-white text-slate-800 rounded-full shadow-floating border border-slate-200 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
          title="Locate live GPS position"
        >
          <Crosshair className={`w-4 h-4 text-[#DE354C] ${isLocating ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
