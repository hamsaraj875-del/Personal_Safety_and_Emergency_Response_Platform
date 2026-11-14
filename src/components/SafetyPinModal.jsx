import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, X } from 'lucide-react';
import { CURRENT_USER } from '../constants/initialData';

export default function SafetyPinModal({ onResolveNormal, onResolveDuress, onClose }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleDigitClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError("");

      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const verifyPin = (inputPin) => {
    if (inputPin === CURRENT_USER.safetyPin) {
      onResolveNormal();
    } else if (inputPin === CURRENT_USER.duressPin) {
      // Coerced by attacker: pretend to close normally, but escalate silently!
      onResolveDuress();
    } else {
      setError("Incorrect PIN. Try again.");
      setTimeout(() => setPin(""), 800);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col justify-between p-6 text-white select-none">
      {/* Header */}
      <div className="pt-6 flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Verify Safety PIN to Resolve
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* PIN Dots */}
      <div className="my-auto flex flex-col items-center">
        <p className="text-xs text-slate-300 text-center max-w-[260px] mb-5">
          Enter your 4-digit security PIN to confirm you are safe.
        </p>

        {/* Dots */}
        <div className="flex gap-4 mb-4">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-rose-500 scale-125 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-xs text-rose-400 font-semibold">{error}</p>
        ) : (
          <p className="text-[11px] text-slate-400">
            Demo PINs: Safe (<span className="text-emerald-400 font-mono font-bold">1234</span>) • Duress (<span className="text-amber-400 font-mono font-bold">9999</span>)
          </p>
        )}
      </div>

      {/* Custom Minimalist Keypad */}
      <div className="w-full max-w-[280px] mx-auto pb-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleDigitClick(num.toString())}
              className="h-13 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-xl font-bold transition-all text-white"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigitClick("0")}
            className="h-13 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-xl font-bold transition-all text-white"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-13 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold transition-all text-slate-300 flex items-center justify-center"
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  );
}
