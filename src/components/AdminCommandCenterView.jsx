import React, { useState } from 'react';
import { Shield, ShieldAlert, Users, Activity, FileText, CheckCircle, AlertTriangle, ArrowLeft, PhoneCall } from 'lucide-react';
import { VERIFIED_RESPONDERS, CURRENT_USER } from '../constants/initialData';

export default function CommandCenterView({ onSwitchToCitizen, incidents, chain, onVerifyChain, onTamperChain }) {
  const [selectedIncident, setSelectedIncident] = useState(incidents[0] || null);

  return (
    <div className="w-full h-full min-h-[740px] bg-slate-950 text-slate-100 flex flex-col p-6 rounded-3xl border border-slate-800 shadow-2xl select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EA3B52] flex items-center justify-center text-white shadow-lg shadow-rose-900/40">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              RakshaChain Command Desk
            </h1>
            <p className="text-xs text-slate-400">
              Institutional Safety & ERSS 2.0 Dispatch Coordination Node
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToCitizen}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Switch to Citizen Mobile PWA
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 flex-1">
        {/* Col 1: Active Incidents Stream */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Active Incidents ({incidents.length})
            </h2>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedIncident?.id === inc.id
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white">
                    {inc.user_name || CURRENT_USER.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {inc.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {inc.address || CURRENT_USER.address}
                </p>
                <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400">
                  <span>Severity: <strong className="text-rose-400">{inc.severity}/5</strong></span>
                  <span>Ladder: <strong className="text-amber-400">Step {inc.escalation_step}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Live Dispatch & Responder Pool */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Verified Responders ({VERIFIED_RESPONDERS.length})
            </h2>
            <span className="text-xs text-slate-400">On Duty</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {VERIFIED_RESPONDERS.map((resp) => (
              <div key={resp.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={resp.avatar} alt={resp.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{resp.name}</h4>
                    <p className="text-[11px] text-slate-400">{resp.title} • {resp.distanceKm} km</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                  ASSIGNED
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Hash-Chain Ledger & Integrity Status */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Cryptographic Integrity
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-mono">
                {chain.length} BLOCKS
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Every status change, GPS ping, and responder handoff is immutably signed using SHA-256.
            </p>

            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Ledger Algorithm:</span>
                <span className="font-mono text-emerald-400">SHA-256 Chained</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Genesis State:</span>
                <span className="font-mono text-slate-300">H_0 (Intact)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Active Incident:</span>
                <span className="font-mono text-amber-300">{selectedIncident?.id || 'INC-01'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={onVerifyChain}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
              Verify Ledger Cryptographic Hashes
            </button>
            <button
              onClick={onTamperChain}
              className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold"
            >
              Simulate DB Row Corruption (Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
