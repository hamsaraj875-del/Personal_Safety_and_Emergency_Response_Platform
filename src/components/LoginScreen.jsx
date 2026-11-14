import React, { useState, useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';
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
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    setErrorMessage("");

    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomCode);
    setOtpSent(true);
  };

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

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleUseLiveLocation = async () => {
    setIsLocating(true);
    try {
      const perm = await requestLocationPermission();
      if (!perm.granted) {
        alert(perm.error || "Location access permission was denied. Please allow location in your device settings.");
        setIsLocating(false);
        return;
      }

      const coords = await getCurrentDeviceLocation();
      setUserCoords({ lat: coords.lat, lng: coords.lng });

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
          }
        );
        return;
      }
      setAddress("Dayananda Sagar College of Engineering, Kumaraswamy Layout, Bengaluru");
      setLocationSent(true);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("Please provide your home or zone address.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a 10-digit mobile number.");
      return;
    }

    if (!otpSent) {
      handleGenerateOtp();
      return;
    }

    const enteredOtp = otp.join('');
    if (enteredOtp !== generatedOtp) {
      setErrorMessage("Invalid OTP code. Tap 'Auto-fill' or check code above.");
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

  const cleanPhone = phone.replace(/\D/g, '');
  const canSendOtp = cleanPhone.length === 10;

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white text-slate-900 px-7 py-8 select-none overflow-y-auto no-scrollbar">
      {/* Top Header matching exact screenshot typography */}
      <div>
        <span className="text-[#DE354C] text-[17px] font-normal block mb-2 tracking-tight">
          Jaagruth
        </span>
        <h1 className="text-[26px] sm:text-[28px] font-normal text-slate-900 tracking-tight leading-tight mb-2">
          Create your safety profile
        </h1>
        <p className="text-[15px] font-normal text-slate-500 leading-snug">
          We'll use these details to coordinate help<br />during an active incident.
        </p>

        {existingUserFound && (
          <div className="mt-3 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[13px] font-normal">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Profile found! Loaded your previous details.</span>
          </div>
        )}
      </div>

      {/* Main Input Stack matching screenshot */}
      <form onSubmit={handleSubmit} className="space-y-4 my-auto py-4">
        {/* Input 1: Your name */}
        <div>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full h-[54px] bg-white border border-slate-300 rounded-2xl px-4 text-[16px] font-normal text-slate-900 placeholder:text-slate-700 focus:outline-none focus:border-[#DE354C] transition-colors"
          />
        </div>

        {/* Input 2: Home address */}
        <div>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Home address"
            className="w-full h-[54px] bg-white border border-slate-300 rounded-2xl px-4 text-[16px] font-normal text-slate-900 placeholder:text-slate-700 focus:outline-none focus:border-[#DE354C] transition-colors"
          />
        </div>

        {/* Pill Button: Use my GPS */}
        <div>
          <button
            type="button"
            onClick={handleUseLiveLocation}
            disabled={isLocating}
            className="w-full h-[48px] bg-white border border-slate-300 rounded-full text-[15px] font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          >
            {isLocating
              ? 'Detecting GPS...'
              : (locationSent ? 'Live GPS Linked ✓' : 'Use my GPS')}
          </button>
        </div>

        {/* Input 3: 10-digit phone number */}
        <div>
          <input
            type="tel"
            maxLength={10}
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="10-digit phone number"
            className="w-full h-[54px] bg-white border border-slate-300 rounded-2xl px-4 text-[16px] font-normal text-slate-900 placeholder:text-slate-700 focus:outline-none focus:border-[#DE354C] transition-colors"
          />
        </div>

        {/* Microcopy matching screenshot */}
        <p className="text-[13px] font-normal text-slate-500 leading-snug">
          Your location is shared only during an active incident.
        </p>

        {/* On-Screen Generated OTP Card */}
        {otpSent && (
          <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl animate-scaleIn space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-800 text-[12px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#DE354C]" />
                <span>Simulated SMS Code:</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#DE354C] text-white hover:bg-[#cf2f44] transition-all cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-medium tracking-widest text-[#DE354C]">
                {generatedOtp}
              </span>
              <span className="text-[11px] text-slate-500">
                Tap auto-fill or enter below
              </span>
            </div>

            {/* 6-Digit OTP Input Boxes */}
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  placeholder="•"
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl text-center text-base font-medium text-slate-900 focus:outline-none focus:border-[#DE354C] transition-all"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <p className="text-[13px] text-rose-500 font-normal text-center">
            {errorMessage}
          </p>
        )}

        {/* Action Button matching screenshot */}
        <div className="pt-2">
          {!otpSent ? (
            <button
              type="button"
              onClick={handleGenerateOtp}
              disabled={!canSendOtp}
              className={`w-full h-[52px] rounded-full text-[15px] font-medium transition-all flex items-center justify-center cursor-pointer ${
                canSendOtp
                  ? 'bg-[#DE354C] text-white hover:bg-[#cf2f44] shadow-sm active:scale-[0.99]'
                  : 'bg-[#EEF2F6] text-[#9CA3AF] cursor-not-allowed'
              }`}
            >
              Send simulated OTP
            </button>
          ) : (
            <button
              type="submit"
              className="w-full h-[52px] bg-[#DE354C] hover:bg-[#cf2f44] text-white rounded-full text-[15px] font-medium shadow-sm transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
            >
              Verify & Enter Jagrath
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
