import React, { useState, useEffect } from 'react';
import { ViewState, User } from '../types';
import { chatService } from '../services/ChatService';

interface BottomNavProps {
  activeTab: ViewState;
  setActiveTab: (tab: ViewState) => void;
  userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN' | 'PENDING';
  userId?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, userRole = 'ATHLETE', userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to chat rooms for real-time updates
    const unsubscribe = chatService.subscribeToRooms(userId, (rooms) => {
      const total = rooms.reduce((sum, room) => sum + (room.unreadCount[userId || ''] || 0), 0);
      setUnreadCount(total);
    });

    return () => unsubscribe();
  }, [userId]);

  const athleteItems = [
    { id: ViewState.DASHBOARD, label: 'Hub', icon: 'grid_view' },
    { id: ViewState.VIDEO_ANALYSIS, label: 'Video', icon: 'videocam' },
    { id: ViewState.HEALTH, label: 'Salud', icon: 'medical_services' },
    { id: ViewState.DIRECT_CHAT, label: 'Coach', icon: 'chat' },
    { id: ViewState.CHAT, label: 'IA', icon: 'smart_toy' },
  ];

  const staffItems = [
    { id: ViewState.STAFF_DASHBOARD, label: 'Roster', icon: 'group' },
  ];

  const navItems = userRole === 'STAFF' ? staffItems : athleteItems;

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 bg-[#0B1219]/90 backdrop-blur-xl border-t border-[#1E2936] z-50 px-4 pb-safe safe-area-bottom lg:h-20 lg:border-t-white/10" role="navigation" aria-label="Navegación principal">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`
                relative flex flex-col items-center justify-center gap-1 flex-1 transition-all duration-300 min-h-[48px] min-w-[48px]
                ${isActive ? 'text-volt -translate-y-0.5' : 'text-slate-500 hover:text-slate-200'}
              `}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-volt/10' : 'bg-transparent'}`}>
                <span className={`material-symbols-outlined text-2xl lg:text-2xl ${isActive ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                {(item.id === ViewState.DIRECT_CHAT || (item.id === ViewState.STAFF_DASHBOARD && userRole === 'STAFF')) && unreadCount > 0 && (
                  <div className="absolute top-0 right-0 size-4 bg-danger rounded-full flex items-center justify-center border border-[#0B1219]">
                    <span className="text-[8px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </div>
              <span className={`text-[10px] lg:text-[11px] font-bold tracking-wide uppercase ${isActive ? 'text-white' : ''}`}>
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