import React, { useState, useEffect } from 'react';
import { DataRing } from '../services/CoreArchitecture';
import { AthleteProfile, TrainingPlan, ViewState } from '../types';
import { Card, Badge, Button } from './common/Atomic';
import { MacrocycleChart } from './viz/MacrocycleChart';
import { PerformanceChart } from './viz/PerformanceChart';
import { chatService } from '../services/ChatService';
import NotificationBell from './notifications/NotificationBell';
import ActivityFeed from './ActivityFeed';

interface CoachDashboardProps {
    onSelectAthlete: (athleteId: string) => void;
    onPlanning: (athleteId: string) => void;
    onNavigate?: (view: ViewState, athleteId?: string) => void;
    onLogout?: () => void;
}

interface AthleteRosterItem {
    id: string;
    name: string;
    status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    acwr: number;
    readiness: number;
    lastActivity: string;
    complianceScore: number;
    avatarUrl: string;
    nextSession: string;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ onSelectAthlete, onPlanning, onNavigate, onLogout }) => {
    const [roster, setRoster] = useState<AthleteRosterItem[]>([]);
    const [allAthletes, setAllAthletes] = useState<any[]>([]); // Store raw athletes for requests
    const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
    const [newAthlete, setNewAthlete] = useState({
        name: '',
        age: '',
        experienceYears: '',
        specialty: '100m'
    });

    useEffect(() => {
        const loadData = async () => {
            // Ensure we have fresh data
            await DataRing.refreshCache();
            const athletes = DataRing.getAllAthletes();
            setAllAthletes(athletes);

            if (athletes.length === 0) {
                // Return dummy data if empty but keeping structure
                setRoster([]);
                return;
            }

            // Map to roster items
            const realRoster: AthleteRosterItem[] = athletes.map(a => ({
                id: a.id,
                name: a.name,
                status: (a.acwr || 0) > 1.3 ? 'WARNING' : ((a.readiness || 0) < 50 ? 'CRITICAL' : 'OPTIMAL'),
                acwr: a.acwr || 0,
                readiness: a.readiness || 0,
                lastActivity: 'Today', // Mock
                complianceScore: 85,   // Mock
                avatarUrl: a.imgUrl || `https://ui-avatars.com/api/?name=${a.name}&background=random`,
                nextSession: 'Training' // Mock
            }));

            setRoster(realRoster);
        };
        loadData();
    }, []);

    // Fetch unread message count for coach
    const [unreadCounts, setUnreadCounts] = useState<{ [athleteId: string]: number }>({});
    const coachId = '1'; // TODO: Get actual coach ID from auth

    useEffect(() => {
        const fetchUnreadCounts = async () => {
            try {
                // Subscribe to all chat rooms for this coach
                const unsubscribe = chatService.subscribeToRooms(coachId, (rooms) => {
                    const counts: { [athleteId: string]: number } = {};
                    rooms.forEach(room => {
                        // Find the athlete ID (the participant that's not the coach)
                        const athleteId = room.participants.find(p => p !== coachId);
                        if (athleteId) {
                            counts[athleteId] = room.unreadCount[coachId] || 0;
                        }
                    });
                    setUnreadCounts(counts);
                });

                return unsubscribe;
            } catch (error) {
                console.error('Error fetching unread counts:', error);
            }
        };

        const unsubscribe = fetchUnreadCounts();
        return () => {
            if (unsubscribe) {
                unsubscribe.then(unsub => unsub?.());
            }
        };
    }, [coachId]);

    // Incoming Requests (Athlete -> Coach)
    const incomingRequests = allAthletes.flatMap(a =>
        (a.pendingLinkRequests || [])
            .filter((r: any) => r.status === 'PENDING' && r.direction === 'OUTGOING')
            .map((r: any) => ({ athlete: a, request: r }))
    );

    const handleAcceptRequest = (athleteId: string, requestId: string) => {
        DataRing.ingestData('MODULE_PROFILE', 'LINK_REQUEST', {
            action: 'ACCEPT',
            athleteId,
            requestId,
            staffMember: {
                id: '1', // Current coach ID
                name: 'Coach Principal',
                role: 'Entrenador Principal',
                email: 'coach@example.com',
                phone: '',
                imgUrl: 'https://ui-avatars.com/api/?name=Coach+Principal&background=random'
            }
        });
        alert('✅ Solicitud aceptada');
        // Refresh data
        setTimeout(() => {
            const updated = DataRing.getAllAthletes();
            setAllAthletes(updated);
        }, 500);
    };

    const handleRejectRequest = (athleteId: string, requestId: string) => {
        DataRing.ingestData('MODULE_PROFILE', 'LINK_REQUEST', {
            action: 'REJECT',
            athleteId,
            requestId
        });
        alert('❌ Solicitud rechazada');
        // Refresh data
        setTimeout(() => {
            const updated = DataRing.getAllAthletes();
            setAllAthletes(updated);
        }, 500);
    };

    const filteredRoster = roster.filter(a => {
        if (filter === 'ALL') return true;
        return a.status === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CRITICAL': return 'bg-danger text-white shadow-glow-danger';
            case 'WARNING': return 'bg-warning text-black shadow-glow-warning';
            default: return 'bg-success text-black shadow-glow-success';
        }
    };

    const handleLinkAthlete = () => {
        if (!newAthlete.name) {
            alert('Por favor ingresa el email o ID del atleta');
            return;
        }

        // Link existing athlete via DataRing
        DataRing.ingestData('MODULE_PROFILE', 'ATHLETE_LINK', {
            athleteIdentifier: newAthlete.name, // Can be email or ID
            coachId: '1' // Current coach ID
        });

        // Reset form and close modal
        setNewAthlete({ name: '', age: '', experienceYears: '', specialty: '100m' });
        setShowNewAthleteModal(false);

        // Refresh roster (in real app, this would be automatic via DataRing subscription)
        alert('Solicitud de vinculación enviada');
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-8 overflow-hidden font-display">
            {/* HEADER */}
            <div className="bg-surface border-b border-white/5 px-4 py-3 md:py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="size-8 md:size-9 bg-volt flex items-center justify-center rounded-lg shadow-glow-volt rotate-3">
                        <span className="material-symbols-outlined text-black font-black text-sm md:text-base">bolt</span>
                    </div>
                    <div>
                        <h1 className="text-white font-black italic tracking-tighter text-lg md:text-2xl lg:text-3xl leading-tight uppercase font-display">
                            COMMAND <span className="text-volt">CENTER</span>
                        </h1>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-success animate-pulse"></span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowNewAthleteModal(true)}
                                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-volt text-black font-bold text-xs md:text-sm hover:bg-volt/90 transition-all flex items-center gap-2 shadow-glow-volt"
                                >
                                    <span className="material-symbols-outlined text-sm md:text-base">person_add</span>
                                    <span className="hidden sm:inline">VINCULAR ATLETA</span>
                                    <span className="sm:hidden">VINCULAR</span>
                                </button>

                                {/* View Toggle - Improved touch targets */}
                                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 md:p-1.5 rounded min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-volt text-black' : 'text-slate-500 hover:text-white'
                                            }`}
                                        title="Vista Grid"
                                    >
                                        <span className="material-symbols-outlined text-lg md:text-base">grid_view</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 md:p-1.5 rounded min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-volt text-black' : 'text-slate-500 hover:text-white'
                                            }`}
                                        title="Vista Lista"
                                    >
                                        <span className="material-symbols-outlined text-lg md:text-base">view_list</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {/* Incoming Requests Badge */}
                                {incomingRequests.length > 0 && (
                                    <div className="flex items-center gap-2 bg-warning/10 border border-warning/20 px-3 py-1 rounded-xl mr-2">
                                        <span className="material-symbols-outlined text-warning animate-pulse text-lg">notifications_active</span>
                                        <span className="text-white text-[10px] font-bold">{incomingRequests.length} Solicitudes</span>
                                        <div className="flex -space-x-2">
                                            {incomingRequests.map((item, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => {
                                                        if (confirm(`¿Aceptar vinculación con ${item.athlete.name}?`)) {
                                                            handleAcceptRequest(item.athlete.id, item.request.id);
                                                        }
                                                    }}
                                                    className="size-6 rounded-full border border-black bg-slate-700 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform cursor-pointer z-10"
                                                    title={`Aceptar a ${item.athlete.name}`}
                                                >
                                                    <img src={item.athlete.imgUrl || `https://ui-avatars.com/api/?name=${item.athlete.name}&background=random`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                {/* Removed duplicate button - keeping the one at top left with better styling */}
                                {['ALL', 'WARNING', 'CRITICAL'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all border ${filter === f
                                            ? 'bg-white text-black border-white'
                                            : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30 hover:text-white'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* LINK ATHLETE MODAL */}
                        {
                            showNewAthleteModal && (
                                <>
                                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={() => setShowNewAthleteModal(false)}></div>
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                        <div className="glass-card p-6 rounded-2xl max-w-md w-full space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-white text-lg font-black uppercase">Vincular Atleta</h3>
                                                <button onClick={() => setShowNewAthleteModal(false)} className="text-slate-400 hover:text-white">
                                                    <span className="material-symbols-outlined">close</span>
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Email o ID del Atleta</label>
                                                    <input
                                                        type="text"
                                                        placeholder="ejemplo@email.com o ID: 12345"
                                                        className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-lg text-sm text-white focus:border-volt outline-none"
                                                        value={newAthlete.name}
                                                        onChange={e => setNewAthlete({ ...newAthlete, name: e.target.value })}
                                                    />
                                                    <p className="text-[9px] text-slate-500 mt-1">Ingresa el email o ID del atleta existente que deseas vincular a tu roster</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => setShowNewAthleteModal(false)}
                                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-bold hover:bg-white/10 transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleLinkAthlete}
                                                    className="flex-1 px-4 py-2 bg-volt text-black rounded-lg text-sm font-bold hover:bg-volt/80 transition-all"
                                                >
                                                    Vincular
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )
                        }

                        {/* ROSTER GRID/LIST */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                                {/* Athlete Roster - Takes 2 columns on large screens */}
                                <div className={`lg:col-span-2 ${viewMode === 'grid'
                                    ? "grid grid-cols-1 md:grid-cols-2 gap-4 content-start"
                                    : "flex flex-col gap-3"
                                    }`}>
                                    {filteredRoster.map(athlete => (
                                        <div
                                            key={athlete.id}
                                            onClick={() => onSelectAthlete(athlete.id)}
                                            className={`group relative glass-card overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 active:scale-[0.98] ${viewMode === 'grid'
                                                ? 'p-0 rounded-2xl'
                                                : 'p-4 rounded-xl flex items-center gap-4'
                                                }`}
                                        >
                                            {/* StatusBar */}
                                            <div className={viewMode === 'grid'
                                                ? `h-1 w-full ${athlete.status === 'CRITICAL' ? 'bg-danger' : athlete.status === 'WARNING' ? 'bg-warning' : 'bg-success'}`
                                                : `w-1 h-full absolute left-0 top-0 ${athlete.status === 'CRITICAL' ? 'bg-danger' : athlete.status === 'WARNING' ? 'bg-warning' : 'bg-success'}`
                                            }></div>


                                            <div className={viewMode === 'grid'
                                                ? "p-4 flex flex-col h-full"
                                                : "flex items-center gap-4 flex-1 pl-3"
                                            }>
                                                {/* Header - Compact */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-12 rounded-xl overflow-hidden border-2 border-white/10">
                                                            <img src={athlete.avatarUrl} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-white font-black uppercase text-sm leading-tight">{athlete.name}</h3>
                                                            <span className="text-[9px] text-slate-500 font-mono">Última: {athlete.lastActivity}</span>
                                                        </div>
                                                    </div>
                                                    <Badge className={`text-[7px] font-black tracking-widest px-2 py-0.5 ${getStatusColor(athlete.status)}`}>
                                                        {athlete.status}
                                                    </Badge>
                                                </div>

                                                {/* Info Badges - Useful Information */}
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {/* Event Badge */}
                                                    <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-primary text-xs">event</span>
                                                        <span className="text-[8px] text-primary font-bold">100m, 200m</span>
                                                    </div>

                                                    {/* Next Competition */}
                                                    <div className="flex items-center gap-1 bg-info/10 border border-info/20 px-2 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-info text-xs">emoji_events</span>
                                                        <span className="text-[8px] text-info font-bold">15 Ene</span>
                                                    </div>

                                                    {/* Videos to Review */}
                                                    <div className="flex items-center gap-1 bg-warning/10 border border-warning/20 px-2 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-warning text-xs">videocam</span>
                                                        <span className="text-[8px] text-warning font-bold">3 nuevos</span>
                                                    </div>

                                                    {/* Injury Status - Only show if injured */}
                                                    {/* <div className="flex items-center gap-1 bg-danger/10 border border-danger/20 px-2 py-1 rounded-md">
                                        <span className="material-symbols-outlined text-danger text-xs">healing</span>
                                        <span className="text-[8px] text-danger font-bold">Isquio</span>
                                    </div> */}
                                                </div>

                                                {/* Metrics Grid - Compact */}
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                                        <div className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">ACWR</div>
                                                        <div className={`text-lg font-black italic ${athlete.acwr > 1.5 || athlete.acwr < 0.8 ? 'text-danger' : 'text-white'}`}>
                                                            {athlete.acwr}
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                                        <div className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Ready</div>
                                                        <div className={`text-lg font-black italic ${athlete.readiness < 60 ? 'text-danger' : 'text-white'}`}>
                                                            {athlete.readiness}%
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                                        <div className="text-[7px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Comp</div>
                                                        <div className="text-lg font-black italic text-white">
                                                            {athlete.complianceScore}%
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Next Session */}
                                                <div className="flex items-center justify-between text-[9px] border-t border-white/5 pt-2 mb-3">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider">Próximo</span>
                                                    <span className="text-primary font-mono font-black truncate max-w-[120px]">{athlete.nextSession}</span>
                                                </div>

                                                {/* Action Buttons - Clear and Distinct */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSelectAthlete(athlete.id); }}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-lg transition-all group"
                                                    >
                                                        <span className="material-symbols-outlined text-sm text-white group-hover:text-primary">visibility</span>
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-white group-hover:text-primary">Monitor</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onPlanning(athlete.id); }}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary rounded-lg transition-all group"
                                                    >
                                                        <span className="material-symbols-outlined text-sm text-primary group-hover:text-white">map</span>
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-primary group-hover:text-white">Strategy</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Navigate to chat with this specific athlete
                                                            if (onNavigate) {
                                                                onNavigate(ViewState.DIRECT_CHAT, athlete.id);
                                                            }
                                                        }}
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-volt/10 hover:bg-volt/20 border border-volt/20 hover:border-volt rounded-lg transition-all group relative"
                                                        title="Chat con Atleta"
                                                    >
                                                        <span className="material-symbols-outlined text-sm text-volt group-hover:text-white">chat</span>
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-volt group-hover:text-white">Chat</span>
                                                        {(unreadCounts[athlete.id] || 0) > 0 && (
                                                            <div className="absolute -top-1 -right-1 size-4 bg-danger rounded-full flex items-center justify-center border border-background">
                                                                <span className="text-[8px] font-black text-white">
                                                                    {unreadCounts[athlete.id] > 9 ? '9+' : unreadCounts[athlete.id]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Activity Feed - Side Panel */}
                                <div className="hidden lg:block lg:col-span-1">
                                    <div className="glass-card p-4 rounded-2xl h-full sticky top-4">
                                        <ActivityFeed userId="COACH_UID" userRole="STAFF" limit={15} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Footer */}
                        <div className="h-12 border-t border-white/10 mt-4 flex items-center justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest">
                            <div>Total Athletes: {roster.length}</div>
                            <div className="flex gap-4">
                                <span className="text-danger flex items-center gap-1"><span className="size-2 rounded-full bg-danger"></span> Critical: {roster.filter(a => a.status === 'CRITICAL').length}</span>
                                <span className="text-warning flex items-center gap-1"><span className="size-2 rounded-full bg-warning"></span> Warning: {roster.filter(a => a.status === 'WARNING').length}</span>
                                <span className="text-success flex items-center gap-1"><span className="size-2 rounded-full bg-success"></span> Optimal: {roster.filter(a => a.status === 'OPTIMAL').length}</span>
                            </div>
                        </div>
                    </div >
                    );
};

                    export default CoachDashboard;

