import React, { useState } from 'react';
import { DataRing, EventBus, useDataRing } from '../services/CoreArchitecture';
import { Injury, TherapyLog } from '../types';
import { Badge } from './common/Atomic';

interface HealthSectionProps {
    onBack: () => void;
    userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN' | 'PENDING';
    athleteId?: string;
}

const THERAPY_TYPES = [
    'Cold Plunge', 'Masaje', 'Descarga Muscular', 'STEM',
    'Pistola Vibración', 'Fisioterapia', 'Botas Compresión', 'Otro'
];

const HealthSection: React.FC<HealthSectionProps> = ({ onBack, athleteId = '', userRole }) => {
    const athlete = useDataRing((ring) => ring.getAthlete(athleteId));

    // Form visibility
    const [showInjuryForm, setShowInjuryForm] = useState(false);
    const [showTherapyForm, setShowTherapyForm] = useState(false);

    // Editing state
    const [editingInjuryId, setEditingInjuryId] = useState<string | null>(null);
    const [editingTherapyId, setEditingTherapyId] = useState<string | null>(null);

    // Injury form
    const [injuryForm, setInjuryForm] = useState({
        bodyPart: '',
        painLevel: 5,
        date: new Date().toISOString().split('T')[0],
        status: 'ACTIVE' as 'ACTIVE' | 'RESOLVED',
        notes: '',
        type: 'MUSCULAR' as Injury['type']
    });

    // Therapy form
    const [therapyForm, setTherapyForm] = useState({
        type: 'Masaje',
        customType: '',
        duration: 30,
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const handleSaveInjury = () => {
        if (!injuryForm.bodyPart) return;
        const injury: Injury = {
            id: editingInjuryId || `inj_${Date.now()}`,
            bodyPart: injuryForm.bodyPart,
            type: injuryForm.type,
            severity: Math.ceil(injuryForm.painLevel / 2) as 1 | 2 | 3 | 4 | 5,
            dateOccurred: injuryForm.date,
            status: injuryForm.status,
            notes: injuryForm.notes,
            vasPain: injuryForm.painLevel
        };
        DataRing.ingestData('MODULE_HEALTH', 'INJURY_UPDATE', { athleteId, injury });
        resetInjuryForm();
    };

    const resetInjuryForm = () => {
        setInjuryForm({ bodyPart: '', painLevel: 5, date: new Date().toISOString().split('T')[0], status: 'ACTIVE', notes: '', type: 'MUSCULAR' });
        setShowInjuryForm(false);
        setEditingInjuryId(null);
    };

    const handleSaveTherapy = () => {
        const therapy: TherapyLog = {
            id: editingTherapyId || `th_${Date.now()}`,
            date: therapyForm.date,
            time: new Date().toTimeString().slice(0, 5),
            type: therapyForm.type === 'Otro' ? therapyForm.customType : therapyForm.type,
            duration: therapyForm.duration,
            notes: therapyForm.notes
        };
        DataRing.ingestData('MODULE_HEALTH', 'THERAPY_SESSION', { athleteId, therapy });
        resetTherapyForm();
    };

    const resetTherapyForm = () => {
        setTherapyForm({ type: 'Masaje', customType: '', duration: 30, date: new Date().toISOString().split('T')[0], notes: '' });
        setShowTherapyForm(false);
        setEditingTherapyId(null);
    };

    const handleEditInjury = (inj: Injury) => {
        setInjuryForm({
            bodyPart: inj.bodyPart,
            painLevel: inj.vasPain,
            date: inj.dateOccurred,
            status: inj.status,
            notes: inj.notes,
            type: inj.type
        });
        setEditingInjuryId(inj.id);
        setShowInjuryForm(true);
    };

    const handleEditTherapy = (th: TherapyLog) => {
        const isCustom = !THERAPY_TYPES.includes(th.type);
        setTherapyForm({
            type: isCustom ? 'Otro' : th.type,
            customType: isCustom ? th.type : '',
            duration: th.duration,
            date: th.date,
            notes: th.notes
        });
        setEditingTherapyId(th.id);
        setShowTherapyForm(true);
    };

    const handleDelete = (type: 'injury' | 'therapy', id: string) => {
        if (window.confirm('¿Eliminar este registro?')) {
            EventBus.publish('UI_FEEDBACK', { message: 'Registro eliminado', type: 'success' });
        }
    };

    if (!athlete) return <div className="text-white p-4">Cargando...</div>;

    const activeInjuries = athlete.injuryHistory?.filter(i => i.status === 'ACTIVE') || [];
    const resolvedInjuries = athlete.injuryHistory?.filter(i => i.status === 'RESOLVED') || [];
    const therapies = athlete.recentTherapies || [];

    return (
        <div className="h-full bg-background overflow-y-auto custom-scrollbar">
            <div className="max-w-lg mx-auto p-3 pb-24 space-y-3">

                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 z-10 bg-background py-2 -mx-3 px-3">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                        </button>
                        <h1 className="text-sm font-black text-white uppercase">Salud</h1>
                    </div>
                    <div className={`size-2 rounded-full ${activeInjuries.length > 0 ? 'bg-danger animate-pulse' : 'bg-success'}`}></div>
                </div>

                {/* ACWR & Active Injuries Insight */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="glass-card p-3 rounded-xl">
                        <p className="text-[8px] text-slate-500 uppercase">ACWR</p>
                        <p className={`text-xl font-mono font-black ${athlete.acwr > 1.3 ? 'text-danger' : athlete.acwr > 1.1 ? 'text-warning' : 'text-success'}`}>
                            {athlete.acwr?.toFixed(2) || '1.00'}
                        </p>
                        <p className="text-[8px] text-slate-600">
                            {athlete.acwr > 1.3 ? 'Alto Riesgo' : athlete.acwr > 1.1 ? 'Precaución' : 'Óptimo'}
                        </p>
                    </div>
                    <div className={`glass-card p-3 rounded-xl ${activeInjuries.length > 0 ? 'border-danger/30' : ''}`}>
                        <p className="text-[8px] text-slate-500 uppercase">Lesiones Activas</p>
                        <p className={`text-xl font-mono font-black ${activeInjuries.length > 0 ? 'text-danger' : 'text-success'}`}>
                            {activeInjuries.length}
                        </p>
                        <p className="text-[8px] text-slate-600">
                            {activeInjuries.length > 0 ? activeInjuries[0]?.bodyPart : 'Sin lesiones'}
                        </p>
                    </div>
                </div>

                {/* Injuries Section */}
                <div className="glass-card p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">Lesiones</span>
                        <button
                            onClick={() => { resetInjuryForm(); setShowInjuryForm(!showInjuryForm); }}
                            className={`size-6 rounded-lg flex items-center justify-center transition-all ${showInjuryForm ? 'bg-danger text-white' : 'bg-danger/20 text-danger hover:bg-danger hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">{showInjuryForm ? 'close' : 'add'}</span>
                        </button>
                    </div>

                    {/* Injury Form */}
                    {showInjuryForm && (
                        <div className="space-y-2 mb-3 p-2 bg-black/30 rounded-lg border border-danger/20">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Zona afectada"
                                    className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                    value={injuryForm.bodyPart}
                                    onChange={e => setInjuryForm({ ...injuryForm, bodyPart: e.target.value })}
                                />
                                <select
                                    className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                    value={injuryForm.type}
                                    onChange={e => setInjuryForm({ ...injuryForm, type: e.target.value as any })}
                                >
                                    <option value="MUSCULAR">Muscular</option>
                                    <option value="TENDON">Tendón</option>
                                    <option value="BONE">Óseo</option>
                                    <option value="LIGAMENT">Ligamento</option>
                                    <option value="OTHER">Otro</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[7px] text-slate-500 block mb-0.5">Dolor (1-10)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        className="w-full bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white text-center"
                                        value={injuryForm.painLevel}
                                        onChange={e => setInjuryForm({ ...injuryForm, painLevel: parseInt(e.target.value) || 5 })}
                                    />
                                </div>
                                <input
                                    type="date"
                                    className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white [color-scheme:dark]"
                                    value={injuryForm.date}
                                    onChange={e => setInjuryForm({ ...injuryForm, date: e.target.value })}
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setInjuryForm({ ...injuryForm, status: 'ACTIVE' })}
                                        className={`flex-1 py-1.5 rounded text-[8px] font-bold ${injuryForm.status === 'ACTIVE' ? 'bg-danger text-white' : 'bg-white/5 text-slate-500'}`}
                                    >
                                        Activa
                                    </button>
                                    <button
                                        onClick={() => setInjuryForm({ ...injuryForm, status: 'RESOLVED' })}
                                        className={`flex-1 py-1.5 rounded text-[8px] font-bold ${injuryForm.status === 'RESOLVED' ? 'bg-success text-white' : 'bg-white/5 text-slate-500'}`}
                                    >
                                        Resuelta
                                    </button>
                                </div>
                            </div>
                            <input
                                placeholder="Comentarios"
                                className="w-full bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                value={injuryForm.notes}
                                onChange={e => setInjuryForm({ ...injuryForm, notes: e.target.value })}
                            />
                            <div className="flex gap-2">
                                <label className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 rounded text-[9px] text-slate-400 cursor-pointer hover:bg-white/10">
                                    <span className="material-symbols-outlined text-sm">attach_file</span>
                                    Adjuntar
                                    <input type="file" className="hidden" accept="image/*,.pdf" />
                                </label>
                                <button onClick={handleSaveInjury} className="px-4 py-1.5 bg-danger text-white rounded text-[10px] font-bold">
                                    {editingInjuryId ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Injury History */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {[...activeInjuries, ...resolvedInjuries].map(inj => (
                            <div key={inj.id} className={`flex items-center justify-between p-2 rounded-lg group ${inj.status === 'ACTIVE' ? 'bg-danger/10 border border-danger/20' : 'bg-black/30'}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined text-sm ${inj.status === 'ACTIVE' ? 'text-danger' : 'text-success'}`}>
                                        {inj.status === 'ACTIVE' ? 'healing' : 'check_circle'}
                                    </span>
                                    <div>
                                        <p className="text-[10px] text-white font-medium">{inj.bodyPart}</p>
                                        <p className="text-[8px] text-slate-500">{inj.dateOccurred} • Dolor: {inj.vasPain}/10</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <button onClick={() => handleEditInjury(inj)} className="size-5 rounded bg-info/10 text-info flex items-center justify-center hover:bg-info hover:text-white">
                                        <span className="material-symbols-outlined text-[10px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete('injury', inj.id)} className="size-5 rounded bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white">
                                        <span className="material-symbols-outlined text-[10px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {activeInjuries.length === 0 && resolvedInjuries.length === 0 && (
                            <p className="text-center text-slate-600 text-xs py-2">Sin registros</p>
                        )}
                    </div>
                </div>

                {/* Therapies Section */}
                <div className="glass-card p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">Terapias</span>
                        <button
                            onClick={() => { resetTherapyForm(); setShowTherapyForm(!showTherapyForm); }}
                            className={`size-6 rounded-lg flex items-center justify-center transition-all ${showTherapyForm ? 'bg-success text-white' : 'bg-success/20 text-success hover:bg-success hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-sm">{showTherapyForm ? 'close' : 'add'}</span>
                        </button>
                    </div>

                    {/* Therapy Form */}
                    {showTherapyForm && (
                        <div className="space-y-2 mb-3 p-2 bg-black/30 rounded-lg border border-success/20">
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                    value={therapyForm.type}
                                    onChange={e => setTherapyForm({ ...therapyForm, type: e.target.value })}
                                >
                                    {THERAPY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {therapyForm.type === 'Otro' && (
                                    <input
                                        placeholder="Especificar"
                                        className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                        value={therapyForm.customType}
                                        onChange={e => setTherapyForm({ ...therapyForm, customType: e.target.value })}
                                    />
                                )}
                                {therapyForm.type !== 'Otro' && (
                                    <input
                                        type="date"
                                        className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white [color-scheme:dark]"
                                        value={therapyForm.date}
                                        onChange={e => setTherapyForm({ ...therapyForm, date: e.target.value })}
                                    />
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {therapyForm.type === 'Otro' && (
                                    <input
                                        type="date"
                                        className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white [color-scheme:dark]"
                                        value={therapyForm.date}
                                        onChange={e => setTherapyForm({ ...therapyForm, date: e.target.value })}
                                    />
                                )}
                                <div className={therapyForm.type === 'Otro' ? '' : 'col-span-1'}>
                                    <label className="text-[7px] text-slate-500 block mb-0.5">Min</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white text-center"
                                        value={therapyForm.duration}
                                        onChange={e => setTherapyForm({ ...therapyForm, duration: parseInt(e.target.value) || 30 })}
                                    />
                                </div>
                                <input
                                    placeholder="Notas"
                                    className={`bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white ${therapyForm.type === 'Otro' ? '' : 'col-span-1'}`}
                                    value={therapyForm.notes}
                                    onChange={e => setTherapyForm({ ...therapyForm, notes: e.target.value })}
                                />
                                <button onClick={handleSaveTherapy} className="px-3 py-1.5 bg-success text-white rounded text-[10px] font-bold">
                                    {editingTherapyId ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Therapy History */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {therapies.map(th => (
                            <div key={th.id} className="flex items-center justify-between bg-black/30 p-2 rounded-lg group">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-success text-sm">spa</span>
                                    <div>
                                        <p className="text-[10px] text-white font-medium">{th.type}</p>
                                        <p className="text-[8px] text-slate-500">{th.date} • {th.duration}min</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <button onClick={() => handleEditTherapy(th)} className="size-5 rounded bg-info/10 text-info flex items-center justify-center hover:bg-info hover:text-white">
                                        <span className="material-symbols-outlined text-[10px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete('therapy', th.id)} className="size-5 rounded bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white">
                                        <span className="material-symbols-outlined text-[10px]">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {therapies.length === 0 && (
                            <p className="text-center text-slate-600 text-xs py-2">Sin registros</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HealthSection;