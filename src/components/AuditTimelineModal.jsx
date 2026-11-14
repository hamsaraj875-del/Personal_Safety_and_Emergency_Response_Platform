import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, RefreshCw, Key, CheckCircle, Database } from 'lucide-react';
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
    // Simulate brief cryptographic check animation
    setTimeout(async () => {
      const result = await verifyChainIntegrity(chain);
      setVerificationResult(result);
      setIsVerifying(false);
    }, 450);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col justify-between p-5 text-white select-none">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              SHA-256 Tamper-Proof Audit Chain
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Immutable cryptographic incident record (Section 08 Architecture)
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Verification Control Banner */}
      <div className="my-2 bg-white/5 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Recomputing...' : 'Verify Chain Integrity'}
          </button>

          {!isTampered ? (
            <button
              onClick={onTamperBlock}
              className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
            >
              <Database className="w-3.5 h-3.5" />
              Simulate DB Tampering
            </button>
          ) : (
            <button
              onClick={() => {
                onRestoreChain();
                setVerificationResult(null);
              }}
              className="px-2.5 py-1.5 bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restore Clean Chain
            </button>
          )}
        </div>

        {/* Verification Status Pill */}
        {verificationResult && (
          <div className="w-full mt-2">
            {verificationResult.isValid ? (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>100% VALID:</strong> All {verificationResult.checkedCount} blocks verified sequentially from Genesis H_0. Zero tampering detected.
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/50 rounded-lg flex items-start gap-2 text-rose-200 text-xs animate-bounce">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-300">
                    TAMPERING DETECTED AT BLOCK #{verificationResult.brokenIndex}!
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    {verificationResult.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Block Sequence List */}
      <div className="flex-1 overflow-y-auto max-h-[380px] no-scrollbar space-y-2.5 py-1 text-left">
        {chain.map((block, idx) => {
          const isBroken = verificationResult && !verificationResult.isValid && verificationResult.brokenIndex === idx;
          const isPriorValid = verificationResult && !verificationResult.isValid && idx < verificationResult.brokenIndex;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all text-xs font-mono ${
                isBroken
                  ? 'bg-rose-950/70 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  : isPriorValid
                  ? 'bg-slate-900/80 border-emerald-500/40'
                  : block.tampered
                  ? 'bg-rose-950/40 border-rose-500/60'
                  : 'bg-slate-900/70 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between font-sans mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">Block #{block.index}</span>
                  <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300 uppercase">
                    {block.eventType}
                  </span>
                  <span className="text-[10px] text-slate-400">by {block.actorRole}</span>
                </div>

                {isBroken ? (
                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3" /> BROKEN LINK
                  </span>
                ) : isPriorValid ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> VALID
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-sans">
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Hashes */}
              <div className="space-y-1 text-[10px] text-slate-400">
                <div className="truncate">
                  <span className="text-slate-500">Prev Hash: </span>
                  <span className="text-amber-400/90">{block.prevHash.slice(0, 16)}...</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-500">Block Hash: </span>
                  <span className={isBroken ? 'text-rose-400 font-bold' : 'text-emerald-400/90'}>
                    {block.hash.slice(0, 16)}...
                  </span>
                </div>
                <div className="bg-black/40 p-1.5 rounded text-slate-300 font-mono text-[9px] truncate">
                  Payload: {JSON.stringify(block.payload)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Close */}
      <div className="pt-2">
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full text-xs transition-colors"
        >
          Close Audit Inspector
        </button>
      </div>
    </div>
  );
}
