import React, { useState, useEffect } from 'react';
import { User, MapPin, Phone, ShieldCheck, ArrowRight, Navigation, Sparkles, RefreshCw, KeyRound, Check, CheckCircle2 } from 'lucide-react';
import { getUserByPhone, saveUser } from '../services/storage';
import { requestLocationPermission, getCurrentDeviceLocation, reverseGeocodeCoords } from '../services/locationService';

export default function LoginScreen({ onLoginSuccess }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSent, setLocationSent] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [existingUserFound, setExistingUserFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // When phone changes, check if previous profile exists
  useEffect(() => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      const existing = getUserByPhone(clean);
      if (existing) {
        setExistingUserFound(true);
        if (!name && existing.name) setName(existing.name);
        if (!address && existing.address) setAddress(existing.address);
      } else {
        setExistingUserFound(false);
      }
    } else {
      setExistingUserFound(false);
    }
  }, [phone]);

  // Generate random 6-digit OTP on screen
  const handleGenerateOtp = () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number first.");
      return;
    }
    setErrorMessage("");

    // Generate random 6-digit number
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setOtpSent(true);
  };

  // Auto fill generated OTP
  const handleAutoFillOtp = () => {
    if (generatedOtp) {
      setOtp(generatedOtp.split(""));
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    // Auto advance focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleUseLiveLocation = async () => {
    setIsLocating(true);
    try {
      // 1. Ask permission to turn on / access location on user device
      const perm = await requestLocationPermission();
      if (!perm.granted) {
        alert(perm.error || "Location access permission was denied. Please allow location in your device settings.");
        setIsLocating(false);
        return;
      }

      // 2. Fetch actual local device coordinates
      const coords = await getCurrentDeviceLocation();
      setUserCoords({ lat: coords.lat, lng: coords.lng });

      // 3. Reverse geocode to real local address
      const formattedAddress = await reverseGeocodeCoords(coords.lat, coords.lng);
      setAddress(formattedAddress);
      setLocationSent(true);
    } catch (err) {
      console.warn("Location error, attempting fallback:", err);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setAddress(`Near ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E (Bengaluru, KA)`);
            setLocationSent(true);
            setIsLocating(false);
          },
          () => {
            setAddress("Dayananda Sagar College of Engineering, Kumaraswamy Layout, Bengaluru");
            setLocationSent(true);
            setIsLocating(false);
          },
          { timeout: 4000 }
        );
      } else {
        setAddress("Dayananda Sagar College of Engineering, Kumaraswamy Layout, Bengaluru");
        setLocationSent(true);
        setIsLocating(false);
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Please enter your location or tap 'Use Current GPS'.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 6) {
      setErrorMessage("Please generate and enter the 6-digit OTP code.");
      return;
    }

    if (generatedOtp && enteredOtp !== generatedOtp) {
      setErrorMessage("Invalid OTP code. Tap 'Auto-fill' or enter the simulated code shown above.");
      return;
    }

    const existing = getUserByPhone(cleanPhone);
    const userData = {
      name: name.trim(),
      address: address.trim(),
      phone: `+91 ${cleanPhone}`,
      coords: userCoords || { lat: 12.9081, lng: 77.5670 },
      avatar: existing?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
      contacts: existing?.contacts || []
    };

    saveUser(userData);
    onLoginSuccess && onLoginSuccess(userData);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white text-slate-900 px-6 py-7 select-none overflow-y-auto no-scrollbar">
      {/* Top Header with Logo and New Font Style */}
      <div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xs border border-slate-100 mb-3 flex-shrink-0">
          <img src="/logo.png" alt="Jagrath Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-[24px] sm:text-[26px] font-normal text-slate-900 tracking-tight leading-tight">
          Welcome to Jagrath
        </h2>
        <p className="text-[13px] text-slate-500 font-normal mt-1 leading-relaxed">
          Create or log in to your personal emergency safety profile.
        </p>

        {existingUserFound && (
          <div className="mt-2.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[12px] font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Profile found! Loaded your previous details.</span>
          </div>
        )}
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-3.5 my-auto py-2">
        {/* Full Name */}
        <div>
          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[14px] font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52] transition-colors"
            />
          </div>
        </div>

        {/* Current Address & Send Live Location Button */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">
              Address / Home Zone
            </label>
            <button
              type="button"
              onClick={handleUseLiveLocation}
              disabled={isLocating}
              className="text-[11px] font-medium text-[#EA3B52] hover:text-[#d92d44] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting...' : (locationSent ? 'Live GPS Linked ✓' : 'Use Current GPS')}</span>
            </button>
          </div>
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. BMSCE Campus, Bull Temple Rd, Bengaluru"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[14px] font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52] transition-colors"
            />
          </div>
        </div>

        {/* Mobile Number Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider">
              Mobile Number
            </label>
            <button
              type="button"
              onClick={handleGenerateOtp}
              className="text-[11px] font-medium text-[#EA3B52] hover:text-[#d92d44] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3 h-3" />
              <span>{otpSent ? 'Regenerate OTP' : 'Send OTP'}</span>
            </button>
          </div>
          <div className="flex gap-2">
            <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2.5 text-[13px] font-medium text-slate-700 flex items-center">
              +91
            </div>
            <div className="relative flex-1 flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="tel"
                maxLength={10}
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-[14px] font-normal text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* On-Screen Generated OTP Card */}
        {generatedOtp && (
          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl animate-scaleIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-800 text-[11px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#EA3B52]" />
                <span>Verification OTP (Simulated SMS):</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[#EA3B52] text-white hover:bg-[#d92d44] transition-all cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-base font-medium tracking-widest text-[#EA3B52]">
                {generatedOtp}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Tap auto-fill or enter below
              </span>
            </div>
          </div>
        )}

        {/* 6-Digit OTP Input Boxes */}
        <div>
          <label className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1.5">
            Enter 6-Digit Code
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                placeholder="•"
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-medium text-slate-900 focus:outline-none focus:border-[#EA3B52] transition-all"
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <p className="text-xs text-rose-500 font-medium text-center mt-1">
            {errorMessage}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-2 py-3.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-medium rounded-2xl text-[14px] flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] cursor-pointer"
        >
          <span>Continue to Jagrath</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Social Options */}
        <div className="pt-2 text-center">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-400 font-normal">or continue with</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setName("Google User");
                setAddress("Bengaluru Central, MG Road");
                setPhone("9876543210");
                const randomCode = "849201";
                setGeneratedOtp(randomCode);
                setOtp(randomCode.split(""));
                setOtpSent(true);
              }}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setName("Facebook User");
                setAddress("Bengaluru South, Jayanagar");
                setPhone("9845012345");
                const randomCode = "736192";
                setGeneratedOtp(randomCode);
                setOtp(randomCode.split(""));
                setOtpSent(true);
              }}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Facebook</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
