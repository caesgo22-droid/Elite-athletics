import React, { useState, useEffect } from 'react';
import { WeeklyPlan, TrainingSession } from '../types';
import { Badge } from './common/Atomic';
import { DataRing, EventBus } from '../services/CoreArchitecture';
import { MacrocycleWidget } from './viz/MacrocycleWidget';

interface TrainingPlanProps {
    plan: WeeklyPlan;
    onLogFeedback: () => void;
    userRole?: 'ATHLETE' | 'STAFF';
    onBack?: () => void;
}



const TrainingPlan: React.FC<TrainingPlanProps> = ({ plan, onLogFeedback, userRole = 'ATHLETE', onBack }) => {
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['JUE']));
    const [isEditing, setIsEditing] = useState(false);
    const [localSessions, setLocalSessions] = useState(plan.sessions);
    const athlete = DataRing.getAthlete(plan.athleteId);

    useEffect(() => { setLocalSessions(plan.sessions); }, [plan]);

    const toggleDay = (day: string) => {
        setExpandedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(day)) newSet.delete(day);
            else newSet.add(day);
            return newSet;
        });
    };

    const handleEditSession = (id: string, field: keyof TrainingSession, value: any) => {
        setLocalSessions(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handlePublish = async () => {
        if (window.confirm('¿Publicar cambios?')) {
            await DataRing.publishWeeklyPlan({ ...plan, sessions: localSessions });
            EventBus.publish('UI_FEEDBACK', { message: 'Plan publicado', type: 'success' });
            setIsEditing(false);
        }
    };

    const DAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
    const typeColors: Record<string, { bg: string; border: string; text: string }> = {
        'SPEED': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400' },
        'STRENGTH': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
        'ENDURANCE': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
        'TECHNIQUE': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
        'RECOVERY': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    };

    return (
        <div className="h-full bg-background overflow-y-auto custom-scrollbar">
            <div className="max-w-lg mx-auto p-3 pb-24 space-y-3">

                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 z-10 bg-gradient-to-b from-background via-background to-transparent py-3 -mx-3 px-3">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <button onClick={onBack} className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                            </button>
                        )}
                        <div>
                            <p className="text-[9px] text-primary uppercase tracking-widest font-bold">Entrenamiento</p>
                            <h1 className="text-lg font-black text-white uppercase tracking-tight">Macrociclo</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {userRole === 'STAFF' && (
                            <button onClick={() => setIsEditing(!isEditing)} className={`size-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-primary text-black' : 'bg-white/5 border border-white/10 text-slate-400'}`}>
                                <span className="material-symbols-outlined text-base">{isEditing ? 'close' : 'edit'}</span>
                            </button>
                        )}
                        {isEditing && (
                            <button onClick={handlePublish} className="px-4 py-2 bg-success text-black rounded-xl text-[9px] font-bold uppercase tracking-wider">Publicar</button>
                        )}
                        <button
                            onClick={() => DataRing.regeneratePlan(plan.athleteId, plan.trainingPhase)}
                            className="px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/50 rounded-xl flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all shadow-glow-purple/20"
                            title="Regenerar con IA (Optimizado para Periodización)"
                        >
                            <span className="material-symbols-outlined text-base">smart_toy</span>
                        </button>
                    </div>

                </div>

                {/* Macrocycle Chart */}
                <div className="glass-card rounded-2xl overflow-hidden border border-cyan-500/20">
                    <div className="h-48 w-full bg-gradient-to-b from-slate-900/80 to-background">
                        <MacrocycleWidget athleteId={plan.athleteId} height={192} showLegend={true} currentWeek={4} />
                    </div>
                </div>

                {/* Sessions */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sesiones</span>
                        <span className="text-[9px] text-slate-600">{localSessions.length} días</span>
                    </div>

                    {DAYS.map(day => {
                        const session = localSessions.find(s => s.day === day);
                        const isExpanded = expandedDays.has(day);
                        const isRest = !session || session.type === 'RECOVERY';
                        const isToday = day === 'JUE';
                        const colors = session ? typeColors[session.type] || typeColors['TECHNIQUE'] : typeColors['RECOVERY'];

                        return (
                            <div key={day} className={`rounded-xl overflow-hidden transition-all ${isToday ? 'ring-2 ring-cyan-500/50' : ''}`}>
                                <button
                                    onClick={() => !isRest && toggleDay(day)}
                                    className={`w-full flex items-center justify-between p-3 transition-all ${isRest ? 'bg-slate-900/50 text-slate-600' : `${colors.bg} border ${colors.border}`}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isToday ? 'bg-cyan-500 text-black' : isRest ? 'bg-slate-800' : `${colors.bg} ${colors.text}`}`}>
                                            {day}
                                        </div>
                                        <div className="text-left">
                                            <span className={`text-[11px] font-bold ${isRest ? 'text-slate-600' : 'text-white'}`}>{session?.title || 'Descanso'}</span>
                                            {session && !isRest && <p className="text-[8px] text-slate-500">{session.durationMin}min • Zona {session.intensityZone}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {session && !isRest && <Badge variant="neutral" className={`text-[7px] ${colors.text} bg-transparent border-current`}>{session.type}</Badge>}
                                        {!isRest && <span className={`material-symbols-outlined text-sm ${colors.text} transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>}
                                    </div>
                                </button>

                                {isExpanded && session && !isRest && (
                                    <div className={`p-4 space-y-4 ${colors.bg} border-x border-b ${colors.border}`}>
                                        <div>
                                            <p className="text-[8px] text-slate-500 uppercase mb-1">Contexto</p>
                                            <p className="text-[11px] text-white">{session.context || 'Desarrollo de capacidades específicas.'}</p>
                                        </div>
                                        <div className="bg-black/30 p-3 rounded-lg">
                                            <p className="text-[8px] text-slate-500 uppercase mb-1">🔥 Prep Protocol</p>
                                            {isEditing ? (
                                                <input className="w-full bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white" value={session.psychology || ''} onChange={e => handleEditSession(session.id, 'psychology', e.target.value)} />
                                            ) : (
                                                <p className="text-[10px] text-slate-300">{session.psychology || 'Atacar el suelo con agresividad controlada.'}</p>
                                            )}
                                        </div>

                                        {/* EXERCISES - DYNAMIC AI CONTENT */}
                                        {/* PHASE A: RAMP (Dark Minimalist) */}
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="outline" className="text-[9px] text-zinc-500 border-zinc-800">FASE A</Badge>
                                                <h4 className="text-[11px] font-bold uppercase text-white tracking-wider">RAMP (Calentamiento)</h4>
                                            </div>
                                            {isEditing ? (
                                                <textarea className="w-full bg-black border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 h-24 font-mono focus:border-zinc-600 outline-none transition-colors"
                                                    value={session.structure?.ramp || session.gymWork || ''}
                                                    onChange={e => handleEditSession(session.id, 'structure', { ...session.structure, ramp: e.target.value })}
                                                    placeholder="Raise, Activate, Mobilize, Potentiate..."
                                                />
                                            ) : (
                                                <p className="text-[12px] text-zinc-400 font-medium whitespace-pre-wrap leading-relaxed">
                                                    {session.structure?.ramp || "Calentamiento General (Estándar)"}
                                                </p>
                                            )}
                                        </div>

                                        {/* PHASE B: TRACK (Dark Minimalist) */}
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                                            {/* Subtle highlight for the main phase */}
                                            <div className="absolute top-0 left-0 w-1 h-full bg-white/10"></div>

                                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                                <Badge variant="outline" className="text-[9px] text-zinc-500 border-zinc-800">FASE B</Badge>
                                                <h4 className="text-[11px] font-bold uppercase text-white tracking-wider">Trabajo Específico</h4>
                                            </div>
                                            {isEditing ? (
                                                <textarea className="w-full bg-black border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 h-28 font-mono relative z-10 focus:border-zinc-600 outline-none transition-colors"
                                                    value={session.structure?.track || session.title || ''}
                                                    onChange={e => handleEditSession(session.id, 'structure', { ...session.structure, track: e.target.value })}
                                                    placeholder="Volumen total, Series, Recuperación..."
                                                />
                                            ) : (
                                                <p className="text-[13px] text-white font-medium whitespace-pre-wrap relative z-10 leading-relaxed">
                                                    {session.structure?.track || session.title}
                                                </p>
                                            )}
                                        </div>

                                        {/* PHASE C: TRANSFER (Dark Minimalist) */}
                                        {(session.structure?.transfer || isEditing) && (
                                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge variant="outline" className="text-[9px] text-zinc-500 border-zinc-800">FASE C</Badge>
                                                    <h4 className="text-[11px] font-bold uppercase text-white tracking-wider">Transferencia</h4>
                                                </div>
                                                {isEditing ? (
                                                    <textarea className="w-full bg-black border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 h-20 font-mono focus:border-zinc-600 outline-none transition-colors"
                                                        value={session.structure?.transfer || ''}
                                                        onChange={e => handleEditSession(session.id, 'structure', { ...session.structure, transfer: e.target.value })}
                                                        placeholder="Pliometría, Saltos, Contacto mínimo..."
                                                    />
                                                ) : (
                                                    <p className="text-[12px] text-zinc-400 font-medium whitespace-pre-wrap leading-relaxed">
                                                        {session.structure?.transfer || "N/A"}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* PHASE D: GYM (Dark Minimalist) */}
                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Badge variant="outline" className="text-[9px] text-zinc-500 border-zinc-800">FASE D</Badge>
                                                <h4 className="text-[11px] font-bold uppercase text-white tracking-wider">Fuerza Explosiva</h4>
                                            </div>
                                            {isEditing ? (
                                                <textarea className="w-full bg-black border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-300 h-24 font-mono focus:border-zinc-600 outline-none transition-colors"
                                                    value={session.structure?.gym || session.gymWork || ''}
                                                    onChange={e => handleEditSession(session.id, 'structure', { ...session.structure, gym: e.target.value })}
                                                    placeholder="Derivados Halterofilia, Empuje, etc..."
                                                />
                                            ) : (
                                                <p className="text-[12px] text-zinc-400 font-medium whitespace-pre-wrap leading-relaxed">
                                                    {session.structure?.gym || session.gymWork || "Descanso / Sin Gym"}
                                                </p>
                                            )}
                                        </div>

                                        {/* METRICS GRID (Dark Minimalist) */}
                                        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
                                            <div className="bg-black/20 p-3 rounded-lg text-center border border-white/5">
                                                <p className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1">Volumen</p>
                                                <p className="text-sm font-bold text-zinc-300">{session.intensityZone * 20}%</p>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-lg text-center border border-white/5">
                                                <p className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1">Intensidad</p>
                                                <p className="text-sm font-bold text-zinc-300">Z{session.intensityZone}</p>
                                            </div>
                                            <div className="bg-black/20 p-3 rounded-lg text-center border border-white/5">
                                                <p className="text-sm font-bold text-zinc-300">{session.durationMin}'</p>
                                                <p className="text-[8px] text-zinc-600 uppercase tracking-wider mb-1">Duración</p>
                                            </div>
                                        </div>

                                        <button onClick={onLogFeedback} className="w-full py-3 mt-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all">
                                            <span className="material-symbols-outlined text-sm">rate_review</span>
                                            Registrar Feedback
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default TrainingPlan;