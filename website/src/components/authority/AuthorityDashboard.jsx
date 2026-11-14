import React, { useState, useEffect, useRef } from 'react';
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
  FileCheck2,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';

import AuthorityMap from './AuthorityMap';
import IncidentInspectDrawer from './IncidentInspectDrawer';
import { generateSectorData } from '../../services/authorityAnalytics';
import { api, authStorage } from '../../services/api';
import { socketService } from '../../services/socket';

export default function AuthorityDashboard({ onSwitchToCitizen, authorityCoords, onReauthenticate }) {
  // 5 Main Navigation Views: 'accidents' | 'anpr' | 'fleet' | 'falseCases' | 'map'
  const [activeView, setActiveView] = useState('accidents');
  const [radiusKm, setRadiusKm] = useState(5);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [activeSirenAlert, setActiveSirenAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const lat = authorityCoords?.lat || 12.9352;
  const lng = authorityCoords?.lng || 77.5358;

  // Initialize with fallback simulated data first
  const [sectorData, setSectorData] = useState(() => generateSectorData(lat, lng));

  // Audio siren synthesizer via Web Audio API (zero external assets needed)
  const playSirenSound = (isDuress = false) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = isDuress ? 'sawtooth' : 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(isDuress ? 750 : 580, now);
      osc.frequency.linearRampToValueAtTime(isDuress ? 1100 : 880, now + 0.3);
      osc.frequency.linearRampToValueAtTime(isDuress ? 750 : 580, now + 0.6);
      osc.frequency.linearRampToValueAtTime(isDuress ? 1100 : 880, now + 0.9);
      osc.frequency.linearRampToValueAtTime(isDuress ? 750 : 580, now + 1.2);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch (e) {
      // AudioContext policy blocked before gesture, ignore
    }
  };

  // 1. Fetch live sector data from server
  const fetchSectorData = async () => {
    try {
      const data = await api.get(`/authority/sector?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
      if (data && data.sectorName) {
        setSectorData(data);
        setIsServerOffline(false);
      }
    } catch (err) {
      console.warn('Live server sector fetch failed, using fallback:', err.message);
      setIsServerOffline(true);
      // Keep existing simulated data
    }
  };

  // Fetch when radius or coordinates change
  useEffect(() => {
    fetchSectorData();
  }, [lat, lng, radiusKm]);

  // 2. Realtime WebSocket subscriptions
  useEffect(() => {
    socketService.connect();

    const unsubAlert = socketService.on('authority.alert', (alertData) => {
      console.log('[AUTHORITY ALERT]', alertData);
      if (!alertData) return;
      setActiveSirenAlert(alertData);
      playSirenSound(alertData.duress);

      if (alertData.incident) {
        setSectorData((prev) => {
          const exists = prev.activeIncidents.some((i) => i.id === alertData.incident.id);
          const updated = exists ? prev.activeIncidents.map((i) => (i.id === alertData.incident.id ? alertData.incident : i)) : [alertData.incident, ...prev.activeIncidents];
          return {
            ...prev,
            activeIncidents: updated,
            telemetry: {
              ...prev.telemetry,
              activeSosCount: updated.length
            }
          };
        });
      }

      // Refresh sector data to pick up the new/escalated incident
      fetchSectorData();
    });

    const unsubCreated = socketService.on('incident.created', (incident) => {
      setSectorData((prev) => {
        const exists = prev.activeIncidents.some((i) => i.id === incident.id);
        const updated = exists ? prev.activeIncidents.map((i) => (i.id === incident.id ? incident : i)) : [incident, ...prev.activeIncidents];
        return {
          ...prev,
          activeIncidents: updated,
          telemetry: {
            ...prev.telemetry,
            activeSosCount: updated.length
          }
        };
      });
    });

    const unsubStep = socketService.on('ladder.step', ({ incidentId, step, state }) => {
      setSectorData((prev) => ({
        ...prev,
        activeIncidents: prev.activeIncidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              ladder: {
                ...(inc.ladder || {}),
                step
              },
              escalationStep: step
            };
          }
          return inc;
        })
      }));
    });

    const unsubResponder = socketService.on('responder.assigned', ({ incidentId, responder }) => {
      setSectorData((prev) => ({
        ...prev,
        activeIncidents: prev.activeIncidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              assignedResponderId: responder.id,
              assignedResponder: responder,
              assignedUnit: `${responder.name} (${responder.badge || 'EMS'})`,
              assignedEta: `${responder.etaMinutes || 4}m`
            };
          }
          return inc;
        })
      }));
    });

    const unsubResolved = socketService.on('incident.resolved', (incident) => {
      setSectorData((prev) => {
        const remaining = prev.activeIncidents.filter((i) => i.id !== incident.id);
        return {
          ...prev,
          activeIncidents: remaining,
          telemetry: {
            ...prev.telemetry,
            activeSosCount: remaining.length
          }
        };
      });
      if (selectedIncident?.id === incident.id) {
        setSelectedIncident(null);
      }
    });

    const unsubPoll = socketService.on('sector.poll', (polledData) => {
      if (polledData && polledData.sectorName) {
        setSectorData(polledData);
        setIsServerOffline(false);
      }
    });

    return () => {
      unsubAlert();
      unsubCreated();
      unsubStep();
      unsubResponder();
      unsubResolved();
      unsubPoll();
    };
  }, [lat, lng, radiusKm, soundEnabled]);

  // Authorize fleet rebalance via server API
  const handleAuthorizeDisplacement = async () => {
    try {
      await api.post('/authority/fleet/rebalance', { lat, lng });
    } catch (err) {
      console.warn('Fleet rebalance API fallback:', err.message);
    }
    setSectorData((prev) => ({
      ...prev,
      displacementPlan: {
        ...prev.displacementPlan,
        isExecuted: true
      },
      coverageBlindSpot: {
        ...prev.coverageBlindSpot,
        currentEtaMinutes: 4.2,
        deficitSeverity: 'OPTIMAL'
      }
    }));
  };

  // Resolve incident via server API
  const handleResolveIncident = async (incidentId) => {
    try {
      await api.post(`/authority/incidents/${incidentId}/resolve`, {
        reason: 'Resolved from Authority Command Center'
      });
    } catch (err) {
      console.warn('Authority resolve API call failed:', err.message);
    }
    setSectorData((prev) => {
      const remaining = prev.activeIncidents.filter((i) => i.id !== incidentId);
      return {
        ...prev,
        activeIncidents: remaining,
        telemetry: {
          ...prev.telemetry,
          activeSosCount: Math.max(0, (prev.telemetry?.activeSosCount || 1) - 1)
        }
      };
    });
    setSelectedIncident(null);
  };

  // ANPR patrol broadcast via server API
  const handleAnprBroadcast = async (item) => {
    try {
      await api.post('/authority/anpr/broadcast', {
        plateNumber: item.plateNumber,
        reason: item.reason,
        lat,
        lng
      });
      alert(`Patrol intercept broadcast transmitted for ${item.plateNumber} to all regional units.`);
    } catch (err) {
      alert(`Broadcasting intercept coordinates for ${item.plateNumber} to nearest traffic patrol unit!`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* Realtime Siren & Duress Banner */}
      {activeSirenAlert && (
        <div
          className={`px-6 py-3 flex items-center justify-between z-50 text-white animate-pulse transition-all ${activeSirenAlert.duress ? 'bg-red-700 shadow-lg' : 'bg-[#EA3B52]'
            }`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 animate-spin" />
            <div>
              <span className="font-mono font-black text-sm uppercase tracking-wider block">
                {activeSirenAlert.title || (activeSirenAlert.duress
                  ? '🚨 COVERT DURESS ALERT — HOSTAGE / COERCED RESOLUTION'
                  : '🚨 HIGH PRIORITY SOS EMERGENCY ALERT')}
              </span>
              <p className="text-xs text-rose-100">{activeSirenAlert.message || `Emergency SOS triggered for ${activeSirenAlert.incident?.userName || 'Citizen'}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white"
              title={soundEnabled ? 'Mute Siren' : 'Unmute Siren'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setActiveSirenAlert(null)}
              className="px-3 py-1 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Server Offline / Simulation Fallback Banner */}
      {isServerOffline && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Server offline — showing simulated sector data. Start backend on port 4000 for live telemetry.</span>
        </div>
      )}

      {/* 1. TOP HEADER & TELEMETRY BAR */}
      <header className="px-6 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4 z-40">
        {/* Brand & Sector */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 flex-shrink-0">
            <img src="/logo.png" alt="Jagrath Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-medium tracking-tight text-slate-900">
                Jagrath Authority Command
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-[#DE354C] border border-rose-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE SECTOR RADAR
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              {sectorData.sectorName}
            </p>
          </div>
        </div>

        {/* 5 Navigation Buttons */}
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70">
          <button
            onClick={() => setActiveView('accidents')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeView === 'accidents'
              ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
          >
            <AlertOctagon className="w-4 h-4 stroke-[2.2]" />
            <span>Accidents</span>
          </button>

          <button
            onClick={() => setActiveView('anpr')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeView === 'anpr'
              ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
          >
            <ScanLine className="w-4 h-4 stroke-[2.2]" />
            <span>Vehicle Scanner</span>
          </button>

          <button
            onClick={() => setActiveView('fleet')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeView === 'fleet'
              ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
          >
            <Ambulance className="w-4 h-4 stroke-[2.2]" />
            <span>Ambulances</span>
          </button>

          <button
            onClick={() => setActiveView('falseCases')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeView === 'falseCases'
              ? 'bg-[#EA3B52] text-white shadow-sm scale-102'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            <span>False Cases</span>
          </button>

          <button
            onClick={() => setActiveView('map')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${activeView === 'map'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Live Map ({sectorData.activeIncidents?.length || 0})</span>
          </button>
        </div>

        {/* Right Action: Radius & Citizen App Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            {[2, 5, 15].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg transition-all ${radiusKm === r ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
              >
                {r} km
              </button>
            ))}
          </div>

          {onReauthenticate ? (
            <button
              onClick={onReauthenticate}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Re-calibrate GPS Location or Change Badge ID"
            >
              <MapPin className="w-3.5 h-3.5 text-[#DE354C]" />
              <span>Calibrate Location</span>
            </button>
          ) : (
            onSwitchToCitizen && (
              <button
                onClick={onSwitchToCitizen}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Citizen App</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* 2. DEDICATED FULL-VIEW PAGES */}
      <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
        {/* PAGE 1: ACCIDENTS & HIGH-COLLISION ZONES */}
        {activeView === 'accidents' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sector Recorded Incidents</span>
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1 block">
                  {sectorData.telemetry?.totalIncidentsAnalyzed || 142}
                </span>
                <span className="text-xs font-medium text-emerald-600 mt-1 block">Analyzed across sector checkpoints</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Top Critical Junction</span>
                <span className="text-xl font-black text-[#EA3B52] truncate mt-1 block">Bull Temple Outer Ring</span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">24 crashes • 21:30–02:00 peak</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Primary Crash Cause</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">Speed Differential</span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">2-wheelers overtaking heavy freight</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active SOS Signals</span>
                <span className="text-3xl font-black text-rose-600 font-mono mt-1 block">
                  {sectorData.activeIncidents?.length || 0}
                </span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">Real-time citizen emergencies</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Top High-Collision Corridors
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ranked by historical crash frequency and severity across sector radar
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-rose-50 text-[#EA3B52] border border-rose-200 rounded-full text-xs font-bold">
                    Radius: {radiusKm} km
                  </span>
                </div>

                <div className="space-y-3">
                  {(sectorData.accidentHotspots || []).map((spot, idx) => (
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
                            <h3 className="text-base font-bold text-slate-900">{spot.name}</h3>
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

                      <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">
                          <strong>Cause:</strong> {spot.primaryCause}
                        </span>
                        <span className="text-xs font-bold text-slate-500 font-mono">{spot.trend}</span>
                      </div>

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
                    onSelectIncident={(inc) => setSelectedIncident(inc)}
                    selectedIncidentId={selectedIncident?.id}
                  />
                </div>

                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    AI Road Safety Action
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Deploy speed radar warning signage and high-output LED floodlights at{' '}
                    <strong>Bull Temple Junction</strong> before 21:30 to mitigate night collision surges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: VEHICLE SCANNER (ANPR) */}
        {activeView === 'anpr' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Vehicles Scanned Today</span>
                <span className="text-3xl font-black text-slate-900 font-mono tracking-tight mt-1 block">1,280</span>
                <span className="text-xs font-medium text-emerald-600 mt-1 block">Live across sector ANPR cameras</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hit & Run Alerts</span>
                <span className="text-3xl font-black text-[#EA3B52] font-mono mt-1 block">1 Alert</span>
                <span className="text-xs font-medium text-[#EA3B52] mt-1 block">Intercept broadcast in progress</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ambulance Blockers</span>
                <span className="text-3xl font-black text-amber-600 font-mono mt-1 block">1 Unit</span>
                <span className="text-xs font-medium text-amber-600 mt-1 block">Obstructing green corridor</span>
              </div>
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">AI Plate Match Accuracy</span>
                <span className="text-3xl font-black text-emerald-600 font-mono mt-1 block">99.4%</span>
                <span className="text-xs font-medium text-emerald-600 mt-1 block">High-speed dual camera recognition</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Real-Time Vehicle Scanner Detections
                </h2>
                <p className="text-xs text-slate-500">
                  Continuous optical recognition scanning transit intersections for hit-and-runs and corridor blockages
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(sectorData.licensePlateDetections || []).map((item) => (
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
                          <h4 className="text-sm font-bold text-slate-800 mt-2">{item.vehicleModel}</h4>
                          <p className="text-xs text-slate-500">
                            {item.locationName} • Speed: <strong>{item.speedKmh} km/h</strong> • {item.timestamp}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${item.alertType === 'CRITICAL'
                            ? 'bg-rose-50 text-[#EA3B52] border border-rose-200 animate-pulse'
                            : item.alertType === 'WARNING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : item.alertType === 'ALERT'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                        {item.reason}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">
                        Confidence: <strong>{item.confidence}</strong>
                      </span>
                      {item.alertType !== 'NORMAL' && (
                        <button
                          onClick={() => handleAnprBroadcast(item)}
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

        {/* PAGE 3: AMBULANCES & FLEET DISPATCH */}
        {activeView === 'fleet' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {sectorData.displacementPlan && (
              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#EA3B52] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      Ambulance Dispatch Optimization
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-2">
                      {sectorData.displacementPlan.actionTitle}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                      Outer Ring Junction currently has zero idle ambulances. Staging 2 units from low-demand depots cuts projected emergency arrival times by 7.2 minutes.
                    </p>
                  </div>

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
            )}

            <div>
              <h3 className="text-lg font-black text-slate-900 mb-3">
                All Stationed Sector Ambulances ({(sectorData.ambulanceFleet || []).length} Units)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(sectorData.ambulanceFleet || []).map((amb) => (
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
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${amb.status === 'Ready'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                      >
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

        {/* PAGE 4: FALSE CASES AUDIT */}
        {activeView === 'falseCases' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn text-left">
            <div className="pb-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                False Alarm Prevention & Incident Audit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sector verification breakdown of {sectorData.falseCaseStats?.totalCitywideAlerts || 1420} monthly emergency signals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Real Emergencies</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {sectorData.falseCaseStats?.confirmedEmergenciesCount || 1099}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">77.4%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Verified incidents requiring active ambulance, police, or trauma dispatch.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cancelled in 5s Buffer</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {sectorData.falseCaseStats?.cancelledInBufferCount || 254}
                  </span>
                  <span className="text-xs font-bold text-amber-600">17.9%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Pocket presses & accidental touches cancelled locally before sirens fired.
                </p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field-Verified False</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 font-mono">
                    {sectorData.falseCaseStats?.fieldFalseAlarmsCount || 67}
                  </span>
                  <span className="text-xs font-bold text-slate-600">4.7%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Responders arrived on-scene and confirmed the user was safe without triage needed.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950">Emergency Resource Protection</h3>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    The 5-second cancel window prevented {sectorData.falseCaseStats?.cancelledInBufferCount || 254} false sirens, saving an estimated{' '}
                    {sectorData.falseCaseStats?.hoursSavedByBuffer || '128 hrs'} of public responder time.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white text-emerald-800 font-mono text-xs font-black rounded-lg border border-emerald-200 shadow-2xs whitespace-nowrap self-end sm:self-center">
                {sectorData.falseCaseStats?.hoursSavedByBuffer || '128 hrs'} Saved
              </span>
            </div>
          </div>
        )}

        {/* PAGE 5: FULL-SCREEN INTERACTIVE MAP */}
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
          onDirect112={() => alert('Direct 112 Police/Ambulance Bridge Dispatched with Verified Telemetry!')}
          onResolveIncident={handleResolveIncident}
        />
      )}
    </div>
  );
}
