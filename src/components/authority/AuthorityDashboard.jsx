import React, { useState } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Ambulance,
  FileCheck2,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Users
} from 'lucide-react';

import AuthorityMap from './AuthorityMap';
import IncidentInspectDrawer from './IncidentInspectDrawer';
import { generateSectorData } from '../../services/authorityAnalytics';

export default function AuthorityDashboard({ onSwitchToCitizen, authorityCoords }) {
  const [radiusKm, setRadiusKm] = useState(5);
  const [activeTab, setActiveTab] = useState('accidents'); // 'accidents' | 'pulse' | 'displacement' | 'falseCases'
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Initialize sector data anchored to authority coordinates
  const lat = authorityCoords?.lat || 12.9352;
  const lng = authorityCoords?.lng || 77.5358;
  const [sectorData, setSectorData] = useState(() => generateSectorData(lat, lng));

  // Handle AI fleet displacement authorization
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
    <div className="w-full h-screen bg-[#F3F4F6] text-slate-900 flex flex-col font-sans select-none overflow-hidden antialiased">
      {/* 1. Top Telemetry Ribbon (Anti-Print Light Surface with Crimson Accents) */}
      <header className="h-16 px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#EA3B52] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight text-slate-900">
                  Jagrat Command
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  LIVE SURVEILLANCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {sectorData.sectorName}
              </p>
            </div>
          </div>

          {/* Geofence Perimeter Radius Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <span className="text-[10px] uppercase text-slate-400 px-2 font-semibold">Radius:</span>
            {[2, 5, 15].map(r => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  radiusKm === r ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Live Tabular Telemetry Counters */}
        <div className="flex items-center gap-3">
          {/* Active Emergencies Alert Pill */}
          <div className="px-3 py-1.5 bg-[#EA3B52] text-white rounded-2xl flex items-center gap-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="text-xs font-bold font-mono">
              {sectorData.telemetry.activeSosCount} ACTIVE SOS
            </span>
          </div>

          {/* Median Response Time */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Median ETA:</span>
            <span className="font-mono font-bold text-slate-900">
              {sectorData.telemetry.medianResponseTime}
            </span>
          </div>

          {/* Ambulances Ready */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium">
            <Ambulance className="w-3.5 h-3.5 text-[#E11D48]" />
            <span className="text-slate-500">Fleet Ready:</span>
            <span className="font-mono font-bold text-slate-900">
              {sectorData.telemetry.ambulancesReadyCount}/{sectorData.telemetry.totalAmbulancesCount}
            </span>
          </div>

          {/* False Rate */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">False Case Rate:</span>
            <span className="font-mono font-bold text-slate-900">
              {sectorData.telemetry.falseCaseRate}%
            </span>
          </div>

          {/* Switch Back to Citizen Mobile App */}
          <button
            onClick={onSwitchToCitizen}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Citizen App</span>
          </button>
        </div>
      </header>

      {/* 2. Main Work Area: Left Map + Right 4-Module Analytics Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Full-Screen Interactive Silver-Grey Map */}
        <div className="flex-1 h-full relative">
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

        {/* Right: The 4 Core Authority Analytics Modules Drawer */}
        <div className="w-[430px] h-full bg-white border-l border-slate-200/90 shadow-xl flex flex-col z-20 flex-shrink-0">
          {/* Module Tab Navigation */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-1 text-center font-bold text-[11px]">
            <button
              onClick={() => setActiveTab('accidents')}
              className={`py-2 px-1 rounded-xl transition-all ${
                activeTab === 'accidents' ? 'bg-[#EA3B52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Accidents
            </button>
            <button
              onClick={() => setActiveTab('pulse')}
              className={`py-2 px-1 rounded-xl transition-all ${
                activeTab === 'pulse' ? 'bg-[#EA3B52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Pulse
            </button>
            <button
              onClick={() => setActiveTab('displacement')}
              className={`py-2 px-1 rounded-xl transition-all ${
                activeTab === 'displacement' ? 'bg-[#EA3B52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fleet AI
            </button>
            <button
              onClick={() => setActiveTab('falseCases')}
              className={`py-2 px-1 rounded-xl transition-all ${
                activeTab === 'falseCases' ? 'bg-[#EA3B52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              False Cases
            </button>
          </div>

          {/* Module Content Body */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
            {/* MODULE 1: Where Most Accidents Are Happening */}
            {activeTab === 'accidents' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                      High-Collision Corridors
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Thermal density analysis within {radiusKm} km radius
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#EA3B52] font-bold text-[10px]">
                    TOP 5
                  </span>
                </div>

                <div className="space-y-2.5">
                  {sectorData.accidentHotspots.map((spot, idx) => (
                    <div
                      key={spot.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-lg bg-[#EA3B52] text-white font-bold text-[10px] flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 truncate max-w-[210px]">
                            {spot.name}
                          </h4>
                        </div>
                        <span className="font-mono font-bold text-[#DC2626] bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                          {spot.collisionCount} Crashes
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                        <p><strong className="text-slate-700">Primary Cause:</strong> {spot.primaryCause}</p>
                        <p><strong className="text-slate-700">Peak Window:</strong> <span className="font-mono text-amber-700">{spot.peakHours}</span></p>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Risk Profile: <strong>{spot.riskLevel}</strong></span>
                        <span className="font-semibold text-slate-600">{spot.recentTrend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>AI Recommendation:</strong> Deploy speed radar and auxiliary LED floodlights at Bull Temple Junction before 21:30 to reduce predicted weekend collisions by 28%.
                  </p>
                </div>
              </div>
            )}

            {/* MODULE 2: How Everything Is Going Around The Place */}
            {activeTab === 'pulse' && (
              <div className="space-y-3.5">
                {/* Sector Stability Gauge */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Sector Stability Score
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      {sectorData.telemetry.sectorStabilityScore} / 100
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-medium">● Normal Coordinated State</p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-bold text-xs text-slate-800 bg-white shadow-2xs">
                    92%
                  </div>
                </div>

                {/* Active Incidents Feed */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Ongoing Incident Rooms ({sectorData.activeIncidents.length})
                  </h4>

                  <div className="space-y-2">
                    {sectorData.activeIncidents.map(inc => (
                      <div
                        key={inc.id}
                        onClick={() => setSelectedIncident(inc)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedIncident?.id === inc.id
                            ? 'bg-rose-50/70 border-[#EA3B52] shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{inc.id} · {inc.userName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EA3B52] text-white">
                            {inc.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">{inc.categoryLabel}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{inc.address}</p>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">ETA: <strong className="text-slate-800">{inc.assignedEta}</strong></span>
                          <span className="text-[#EA3B52] font-semibold flex items-center gap-0.5">
                            Inspect Drawer <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 3: Where Most Ambulances Have To Be Displaced */}
            {activeTab === 'displacement' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Ambulance className="w-4 h-4 text-[#E11D48]" />
                      AI Fleet Rebalancing
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Predictive relocation to eliminate coverage blind spots
                    </p>
                  </div>
                </div>

                {/* Coverage Blind Spot Card */}
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      Blind Spot Identified
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-white">
                      ETA {sectorData.coverageBlindSpot.currentEtaMinutes} MINS
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">
                    {sectorData.coverageBlindSpot.name}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {sectorData.coverageBlindSpot.reason}
                  </p>
                </div>

                {/* AI Displacement Recommendation Plan */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#EA3B52]">
                    <TrendingUp className="w-4 h-4" />
                    <span>Recommended Displacement Action</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {sectorData.displacementPlan.recommendedMove}
                  </p>

                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1 font-medium">
                    <p>• Candidate Units: <strong>KA-01-EA-312, KA-01-EA-415 (Idle ALS)</strong></p>
                    <p>• Impact: <strong className="text-emerald-700">{sectorData.displacementPlan.projectedEtaSavings}</strong></p>
                  </div>

                  {!sectorData.displacementPlan.isExecuted ? (
                    <button
                      onClick={handleAuthorizeDisplacement}
                      className="w-full py-3 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
                    >
                      <span>Authorize AI Fleet Displacement</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Units Rebalanced to Outer Ring Junction!</span>
                    </div>
                  )}
                </div>

                {/* Available Fleet Overview */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Stationed Units in Sector ({sectorData.ambulanceFleet.length})
                  </h4>
                  <div className="space-y-2">
                    {sectorData.ambulanceFleet.map(amb => (
                      <div key={amb.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">{amb.vehicleNo}</span>
                          <span className="text-[11px] text-slate-500">{amb.type} • Driver: {amb.driver}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          amb.status === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {amb.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 4: How Many False Cases */}
            {activeTab === 'falseCases' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-slate-700" />
                      False Alarm Audit & Analytics
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Audit of verified vs. aborted emergency triggers
                    </p>
                  </div>
                </div>

                {/* False Rate Metrics Cards */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Total Alerts (30 Days)</span>
                    <span className="font-mono text-base font-black text-slate-900">
                      {sectorData.falseCaseStats.totalAlertsLast30Days}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Confirmed Genuine</span>
                    <span className="font-mono text-base font-black text-emerald-600">
                      {sectorData.falseCaseStats.confirmedEmergencies} (78.9%)
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">5s Buffer Aborts</span>
                    <span className="font-mono text-base font-black text-amber-600">
                      {sectorData.falseCaseStats.cancelledInBuffer} (14.8%)
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Field False Alarms</span>
                    <span className="font-mono text-base font-black text-rose-600">
                      {sectorData.falseCaseStats.verifiedFalseAlarms} (6.3%)
                    </span>
                  </div>
                </div>

                {/* Value Delivered by Buffer Window */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Resource Savings
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    The 5-second cancel buffer prevented <strong>21 unnecessary dispatch rollouts</strong>, saving an estimated <strong>{sectorData.falseCaseStats.bufferSavingsEstimateHours}</strong>.
                  </p>
                </div>

                {/* Hoax Corridor Flag */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Vibration / Accidental Trigger Hotspot
                  </span>
                  <p className="text-[11px] text-slate-700 font-medium">
                    ⚠️ {sectorData.falseCaseStats.hoaxCorridorFlagged}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Slide-Over Incident Inspection Drawer */}
      {selectedIncident && (
        <IncidentInspectDrawer
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onDirect112={() => alert("Direct 112 Statutory Police/Ambulance Bridge Dispatched!")}
          onResolveIncident={handleResolveIncident}
        />
      )}
    </div>
  );
}
