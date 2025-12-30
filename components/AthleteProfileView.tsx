import React, { useMemo, useState } from 'react';
import { ViewState } from '../types';
import { Badge, Button } from './common/Atomic';
import { LegalFooter } from './common/LegalFooter';
import { WidgetFacades } from '../services/WidgetFacades';
import { useDataRing } from '../services/CoreArchitecture';

interface AthleteProfileViewProps {
    onNavigate: (view: ViewState) => void;
    athleteId?: string;
    userRole?: 'ATHLETE' | 'STAFF';
}

/**
 * Página de Perfil de Atleta (Read-Only)
 * Vista completa con información del atleta, competencias y staff
 */
const AthleteProfileView: React.FC<AthleteProfileViewProps> = ({ onNavigate, athleteId = '1', userRole = 'ATHLETE' }) => {
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useDataRing(() => {
        setUpdateTrigger(prev => prev + 1);
        return updateTrigger;
    });

    const profileData = useMemo(() => WidgetFacades.profile.getSummary(athleteId), [athleteId, updateTrigger]);
    const macrocycleData = useMemo(() => WidgetFacades.macrocycle.getSummary(athleteId), [athleteId, updateTrigger]);

    // Mock staff data (in production, this would come from a StaffFacade)
    const staffMembers = [
        { role: 'Entrenador Principal', name: 'Carlos García', icon: 'sports' },
        { role: 'Fisioterapeuta', name: 'Ana Martínez', icon: 'healing' },
        { role: 'Nutriólogo', name: 'Dr. Roberto Sánchez', icon: 'restaurant' },
        { role: 'Psicólogo Deportivo', name: 'Lic. María López', icon: 'psychology' }
    ];

    return (
        <div className="h-full flex flex-col bg-background overflow-y-auto custom-scrollbar">
            <div className="p-4 lg:p-6 max-w-4xl mx-auto w-full space-y-4">

                {/* Header with Back */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigate(ViewState.DASHBOARD)}
                        className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-black text-white uppercase tracking-tight">Perfil de Atleta</h1>
                </div>

                {/* Hero Section */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Large Photo */}
                        <div className="relative size-28 md:size-36 shrink-0">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary to-volt blur opacity-30"></div>
                            <div className="absolute inset-[3px] rounded-3xl bg-black overflow-hidden">
                                <img src={profileData.imgUrl} alt={profileData.name} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute -bottom-1 -right-1 size-8 rounded-full border-3 border-background flex items-center justify-center ${profileData.status === 'HIGH_RISK' ? 'bg-danger' : profileData.status === 'CAUTION' ? 'bg-warning' : 'bg-success'
                                }`}>
                                <span className="material-symbols-outlined text-sm text-white">
                                    {profileData.status === 'OPTIMAL' ? 'check' : 'warning'}
                                </span>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-2xl md:text-3xl font-black font-display text-white uppercase italic tracking-tight">
                                {profileData.name}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Velocista • 8 años de experiencia</p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-mono font-black text-white">{profileData.age}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Años</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-mono font-black text-white">{profileData.height}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Estatura</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-mono font-black text-white">{profileData.weight}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Peso</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events & PBs */}
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">emoji_events</span>
                        Pruebas & Records Personales
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {profileData.events.map((event, i) => (
                            <div key={i} className="bg-black/40 border border-white/10 p-3 rounded-xl text-center hover:border-volt/30 transition-colors">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{event.name}</p>
                                <p className="text-xl font-mono font-black text-volt mt-1">{event.pb}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Available Days */}
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                        Días Disponibles para Entrenar
                    </h3>
                    <div className="flex gap-2">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                            <div
                                key={day}
                                className={`flex-1 py-2 rounded-lg text-center text-xs font-black uppercase ${profileData.availableDays.includes(day)
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-white/[0.02] text-slate-600 border border-white/5'
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Competitions */}
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-warning text-sm">flag</span>
                        Próximas Competencias
                    </h3>
                    {macrocycleData.competitions.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">Sin competencias programadas</p>
                    ) : (
                        <div className="space-y-2">
                            {macrocycleData.competitions.map((comp, i) => (
                                <div key={i} className="flex items-center justify-between bg-black/40 border border-white/10 p-3 rounded-lg">
                                    <span className="text-white text-sm font-medium">{comp.name}</span>
                                    <Badge variant="warning" className="text-[8px]">Semana {comp.week}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Staff Team - Hidden for Athletes */}
                {userRole === 'STAFF' && (
                    <div className="glass-card p-4 rounded-xl">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-info text-sm">groups</span>
                            Staff de Apoyo
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {staffMembers.map((member, i) => (
                                <div key={i} className="flex items-center gap-3 bg-black/40 border border-white/10 p-3 rounded-lg">
                                    <div className="size-9 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-info text-sm">{member.icon}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-xs font-medium truncate">{member.name}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{member.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <LegalFooter />

                {/* Edit Profile Button */}
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onNavigate(ViewState.PROFILE)}
                >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar Perfil
                </Button>
            </div>
        </div>
    );
};

export default AthleteProfileView;
