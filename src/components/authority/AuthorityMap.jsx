import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_ID, GOOGLE_MAPS_ATTRIBUTION } from '../../constants/mapsConfig';
import { Layers, ShieldAlert, Crosshair } from 'lucide-react';

/**
 * Helper to smoothly pan Google Map when authority coordinates or radius change
 */
function GoogleMapPanController({ center, radiusKm }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    if (radiusKm) {
      // Set appropriate zoom for radius
      const zoomLevel = radiusKm <= 2 ? 15 : radiusKm <= 5 ? 14 : 12;
      map.setZoom(zoomLevel);
    }
  }, [map, center, radiusKm]);
  return null;
}

/**
 * Helper to manage Google Maps Vector Overlays (Geofence, Hotspot circles, Blind spot, Displacement polyline)
 */
function GoogleMapOverlays({ centerCoords, radiusKm, hotspots, blindSpot, displacementPlan, ambulances }) {
  const map = useMap();
  const circlesRef = useRef([]);
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Clean up previous circles
    circlesRef.current.forEach(c => c.setMap(null));
    circlesRef.current = [];

    // 1. Geofence Radius Circle (Crimson Dashed)
    const geofenceCircle = new window.google.maps.Circle({
      strokeColor: '#EA3B52',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#EA3B52',
      fillOpacity: 0.04,
      map,
      center: centerCoords,
      radius: radiusKm * 1000,
      clickable: false
    });
    circlesRef.current.push(geofenceCircle);

    // 2. Accident Hotspots (Thermal Crimson Circles)
    hotspots.forEach(spot => {
      const circle = new window.google.maps.Circle({
        strokeColor: '#DC2626',
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        fillColor: '#EF4444',
        fillOpacity: 0.22,
        map,
        center: spot.location,
        radius: spot.radiusMeters || 380,
        clickable: false
      });
      circlesRef.current.push(circle);
    });

    // 3. Blind Spot Circle (Amber Radar)
    if (blindSpot) {
      const blindCircle = new window.google.maps.Circle({
        strokeColor: '#D97706',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#F59E0B',
        fillOpacity: 0.16,
        map,
        center: blindSpot.location,
        radius: 650,
        clickable: false
      });
      circlesRef.current.push(blindCircle);
    }

    // 4. Displacement Route Polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (displacementPlan?.isExecuted && ambulances.length >= 3) {
      polylineRef.current = new window.google.maps.Polyline({
        path: [
          ambulances[2].location,
          displacementPlan.targetStagingLocation
        ],
        geodesic: true,
        strokeColor: '#059669',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map
      });
    }

    return () => {
      circlesRef.current.forEach(c => c.setMap(null));
      circlesRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, centerCoords, radiusKm, hotspots, blindSpot, displacementPlan, ambulances]);

  return null;
}

export default function AuthorityMap({
  centerCoords,
  radiusKm = 5,
  hotspots = [],
  activeIncidents = [],
  ambulances = [],
  blindSpot,
  displacementPlan,
  onSelectIncident,
  selectedIncidentId
}) {
  // Default to Google Maps when API key is provided
  const [engine, setEngine] = useState(GOOGLE_MAPS_API_KEY ? 'google' : 'leaflet');
  const [googleAuthError, setGoogleAuthError] = useState(false);

  // Leaflet references for zero-breakage fallback
  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletLayersRef = useRef({
    geofence: null,
    hotspots: [],
    incidents: [],
    ambulances: [],
    blindSpot: null,
    displacementRoute: null
  });

  // Handle Google Maps Auth Failure (e.g. quota/billing block)
  useEffect(() => {
    window.gm_authFailure = () => {
      console.warn("Google Maps Auth Notice: Switching to high-performance vector map.");
      setGoogleAuthError(true);
      setEngine('leaflet');
    };
    return () => {
      window.gm_authFailure = null;
    };
  }, []);

  // Initialize & update Leaflet fallback when active
  useEffect(() => {
    if (engine !== 'leaflet' || !leafletContainerRef.current || !window.L) return;

    if (!leafletMapRef.current) {
      const map = window.L.map(leafletContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([centerCoords.lat, centerCoords.lng], 14);

      leafletMapRef.current = map;

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);
    } else {
      leafletMapRef.current.setView([centerCoords.lat, centerCoords.lng]);
    }

    const map = leafletMapRef.current;

    // Draw Geofence Radius Circle
    if (leafletLayersRef.current.geofence) {
      map.removeLayer(leafletLayersRef.current.geofence);
    }
    const geofenceCircle = window.L.circle([centerCoords.lat, centerCoords.lng], {
      radius: radiusKm * 1000,
      color: '#EA3B52',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#EA3B52',
      fillOpacity: 0.03
    }).addTo(map);
    leafletLayersRef.current.geofence = geofenceCircle;

    // Center Authority HQ Marker
    const stationIcon = window.L.divIcon({
      className: 'custom-station-pin',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; background: rgba(234, 59, 82, 0.3); border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 24px; height: 24px; border-radius: 9999px; overflow: hidden; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.3); margin: auto;">
            <img src="/logo.png" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    window.L.marker([centerCoords.lat, centerCoords.lng], { icon: stationIcon })
      .bindTooltip("Command HQ (Surrounding Center)", { permanent: false, direction: 'top' })
      .addTo(map);

    // Render Accident Hotspots
    leafletLayersRef.current.hotspots.forEach(layer => map.removeLayer(layer));
    leafletLayersRef.current.hotspots = [];

    hotspots.forEach(spot => {
      const circle = window.L.circle([spot.location.lat, spot.location.lng], {
        radius: spot.radiusMeters || 350,
        color: '#DC2626',
        weight: 1.5,
        fillColor: '#EF4444',
        fillOpacity: 0.22
      }).addTo(map);

      circle.bindTooltip(`
        <div style="padding: 2px;">
          <strong style="color: #DC2626; font-size: 11px;">⚠️ ${spot.name}</strong><br/>
          <span style="font-size: 10px; color: #475569;">${spot.collisionCount} Accidents • Peak: ${spot.peakHours}</span>
        </div>
      `, { direction: 'top', className: 'custom-bubble-tooltip' });

      leafletLayersRef.current.hotspots.push(circle);
    });

    // Render Active Incidents
    leafletLayersRef.current.incidents.forEach(layer => map.removeLayer(layer));
    leafletLayersRef.current.incidents = [];

    activeIncidents.forEach(inc => {
      const isSelected = selectedIncidentId === inc.id;
      const incIcon = window.L.divIcon({
        className: 'custom-inc-marker',
        html: `
          <div style="position: relative; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; background: rgba(220, 38, 38, 0.4); border-radius: 9999px; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; background: #DC2626; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 10px rgba(220, 38, 38, 0.5);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = window.L.marker([inc.location.lat, inc.location.lng], { icon: incIcon }).addTo(map);
      marker.bindTooltip(`<strong>${inc.id}: ${inc.userName}</strong><br/>${inc.categoryLabel}`, {
        permanent: isSelected,
        direction: 'top',
        className: 'custom-bubble-tooltip'
      });

      marker.on('click', () => {
        onSelectIncident && onSelectIncident(inc);
      });

      leafletLayersRef.current.incidents.push(marker);
    });

    // Render Ambulances
    leafletLayersRef.current.ambulances.forEach(layer => map.removeLayer(layer));
    leafletLayersRef.current.ambulances = [];

    ambulances.forEach(amb => {
      const isCandidate = amb.isDisplaceCandidate;
      const ambIcon = window.L.divIcon({
        className: 'custom-amb-marker',
        html: `
          <div style="width: 24px; height: 24px; background: ${isCandidate ? '#D97706' : '#E11D48'}; border: 2px solid #FFFFFF; border-radius: 8px; box-shadow: 0 3px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
            🚑
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = window.L.marker([amb.location.lat, amb.location.lng], { icon: ambIcon }).addTo(map);
      marker.bindTooltip(`<strong>${amb.vehicleNo}</strong> (${amb.status})<br/>${amb.type}`, {
        direction: 'bottom',
        className: 'custom-bubble-tooltip'
      });

      leafletLayersRef.current.ambulances.push(marker);
    });

    // Blind Spot
    if (leafletLayersRef.current.blindSpot) map.removeLayer(leafletLayersRef.current.blindSpot);
    if (blindSpot) {
      const blindCircle = window.L.circle([blindSpot.location.lat, blindSpot.location.lng], {
        radius: 650,
        color: '#D97706',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#F59E0B',
        fillOpacity: 0.15
      }).addTo(map);

      blindCircle.bindTooltip(`
        <strong>Coverage Blind Spot (ETA > 8m)</strong><br/>
        Projected Arrival: <span style="color: #D97706; font-weight: bold;">${blindSpot.currentEtaMinutes} mins</span>
      `, { direction: 'top', className: 'custom-bubble-tooltip' });

      leafletLayersRef.current.blindSpot = blindCircle;
    }

    // Displacement Route Line
    if (leafletLayersRef.current.displacementRoute) map.removeLayer(leafletLayersRef.current.displacementRoute);
    if (displacementPlan && displacementPlan.isExecuted && ambulances.length >= 3) {
      const routeLine = window.L.polyline([
        [ambulances[2].location.lat, ambulances[2].location.lng],
        [displacementPlan.targetStagingLocation.lat, displacementPlan.targetStagingLocation.lng]
      ], {
        color: '#059669',
        weight: 3.5,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(map);

      leafletLayersRef.current.displacementRoute = routeLine;
    }

    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 150);
  }, [engine, centerCoords, radiusKm, hotspots, activeIncidents, ambulances, blindSpot, displacementPlan, selectedIncidentId]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden select-none">
      {/* 1. ACTUAL GOOGLE MAPS PLATFORM VIEW */}
      {engine === 'google' && (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry']}>
          <Map
            mapId={GOOGLE_MAPS_ID}
            internalUsageAttributionIds={GOOGLE_MAPS_ATTRIBUTION}
            defaultCenter={centerCoords}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapTypeControl={true}
            streetViewControl={false}
            fullscreenControl={false}
            zoomControl={true}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Camera pan & zoom controller */}
            <GoogleMapPanController center={centerCoords} radiusKm={radiusKm} />

            {/* Geofence & Vector Overlays */}
            <GoogleMapOverlays
              centerCoords={centerCoords}
              radiusKm={radiusKm}
              hotspots={hotspots}
              blindSpot={blindSpot}
              displacementPlan={displacementPlan}
              ambulances={ambulances}
            />

            {/* 1. Authority Station HQ Marker (Center) */}
            <AdvancedMarker position={centerCoords} title="Command HQ (Surrounding Center)">
              <div className="relative flex flex-col items-center cursor-pointer">
                <div className="px-2.5 py-1 bg-slate-900 text-white rounded-full shadow-lg text-[10px] font-black border border-white mb-1 tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-[#EA3B52] animate-pulse" />
                  <span>Command HQ (Surrounding Center)</span>
                </div>
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <div className="absolute w-9 h-9 bg-rose-500/35 rounded-full animate-ping" />
                  <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-md z-10">
                    <img src="/logo.png" alt="Command HQ" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </AdvancedMarker>

            {/* 2. Accident Hotspot Markers */}
            {hotspots.map(spot => (
              <AdvancedMarker
                key={spot.id}
                position={spot.location}
                title={`${spot.name} (${spot.collisionCount} collisions)`}
              >
                <div className="relative flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                  <div className="px-2 py-0.5 bg-rose-600 text-white rounded-full shadow-md text-[9px] font-black mb-0.5 whitespace-nowrap border border-white">
                    ⚠️ {spot.collisionCount} Crashes
                  </div>
                  <div className="w-5 h-5 bg-white border-2 border-rose-600 rounded-full shadow-sm flex items-center justify-center text-[10px]">
                    💥
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* 3. Active Distress Incidents (Clickable to open inspect drawer) */}
            {activeIncidents.map(inc => {
              const isSelected = selectedIncidentId === inc.id;
              return (
                <AdvancedMarker
                  key={inc.id}
                  position={inc.location}
                  title={`${inc.id}: ${inc.userName}`}
                  onClick={() => onSelectIncident && onSelectIncident(inc)}
                >
                  <div className={`relative flex flex-col items-center cursor-pointer hover:scale-110 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                    <div className="px-2 py-0.5 bg-[#EA3B52] text-white rounded-full shadow-lg text-[10px] font-bold mb-0.5 whitespace-nowrap flex items-center gap-1 border border-white animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>{inc.userName}</span>
                    </div>
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      <div className="absolute w-6 h-6 bg-rose-500/40 rounded-full animate-ping" />
                      <div className="w-3.5 h-3.5 bg-[#EA3B52] border-2 border-white rounded-full shadow-md z-10" />
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* 4. Ambulances Fleet Units */}
            {ambulances.map(amb => {
              const isCandidate = amb.isDisplaceCandidate;
              return (
                <AdvancedMarker
                  key={amb.vehicleNo}
                  position={amb.location}
                  title={`${amb.vehicleNo} (${amb.status})`}
                >
                  <div className="relative flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                    <div className={`px-2 py-0.5 ${isCandidate ? 'bg-amber-600' : 'bg-rose-700'} text-white rounded-full shadow-md text-[9px] font-bold mb-0.5 whitespace-nowrap border border-white flex items-center gap-1`}>
                      <span>🚑 {amb.vehicleNo}</span>
                    </div>
                    <div className={`w-6 h-6 ${isCandidate ? 'bg-amber-500' : 'bg-[#E11D48]'} border-2 border-white rounded-xl shadow-md flex items-center justify-center text-white text-xs`}>
                      🚑
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* 5. Blind Spot Warning Pin */}
            {blindSpot && (
              <AdvancedMarker
                position={blindSpot.location}
                title={`Blind Spot: ${blindSpot.currentEtaMinutes}m ETA`}
              >
                <div className="relative flex flex-col items-center cursor-pointer">
                  <div className="px-2 py-0.5 bg-amber-500 text-slate-900 rounded-full shadow-md text-[9px] font-black mb-0.5 whitespace-nowrap border border-white">
                    ETA {blindSpot.currentEtaMinutes}m (Gap)
                  </div>
                  <div className="w-5 h-5 bg-amber-100 border-2 border-amber-600 rounded-full shadow-sm flex items-center justify-center text-[10px]">
                    ⚠️
                  </div>
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>
      )}

      {/* 2. LEAFLET ZERO-WATERMARK FALLBACK VIEW */}
      {engine === 'leaflet' && (
        <div ref={leafletContainerRef} className="w-full h-full" />
      )}

      {/* TOP LEFT: MAP ENGINE TOGGLE PILL */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-full shadow-floating border border-slate-200 text-[11px] font-bold">
        <button
          onClick={() => setEngine('google')}
          className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
            engine === 'google'
              ? 'bg-[#EA3B52] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Google Maps Platform (Surrounding Location Satellite & Vector View)"
        >
          <span>🗺️ Google Maps</span>
          {engine === 'google' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
        </button>

        <button
          onClick={() => setEngine('leaflet')}
          className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
            engine === 'leaflet'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Light CartoDB Positron Vector Tiles"
        >
          <span>Vector Positron</span>
          {engine === 'leaflet' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
        </button>
      </div>

      {/* MAP LEGEND OVERLAY (BOTTOM LEFT) */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-floating border border-slate-200/90 text-[11px] space-y-2 font-medium text-slate-700">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
          <span>Surrounding Radar</span>
          <span className="text-[#EA3B52] font-mono">{radiusKm} km</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-[#EA3B52] animate-pulse" />
          <span>Active SOS Distress</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]/40 border border-[#DC2626]" />
          <span>Accident Hotspot Zone</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3.5 h-3.5 rounded-md bg-[#E11D48] text-[9px] text-white flex items-center justify-center font-bold">🚑</span>
          <span>Ambulance Unit</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-[#D97706]" />
          <span>Blind Spot (ETA &gt; 8m)</span>
        </div>
      </div>
    </div>
  );
}
