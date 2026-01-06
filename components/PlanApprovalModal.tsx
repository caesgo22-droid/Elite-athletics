import React, { useState } from 'react';
import { Badge } from './common/Atomic';

interface PlanApprovalModalProps {
    plan: {
        id: string;
        type: string;
        description: string;
        duration: string;
        sessions: any[];
        goals: string[];
    };
    athleteName: string;
    onApprove: (notes?: string) => void;
    onReject: (reason: string) => void;
    onClose: () => void;
}

const PlanApprovalModal: React.FC<PlanApprovalModalProps> = ({
    plan,
    athleteName,
    onApprove,
    onReject,
    onClose
}) => {
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        await onApprove(notes);
        setLoading(false);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            alert('Por favor proporciona una razón para rechazar el plan');
            return;
        }
        setLoading(true);
        await onReject(rejectionReason);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border-volt/20">
                {/* Header */}
                <div className="sticky top-0 bg-surface/95 backdrop-blur-xl p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-volt text-3xl">event_note</span>
                            Aprobar Plan de Entrenamiento
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Revisa los detalles antes de aprobar</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                    >
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Plan Info */}
                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm">Información del Plan</h3>
                            <Badge variant="volt">{plan.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500 text-xs uppercase tracking-wider">Duración</span>
                                <p className="text-white font-bold">{plan.duration}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 text-xs uppercase tracking-wider">Sesiones</span>
                                <p className="text-white font-bold">{plan.sessions?.length || 0} sesiones</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Descripción</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">{plan.description}</p>
                    </div>

                    {/* Goals */}
                    {plan.goals && plan.goals.length > 0 && (
                        <div>
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Objetivos</h3>
                            <ul className="space-y-2">
                                {plan.goals.map((goal, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="material-symbols-outlined text-volt text-sm mt-0.5">check_circle</span>
                                        <span className="text-slate-300">{goal}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sessions Preview */}
                    {plan.sessions && plan.sessions.length > 0 && (
                        <div>
                            <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-2">
                                Vista Previa de Sesiones ({plan.sessions.length})
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {plan.sessions.slice(0, 5).map((session, idx) => (
                                    <div key={idx} className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white text-xs font-bold">Sesión {idx + 1}</span>
                                            <Badge variant="outline" className="text-[9px]">{session.type || 'Entrenamiento'}</Badge>
                                        </div>
                                        <p className="text-slate-400 text-[10px] line-clamp-2">{session.description || session.focus}</p>
                                    </div>
                                ))}
                                {plan.sessions.length > 5 && (
                                    <p className="text-slate-500 text-xs text-center">
                                        +{plan.sessions.length - 5} sesiones más...
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Approval Form */}
                    {!showRejectForm ? (
                        <div>
                            <label className="text-white font-bold uppercase tracking-wider text-sm mb-2 block">
                                Notas (Opcional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Agrega comentarios o notas sobre este plan..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:border-volt outline-none resize-none"
                                rows={3}
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="text-danger font-bold uppercase tracking-wider text-sm mb-2 block">
                                Razón del Rechazo *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explica por qué rechazas este plan..."
                                className="w-full bg-danger/5 border border-danger/20 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:border-danger outline-none resize-none"
                                rows={3}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-surface/95 backdrop-blur-xl p-6 border-t border-white/10 flex gap-3">
                    {!showRejectForm ? (
                        <>
                            <button
                                onClick={() => setShowRejectForm(true)}
                                className="flex-1 px-6 py-3 bg-danger/10 hover:bg-danger/20 border border-danger/20 hover:border-danger text-danger rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
                                disabled={loading}
                            >
                                Rechazar
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-volt hover:bg-volt/90 text-black rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                        Aprobando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Aprobar Plan
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowRejectForm(false)}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={loading || !rejectionReason.trim()}
                                className="flex-1 px-6 py-3 bg-danger hover:bg-danger/90 text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                        Rechazando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">cancel</span>
                                        Confirmar Rechazo
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlanApprovalModal;
