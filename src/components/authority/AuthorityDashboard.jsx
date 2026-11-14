import React, { useState } from 'react';
import {
  AlertOctagon,
  ScanLine,
  Ambulance,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Car,
  Camera,
  Layers,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Zap,
  Activity,
  FileCheck2
} from 'lucide-react';

import AuthorityMap from './AuthorityMap';
import IncidentInspectDrawer from './IncidentInspectDrawer';
import { generateSectorData } from '../../services/authorityAnalytics';

export default function AuthorityDashboard({ onSwitchToCitizen, authorityCoords }) {
  // 5 Main Navigation Views: 'accidents' | 'anpr' | 'fleet' | 'falseCases' | 'map'
  const [activeView, setActiveView] = useState('accidents');
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const lat = authorityCoords?.lat || 12.9352;
  const lng = authorityCoords?.lng || 77.5358;
  const [sectorData, setSectorData] = useState(() => generateSectorData(lat, lng));

  // Authorize fleet rebalance
  const handleAuthorizeDisplacement = () => {
    setSectorData(prev => ({
      ...prev,
      displacementPlan: {
        ...prev.displacementPlan,
        isExecuted: true
      },
      coverageBlindSpot: {
        ...prev.coverageBlindSpot,
        currentEtaMinutes: 4.2,
        deficitSeverity: "OPTIMAL"
      }
    }));
  };

  const handleResolveIncident = (incidentId) => {
    setSectorData(prev => ({
      ...prev,
      activeIncidents: prev.activeIncidents.filter(i => i.id !== incidentId),
      telemetry: {
        ...prev.telemetry,
        activeSosCount: Math.max(0, prev.telemetry.activeSosCount - 1)
      }
    }));
    setSelectedIncident(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* 1. TOP HEADER & TELEMETRY BAR */}
      <header className="px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4 z-40">
        {/* Brand & Sector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#EA3B52] flex items-center justify-center shadow-xs flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900">
                Jagrath Authority Command
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#EA3B52] border border-rose-100">
                50,000+ DATASET
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {sectorData.sectorName}
            </p>
          </div>
        </div>

        {/* 4 Highlighted Primary Module Buttons (Big, Nice, Prominent Icons) */}
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70">
          {/* Button 1: Accidents Hotspots */}
          <button
            onClick={() => setActiveView('accidents')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeView === 'accidents'
                ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <AlertOctagon className="w-4 h-4 stroke-[2.2]" />
            <span>Accidents (50K+)</span>
          </button>

          {/* Button 2: License Plate AI */}
          <button
            onClick={() => setActiveView('anpr')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeView === 'anpr'
                ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ScanLine className="w-4 h-4 stroke-[2.2]" />
            <span>License Plate AI</span>
          </button>

          {/* Button 3: Fleet Rebalance */}
          <button
            onClick={() => setActiveView('fleet')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeView === 'fleet'
                ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Ambulance className="w-4 h-4 stroke-[2.2]" />
            <span>Fleet Rebalance</span>
          </button>

          {/* Button 4: False Cases */}
          <button
            onClick={() => setActiveView('falseCases')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeView === 'falseCases'
                ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            <span>False Cases</span>
          </button>

          {/* Button 5: Live Map */}
          <button
            onClick={() => setActiveView('map')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              activeView === 'map'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Live Map</span>
          </button>
        </div>

        {/* Right Action: Radius & Citizen App Switcher */}
        <div className="flex items-center gap-3">
          {/* Radius selector */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {[2, 5, 15].map(r => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  radiusKm === r ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          <button
            onClick={onSwitchToCitizen}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Citizen App</span>
          </button>
        </div>
      </header>

      {/* 2. DEDICATED FULL-VIEW PAGES */}
      <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
        {/* ========================================================================= */}
        {/* PAGE 1: ACCIDENTS & HIGH-COLLISION ZONES (Clean, Big, Visually Clear)     */}
        {/* ========================================================================= */}
        {activeView === 'accidents' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Recorded Incidents</span>
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1 block">50,000+</span>
                <span className="text-xs font-medium text-emerald-600 mt-1 block">Analyzed across municipal sectors</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Top Critical Junction</span>
                <span className="text-xl font-black text-[#EA3B52] truncate mt-1 block">Bull Temple Outer Ring</span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">1,420 crashes • 21:30–02:00 peak</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Primary Crash Cause</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">Speed Differential</span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">2-wheelers overtaking heavy freight</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fatalities Reduced</span>
                <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">-24.6%</span>
                <span className="text-xs font-medium text-emerald-600 mt-1 block">Following Jagrath patrol staging</span>
              </div>
            </div>

            {/* Main Split: Visual Hotspots List + Map Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top 5 Collision Corridors */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Top 5 High-Collision Corridors
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ranked by historical crash frequency and severity from 50,000 incident reports
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-rose-50 text-[#EA3B52] border border-rose-200 rounded-full text-xs font-bold">
                    Radius: {radiusKm} km
                  </span>
                </div>

                <div className="space-y-3">
                  {sectorData.accidentHotspots.map((spot, idx) => (
                    <div
                      key={spot.id}
                      className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card hover:border-[#EA3B52]/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-2xl bg-[#EA3B52] text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {idx + 1}
                          </span>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              {spot.name}
                            </h3>
                            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 inline-block mt-1">
                              Peak Window: {spot.peakHours}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-2xl font-black text-[#EA3B52] font-mono block">
                            {spot.collisionCount}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block -mt-1">
                            Crashes
                          </span>
                        </div>
                      </div>

                      {/* Primary Cause - Crystal Clear, No Wall of Text */}
                      <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">
                          <strong>Cause:</strong> {spot.primaryCause}
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          {spot.trend}
                        </span>
                      </div>

                      {/* Visual Danger Severity Bar */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#EA3B52] h-full rounded-full"
                            style={{ width: `${spot.dangerScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono text-slate-700">
                          {spot.dangerScore}/100 Risk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Interactive Map Preview + Action */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="w-full h-[460px] bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden relative">
                  <AuthorityMap
                    centerCoords={sectorData.centerCoords}
                    radiusKm={radiusKm}
                    hotspots={sectorData.accidentHotspots}
                    activeIncidents={sectorData.activeIncidents}
                    ambulances={sectorData.ambulanceFleet}
                    blindSpot={sectorData.coverageBlindSpot}
                    displacementPlan={sectorData.displacementPlan}
                  />
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    AI Road Safety Action
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Deploy speed radar warning signage and high-output LED floodlights at <strong>Bull Temple Junction</strong> before 21:30 to mitigate night collision surges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 2: LICENSE PLATE AI (ANPR & HIT-AND-RUN VEHICLE SCANNER)             */}
        {/* ========================================================================= */}
        {activeView === 'anpr' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {/* Top Stat Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Plates Scanned Today</span>
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1 block">50,000+</span>
                <span className="text-xs font-medium text-emerald-600 mt-1 block">Live across 12 sector ANPR cameras</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hit & Run Suspects</span>
                <span className="text-3xl font-black text-[#EA3B52] font-mono mt-1 block">1 Alert</span>
                <span className="text-xs font-medium text-[#EA3B52] mt-1 block">Intercept broadcast in progress</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ambulance Blockers</span>
                <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">1 Unit</span>
                <span className="text-xs font-medium text-amber-600 mt-1 block">Obstructing green corridor</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">AI OCR Accuracy</span>
                <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">99.4%</span>
                <span className="text-xs font-medium text-emerald-600 mt-1 block">High-speed dual camera recognition</span>
              </div>
            </div>

            {/* Detections List */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Real-Time License Plate AI Detections
                </h2>
                <p className="text-xs text-slate-500">
                  Continuous high-speed optical recognition scanning all transit intersections
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectorData.licensePlateDetections.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="font-mono text-xl font-black text-slate-900 tracking-wider bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 inline-block">
                            {item.plateNumber}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 mt-2">
                            {item.vehicleModel}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {item.locationName} • Speed: <strong>{item.speedKmh} km/h</strong> • {item.timestamp}
                          </p>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                          item.alertType === 'CRITICAL'
                            ? 'bg-rose-50 text-[#EA3B52] border border-rose-200 animate-pulse'
                            : item.alertType === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : item.alertType === 'ALERT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                        {item.reason}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">Confidence: <strong>{item.confidence}</strong></span>
                      {item.alertType !== 'NORMAL' && (
                        <button
                          onClick={() => alert(`Broadcasting intercept coordinates for ${item.plateNumber} to nearest traffic patrol unit!`)}
                          className="px-3.5 py-1.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white rounded-xl font-bold shadow-2xs active:scale-95 transition-all"
                        >
                          Dispatch Patrol Intercept
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 3: FLEET AI & AMBULANCE REBALANCING (Zero Chaos, Clean Before/After) */}
        {/* ========================================================================= */}
        {activeView === 'fleet' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {/* Top Clean Comparison Card: Before vs After */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#EA3B52] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    AI Fleet Rebalance Optimization
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">
                    {sectorData.displacementPlan.actionTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    Outer Ring Junction currently has zero idle ambulances. Staging 2 units from low-demand depots cuts projected emergency arrival times by 7.2 minutes.
                  </p>
                </div>

                {/* Big Clean Before / After Numbers */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200 flex-shrink-0">
                  <div className="text-center px-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current ETA</span>
                    <span className="text-2xl font-black text-[#EA3B52] font-mono">
                      {sectorData.displacementPlan.currentEta}
                    </span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-400" />

                  <div className="text-center px-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">AI Rebalanced</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                      {sectorData.displacementPlan.optimizedEta}
                    </span>
                  </div>
                </div>
              </div>

              {/* One Clear Primary Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  ✓ {sectorData.displacementPlan.timeSaved}
                </span>

                {!sectorData.displacementPlan.isExecuted ? (
                  <button
                    onClick={handleAuthorizeDisplacement}
                    className="px-6 py-3.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-98"
                  >
                    <span>Authorize Ambulance Relocation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="px-5 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2 ALS Ambulances Dispatched to Outer Ring Junction!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stationed Ambulance Fleet Grid */}
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-3">
                All Stationed Sector Ambulances ({sectorData.ambulanceFleet.length} Units)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectorData.ambulanceFleet.map(amb => (
                  <div key={amb.id} className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#EA3B52] flex items-center justify-center font-bold">
                          🚑
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{amb.vehicleNo}</h4>
                          <p className="text-[11px] text-slate-400">{amb.type}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        amb.status === 'Ready'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {amb.status}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1">
                      <p>• Driver: <strong>{amb.driver}</strong></p>
                      <p>• Fuel: <strong>{amb.fuel}</strong></p>
                      {amb.depot && <p>• Base: <strong>{amb.depot}</strong></p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 4: FALSE CASES AUDIT (Executive, Clear Metrics, 50,000 Scale)       */}
        {/* ========================================================================= */}
        {activeView === 'falseCases' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {/* 3 Large Clean Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Confirmed Real */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmed Emergencies</span>
                <span className="text-4xl font-black text-emerald-600 font-mono mt-2 block">
                  39,450
                </span>
                <span className="text-xs font-bold text-slate-600 mt-1 block">78.9% of all city alerts</span>
                <p className="text-[11px] text-slate-400 mt-2">Required active police, ambulance, or first-aid responder dispatch</p>
              </div>

              {/* 5-Sec Buffer Aborts */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cancelled in 5s Buffer</span>
                <span className="text-4xl font-black text-amber-600 font-mono mt-2 block">
                  7,400
                </span>
                <span className="text-xs font-bold text-slate-600 mt-1 block">14.8% false alarm defense</span>
                <p className="text-[11px] text-slate-400 mt-2">Pocket dials aborted locally before sirens or family alerts fired</p>
              </div>

              {/* Field False Alarms */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Field-Verified False</span>
                <span className="text-4xl font-black text-slate-700 font-mono mt-2 block">
                  3,150
                </span>
                <span className="text-xs font-bold text-slate-600 mt-1 block">6.3% resolved on arrival</span>
                <p className="text-[11px] text-slate-400 mt-2">Investigated by responder on scene and marked as resolved safely</p>
              </div>
            </div>

            {/* Public Resource Savings Highlight */}
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Public Services Saved by 5-Second Buffer
                </h3>
                <p className="text-xs text-emerald-800 mt-1 max-w-2xl leading-relaxed">
                  By requiring a 2-second hold and a 5-second cancel countdown, Jagrath stopped <strong>7,400 accidental calls</strong> from wasting city emergency resources.
                </p>
              </div>
              <span className="text-2xl font-black font-mono text-emerald-700 flex-shrink-0">
                18,400 Hrs Saved
              </span>
            </div>

            {/* Repeat Accidental Trigger Zone Flag */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Vibration / Accidental Trigger Hotspot
              </h4>
              <p className="text-sm font-bold text-slate-900">
                ⚠️ {sectorData.falseCaseStats.topAccidentalPocketDialSpot}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                High passenger boarding friction frequently triggers pocket touches. AI sensor dampening applied to this transit stop.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 5: FULL-SCREEN INTERACTIVE MAP                                       */}
        {/* ========================================================================= */}
        {activeView === 'map' && (
          <div className="w-full h-[calc(100vh-120px)] bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden relative animate-fadeIn">
            <AuthorityMap
              centerCoords={sectorData.centerCoords}
              radiusKm={radiusKm}
              hotspots={sectorData.accidentHotspots}
              activeIncidents={sectorData.activeIncidents}
              ambulances={sectorData.ambulanceFleet}
              blindSpot={sectorData.coverageBlindSpot}
              displacementPlan={sectorData.displacementPlan}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              selectedIncidentId={selectedIncident?.id}
            />
          </div>
        )}
      </div>

      {/* 3. SLIDE-OVER INCIDENT INSPECTION DRAWER */}
      {selectedIncident && (
        <IncidentInspectDrawer
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onDirect112={() => alert("Direct 112 Police/Ambulance Bridge Dispatched with Verified Telemetry!")}
          onResolveIncident={handleResolveIncident}
        />
      )}
    </div>
  );
}
