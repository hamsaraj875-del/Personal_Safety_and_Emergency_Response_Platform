import React from 'react';

export default function JagrathLogo({
  className = "w-10 h-10",
  rounded = "rounded-2xl",
  showBeaconGlow = false,
  alt = "Jagrath Logo"
}) {
  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${rounded} overflow-hidden shadow-xs select-none ${className}`}>
      {showBeaconGlow && (
        <div className="absolute inset-0 bg-rose-500/25 animate-pulse pointer-events-none" />
      )}
      <img
        src="/logo.png"
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
