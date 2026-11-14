import React, { useEffect, useRef } from 'react';

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
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({
    geofence: null,
    hotspots: [],
    incidents: [],
    ambulances: [],
    blindSpot: null,
    displacementRoute: null
  });

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Initialize Leaflet map with CartoDB Positron light vector tiles
    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([centerCoords.lat, centerCoords.lng], 14);

    mapInstanceRef.current = map;

    // CartoDB Positron clean light raster tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Zoom control in bottom right
    window.L.control.zoom({ position: 'bottomright' }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map overlays when data or radius changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    // 1. Draw Geofence Radius Circle
    if (layersRef.current.geofence) {
      map.removeLayer(layersRef.current.geofence);
    }
    const geofenceCircle = window.L.circle([centerCoords.lat, centerCoords.lng], {
      radius: radiusKm * 1000,
      color: '#EA3B52',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#EA3B52',
      fillOpacity: 0.03
    }).addTo(map);
    layersRef.current.geofence = geofenceCircle;

    // Center Authority Station Marker
    const stationIcon = window.L.divIcon({
      className: 'custom-station-pin',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; background: rgba(234, 59, 82, 0.25); border-radius: 9999px; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; background: #0F172A; border: 3px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); margin: auto;"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    window.L.marker([centerCoords.lat, centerCoords.lng], { icon: stationIcon })
      .bindTooltip("Command HQ (Your Location)", { permanent: false, direction: 'top' })
      .addTo(map);

    // 2. Render Accident Hotspots (Crimson Thermal Circles)
    layersRef.current.hotspots.forEach(layer => map.removeLayer(layer));
    layersRef.current.hotspots = [];

    hotspots.forEach(spot => {
      const circle = window.L.circle([spot.location.lat, spot.location.lng], {
        radius: spot.radiusMeters || 350,
        color: '#DC2626',
        weight: 1.5,
        fillColor: '#EF4444',
        fillOpacity: 0.22
      }).addTo(map);

      circle.bindTooltip(`
        <div style="font-family: inherit; padding: 2px;">
          <strong style="color: #DC2626; font-size: 11px;">⚠️ ${spot.name}</strong><br/>
          <span style="font-size: 10px; color: #475569;">${spot.collisionCount} Accidents • Peak: ${spot.peakHours}</span>
        </div>
      `, { direction: 'top', className: 'custom-bubble-tooltip' });

      layersRef.current.hotspots.push(circle);
    });

    // 3. Render Active Incidents (Pulsing Red SOS Pins)
    layersRef.current.incidents.forEach(layer => map.removeLayer(layer));
    layersRef.current.incidents = [];

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

      layersRef.current.incidents.push(marker);
    });

    // 4. Render Ambulance Fleet (Coral/White Vehicle Markers)
    layersRef.current.ambulances.forEach(layer => map.removeLayer(layer));
    layersRef.current.ambulances = [];

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

      layersRef.current.ambulances.push(marker);
    });

    // 5. Coverage Blind Spot Radar
    if (layersRef.current.blindSpot) map.removeLayer(layersRef.current.blindSpot);
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

      layersRef.current.blindSpot = blindCircle;
    }

    // 6. Displacement Route Vector Line
    if (layersRef.current.displacementRoute) map.removeLayer(layersRef.current.displacementRoute);
    if (displacementPlan && displacementPlan.isExecuted) {
      // Connect candidate vehicle to target staging spot
      const routeLine = window.L.polyline([
        [ambulances[2].location.lat, ambulances[2].location.lng],
        [displacementPlan.targetStagingLocation.lat, displacementPlan.targetStagingLocation.lng]
      ], {
        color: '#059669',
        weight: 3.5,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(map);

      layersRef.current.displacementRoute = routeLine;
    }

  }, [centerCoords, radiusKm, hotspots, activeIncidents, ambulances, blindSpot, displacementPlan, selectedIncidentId]);

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-floating border border-slate-200/80 text-[11px] space-y-1.5 font-medium text-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
          <span>Active SOS Distress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EF4444]/40 border border-[#DC2626]" />
          <span>Accident Hotspot Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-[#E11D48] text-[9px] text-white flex items-center justify-center font-bold">🚑</span>
          <span>Ambulance Unit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-[#D97706]" />
          <span>Blind Spot (ETA &gt; 8m)</span>
        </div>
      </div>
    </div>
  );
}
