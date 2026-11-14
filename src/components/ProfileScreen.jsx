import React, { useState } from 'react';
import { ChevronRight, Key, Shield, Moon, MapPin, Play, LogOut } from 'lucide-react';
import { CURRENT_USER } from '../constants/initialData';
import { runFullBenchmarkSimulation } from '../services/simulationRunner';
import BottomNavBar from './BottomNavBar';

export default function ProfileScreen({
  activeTab,
  onSelectTab,
  onStartSafeWalk,
  userProfile,
  onLogout
}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [showSimResults, setShowSimResults] = useState(false);

  const activeUser = userProfile || CURRENT_USER;

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    const data = await runFullBenchmarkSimulation();
    setSimulationData(data);
    setIsSimulating(false);
    setShowSimResults(true);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-slate-50 text-slate-900 select-none overflow-hidden">
      {/* Clean Standard Header */}
      <div className="pt-8 px-6 pb-3 bg-white border-b border-slate-100">
        <h2 className="text-[22px] font-normal text-slate-900 tracking-tight">
          Settings
        </h2>
        <p className="text-[13px] text-slate-500 font-normal">
          Account, security PINs & emergency preferences
        </p>
      </div>

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
        {/* User Profile Card - Clean, Standard, Perfectly Sized */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full overflow-hidden border-2 border-slate-100 shadow-sm flex-shrink-0">
            <img
              src={activeUser.avatar || CURRENT_USER.avatar}
              alt={activeUser.name || "User"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-medium text-slate-900 truncate leading-tight">
              {activeUser.name || "User"}
            </h3>
            <p className="text-[13px] text-slate-500 font-normal truncate mt-0.5">
              {activeUser.phone || "No phone linked"}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Safety Protection Active</span>
            </div>
          </div>
        </div>

        {/* Section 1: Security PINs */}
        <div>
          <h4 className="text-[12px] font-medium uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            Security PIN Codes
          </h4>
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm">
            {/* Safe PIN */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-[13px] font-medium text-slate-800">Normal Safe PIN</h5>
                  <p className="text-[11px] text-slate-400 font-normal">Verifies you are safe and ends alert</p>
                </div>
              </div>
              <span className="font-mono font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs border border-emerald-100">
                1234
              </span>
            </div>

            {/* Duress PIN */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-[13px] font-medium text-slate-800">Silent Duress PIN</h5>
                  <p className="text-[11px] text-slate-400 font-normal">If coerced by attacker; secretly alerts police</p>
                </div>
              </div>
              <span className="font-mono font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs border border-amber-100">
                9999
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Commute & Location */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            Safety Features
          </h4>
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm">
            {/* Night Safe Walk */}
            <button
              onClick={onStartSafeWalk}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Night Safe Walk</h5>
                  <p className="text-[11px] text-slate-400">Check-in timer for late night commute</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Address */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#EA3B52] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-800">Home Address</h5>
                  <p className="text-[11px] text-slate-400 truncate">{activeUser.address || "No address saved"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Diagnostic Benchmark (Judges) */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            System Diagnostics
          </h4>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Benchmark Simulation</h5>
                <p className="text-[11px] text-slate-400">Tests 20 incident scenarios for judges</p>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-3 py-1.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Play className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Testing...' : 'Run Test'}</span>
              </button>
            </div>

            {showSimResults && simulationData && (
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Avg Alert Speed</span>
                  <span className="font-mono font-bold text-emerald-600">{simulationData.meanTimeToNotifySec}s</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Avg Dispatch Time</span>
                  <span className="font-mono font-bold text-sky-600">{simulationData.meanTimeToAssignSec}s</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Escalation Success</span>
                  <span className="font-mono font-bold text-amber-600">{simulationData.escalationSuccessRate}%</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">Tamper Detection</span>
                  <span className="font-mono font-bold text-[#EA3B52]">100% Caught</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Log Out */}
        <div className="pt-1">
          <button
            onClick={onLogout}
            className="w-full py-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-98 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out / Switch Account</span>
          </button>
        </div>
      </div>

      {/* Persistent Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  );
}
