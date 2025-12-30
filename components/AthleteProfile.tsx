import React, { useState, useEffect } from 'react';
import { StaffMember, ViewState, Competition, Athlete } from '../types';
import { Badge } from './common/Atomic';
import { LegalFooter } from './common/LegalFooter';
import { DataRing } from '../services/CoreArchitecture';

interface AthleteProfileProps {
  onBack: () => void;
  onNavigate?: (view: ViewState) => void;
  athleteId?: string; // NEW: Optional because it might default to '1' for athlete view
}

const AthleteProfile: React.FC<AthleteProfileProps> = ({ onBack, athleteId = '1' }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    experienceYears: 0,
    height: 0,
    weight: 0,
  });

  // Available Days
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const toggleDay = (day: string) => {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  useEffect(() => {
    const athlete = DataRing.getAthlete(athleteId);
    if (athlete) {
      setFormData({
        name: athlete.name,
        age: athlete.age || 24,
        experienceYears: athlete.experienceYears || 8,
        height: 185,
        weight: 82
      });
      // In a real scenario, we'd map these from the athlete object if they existed
      // specific mappings for availableDays etc would go here
    }
  }, []);

  // Events Management
  const [events, setEvents] = useState([
    { name: '100m', pb: '9.98' },
    { name: '200m', pb: '19.92' },
    { name: '400m', pb: '44.15' }
  ]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', pb: '' });

  // Competition Management
  const [competitions, setCompetitions] = useState<Competition[]>([
    { id: 'c1', name: 'Nacional', date: '2024-06-05', priority: 'A', targetEvent: '100m' }
  ]);
  const [showAddComp, setShowAddComp] = useState(false);
  const [newComp, setNewComp] = useState({ name: '', date: '' });

  // Staff Management
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: '1', name: 'Coach David', role: 'Entrenador', email: 'david@elite5.com', phone: '', imgUrl: '' }
  ]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', role: '', email: '', phone: '' });

  const handleAddEvent = () => {
    if (!newEvent.name) return;
    setEvents([...events, { name: newEvent.name, pb: newEvent.pb || '--' }]);
    setNewEvent({ name: '', pb: '' });
    setShowAddEvent(false);
  };

  const handleAddComp = () => {
    if (!newComp.name || !newComp.date) return;
    const comp: Competition = {
      id: Date.now().toString(),
      name: newComp.name,
      date: newComp.date,
      priority: 'B',
      targetEvent: events[0]?.name || '100m'
    };
    setCompetitions([...competitions, comp]);
    setNewComp({ name: '', date: '' });
    setShowAddComp(false);
  };

  const handleAddStaff = () => {
    if (!newStaff.name) return;
    const member: StaffMember = {
      id: Date.now().toString(),
      name: newStaff.name,
      role: newStaff.role || 'Staff',
      email: newStaff.email,
      phone: newStaff.phone,
      imgUrl: `https://ui-avatars.com/api/?name=${newStaff.name}&background=random`
    };
    setStaff([...staff, member]);
    setNewStaff({ name: '', role: '', email: '', phone: '' });
    setShowAddStaff(false);
  };

  const handleSave = () => {
    // Ingest Update
    DataRing.ingestData('MODULE_PROFILE', 'PROFILE_UPDATE', {
      athleteId: '1',
      updates: {
        name: formData.name,
        // Map other fields as expanded in the Athlete type
      }
    });
    alert('Perfil actualizado correctamente');
    onBack();
  };

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto p-3 pb-24 space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center sticky top-0 z-10 bg-background py-2 -mx-3 px-3">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-xs font-bold uppercase">
            ← Cancelar
          </button>
          <h1 className="text-sm font-black text-white uppercase">Editar Perfil</h1>
          <button onClick={handleSave} className="text-primary hover:text-white text-xs font-bold uppercase">
            Guardar
          </button>
        </div>

        {/* Photo + Name Row */}
        <div className="glass-card p-3 rounded-xl flex items-center gap-4">
          <div className="relative size-16 shrink-0">
            <div className="size-16 bg-black border-2 border-white/10 rounded-xl overflow-hidden">
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src="https://i.pravatar.cc/150?u=mateo"
              />
            </div>
            <button className="absolute -bottom-1 -right-1 size-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
              <span className="material-symbols-outlined text-white text-xs">photo_camera</span>
            </button>
          </div>
          <div className="flex-1">
            <label className="text-[8px] text-slate-500 uppercase">Nombre</label>
            <input
              className="w-full bg-transparent border-b border-white/10 text-white text-sm font-bold py-1 focus:border-primary outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="glass-card p-2 rounded-lg text-center">
            <label className="text-[7px] text-slate-500 uppercase block">Edad</label>
            <input
              type="number"
              className="w-full bg-transparent text-white text-sm font-mono font-bold text-center outline-none"
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="glass-card p-2 rounded-lg text-center">
            <label className="text-[7px] text-slate-500 uppercase block">Exp</label>
            <input
              type="number"
              className="w-full bg-transparent text-white text-sm font-mono font-bold text-center outline-none"
              value={formData.experienceYears}
              onChange={e => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
            />
            <span className="text-[7px] text-slate-600">años</span>
          </div>
          <div className="glass-card p-2 rounded-lg text-center">
            <label className="text-[7px] text-slate-500 uppercase block">Altura</label>
            <input
              type="number"
              className="w-full bg-transparent text-white text-sm font-mono font-bold text-center outline-none"
              value={formData.height}
              onChange={e => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
            />
            <span className="text-[7px] text-slate-600">cm</span>
          </div>
          <div className="glass-card p-2 rounded-lg text-center">
            <label className="text-[7px] text-slate-500 uppercase block">Peso</label>
            <input
              type="number"
              className="w-full bg-transparent text-white text-sm font-mono font-bold text-center outline-none"
              value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
            />
            <span className="text-[7px] text-slate-600">kg</span>
          </div>
        </div>

        {/* Available Days */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Días Disponibles</span>
          </div>
          <div className="flex gap-1.5">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${availableDays.includes(day)
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-slate-500 hover:bg-white/10'
                  }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Pruebas</span>
            <button
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="size-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">{showAddEvent ? 'close' : 'add'}</span>
            </button>
          </div>

          {showAddEvent && (
            <div className="flex gap-2 mb-2">
              <input
                placeholder="Prueba (100m)"
                className="flex-1 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                value={newEvent.name}
                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
              />
              <input
                placeholder="PB"
                className="w-16 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white text-center"
                value={newEvent.pb}
                onChange={e => setNewEvent({ ...newEvent, pb: e.target.value })}
              />
              <button onClick={handleAddEvent} className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold">OK</button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {events.map((e, i) => (
              <div key={i} className="bg-black/50 border border-white/10 px-2 py-1 rounded-lg flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">{e.name}</span>
                <span className="text-[10px] text-volt font-mono font-bold">{e.pb}</span>
                <button onClick={() => setEvents(events.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-danger">
                  <span className="material-symbols-outlined text-[10px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Competitions */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Competencias</span>
            <button
              onClick={() => setShowAddComp(!showAddComp)}
              className="size-6 rounded-lg bg-warning/20 text-warning flex items-center justify-center hover:bg-warning hover:text-black transition-all"
            >
              <span className="material-symbols-outlined text-sm">{showAddComp ? 'close' : 'add'}</span>
            </button>
          </div>

          {showAddComp && (
            <div className="flex gap-2 mb-2">
              <input
                placeholder="Nombre"
                className="flex-1 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                value={newComp.name}
                onChange={e => setNewComp({ ...newComp, name: e.target.value })}
              />
              <input
                type="date"
                className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white [color-scheme:dark]"
                value={newComp.date}
                onChange={e => setNewComp({ ...newComp, date: e.target.value })}
              />
              <button onClick={handleAddComp} className="px-3 py-1.5 bg-warning text-black rounded text-xs font-bold">OK</button>
            </div>
          )}

          <div className="space-y-1.5">
            {competitions.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-black/30 border border-white/5 px-2 py-1.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-warning text-sm">flag</span>
                  <span className="text-[10px] text-white font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-slate-500">{c.date}</span>
                  <button onClick={() => setCompetitions(competitions.filter(x => x.id !== c.id))} className="text-slate-600 hover:text-danger">
                    <span className="material-symbols-outlined text-[10px]">close</span>
                  </button>
                </div>
              </div>
            ))}
            {competitions.length === 0 && (
              <p className="text-[10px] text-slate-500 text-center py-2">Sin competencias programadas</p>
            )}
          </div>
        </div>

        {/* Staff */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Staff</span>
            <button
              onClick={() => setShowAddStaff(!showAddStaff)}
              className="size-6 rounded-lg bg-info/20 text-info flex items-center justify-center hover:bg-info hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">{showAddStaff ? 'close' : 'add'}</span>
            </button>
          </div>

          {showAddStaff && (
            <div className="space-y-2 mb-2">
              <div className="flex gap-2">
                <input
                  placeholder="Nombre"
                  className="flex-1 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                />
                <input
                  placeholder="Rol"
                  className="w-24 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                  value={newStaff.role}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Email"
                  type="email"
                  className="flex-1 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                />
                <input
                  placeholder="Tel"
                  type="tel"
                  className="w-24 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                  value={newStaff.phone}
                  onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                />
                <button onClick={handleAddStaff} className="px-3 py-1.5 bg-info text-white rounded text-xs font-bold">OK</button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-black/30 border border-white/5 px-2 py-1.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-info/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-info text-xs">person</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-white font-medium">{s.name} <span className="text-slate-500">({s.role})</span></p>
                    <p className="text-[9px] text-slate-500">{s.email}</p>
                  </div>
                </div>
                <button onClick={() => setStaff(staff.filter(x => x.id !== s.id))} className="text-slate-600 hover:text-danger">
                  <span className="material-symbols-outlined text-[10px]">close</span>
                </button>
              </div>
            ))}
            {staff.length === 0 && (
              <p className="text-[10px] text-slate-500 text-center py-2">Sin staff añadido</p>
            )}
          </div>
        </div>

        <LegalFooter />

      </div>
    </div>
  );
};

export default AthleteProfile;
