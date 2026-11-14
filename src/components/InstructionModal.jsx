import React from 'react';
import { X, PhoneCall, HeartPulse, CheckCircle2 } from 'lucide-react';

export default function InstructionModal({ onClose, onDial112 }) {
  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end p-4 select-none">
      {/* Clean White Card */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90%]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 text-[#EA3B52] flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                First-Aid & Emergency Guide
              </h3>
              <p className="text-[11px] text-slate-400">
                Immediate actions while help is on the way
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 py-3 text-left">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2">
              Important Immediate Steps:
            </h4>
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Stay on the line:</strong> Keep your phone screen on so approaching responders can see you.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Speak calmly:</strong> Reassure the person that first responders have been dispatched.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>Clear space:</strong> Move to a well-lit open area if safe to do so.</span>
              </li>
            </ul>
          </div>

          {/* 112 India Statutory Handoff Box */}
          <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Call 112 India Directly</h4>
              <p className="text-[11px] text-slate-500">Government police & ambulance</p>
            </div>
            <button
              onClick={onDial112}
              className="px-3.5 py-2 bg-[#EA3B52] hover:bg-[#d92d44] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5 fill-current" />
              Dial 112
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    </div>
  );
}
