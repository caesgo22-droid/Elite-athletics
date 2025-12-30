import React from 'react';
import { VideoAnalysisEntry } from '../types';
import { Badge, Button } from './common/Atomic';
import { ELITE_BENCHMARKS } from '../constants';

interface TechnicalReportCardProps {
    entry: VideoAnalysisEntry;
    athleteName: string;
    athleteImage: string;
    onClose: () => void;
}

export const TechnicalReportCard: React.FC<TechnicalReportCardProps> = ({ entry, athleteName, athleteImage, onClose }) => {

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="bg-slate-950 text-white w-full max-w-5xl h-[95vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative border border-white/10">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 bg-white/10 text-white hover:bg-danger hover:scale-110 rounded-full p-2 transition-all backdrop-blur-md border border-white/10"
                >
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>

                {/* LEFT: Visual & Branding */}
                <div className="w-full md:w-[45%] bg-black relative flex flex-col">
                    <div className="absolute top-8 left-8 z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="size-2 bg-volt rounded-full animate-pulse shadow-glow-volt"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">Neural Vision Intelligence</span>
                        </div>
                        <h2 className="text-volt font-black italic text-5xl uppercase leading-[0.85] tracking-tighter">Elite<br />Bio-Lab</h2>
                    </div>

                    <div className="flex-1 relative overflow-hidden group">
                        <img
                            src={entry.thumbnailUrl}
                            alt="Analysis Frame"
                            className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>

                        {/* Biometric Overlay simulation */}
                        <div className="absolute bottom-8 left-8 right-8 grid grid-cols-2 gap-4">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                                <div className="text-[8px] font-black uppercase text-primary tracking-widest mb-1">Impact Score</div>
                                <div className="text-2xl font-black italic text-white">{entry.score}%</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                                <div className="text-[8px] font-black uppercase text-primary tracking-widest mb-1">Status</div>
                                <div className="text-sm font-black italic uppercase text-volt">{entry.status}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Detailed Analysis */}
                <div className="w-full md:w-[55%] flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar p-8 md:p-12">

                    {/* Athlete Header */}
                    <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-10">
                        <div className="relative">
                            <img src={athleteImage} className="size-20 rounded-2xl object-cover border-2 border-primary/20 p-1 bg-black" />
                            <div className="absolute -bottom-2 -right-2 size-6 bg-primary rounded-lg flex items-center justify-center border-2 border-slate-950 shadow-glow">
                                <span className="material-symbols-outlined text-black text-xs font-black">verified</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Reporte Oficial // {entry.date}</div>
                            <h1 className="text-3xl font-black italic uppercase text-white tracking-tight">{athleteName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="primary" className="text-[8px] px-2 py-0.5">{entry.exerciseName}</Badge>
                                <span className="text-slate-600 text-[10px] font-mono tracking-tighter uppercase">{entry.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Biometric KPIs */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">analytics</span> Métricas de Rendimiento
                            </h3>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">vs Elite Benchmarks</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {entry.biomechanics?.map((bio, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-2 rounded-full ${bio.status === 'optimal' ? 'bg-success shadow-glow-success' : (bio.status === 'critical' ? 'bg-danger shadow-glow-danger' : 'bg-warning shadow-glow-warning')}`}></div>
                                        <span className="text-xs font-black uppercase text-slate-300 group-hover:text-white transition-colors">{bio.joint}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black font-mono italic text-white leading-none">{bio.angle}</div>
                                        {bio.ideal && <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wide mt-1">Ideal: {bio.ideal}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Diagnosis & Corrective Plan */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">psychology</span> Diagnóstico Neural
                            </h3>
                            <div className="bg-danger/10 border-l-4 border-danger p-5 rounded-r-xl">
                                <h4 className="text-danger font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">report_problem</span> Falla Técnica Crítica
                                </h4>
                                <p className="text-sm text-slate-200 leading-relaxed italic">"{entry.aiAnalysis?.weaknesses?.[0] || "Se detecta pérdida de rigidez en el tobillo en el contacto."}"</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary/60 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">fitness_center</span> Prescripción Correctiva
                            </h3>
                            <div className="space-y-4">
                                {entry.aiAnalysis?.correctionPlan?.map((plan, i) => (
                                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-white font-black uppercase text-sm italic tracking-tight">{plan.drillName}</h4>
                                                <p className="text-[10px] text-primary/70 font-bold uppercase tracking-wider mt-0.5">{plan.focus}</p>
                                            </div>
                                            <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-black text-primary font-mono whitespace-nowrap">
                                                {plan.prescription}
                                            </div>
                                        </div>
                                        {plan.videoRef && (
                                            <a
                                                href={plan.videoRef}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white hover:scale-[1.02] transition-all shadow-glow"
                                            >
                                                <span className="material-symbols-outlined text-sm">play_circle</span> Ver Video de Referencia
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-16 pt-8 border-t border-white/5 flex gap-4 print:hidden">
                        <Button variant="secondary" className="flex-1 py-4 border-white/10 hover:bg-white/10" onClick={() => window.print()}>
                            <span className="material-symbols-outlined mr-2">print</span> Imprimir PDF Élite
                        </Button>
                        <Button variant="primary" className="flex-1 py-4 shadow-glow" onClick={onClose}>
                            Finalizar Revisión
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
};
