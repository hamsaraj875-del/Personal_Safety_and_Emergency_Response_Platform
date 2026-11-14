import React from 'react';
import { Users, ShieldCheck, MapPin, Phone, MessageSquare } from 'lucide-react';
import { TRUSTED_CONTACTS } from '../constants/initialData';
import BottomNavBar from './BottomNavBar';

export default function ContactsScreen({
  responders,
  selectedResponderId,
  onSelectResponder,
  activeTab,
  onSelectTab
}) {
  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white text-slate-900 select-none overflow-hidden">
      {/* Top Header */}
      <div className="pt-8 px-6 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#EA3B52] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Trusted Circle & Helpers
            </h2>
            <p className="text-[11px] text-slate-400">
              People who receive alerts and come to your aid
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
        {/* Section 1: Emergency Contacts */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Priority Contacts (Notified First)
          </h3>
          <div className="space-y-2">
            {TRUSTED_CONTACTS.map((contact, i) => (
              <div
                key={contact.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {contact.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {contact.relation}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white text-slate-700 rounded-xl text-[11px] font-semibold border border-slate-200 shadow-2xs">
                  Priority {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Nearby Verified Responders */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Nearby Verified Responders
          </h3>
          <div className="space-y-2.5">
            {responders.map((resp) => {
              const isSelected = selectedResponderId === resp.id;

              return (
                <div
                  key={resp.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-rose-50/70 border-[#EA3B52] shadow-sm'
                      : 'bg-white border-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={resp.avatar}
                      alt={resp.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {resp.name}
                          </h4>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <span className="text-[11px] font-bold text-[#EA3B52]">
                          {resp.etaMinutes} min away
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {resp.badge}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {resp.distanceKm} km away
                        </span>
                        <button
                          onClick={() => onSelectResponder && onSelectResponder(resp)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-[#EA3B52] text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Persistent Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onSelectTab={onSelectTab} />
    </div>
  );
}
