import React, { useState, useEffect } from 'react';
import { DataRing } from '../services/CoreArchitecture';
import { getUsersByRole } from '../services/userManagement';

interface StaffSelectorProps {
    athleteId: string;
    onSelectStaff: (staffId: string, staffName: string) => void;
    onCancel: () => void;
}

const StaffSelector: React.FC<StaffSelectorProps> = ({ athleteId, onSelectStaff, onCancel }) => {
    const [availableStaff, setAvailableStaff] = useState<{ id: string; name: string; role: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStaff = async () => {
            setIsLoading(true);
            try {
                // 1. Get athlete's specifically assigned staff first
                const athlete = DataRing.getAthlete(athleteId);
                if (athlete?.assignedStaff && athlete.assignedStaff.length > 0) {
                    setAvailableStaff(athlete.assignedStaff);
                } else {
                    // 2. Fallback: Get all approved staff members from the system
                    console.log('[StaffSelector] No assigned staff found, fetching all approved staff...');
                    const allStaff = await getUsersByRole('STAFF');
                    const allAdmins = await getUsersByRole('ADMIN');

                    const systemStaff = [...allStaff, ...allAdmins]
                        .filter(u => u.status === 'APPROVED')
                        .map(u => ({
                            id: u.uid,
                            name: u.displayName || u.email,
                            role: u.role === 'ADMIN' ? 'Entrenador Principal' : 'Staff'
                        }));

                    setAvailableStaff(systemStaff);
                }
            } catch (error) {
                console.error('[StaffSelector] Error fetching staff:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStaff();
    }, [athleteId]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-volt/30 border-t-volt rounded-full animate-spin"></div>
                    <p className="text-white text-sm">Cargando staff...</p>
                </div>
            </div>
        );
    }

    if (availableStaff.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-background p-8">
                <div className="text-center max-w-md">
                    <span className="material-symbols-outlined text-slate-600 text-5xl mb-4">person_off</span>
                    <h3 className="text-white font-bold text-lg mb-2">Sin Staff Asignado</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        No tienes entrenadores asignados. Contacta al administrador para que te asigne un coach.
                    </p>
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // If only one staff member, auto-select
    if (availableStaff.length === 1) {
        const staff = availableStaff[0];
        setTimeout(() => onSelectStaff(staff.id, staff.name), 100);
        return (
            <div className="h-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-volt/30 border-t-volt rounded-full animate-spin"></div>
                    <p className="text-white text-sm">Conectando con {staff.name}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-surface/80 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-black text-lg uppercase italic tracking-wide">Selecciona tu Coach</h2>
                        <p className="text-slate-500 text-xs mt-1">Elige con quién quieres chatear</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="size-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                        <span className="material-symbols-outlined text-white text-sm">close</span>
                    </button>
                </div>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {availableStaff.map((staff) => (
                    <button
                        key={staff.id}
                        onClick={() => onSelectStaff(staff.id, staff.name)}
                        className="w-full glass-card p-4 rounded-xl flex items-center gap-4 hover:bg-white/10 transition-all group border border-white/5 hover:border-volt/30"
                    >
                        {/* Avatar */}
                        <div className="size-14 bg-gradient-to-br from-volt/20 to-primary/20 rounded-full flex items-center justify-center border-2 border-volt/30 group-hover:border-volt/50 transition-all">
                            <span className="material-symbols-outlined text-volt text-2xl">person</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left">
                            <h3 className="text-white font-bold text-sm">{staff.name}</h3>
                            <p className="text-slate-400 text-xs mt-0.5">{staff.role}</p>
                        </div>

                        {/* Arrow */}
                        <span className="material-symbols-outlined text-slate-600 group-hover:text-volt transition-all">
                            chevron_right
                        </span>
                    </button>
                ))}
            </div>

            {/* Footer Hint */}
            <div className="p-4 border-t border-white/5 bg-surface/50">
                <p className="text-slate-500 text-xs text-center">
                    💡 Puedes chatear con cualquiera de tus entrenadores asignados
                </p>
            </div>
        </div>
    );
};

export default StaffSelector;
