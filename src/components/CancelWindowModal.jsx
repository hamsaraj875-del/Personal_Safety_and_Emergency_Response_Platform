import React, { useState, useEffect } from 'react';
import { AlertCircle, Send, X, Mic } from 'lucide-react';

export default function CancelWindowModal({ onConfirmDispatch, onAbort, initialSeconds = 5 }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [noteText, setNoteText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

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
    setIsRecording(true);
    setTimeout(() => {
      setNoteText("Someone is following me, need help near the main road!");
      setIsRecording(false);
    }, 1000);
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end p-4 select-none">
      {/* Clean White Bottom Sheet Card matching screenshot aesthetic */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
        {/* Drag handle */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mb-3" />

        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold border border-amber-200 mb-2">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Starting alert in</span>
        </div>

        {/* Large Countdown Circle */}
        <div className="relative w-20 h-20 my-2 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-50 border-4 border-amber-400 animate-pulse" />
          <span className="text-3xl font-black text-amber-600 font-mono z-10">
            {secondsLeft}s
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mt-1">
          Sending help request
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
          If you pressed by mistake, tap Cancel below. No alerts will be sent to your family.
        </p>

        {/* Quick voice or text note */}
        <div className="w-full mt-4 bg-slate-50 rounded-2xl p-3 border border-slate-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700">Add note (optional):</span>
            <button
              onClick={handleSimulateVoice}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                isRecording ? 'bg-[#EA3B52] text-white animate-pulse' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Mic className="w-3 h-3" />
              {isRecording ? 'Listening...' : 'Voice note'}
            </button>
          </div>
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g., Someone following me / accident"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52]"
          />
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-4 flex flex-col gap-2.5">
          <button
            onClick={() => onConfirmDispatch(noteText)}
            className="w-full py-3.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
            Send Immediately
          </button>

          <button
            onClick={onAbort}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
          >
            <X className="w-4 h-4" />
            I'm Safe — Cancel Alert
          </button>
        </div>
      </div>
    </div>
  );
}
