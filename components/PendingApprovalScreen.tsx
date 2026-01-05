import React from 'react';

interface PendingApprovalScreenProps {
    email: string;
    onLogout: () => void;
}

const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ email, onLogout }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full">
                <div className="glass-card p-8 rounded-2xl border border-white/10 text-center space-y-6">
                    {/* Icon */}
                    <div className="size-20 mx-auto rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-warning text-4xl">schedule</span>
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase italic tracking-tight mb-2">
                            Esperando Aprobación
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Tu cuenta está siendo revisada por un administrador
                        </p>
                    </div>

                    {/* Email */}
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                            Cuenta Registrada
                        </p>
                        <p className="text-white font-mono text-sm">{email}</p>
                    </div>

                    {/* Info */}
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-left">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-lg mt-0.5">info</span>
                            <div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Un administrador revisará tu solicitud y te asignará el rol apropiado
                                    (Atleta o Staff). Recibirás un correo cuando tu cuenta sea aprobada.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">refresh</span>
                            Verificar Estado
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full py-3 bg-transparent border border-white/5 text-slate-400 rounded-xl text-xs font-bold hover:text-white hover:border-white/20 transition-all"
                        >
                            Cerrar Sesión
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-[10px] text-slate-600 font-mono">
                        Si tienes dudas, contacta al administrador del sistema
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovalScreen;
