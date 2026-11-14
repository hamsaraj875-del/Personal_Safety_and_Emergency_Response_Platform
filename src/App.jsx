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

import { CURRENT_USER, VERIFIED_RESPONDERS, TRUSTED_CONTACTS, MAP_CONFIG } from './constants/initialData';
import { createIncidentBlock, verifyChainIntegrity, GENESIS_HASH } from './services/cryptoLedger';
import { rankResponders } from './services/responderMatcher';
import { runAITriage } from './services/aiTriage';

export default function App() {
  // Mobile Screen Navigation: 'home' | 'dispatched' | 'map'
  const [screen, setScreen] = useState('home');

  // Modals (all redesigned with clean white theme & simple language)
  const [showCancelWindow, setShowCancelWindow] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showRespondersModal, setShowRespondersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);

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
          platform: "RakshaChain",
          device: "Citizen Mobile Node",
          status: "PROTECTED_READY"
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
      CURRENT_USER.id,
      { reason: "Cancelled in buffer window", address: CURRENT_USER.address }
    );
    showToast("Alert cancelled. No contacts alerted.");
  };

  // Step 3: Emergency confirmed (or instant bypass)
  const handleConfirmDispatch = async (noteText) => {
    setShowCancelWindow(false);
    const newIncId = `INC-${Date.now().toString().slice(-6)}`;
    setIncidentId(newIncId);
    setEscalationStep(1);
    setScreen('dispatched'); // Transition to Screen 2 in screenshot

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
      CURRENT_USER.id,
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
      showToast(`Step 1: Emergency alert sent to ${TRUSTED_CONTACTS[0].name}`);

      // T+7s: Step 2 -> Contact 2 notified
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
        showToast(`Step 2: Backup alert sent to ${TRUSTED_CONTACTS[1].name}`);

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
      CURRENT_USER.id,
      {
        incidentId,
        verificationMethod: "SAFETY_PIN_VERIFIED",
        status: "RESOLVED"
      }
    );

    setScreen('home');
    setEscalationStep(0);
    showToast("Incident confirmed safe and resolved.");
  };

  const handleResolveDuress = async () => {
    setShowPinModal(false);
    setScreen('home');

    await appendAuditBlock(
      "DURESS_ESCALATION",
      "citizen",
      CURRENT_USER.id,
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
      CURRENT_USER.id,
      {
        incidentId,
        dialedNumber: "112",
        coords: MAP_CONFIG.userPos
      }
    );
    alert("Emergency Service (112): Connecting to official emergency dispatch with live location...");
  };

  return (
    <div className="w-full min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-3 sm:p-6 font-sans antialiased select-none">
      {/* Clean Demo Screen Switcher Bar (Light, Minimal, Non-Intrusive) */}
      <div className="w-full max-w-[390px] mb-3 flex items-center justify-between px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EA3B52] animate-pulse" />
          <span className="font-bold text-slate-800 text-[11px]">RakshaChain</span>
        </div>

        {/* 3 Screen Navigation Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
          <button
            onClick={() => setScreen('home')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              screen === 'home' ? 'bg-[#EA3B52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setScreen('dispatched')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              screen === 'dispatched' ? 'bg-[#EA3B52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispatched
          </button>
          <button
            onClick={() => setScreen('map')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              screen === 'map' ? 'bg-[#EA3B52] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Map
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

      {/* The Exact Mobile Frame Matching the Screenshot */}
      <MobileFrame isDarkBar={screen === 'dispatched'}>
        {/* Screen 1: Home View (Center in Screenshot) */}
        {screen === 'home' && (
          <HomeScreen
            onTriggerSOS={handleTriggerSOS}
            onOpenAudit={() => setShowAuditModal(true)}
            onOpenResponders={() => setShowRespondersModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            activeTab="home"
          />
        )}

        {/* Screen 2: Ambulance on a Way (Left in Screenshot) */}
        {screen === 'dispatched' && (
          <AmbulanceOnTheWayScreen
            onBack={() => setScreen('home')}
            onSeeMap={() => setScreen('map')}
            onCancelRequest={() => setShowPinModal(true)}
            escalationStep={escalationStep || 3}
            elapsedSeconds={elapsedSeconds || 42}
          />
        )}

        {/* Screen 3: Live Map Tracking (Right in Screenshot) */}
        {screen === 'map' && (
          <MapTrackingView
            onBack={() => setScreen('dispatched')}
            onOpenInstruction={() => setShowInstructionModal(true)}
            currentResponder={activeResponder}
            onCall={(resp) => alert(`Calling ${resp.name} (${resp.phone})...`)}
            onMessage={(resp) => alert(`Opening secure messaging with ${resp.name}...`)}
          />
        )}

        {/* Clean Light Modals */}
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

        {showAuditModal && (
          <AuditTimelineModal
            chain={hashChain}
            onClose={() => setShowAuditModal(false)}
            onTamperBlock={handleTamperBlock}
            onRestoreChain={handleRestoreChain}
            isTampered={isChainTampered}
          />
        )}

        {showRespondersModal && (
          <RespondersModal
            responders={responders}
            onClose={() => setShowRespondersModal(false)}
            onSelectResponder={(resp) => {
              setActiveResponder(resp);
              setShowRespondersModal(false);
              showToast(`Selected ${resp.name} as preferred helper.`);
            }}
            selectedResponderId={activeResponder?.id}
          />
        )}

        {showSettingsModal && (
          <AdminSettingsModal
            onClose={() => setShowSettingsModal(false)}
            onStartSafeWalk={() => {
              showToast("Night Safe Walk activated. We are monitoring your commute.");
            }}
          />
        )}

        {showInstructionModal && (
          <InstructionModal
            onClose={() => setShowInstructionModal(false)}
            onDial112={handleDial112}
          />
        )}
      </MobileFrame>
    </div>
  );
}
