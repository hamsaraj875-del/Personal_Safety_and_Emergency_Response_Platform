import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, X, Mic, CheckCircle } from 'lucide-react';

export default function CancelWindowModal({ onConfirmDispatch, onAbort, initialSeconds = 5, onAITriageNote }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [noteText, setNoteText] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onConfirmDispatch(noteText);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, noteText, onConfirmDispatch]);

  const handleSimulateVoice = () => {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setNoteText("Someone is following me closely down the alley behind the main gate, need help!");
      setIsRecordingVoice(false);
    }, 1200);
  };

  return (
    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col justify-between p-6 text-white select-none">
      {/* Top Warning Banner */}
      <div className="pt-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Pre-Dispatch Buffer Active
        </div>
        <h2 className="text-[22px] font-extrabold mt-2 text-white">
          Dispatching Emergency in
        </h2>
      </div>

      {/* Center Countdown Ring */}
      <div className="my-auto flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Outer pulsed ring */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/30 animate-ping opacity-50" />
          {/* Middle border */}
          <div className="w-36 h-36 rounded-full border-4 border-amber-400 flex items-center justify-center bg-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <span className="text-[64px] font-black text-amber-400 font-mono tracking-tight">
              {secondsLeft}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-4 text-center max-w-[260px]">
          False alarm protection: Cancel before the timer ends to prevent notifying your circle.
        </p>

        {/* Quick Context & Voice Note Option */}
        <div className="w-full max-w-[300px] mt-4 bg-white/10 rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Add Context / Note:</span>
            <button
              onClick={handleSimulateVoice}
              className={`text-[11px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                isRecordingVoice ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Mic className="w-3 h-3" />
              {isRecordingVoice ? 'Listening (10s)...' : 'Simulate Voice Note'}
            </button>
          </div>
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Someone following me / medical injury"
            className="w-full bg-black/30 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pb-4 flex flex-col gap-3 max-w-[300px] w-full mx-auto">
        <button
          onClick={() => onConfirmDispatch(noteText)}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold rounded-full text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
          Send Immediately
        </button>

        <button
          onClick={onAbort}
          className="w-full py-3 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-full text-sm flex items-center justify-center gap-2 transition-colors active:scale-95 border border-white/20"
        >
          <X className="w-4 h-4" />
          I Am Safe — Cancel Alert
        </button>
      </div>
    </div>
  );
}
