import React, { useState } from 'react';
import { User, MapPin, Phone, ShieldCheck, ArrowRight, CheckCircle2, Navigation } from 'lucide-react';
import { CURRENT_USER } from '../constants/initialData';

export default function LoginScreen({ onLoginSuccess }) {
  const [name, setName] = useState(CURRENT_USER.name);
  const [address, setAddress] = useState(CURRENT_USER.address);
  const [phone, setPhone] = useState("98765 43210");
  const [otp, setOtp] = useState(["5", "8", "2", "1", "9", "4"]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSent, setLocationSent] = useState(true);

  const handleUseLiveLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setAddress("BMSCE Campus, Bull Temple Rd, Basavanagudi, Bengaluru, KA 560019");
      setIsLocating(false);
      setLocationSent(true);
    }, 600);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onLoginSuccess && onLoginSuccess({
      name: name || CURRENT_USER.name,
      address: address || CURRENT_USER.address,
      phone: `+91 ${phone}`
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white text-slate-900 px-6 py-8 select-none overflow-y-auto no-scrollbar">
      {/* Top Header */}
      <div className="pt-2">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#EA3B52] flex items-center justify-center mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome to Jagrat
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Set up your safety profile and verify with phone OTP.
        </p>
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5 my-auto py-3">
        {/* Name Field */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jenifer Pilman"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52] transition-colors"
            />
          </div>
        </div>

        {/* Address Field with "Send Live Location" */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Address
            </label>
            <button
              type="button"
              onClick={handleUseLiveLocation}
              disabled={isLocating}
              className="text-[11px] font-bold text-[#EA3B52] hover:text-[#d92d44] flex items-center gap-1 transition-colors"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{locationSent ? 'Live Location Linked ✓' : 'Send Live Location'}</span>
            </button>
          </div>
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Current location or address"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52] transition-colors"
            />
          </div>
        </div>

        {/* Phone Number Field */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Mobile Number
          </label>
          <div className="flex gap-2">
            <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs font-bold text-slate-700 flex items-center">
              +91
            </div>
            <div className="relative flex-1 flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 6-Digit OTP */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Enter 6-Digit OTP
            </label>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Auto-filled
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-[#EA3B52] transition-all"
              />
            ))}
          </div>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          className="w-full mt-2 py-3.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98]"
        >
          <span>Continue to Jagrat</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Social Logins */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">
            Or continue with
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
}
