import React, { useState, useEffect } from 'react';

export default function SplashLanding({ onComplete }) {
  const appName = "JAGRATH";
  const [displayedLetters, setDisplayedLetters] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < appName.length) {
        setDisplayedLetters(appName.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsFinished(true);
        // After letters finish revealing, transition to brief intro
        setTimeout(() => {
          onComplete && onComplete();
        }, 800);
      }
    }, 140); // 140ms per letter

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#F43F5E] via-[#EA3B52] to-[#BE123C] text-white select-none overflow-hidden p-6">
      {/* Background soft ambient glowing circles */}
      <div className="absolute w-72 h-72 rounded-full bg-white/10 blur-3xl -top-12 -left-12 pointer-events-none" />
      <div className="absolute w-80 h-80 rounded-full bg-black/15 blur-3xl -bottom-16 -right-16 pointer-events-none" />

      {/* Center Animated Logo / Shield Icon */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Soft pulsing emblem */}
        <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center mb-6 shadow-2xl shadow-rose-950/40 animate-soft-pulse">
          <svg className="w-10 h-10 text-white fill-current drop-shadow-md" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
        </div>

        {/* Letter-by-Letter Animated Text */}
        <div className="h-16 flex items-center justify-center">
          <h1 className="text-4xl sm:text-5xl font-black tracking-[0.25em] text-white drop-shadow-lg flex items-center">
            {displayedLetters.split("").map((char, idx) => (
              <span
                key={idx}
                className="inline-block animate-scaleIn transform transition-all duration-200"
                style={{
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
                }}
              >
                {char}
              </span>
            ))}
            {/* Blinking cursor while typing */}
            {!isFinished && (
              <span className="w-1 h-8 bg-white/80 ml-1 animate-pulse" />
            )}
          </h1>
        </div>

        {/* Subtitle tag */}
        <p className={`text-xs font-semibold uppercase tracking-[0.3em] text-white/80 mt-3 transition-opacity duration-500 ${
          isFinished ? 'opacity-100' : 'opacity-0'
        }`}>
          Vigilant Protection
        </p>
      </div>

      {/* Skip button for testing */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 text-[11px] font-bold text-white/60 hover:text-white uppercase tracking-widest px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all"
      >
        Tap to Skip
      </button>
    </div>
  );
}
