import React, { useState, useEffect } from 'react';
import { StaffMember, ViewState, Competition, Athlete } from '../types';
import { Badge } from './common/Atomic';
import { LegalFooter } from './common/LegalFooter';
import { DataRing } from '../services/CoreArchitecture';

interface AthleteProfileProps {
  onBack: () => void;
  onNavigate?: (view: ViewState) => void;
  athleteId?: string;
  userRole?: 'ATHLETE' | 'STAFF';
}

const AthleteProfile: React.FC<AthleteProfileProps> = ({ onBack, athleteId = '1', userRole = 'ATHLETE' }) => {
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

  const [profilePhoto, setProfilePhoto] = useState('');

  // Link Staff State
  const [showLinkStaffModal, setShowLinkStaffModal] = useState(false);
  const [linkStaffEmail, setLinkStaffEmail] = useState('');

  const handleLinkStaff = () => {
    if (!linkStaffEmail) return;

    const request = {
      id: Date.now().toString(),
      coachId: 'PENDING',
      coachName: 'Staff Member',
      coachEmail: linkStaffEmail,
      coachRole: 'Staff',
      requestDate: new Date().toISOString(),
      status: 'PENDING' as const,
      direction: 'OUTGOING' as const
    };

    DataRing.ingestData('MODULE_PROFILE', 'LINK_REQUEST', {
      action: 'CREATE',
      athleteIdentifier: athleteId,
      request
    });

    setLinkStaffEmail('');
    setShowLinkStaffModal(false);
    alert('✅ Solicitud enviada al miembro del staff');
  };



  useEffect(() => {
    const athlete = DataRing.getAthlete(athleteId);
    if (athlete) {
      // Load staff
      if (athlete.staff) {
        setStaff(athlete.staff);
      }
      setFormData({
        name: athlete.name,
        age: athlete.age,
        experienceYears: athlete.experienceYears,
        height: athlete.height || 0,
        weight: athlete.weight || 0
      });

      setProfilePhoto(athlete.imgUrl || '');

      // Load available days
      if (athlete.availableDays && athlete.availableDays.length > 0) {
        setAvailableDays(athlete.availableDays);
      }

      // Load events from statsHistory (calculate PBs)
      const eventMap = new Map<string, number>();
      athlete.statsHistory?.forEach(stat => {
        const eventName = stat.event.replace(' Lisos', '');
        const current = eventMap.get(eventName);
        if (!current || stat.numericResult < current) {
          eventMap.set(eventName, stat.numericResult);
        }
      });

      if (eventMap.size > 0) {
        const calculatedEvents = Array.from(eventMap.entries()).map(([name, pb]) => ({
          name,
          pb: pb.toFixed(2)
        }));
        setEvents(calculatedEvents);
      }

      // Load competitions
      if (athlete.upcomingCompetitions && athlete.upcomingCompetitions.length > 0) {
        setCompetitions(athlete.upcomingCompetitions);
      }

      // Load staff
      if (athlete.staff && athlete.staff.length > 0) {
        setStaff(athlete.staff);
      }
    }
  }, [athleteId]);

  // Events Management
  const [events, setEvents] = useState<{ name: string; pb: string }[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', pb: '' });

  // Competition Management
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [showAddComp, setShowAddComp] = useState(false);
  const [newComp, setNewComp] = useState({ name: '', date: '' });

  // Staff Management
  const [staff, setStaff] = useState<StaffMember[]>([]);
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

  const handleSave = async () => {
    try {
      console.log('[PROFILE] Saving profile data...', {
        athleteId,
        updates: {
          name: formData.name,
          age: formData.age,
          experienceYears: formData.experienceYears,
          height: formData.height,
          weight: formData.weight,
          availableDays: availableDays.length,
          events: events.length,
          competitions: competitions.length,
          staff: staff.length
        }
      });

      // Ingest Update
      await DataRing.ingestData('MODULE_PROFILE', 'PROFILE_UPDATE', {
        athleteId: athleteId,
        updates: {
          name: formData.name,
          age: formData.age,
          experienceYears: formData.experienceYears,
          height: formData.height,
          weight: formData.weight,
          imgUrl: profilePhoto,
          availableDays: availableDays,
          events: events,
          upcomingCompetitions: competitions,
          staff: staff
        }
      });

      console.log('[PROFILE] Profile saved successfully');
      alert('✅ Perfil actualizado correctamente');
      onBack();
    } catch (error: any) {
      console.error('[PROFILE] Error saving profile:', error);
      if (error.message?.includes('SIZE_EXCEEDED')) {
        alert('❌ Error: El perfil es demasiado grande (Excede 1MB). Usa el botón "Reparar Datos" para limpiar el historial de videos pesado.');
      } else {
        alert('❌ Error al guardar el perfil. Por favor, intenta de nuevo.');
      }
    }
  };

  const [isRepairing, setIsRepairing] = useState(false);
  const handleRepairData = async () => {
    if (!window.confirm('⚠️ ¿Reparar datos? Esto eliminará el historial de videos pesado para permitir guardar cambios de perfil. Los videos antiguos se perderán.')) return;

    setIsRepairing(true);
    try {
      const { StorageSatellite } = await import('../services/satellites/StorageSatellite');
      await StorageSatellite.pruneAthleteData(athleteId);
      alert('✅ Datos reparados. El historial de videos se ha limpiado. Ahora puedes guardar tu perfil.');
      // Assuming setIsMenuOpen is defined elsewhere or not needed here.
      // If it's meant to close a menu, it should be defined in this component's scope.
      // For now, I'll comment it out or assume it's a typo for something else.
      // setIsMenuOpen(false); 
    } catch (error) {
      console.error('[PROFILE] Repair failed:', error);
      alert('❌ Error al reparar datos.');
    } finally {
      setIsRepairing(false);
    }
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleRepairData}
              disabled={isRepairing}
              className="text-warning hover:text-white text-[10px] font-bold uppercase flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">build</span>
              {isRepairing ? 'Reparando...' : 'Reparar'}
            </button>
            <button onClick={handleSave} className="text-primary hover:text-white text-xs font-bold uppercase">
              Guardar
            </button>
          </div>
        </div>

        {/* Photo + Name Row */}
        <div className="glass-card p-3 rounded-xl flex items-center gap-4">
          <div className="relative size-16 shrink-0">
            <div className="size-16 bg-black border-2 border-white/10 rounded-xl overflow-hidden">
              <img
                alt="Profile"
                className="w-full h-full object-cover"
                src={profilePhoto || `https://ui-avatars.com/api/?name=${formData.name}&background=random`}
              />
            </div>
            <button
              onClick={() => document.getElementById('photoInput')?.click()}
              className="absolute -bottom-1 -right-1 size-6 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:bg-primary/80 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-white text-xs">photo_camera</span>
            </button>
            <input
              id="photoInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    console.log('[PROFILE] Uploading photo to Firebase Storage...');
                    // Import StorageSatellite dynamically
                    const { StorageSatellite } = await import('../services/satellites/StorageSatellite');

                    // Convert file to base64 for upload
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      try {
                        const base64 = reader.result as string;
                        // Upload to Firebase Storage
                        const url = await StorageSatellite.uploadThumbnail(athleteId, base64);
                        console.log('[PROFILE] Photo uploaded successfully:', url);
                        setProfilePhoto(url);
                      } catch (error) {
                        console.error('[PROFILE] Error uploading photo:', error);
                        alert('Error al subir la foto. Intenta con una imagen más pequeña.');
                      }
                    };
                    reader.readAsDataURL(file);
                  } catch (error) {
                    console.error('[PROFILE] Error processing photo:', error);
                  }
                }
              }}
            />
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

        {/* Staff Management - Available for all users */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Equipo Técnico</span>
            <div className="flex gap-1">
              <button
                onClick={() => setShowLinkStaffModal(true)}
                className="size-6 rounded-lg bg-info/20 text-info flex items-center justify-center hover:bg-info hover:text-white transition-all"
                title="Vincular Staff existente"
              >
                <span className="material-symbols-outlined text-sm">link</span>
              </button>
              <button
                onClick={() => setShowAddStaff(!showAddStaff)}
                className="size-6 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                title="Agregar manualmente"
              >
                <span className="material-symbols-outlined text-sm">{showAddStaff ? 'close' : 'add'}</span>
              </button>
            </div>
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
                  placeholder="Especialidad Técnica"
                  className="w-32 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
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
                  placeholder="Teléfono"
                  type="tel"
                  className="w-28 bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
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
              <p className="text-[10px] text-slate-500 text-center py-2">Sin equipo técnico añadido</p>
            )}
          </div>
        </div>

        {/* Link Staff Modal */}
        {showLinkStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-card p-6 rounded-xl max-w-sm w-full space-y-4">
              <h3 className="text-white font-bold text-lg">Vincular Staff</h3>
              <p className="text-slate-400 text-xs">Ingresa el email del entrenador o miembro del staff para enviarle una solicitud.</p>

              <input
                placeholder="Email del Staff"
                type="email"
                className="w-full bg-black/50 border border-white/10 px-3 py-2 rounded-lg text-white focus:border-info outline-none"
                value={linkStaffEmail}
                onChange={e => setLinkStaffEmail(e.target.value)}
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowLinkStaffModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 text-slate-300 rounded-lg text-xs font-bold hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLinkStaff}
                  className="flex-1 px-4 py-2 bg-info text-white rounded-lg text-xs font-bold hover:bg-info/80"
                >
                  Enviar Solicitud
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LegalFooter moved to RoundTable (Hub Técnico) */}

      </div>
    </div>
  );
};

export default AthleteProfile;
