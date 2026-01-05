import React, { useState, useEffect, useMemo } from 'react';
import { ViewState } from '../types';
import { Badge } from './common/Atomic';
import { EventBus, useDataRing } from '../services/CoreArchitecture';
import { WidgetFacades } from '../services/WidgetFacades';
import { MacrocycleWidget } from './viz/MacrocycleWidget';
import { PerformanceChart } from './viz/PerformanceChart';

interface AthleteDashboardProps {
    onNavigate: (view: ViewState, params?: any) => void;
    userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN' | 'PENDING';
    athleteId?: string;
}

const AthleteDashboard: React.FC<AthleteDashboardProps> = ({ onNavigate, userRole = 'ATHLETE', athleteId = '1' }) => {

    // ARCHITECTURE: Dashboard consumes FACADES, not DataRing directly
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useDataRing(() => {
        setUpdateTrigger(prev => prev + 1);
        return updateTrigger;
    });

    // Consume facades
    const profileData = useMemo(() => WidgetFacades.profile.getSummary(athleteId), [athleteId, updateTrigger]);
    const healthData = useMemo(() => WidgetFacades.health.getSummary(athleteId), [athleteId, updateTrigger]);
    const videoData = useMemo(() => WidgetFacades.video.getSummary(athleteId), [athleteId, updateTrigger]);
    const recoveryData = useMemo(() => WidgetFacades.recovery.getSummary(athleteId), [athleteId, updateTrigger]);
    const trainingData = useMemo(() => WidgetFacades.training.getSummary(athleteId), [athleteId, updateTrigger]);
    const statsData = useMemo(() => WidgetFacades.stats.getSummary(athleteId), [athleteId, updateTrigger]);
    const macrocycleData = useMemo(() => WidgetFacades.macrocycle.getSummary(athleteId), [athleteId, updateTrigger]);
    const checkInData = useMemo(() => WidgetFacades.checkIn.getSummary(athleteId), [athleteId, updateTrigger]);

    const [strategicTopic, setStrategicTopic] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        let topic = "";
        if (healthData.riskLevel === 'HIGH_RISK') topic = "REDUCCIÓN CRÍTICA DE CARGA";
        else if (healthData.activeInjuries > 0) topic = "REHABILITACIÓN ACTIVA";
        else if (trainingData.phase === 'TAPERING') topic = "PUESTA A PUNTO";
        else if (healthData.acwr > 1.3) topic = "PREVENIR SOBREENTRENAMIENTO";
        else topic = "OPTIMIZACIÓN DE VELOCIDAD";
        setStrategicTopic(topic);

        // SUNDAY AUTOMATION
        const today = new Date();
        const isSunday = today.getDay() === 0; // 0 = Sunday
        const hasCheckedIn = localStorage.getItem(`weekly_checkin_${today.toDateString()}`);

        if (isSunday && !hasCheckedIn) {
            // Auto-trigger Weekly Check-in
            console.log("Sunday Protocol: Triggering Weekly Check-In");
            // We need to set the context via the parent or utilize the onNavigate prop with a param if supported
            // Since onNavigate takes a view, we'll assume the parent handles context state or we modify this flow.
            // For now, checks 'ATHLETE_INPUT' navigation logic in App.tsx

            // To force context WEEKLY, we need to signal App.tsx. 
            // Current App.tsx handles onNavigate(ViewState.ATHLETE_INPUT) -> setCheckInContext('MORNING').
            // We need to override this.

            // HACK: Dispatch custom event or signal via existing props?
            // Cleanest way: App.tsx manages checkInContext. 
            // We will modify onNavigate signature in App.tsx to accept params, OR
            // simply rely on the user manually clicking if we can't force params.
            // Wait, App.tsx line 158: case ... setCheckInContext('MORNING').

            // Better approach: Let's Notify the user via the Dashboard UI prompt if it's Sunday.
            // Or better: Let's modify App.tsx to handle a unique 'WEEKLY_CHECKIN' view or param.
            // Since we can't easily change App.tsx state from here without props loop...

            // Alternative: Override the Check-In Widget click behavior for Sundays
        }
    }, [healthData, trainingData]);

    // NEW HELPER: Check if Sunday for Widget Logic
    const isTodaySunday = new Date().getDay() === 0;

    if (!healthData) return <div className="p-8 text-white font-mono text-xs animate-pulse">LOADING...</div>;

    return (
        <div className="h-full flex flex-col bg-background overflow-y-auto custom-scrollbar">
            <div className="p-3 pb-24 lg:p-6 lg:pb-8 max-w-4xl mx-auto w-full space-y-3">

                {/* GLOBAL HEADER */}
                <div className="flex justify-between items-center py-2 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="size-2 bg-volt rounded-full shadow-[0_0_10px_#D1F349]"></div>
                        <h1 className="text-lg font-black italic tracking-tighter text-white uppercase">
                            Elite <span className="text-volt">Gravity</span>
                        </h1>
                    </div>
                    {/* Profile Menu - Only for Athletes */}
                    {userRole === 'ATHLETE' && (
                        <div className="flex items-center gap-2 relative">
                            {/* Profile Dropdown Logic */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`size-9 rounded-xl flex items-center justify-center transition-all bg-white/5 border border-white/10 hover:bg-white/10 ${isMenuOpen ? 'border-volt/50 shadow-glow-volt/20' : ''}`}
                                >
                                    <img src={profileData.imgUrl} className="size-6 rounded-lg object-cover border border-white/20" />
                                    <span className={`material-symbols-outlined text-xs absolute -bottom-1 -right-1 bg-black rounded-full text-volt transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>

                                {/* DROPDOWN MENU */}
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                                        <div className="absolute right-0 mt-2 w-48 bg-[#0B1219]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                            <div className="px-3 py-2 border-b border-white/5 mb-1">
                                                <p className="text-[10px] font-black text-white uppercase truncate">{profileData.name}</p>
                                                <p className="text-[8px] text-slate-500 uppercase tracking-tighter">Plan {trainingData.phase}</p>
                                            </div>

                                            <button
                                                onClick={() => { onNavigate(ViewState.ATHLETE_PROFILE); setIsMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
                                            >
                                                <span className="material-symbols-outlined text-sm group-hover:text-volt">person</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Mi Perfil</span>
                                            </button>

                                            <button
                                                onClick={() => { onNavigate(ViewState.SYSTEM_INFO); setIsMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all group"
                                            >
                                                <span className="material-symbols-outlined text-sm group-hover:text-volt">terminal</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Hub Técnico</span>
                                            </button>

                                            <div className="h-px bg-white/5 my-1"></div>

                                            <button
                                                onClick={() => { onNavigate(ViewState.LOGIN); setIsMenuOpen(false); }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-danger/10 text-danger transition-all group"
                                            >
                                                <span className="material-symbols-outlined text-sm">logout</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 1. PERFIL DEL ATLETA */}
                <div
                    className="glass-card p-3 rounded-xl cursor-pointer hover:border-primary/30 border border-white/5 transition-all group"
                    onClick={() => onNavigate(ViewState.ATHLETE_PROFILE)}
                >
                    <div className="flex items-start gap-3 mb-3">
                        {/* Photo */}
                        <div className="relative size-14 shrink-0">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary to-volt blur opacity-30"></div>
                            <div className="absolute inset-[2px] rounded-xl bg-black overflow-hidden">
                                <img src={profileData.imgUrl} alt={profileData.name} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background flex items-center justify-center ${profileData.status === 'HIGH_RISK' ? 'bg-danger' : profileData.status === 'CAUTION' ? 'bg-warning' : 'bg-success'}`}>
                                <span className="material-symbols-outlined text-[8px] text-white">
                                    {profileData.status === 'OPTIMAL' ? 'check' : 'warning'}
                                </span>
                            </div>
                        </div>

                        {/* Name + Stats */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black text-white uppercase tracking-tight truncate">{profileData.name}</h2>
                                <span className="material-symbols-outlined text-slate-500 group-hover:text-primary text-sm">chevron_right</span>
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-slate-400 mt-1">
                                <span>{profileData.age} años</span>
                                <span>{profileData.yearsExperience} años exp</span>
                                <span>{profileData.height}</span>
                                <span>{profileData.weight}</span>
                            </div>
                        </div>
                    </div>

                    {/* Events + PBs */}
                    <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
                        {profileData.events.map((e, i) => (
                            <div key={i} className="bg-black/50 border border-white/10 px-2 py-1 rounded-lg shrink-0">
                                <span className="text-[9px] text-slate-500">{e.name}</span>
                                <span className="text-[10px] text-volt font-mono font-black ml-1">{e.pb}</span>
                            </div>
                        ))}
                    </div>

                    {/* Available Days */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[8px] text-slate-500 uppercase">Días:</span>
                        <div className="flex gap-1">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                                <div
                                    key={day}
                                    className={`size-5 rounded text-[8px] font-black flex items-center justify-center ${profileData.availableDays.includes(day)
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-white/[0.02] text-slate-700'
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Competitions */}
                    {profileData.upcomingCompetitions.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-warning text-sm">flag</span>
                            <div className="flex gap-2 overflow-x-auto">
                                {profileData.upcomingCompetitions.map((comp, i) => (
                                    <Badge key={i} variant="warning" className="text-[8px] shrink-0">{comp.name}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. TODAY'S PLAN WIDGET */}
                <div
                    className="glass-card p-3 rounded-xl cursor-pointer hover:border-primary/30 border border-white/5 transition-all"
                    onClick={() => onNavigate(ViewState.PLANNING)}
                >
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Badge variant="volt" className="text-[8px] py-0 px-1.5">{trainingData.phase}</Badge>
                                <span className="text-[10px] text-slate-500">{trainingData.nextSession?.day || 'Hoy'}</span>
                            </div>
                            <h2 className="text-white font-black text-sm uppercase tracking-tight mt-1">
                                {trainingData.nextSession?.title || 'Plan de Entrenamiento'}
                            </h2>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 text-sm">arrow_outward</span>
                    </div>

                    {/* Expanded Plan Details - All 4 Phases */}
                    {trainingData.todaySession?.structure && (
                        <div className="space-y-2 mb-3">
                            {/* FASE A: RAMP */}
                            {trainingData.todaySession.structure.ramp && trainingData.todaySession.structure.ramp !== 'OFF' && (
                                <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-500 pl-2 py-1.5 rounded-r">
                                    <p className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider mb-0.5">🏃 Fase A: RAMP</p>
                                    <p className="text-[9px] text-white/80 leading-relaxed">
                                        {trainingData.todaySession.structure.ramp.split('\n').slice(0, 4).join(' • ')}
                                    </p>
                                </div>
                            )}

                            {/* FASE B: Track Work */}
                            {trainingData.todaySession.structure.track && trainingData.todaySession.structure.track !== 'OFF' && (
                                <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500 pl-2 py-1.5 rounded-r">
                                    <p className="text-[8px] text-orange-400 font-bold uppercase tracking-wider mb-0.5">🔥 Fase B: Trabajo Específico</p>
                                    <p className="text-[9px] text-white/90 leading-relaxed">
                                        {trainingData.todaySession.structure.track.split('\n').slice(0, 4).join(' • ')}
                                    </p>
                                </div>
                            )}

                            {/* FASE C: Transfer */}
                            {trainingData.todaySession.structure.transfer &&
                                trainingData.todaySession.structure.transfer !== 'OFF' &&
                                !trainingData.todaySession.structure.transfer.includes('N/A') && (
                                    <div className="bg-gradient-to-r from-green-500/10 to-transparent border-l-2 border-green-500 pl-2 py-1.5 rounded-r">
                                        <p className="text-[8px] text-green-400 font-bold uppercase tracking-wider mb-0.5">⚡ Fase C: Transferencia</p>
                                        <p className="text-[9px] text-white/80 leading-relaxed">
                                            {trainingData.todaySession.structure.transfer.split('\n').slice(0, 3).join(' • ')}
                                        </p>
                                    </div>
                                )}

                            {/* FASE D: Gym Work */}
                            {trainingData.todaySession.structure.gym &&
                                trainingData.todaySession.structure.gym !== 'OFF' &&
                                !trainingData.todaySession.structure.gym.includes('OFF -') && (
                                    <div className="bg-gradient-to-r from-purple-500/10 to-transparent border-l-2 border-purple-500 pl-2 py-1.5 rounded-r">
                                        <p className="text-[8px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">💪 Fase D: Gimnasio</p>
                                        <p className="text-[9px] text-white/90 leading-relaxed">
                                            {trainingData.todaySession.structure.gym.split('\n').slice(0, 3).join(' • ')}
                                        </p>
                                    </div>
                                )}
                        </div>
                    )}


                    {/* Macrocycle Chart - Synced with current week */}
                    <div className="h-40 rounded-lg overflow-hidden">
                        <MacrocycleWidget
                            key={`macrocycle-${athleteId}-${updateTrigger}`}
                            athleteId={athleteId}
                            height={160}
                            showLegend={true}
                            currentWeek={(() => {
                                const today = new Date();
                                const startOfYear = new Date(today.getFullYear(), 0, 1);
                                const weekNumber = Math.ceil(
                                    (today.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000)
                                );
                                return ((weekNumber - 1) % 8) + 1;
                            })()}
                        />
                    </div>
                </div>

                {/* 3. STATS WIDGET */}
                <div
                    className="glass-card p-3 rounded-xl cursor-pointer hover:border-primary/30 border border-white/5 transition-all"
                    onClick={() => onNavigate(ViewState.STATS)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Rendimiento</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-mono font-black ${statsData.trend === 'up' ? 'text-success' : 'text-white'}`}>
                                    {statsData.bestTime100m?.toFixed(2) || '--'}s
                                </span>
                                <span className={`material-symbols-outlined text-sm ${statsData.trend === 'up' ? 'text-success' : 'text-slate-500'}`}>
                                    {statsData.trend === 'up' ? 'trending_up' : statsData.trend === 'down' ? 'trending_down' : 'trending_flat'}
                                </span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-500 text-sm">arrow_outward</span>
                    </div>
                    <div className="h-20 bg-black/40 rounded-lg border border-white/5 overflow-hidden">
                        {statsData.chartData && statsData.chartData.length > 0 ? (() => {
                            // Group data by event to create series
                            const eventGroups = new Map<string, any[]>();
                            statsData.chartData.forEach((point: any) => {
                                const eventName = point.event || '100m';
                                if (!eventGroups.has(eventName)) {
                                    eventGroups.set(eventName, []);
                                }
                                eventGroups.get(eventName)!.push(point);
                            });

                            // Convert to series format
                            const series = Array.from(eventGroups.entries()).map(([event, data]) => ({
                                id: event,
                                data: data,
                                color: data[0]?.color || '#67e8f9'
                            }));

                            return (
                                <PerformanceChart
                                    series={series}
                                    height="100%"
                                />
                            );
                        })() : (
                            <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">
                                SIN DATOS SUFICIENTES
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. COMPACT WIDGETS GRID (2x2) */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Health/Injuries Widget */}
                    <div
                        className={`glass-card p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-2 ${healthData.activeInjuries > 0 ? 'border-danger/30 bg-danger/[0.02]' : 'border-white/5 hover:border-primary/30'}`}
                        onClick={() => onNavigate(ViewState.HEALTH)}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Salud</span>
                            <Badge variant={healthData.activeInjuries > 0 ? 'danger' : 'neutral'} className="text-[8px]">
                                {healthData.activeInjuries > 0 ? `${healthData.activeInjuries} lesión` : 'OK'}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-lg ${healthData.activeInjuries > 0 ? 'text-danger' : 'text-primary'}`}>
                                {healthData.activeInjuries > 0 ? 'healing' : 'monitoring'}
                            </span>
                            <div>
                                <p className="text-lg font-mono font-black text-white">{healthData.acwr}</p>
                                <p className="text-[8px] text-slate-500">ACWR</p>
                            </div>
                        </div>
                    </div>

                    {/* Video Widget */}
                    <div
                        className="glass-card p-3 rounded-xl cursor-pointer border-white/5 hover:border-info/30 transition-all flex flex-col gap-2"
                        onClick={() => onNavigate(ViewState.VIDEO_ANALYSIS)}
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Video</span>
                            {videoData.pendingCorrections > 0 && (
                                <Badge variant="volt" className="text-[8px] animate-pulse">{videoData.pendingCorrections} nuevo</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg text-info">videocam</span>
                            <div>
                                <p className="text-lg font-mono font-black text-white">{videoData.totalAnalyses}</p>
                                <p className="text-[8px] text-slate-500">análisis</p>
                            </div>
                        </div>
                    </div>

                    {/* Recovery Widget - Icons only */}
                    <div
                        className="glass-card p-3 rounded-xl cursor-pointer border-white/5 hover:border-success/30 transition-all"
                        onClick={() => onNavigate(ViewState.RECOVERY_PLAN)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] text-slate-500 uppercase">Recovery</span>
                            <span className={`text-sm font-mono font-black ${recoveryData.hrv < 60 ? 'text-warning' : 'text-success'}`}>{recoveryData.hrv}%</span>
                        </div>
                        <div className="flex gap-1.5">
                            {recoveryData.activeIcons.map((icon, i) => (
                                <div key={i} className="size-7 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-success text-sm">{icon}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Check-In Widget - Animated for Athletes, History for Staff */}
                    <div
                        className={`glass-card p-3 rounded-xl transition-all flex flex-col justify-between ${userRole === 'ATHLETE'
                                ? `cursor-pointer ${checkInData.isPending ? 'border-volt/40 bg-volt/[0.03]' : 'border-white/5'}`
                                : 'border-white/5 bg-info/[0.02]'
                            }`}
                        onClick={() => userRole === 'ATHLETE' && onNavigate(ViewState.ATHLETE_INPUT)}
                    >
                        <div className="flex justify-between items-center">
                            <span className={`material-symbols-outlined text-lg ${userRole === 'ATHLETE'
                                    ? (checkInData.isPending ? 'text-volt animate-bounce' : 'text-slate-500')
                                    : 'text-info'
                                }`}>
                                {userRole === 'ATHLETE'
                                    ? (checkInData.isPending ? 'add_task' : 'task_alt')
                                    : 'history'
                                }
                            </span>
                            {userRole === 'ATHLETE' && checkInData.isPending && (
                                <div className="flex gap-0.5">
                                    <div className="size-1.5 rounded-full bg-volt animate-pulse"></div>
                                    <div className="size-1.5 rounded-full bg-volt animate-pulse delay-75"></div>
                                    <div className="size-1.5 rounded-full bg-volt animate-pulse delay-150"></div>
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase">
                                {userRole === 'ATHLETE' ? 'Check-In' : 'Historial'}
                            </p>
                            <p className={`text-[9px] ${userRole === 'ATHLETE'
                                    ? (checkInData.isPending ? 'text-volt' : 'text-slate-500')
                                    : 'text-info'
                                }`}>
                                {userRole === 'ATHLETE'
                                    ? (checkInData.isPending ? 'Pendiente' : 'Completado')
                                    : 'Próximamente'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* 5. AI FOCUS (compact) */}
                <div
                    className="glass-card p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:border-primary/30 border border-white/5 transition-all"
                    onClick={() => onNavigate(ViewState.ROUND_TABLE)}
                >
                    <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-sm">psychology</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest">Enfoque IA</p>
                        <p className="text-[10px] text-white font-mono truncate">{strategicTopic}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-500 text-sm">forum</span>
                </div>

            </div>
        </div>
    );
};

export default AthleteDashboard;