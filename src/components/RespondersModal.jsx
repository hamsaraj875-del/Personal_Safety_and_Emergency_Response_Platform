import React from 'react';
import { X, Users, ShieldCheck, Phone, MapPin, HeartHandshake } from 'lucide-react';
import { TRUSTED_CONTACTS } from '../constants/initialData';

export default function RespondersModal({ responders, onClose, onSelectResponder, selectedResponderId }) {
  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end p-4 select-none">
      {/* Clean White Card */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90%]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 text-[#EA3B52] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Trusted Circle & Helpers
              </h3>
              <p className="text-[11px] text-slate-400">
                People who receive alerts and come to your aid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 py-3 text-left">
          {/* Section 1: Emergency Contacts */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Primary Contacts (Notified First)
            </h4>
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
                      <h5 className="text-xs font-bold text-slate-900">
                        {contact.name}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {contact.relation}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white text-slate-700 rounded-xl text-[11px] font-semibold border border-slate-200 shadow-xs">
                    Priority {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Nearby Verified Responders */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Nearby Verified Helpers
            </h4>
            <div className="space-y-2.5">
              {responders.map((resp) => {
                const isSelected = selectedResponderId === resp.id;

                return (
                  <div
                    key={resp.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-rose-50/60 border-[#EA3B52] shadow-sm'
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
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {resp.name}
                            </h5>
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
                            onClick={() => onSelectResponder(resp)}
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

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
