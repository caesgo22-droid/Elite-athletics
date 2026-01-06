import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from './components/BottomNav';
import LoginSelection from './components/LoginSelection';
import Login from './components/Login';
import AthleteDashboard from './components/AthleteDashboard';
import CoachDashboard from './components/CoachDashboard';
import StrategicPlanning from './components/StrategicPlanning'; // New Import
import StaffWall from './components/StaffWall'; // Import New Component
import TechnicalHub from './components/TechnicalHub';
import VideoAnalysis from './components/VideoAnalysis';
import TrainingPlan from './components/TrainingPlan';
import AthleteCheckIn from './components/AthleteCheckIn';
import RecoveryPlan from './components/RecoveryPlan';
import AthleteProfile from './components/AthleteProfile';
import AthleteProfileView from './components/AthleteProfileView';
import CoachProfileView from './components/CoachProfileView';
import HealthSection from './components/HealthSection';
import AthleteStats from './components/AthleteStats';
import ChatInterfaceAI from './components/ChatInterface'; // AI Chat (old)
import ChatInterface from './components/chat/ChatInterface'; // Direct Chat (new)
import SystemInfo from './components/SystemInfo';
import AdminPanel from './components/AdminPanel';
import PendingApprovalScreen from './components/PendingApprovalScreen';
import NotificationBell from './components/notifications/NotificationBell';
import { ViewState, User } from './types';
import { DataRing, Brain, EventBus, useDataRing } from './services/CoreArchitecture';
import { BackButton } from './components/common/BackButton';
import { getUser } from './services/userManagement';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logger } from './services/Logger';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewState>(ViewState.LOGIN);
  const [toastMessage, setToastMessage] = useState<{ msg: string, type?: 'info' | 'critical' | 'success' } | null>(null);
  const resetData = () => { if (confirm("REINICIAR SISTEMA: borrará todo el progreso local y desconectará Firebase. ¿Seguro?")) { localStorage.clear(); window.location.reload(); } };
  const [checkInContext, setCheckInContext] = useState<'MORNING' | 'SESSION' | 'WEEKLY'>('MORNING');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Staff Selection State
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('1');

  // Optimización: Uso del Hook en lugar de suscripción manual
  const effectiveAthleteId = currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? selectedAthleteId : (userId || '1');
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

    return () => {
      unsubscribeAlerts();
      unsubscribeUI();
      unsubscribeSim();
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
      DataRing.refreshCache(uid);

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
  const renderContent = () => {
    // If no user logged in, show login
    if (!userId) return <Login onBack={() => { }} onSuccess={handleLoginSuccess} />;

    // If user is pending approval, show pending screen
    if (currentUser?.status === 'PENDING') {
      return <PendingApprovalScreen email={currentUser.email} onLogout={handleLogout} />;
    }

    // Admin Panel
    if (activeTab === ViewState.ADMIN_PANEL && currentUser?.role === 'ADMIN') {
      return <AdminPanel currentUser={currentUser} onBack={() => setActiveTab(ViewState.STAFF_DASHBOARD)} />;
    }

    // Shared Views with back button logic
    const goBackToDash = () => setActiveTab(ViewState.DASHBOARD);

    switch (activeTab) {
      case ViewState.CHAT: return <ChatInterfaceAI />;
      case ViewState.DIRECT_CHAT:
        // Direct chat between staff and athlete
        if (!currentUser || !userId) return <Login onBack={() => { }} onSuccess={handleLoginSuccess} />;

        const isStaff = currentUser.role === 'STAFF' || currentUser.role === 'ADMIN';
        const athlete = isStaff ? DataRing.getAthlete(selectedAthleteId) : DataRing.getAthlete(userId);

        // Get staff UID - for now use a fixed coach UID
        // TODO: Implement proper staff assignment in athlete profile
        const staffId = isStaff ? userId : 'COACH_UID';  // Fixed coach UID for all athletes
        const athleteId = isStaff ? selectedAthleteId : userId;

        // CRITICAL: roomId must be consistent - always staffId_athleteId
        const consistentRoomId = `${staffId}_${athleteId}`;

        console.log('🔵 DIRECT_CHAT - isStaff:', isStaff, 'staffId:', staffId, 'athleteId:', athleteId, 'roomId:', consistentRoomId);

        if (!athlete) {
          return (
            <div className="h-full flex items-center justify-center bg-background p-8">
              <div className="text-center">
                <span className="material-symbols-outlined text-slate-600 text-4xl mb-3">chat_error</span>
                <p className="text-white font-bold">No se pudo iniciar el chat</p>
                <p className="text-slate-500 text-sm mt-2">Intenta nuevamente</p>
                <button
                  onClick={() => setActiveTab(isStaff ? ViewState.STAFF_DASHBOARD : ViewState.DASHBOARD)}
                  className="mt-4 px-4 py-2 bg-volt text-black rounded-lg font-bold text-sm"
                >
                  Volver
                </button>
              </div>
            </div>
          );
        }

        return (
          <ChatInterface
            roomId={consistentRoomId}
            currentUserId={userId}
            currentUserName={currentUser.displayName || currentUser.email}
            currentUserRole={currentUser.role === 'PENDING' ? 'ATHLETE' : currentUser.role}
            otherUserName={isStaff ? athlete.name : 'Coach'}
            onClose={() => setActiveTab(isStaff ? ViewState.STAFF_DASHBOARD : ViewState.DASHBOARD)}
          />
        );
      case ViewState.PROFILE: return <AthleteProfile
        onBack={() => setActiveTab(currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? ViewState.STAFF_ATHLETE_DETAIL : ViewState.DASHBOARD)}
        onNavigate={setActiveTab}
        athleteId={currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? selectedAthleteId : (userId || '1')}
        userRole={(currentUser?.role === 'ADMIN' ? 'STAFF' : (currentUser?.role === 'PENDING' ? 'ATHLETE' : currentUser?.role)) as 'ATHLETE' | 'STAFF'}
      />;
      case ViewState.ATHLETE_PROFILE:
        return <AthleteProfileView onNavigate={setActiveTab} athleteId={currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? selectedAthleteId : (userId || '1')} userRole={currentUser?.role || 'ATHLETE'} />;

      case ViewState.STAFF_PROFILE: // NEW: Explicit Coach Profile
        if (currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN') {
          return <CoachProfileView onBack={() => setActiveTab(ViewState.STAFF_DASHBOARD)} />;
        }
        return <Login onBack={() => { }} onSuccess={handleLoginSuccess} />;
      case ViewState.SYSTEM_INFO: return <SystemInfo onBack={() => setActiveTab(currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? ViewState.STAFF_DASHBOARD : ViewState.DASHBOARD)} />;
    }

    // STAFF/ADMIN SPECIFIC VIEWS
    if (currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN') {
      const backToStaffDetail = () => setActiveTab(ViewState.STAFF_ATHLETE_DETAIL);

      switch (activeTab) {
        case ViewState.STAFF_DASHBOARD:
          return <CoachDashboard
            onSelectAthlete={handleStaffSelectAthlete}
            onPlanning={(id) => { setSelectedAthleteId(id); setActiveTab(ViewState.STAFF_STRATEGY); }}
            onNavigate={(view, athleteId) => {
              if (athleteId) setSelectedAthleteId(athleteId);
              setActiveTab(view);
            }}
            onLogout={handleLogout}
          />;

        case ViewState.STAFF_WALL:
          return <StaffWall />;


        case ViewState.STAFF_ATHLETE_DETAIL:
          return (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-surface border-b border-white/5 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <BackButton onClick={() => setActiveTab(ViewState.STAFF_DASHBOARD)} label="Lista de Atletas" />
                  <div className="h-6 w-px bg-white/10 mx-2"></div>
                  <div>
                    <h2 className="text-white font-bold text-sm">Vista de Supervisión</h2>
                    <p className="text-xs text-slate-500">Atleta ID: {selectedAthleteId}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-background">
                <AthleteDashboard onNavigate={setActiveTab} userRole={currentUser?.role || 'ATHLETE'} athleteId={selectedAthleteId} />
              </div>
            </div>
          );

        case ViewState.ROUND_TABLE:
          return (
            <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-surface p-2 border-b border-white/5">
                <BackButton onClick={() => setActiveTab(ViewState.STAFF_DASHBOARD)} label="Volver al Dashboard" />
              </div>
              <TechnicalHub />
            </div>
          );
        case ViewState.STAFF_STRATEGY:
          return <StrategicPlanning athleteId={selectedAthleteId} onBack={backToStaffDetail} />;
        case ViewState.PLANNING:
          return <TrainingPlan plan={currentPlan!} onLogFeedback={() => { }} userRole={currentUser?.role || 'STAFF'} onBack={backToStaffDetail} />;
        case ViewState.HEALTH:
          return <HealthSection onBack={backToStaffDetail} userRole={currentUser?.role || 'STAFF'} athleteId={selectedAthleteId} />;
        case ViewState.VIDEO_ANALYSIS:
          return <VideoAnalysis userRole={currentUser?.role || 'STAFF'} athleteId={selectedAthleteId} onBack={backToStaffDetail} />;
        case ViewState.STATS:
          return <AthleteStats onBack={backToStaffDetail} athleteId={selectedAthleteId} />;
        case ViewState.RECOVERY_PLAN:
          return <RecoveryPlan rpe={7} onComplete={backToStaffDetail} userRole={currentUser?.role || 'STAFF'} />;

        default: return <CoachDashboard
          onSelectAthlete={handleStaffSelectAthlete}
          onPlanning={(id) => { setSelectedAthleteId(id); setActiveTab(ViewState.STAFF_STRATEGY); }}
          onNavigate={(view, athleteId) => {
            if (athleteId) setSelectedAthleteId(athleteId);
            setActiveTab(view);
          }}
          onLogout={handleLogout}
        />;
      }
    }

    // ATHLETE SPECIFIC VIEWS
    else {
      switch (activeTab) {
        case ViewState.DASHBOARD: return <AthleteDashboard onNavigate={(view) => {
          if (view === ViewState.ATHLETE_INPUT) {
            const isSunday = new Date().getDay() === 0;
            setCheckInContext(isSunday ? 'WEEKLY' : 'MORNING');
          }
          if (view === ViewState.LOGIN) {
            handleLogout();
            return;
          }
          setActiveTab(view);
        }} userRole={currentUser?.role || 'ATHLETE'} athleteId={userId || '1'} />;

        case ViewState.PLANNING: return currentPlan ? <TrainingPlan plan={currentPlan} onLogFeedback={() => {
          setCheckInContext('SESSION');
          setActiveTab(ViewState.ATHLETE_INPUT);
        }} userRole={currentUser?.role || 'ATHLETE'} onBack={goBackToDash} /> : <div>Cargando...</div>;

        case ViewState.VIDEO_ANALYSIS: return <VideoAnalysis userRole={currentUser?.role || 'ATHLETE'} athleteId={userId || '1'} onBack={goBackToDash} />;
        case ViewState.STATS: return <AthleteStats athleteId={userId || '1'} onBack={goBackToDash} />;
        case ViewState.HEALTH: return <HealthSection onBack={goBackToDash} userRole={currentUser?.role || 'ATHLETE'} athleteId={userId || '1'} />;
        case ViewState.ATHLETE_INPUT: return <AthleteCheckIn onComplete={setActiveTab} context={checkInContext} onNavigate={setActiveTab} />;
        case ViewState.RECOVERY_PLAN: return <RecoveryPlan rpe={7} onComplete={() => setActiveTab(ViewState.DASHBOARD)} userRole={currentUser?.role || 'ATHLETE'} />;
        case ViewState.ROUND_TABLE: return <div className="h-full flex flex-col"><div className="bg-surface p-4 border-b border-white/10"><BackButton onClick={goBackToDash} label="Volver al Hub" /></div><TechnicalHub /></div>;
        default: return <AthleteDashboard onNavigate={setActiveTab} userRole={currentUser?.role || 'ATHLETE'} athleteId="1" />;
      }
    }
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

            {/* RIGHT: Profile and logout now in CoachDashboard dropdown menu */}
            <div className="flex items-center gap-3">
              {/* Removed duplicate buttons - now using dropdown menu in CoachDashboard */}
            </div>
          </header>
        )}

        {/* CONTENEDOR PRINCIPAL CON TRANSICIONES */}
        <main className={`flex-1 overflow-hidden relative p-0 bg-background ${activeTab !== ViewState.PROFILE ? 'pb-24' : ''}`}>
          <div className="h-full w-full animate-in fade-in slide-in-from-bottom-2 duration-500" key={activeTab}>
            {renderContent()}
          </div>
        </main>

        {/* Global HUD Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 md:top-32 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in zoom-in-95 duration-500 pointer-events-none w-[calc(100%-32px)] md:w-auto min-w-[300px]">
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
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser?.role || 'ATHLETE'} />
      )}
    </div>
  );
};

export default App;
// End of file fix