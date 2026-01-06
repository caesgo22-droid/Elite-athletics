import React, { useState, useEffect } from 'react';
import { Athlete, User } from '../types';
import { getAllUsers } from '../services/userManagement';
import { DataRing, EventBus } from '../services/CoreArchitecture';
import { StorageSatellite } from '../services/satellites/StorageSatellite';

interface CoachAssignmentModalProps {
    athlete: Athlete;
    onClose: () => void;
    onSave: () => void;
}

const CoachAssignmentModal: React.FC<CoachAssignmentModalProps> = ({ athlete, onClose, onSave }) => {
    const [availableStaff, setAvailableStaff] = useState<User[]>([]);
    const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
    const [primaryCoachId, setPrimaryCoachId] = useState<string | undefined>(athlete.primaryCoachId);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadStaff();
        // Initialize selected staff from athlete's current assignments
        if (athlete.assignedStaff) {
            setSelectedStaff(new Set(athlete.assignedStaff.map(s => s.id)));
        }
    }, [athlete]);

    const loadStaff = async () => {
        try {
            const allUsers = await getAllUsers();
            const staffUsers = allUsers.filter(u =>
                (u.role === 'STAFF' || u.role === 'ADMIN') && u.status === 'APPROVED'
            );
            setAvailableStaff(staffUsers);
        } catch (error) {
            console.error('Error loading staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStaff = (staffId: string) => {
        const newSelected = new Set(selectedStaff);
        if (newSelected.has(staffId)) {
            newSelected.delete(staffId);
            // If removing primary coach, clear primary
            if (primaryCoachId === staffId) {
                setPrimaryCoachId(undefined);
            }
        } else {
            newSelected.add(staffId);
            // If this is the first coach, make them primary
            if (newSelected.size === 1) {
                setPrimaryCoachId(staffId);
            }
        }
        setSelectedStaff(newSelected);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Build assignedStaff array from selected IDs
            const assignedStaff = availableStaff
                .filter(staff => selectedStaff.has(staff.uid))
                .map(staff => ({
                    id: staff.uid,
                    name: staff.displayName || staff.email,
                    role: staff.role === 'ADMIN' ? 'Head Coach' : 'Coach'
                }));

            // Update athlete with new assignments
            const updatedAthlete: Athlete = {
                ...athlete,
                assignedStaff,
                primaryCoachId: primaryCoachId || (assignedStaff.length > 0 ? assignedStaff[0].id : undefined)
            };

            await StorageSatellite.updateAthlete(updatedAthlete);

            // Trigger DataRing refresh via EventBus
            EventBus.publish('ATHLETE_UPDATED', { athleteId: athlete.id });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving coach assignments:', error);
            alert('Error al guardar asignaciones');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-black text-xl uppercase italic tracking-tight">
                                Asignar Coaches
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">
                                {athlete.name} - Selecciona los entrenadores asignados
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-white text-sm">close</span>
                        </button>
                    </div>
                </div>

                {/* Staff List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="size-8 border-4 border-volt/30 border-t-volt rounded-full animate-spin"></div>
                        </div>
                    ) : availableStaff.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-slate-600 text-5xl mb-3">person_off</span>
                            <p className="text-slate-500">No hay staff disponible</p>
                        </div>
                    ) : (
                        availableStaff.map(staff => {
                            const isSelected = selectedStaff.has(staff.uid);
                            const isPrimary = primaryCoachId === staff.uid;

                            return (
                                <div
                                    key={staff.uid}
                                    className={`glass-card p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                                        ? 'border-volt/50 bg-volt/5'
                                        : 'border-white/5 hover:border-white/20'
                                        }`}
                                    onClick={() => toggleStaff(staff.uid)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Checkbox */}
                                        <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                                            ? 'bg-volt border-volt'
                                            : 'border-white/20'
                                            }`}>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-black text-sm">check</span>
                                            )}
                                        </div>

                                        {/* Avatar */}
                                        <div className="size-12 rounded-xl bg-gradient-to-br from-primary/20 to-volt/20 flex items-center justify-center border border-white/10">
                                            {staff.photoURL ? (
                                                <img src={staff.photoURL} className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-white text-2xl">person</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-white font-bold text-sm">
                                                    {staff.displayName || staff.email}
                                                </h3>
                                                {isPrimary && (
                                                    <span className="text-[8px] px-2 py-0.5 bg-volt/20 text-volt border border-volt/30 rounded font-bold uppercase">
                                                        Principal
                                                    </span>
                                                )}
                                                <span className={`text-[8px] px-2 py-0.5 rounded font-bold uppercase ${staff.role === 'ADMIN'
                                                    ? 'bg-danger/20 text-danger border border-danger/30'
                                                    : 'bg-primary/20 text-primary border border-primary/30'
                                                    }`}>
                                                    {staff.role}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{staff.email}</p>
                                        </div>

                                        {/* Primary Toggle */}
                                        {isSelected && selectedStaff.size > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPrimaryCoachId(staff.uid);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPrimary
                                                    ? 'bg-volt text-black'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {isPrimary ? '★ Principal' : 'Hacer Principal'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        {selectedStaff.size} coach{selectedStaff.size !== 1 ? 'es' : ''} seleccionado{selectedStaff.size !== 1 ? 's' : ''}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 bg-white/5 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || selectedStaff.size === 0}
                            className="px-6 py-2 bg-volt text-black rounded-xl font-bold text-sm hover:bg-volt/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Asignaciones'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachAssignmentModal;
