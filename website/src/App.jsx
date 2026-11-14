import React, { useState } from 'react';
import AuthorityDashboard from './components/authority/AuthorityDashboard';
import AuthorityLoginModal from './components/authority/AuthorityLoginModal';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const [authorityCoords, setAuthorityCoords] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleAuthorizeLocation = (coords) => {
    setAuthorityCoords(coords);
    setIsAuthorized(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] text-slate-900 font-sans antialiased select-none">
      {/* If officer hasn't authenticated or granted GPS permission, show authority access modal */}
      {!isAuthorized ? (
        <AuthorityLoginModal
          onAuthorizeLocation={handleAuthorizeLocation}
          onClose={() => {
            // Default to Bengaluru South Command Station if modal is dismissed
            setAuthorityCoords({ lat: 12.9352, lng: 77.5358, badgeId: "BLR-OPS-892" });
            setIsAuthorized(true);
          }}
        />
      ) : (
        <ErrorBoundary>
          <AuthorityDashboard
            authorityCoords={authorityCoords}
            onReauthenticate={() => setIsAuthorized(false)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
