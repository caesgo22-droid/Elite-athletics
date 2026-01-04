import React from 'react';
import { DataRing } from '../services/CoreArchitecture';
import { PendingLinkRequest } from '../types';

interface LinkRequestsProps {
    athleteId: string;
    onClose: () => void;
}

const LinkRequests: React.FC<LinkRequestsProps> = ({ athleteId, onClose }) => {
    const athlete = DataRing.getAthlete(athleteId);
    const pendingRequests = athlete?.pendingLinkRequests?.filter(r => r.status === 'PENDING') || [];

    const handleAccept = (request: PendingLinkRequest) => {
        // Add coach to staff
        DataRing.ingestData('MODULE_PROFILE', 'LINK_REQUEST_ACCEPT', {
            athleteId,
            requestId: request.id,
            staffMember: {
                id: request.coachId,
                name: request.coachName,
                role: request.coachRole,
                email: request.coachEmail,
                phone: '',
                imgUrl: request.coachImgUrl || `https://ui-avatars.com/api/?name=${request.coachName}&background=random`
            }
        });

        alert(`✅ ${request.coachName} agregado a tu equipo técnico`);
    };

    const handleReject = (request: PendingLinkRequest) => {
        DataRing.ingestData('MODULE_PROFILE', 'LINK_REQUEST_REJECT', {
            athleteId,
            requestId: request.id
        });

        alert(`❌ Solicitud de ${request.coachName} rechazada`);
    };

    if (pendingRequests.length === 0) {
        return (
            <>
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose}></div>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="glass-card p-6 rounded-2xl max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white text-lg font-black uppercase">Solicitudes de Vinculación</h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm text-center py-8">No tienes solicitudes pendientes</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose}></div>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="glass-card p-6 rounded-2xl max-w-md w-full space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-white text-lg font-black uppercase">Solicitudes de Vinculación</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-black/40 border border-white/10 p-4 rounded-xl">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="size-12 rounded-full bg-info/20 border border-info/30 flex items-center justify-center overflow-hidden">
                                        {request.coachImgUrl ? (
                                            <img src={request.coachImgUrl} alt={request.coachName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-info">person</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-sm">{request.coachName}</p>
                                        <p className="text-slate-400 text-xs">{request.coachRole}</p>
                                        <p className="text-slate-500 text-[10px] mt-1">{request.coachEmail}</p>
                                        <p className="text-slate-600 text-[9px] mt-1">
                                            {new Date(request.requestDate).toLocaleDateString('es-ES', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {request.message && (
                                    <p className="text-slate-300 text-xs mb-3 p-2 bg-white/5 rounded border border-white/5">
                                        "{request.message}"
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(request)}
                                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
                                    >
                                        Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleAccept(request)}
                                        className="flex-1 px-3 py-2 bg-success text-black rounded-lg text-xs font-bold hover:bg-success/80 transition-all"
                                    >
                                        Aceptar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LinkRequests;
