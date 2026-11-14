import React, { useState, useEffect, useRef } from 'react';
import MobileFrame from './components/MobileFrame';
import HomeScreen from './components/HomeScreen';
import AmbulanceOnTheWayScreen from './components/AmbulanceOnTheWayScreen';
import MapTrackingView from './components/MapTrackingView';
import CancelWindowModal from './components/CancelWindowModal';
import SafetyPinModal from './components/SafetyPinModal';
import AuditTimelineModal from './components/AuditTimelineModal';
import RespondersModal from './components/RespondersModal';
import AdminSettingsModal from './components/AdminSettingsModal';
import InstructionModal from './components/InstructionModal';
import CommandCenterView from './components/AdminCommandCenterView';

import { CURRENT_USER, VERIFIED_RESPONDERS, TRUSTED_CONTACTS, MAP_CONFIG } from './constants/initialData';
import { createIncidentBlock, verifyChainIntegrity, GENESIS_HASH } from './services/cryptoLedger';
import { rankResponders } from './services/responderMatcher';
import { runAITriage } from './services/aiTriage';

export default function App() {
  // Mobile Screen State: 'home' | 'dispatched' | 'map'
  const [screen, setScreen] = useState('home');
  const [appMode, setAppMode] = useState('user'); // 'user' | 'admin'

  // Modals
  const [showCancelWindow, setShowCancelWindow] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showRespondersModal, setShowRespondersModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);

  // Active Incident State
  const [incidentId, setIncidentId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("medical");
  const [escalationStep, setEscalationStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDuressEscalated, setIsDuressEscalated] = useState(false);
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

  // Initialize Genesis Block on load
  useEffect(() => {
    async function initLedger() {
      const genesis = await createIncidentBlock({
        index: 0,
        prevHash: GENESIS_HASH,
        timestamp: new Date().toISOString(),
        actorId: "system_genesis",
        actorRole: "system",
        eventType: "PLATFORM_INIT",
        payload: {
          platform: "RakshaChain v2.0",
          node: "BMSCE_DSCE_CAMPUS_NODE",
          compliance: "ERSS 2.0 / MHA Aligned"
        }
      });
      setHashChain([genesis]);
      cleanBackupChainRef.current = [genesis];
    }
    initLedger();
  }, []);

  // Timer for elapsed incident duration
  useEffect(() => {
    let interval = null;
    if (screen === 'dispatched' || screen === 'map') {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [screen]);

  // Append new event block to hash chain
  const appendAuditBlock = async (eventType, actorRole, actorId, payload) => {
    setHashChain(prevChain => {
      const lastBlock = prevChain[prevChain.length - 1];
      const prevHash = lastBlock ? lastBlock.hash : GENESIS_HASH;
      const index = prevChain.length;

      // Note: async block creation wrapped synchronously in state update
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

  // Step 1: User hits SOS -> 5s cancel window begins
  const handleTriggerSOS = () => {
    setShowCancelWindow(true);
  };

  // Step 2: 5s cancel window aborted by user
  const handleAbortCancelWindow = async () => {
    setShowCancelWindow(false);
    await appendAuditBlock(
      "FALSE_ALARM",
      "citizen",
      CURRENT_USER.id,
      { reason: "User cancelled inside 5-second buffer window", address: CURRENT_USER.address }
    );
    showToast("Incident aborted locally. No contacts alerted.");
  };

  // Step 3: Emergency confirmed (or instant bypass)
  const handleConfirmDispatch = async (noteText) => {
    setShowCancelWindow(false);
    const newIncId = `INC-${Date.now().toString().slice(-6)}`;
    setIncidentId(newIncId);
    setEscalationStep(1);
    setScreen('dispatched'); // Transition to Screen 2 in screenshot

    // 1. Run AI triage on note/context
    const triageResult = await runAITriage(noteText || selectedCategory);

    // 2. Rank responders according to explainability math
    const ranked = rankResponders(
      { lat: MAP_CONFIG.userPos[0], lng: MAP_CONFIG.userPos[1] },
      triageResult.category,
      VERIFIED_RESPONDERS
    );
    setResponders(ranked);
    setActiveResponder(ranked[0]);

    // 3. Log genesis of this incident in hash chain
    await appendAuditBlock(
      "TRIGGERED",
      "citizen",
      CURRENT_USER.id,
      {
        incidentId: newIncId,
        coords: MAP_CONFIG.userPos,
        mode: "HOLD_SOS_2S",
        triage: triageResult
      }
    );

    // 4. Start Escalation State Machine (ladder progression)
    startEscalationLadder(newIncId);
  };

  // Escalation Ladder State Machine (Step 1 -> Step 2 -> Step 3 ...)
  const startEscalationLadder = (incId) => {
    if (escalationTimerRef.current) clearInterval(escalationTimerRef.current);

    // T+3s: Step 1 -> Contact 1 notified
    escalationTimerRef.current = setTimeout(async () => {
      setEscalationStep(2);
      await appendAuditBlock(
        "LADDER_STEP_1",
        "system",
        "escalation_engine",
        {
          contact: TRUSTED_CONTACTS[0].name,
          priority: 1,
          channel: "SMS_PUSH_CRITICAL"
        }
      );
      showToast(`Step 1: SMS & Push Alarm sent to ${TRUSTED_CONTACTS[0].name}`);

      // T+7s: Step 2 -> Contact 2 & Circle notified
      escalationTimerRef.current = setTimeout(async () => {
        setEscalationStep(3);
        await appendAuditBlock(
          "LADDER_STEP_2",
          "system",
          "escalation_engine",
          {
            contact: TRUSTED_CONTACTS[1].name,
            priority: 2,
            channel: "VOICE_BRIDGE_SMS"
          }
        );
        showToast(`Step 2: Escalated to ${TRUSTED_CONTACTS[1].name}`);

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
          showToast(`Step 3: 1st Responder (${VERIFIED_RESPONDERS[0].name}) assigned and en route!`);
        }, 4000);
      }, 4000);
    }, 3000);
  };

  // Toast notification helper
  const showToast = (msg) => {
    setNotificationBanner(msg);
    setTimeout(() => {
      setNotificationBanner(null);
    }, 4500);
  };

  // Handle PIN Resolution: Normal vs Duress
  const handleResolveNormal = async () => {
    setShowPinModal(false);
    if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);

    await appendAuditBlock(
      "RESOLVED_SAFE",
      "citizen",
      CURRENT_USER.id,
      {
        incidentId,
        verificationMethod: "SAFETY_PIN_VERIFIED",
        status: "RESOLVED"
      }
    );

    setScreen('home');
    setEscalationStep(0);
    setIsDuressEscalated(false);
    showToast("Incident verified safe and resolved. Audit chain finalized.");
  };

  const handleResolveDuress = async () => {
    setShowPinModal(false);
    // Silent duress: UI returns home to deceive attacker, but covert tracking continues!
    setIsDuressEscalated(true);
    setScreen('home');

    await appendAuditBlock(
      "DURESS_ESCALATION",
      "citizen",
      CURRENT_USER.id,
      {
        incidentId,
        duressCodeUsed: true,
        action: "COVERT_ADMIN_ALERT",
        policeDispatchRequested: true,
        severity: 5
      }
    );

    showToast("Alert closed locally. (Duress protocol silently broadcasting to Admin Command Center)");
  };

  // Cryptographic Tampering Simulation for Judges
  const handleTamperBlock = () => {
    if (hashChain.length < 2) return;
    // Modify block 1's payload without updating its cryptographic hash
    const tamperedChain = hashChain.map((block, idx) => {
      if (idx === 1) {
        return {
          ...block,
          tampered: true,
          payload: { ...block.payload, unauthorized_override: "HACKED_BY_ATTACKER_IN_DB", severity: 1 }
        };
      }
      return block;
    });

    setHashChain(tamperedChain);
    setIsChainTampered(true);
    showToast("Database Row #1 payload modified directly in memory! Click 'Verify Chain Integrity' to detect.");
  };

  const handleRestoreChain = () => {
    setHashChain(cleanBackupChainRef.current);
    setIsChainTampered(false);
    showToast("Original cryptographic chain restored.");
  };

  // Direct 112 Voice Dialing Stub
  const handleDial112 = async () => {
    await appendAuditBlock(
      "112_ERSS_HANDOFF",
      "citizen",
      CURRENT_USER.id,
      {
        incidentId,
        dialedNumber: "112",
        dispatchedTelemetry: {
          lat: MAP_CONFIG.userPos[0],
          lng: MAP_CONFIG.userPos[1],
          user: CURRENT_USER.name,
          phone: CURRENT_USER.phone
        }
      }
    );
    alert("ERSS 112 Statutory Handoff: Dialing 112 India with verified GPS and incident payload...");
  };

  return (
    <div className="w-full min-h-screen bg-slate-200 flex flex-col items-center justify-center p-2 sm:p-6 font-sans">
      {/* Top Floating App Bar (Desktop View Controls & Demo Badges) */}
      <header className="w-full max-w-4xl mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-300/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold text-slate-800 text-sm">
            RakshaChain
          </span>
          <span className="text-slate-400">·</span>
          <span className="font-medium text-slate-600 hidden sm:inline">
            Build Beyond'26 (PS 3.1)
          </span>
        </div>

        {/* Screen / View Quick Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setScreen('home')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              screen === 'home' && appMode === 'user' ? 'bg-[#EA3B52] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Home
          </button>
          <button
            onClick={() => setScreen('dispatched')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              screen === 'dispatched' && appMode === 'user' ? 'bg-[#EA3B52] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Ambulance Rushing
          </button>
          <button
            onClick={() => setScreen('map')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              screen === 'map' && appMode === 'user' ? 'bg-[#EA3B52] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Live Map
          </button>
          <button
            onClick={() => setAppMode(appMode === 'user' ? 'admin' : 'user')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              appMode === 'admin' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin Desk
          </button>
        </div>

        {/* Audit Chain Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Audit Ledger ({hashChain.length})
          </button>
        </div>
      </header>

      {/* Realtime Toast Banner */}
      {notificationBanner && (
        <div className="fixed top-20 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* Main Container */}
      {appMode === 'admin' ? (
        <div className="w-full max-w-5xl h-[780px]">
          <CommandCenterView
            onSwitchToCitizen={() => setAppMode('user')}
            incidents={[
              {
                id: incidentId || 'INC-892401',
                user_name: CURRENT_USER.name,
                address: CURRENT_USER.address,
                status: screen === 'home' ? 'STANDBY' : 'ACTIVE_DISPATCH',
                severity: isDuressEscalated ? 5 : 4,
                escalation_step: escalationStep
              }
            ]}
            chain={hashChain}
            onVerifyChain={() => setShowAuditModal(true)}
            onTamperChain={handleTamperBlock}
          />
        </div>
      ) : (
        /* The Exact Mobile Frame Matching the Screenshot */
        <MobileFrame isDarkBar={screen === 'dispatched'}>
          {screen === 'home' && (
            <HomeScreen
              onTriggerSOS={handleTriggerSOS}
              onOpenAudit={() => setShowAuditModal(true)}
              onOpenResponders={() => setShowRespondersModal(true)}
              onOpenSettings={() => setShowAdminModal(true)}
              onStartSafeWalk={() => {
                showToast("Safe Walk Initiated: Geofencing active for night commute.");
              }}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              activeTab="home"
            />
          )}

          {screen === 'dispatched' && (
            <AmbulanceOnTheWayScreen
              onBack={() => setScreen('home')}
              onSeeMap={() => setScreen('map')}
              onCancelRequest={() => setShowPinModal(true)}
              escalationStep={escalationStep || 3}
              elapsedSeconds={elapsedSeconds || 42}
            />
          )}

          {screen === 'map' && (
            <MapTrackingView
              onBack={() => setScreen('dispatched')}
              onOpenInstruction={() => setShowInstructionModal(true)}
              currentResponder={activeResponder}
              onCall={(resp) => alert(`Calling ${resp.name} (${resp.phone})...`)}
              onMessage={(resp) => alert(`Opening secure messaging channel with ${resp.name}...`)}
            />
          )}

          {/* Cancel Window Buffer Modal */}
          {showCancelWindow && (
            <CancelWindowModal
              onConfirmDispatch={handleConfirmDispatch}
              onAbort={handleAbortCancelWindow}
              initialSeconds={5}
            />
          )}

          {/* Safety PIN Modal */}
          {showPinModal && (
            <SafetyPinModal
              onResolveNormal={handleResolveNormal}
              onResolveDuress={handleResolveDuress}
              onClose={() => setShowPinModal(false)}
            />
          )}

          {/* Audit Chain Modal */}
          {showAuditModal && (
            <AuditTimelineModal
              chain={hashChain}
              onClose={() => setShowAuditModal(false)}
              onTamperBlock={handleTamperBlock}
              onRestoreChain={handleRestoreChain}
              isTampered={isChainTampered}
            />
          )}

          {/* Responders Matching Modal */}
          {showRespondersModal && (
            <RespondersModal
              responders={responders}
              onClose={() => setShowRespondersModal(false)}
              onSelectResponder={(resp) => {
                setActiveResponder(resp);
                setShowRespondersModal(false);
                showToast(`Assigned ${resp.name} as active first responder.`);
              }}
              selectedResponderId={activeResponder?.id}
            />
          )}

          {/* Admin & Simulation Controls Modal */}
          {showAdminModal && (
            <AdminSettingsModal
              onClose={() => setShowAdminModal(false)}
              activeMode={appMode}
              onChangeMode={(m) => {
                setAppMode(m);
                setShowAdminModal(false);
              }}
            />
          )}

          {/* Instruction & First Aid Modal */}
          {showInstructionModal && (
            <InstructionModal
              onClose={() => setShowInstructionModal(false)}
              category={selectedCategory}
              onDial112={handleDial112}
            />
          )}
        </MobileFrame>
      )}
    </div>
  );
}
