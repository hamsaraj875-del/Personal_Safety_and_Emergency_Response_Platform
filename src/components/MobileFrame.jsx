import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export default function MobileFrame({ children, isDarkBar = false, isFullscreen = false }) {
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full h-[100dvh] bg-white overflow-hidden flex flex-col justify-between mx-auto my-auto select-none transition-all ${
      isFullscreen
        ? 'max-w-none rounded-none border-0 shadow-none'
        : 'sm:h-[812px] sm:max-w-[390px] sm:rounded-[44px] sm:shadow-2xl sm:border-[10px] sm:border-slate-900 sm:ring-1 sm:ring-black/5'
    }`}>
      {/* Top Mobile Status Bar */}
      <div className={`absolute top-0 left-0 right-0 h-10 px-6 sm:px-7 flex items-center justify-between z-40 text-xs font-semibold ${
        isDarkBar ? 'text-white' : 'text-slate-800'
      }`}>
        {/* Time */}
        <span className="font-semibold text-[13px] tracking-tight">{currentTime}</span>

        {/* Dynamic Island / Speaker Notch Indicator */}
        <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto -mt-1 hidden sm:block opacity-90" />

        {/* Right Status Icons (Cellular, Wifi, Battery) */}
        <div className="flex items-center gap-1.5">
          <Signal className="w-3.5 h-3.5 fill-current" />
          <Wifi className="w-3.5 h-3.5 stroke-[2.2]" />
          <div className="flex items-center">
            <div className={`w-5 h-2.5 rounded-[3px] border px-0.5 flex items-center ${isDarkBar ? 'border-white' : 'border-slate-800'}`}>
              <div className={`w-full h-1.5 rounded-[1px] ${isDarkBar ? 'bg-white' : 'bg-slate-800'}`} />
            </div>
            <div className={`w-0.5 h-1 rounded-r-sm ${isDarkBar ? 'bg-white' : 'bg-slate-800'}`} />
          </div>
        </div>
      </div>

      {/* Screen Body */}
      <div className="relative w-full h-full flex flex-col overflow-hidden pt-8 pb-4">
        {children}
      </div>

      {/* Bottom Home Indicator Bar */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400/50 rounded-full z-40 pointer-events-none" />
    </div>
  );
}
