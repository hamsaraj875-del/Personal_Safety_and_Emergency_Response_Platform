import React, { useState, useEffect, useRef } from 'react';
import MobileFrame from './components/MobileFrame';
import SplashLanding from './components/SplashLanding';
import IntroBrief from './components/IntroBrief';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import ActivityScreen from './components/ActivityScreen';
import ContactsScreen from './components/ContactsScreen';
import ProfileScreen from './components/ProfileScreen';
import AmbulanceOnTheWayScreen from './components/AmbulanceOnTheWayScreen';
import MapTrackingView from './components/MapTrackingView';
import CancelWindowModal from './components/CancelWindowModal';
import SafetyPinModal from './components/SafetyPinModal';
import InstructionModal from './components/InstructionModal';
import LocationPermissionModal from './components/LocationPermissionModal';

// Authority Modules
import AuthorityDashboard from './components/authority/AuthorityDashboard';
import AuthorityLoginModal from './components/authority/AuthorityLoginModal';

import { VERIFIED_RESPONDERS, MAP_CONFIG, getNearbyResponders } from './constants/initialData';
import { createIncidentBlock, verifyChainIntegrity, GENESIS_HASH } from './services/cryptoLedger';
import { rankResponders } from './services/responderMatcher';
import { runAITriage } from './services/aiTriage';
import { getActiveSession, saveUser, clearActiveSession } from './services/storage';
import { requestLocationPermission, getCurrentDeviceLocation, reverseGeocodeCoords } from './services/locationService';

export default function App() {
  // Top-Level View Mode: 'citizen' | 'authority'
  const [viewMode, setViewMode] = useState('citizen');
  const [showAuthorityLogin, setShowAuthorityLogin] = useState(false);
  const [authorityCoords, setAuthorityCoords] = useState(null);

  // App Stage in Citizen View: 'splash' -> 'intro' -> 'login' -> 'main'
  const [appStage, setAppStage] = useState('splash');

  // Full Screen Tabs: 'home' | 'activity' | 'contacts' | 'profile'
  const [activeTab, setActiveTab] = useState('home');

  // Emergency States: 'idle' | 'dispatched' | 'map'
  const [emergencyScreen, setEmergencyScreen] = useState('idle');

  // Modals
  const [showCancelWindow, setShowCancelWindow] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Active User Profile & Custom Contacts
  const [userProfile, setUserProfile] = useState({
    name: "",
    address: "",
    phone: "",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80"
  });
  const [userContacts, setUserContacts] = useState([]);

  // Live GPS Coordinates
  const [userCoords, setUserCoords] = useState({
    lat: MAP_CONFIG.userPos[0],
    lng: MAP_CONFIG.userPos[1]
  });
  const [isLocating, setIsLocating] = useState(false);

  // Device GPS Location Permission & Sync Handler
  const handleRefreshLocation = async () => {
    setIsLocating(true);
    try {
      const perm = await requestLocationPermission();
      if (!perm.granted) {
        showToast(perm.error || "Location access was denied. Please allow GPS.");
        setIsLocating(false);
        return;
      }
      const coords = await getCurrentDeviceLocation();
      const newPos = { lat: coords.lat, lng: coords.lng };
      setUserCoords(newPos);
      const localResps = getNearbyResponders(newPos);
      setResponders(localResps);
      setActiveResponder(localResps[0]);
      const addr = await reverseGeocodeCoords(coords.lat, coords.lng);
      setUserProfile(prev => ({
        ...prev,
        address: addr
      }));
      showToast("Live GPS location synced successfully!");
    } catch (err) {
      console.error("GPS Sync failed:", err);
      showToast("Could not fetch device GPS. Check location settings.");
    } finally {
      setIsLocating(false);
    }
  };
  // Active Incident State
  const [incidentId, setIncidentId] = useState(null);
  const [escalationStep, setEscalationStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notificationBanner, setNotificationBanner] = useState(null);

  // Cryptographic Ledger (Hash Chain)
  const [hashChain, setHashChain] = useState([]);
  const [isChainTampered, setIsChainTampered] = useState(false);
  const cleanBackupChainRef = useRef([]);

  // Responders
  const [responders, setResponders] = useState(VERIFIED_RESPONDERS);
  const [activeResponder, setActiveResponder] = useState(VERIFIED_RESPONDERS[0]);

  // Escalation timer reference
  const escalationTimerRef = useRef(null);

  // Check saved session & initialize Genesis Block
  useEffect(() => {
    async function initLedgerAndSession() {
      // 1. Genesis Block
      const genesis = await createIncidentBlock({
        index: 0,
        prevHash: GENESIS_HASH,
        timestamp: new Date().toISOString(),
        actorId: "system_genesis",
        actorRole: "system",
        eventType: "PLATFORM_INIT",
        payload: {
          platform: "Jagrath Safety Network",
          device: "Citizen Mobile Node",
          status: "PROTECTED_READY"
        }
      });
      setHashChain([genesis]);
      cleanBackupChainRef.current = [genesis];

      // 2. Check existing saved user session
      const saved = getActiveSession();
      if (saved) {
        setUserProfile(saved);
        setUserContacts(saved.contacts || []);
      }
    }
    initLedgerAndSession();
  }, []);

  // Timer for elapsed incident duration
  useEffect(() => {
    let interval = null;
    if (emergencyScreen === 'dispatched' || emergencyScreen === 'map') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [emergencyScreen]);

  // Append new event block to hash chain
  const appendAuditBlock = async (eventType, actorRole, actorId, payload) => {
    setHashChain(prevChain => {
      const lastBlock = prevChain[prevChain.length - 1];
      const prevHash = lastBlock ? lastBlock.hash : GENESIS_HASH;
      const index = prevChain.length;

      createIncidentBlock({
        index,
        prevHash,
        timestamp: new Date().toISOString(),
        actorId,
        actorRole,
        eventType,
        payload
      }).then(newBlock => {
        setHashChain(current => {
          const updated = [...current, newBlock];
          cleanBackupChainRef.current = updated;
          return updated;
        });
      });

      return prevChain;
    });
  };

  // Login handler
  const handleLoginSuccess = (formData) => {
    const updated = {
      ...userProfile,
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      contacts: formData.contacts || userContacts
    };
    setUserProfile(updated);
    setUserContacts(updated.contacts || []);
    saveUser(updated);

    setAppStage('main');
    showToast(`Welcome, ${formData.name}! Your emergency network is active.`);
  };

  // Add Contact handler
  const handleAddContact = (newContact) => {
    const updatedList = [...userContacts, newContact];
    setUserContacts(updatedList);
    const updatedUser = { ...userProfile, contacts: updatedList };
    setUserProfile(updatedUser);
    saveUser(updatedUser);
    showToast(`Added ${newContact.name} to your trusted emergency circle.`);
  };

  // Delete Contact handler
  const handleDeleteContact = (id) => {
    const updatedList = userContacts.filter(c => c.id !== id);
    setUserContacts(updatedList);
    const updatedUser = { ...userProfile, contacts: updatedList };
    setUserProfile(updatedUser);
    saveUser(updatedUser);
    showToast("Contact removed.");
  };

  // Logout handler
  const handleLogout = () => {
    clearActiveSession();
    setAppStage('login');
    setActiveTab('home');
    setEmergencyScreen('idle');
    showToast("Logged out successfully.");
  };

  // Step 1: User triggers SOS -> 5s cancel window begins
  const handleTriggerSOS = () => {
    setShowCancelWindow(true);
  };

  // Step 2: 5s cancel window aborted by user
  const handleAbortCancelWindow = async () => {
    setShowCancelWindow(false);
    await appendAuditBlock(
      "FALSE_ALARM",
      "citizen",
      userProfile.name || "citizen",
      { reason: "Cancelled in buffer window", address: userProfile.address }
    );
    showToast("Alert cancelled. No contacts alerted.");
  };

  // Step 3: Emergency confirmed
  const handleConfirmDispatch = async (noteText) => {
    setShowCancelWindow(false);
    const newIncId = `INC-${Date.now().toString().slice(-6)}`;
    setIncidentId(newIncId);
    setEscalationStep(1);
    setEmergencyScreen('dispatched');

    // AI triage & responder matching
    const triageResult = await runAITriage(noteText || "general distress");
    const ranked = rankResponders(
      { lat: MAP_CONFIG.userPos[0], lng: MAP_CONFIG.userPos[1] },
      triageResult.category,
      VERIFIED_RESPONDERS
    );
    setResponders(ranked);
    setActiveResponder(ranked[0]);

    // Record in ledger
    await appendAuditBlock(
      "TRIGGERED",
      "citizen",
      userProfile.name || "citizen",
      {
        incidentId: newIncId,
        coords: MAP_CONFIG.userPos,
        mode: "HOLD_SOS_2S",
        triage: triageResult
      }
    );

    // Start Escalation State Machine
    startEscalationLadder(newIncId);
  };

  // Escalation Ladder
  const startEscalationLadder = (incId) => {
    if (escalationTimerRef.current) clearInterval(escalationTimerRef.current);

    const contact1Name = userContacts[0]?.name || "Primary Contact";
    const contact2Name = userContacts[1]?.name || "Secondary Contact";

    // T+3s: Step 1 -> Contact 1 notified
    escalationTimerRef.current = setTimeout(async () => {
      setEscalationStep(2);
      await appendAuditBlock(
        "LADDER_STEP_1",
        "system",
        "escalation_engine",
        {
          contact: contact1Name,
          priority: 1,
          channel: "SMS_PUSH_CRITICAL"
        }
      );
      showToast(`Step 1: Emergency alert sent to ${contact1Name}`);

      // T+7s: Step 2 -> Contact 2 notified
      escalationTimerRef.current = setTimeout(async () => {
        setEscalationStep(3);
        await appendAuditBlock(
          "LADDER_STEP_2",
          "system",
          "escalation_engine",
          {
            contact: contact2Name,
            priority: 2,
            channel: "VOICE_BRIDGE_SMS"
          }
        );
        showToast(`Step 2: Backup alert sent to ${contact2Name}`);

        // T+11s: Step 3 -> 1st Responder Dispatched (Emily Dayton)
        escalationTimerRef.current = setTimeout(async () => {
          setEscalationStep(4);
          await appendAuditBlock(
            "RESPONDER_ASSIGNED",
            "matching_engine",
            "dispatch_service",
            {
              responderId: VERIFIED_RESPONDERS[0].id,
              name: VERIFIED_RESPONDERS[0].name,
              score: VERIFIED_RESPONDERS[0].score,
              eta: "5 mins"
            }
          );
          showToast(`Step 3: ${VERIFIED_RESPONDERS[0].name} (First Responder) is on the way!`);
        }, 4000);
      }, 4000);
    }, 3000);
  };

  // Toast notification helper
  const showToast = (msg) => {
    setNotificationBanner(msg);
    setTimeout(() => {
      setNotificationBanner(null);
    }, 4000);
  };

  // Normal vs Duress PIN Resolution
  const handleResolveNormal = async () => {
    setShowPinModal(false);
    if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);

    await appendAuditBlock(
      "RESOLVED_SAFE",
      "citizen",
      userProfile.name || "citizen",
      {
        incidentId,
        verificationMethod: "SAFETY_PIN_VERIFIED",
        status: "RESOLVED"
      }
    );

    setEmergencyScreen('idle');
    setActiveTab('home');
    setEscalationStep(0);
    showToast("Incident confirmed safe and resolved.");
  };

  const handleResolveDuress = async () => {
    setShowPinModal(false);
    setEmergencyScreen('idle');
    setActiveTab('home');

    await appendAuditBlock(
      "DURESS_ESCALATION",
      "citizen",
      userProfile.name || "citizen",
      {
        incidentId,
        duressCodeUsed: true,
        action: "COVERT_SECURITY_ALERT",
        severity: 5
      }
    );

    showToast("Alert ended locally. (Silent alert sent to emergency services)");
  };

  // Tamper simulation for judges
  const handleTamperBlock = () => {
    if (hashChain.length < 2) return;
    const tamperedChain = hashChain.map((block, idx) => {
      if (idx === 1) {
        return {
          ...block,
          tampered: true,
          payload: { ...block.payload, unauthorized_edit: "MODIFIED_RECORD" }
        };
      }
      return block;
    });

    setHashChain(tamperedChain);
    setIsChainTampered(true);
    showToast("Simulated record edit in database. Tap 'Check Record Integrity' to verify.");
  };

  const handleRestoreChain = () => {
    setHashChain(cleanBackupChainRef.current);
    setIsChainTampered(false);
    showToast("Original verified records restored.");
  };

  const handleDial112 = async () => {
    await appendAuditBlock(
      "112_ERSS_HANDOFF",
      "citizen",
      userProfile.name || "citizen",
      {
        incidentId,
        dialedNumber: "112",
        coords: MAP_CONFIG.userPos
      }
    );
    alert("Emergency Service (112): Connecting to official emergency dispatch with live location...");
  };

  // Switch to Authority Command Deck
  const handleOpenAuthorityDeck = () => {
    if (!authorityCoords) {
      setShowAuthorityLogin(true);
    } else {
      setViewMode('authority');
    }
  };

  const handleAuthorizeAuthorityLocation = (coords) => {
    setAuthorityCoords(coords);
    setShowAuthorityLogin(false);
    setViewMode('authority');
  };

  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] text-slate-900 flex flex-col font-sans antialiased select-none">
      {/* 1. AUTHORITY DASHBOARD FULL SCREEN VIEW */}
      {viewMode === 'authority' ? (
        <AuthorityDashboard
          onSwitchToCitizen={() => setViewMode('citizen')}
          authorityCoords={authorityCoords}
        />
      ) : (
        /* 2. CITIZEN MOBILE APP VIEW (MATCHING THE EXACT SCREENSHOT AESTHETIC) */
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-3 sm:p-6">
          {/* Top Demo Helper Bar */}
          <div className="w-full max-w-[390px] mb-3 flex items-center justify-between px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md overflow-hidden shadow-2xs border border-slate-100 flex-shrink-0">
                <img src="/logo.png" alt="Jagrath Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-slate-800 text-[11px]">Jagrath Mobile</span>
            </div>

            {/* Quick Actions / Mode Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleOpenAuthorityDeck}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all flex items-center gap-1"
              >
                <span>Authority Command</span>
              </button>
            </div>
          </div>

          {/* Realtime Toast Banner */}
          {notificationBanner && (
            <div className="fixed top-4 z-[9999] bg-white text-slate-800 px-4 py-2.5 rounded-2xl shadow-floating border border-slate-200 text-xs font-semibold flex items-center gap-2 animate-bounce">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{notificationBanner}</span>
            </div>
          )}

          {/* Mobile Viewport Frame */}
          <MobileFrame isDarkBar={appStage === 'splash' || emergencyScreen === 'dispatched'}>
            {/* Stage 1: Letter-by-Letter Animated Splash Page */}
            {appStage === 'splash' && (
              <SplashLanding onComplete={() => setAppStage('intro')} />
            )}

            {/* Stage 2: Brief 1-2s Intro Mission Card */}
            {appStage === 'intro' && (
              <IntroBrief onComplete={() => setAppStage('login')} />
            )}

            {/* Stage 3: Login Page (Clean, Empty Inputs, On-Screen OTP) */}
            {appStage === 'login' && (
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            )}

            {/* Stage 4: Main Application & Emergency Modes */}
            {appStage === 'main' && (
              <>
                {/* If Emergency Dispatched (Left Screen in Screenshot) */}
                {emergencyScreen === 'dispatched' && (
                  <AmbulanceOnTheWayScreen
                    onBack={() => setEmergencyScreen('idle')}
                    onSeeMap={() => setEmergencyScreen('map')}
                    onCancelRequest={() => setShowPinModal(true)}
                    escalationStep={escalationStep || 4}
                    elapsedSeconds={elapsedSeconds || 42}
                    userCoords={userCoords}
                    onUpdateUserCoords={setUserCoords}
                    activeResponder={activeResponder}
                    onCall={(resp) => alert(`Calling ${resp.name} (${resp.phone})...`)}
                    onRequestLocationPermission={() => setShowLocationModal(true)}
                  />
                )}

                {/* If Emergency Map Tracking (Right Screen in Screenshot) */}
                {emergencyScreen === 'map' && (
                  <MapTrackingView
                    onBack={() => setEmergencyScreen('dispatched')}
                    onOpenInstruction={() => setShowInstructionModal(true)}
                    currentResponder={activeResponder}
                    userCoords={userCoords}
                    onUpdateUserCoords={setUserCoords}
                    onCall={(resp) => alert(`Calling ${resp.name} (${resp.phone})...`)}
                    onMessage={(resp) => alert(`Opening secure messaging with ${resp.name}...`)}
                  />
                )}

                {/* If Normal Idle State: Switch between 4 Full Screen Native Interfaces */}
                {emergencyScreen === 'idle' && (
                  <>
                    {/* Tab 1: Home (Center Screen in Screenshot) */}
                    {activeTab === 'home' && (
                      <HomeScreen
                        onTriggerSOS={handleTriggerSOS}
                        activeTab={activeTab}
                        onSelectTab={(t) => setActiveTab(t)}
                        userProfile={userProfile}
                      />
                    )}

                    {/* Tab 2: Activity & Safety Record (Full Screen) */}
                    {activeTab === 'activity' && (
                      <ActivityScreen
                        chain={hashChain}
                        onTamperBlock={handleTamperBlock}
                        onRestoreChain={handleRestoreChain}
                        isTampered={isChainTampered}
                        activeTab={activeTab}
                        onSelectTab={(t) => setActiveTab(t)}
                      />
                    )}

                    {/* Tab 3: Contacts & Helpers (Full Screen, Dynamic User Input) */}
                    {activeTab === 'contacts' && (
                      <ContactsScreen
                        contacts={userContacts}
                        onAddContact={handleAddContact}
                        onDeleteContact={handleDeleteContact}
                        responders={responders}
                        selectedResponderId={activeResponder?.id}
                        onSelectResponder={(resp) => {
                          setActiveResponder(resp);
                          showToast(`Selected ${resp.name} as primary helper.`);
                        }}
                        activeTab={activeTab}
                        onSelectTab={(t) => setActiveTab(t)}
                      />
                    )}

                    {/* Tab 4: Minimalist Standard Settings (Full Screen) */}
                    {activeTab === 'profile' && (
                      <ProfileScreen
                        activeTab={activeTab}
                        onSelectTab={(t) => setActiveTab(t)}
                        onStartSafeWalk={() => {
                          showToast("Night Safe Walk activated. Your commute is now being protected.");
                        }}
                        userProfile={userProfile}
                        onLogout={handleLogout}
                      />
                    )}
                  </>
                )}

                {/* Emergency Modals */}
                {showCancelWindow && (
                  <CancelWindowModal
                    onConfirmDispatch={handleConfirmDispatch}
                    onAbort={handleAbortCancelWindow}
                    initialSeconds={5}
                  />
                )}

                {showPinModal && (
                  <SafetyPinModal
                    onResolveNormal={handleResolveNormal}
                    onResolveDuress={handleResolveDuress}
                    onClose={() => setShowPinModal(false)}
                  />
                )}

                {showInstructionModal && (
                  <InstructionModal
                    onClose={() => setShowInstructionModal(false)}
                    onDial112={handleDial112}
                  />
                )}

                {showLocationModal && (
                  <LocationPermissionModal
                    onAllow={async () => {
                      setShowLocationModal(false);
                      await handleRefreshLocation();
                    }}
                    onDismiss={() => setShowLocationModal(false)}
                  />
                )}
              </>
            )}
          </MobileFrame>

          {/* Authority Login & GPS Permission Modal */}
          {showAuthorityLogin && (
            <AuthorityLoginModal
              onAuthorizeLocation={handleAuthorizeAuthorityLocation}
              onClose={() => setShowAuthorityLogin(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
