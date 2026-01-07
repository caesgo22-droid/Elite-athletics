import React, { useState, useEffect } from 'react';
import { DataRing } from '../services/CoreArchitecture';
import TrainingPlan from './TrainingPlan';
import ChatInterface from './ChatInterface';
import { MacrocycleWidget } from './viz/MacrocycleWidget';
import StrategicPlanning from './StrategicPlanning';
import RoundTable from './RoundTable';

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
                    <div className="h-full overflow-hidden animate-in slide-in-from-bottom-4">
                        <StrategicPlanning athleteId={athleteId} onBack={() => { }} />
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
                    <div className="h-full overflow-hidden animate-in slide-in-from-bottom-4">
                        <RoundTable athleteId={athleteId} />
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
                                inputPosition="top"
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

export default StrategyHub;
