import React, { useEffect, useRef } from 'react';
import { Phone, MessageSquare, ChevronLeft, ShieldCheck, Navigation } from 'lucide-react';
import { MAP_CONFIG, VERIFIED_RESPONDERS } from '../constants/initialData';

export default function MapTrackingView({ onBack, onOpenInstruction, currentResponder, onCall, onMessage }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const activeResp = currentResponder || VERIFIED_RESPONDERS[0];

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;

    // Destroy any existing map instance to prevent duplicates
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = window.L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(MAP_CONFIG.center, 15);

    mapInstanceRef.current = map;

    // Use OpenStreetMap clean tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom "You are here" marker icon
    const userIcon = window.L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 22px; height: 22px; background: rgba(234, 59, 82, 0.3); border-radius: 9999px; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; background: #EA3B52; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const userMarker = window.L.marker(MAP_CONFIG.userPos, { icon: userIcon }).addTo(map);
    userMarker.bindTooltip("You are here", {
      permanent: true,
      direction: 'top',
      offset: [-40, -10],
      className: 'custom-bubble-tooltip'
    }).openTooltip();

    // Custom "1st Responder" marker icon
    const respIcon = window.L.divIcon({
      className: 'custom-resp-marker',
      html: `
        <div style="width: 16px; height: 16px; background: #64748B; border: 2.5px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    const respMarker = window.L.marker(MAP_CONFIG.responderPos, { icon: respIcon }).addTo(map);
    respMarker.bindTooltip("1st Responder", {
      permanent: true,
      direction: 'bottom',
      offset: [35, 12],
      className: 'custom-bubble-tooltip'
    }).openTooltip();

    // Red route polyline connecting responder to user (matching the exact screenshot)
    const routeLine = window.L.polyline(MAP_CONFIG.routePoints, {
      color: '#EA3B52',
      weight: 3.5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Zoom and pan to fit both markers
    map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden select-none">
      {/* Top Header Card */}
      <div className="pt-10 px-5 pb-3 bg-white z-20 shadow-sm">
        <button
          onClick={onBack}
          className="w-8 h-8 -ml-1 flex items-center justify-center text-slate-800 hover:bg-slate-100 rounded-full transition-colors mb-2"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <h1 className="text-[20px] font-bold text-slate-900 leading-tight">
          Ambulance and<br />responders are on a way
        </h1>

        <p className="text-[13px] text-slate-500 mt-1 leading-snug">
          Speak calmly to the person until the first aider arrives. First responders are on the way and the...
        </p>

        <button
          onClick={onOpenInstruction}
          className="text-[13px] font-semibold text-[#EA3B52] hover:text-[#BE123C] mt-0.5 inline-block transition-colors underline-offset-2 hover:underline"
        >
          Open full instruction
        </button>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Live Tracking GPS Pill Overlay */}
        <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-700">Live GPS Stream</span>
        </div>
      </div>

      {/* Floating Bottom Responder Carousel Card */}
      <div className="absolute bottom-5 left-0 right-0 px-4 z-[1000]">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
          {/* Active 1st Responder Card */}
          <div className="min-w-[290px] w-full bg-white rounded-2xl p-3.5 shadow-floating border border-slate-100/80 snap-center">
            <div className="flex items-center gap-3">
              <img
                src={activeResp.avatar}
                alt={activeResp.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-rose-100 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-[15px] font-bold text-slate-900 truncate">
                    {activeResp.name}:
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
                <p className="text-[12px] text-slate-500 font-medium">
                  {activeResp.title} ( {activeResp.etaMinutes} min away )
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onCall && onCall(activeResp)}
                className="flex-1 py-2.5 px-4 bg-[#EA3B52] hover:bg-[#d92d44] text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-sm shadow-rose-300"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                Call
              </button>
              <button
                onClick={() => onMessage && onMessage(activeResp)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </button>
            </div>
          </div>

          {/* Secondary Responder Card (peeking on right) */}
          <div className="min-w-[270px] bg-white/95 rounded-2xl p-3.5 shadow-floating border border-slate-100/80 opacity-90 snap-center">
            <div className="flex items-center gap-3">
              <img
                src={VERIFIED_RESPONDERS[1].avatar}
                alt={VERIFIED_RESPONDERS[1].name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-slate-900 truncate">
                  {VERIFIED_RESPONDERS[1].name}
                </h3>
                <p className="text-[12px] text-slate-500">
                  {VERIFIED_RESPONDERS[1].title} ( 8 min away )
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => onCall && onCall(VERIFIED_RESPONDERS[1])}
                className="flex-1 py-2 px-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-[12px] flex items-center justify-center gap-1"
              >
                <Phone className="w-3 h-3" /> Call Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
