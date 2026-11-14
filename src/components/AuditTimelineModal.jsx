import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import { verifyChainIntegrity } from '../services/cryptoLedger';

export default function AuditTimelineModal({
  chain,
  onClose,
  onTamperBlock,
  onRestoreChain,
  isTampered
}) {
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    setTimeout(async () => {
      const result = await verifyChainIntegrity(chain);
      setVerificationResult(result);
      setIsVerifying(false);
    }, 400);
  };

  // Friendly human-readable event labels for general public
  const getEventFriendlyName = (type) => {
    switch (type) {
      case 'PLATFORM_INIT': return 'Safety Network Connected';
      case 'TRIGGERED': return 'SOS Alert Initiated';
      case 'LADDER_STEP_1': return 'Contact 1 (Family) Alerted';
      case 'LADDER_STEP_2': return 'Contact 2 Alerted';
      case 'RESPONDER_ASSIGNED': return 'First Responder (Emily) Dispatched';
      case 'RESOLVED_SAFE': return 'Alert Resolved Safely';
      case 'FALSE_ALARM': return 'Cancelled by User (Safe)';
      case 'DURESS_ESCALATION': return 'Silent Duress Escalation';
      default: return type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end p-4 select-none">
      {/* Clean White Card matching screenshot design */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90%]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 text-[#EA3B52] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Activity & Safety Log
              </h3>
              <p className="text-[11px] text-slate-400">
                Verified digital record of every alert and response
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

        {/* Action Controls for Demo & Judges */}
        <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying...' : 'Check Record Integrity'}
          </button>

          {!isTampered ? (
            <button
              onClick={onTamperBlock}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
            >
              Simulate Record Edit (Demo)
            </button>
          ) : (
            <button
              onClick={() => {
                onRestoreChain();
                setVerificationResult(null);
              }}
              className="px-3 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restore Original
            </button>
          )}

          {/* Verification Status Banner */}
          {verificationResult && (
            <div className="w-full mt-2">
              {verificationResult.isValid ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>100% Authentic:</strong> All {verificationResult.checkedCount} entries are cryptographically signed and untampered.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-[#EA3B52] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#EA3B52]">
                      UNAUTHORIZED EDIT DETECTED!
                    </span>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Entry #{verificationResult.brokenIndex} was altered after creation. The chain broke at this record.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 py-1">
          {chain.map((block, idx) => {
            const isBroken = verificationResult && !verificationResult.isValid && verificationResult.brokenIndex === idx;

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all text-xs ${
                  isBroken
                    ? 'bg-rose-50 border-[#EA3B52] shadow-sm'
                    : block.tampered
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">
                    {getEventFriendlyName(block.eventType)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  {block.eventType === 'TRIGGERED' && 'Emergency alert created with live GPS telemetry.'}
                  {block.eventType === 'LADDER_STEP_1' && 'First priority contact notified via priority SMS & alarm.'}
                  {block.eventType === 'LADDER_STEP_2' && 'Second contact notified automatically.'}
                  {block.eventType === 'RESPONDER_ASSIGNED' && 'First responder Emily Dayton assigned (5 min away).'}
                  {block.eventType === 'RESOLVED_SAFE' && 'Emergency verified safe and closed with PIN.'}
                  {block.eventType === 'PLATFORM_INIT' && 'Device registered and monitoring standby active.'}
                  {block.eventType === 'FALSE_ALARM' && 'Cancelled locally within 5-second buffer window.'}
                  {block.eventType === 'DURESS_ESCALATION' && 'Covert alert escalated silently to security command.'}
                </div>

                {isBroken && (
                  <p className="text-[10px] font-bold text-[#EA3B52] mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Digital signature mismatch — data was modified!
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
