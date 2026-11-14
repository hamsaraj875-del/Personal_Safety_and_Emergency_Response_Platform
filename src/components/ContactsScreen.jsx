import React, { useState } from 'react';
import { Users, ShieldCheck, MapPin, Plus, Trash2, Phone, X, UserCheck } from 'lucide-react';
import BottomNavBar from './BottomNavBar';

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"
];

export default function ContactsScreen({
  contacts = [],
  onAddContact,
  onDeleteContact,
  responders = [],
  selectedResponderId,
  onSelectResponder,
  activeTab,
  onSelectTab
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRelation, setNewRelation] = useState("Family");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [error, setError] = useState("");

  const handleSaveContact = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Please enter the contact's name.");
      return;
    }
    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    const newContact = {
      id: `ct_${Date.now()}`,
      name: newName.trim(),
      phone: `+91 ${cleanPhone}`,
      relation: newRelation,
      avatar: selectedAvatar,
      priority: (contacts.length || 0) + 1
    };

    onAddContact && onAddContact(newContact);
    setNewName("");
    setNewPhone("");
    setError("");
    setShowAddModal(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between bg-white text-slate-900 select-none overflow-hidden">
      {/* Top Header */}
      <div className="pt-8 px-6 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#EA3B52] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[20px] font-normal text-slate-900 tracking-tight">
              Trusted Contacts
            </h2>
            <p className="text-[13px] text-slate-500 font-normal">
              Who receives your SOS alerts and coordinates help
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-[#DE354C] hover:bg-[#cf2f44] text-white rounded-full text-[13px] font-medium flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
        {/* Section 1: User's Emergency Contacts */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Emergency Circle ({contacts.length})
            </h3>
            <span className="text-[11px] text-slate-400">Alerted in order</span>
          </div>

          {contacts.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-[#EA3B52] flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Contacts Added</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto leading-relaxed">
                Add trusted people (family, friends) who should receive your live location during an SOS.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 px-4 py-2 bg-[#EA3B52] hover:bg-[#d92d44] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Contact Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact, i) => (
                <div
                  key={contact.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={contact.avatar || AVATAR_PRESETS[0]}
                      alt={contact.name}
                      className="w-10 h-10 rounded-full object-cover border border-white shadow-sm flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {contact.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-[#EA3B52] bg-rose-50 px-1.5 py-0.2 rounded">
                          Priority {i + 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {contact.phone} • {contact.relation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteContact && onDeleteContact(contact.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Nearby Verified Responders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nearby Verified Responders
            </h3>
            <span className="text-[11px] text-emerald-600 font-semibold">● Active in your area</span>
          </div>

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
                          {isSelected ? 'Active Helper' : 'Select'}
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

      {/* Add Contact Modal Sheet */}
      {showAddModal && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col justify-end p-4 select-none">
          <div className="w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add Emergency Contact
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3 pt-3">
              {/* Photo Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Choose Photo
                </label>
                <div className="flex gap-2">
                  {AVATAR_PRESETS.map((av, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                        selectedAvatar === av ? 'border-[#EA3B52] scale-110 shadow-sm' : 'border-slate-200 opacity-70'
                      }`}
                    >
                      <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Priyatev"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52]"
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <span className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="10-digit phone number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EA3B52]"
                  />
                </div>
              </div>

              {/* Relation */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Relationship
                </label>
                <select
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#EA3B52]"
                >
                  <option value="Family">Family / Parent</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Friend">Friend / Roommate</option>
                  <option value="Campus Security">Campus Security</option>
                  <option value="Doctor">Doctor / Medical</option>
                </select>
              </div>

              {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#EA3B52] hover:bg-[#d92d44] text-white font-bold rounded-xl text-xs shadow-2xs"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
