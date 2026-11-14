import React from 'react';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import AmbulanceIllustration from './AmbulanceIllustration';

export default function AmbulanceOnTheWayScreen({
  onBack,
  onSeeMap,
  onCancelRequest,
  escalationStep = 3,
  elapsedSeconds = 42
}) {
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#F43F5E] via-[#E11D48] to-[#BE123C] text-white p-6 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="pt-6 flex items-center justify-between z-20">
        <button
          onClick={onBack}
          className="w-10 h-10 -ml-2 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* Live Elapsed Incident Timer Badge */}
        <div className="bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-mono font-bold tracking-wider text-white">
            ACTIVE {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Center Illustration Container */}
      <div className="my-auto py-2 z-10 flex flex-col items-center">
        <AmbulanceIllustration />

        {/* Content Section matching screenshot */}
        <div className="mt-8 text-left w-full max-w-[320px]">
          <h1 className="text-[28px] font-extrabold tracking-tight leading-[1.15] text-white drop-shadow-sm">
            Ambulance and responders<br />are on a way
          </h1>

          <p className="text-[14px] font-normal text-white/90 mt-4 leading-relaxed tracking-wide">
            Speak calmly to the person until the first aider arrives. First responders are on the way and the Rescue service is alarmed.
          </p>

          {/* Escalation Ladder Status Indicator */}
          <div className="mt-5 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
            <div className="flex items-center justify-between text-xs font-semibold text-white/90">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                Escalation Ladder
              </span>
              <span className="text-amber-300">Step {escalationStep} of 5</span>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${(escalationStep / 5) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-white/80 mt-1.5">
              Contact 1 & 2 notified • 1st Responder (Emily Dayton) dispatched
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons matching screenshot */}
      <div className="pb-4 w-full max-w-[320px] mx-auto z-20 flex flex-col items-center gap-3.5">
        <button
          onClick={onSeeMap}
          className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-[#EA3B52] rounded-full font-bold text-[16px] shadow-lg shadow-black/20 transition-all active:scale-[0.98] text-center"
        >
          See responders on map
        </button>

        <button
          onClick={onCancelRequest}
          className="text-white/80 hover:text-white text-[14px] font-medium tracking-wide transition-colors py-1"
        >
          Cancel request
        </button>
      </div>

      {/* Subtle Background Glow Spheres */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-black/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
