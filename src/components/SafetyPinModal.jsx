import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
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
      setError("Incorrect PIN. Please try again.");
      setTimeout(() => setPin(""), 700);
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end p-4 select-none">
      {/* Clean White Card */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Confirm You Are Safe
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 max-w-[260px] mt-1 mb-4 leading-relaxed">
          Enter your 4-digit security PIN to end the alert and notify your circle that you are safe.
        </p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-4">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-[#EA3B52] scale-110 shadow-sm'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p className="text-xs text-rose-500 font-semibold mb-3">{error}</p>
        ) : (
          <p className="text-[11px] text-slate-400 mb-3">
            Demo PINs: Safe (<span className="text-emerald-600 font-bold">1234</span>) • Silent Emergency (<span className="text-amber-600 font-bold">9999</span>)
          </p>
        )}

        {/* Light Minimalist Keypad */}
        <div className="w-full max-w-[280px]">
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleDigitClick(num.toString())}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-lg font-bold transition-all text-slate-800 shadow-sm border border-slate-100"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigitClick("0")}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-lg font-bold transition-all text-slate-800 shadow-sm border border-slate-100"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-xs font-bold transition-all text-slate-600 flex items-center justify-center border border-slate-100"
            >
              DEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
