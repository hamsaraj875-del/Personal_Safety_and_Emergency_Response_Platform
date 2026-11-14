import React, { useState } from 'react';
import { X, Sliders, Play, CheckCircle2, AlertOctagon, TrendingUp, Cpu, Activity } from 'lucide-react';
import { runFullBenchmarkSimulation } from '../services/simulationRunner';

export default function AdminSettingsModal({ onClose, activeMode, onChangeMode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    const data = await runFullBenchmarkSimulation();
    setSimulationData(data);
    setIsSimulating(false);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between p-5 text-white select-none">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Admin & Simulation Controls
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Judge benchmark metrics & institutional fleet control
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto max-h-[420px] no-scrollbar space-y-4 py-2 text-left">
        {/* View Switcher */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <h3 className="text-xs font-bold text-slate-200 mb-2">Simulate Role View:</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeMode('user')}
              className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
                activeMode === 'user' ? 'bg-[#EA3B52] text-white shadow-sm' : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              Citizen PWA (Design)
            </button>
            <button
              onClick={() => onChangeMode('admin')}
              className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
                activeMode === 'admin' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              Admin Command Deck
            </button>
          </div>
        </div>

        {/* 20-Incident Benchmark Simulation Runner */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Scripted 20-Incident Simulation
              </h3>
              <p className="text-[10px] text-slate-400">
                Benchmarks MTTN, MTTA, triage accuracy & tamper detection
              </p>
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            >
              <Play className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Running...' : 'Run Simulation'}
            </button>
          </div>

          {simulationData ? (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Mean Time to Notify (MTTN)</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {simulationData.meanTimeToNotifySec}s
                  </span>
                </div>
                <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Mean Time to Assign (MTTA)</span>
                  <span className="text-sm font-mono font-bold text-sky-400">
                    {simulationData.meanTimeToAssignSec}s
                  </span>
                </div>
                <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Escalation Success</span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {simulationData.escalationSuccessRate}%
                  </span>
                </div>
                <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Tamper Detection Rate</span>
                  <span className="text-sm font-mono font-bold text-rose-400">
                    {simulationData.tamperDetectionRate}
                  </span>
                </div>
              </div>

              {/* Triage comparison */}
              <div className="bg-black/40 p-2 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">AI Triage vs Baseline Keyword</span>
                  <span className="text-emerald-400 font-bold">{simulationData.triageAccuracyPct}% AI</span>
                  <span className="text-slate-400"> vs </span>
                  <span className="text-slate-400">{simulationData.baselineKeywordPct}% Keyword</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic mt-2">
              Click "Run Simulation" to execute the 20-incident test suite for judges.
            </p>
          )}
        </div>

        {/* ERSS 2.0 & Statutory Handoff Specs */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs">
          <h3 className="font-bold text-white mb-1">ERSS 2.0 Statutory Integration</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Positioned strictly as the personal coordination & verifiable record layer alongside 112 India. Full structured JSON telemetry dispatched at Ladder Step 5.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2">
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-xs transition-colors"
        >
          Close Settings
        </button>
      </div>
    </div>
  );
}
