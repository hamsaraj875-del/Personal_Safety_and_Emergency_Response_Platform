import React, { useState } from 'react';
import { Shield, MapPin, Key, Lock, Navigation, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { api, authStorage } from '../../services/api';
import { socketService } from '../../services/socket';

export default function AuthorityLoginModal({ onAuthorizeLocation, onClose }) {
  const [badgeId, setBadgeId] = useState("BLR-OPS-892");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState('badge'); // 'badge' | 'geo'
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [geoError, setGeoError] = useState("");

  const handleBadgeSubmit = (e) => {
    e?.preventDefault();
    setLoginError("");
    if (!badgeId.trim()) {
      setLoginError("Please enter a valid Officer Badge ID.");
      return;
    }
    if (!password.trim()) {
      setLoginError("Please enter your Station Password / PIN.");
      return;
    }
    setStage('geo');
  };

  const performLogin = async (coords) => {
    setIsLoading(true);
    setLoginError("");
    try {
      const data = await api.post('/auth/authority/login', {
        badgeId: badgeId.trim(),
        password: password.trim(),
        lat: coords.lat,
        lng: coords.lng
      });

      if (data?.token) {
        authStorage.setToken(data.token);
        if (data.officer) {
          authStorage.setOfficer(data.officer);
        }
        // Connect WebSocket with new token
        socketService.connect();

        onAuthorizeLocation({
          ...coords,
          badgeId: data.officer?.badgeId || badgeId,
          officer: data.officer,
          isLiveServer: true
        });
      } else {
        throw new Error('Invalid response received from server.');
      }
    } catch (err) {
      console.warn('Authority login error:', err);
      const msg = err.code === 'TIMEOUT'
        ? 'Authentication request timed out. Server might be offline.'
        : (err.message || 'Authentication failed. Please verify Badge ID and Password.');
      setLoginError(msg);
      setStage('badge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestLocation = () => {
    setIsLocating(true);
    setGeoError("");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setIsLocating(false);
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 10
          };
          await performLogin(coords);
        },
        async (err) => {
          setIsLocating(false);
          setGeoError("GPS fix unavailable. Falling back to Bengaluru South Command Coordinates.");
          const coords = {
            lat: 12.9352,
            lng: 77.5358,
            accuracy: 15,
            isFallback: true
          };
          await performLogin(coords);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      performLogin({
        lat: 12.9352,
        lng: 77.5358,
        accuracy: 15,
        isFallback: true
      });
    }
  };

  const handleUseStationCoords = () => {
    performLogin({
      lat: 12.9352,
      lng: 77.5358,
      accuracy: 15,
      isFallback: true
    });
  };

  const handleOfflineSimulatedMode = () => {
    onAuthorizeLocation({
      lat: 12.9352,
      lng: 77.5358,
      accuracy: 15,
      badgeId: badgeId || "BLR-OPS-892",
      isFallback: true,
      isOfflineSimulated: true
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-floating border border-slate-100 flex flex-col text-slate-900 relative">
        {/* Top Crimson Accent Line */}
        <div className="absolute top-0 left-8 right-8 h-1 bg-[#EA3B52] rounded-b-full" />

        {/* Stage 1: Authority Credential / Badge Login */}
        {stage === 'badge' && (
          <div>
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 mb-4 flex-shrink-0">
              <img src="/logo.png" alt="Jagrath Logo" className="w-full h-full object-cover" />
            </div>

            <h2 className="text-[24px] font-normal tracking-tight text-slate-900">
              Authority Command Desk
            </h2>
            <p className="text-[14px] text-slate-500 font-normal mt-1 leading-relaxed">
              Authorized surveillance, regional ambulance dispatch, and accident analytics portal.
            </p>

            {loginError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleBadgeSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                  Officer Badge / Agency ID
                </label>
                <div className="relative flex items-center">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="e.g. BLR-OPS-892"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#EA3B52]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
                  Officer Password / Station PIN
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter station access password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3 py-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#EA3B52]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 disabled:opacity-60"
                >
                  <span>Authenticate & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {loginError && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleOfflineSimulatedMode}
                    className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    Continue in Simulated Offline Mode
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Stage 2: Mandatory Geolocation Permission Grant */}
        {stage === 'geo' && (
          <div className="text-center py-2">
            <div className="relative w-16 h-16 rounded-full bg-rose-50 text-[#EA3B52] flex items-center justify-center mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-[#EA3B52] animate-ping opacity-30" />
              <MapPin className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              Grant Location Permission
            </h3>
            <p className="text-xs text-slate-500 mt-2 max-w-[320px] mx-auto leading-relaxed">
              Jagrath requires your device GPS to anchor regional surveillance, calculate ambulance dispatch radii, and evaluate local collision hotspots.
            </p>

            {geoError && (
              <p className="text-[11px] text-amber-600 font-medium bg-amber-50 p-2 rounded-xl mt-3 border border-amber-200">
                {geoError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleRequestLocation}
                disabled={isLocating || isLoading}
                className="w-full py-3.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 disabled:opacity-60"
              >
                <Navigation className={`w-4 h-4 ${isLocating || isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Verifying with Command Server...' : (isLocating ? 'Acquiring GPS Fix...' : 'Grant Device GPS & Connect')}</span>
              </button>

              <button
                type="button"
                onClick={handleUseStationCoords}
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-semibold border border-slate-200 transition-colors disabled:opacity-60"
              >
                Use Station Coords (Bengaluru South)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
