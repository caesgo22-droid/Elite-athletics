import React, { useState, useEffect } from 'react';
import { DataRing } from '../services/CoreArchitecture';
import { AthleteProfile, TrainingPlan } from '../types';
import { Card, Badge, Button } from './common/Atomic';
import { MacrocycleChart } from './viz/MacrocycleChart';
import { PerformanceChart } from './viz/PerformanceChart';

interface CoachDashboardProps {
    onSelectAthlete: (athleteId: string) => void;
    onPlanning: (athleteId: string) => void;
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

const CoachDashboard: React.FC<CoachDashboardProps> = ({ onSelectAthlete, onPlanning }) => {
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
            {/* HUD HEADER */}
            <div className="flex justify-between items-end mb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-xl animate-pulse">hub</span>
                        <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter">Command Center</h2>
                    </div>
                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest font-bold">
                        Global Roster Status // Active Monitoring
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* View Toggle */}
                    <div className="flex gap-1 bg-black/40 p-1 rounded-lg mr-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${viewMode === 'grid' ? 'bg-volt text-black' : 'text-slate-500 hover:text-white'}`}
                            title="Vista de cuadrícula"
                        >
                            <span className="material-symbols-outlined text-sm">grid_view</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${viewMode === 'list' ? 'bg-volt text-black' : 'text-slate-500 hover:text-white'}`}
                            title="Vista de lista"
                        >
                            <span className="material-symbols-outlined text-sm">view_list</span>
                        </button>
                    </div>

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

                    <button
                        onClick={() => setShowNewAthleteModal(true)}
                        className="px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-all border bg-volt text-black border-volt hover:bg-volt/80 flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">link</span>
                        Vincular Atleta
                    </button>
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
            {showNewAthleteModal && (
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
            )}

            {/* ROSTER GRID/LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-col gap-3"
                }>
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
                                ? "p-5 flex flex-col h-full bg-gradient-to-b from-white/5 to-transparent"
                                : "flex items-center gap-4 flex-1 pl-3"
                            }>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full p-[1px] bg-gradient-to-br from-white/20 to-transparent">
                                            <img src={athlete.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black italic uppercase text-lg leading-none">{athlete.name}</h3>
                                            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">ID: {athlete.id}</span>
                                        </div>
                                    </div>
                                    <Badge className={`text-[8px] font-black tracking-widest backdrop-blur-md border-0 ${getStatusColor(athlete.status)}`}>
                                        {athlete.status}
                                    </Badge>
                                </div>

                                {/* ... in main component ...*/}
                                <div className="grid grid-cols-1 gap-2 mb-4">
                                    <div className="h-16 w-full">
                                        <MacrocycleChart
                                            dataPoints={[20, 30, 40, 60, 80, 50, 40]}
                                            projectedDataPoints={[40, 50, 60]}
                                            height={60}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">ACWR</div>
                                        <div className={`text-xl font-black italic ${athlete.acwr > 1.5 || athlete.acwr < 0.8 ? 'text-danger' : 'text-white'}`}>
                                            {athlete.acwr}
                                        </div>
                                    </div>
                                    <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                                        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Readiness</div>
                                        <div className={`text-xl font-black italic ${athlete.readiness < 60 ? 'text-danger' : 'text-white'}`}>
                                            {athlete.readiness}%
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto space-y-2">
                                    <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                                        <span className="text-slate-500 font-bold">Compliance</span>
                                        <span className="text-white font-mono font-black">{athlete.complianceScore}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-slate-500 font-bold">Next</span>
                                        <span className="text-primary font-mono font-black truncate max-w-[100px] text-right">{athlete.nextSession}</span>
                                    </div>
                                </div>

                                {/* Hover Action */}
                                <div className="absolute inset-0 bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                                    <span className="text-black font-black uppercase tracking-widest text-sm flex flex-col gap-3">
                                        <button className="flex items-center gap-2 hover:text-white transition-colors">
                                            Monitor <span className="material-symbols-outlined">visibility</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onPlanning(athlete.id); }}
                                            className="flex items-center gap-2 hover:text-white transition-colors"
                                        >
                                            Strategy <span className="material-symbols-outlined">map</span>
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
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
