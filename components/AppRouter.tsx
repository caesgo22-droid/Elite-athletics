import React from 'react';
import { ViewState, User, WeeklyPlan } from '../types';
import Login from './Login';
import AthleteDashboard from './AthleteDashboard';
import CoachDashboard from './CoachDashboard';
import StrategicPlanning from './StrategicPlanning';
import StaffWall from './StaffWall';
import TechnicalHub from './TechnicalHub';
import RoundTable from './RoundTable';
import VideoAnalysis from './VideoAnalysis';
import TrainingPlan from './TrainingPlan';
import AthleteCheckIn from './AthleteCheckIn';
import RecoveryPlan from './RecoveryPlan';
import AthleteProfile from './AthleteProfile';
import AthleteProfileView from './AthleteProfileView';
import CoachProfileView from './CoachProfileView';
import HealthSection from './HealthSection';
import AthleteStats from './AthleteStats';
import ChatInterfaceAI from './AiAssistant';
import ChatInterface from './chat/ChatInterface';
import SystemInfo from './SystemInfo';
import AdminPanel from './AdminPanel';
import PendingApprovalScreen from './PendingApprovalScreen';
import StaffSelector from './StaffSelector';
import { DataRing } from '../services/CoreArchitecture';
import { BackButton } from './common/BackButton';

interface AppRouterProps {
    activeTab: ViewState;
    setActiveTab: (view: ViewState) => void;
    currentUser: User | null;
    userId: string | null;
    selectedAthleteId: string;
    setSelectedAthleteId: (id: string) => void;
    currentPlan?: WeeklyPlan;
    // Actions
    onLogout: () => void;
    onLoginSuccess: (uid: string) => Promise<void>;
    // Context State
    checkInContext: 'MORNING' | 'SESSION' | 'WEEKLY';
    setCheckInContext: (ctx: 'MORNING' | 'SESSION' | 'WEEKLY') => void;
    // Chat State
    selectedStaffForChat: { id: string; name: string } | null;
    setSelectedStaffForChat: (staff: { id: string; name: string } | null) => void;
    navigationParams?: any;
}

export const AppRouter: React.FC<AppRouterProps> = ({
    activeTab,
    setActiveTab,
    currentUser,
    userId,
    selectedAthleteId,
    setSelectedAthleteId,
    currentPlan,
    onLogout,
    onLoginSuccess,
    checkInContext,
    setCheckInContext,
    selectedStaffForChat,
    setSelectedStaffForChat,
    navigationParams
}) => {

    // Helper Navs
    const goBackToDash = () => setActiveTab(ViewState.DASHBOARD);
    const backToStaffDetail = () => setActiveTab(ViewState.STAFF_ATHLETE_DETAIL);

    // 1. Unauthenticated or Special States
    if (!userId) return <Login onBack={() => { }} onSuccess={onLoginSuccess} />;

    if (currentUser?.status === 'PENDING') {
        return <PendingApprovalScreen email={currentUser.email} onLogout={onLogout} />;
    }

    // 2. Admin Panel
    if (activeTab === ViewState.ADMIN_PANEL && currentUser?.role === 'ADMIN') {
        return <AdminPanel currentUser={currentUser} onBack={() => setActiveTab(ViewState.STAFF_DASHBOARD)} />;
    }

    // 3. Define content renderer
    const renderContent = () => {
        // Shared Views
        switch (activeTab) {
            case ViewState.CHAT: return <ChatInterfaceAI
                userId={userId || ''}
                userName={currentUser?.displayName || 'Usuario'}
                userRole={currentUser?.role === 'PENDING' ? 'ATHLETE' : currentUser?.role}
            />;

            case ViewState.DIRECT_CHAT:
                if (!currentUser || !userId) return <Login onBack={() => { }} onSuccess={onLoginSuccess} />;

                const isStaff = currentUser.role === 'STAFF' || currentUser.role === 'ADMIN';
                const athlete = isStaff ? DataRing.getAthlete(selectedAthleteId) : DataRing.getAthlete(userId);

                if (!isStaff && !selectedStaffForChat) {
                    return (
                        <StaffSelector
                            athleteId={userId}
                            onSelectStaff={(staffId, staffName) => {
                                setSelectedStaffForChat({ id: staffId, name: staffName });
                            }}
                            onCancel={() => setActiveTab(ViewState.DASHBOARD)}
                        />
                    );
                }

                const staffId = isStaff ? userId : (selectedStaffForChat?.id || null);
                const athleteId = isStaff ? selectedAthleteId : userId;

                if (!staffId || !athlete) {
                    return (
                        <div className="h-full flex items-center justify-center bg-background p-8">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-danger text-4xl mb-3">error</span>
                                <p className="text-white font-bold">Error de Conexión</p>
                                <button onClick={() => setActiveTab(ViewState.DASHBOARD)} className="mt-4 px-4 py-2 bg-white/10 rounded-lg">Volver</button>
                            </div>
                        </div>
                    );
                }

                return (
                    <ChatInterface
                        roomId={`${staffId}_${athleteId}`}
                        currentUserId={userId}
                        currentUserName={currentUser.displayName || currentUser.email}
                        currentUserRole={currentUser.role === 'PENDING' ? 'ATHLETE' : currentUser.role}
                        otherUserName={isStaff ? athlete.name : (selectedStaffForChat?.name || 'Coach')}
                        onClose={() => {
                            setSelectedStaffForChat(null);
                            setActiveTab(isStaff ? ViewState.STAFF_DASHBOARD : ViewState.DASHBOARD);
                        }}
                    />
                );

            case ViewState.PROFILE: return <AthleteProfile
                onBack={() => setActiveTab(currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? ViewState.STAFF_ATHLETE_DETAIL : ViewState.DASHBOARD)}
                onNavigate={setActiveTab}
                athleteId={currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? selectedAthleteId : (userId || '')}
                userRole={(currentUser?.role === 'ADMIN' ? 'STAFF' : (currentUser?.role === 'PENDING' ? 'ATHLETE' : currentUser?.role)) as 'ATHLETE' | 'STAFF'}
            />;

            case ViewState.ATHLETE_PROFILE:
                return <AthleteProfileView onNavigate={setActiveTab} athleteId={currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? selectedAthleteId : (userId || '')} userRole={currentUser?.role || 'ATHLETE'} />;

            case ViewState.STAFF_PROFILE:
                if (!currentUser || !userId) return <Login onBack={() => { }} onSuccess={onLoginSuccess} />;
                return <CoachProfileView
                    onBack={goBackToDash}
                    currentUser={currentUser}
                    userId={userId}
                />;

            case ViewState.SYSTEM_INFO: return <SystemInfo onBack={() => setActiveTab(currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN' ? ViewState.STAFF_DASHBOARD : ViewState.DASHBOARD)} />;
        }

        // 4. Role Specific Views
        // STAFF
        if (currentUser?.role === 'STAFF' || currentUser?.role === 'ADMIN') {
            switch (activeTab) {
                case ViewState.STAFF_DASHBOARD:
                    return <CoachDashboard
                        userId={userId}
                        currentUser={currentUser}
                        onSelectAthlete={(id) => { setSelectedAthleteId(id); setActiveTab(ViewState.STAFF_ATHLETE_DETAIL); }}
                        onPlanning={(id) => { setSelectedAthleteId(id); setActiveTab(ViewState.STAFF_STRATEGY); }}
                        onNavigate={(view, athleteId) => {
                            if (athleteId) setSelectedAthleteId(athleteId);
                            setActiveTab(view);
                        }}
                        onLogout={onLogout}
                    />;

                case ViewState.STAFF_WALL:
                    return <StaffWall
                        userId={userId}
                        userName={currentUser?.displayName || 'Coach'}
                        userRole="STAFF"
                    />;

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
                case ViewState.TECHNICAL_HUB:
                    return (
                        <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                            <div className="bg-surface p-2 border-b border-white/5">
                                <BackButton onClick={() => setActiveTab(ViewState.STAFF_DASHBOARD)} label="Volver al Dashboard" />
                            </div>
                            <TechnicalHub />
                        </div>
                    );
                case ViewState.STAFF_STRATEGY: return <StrategicPlanning athleteId={selectedAthleteId} onBack={backToStaffDetail} />;
                case ViewState.PLANNING: return <TrainingPlan plan={currentPlan!} onLogFeedback={() => { }} userRole={currentUser?.role || 'STAFF'} onBack={backToStaffDetail} />;
                case ViewState.HEALTH: return <HealthSection onBack={backToStaffDetail} userRole={currentUser?.role || 'STAFF'} athleteId={selectedAthleteId} />;
                case ViewState.VIDEO_ANALYSIS: return <VideoAnalysis userRole={currentUser?.role || 'STAFF'} athleteId={selectedAthleteId} onBack={backToStaffDetail} navigationParams={navigationParams} />;
                case ViewState.STATS: return <AthleteStats onBack={backToStaffDetail} athleteId={selectedAthleteId} />;
                case ViewState.RECOVERY_PLAN: return <RecoveryPlan rpe={7} onComplete={backToStaffDetail} userRole={currentUser?.role || 'STAFF'} />;

                default: return <CoachDashboard
                    userId={userId}
                    currentUser={currentUser}
                    onSelectAthlete={(id) => { setSelectedAthleteId(id); setActiveTab(ViewState.STAFF_ATHLETE_DETAIL); }}
                    onPlanning={(id) => { setSelectedAthleteId(id); setActiveTab(ViewState.STAFF_STRATEGY); }}
                    onNavigate={setActiveTab}
                    onLogout={onLogout}
                />;
            }
        }

        // ATHLETE
        switch (activeTab) {
            case ViewState.DASHBOARD: return <AthleteDashboard onNavigate={(view) => {
                if (view === ViewState.ATHLETE_INPUT) {
                    const isSunday = new Date().getDay() === 0;
                    setCheckInContext(isSunday ? 'WEEKLY' : 'MORNING');
                }
                if (view === ViewState.LOGIN) { onLogout(); return; }
                setActiveTab(view);
            }} userRole={currentUser?.role || 'ATHLETE'} athleteId={userId || ''} />;

            case ViewState.PLANNING: return currentPlan ? <TrainingPlan plan={currentPlan} onLogFeedback={() => {
                setCheckInContext('SESSION');
                setActiveTab(ViewState.ATHLETE_INPUT);
            }} userRole={currentUser?.role || 'ATHLETE'} onBack={goBackToDash} /> : <div>Cargando...</div>;

            case ViewState.VIDEO_ANALYSIS: return <VideoAnalysis userRole={currentUser?.role || 'ATHLETE'} athleteId={userId || ''} onBack={goBackToDash} navigationParams={navigationParams} />;
            case ViewState.STATS: return <AthleteStats athleteId={userId || ''} onBack={goBackToDash} />;
            case ViewState.HEALTH: return <HealthSection onBack={goBackToDash} userRole={currentUser?.role || 'ATHLETE'} athleteId={userId || ''} />;
            case ViewState.ATHLETE_INPUT: return <AthleteCheckIn onComplete={setActiveTab} context={checkInContext} onNavigate={setActiveTab} />;
            case ViewState.RECOVERY_PLAN: return <RecoveryPlan rpe={7} onComplete={() => setActiveTab(ViewState.DASHBOARD)} userRole={currentUser?.role || 'ATHLETE'} />;
            case ViewState.ROUND_TABLE: return <RoundTable athleteId={userId || ''} />;
            case ViewState.TECHNICAL_HUB: return (
                <div className="h-full flex flex-col">
                    <div className="bg-surface p-4 border-b border-white/10">
                        <BackButton onClick={goBackToDash} label="Volver al Hub" />
                    </div>
                    <TechnicalHub />
                </div>
            );
            default: return <AthleteDashboard onNavigate={setActiveTab} userRole={currentUser?.role || 'ATHLETE'} athleteId={userId || ''} />;
        }
    };

    return (
        <div className="h-full w-full relative">
            {renderContent()}
        </div>
    );
};
