import React from 'react';

export default function AmbulanceIllustration() {
  return (
    <div className="relative w-full max-w-[280px] h-[160px] mx-auto flex items-center justify-center">
      {/* Background soft curved organic shape */}
      <div className="absolute inset-0 bg-white/15 rounded-[36px] blur-[1px] transform -rotate-1 scale-105" />

      {/* Speed lines behind vehicle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-0 opacity-70">
        <div className="w-10 h-[3px] bg-white/80 rounded-full animate-pulse" style={{ animationDuration: '0.8s' }} />
        <div className="w-6 h-[3px] bg-white/60 rounded-full animate-pulse" style={{ animationDuration: '1.2s' }} />
        <div className="w-12 h-[3px] bg-white/90 rounded-full animate-pulse" style={{ animationDuration: '0.6s' }} />
        <div className="w-8 h-[3px] bg-white/70 rounded-full animate-pulse" style={{ animationDuration: '1.0s' }} />
      </div>

      {/* Ambulance Vector Graphic */}
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full z-10 drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cabGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
          <linearGradient id="windowGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
          <filter id="sirenGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Siren Light Bar */}
        <g className="animate-siren">
          <ellipse cx="230" cy="38" rx="16" ry="6" fill="#38BDF8" opacity="0.4" filter="url(#sirenGlow)" />
          <path d="M222 40 C222 34 238 34 238 40 Z" fill="#0284C7" />
          <path d="M225 36 C225 32 235 32 235 36 Z" fill="#38BDF8" />
        </g>

        {/* Main Box & Cab Body */}
        <g>
          {/* Main Van Body */}
          <path
            d="M50 48 H210 V124 H50 Z"
            fill="url(#cabGrad)"
          />
          {/* Front Cab Slanted Nose */}
          <path
            d="M210 58 L238 78 L265 88 L268 124 H210 Z"
            fill="url(#cabGrad)"
          />
          {/* Front Bumper & Headlight */}
          <rect x="264" y="104" width="8" height="16" rx="3" fill="#E2E8F0" />
          <rect x="262" y="92" width="6" height="8" rx="2" fill="#FDE047" />

          {/* Red Emergency Horizontal Body Stripe */}
          <rect x="50" y="86" width="216" height="14" fill="#EA3B52" />

          {/* Front Cab Window */}
          <path
            d="M216 62 L236 78 L254 84 H216 Z"
            fill="url(#windowGrad)"
          />
          {/* Side Mirror */}
          <rect x="238" y="82" width="6" height="10" rx="2" fill="#475569" />

          {/* Side Cab Window */}
          <rect x="180" y="56" width="26" height="24" rx="3" fill="url(#windowGrad)" />

          {/* Medical Star of Life / Red Cross Emblem */}
          <g transform="translate(110, 68)">
            <circle cx="0" cy="0" r="16" fill="#E0F2FE" />
            {/* Blue medical star/cross */}
            <rect x="-3" y="-11" width="6" height="22" rx="2" fill="#0284C7" />
            <rect x="-11" y="-3" width="22" height="6" rx="2" fill="#0284C7" />
            {/* Small diagonal accents */}
            <rect x="-2" y="-10" width="4" height="20" rx="1.5" transform="rotate(45)" fill="#0284C7" />
            <rect x="-2" y="-10" width="4" height="20" rx="1.5" transform="rotate(-45)" fill="#0284C7" />
          </g>

          {/* Rear Back Door outline */}
          <line x1="51" y1="48" x2="51" y2="124" stroke="#CBD5E1" strokeWidth="2" />
          <rect x="55" y="74" width="4" height="12" rx="1" fill="#94A3B8" />

          {/* Underbody Shadow Line */}
          <rect x="46" y="122" width="224" height="6" rx="2" fill="#334155" />

          {/* Front Wheel Well & Wheel */}
          <g transform="translate(232, 126)">
            {/* Well Cutout */}
            <path d="M-22 0 A22 22 0 0 1 22 0 Z" fill="#1E293B" />
            {/* Outer Tire */}
            <circle cx="0" cy="0" r="18" fill="#1E293B" />
            {/* Silver Rim */}
            <circle cx="0" cy="0" r="10" fill="#94A3B8" />
            <circle cx="0" cy="0" r="5" fill="#F8FAFC" />
          </g>

          {/* Rear Wheel Well & Wheel */}
          <g transform="translate(90, 126)">
            {/* Well Cutout */}
            <path d="M-22 0 A22 22 0 0 1 22 0 Z" fill="#1E293B" />
            {/* Outer Tire */}
            <circle cx="0" cy="0" r="18" fill="#1E293B" />
            {/* Silver Rim */}
            <circle cx="0" cy="0" r="10" fill="#94A3B8" />
            <circle cx="0" cy="0" r="5" fill="#F8FAFC" />
          </g>
        </g>
      </svg>
    </div>
  );
}
