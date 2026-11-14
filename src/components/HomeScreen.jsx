import React, { useState, useRef, useEffect } from 'react';
import { Home, FileText, Users, Sliders, MapPin } from 'lucide-react';
import { CURRENT_USER } from '../constants/initialData';

export default function HomeScreen({
  onTriggerSOS,
  onOpenAudit,
  onOpenResponders,
  onOpenSettings,
  activeTab = 'home'
}) {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const holdIntervalRef = useRef(null);

  // 2-second hold-to-activate logic (prevents pocket dials as per UX blueprint)
  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);
    const startTime = Date.now();
    const duration = 1800; // 1.8 seconds

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setHoldProgress(0);
        onTriggerSOS && onTriggerSOS();
      }
    }, 20);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    // If tapped or released quickly, still trigger the 5s cancel window for emergency access
    if (holdProgress > 15 && holdProgress < 100) {
      onTriggerSOS && onTriggerSOS();
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white overflow-hidden select-none">
      {/* Top Header Bar matching screenshot */}
      <div className="pt-8 px-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-slate-400 font-medium tracking-tight">
              Welcome back,
            </p>
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
              {CURRENT_USER.name}
            </h2>
          </div>

          {/* User Avatar with Red Badge '2' */}
          <div className="relative">
            <img
              src={CURRENT_USER.avatar}
              alt={CURRENT_USER.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-slate-100 shadow-sm"
            />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EA3B52] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              2
            </span>
          </div>
        </div>
      </div>

      {/* Main Center Emergency Section matching screenshot */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-2">
        {/* Title & Subtitle matching screenshot */}
        <h1 className="text-[24px] font-extrabold text-slate-900 text-center tracking-tight">
          Are you in emergency?
        </h1>
        <p className="text-[13px] text-slate-400 text-center mt-1.5 max-w-[260px] leading-snug">
          Press the button below help will reach you soon.
        </p>

        {/* Central Concentric Pulsing SOS Button */}
        <div className="relative my-8 flex items-center justify-center">
          {/* Layer 1: Outermost breathing soft pink halo */}
          <div className="absolute w-[260px] h-[260px] rounded-full bg-rose-100/50 animate-soft-pulse pointer-events-none" />

          {/* Layer 2: Middle coral gradient ring */}
          <div className="absolute w-[205px] h-[205px] rounded-full bg-[#EA3B52]/15 pointer-events-none" />

          {/* Layer 3: Progress Ring SVG for 2s hold */}
          <svg className="absolute w-[184px] h-[184px] -rotate-90 pointer-events-none z-10">
            <circle
              cx="92"
              cy="92"
              r="86"
              stroke="rgba(234, 59, 82, 0.15)"
              strokeWidth="5"
              fill="none"
            />
            {isHolding && (
              <circle
                cx="92"
                cy="92"
                r="86"
                stroke="#EA3B52"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 86}
                strokeDashoffset={2 * Math.PI * 86 * (1 - holdProgress / 100)}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-75"
              />
            )}
          </svg>

          {/* Layer 4: Central Rich Red SOS Button */}
          <button
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            className={`relative w-[150px] h-[150px] rounded-full bg-gradient-to-br from-[#FF576D] to-[#EA3B52] text-white flex flex-col items-center justify-center shadow-sos transition-all duration-150 active:scale-95 focus:outline-none z-20 cursor-pointer ${
              isHolding ? 'scale-95 brightness-95' : 'hover:scale-[1.02]'
            }`}
            aria-label="Hold for SOS"
          >
            <span className="text-[34px] font-black tracking-wider drop-shadow-md">
              SOS
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/80 -mt-1">
              {isHolding ? `${Math.round(holdProgress)}%` : 'Hold 2s'}
            </span>
          </button>
        </div>

        {/* Floating Address Card matching screenshot */}
        <div className="w-full max-w-[325px] bg-white rounded-2xl p-3.5 shadow-card border border-slate-100 flex items-center gap-3">
          <img
            src={CURRENT_USER.avatar}
            alt="Current location"
            className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#EA3B52]" />
              <h4 className="text-[12px] font-bold text-slate-800">
                Your current address
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {CURRENT_USER.address}
            </p>
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar matching screenshot */}
      <div className="px-6 pb-6 pt-2">
        <div className="w-full max-w-[325px] mx-auto bg-white rounded-full py-2 px-3 shadow-floating border border-slate-100 flex items-center justify-between">
          {/* Tab 1: Home (Active red pill container) */}
          <button
            onClick={() => {}}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-[12px] transition-all ${
              activeTab === 'home'
                ? 'bg-[#EA3B52] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-4 h-4 fill-current stroke-none" />
            <span>Home</span>
          </button>

          {/* Tab 2: Activity Log */}
          <button
            onClick={onOpenAudit}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            title="Activity & Safety Log"
            aria-label="Activity Log"
          >
            <FileText className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* Tab 3: Contacts & Helpers */}
          <button
            onClick={onOpenResponders}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            title="Trusted Contacts & Helpers"
            aria-label="Contacts & Helpers"
          >
            <Users className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* Tab 4: Safety Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            title="Safety Settings"
            aria-label="Safety Settings"
          >
            <Sliders className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>
      </div>
    </div>
  );
}
