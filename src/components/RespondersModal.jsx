import React from 'react';
import { X, Users, Award, MapPin, Star, ShieldCheck, Zap } from 'lucide-react';

export default function RespondersModal({ responders, onClose, onSelectResponder, selectedResponderId }) {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between p-5 text-white select-none">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              Explainable Responder Matching
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Formula: 0.40·ETA + 0.30·Skill + 0.15·Avail + 0.15·Rating
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Responder Cards */}
      <div className="flex-1 overflow-y-auto max-h-[420px] no-scrollbar space-y-3 py-3 text-left">
        {responders.map((resp, idx) => {
          const isSelected = selectedResponderId === resp.id;

          return (
            <div
              key={resp.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-900/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={resp.avatar}
                  alt={resp.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-white truncate">
                        {resp.name}
                      </h3>
                      {resp.verified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-mono font-bold text-[11px] rounded-full border border-rose-500/30">
                      Rank #{idx + 1}
                    </span>
                  </div>

                  <p className="text-xs text-amber-300 font-medium mt-0.5">
                    {resp.title} • {resp.badge}
                  </p>

                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300 font-sans">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {resp.distanceKm} km ({resp.etaMinutes} min ETA)
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      {resp.rating}
                    </span>
                  </div>

                  {/* Human-Readable Justification Reason */}
                  <div className="mt-2 bg-black/40 rounded-lg p-2 text-[11px] text-slate-300 border border-white/5">
                    <span className="text-sky-300 font-semibold">Match Logic: </span>
                    {resp.explanation}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {resp.skills.map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => onSelectResponder(resp)}
                      className="px-3 py-1 bg-white hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition-all active:scale-95"
                    >
                      {isSelected ? 'Active Dispatch' : 'Assign'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2">
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
