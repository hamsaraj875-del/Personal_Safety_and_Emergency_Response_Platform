import React, { useEffect } from 'react';

export default function IntroBrief({ onComplete }) {
  useEffect(() => {
    // Stays for ~2 seconds, then automatically advances to login screen
    const timer = setTimeout(() => {
      onComplete && onComplete();
    }, 2200);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white text-slate-900 px-7 py-8 select-none overflow-hidden">
      {/* Top subtle auto-advance indicator */}
      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-6">
        <div
          className="bg-[#DE354C] h-full rounded-full transition-all duration-[2200ms] ease-linear"
          style={{ width: '100%' }}
        />
      </div>

      {/* Main Content matching exact screenshot typography */}
      <div className="flex-1 flex flex-col justify-center max-w-[340px] mx-auto w-full -mt-6">
        {/* Brand tag in soft coral red */}
        <span className="text-[#DE354C] text-[17px] font-normal block mb-2 tracking-tight">
          Jaagruth
        </span>

        {/* Main Heading in clean geometric font */}
        <h1 className="text-[28px] sm:text-[30px] font-normal text-slate-900 tracking-tight leading-[1.22] mb-3">
          Jaagruth Safety<br />Network
        </h1>

        {/* Subtitle */}
        <p className="text-[15px] font-normal text-slate-500 leading-snug mb-8">
          Coordinated emergency response with a<br />tamper-evident record.
        </p>

        {/* Elevated Rounded Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-3">
          <p className="text-[16px] sm:text-[17px] font-normal text-slate-900 leading-snug">
            A trusted circle, ready when you<br />need help.
          </p>
          <p className="text-[14px] sm:text-[15px] font-normal text-slate-500 leading-relaxed">
            One alert coordinates people nearby<br />and keeps a tamper-evident record.
          </p>
        </div>
      </div>

      {/* Bottom Button matching screenshot */}
      <div className="w-full max-w-[340px] mx-auto pt-4">
        <button
          onClick={onComplete}
          className="w-full py-4 bg-[#DE354C] hover:bg-[#cf2f44] text-white rounded-full font-medium text-[16px] shadow-sm transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
