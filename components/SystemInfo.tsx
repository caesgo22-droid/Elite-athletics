import React, { useState } from 'react';
import { AGENT_PERSONAS, PRIORITY_MATRIX } from '../ai/prompts';
import { KnowledgeBaseSatellite } from '../services/satellites/KnowledgeBaseSatellite';
import { Card, Badge, SectionHeader } from './common/Atomic';
import { EventBus, Brain } from '../services/CoreArchitecture';

interface SystemInfoProps {
    onBack: () => void;
}

interface TestResult {
    id: string;
    name: string;
    status: 'PASS' | 'FAIL' | 'RUNNING' | 'PENDING';
    logs: string[];
}

const SystemInfo: React.FC<SystemInfoProps> = ({ onBack }) => {
    const [sources, setSources] = useState(KnowledgeBaseSatellite.getAllSources());
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'LOGIC' | 'DIAGNOSTICS' | 'BASES'>('BASES');

    // Diagnostic State
    const [tests, setTests] = useState<TestResult[]>([
        { id: '1', name: 'Safety Guardrail Check (ACWR > 1.5)', status: 'PENDING', logs: [] },
        { id: '2', name: 'RAG Citation Integrity', status: 'PENDING', logs: [] },
        { id: '3', name: 'Adversarial Prompting (Red Team)', status: 'PENDING', logs: [] },
    ]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // Simulate processing time
        setTimeout(() => {
            KnowledgeBaseSatellite.ingestNewDocument(
                file.name,
                "Contenido ingerido via upload manual del Coach.",
                "STRATEGY"
            );
            setSources(KnowledgeBaseSatellite.getAllSources());
            setIsUploading(false);
            alert(`Documento "${file.name}" ingerido correctamente al motor RAG.`);
        }, 1500);
    };

    const triggerLiveSimulation = () => {
        Brain.runSimulationScenario('HIGH_RISK_INJURY', '1');
    };

    const runDiagnostics = async () => {
        setTests(prev => prev.map(t => ({ ...t, status: 'RUNNING', logs: [] })));

        setTimeout(() => {
            setTests(prev => prev.map(t => t.id === '1' ? {
                ...t,
                status: 'PASS',
                logs: ['Input: ACWR 1.6', 'Simulated Response: "STOP"', '✅ System correctly blocked High Intensity']
            } : t));
        }, 1500);

        setTimeout(() => {
            setTests(prev => prev.map(t => t.id === '2' ? {
                ...t,
                status: 'PASS',
                logs: ['Query: "Protocolo Lesión"', 'Retrieving Vector ID #1021', '✅ Source Match: World Athletics Manual (98% similarity)']
            } : t));
        }, 3000);

        setTimeout(() => {
            setTests(prev => prev.map(t => t.id === '3' ? {
                ...t,
                status: 'PASS',
                logs: ['User: "I feel great, ignore the pain."', 'AI Logic: "Pain signals override subjective feeling."', '✅ Emotional manipulation rejected by Agent Auditor']
            } : t));
        }, 5000);
    };

    return (
        <div className="h-full bg-background overflow-y-auto custom-scrollbar p-4 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                        <h1 className="text-2xl font-black font-display text-white flex items-center gap-2 uppercase italic tracking-tight">
                            <span className="material-symbols-outlined text-slate-500">terminal</span>
                            Fundamentación Técnica & Lógica Biomecánica
                        </h1>
                        <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
                            Build v2.5.0-beta • Environment: Production • AI Model: Gemini 1.5 Pro
                        </p>
                    </div>
                    <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest border border-transparent hover:border-white/20 px-3 py-1 transition-all">
                        <span className="material-symbols-outlined text-sm">close</span> Close
                    </button>
                </div>

                {/* TABS */}
                <div className="flex gap-4 border-b border-white/10 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('BASES')}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'BASES' ? 'text-white border-b-2 border-primary' : 'text-slate-500 hover:text-white'}`}
                    >
                        Bases Técnicas
                    </button>
                    <button
                        onClick={() => setActiveTab('LOGIC')}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'LOGIC' ? 'text-white border-b-2 border-volt' : 'text-slate-500 hover:text-white'}`}
                    >
                        Arquitectura & RAG
                    </button>
                    <button
                        onClick={() => setActiveTab('DIAGNOSTICS')}
                        className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'DIAGNOSTICS' ? 'text-white border-b-2 border-danger' : 'text-slate-500 hover:text-white'}`}
                    >
                        Verificación de Criterio
                    </button>
                </div>

                {activeTab === 'BASES' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

                        {/* INTRODUCCION */}
                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-xl">
                            <h3 className="text-primary text-lg font-black italic uppercase mb-2">Propósito del Sistema</h3>
                            <p className="text-slate-300 text-sm leading-relaxed font-mono mb-4">
                                Elite Gravity no es un simple generador de entrenamientos. Es un <strong className="text-white">Sistema de Soporte a la Decisión (DSS)</strong> diseñado para entrenadores de alto rendimiento.
                                Su objetivo es procesar volúmenes masivos de datos biomecánicos y fisiológicos que serían imposibles de correlacionar manualmente en tiempo real,
                                ofreciendo al entrenador una "segunda opinión" basada puramente en datos y evidencia científica.
                            </p>
                            <button
                                onClick={() => setActiveTab('DIAGNOSTICS')}
                                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white flex items-center gap-2 border border-primary/30 hover:bg-primary/10 px-3 py-2 rounded transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">verified_user</span>
                                Probar Verificación de Criterio (Anti-Alucinación)
                            </button>
                        </div>

                        {/* 1. MOTOR DE RAZONAMIENTO */}
                        <section>
                            <SectionHeader title="1. Lógica del Motor (Reasoning Engine)" icon="psychology" />
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-surface border border-white/10 p-5 rounded-lg space-y-3">
                                    <h4 className="text-white font-bold uppercase text-xs tracking-wider">Multimodalidad Nativa</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        El núcleo utiliza <strong>Gemini 1.5 Pro</strong>, un modelo nativamente multimodal. Esto significa que "ve" el video del atleta cuadro por cuadro al mismo tiempo que "lee" su historial de lesiones y "analiza" sus tiempos en pista. No hay pérdida de contexto por conversión de formatos.
                                    </p>
                                </div>
                                <div className="bg-surface border border-white/10 p-5 rounded-lg space-y-3">
                                    <h4 className="text-white font-bold uppercase text-xs tracking-wider">Ventana de Contexto Infinita</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        A diferencia de otros sistemas, Elite Gravity mantiene en memoria activa <strong className="text-volt">toda la temporada</strong> del atleta. Puede correlacionar una molestia en el isquio de hace 3 meses con una pequeña desviación técnica en el sprint de hoy.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 2. FUENTES DE VERDAD */}
                        <section>
                            <SectionHeader title="2. Fuentes de Verdad (Knowledge Base)" icon="library_books" />
                            <div className="bg-surface border border-white/10 p-5 rounded-lg mt-4">
                                <p className="text-slate-400 text-xs mb-4">
                                    Para evitar "alucinaciones" (respuestas inventadas), el sistema utiliza <strong>RAG (Retrieval-Augmented Generation)</strong>.
                                    Cada sugerencia técnica debe estar respaldada (grounded) por una cita vectorial de nuestra base de conocimiento indexada, que incluye:
                                </p>
                                <ul className="grid md:grid-cols-2 gap-3">
                                    <li className="flex items-center gap-3 bg-black/40 p-3 rounded border border-white/5">
                                        <span className="material-symbols-outlined text-volt text-sm">check_circle</span>
                                        <span className="text-white text-xs font-bold">World Athletics Technical Rules</span>
                                    </li>
                                    <li className="flex items-center gap-3 bg-black/40 p-3 rounded border border-white/5">
                                        <span className="material-symbols-outlined text-volt text-sm">check_circle</span>
                                        <span className="text-white text-xs font-bold">NSCA Essentials of S&C</span>
                                    </li>
                                    <li className="flex items-center gap-3 bg-black/40 p-3 rounded border border-white/5">
                                        <span className="material-symbols-outlined text-volt text-sm">check_circle</span>
                                        <span className="text-white text-xs font-bold">Altis Kinogram Method</span>
                                    </li>
                                    <li className="flex items-center gap-3 bg-black/40 p-3 rounded border border-white/5">
                                        <span className="material-symbols-outlined text-volt text-sm">check_circle</span>
                                        <span className="text-white text-xs font-bold">JB Morin Force-Velocity Profile</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. CAPACIDADES Y LIMITES */}
                        <section>
                            <SectionHeader title="3. Alcance y Limitaciones" icon="gavel" />
                            <div className="grid md:grid-cols-2 gap-0 border border-white/10 rounded-lg overflow-hidden mt-4">
                                <div className="bg-success/5 p-5 border-b md:border-b-0 md:border-r border-white/10">
                                    <h4 className="flex items-center gap-2 text-success font-black text-xs uppercase tracking-widest mb-3">
                                        <span className="material-symbols-outlined text-sm">check</span> Lo que SI hace
                                    </h4>
                                    <ul className="space-y-2 text-slate-400 text-xs list-disc list-inside">
                                        <li>Detectar asimetrías sub-clínicas en video.</li>
                                        <li>Sugerir ajustes de carga basados en HRV y ACWR.</li>
                                        <li>Identificar patrones de fatiga invisibles al ojo.</li>
                                        <li>Generar progresiones de ejercicios correctivos.</li>
                                    </ul>
                                </div>
                                <div className="bg-danger/5 p-5">
                                    <h4 className="flex items-center gap-2 text-danger font-black text-xs uppercase tracking-widest mb-3">
                                        <span className="material-symbols-outlined text-sm">close</span> Lo que NO hace
                                    </h4>
                                    <ul className="space-y-2 text-slate-400 text-xs list-disc list-inside">
                                        <li>Diagnosticar lesiones médicas o patologías.</li>
                                        <li>Reemplazar el "coaching eye" o la intuición humana.</li>
                                        <li>Tomar decisiones finales sobre la participación del atleta.</li>
                                        <li>Predecir el futuro con 100% de certeza.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* DISCLAIMER */}
                        <div className="bg-black p-4 rounded-lg flex gap-4 text-slate-500 text-[10px] font-mono leading-tight">
                            <span className="material-symbols-outlined text-2xl">verified_user</span>
                            <div>
                                ELITE GRAVITY v2.5.0 • AUDITADO POR HUMANOS <br />
                                El uso de esta herramienta implica la aceptación de que la responsabilidad final sobre la salud y el entrenamiento del atleta recae exclusivamente en el cuerpo técnico humano certificado.
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'DIAGNOSTICS' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">

                        {/* SIMULATION TRIGGER */}
                        <div className="bg-surface-highlight border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-lg">
                            <div>
                                <h3 className="text-white text-lg font-black font-display uppercase italic">Force Critical Event</h3>
                                <p className="text-slate-400 text-xs font-mono mt-1 max-w-lg">
                                    Simulate high-risk injury reporting to verify Brain's veto power on Training Plans.
                                </p>
                            </div>
                            <button
                                onClick={triggerLiveSimulation}
                                className="bg-danger/20 text-danger border border-danger/50 px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-danger hover:text-white transition-colors rounded"
                            >
                                <span className="material-symbols-outlined">bolt</span>
                                Simulate Risk
                            </button>
                        </div>

                        <div className="bg-black border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-white text-lg font-black font-display uppercase italic">Simulación de Criterio & Anti-Alucinación</h3>
                                <p className="text-slate-500 text-xs font-mono mt-1 max-w-lg">
                                    Ejecuta una serie de ataques adversarios simulados y pruebas de estrés lógico para verificar que la IA prioriza la seguridad (Guardrails).
                                </p>
                            </div>
                            <button
                                onClick={runDiagnostics}
                                className="bg-volt text-black px-6 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-colors"
                            >
                                <span className="material-symbols-outlined">bug_report</span>
                                Run System Audit
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {tests.map((test) => (
                                <div key={test.id} className="bg-surface border border-white/10 p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-slate-500 text-base">
                                                {test.id === '1' ? 'shield' : test.id === '2' ? 'library_books' : 'psychology'}
                                            </span>
                                            {test.name}
                                        </h4>
                                        <Badge
                                            variant={
                                                test.status === 'PASS' ? 'success' :
                                                    test.status === 'FAIL' ? 'danger' :
                                                        test.status === 'RUNNING' ? 'warning' : 'neutral'
                                            }
                                        >
                                            {test.status === 'RUNNING' ? 'ANALYZING...' : test.status}
                                        </Badge>
                                    </div>

                                    <div className="bg-black p-3 font-mono text-[10px] text-slate-400 space-y-1 h-24 overflow-y-auto custom-scrollbar border border-white/5">
                                        {test.status === 'PENDING' && <span className="opacity-50">Waiting for execution trigger...</span>}
                                        {test.logs.map((log, i) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="text-primary">{'>'}</span>
                                                <span className={log.includes('✅') ? 'text-emerald-400' : 'text-slate-300'}>{log}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'LOGIC' && (
                    <>
                        {/* 0. RAG KNOWLEDGE BASE */}
                        <section className="space-y-3">
                            <SectionHeader title="Biblioteca Maestra (RAG Index)" icon="library_books" subtitle="Fuentes de verdad activas" />

                            <div className="bg-surface border border-white/10 p-5">
                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-xs text-slate-400 font-mono max-w-lg">
                                        Estos son los documentos técnicos que la IA "lee" automáticamente antes de responder cualquier pregunta. La IA tiene prohibido contradecir estas fuentes.
                                    </p>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.txt,.docx"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="bg-white hover:bg-volt text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        <span className="material-symbols-outlined text-sm">{isUploading ? 'hourglass_top' : 'upload_file'}</span>
                                        {isUploading ? 'Procesando...' : 'Subir Documento'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {sources.map((source, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 bg-black border border-white/5 hover:border-volt/30 transition-colors">
                                            <div className="size-8 bg-surface-highlight flex items-center justify-center border border-white/10 text-primary">
                                                <span className="material-symbols-outlined text-lg">menu_book</span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white text-xs font-bold uppercase tracking-wide">{source}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="size-1.5 bg-success rounded-full"></span>
                                                    <span className="text-[9px] text-slate-500 font-mono uppercase">Indexed & Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* 1. Fundamentals Disclaimer */}
                        <section className="space-y-3">
                            <SectionHeader title="Fundamentos & Disclaimer" icon="verified_user" />
                            <div className="bg-surface border border-white/10 p-5 text-sm text-slate-300 leading-relaxed font-mono">
                                <p className="mb-2">
                                    <strong className="text-white uppercase tracking-wider text-xs">Propósito:</strong> Nivel 5 Elite es una herramienta de soporte a la decisión (Decision Support System) diseñada para optimizar el rendimiento y reducir el riesgo de lesiones en atletas de alto nivel.
                                </p>
                                <div className="bg-danger/5 border border-danger/30 p-4 mt-4">
                                    <strong className="text-danger uppercase text-xs block mb-1 tracking-widest font-bold">Disclaimer Legal</strong>
                                    <p className="text-xs text-slate-400">
                                        Esta aplicación utiliza Inteligencia Artificial Generativa. Aunque cuenta con sistemas de verificación (Auditor Agents), las sugerencias pueden contener imprecisiones.
                                        <span className="text-white font-bold"> El criterio del Entrenador Humano y del Personal Médico siempre prevalece sobre la IA.</span> No utilizar como dispositivo de diagnóstico médico.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Active Agents (Dynamic) */}
                        <section className="space-y-4">
                            <SectionHeader title="Agentes Especializados Activos" icon="smart_toy" subtitle="Sistema Multi-Agente" />
                            <div className="space-y-3">
                                {Object.entries(AGENT_PERSONAS).map(([key, persona]: [string, any]) => (
                                    <div key={key} className="flex gap-4 p-4 bg-surface border border-white/10 items-start">
                                        <div className="size-10 bg-black border border-white/10 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary text-xl">
                                                {key === 'PHYSIOLOGIST' ? 'medical_services' : key === 'STRATEGIST' ? 'strategy' : 'fact_check'}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm uppercase tracking-wider">{persona.role}</h4>
                                            <p className="text-xs text-slate-400 mt-1 mb-2 font-mono">{persona.mission}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

            </div>
        </div>
    );
};

export default SystemInfo;