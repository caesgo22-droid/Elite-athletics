import React, { useState, useEffect } from 'react';
import { DataRing } from '../services/CoreArchitecture';
import TrainingPlan from './TrainingPlan';
import ChatInterface from './ChatInterface';
import { MacrocycleWidget } from './viz/MacrocycleWidget';

interface StrategyHubProps {
    athleteId: string;
    onClose: () => void;
}

type Tab = 'STRATEGY' | 'PLANS' | 'WAR_ROOM' | 'WALL';

const StrategyHub: React.FC<StrategyHubProps> = ({ athleteId, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>('STRATEGY');
    const [athlete, setAthlete] = useState<any>(null);
    const [plan, setPlan] = useState<any>(null);

    useEffect(() => {
        const a = DataRing.getAthlete(athleteId);
        setAthlete(a);
        if (a) {
            const p = DataRing.getWeeklyPlan(athleteId);
            setPlan(p);
        }
    }, [athleteId]);

    if (!athlete) return <div className="text-white">Cargando Estrategia...</div>;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300 font-display">
            {/* TOP NAVIGATION BAR */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface shrink-0">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl overflow-hidden border border-white/20">
                        <img src={athlete.imgUrl} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-white font-black text-lg uppercase leading-none">{athlete.name}</h2>
                        <span className="text-[10px] text-volt tracking-widest uppercase font-bold">Strategy Command Hub</span>
                    </div>
                </div>

                <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                    <TabButton active={activeTab === 'STRATEGY'} onClick={() => setActiveTab('STRATEGY')} icon="hub" label="Strategy" />
                    <TabButton active={activeTab === 'PLANS'} onClick={() => setActiveTab('PLANS')} icon="calendar_month" label="Validator" />
                    <TabButton active={activeTab === 'WAR_ROOM'} onClick={() => setActiveTab('WAR_ROOM')} icon="monitoring" label="War Room" />
                    <TabButton active={activeTab === 'WALL'} onClick={() => setActiveTab('WALL')} icon="forum" label="The Wall" />
                </div>

                <button onClick={onClose} className="size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                    <span className="material-symbols-outlined text-white">close</span>
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative bg-background">

                {/* 1. STRATEGY VIEW */}
                {activeTab === 'STRATEGY' && (
                    <div className="h-full p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4">
                        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <PillarCard title="Mindset" icon="psychology" color="text-purple-400" status="OPTIMAL" context="Enfoque: Resiliencia bajo fatiga" />
                            <PillarCard title="Nutrition" icon="nutrition" color="text-green-400" status="WARNING" context="Déficit calórico detectado" />
                            <PillarCard title="Recovery" icon="bed" color="text-blue-400" status="OPTIMAL" context="Sleep Score: 92%" />
                            <PillarCard title="Performance" icon="bolt" color="text-volt" status="OPTIMAL" context="PB potencial en 2 semanas" />

                            <div className="col-span-full mt-8">
                                <h3 className="text-white font-black uppercase text-2xl mb-4">Macrocycle Overview</h3>
                                <div className="glass-card p-6 rounded-2xl border border-white/10 h-64">
                                    <MacrocycleWidget athleteId={athleteId} height={200} showLegend={true} currentWeek={3} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. PLANS VALIDATOR */}
                {activeTab === 'PLANS' && (
                    <div className="h-full animate-in slide-in-from-bottom-4">
                        {plan ? (
                            <TrainingPlan
                                plan={plan}
                                onLogFeedback={() => { }}
                                userRole="STAFF"
                                onBack={() => setActiveTab('STRATEGY')}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">No hay plan asignado</div>
                        )}
                    </div>
                )}

                {/* 3. WAR ROOM */}
                {activeTab === 'WAR_ROOM' && (
                    <div className="h-full p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4">
                        <div className="max-w-6xl mx-auto">
                            <h1 className="text-4xl font-black text-white italic uppercase mb-8">War <span className="text-danger">Room</span></h1>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="glass-card p-6 rounded-2xl border border-danger/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-9xl text-danger">warning</span></div>
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Risk Assessment</h3>
                                    <div className="text-3xl font-black text-danger mb-2">ELEVATED</div>
                                    <p className="text-sm text-slate-300">ACWR spiked to 1.42 due to yesterday's sprint volume. Recommend -20% load reduction today.</p>
                                </div>

                                <div className="glass-card p-6 rounded-2xl border border-volt/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-9xl text-volt">trending_up</span></div>
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Performance Trend</h3>
                                    <div className="text-3xl font-black text-volt mb-2">PEAKING</div>
                                    <p className="text-sm text-slate-300">Velocity metrics show +3% improvement in top speed phase compared to last cycle.</p>
                                </div>

                                <div className="glass-card p-6 rounded-2xl border border-blue-400/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-9xl text-blue-400">medical_services</span></div>
                                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Medical Status</h3>
                                    <div className="text-3xl font-black text-blue-400 mb-2">CLEARED</div>
                                    <p className="text-sm text-slate-300">Physio cleared Hamstring tightness. Monitor RPE during acceleration drills.</p>
                                </div>
                            </div>

                            <div className="glass-card p-6 rounded-2xl border border-white/10">
                                <h3 className="text-white font-bold uppercase mb-4">Deep Data Analysis</h3>
                                <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-black/20">
                                    <p className="text-slate-500 text-sm font-mono">PLACEHOLDER: DEEP ANALYTICS CHARTS</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. THE WALL */}
                {activeTab === 'WALL' && (
                    <div className="h-full flex flex-col animate-in slide-in-from-bottom-4">
                        <div className="bg-zinc-900 border-b border-white/5 p-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-white font-black uppercase tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-volt">security</span>
                                    THE WALL <span className="text-slate-600 text-[10px] ml-2">STAFF ONLY CHANNEL</span>
                                </h2>
                                <p className="text-[10px] text-slate-500">Comunicaciones encriptadas para el staff técnico.</p>
                            </div>
                            <div className="flex -space-x-2">
                                <div className="size-8 rounded-full bg-slate-700 border border-black flex items-center justify-center text-xs text-white">S1</div>
                                <div className="size-8 rounded-full bg-slate-700 border border-black flex items-center justify-center text-xs text-white">S2</div>
                                <div className="size-8 rounded-full bg-slate-700 border border-black flex items-center justify-center text-xs text-white">S3</div>
                            </div>
                        </div>
                        <div className="flex-1 relative">
                            {/* Reusing ChatInterface but pointing to a staff room */}
                            <ChatInterface
                                roomId={`staff-${athleteId}`}
                                userId="COACH_UID"
                                userName="Head Coach"
                                userRole="STAFF"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${active ? 'bg-volt text-black shadow-glow-volt' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
        <span className="material-symbols-outlined text-lg">{icon}</span>
        <span className="text-xs font-black uppercase tracking-wider hidden md:inline">{label}</span>
    </button>
);

const PillarCard = ({ title, icon, color, status, context }: any) => (
    <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <span className={`material-symbols-outlined text-3xl ${color} bg-white/5 p-2 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>{icon}</span>
            <span className={`text-[9px] px-2 py-0.5 rounded border font-black uppercase ${status === 'OPTIMAL' ? 'text-success border-success/30 bg-success/10' : status === 'WARNING' ? 'text-warning border-warning/30 bg-warning/10' : 'text-slate-500 border-slate-500/30'}`}>{status}</span>
        </div>
        <h3 className="text-white font-black uppercase text-xl mb-2 group-hover:text-volt transition-colors">{title}</h3>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">{context}</p>
    </div>
);

export default StrategyHub;
