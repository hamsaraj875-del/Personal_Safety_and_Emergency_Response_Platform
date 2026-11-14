import React from 'react';
import { X, PhoneCall, ShieldAlert, HeartPulse, CheckCircle2 } from 'lucide-react';

export default function InstructionModal({ onClose, category = "medical", onDial112 }) {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col justify-between p-6 text-white select-none">
      <div className="pt-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-white">Emergency Protocols</h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="my-auto py-2 overflow-y-auto max-h-[420px] text-left space-y-3.5 pr-1">
        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
            Immediate Golden Minute Actions
          </h4>
          <ul className="text-xs space-y-1.5 text-slate-200">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span><strong>Stay Calm:</strong> Breathe steadily and speak calmly to reassure victim.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span><strong>Maintain Visibility:</strong> Stay in illuminated public spaces or open doorways.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span><strong>Live Audio:</strong> Keep speakerphone on so arriving responders can locate audio cues.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/10 rounded-xl p-3 border border-white/10">
          <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">
            Medical & Trauma Guidance
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed">
            If bleeding, apply direct firm pressure with clean fabric. Do not move victim if spinal injury is suspected. Keep victim warm.
          </p>
        </div>

        {/* 112 Statutory Handoff Box */}
        <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Direct 112 India Handoff</h4>
              <p className="text-[11px] text-rose-200">Immediate statutory voice dispatch</p>
            </div>
            <button
              onClick={onDial112}
              className="px-3.5 py-1.5 bg-[#EA3B52] hover:bg-[#c9243a] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-3 h-3" />
              Dial 112
            </button>
          </div>
        </div>
      </div>

      <div className="pb-4">
        <button
          onClick={onClose}
          className="w-full py-3 bg-white text-slate-900 font-bold rounded-full text-xs shadow-md"
        >
          Close & Return to Live Tracking
        </button>
      </div>
    </div>
  );
}
