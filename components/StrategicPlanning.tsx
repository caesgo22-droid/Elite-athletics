import React, { useState, useEffect } from 'react';
import { DataRing, EventBus } from '../services/CoreArchitecture';
import { Macrocycle, TrainingPhase } from '../types';
import { BackButton } from './common/BackButton';
import { Card, Button, Badge } from './common/Atomic';
import { StorageSatellite } from '../services/satellites/StorageSatellite';

interface StrategicPlanningProps {
    athleteId: string;
    onBack: () => void;
}

const StrategicPlanning: React.FC<StrategicPlanningProps> = ({ athleteId, onBack }) => {
    const [macrocycle, setMacrocycle] = useState<Macrocycle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [goal, setGoal] = useState('');
    const [phase, setPhase] = useState<TrainingPhase>('PRE_SEASON');
    const [focusInput, setFocusInput] = useState('');
    const [focusPoints, setFocusPoints] = useState<string[]>([]);
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const loadData = async () => {
            // Direct satellite access for editing forms is often cleaner, 
            // but strictly we should iterate via DataRing if we want caching. 
            // For now, fetch fresh.
            const data = await StorageSatellite.getMacrocycle(athleteId);
            if (data) {
                setMacrocycle(data);
                setGoal(data.goal);
                setPhase(data.phase);
                setFocusPoints(data.focusPoints || []);
                setEndDate(data.endDate);
            }
            setIsLoading(false);
        };
        loadData();
    }, [athleteId]);

    const handleSave = async () => {
        if (!macrocycle) return;
        setIsSaving(true);

        const updatedMacro: Macrocycle = {
            ...macrocycle,
            goal,
            phase,
            focusPoints,
            endDate
        };

        await DataRing.saveMacrocycle(athleteId, updatedMacro);
        setMacrocycle(updatedMacro);
        setIsSaving(false);
        EventBus.publish('UI_FEEDBACK', { message: 'Plan Estratégico Actualizado', type: 'success' });
    };

    const addFocusPoint = () => {
        if (focusInput.trim()) {
            setFocusPoints([...focusPoints, focusInput.trim()]);
            setFocusInput('');
        }
    };

    const removeFocusPoint = (idx: number) => {
        setFocusPoints(focusPoints.filter((_, i) => i !== idx));
    };

    if (isLoading) return <div className="p-8 text-white">Cargando Estrategia...</div>;

    return (
        <div className="h-full flex flex-col bg-background font-sans overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <BackButton onClick={onBack} />
                    <div>
                        <h2 className="text-2xl font-black italic uppercase text-white font-display">Plan Estratégico</h2>
                        <p className="text-xs text-slate-500 font-mono">Definiendo el "Big Picture" del Atleta</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-volt text-black hover:bg-volt/80"
                >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">

                {/* SECTION 1: MACROCYCLE CONTEXT */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">map</span>
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">Configuración de Macrociclo</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Fase de Entrenamiento</label>
                                <select
                                    value={phase}
                                    onChange={(e) => setPhase(e.target.value as TrainingPhase)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-primary focus:outline-none"
                                >
                                    <option value="PRE_SEASON">PRE_SEASON (Acumulación)</option>
                                    <option value="COMPETITIVE">COMPETITIVE (Realización)</option>
                                    <option value="TRANSITION">TRANSITION (Recuperación)</option>
                                    <option value="TAPERING">TAPERING (Puesta a Punto)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Objetivo del Ciclo (La Meta)</label>
                                <textarea
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-sans text-sm focus:border-primary focus:outline-none"
                                    placeholder="Ej. Bajar de 10.50s en 100m para Nacionales..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Fecha Objetivo (Fin de Ciclo)</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-primary focus:outline-none"
                                />
                            </div>
                        </Card>

                        {/* STRATEGIC FOCUS POINTS */}
                        <Card className="p-6 flex flex-col">
                            <div className="mb-4">
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Puntos de Enfoque (Focus Points)</label>
                                <p className="text-xs text-slate-400 mb-3">
                                    Añade palabras clave que la IA priorizará al diseñar sesiones (ej. "Técnica de Carrera", "Fuerza Maxima").
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        value={focusInput}
                                        onChange={(e) => setFocusInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addFocusPoint()}
                                        placeholder="Nuevo enfoque..."
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary focus:outline-none"
                                    />
                                    <button
                                        onClick={addFocusPoint}
                                        className="px-4 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-wrap content-start gap-2">
                                {focusPoints.map((fp, idx) => (
                                    <Badge key={idx} className="bg-primary/20 text-primary border-primary/30 flex items-center gap-2 pr-1">
                                        {fp}
                                        <button onClick={() => removeFocusPoint(idx)} className="hover:text-white">×</button>
                                    </Badge>
                                ))}
                                {focusPoints.length === 0 && <span className="text-slate-600 text-sm italic py-4">Sin puntos de enfoque definidos.</span>}
                            </div>
                        </Card>
                    </div>
                </section>

                {/* SECTION 2: CONTEXTUAL CONSTRAINTS */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-warning text-3xl">warning</span>
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider">Limitantes & Contexto</h3>
                    </div>
                    <Card className="p-6 bg-gradient-to-br from-white/5 to-transparent border-warning/10">
                        <div className="flex gap-4 text-slate-300 text-sm leading-relaxed">
                            <div className="flex-1">
                                <h4 className="font-bold text-white mb-2">Instrucciones para la IA (Omni-Context)</h4>
                                <p>
                                    Los datos ingresados arriba (Fase, Meta, Enfoques) se inyectan directamente en el prompt del <strong>Head Coach AI</strong>.
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                                    <li>Si cambias la fase a <strong>TAPERING</strong>, el volumen bajará automáticamente.</li>
                                    <li>Si añades "Rehabilitación" a los enfoques, la IA priorizará la seguridad sobre la intensidad.</li>
                                    <li>Las <strong>Lesiones</strong> y <strong>Competencias</strong> se gestionan en el Perfil del Atleta y Calendario, pero aquí defines cómo la IA *reacciona* a ellas globalmente.</li>
                                </ul>
                            </div>
                            <div className="w-1/3 flex items-center justify-center border-l border-white/10 pl-6">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🧠</div>
                                    <div className="text-xs uppercase font-bold text-slate-500">Sync Status</div>
                                    <div className="text-success font-mono font-bold">ACTIVE</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>

            </div>
        </div>
    );
};

export default StrategicPlanning;
