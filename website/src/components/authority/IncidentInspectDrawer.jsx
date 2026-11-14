import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  PhoneCall,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Key,
  ArrowRight,
  User,
  AlertOctagon,
  RefreshCw,
  FileCode,
  Shield
} from 'lucide-react';
import { api } from '../../services/api';

export default function IncidentInspectDrawer({ incident, onClose, onDirect112, onResolveIncident }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [handoffResult, setHandoffResult] = useState(null);

  if (!incident) return null;

  const incidentId = incident.id || incident._id;

  // Fetch blocks when drawer opens
  useEffect(() => {
    loadLedgerBlocks();
  }, [incidentId]);

  const loadLedgerBlocks = async () => {
    setIsLoadingBlocks(true);
    try {
      const data = await api.get(`/incidents/${incidentId}/ledger`);
      if (data?.blocks) {
        setBlocks(data.blocks);
      }
    } catch (err) {
      console.warn('Failed to load ledger blocks from server:', err);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setVerifiedStatus(null);
    try {
      const data = await api.get(`/incidents/${incidentId}/ledger/verify`);
      setIsVerifying(false);
      setVerifiedStatus({
        valid: data.isValid,
        brokenIndex: data.brokenIndex,
        message: data.reason || (data.isValid ? 'Ledger verified.' : 'Tamper detected.'),
        checkedCount: data.checkedCount
      });
      // Refresh block list
      loadLedgerBlocks();
    } catch (err) {
      setIsVerifying(false);
      setVerifiedStatus({
        valid: false,
        message: err.message || 'Verification request failed.'
      });
    }
  };

  const handleTamperBlock = async (blockIndex = 0) => {
    setTamperLoading(true);
    try {
      await api.post(`/demo/incidents/${incidentId}/tamper`, { blockIndex });
      await handleVerifyChain();
    } catch (err) {
      alert(`Tamper request failed: ${err.message}`);
    } finally {
      setTamperLoading(false);
    }
  };

  const handleRestoreBlock = async (blockIndex = 0) => {
    setTamperLoading(true);
    try {
      await api.post(`/demo/incidents/${incidentId}/restore`, { blockIndex });
      await handleVerifyChain();
    } catch (err) {
      alert(`Restore request failed: ${err.message}`);
    } finally {
      setTamperLoading(false);
    }
  };

  const handleDirect112Handoff = async () => {
    try {
      const data = await api.post(`/authority/incidents/${incidentId}/handoff-112`);
      setHandoffResult(data);
      if (onDirect112) onDirect112(incident);
    } catch (err) {
      alert(`112 handoff failed: ${err.message}`);
    }
  };

  const lat = incident.location?.lat || incident.location?.coordinates?.[1] || 12.9352;
  const lng = incident.location?.lng || incident.location?.coordinates?.[0] || 77.5358;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[9000] border-l border-slate-200 flex flex-col justify-between select-none animate-slideLeft">
      {/* Drawer Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs border border-slate-100 flex-shrink-0">
            <img src="/logo.png" alt="Jagrath Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{incident.code || incident.id}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                incident.duress
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-[#EA3B52] text-white'
              }`}>
                {incident.duress ? 'DURESS ALERT' : `Severity ${incident.severity || 3}/5`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{incident.category || incident.categoryLabel || 'General Emergency'}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
        {/* Victim Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Citizen Profile</span>
            <span className="text-xs font-mono font-bold text-emerald-600">● LIVE PINGS ACTIVE</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-xs">
              {(incident.userName || 'Citizen').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{incident.userName || 'Citizen'}</h4>
              <p className="text-xs text-slate-500">{incident.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</p>
              {incident.userPhone && (
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{incident.userPhone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-mono text-slate-600">
            <div className="bg-white p-2 rounded-xl border border-slate-200/60">
              <span className="text-[9px] text-slate-400 block font-sans">Coordinates</span>
              <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200/60">
              <span className="text-[9px] text-slate-400 block font-sans">Speed Profile</span>
              <span>{incident.speedProfile || 'FAST'}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-slate-200/60">
              <span className="text-[9px] text-slate-400 block font-sans">Status</span>
              <span className="font-bold text-rose-600">{incident.status}</span>
            </div>
          </div>
        </div>

        {/* Live Escalation State Machine Progression */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Escalation Ladder
            </span>
            <span className="text-xs font-bold text-[#EA3B52]">
              Step {incident.ladder?.step ?? incident.escalationStep ?? 1} of 5
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#EA3B52] h-full rounded-full transition-all duration-500"
              style={{ width: `${(((incident.ladder?.step ?? incident.escalationStep ?? 1)) / 5) * 100}%` }}
            />
          </div>

          {incident.assignedResponder && (
            <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">
                  {incident.assignedResponder.name} ({incident.assignedResponder.badge || 'EMS'})
                </span>
                <span className="text-[11px] text-slate-500">
                  ETA: <strong>{incident.assignedResponder.etaMinutes}m</strong> • {incident.assignedResponder.title}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold">
                {incident.status}
              </span>
            </div>
          )}
        </div>

        {/* SHA-256 Cryptographic Tamper-Proof Audit */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Cryptographic Evidence Chain
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">SHA-256 IMMUTABLE</span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Every status transition and alert event is cryptographically linked to Genesis H_0. Single source of truth.
          </p>

          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Recomputing Hashes...' : 'Verify Record Integrity'}</span>
          </button>

          {verifiedStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              verifiedStatus.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {verifiedStatus.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">
                  {verifiedStatus.valid ? 'Chain Integrity Verified' : `Tamper Detected at Block #${verifiedStatus.brokenIndex}`}
                </span>
                <span className="text-[11px] leading-snug block mt-0.5">{verifiedStatus.message}</span>
              </div>
            </div>
          )}

          {/* Block list */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
              <span>Ledger Blocks ({blocks.length})</span>
              <button
                onClick={loadLedgerBlocks}
                className="hover:text-slate-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 no-scrollbar">
              {blocks.map((blk) => (
                <div
                  key={blk.id || blk.index}
                  className={`p-2.5 rounded-xl border text-xs transition-colors ${
                    blk.tampered || (verifiedStatus && !verifiedStatus.valid && verifiedStatus.brokenIndex === blk.index)
                      ? 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold">Block #{blk.index}: {blk.eventType}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(blk.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Hash: {blk.hash ? `${blk.hash.slice(0, 12)}...` : 'N/A'}</span>
                    <span className="text-[9px] uppercase font-sans font-semibold text-slate-400">{blk.actorRole}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon Demo Tamper Simulation Controls */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Judges Demo Controls
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTamperBlock(0)}
                disabled={tamperLoading}
                className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition-colors disabled:opacity-50"
              >
                Simulate Tamper (Block 0)
              </button>
              <button
                type="button"
                onClick={() => handleRestoreBlock(0)}
                disabled={tamperLoading}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold transition-colors disabled:opacity-50"
              >
                Restore Block
              </button>
            </div>
          </div>
        </div>

        {/* 112 Statutory Handoff Confirmation */}
        {handoffResult && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-purple-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>ERSS 112 Dispatch Packet Transmitted</span>
            </div>
            <p className="text-[11px] text-purple-700">
              Agency: <strong>{handoffResult.agency}</strong> • CAD Ref: <strong>{handoffResult.cadReference}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Drawer Action Footer */}
      <div className="p-6 border-t border-slate-100 flex flex-col gap-2.5">
        <button
          onClick={handleDirect112Handoff}
          className="w-full py-3 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Direct 112 Statutory Police/Ambulance Handoff</span>
        </button>

        <button
          onClick={() => onResolveIncident && onResolveIncident(incidentId)}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
        >
          Mark Incident Safe & Resolved
        </button>
      </div>
    </div>
  );
}
