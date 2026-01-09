import React, { useEffect, useState } from 'react';
import { ViewState, User } from '../types';
import { Badge, Button } from './common/Atomic';
import { BackButton } from './common/BackButton';
import { DataRing } from '../services/CoreArchitecture';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { logger } from '../services/Logger';

interface CoachProfileViewProps {
    onBack: () => void;
    currentUser: User;
    userId: string;
}

interface CoachProfile {
    name: string;
    title: string;
    specialty: string;
    experience: string;
    imgUrl: string;
    credentials: string[];
}

const CoachProfileView: React.FC<CoachProfileViewProps> = ({ onBack, currentUser, userId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [athleteCount, setAthleteCount] = useState(0);
    const [coachData, setCoachData] = useState<CoachProfile>({
        name: currentUser.displayName || currentUser.email,
        title: "Head Coach",
        specialty: "Sprints & Hurdles",
        experience: "0 años",
        imgUrl: currentUser.photoURL || "https://i.pravatar.cc/150?u=staff",
        credentials: []
    });

    // Load coach profile from Firestore
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setCoachData({
                        name: userData.displayName || userData.email,
                        title: userData.title || "Head Coach",
                        specialty: userData.specialty || "Sprints & Hurdles",
                        experience: userData.experience || "0 años",
                        imgUrl: userData.photoURL || "https://i.pravatar.cc/150?u=staff",
                        credentials: userData.credentials || []
                    });
                }
            } catch (error) {
                logger.error('[CoachProfile] Error loading profile:', error);
            }
        };

        loadProfile();
    }, [userId]);

    // Update athlete count dynamically
    useEffect(() => {
        const updateAthleteCount = () => {
            const athletes = DataRing.getAllAthletes();
            setAthleteCount(athletes.length);
        };

        updateAthleteCount();
        const interval = setInterval(updateAthleteCount, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                displayName: coachData.name,
                title: coachData.title,
                specialty: coachData.specialty,
                experience: coachData.experience,
                credentials: coachData.credentials.filter(c => c.trim() !== '')
            });

            setIsEditing(false);
            logger.log('[CoachProfile] Profile updated successfully');
        } catch (error) {
            logger.error('[CoachProfile] Error saving profile:', error);
            alert('Error al guardar los cambios. Por favor intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    const addCredential = () => {
        setCoachData({
            ...coachData,
            credentials: [...coachData.credentials, '']
        });
    };

    const removeCredential = (index: number) => {
        const newCreds = coachData.credentials.filter((_, i) => i !== index);
        setCoachData({ ...coachData, credentials: newCreds });
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
                                    placeholder="Nombre completo"
                                />
                                <input
                                    className="w-full bg-black/50 border border-white/10 px-2 py-1 rounded text-xs text-volt font-bold uppercase"
                                    value={coachData.title}
                                    onChange={e => setCoachData({ ...coachData, title: e.target.value })}
                                    placeholder="Título profesional"
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
                                        placeholder="15 años"
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
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Credenciales & Certificaciones</p>
                        {isEditing && (
                            <button
                                onClick={addCredential}
                                className="text-volt text-xs font-bold hover:text-volt/80 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                Agregar
                            </button>
                        )}
                    </div>
                    <div className="grid gap-2">
                        {coachData.credentials.length === 0 && !isEditing ? (
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                                <p className="text-[11px] text-slate-500">No hay credenciales agregadas</p>
                            </div>
                        ) : (
                            coachData.credentials.map((cert, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3">
                                    <span className="material-symbols-outlined text-volt text-lg">verified</span>
                                    {isEditing ? (
                                        <>
                                            <input
                                                className="flex-1 bg-black/50 border border-white/10 px-2 py-1 rounded text-[11px] font-bold text-slate-200"
                                                value={cert}
                                                onChange={e => {
                                                    const newCreds = [...coachData.credentials];
                                                    newCreds[i] = e.target.value;
                                                    setCoachData({ ...coachData, credentials: newCreds });
                                                }}
                                                placeholder="Nombre de la certificación"
                                            />
                                            <button
                                                onClick={() => removeCredential(i)}
                                                className="text-danger hover:text-danger/80 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-[11px] font-bold text-slate-200">{cert}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <Button
                    variant={isEditing ? 'primary' : 'outline'}
                    className={`w-full ${!isEditing && 'opacity-50'}`}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                >
                    {isSaving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Editar Credenciales Profesionales'}
                </Button>
            </div>
        </div>
    );
};

export default CoachProfileView;
