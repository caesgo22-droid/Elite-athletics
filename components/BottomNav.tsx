import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
  activeTab: ViewState;
  setActiveTab: (tab: ViewState) => void;
  userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN' | 'PENDING';
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, userRole = 'ATHLETE' }) => {

  const athleteItems = [
    { id: ViewState.DASHBOARD, label: 'Hub', icon: 'grid_view' },
    { id: ViewState.ROUND_TABLE, label: 'Técnico', icon: 'psychology' },
    { id: ViewState.VIDEO_ANALYSIS, label: 'Video', icon: 'videocam' },
    { id: ViewState.HEALTH, label: 'Salud', icon: 'medical_services' },
    { id: ViewState.CHAT, label: 'IA', icon: 'smart_toy' },
  ];

  const staffItems = [
    { id: ViewState.STAFF_DASHBOARD, label: 'Roster', icon: 'group' },
    { id: ViewState.STAFF_WALL, label: 'Muro', icon: 'forum' },
  ];

  const navItems = userRole === 'STAFF' ? staffItems : athleteItems;

  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-[#0B1219]/90 backdrop-blur-xl border-t border-[#1E2936] z-50 px-4 pb-safe safe-area-bottom lg:h-20 lg:border-t-white/10">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-all duration-300
                ${isActive ? 'text-volt -translate-y-0.5' : 'text-slate-500 hover:text-slate-200'}
              `}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-volt/10' : 'bg-transparent'}`}>
                <span className={`material-symbols-outlined text-xl lg:text-2xl ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
              </div>
              <span className={`text-[8px] lg:text-[9px] font-black tracking-[0.1em] uppercase ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;