import React, { useEffect } from 'react';
import { ViewState } from '../types';
import { Badge, Button } from './common/Atomic';
import { BackButton } from './common/BackButton';
import { DataRing } from '../services/CoreArchitecture';

interface CoachProfileViewProps {
    onBack: () => void;
}

const CoachProfileView: React.FC<CoachProfileViewProps> = ({ onBack }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [athleteCount, setAthleteCount] = React.useState(0);
    const [coachData, setCoachData] = React.useState({
        name: "Carlos García",
        title: "Head Coach - Level 5 World Athletics",
        specialty: "Sprints & Hurdles",
        experience: "15 años",
        imgUrl: "https://i.pravatar.cc/150?u=staff",
        credentials: ['World Athletics Level 5 Academy', 'NSCA CSCS Certified', 'Exos Performance Specialist']
    });

    // Update athlete count dynamically
    useEffect(() => {
        const updateAthleteCount = () => {
            const athletes = DataRing.getAllAthletes();
            setAthleteCount(athletes.length);
        };

        updateAthleteCount();
        // Update every 5 seconds
        const interval = setInterval(updateAthleteCount, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSave = () => {
        setIsEditing(false);
        // In a real app, this would call DataRing.updateStaff()
        alert("Credenciales actualizadas");
    };

    return (
        <div className="h-full bg-background overflow-y-auto custom-scrollbar p-4 lg:p-6">
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <BackButton onClick={onBack} />
                    <h1 className="text-lg font-black text-white uppercase italic">Perfil Profesional</h1>
                </div>

                <div className="glass-card p-6 rounded-2xl flex items-center gap-6 border-volt/20">
                    <img src={coachData.imgUrl} className="size-24 rounded-2xl border-2 border-volt/30 shadow-glow-volt/20" />
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-2">
                                <input
                                    className="w-full bg-black/50 border border-white/10 px-2 py-1 rounded text-lg font-black text-white uppercase"
                                    value={coachData.name}
                                    onChange={e => setCoachData({ ...coachData, name: e.target.value })}
                                />
                                <input
                                    className="w-full bg-black/50 border border-white/10 px-2 py-1 rounded text-xs text-volt font-bold uppercase"
                                    value={coachData.title}
                                    onChange={e => setCoachData({ ...coachData, title: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl font-black text-white uppercase leading-tight">{coachData.name}</h2>
                                <p className="text-volt text-[10px] font-black uppercase tracking-widest mt-1">{coachData.title}</p>
                            </div>
                        )}

                        <div className="flex gap-4 mt-3">
                            <div>
                                <p className="text-xs font-bold text-white tracking-widest">{athleteCount}</p>
                                <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Atletas</p>
                            </div>
                            <div>
                                {isEditing ? (
                                    <input
                                        className="w-20 bg-black/50 border border-white/10 px-1 py-0.5 rounded text-xs font-bold text-white tracking-widest"
                                        value={coachData.experience}
                                        onChange={e => setCoachData({ ...coachData, experience: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-xs font-bold text-white tracking-widest">{coachData.experience}</p>
                                )}
                                <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Exp.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-1">Credenciales & Certificaciones</p>
                    <div className="grid gap-2">
                        {coachData.credentials.map((cert, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3">
                                <span className="material-symbols-outlined text-volt text-lg">verified</span>
                                {isEditing ? (
                                    <input
                                        className="flex-1 bg-black/50 border border-white/10 px-2 py-1 rounded text-[11px] font-bold text-slate-200"
                                        value={cert}
                                        onChange={e => {
                                            const newCreds = [...coachData.credentials];
                                            newCreds[i] = e.target.value;
                                            setCoachData({ ...coachData, credentials: newCreds });
                                        }}
                                    />
                                ) : (
                                    <span className="text-[11px] font-bold text-slate-200">{cert}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <Button
                    variant={isEditing ? 'primary' : 'outline'}
                    className={`w-full ${!isEditing && 'opacity-50'}`}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                    {isEditing ? 'Guardar Cambios' : 'Editar Credenciales Profesionales'}
                </Button>
            </div>
        </div>
    );
};

export default CoachProfileView;
