import React from 'react';
import { Home, FileText, Users, Sliders } from 'lucide-react';

export default function BottomNavBar({ activeTab, onSelectTab }) {
  return (
    <div className="w-full px-6 pb-6 pt-2 bg-transparent">
      <div className="w-full max-w-[325px] mx-auto bg-white rounded-full py-2 px-3 shadow-floating border border-slate-100 flex items-center justify-between">
        {/* Tab 1: Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-[12px] transition-all ${
            activeTab === 'home'
              ? 'bg-[#EA3B52] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-4 h-4 fill-current stroke-none" />
          <span>Home</span>
        </button>

        {/* Tab 2: Activity Log */}
        <button
          onClick={() => onSelectTab('activity')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-[12px] transition-all ${
            activeTab === 'activity'
              ? 'bg-[#EA3B52] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Activity Log"
        >
          <FileText className="w-4 h-4 stroke-[2]" />
          {activeTab === 'activity' && <span>Activity</span>}
        </button>

        {/* Tab 3: Contacts & Helpers */}
        <button
          onClick={() => onSelectTab('contacts')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-[12px] transition-all ${
            activeTab === 'contacts'
              ? 'bg-[#EA3B52] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Trusted Contacts & Helpers"
        >
          <Users className="w-4 h-4 stroke-[2]" />
          {activeTab === 'contacts' && <span>Contacts</span>}
        </button>

        {/* Tab 4: Safety Profile & Settings */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-[12px] transition-all ${
            activeTab === 'profile'
              ? 'bg-[#EA3B52] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Safety Profile"
        >
          <Sliders className="w-4 h-4 stroke-[2]" />
          {activeTab === 'profile' && <span>Profile</span>}
        </button>
      </div>
    </div>
  );
}
