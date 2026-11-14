import React, { useEffect } from 'react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function IntroBrief({ onComplete }) {
  useEffect(() => {
    // Stays for ~1.8 seconds, then automatically jumps to the Login Page
    const timer = setTimeout(() => {
      onComplete && onComplete();
    }, 1800);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#F43F5E] via-[#EA3B52] to-[#BE123C] text-white p-6 select-none overflow-hidden">
      {/* Top progress bar for 1.8s auto advance */}
      <div className="pt-8 px-2">
        <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-[1800ms] ease-linear"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Center Highlighted Card matching the clean aesthetic */}
      <div className="my-auto w-full max-w-[320px] mx-auto text-left">
        {/* Highlighted Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/25 mb-4 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>Jagrath Safety Network</span>
        </div>

        {/* Highlighted Main Heading */}
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
          Unified Emergency<br />Response Platform
        </h1>

        {/* Very Brief 2-Line Explanation */}
        <div className="mt-4 space-y-2 text-white/90 text-sm font-medium leading-relaxed">
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
            <span>Instant SOS escalation to trusted family and verified nearby helpers.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
            <span>Tamper-proof activity tracking with live GPS and privacy protection.</span>
          </p>
        </div>
      </div>

      {/* Bottom Button & Skip */}
      <div className="pb-6 w-full max-w-[320px] mx-auto flex flex-col items-center gap-3">
        <button
          onClick={onComplete}
          className="w-full py-3.5 px-6 bg-white hover:bg-slate-50 text-[#EA3B52] rounded-full font-bold text-sm shadow-lg shadow-black/15 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <span>Continue to Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
