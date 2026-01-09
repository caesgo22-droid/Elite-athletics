import React, { useState, useEffect, useCallback } from 'react';
import { AppRouter } from './components/AppRouter';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import NotificationBell from './components/notifications/NotificationBell';
import AdminPanel from './components/AdminPanel';
import { ViewState, User } from './types';
import { DataRing, EventBus, useDataRing } from './services/CoreArchitecture';
import { BackButton } from './components/common/BackButton';
import { getUser } from './services/userManagement';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { logger } from './services/Logger';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewState>(ViewState.LOGIN);
  const [toastMessage, setToastMessage] = useState<{ msg: string, type?: 'info' | 'critical' | 'success' } | null>(null);
  const resetData = () => { if (confirm("REINICIAR SISTEMA: borrará todo el progreso local y desconectará Firebase. ¿Seguro?")) { localStorage.clear(); window.location.reload(); } };
  const [checkInContext, setCheckInContext] = useState<'MORNING' | 'SESSION' | 'WEEKLY'>('MORNING');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // NEW: Menu Logic
  const [selectedStaffForChat, setSelectedStaffForChat] = useState<{ id: string; name: string } | null>(null); // NEW: Multi-coach support

  // Staff Selection State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');

  // Optimización: Uso del Hook en lugar de suscripción manual
  const effectiveAthleteId = currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? selectedAthleteId : (userId || '');
  const currentPlan = useDataRing((ring) => ring.getWeeklyPlan(effectiveAthleteId));

  // Firebase Auth State Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, restore session
        logger.log('[Auth] User session restored:', firebaseUser.uid);
        await handleLoginSuccess(firebaseUser.uid);
      } else {
        // User is signed out
        logger.log('[Auth] No user session found');
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time sync of user profile data
  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as User;
        setCurrentUser(userData);
        logger.log('[Auth] User profile updated in real-time');
      }
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    // Suscripción al EventBus para ALERTAS PROACTIVAS DEL CEREBRO y FEEDBACK UI
    const unsubscribeAlerts = EventBus.subscribe('SYSTEM_ALERT', (alert: any) => {
      showToast(alert.message, alert.level === 'CRITICAL' ? 'critical' : 'info');
    });

    const unsubscribeUI = EventBus.subscribe('UI_FEEDBACK', (feedback: any) => {
      showToast(feedback.message, feedback.type || 'success');
    });

    const unsubscribeSim = EventBus.subscribe('SIMULATION_COMPLETE', () => {
      if (currentUser?.role === 'ATHLETE') {
        setActiveTab(ViewState.DASHBOARD);
      }
    });

    const unsubscribeNav = EventBus.subscribe('NAVIGATE', (data: any) => {
      if (data.view) {
        if (data.params && data.view === ViewState.STAFF_ATHLETE_DETAIL) {
          setSelectedAthleteId(data.params);
        }
        setActiveTab(data.view);
      }
    });

    return () => {
      unsubscribeAlerts();
      unsubscribeUI();
      unsubscribeSim();
      unsubscribeNav();
    };
  }, [currentUser]);

  const handleLoginSuccess = useCallback(async (uid: string) => {
    try {
      const user = await getUser(uid);
      if (!user) {
        logger.error('User not found after login');
        setIsAuthLoading(false);
        return;
      }

      setCurrentUser(user);
      setUserId(uid);

      // Check user status
      if (user.status === 'PENDING') {
        setActiveTab(ViewState.LOGIN); // Will show pending screen
        setIsAuthLoading(false);
        return;
      }

      if (user.status === 'REJECTED') {
        alert('Tu acceso ha sido rechazado por un administrador');
        handleLogout();
        setIsAuthLoading(false);
        return;
      }

      // User is approved, redirect based on role
      DataRing.refreshCache(uid, user.role);

      if (user.role === 'ADMIN') {
        setActiveTab(ViewState.ADMIN_PANEL);
      } else if (user.role === 'ATHLETE') {
        setActiveTab(ViewState.DASHBOARD);
      } else if (user.role === 'STAFF') {
        setActiveTab(ViewState.STAFF_DASHBOARD);
      }

      setIsAuthLoading(false);
    } catch (error) {
      logger.error('Error in login success:', error);
      setIsAuthLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    auth.signOut();
    setCurrentUser(null);
    setUserId(null);
    setActiveTab(ViewState.LOGIN);
  }, []);

  const handleStaffSelectAthlete = useCallback((id: string) => {
    setSelectedAthleteId(id);
    setActiveTab(ViewState.STAFF_ATHLETE_DETAIL);
  }, []);

  const resetSimulation = useCallback(() => {
    DataRing.resetData();
    showToast("🔄 Sistema reiniciado a estado ÓPTIMO.", 'info');
  }, []);

  const showToast = useCallback((msg: string, type: 'info' | 'critical' | 'success' = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // --- RENDER CONTENT LOGIC ---
  // --- RENDER CONTENT LOGIC (DELEGATED TO ROUTER) ---
  const renderContent = () => {
    return (
      <AppRouter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        userId={userId}
        selectedAthleteId={selectedAthleteId}
        setSelectedAthleteId={setSelectedAthleteId}
        currentPlan={currentPlan}
        onLogout={handleLogout}
        onLoginSuccess={handleLoginSuccess}
        checkInContext={checkInContext}
        setCheckInContext={setCheckInContext}
        selectedStaffForChat={selectedStaffForChat}
        setSelectedStaffForChat={setSelectedStaffForChat}
      />
    );
  };

  // Show loading screen while checking auth state
  if (isAuthLoading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-16 border-4 border-volt/30 border-t-volt rounded-full animate-spin"></div>
          <p className="text-white font-bold text-sm">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return renderContent();
  }

  // Kiosk Mode Wrapper
  if (activeTab === ViewState.ATHLETE_INPUT || (activeTab === ViewState.RECOVERY_PLAN && currentUser?.role === 'ATHLETE')) {
    return (
      <div className="h-screen w-full bg-background text-white font-sans overflow-hidden">
        <div className="absolute top-4 left-4 z-50">
          <BackButton onClick={() => setActiveTab(ViewState.DASHBOARD)} label="Salir Kiosco" className="bg-surface/50 backdrop-blur px-4 py-2 rounded-full border border-white/10" />
        </div>
        {renderContent()}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background text-white font-sans overflow-hidden selection:bg-primary/30">

      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {activeTab !== ViewState.PROFILE && activeTab !== ViewState.LOGIN && (
          <header className="h-14 md:h-20 border-b border-white/5 bg-background/60 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 z-30 sticky top-0">
            {/* LEFT: Logo Only */}
            <div className="flex items-center gap-3">
              <div className="size-8 md:size-9 bg-volt flex items-center justify-center rounded-lg shadow-glow-volt rotate-3">
                <span className="material-symbols-outlined text-black font-black text-sm">bolt</span>
              </div>
              <div>
                <h1 className="text-white font-black italic tracking-tighter text-sm md:text-base leading-tight uppercase font-display">Elite <span className="text-volt">Sync</span></h1>
                <div className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-success animate-pulse"></span>
                  <span className="text-[7px] text-slate-500 font-mono uppercase tracking-widest">{activeTab.replace('STAFF_', '').replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Profile Menu (Deduplicated & Standardized) */}
            <div
              className="flex items-center gap-3 relative"
            >
              <NotificationBell userId={userId || ''} />
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="size-9 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-white text-sm">person</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute top-12 right-0 w-48 bg-[#121212] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-white/5">
                    <p className="text-white text-xs font-bold truncate">{currentUser?.displayName || 'Usuario'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser?.email}</p>
                  </div>
                  <div className="p-1">
                    {/* Mi Perfil */}
                    <button
                      onClick={() => {
                        if (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF') {
                          setActiveTab(ViewState.STAFF_PROFILE);
                        } else {
                          setActiveTab(ViewState.PROFILE);
                        }
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">account_circle</span> Mi Perfil
                    </button>

                    {/* Hub Técnico (Science/Foundation) */}
                    <button onClick={() => { setActiveTab(ViewState.TECHNICAL_HUB); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">science</span> Hub Técnico
                    </button>



                    <div className="h-px bg-white/5 my-1"></div>

                    {/* Cerrar Sesión */}
                    <button onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-[10px] text-danger hover:bg-danger/10 rounded-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">logout</span> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>
        )}

        {/* MAIN CONTENT */}
        <main className={`flex-1 overflow-hidden relative p-0 bg-background ${activeTab !== ViewState.PROFILE ? 'pb-24' : ''}`}>
          <div className="h-full w-full animate-in fade-in slide-in-from-bottom-2 duration-500" key={activeTab}>
            {renderContent()}
          </div>
        </main>

        {/* Global HUD Toast Notification */}
        {toastMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in zoom-in-95 duration-500 pointer-events-none w-[calc(100%-32px)] md:w-auto min-w-[300px]">
            <div className={`
                glass-card px-4 py-3 md:px-6 md:py-5 rounded-xl md:rounded-2xl shadow-glass flex items-center gap-4 md:gap-5 border-l-[4px] md:border-l-[6px] transition-all
                ${toastMessage.type === 'critical' ? 'border-danger' : toastMessage.type === 'success' ? 'border-success' : 'border-primary'}
            `}>
              <div className={`size-8 md:size-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg ${toastMessage.type === 'critical' ? 'bg-danger/20 text-danger' : toastMessage.type === 'success' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                <span className="material-symbols-outlined text-xl md:text-2xl font-black">
                  {toastMessage.type === 'critical' ? 'crisis_alert' : toastMessage.type === 'success' ? 'verified' : 'analytics'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 font-mono uppercase tracking-widest font-black leading-tight mb-0.5">Neural Alert</span>
                <span className="font-display text-[10px] md:text-sm uppercase tracking-wide font-black text-white leading-tight">{toastMessage.msg}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab !== ViewState.PROFILE && activeTab !== ViewState.LOGIN && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser?.role || 'ATHLETE'} userId={userId || ''} />
      )}

      {/* Admin Back Button Overlay - Global Shell */}
      {currentUser?.role === 'ADMIN' && activeTab !== ViewState.ADMIN_PANEL && (
        <button
          onClick={() => setActiveTab(ViewState.ADMIN_PANEL)}
          className="fixed bottom-20 left-4 md:bottom-8 md:left-8 z-[200] bg-black/90 text-volt border border-volt/50 px-4 py-2 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 font-bold uppercase text-xs backdrop-blur-md animate-in slide-in-from-bottom-4 group"
        >
          <span className="material-symbols-outlined text-sm group-hover:rotate-180 transition-transform">admin_panel_settings</span>
          <span className="hidden md:inline">Volver a Admin</span>
          <span className="md:hidden">Admin</span>
        </button>
      )}
    </div>
  );
};

export default App;
// End of file fix