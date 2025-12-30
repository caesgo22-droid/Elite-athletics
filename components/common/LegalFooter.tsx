import React from 'react';
import { Badge } from './Atomic';

export const LegalFooter: React.FC = () => {
    return (
        <div className="space-y-3 pt-4">
            <div className="glass-card p-4 rounded-xl border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Fundamentación Técnica</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                    Nivel 5 Elite utiliza un motor de razonamiento biomecánico basado en Gemini 1.5 Pro,
                    alimentado por una base de conocimientos RAG (Retrieval-Augmented Generation) que incluye
                    manuales de World Athletics y protocolos de la NSCA.
                </p>
            </div>

            <div className="glass-card p-4 rounded-xl border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-volt">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Verificación de Precisión</h4>
                    </div>
                    <Badge variant="volt" className="text-[7px]">v2.5.0-BETA</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase">Margen de Error</p>
                        <p className="text-xs font-mono font-black text-white">±0.05s / 2°</p>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase">Confianza AI</p>
                        <p className="text-xs font-mono font-black text-white">98.2%</p>
                    </div>
                </div>
            </div>

            <div className="bg-danger/5 border border-danger/20 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-danger">
                    <span className="material-symbols-outlined text-sm">gavel</span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest">Aviso Legal & Disclaimer</h4>
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed italic">
                    Esta herramienta es un Sistema de Soporte a la Decisión. Los resultados son estimaciones basadas en visión artificial.
                    <span className="text-white font-bold ml-1">El criterio del Entrenador y Personal Médico siempre prevalece sobre la IA.</span>
                    No apto para diagnóstico clínico.
                </p>
            </div>
        </div>
    );
};
