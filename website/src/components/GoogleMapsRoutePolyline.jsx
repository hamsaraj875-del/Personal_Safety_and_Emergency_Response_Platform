import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

/**
 * Declarative Google Maps Polyline component using official @vis.gl/react-google-maps useMap hook.
 */
export default function GoogleMapsRoutePolyline({ path, color = '#EA3B52', weight = 4.5 }) {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined' || !window.google?.maps?.Polyline) return;

    // Convert coordinates format if needed
    const formattedPath = path.map(pt => {
      if (Array.isArray(pt)) return { lat: pt[0], lng: pt[1] };
      return pt;
    });

    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline({
        path: formattedPath,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: weight,
        map
      });
    } else {
      polylineRef.current.setPath(formattedPath);
      polylineRef.current.setMap(map);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path, color, weight]);

  return null;
}
