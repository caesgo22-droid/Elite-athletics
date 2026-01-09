import React, { useState } from 'react';
import { DataRing } from '../services/CoreArchitecture';
import { ViewState } from '../types';
import { notificationService } from '../services/NotificationService';
import CheckInHistory from './CheckInHistory';

interface AthleteCheckInProps {
  athleteId: string;
  sessionId?: string;
  onComplete?: (view: ViewState) => void;
  context?: 'MORNING' | 'SESSION' | 'WEEKLY';
  onNavigate?: (view: ViewState) => void;
}

const AthleteCheckIn: React.FC<AthleteCheckInProps> = ({ athleteId, sessionId, onComplete, context = 'MORNING', onNavigate }) => {
  const [rpe, setRpe] = useState(5);
  const [pain, setPain] = useState(0);
  const [sleep, setSleep] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [stress, setStress] = useState(3);
  const [hydration, setHydration] = useState(7);
  const [duration, setDuration] = useState(60);
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // NEW: History toggle

  // Mock wearable data
  const wearableData = {
    spO2: 98,
    heartRate: 62,
    hrv: 72,
    calories: 420,
    steps: 8500,
    synced: true
  };

  const handleSubmit = async () => {
    try {

      // 1. Ingest general recovery metrics
      DataRing.ingestData('MODULE_RECOVERY', 'RECOVERY_METRICS', {
        athleteId,
        rpe: context === 'SESSION' ? rpe : undefined,
        pain,
        sleep: (context === 'MORNING' || context === 'WEEKLY') ? sleep : undefined,
        sleepQuality: (context === 'MORNING' || context === 'WEEKLY') ? sleepQuality : undefined,
        stress: (context === 'MORNING' || context === 'WEEKLY') ? stress : undefined,
        hydration: (context === 'MORNING' || context === 'WEEKLY') ? hydration : undefined,
        duration: context === 'SESSION' ? duration : undefined,
        timestamp: new Date().toISOString()
      });

      // 2. If it's a SESSION, also link feedback directly to the plan session
      if (context === 'SESSION' && sessionId) {
        console.log(`[AthleteCheckIn] Saving feedback for session ${sessionId}...`);
        await DataRing.updateTrainingSession(athleteId, sessionId, {
          status: 'COMPLETED',
          rpe: rpe,
          context: `Feedback: Dolor ${pain}/10. ${duration}min.`
        });
        console.log(`[AthleteCheckIn] Session ${sessionId} marked as COMPLETED`);
      }

      // NOTIFICATION TRIGGER: High Pain
      if (pain > 5) {
        const athlete = DataRing.getAthlete(athleteId);
        if (athlete && athlete.staff && athlete.staff.length > 0) {
          // Notify all staff members
          for (const staffMember of athlete.staff) {
            await notificationService.notifyStaffHighPain(
              staffMember.id,
              athleteId,
              athlete.name,
              pain,
              'Área no especificada' // TODO: Get from form
            );
          }
        }
      }

      // Auto-Generate Plan for Sunday Protocol
      if (context === 'WEEKLY') {
        // Mark Sunday as checked
        const today = new Date();
        localStorage.setItem(`weekly_checkin_${today.toDateString()}`, 'true');

        // NOTIFICATION TRIGGER: Weekly Check-in Complete
        const athlete = DataRing.getAthlete(athleteId);
        if (athlete && athlete.staff && athlete.staff.length > 0) {
          for (const staffMember of athlete.staff) {
            await notificationService.notifyStaffCheckInComplete(
              staffMember.id,
              athleteId,
              athlete.name
            );
          }
        }

        // Trigger AI Generation
        setTimeout(() => {
          DataRing.regeneratePlan(athleteId, 'COMPETITIVE'); // Defaulting to competitive for now, ideally fetched
        }, 1000);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('[AthleteCheckIn] Error submitting data:', error);
      alert('Error al guardar los datos. Por favor intenta de nuevo.');
    }
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background p-4">
        <div className="size-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-4 animate-in zoom-in">
          <span className="material-symbols-outlined text-4xl text-success">check</span>
        </div>
        <h2 className="text-xl font-black text-white uppercase mb-1">
          {context === 'MORNING' ? 'Check-In Registrado' : context === 'WEEKLY' ? 'Semana Lista' : 'Feedback Registrado'}
        </h2>
        <p className="text-[10px] text-slate-500 mb-6">
          {context === 'WEEKLY' ? 'Generando plan de entrenamiento...' : 'Datos procesados correctamente'}
        </p>
        <button
          onClick={() => onComplete && onComplete(ViewState.RECOVERY_PLAN)}
          className="w-full max-w-xs py-3 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-base">spa</span>
          {context === 'WEEKLY' ? 'Ver Plan Generado' : 'Ver Recomendaciones'}
        </button>
        <button onClick={() => setSubmitted(false)} className="text-slate-600 text-[9px] mt-3 uppercase">
          Editar Entrada
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto p-3 pb-24 space-y-3">

        {/* Header */}
        <div className="text-center py-2">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest">
            {context === 'MORNING' ? 'Biometría Matutina' : context === 'WEEKLY' ? 'Protocolo Dominical' : 'Post-Entrenamiento'}
          </p>
          <h1 className="text-lg font-black text-white uppercase">
            {context === 'MORNING' ? 'Morning Check-In' : context === 'WEEKLY' ? 'Weekly Check-In' : 'Session Feedback'}
          </h1>
          <div className={`h-0.5 w-12 mx-auto mt-1 ${context === 'SESSION' ? 'bg-volt' : 'bg-primary'}`}></div>
          <div className={`h-0.5 w-12 mx-auto mt-1 ${context === 'SESSION' ? 'bg-volt' : 'bg-primary'}`}></div>
        </div>

        {/* History Toggle Button for Morning CheckIn */}
        {context === 'MORNING' && (
          <div className="flex justify-end -mt-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[9px] text-primary flex items-center gap-1 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">show_chart</span>
              {showHistory ? 'Ocultar Tendencias' : 'Ver Tendencias'}
            </button>
          </div>
        )}

        {/* History Component */}
        {showHistory && context === 'MORNING' && (
          <CheckInHistory athleteId={athleteId} onClose={() => setShowHistory(false)} />
        )}

        {/* Wearable Sync Card */}
        <div className="glass-card p-3 rounded-xl flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-black/50 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-400 text-base">watch</span>
            </div>
            <div>
              <p className="text-[10px] text-white font-bold">Garmin Connect</p>
              <p className="text-[8px] text-slate-500">Sync: Hoy, 07:12 AM</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-2 bg-success rounded-full"></div>
            <span className="text-[8px] text-success font-bold">OK</span>
          </div>
        </div>

        {/* Wearable Data Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
            <p className="text-lg font-mono font-bold text-success">{wearableData.spO2}%</p>
            <p className="text-[7px] text-slate-500 uppercase">SpO2</p>
          </div>
          <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
            <p className="text-lg font-mono font-bold text-danger">{wearableData.heartRate}</p>
            <p className="text-[7px] text-slate-500 uppercase">BPM</p>
          </div>
          <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
            <p className="text-lg font-mono font-bold text-info">{wearableData.hrv}</p>
            <p className="text-[7px] text-slate-500 uppercase">HRV</p>
          </div>
          <div className="bg-black/40 p-2 rounded-lg text-center border border-white/5">
            <p className="text-lg font-mono font-bold text-orange-400">{wearableData.calories}</p>
            <p className="text-[7px] text-slate-500 uppercase">Kcal</p>
          </div>
        </div>

        {/* SESSION: RPE + Duration */}
        {context === 'SESSION' && (
          <>
            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] text-slate-500 uppercase">RPE (Esfuerzo Percibido)</p>
                <span className={`text-xl font-black ${rpe > 7 ? 'text-danger' : rpe > 4 ? 'text-warning' : 'text-success'}`}>{rpe}/10</span>
              </div>
              <input
                type="range" min="1" max="10" value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[7px] text-slate-600 mt-1">
                <span>Muy Fácil</span><span>Moderado</span><span>Máximo</span>
              </div>
            </div>

            <div className="glass-card p-3 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] text-slate-500 uppercase">Duración Entrenamiento</p>
                <span className="text-xl font-black text-white">{duration}min</span>
              </div>
              <input
                type="range" min="15" max="180" step="5" value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-volt"
              />
            </div>
          </>
        )}

        {/* BOTH: Pain */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[9px] text-slate-500 uppercase">Nivel de Dolor</p>
            <span className={`text-xl font-black ${pain > 5 ? 'text-danger' : pain > 2 ? 'text-warning' : 'text-success'}`}>{pain}/10</span>
          </div>
          <input
            type="range" min="0" max="10" value={pain}
            onChange={(e) => setPain(parseInt(e.target.value))}
            className={`w-full h-2 rounded-full appearance-none cursor-pointer ${pain > 5 ? 'bg-danger/20 accent-danger' : 'bg-white/10 accent-success'}`}
          />
          {pain > 0 && (
            <input type="text" placeholder="Ubicación del dolor..." className="mt-2 w-full bg-black/40 border border-white/10 px-2 py-1.5 rounded text-[10px] text-white placeholder:text-slate-600" />
          )}
          {/* Link to Health for pain reporting */}
          {context === 'SESSION' && pain > 3 && onNavigate && (
            <button
              onClick={() => onNavigate(ViewState.HEALTH)}
              className="mt-2 w-full py-2 bg-danger/20 text-danger rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-1 border border-danger/30"
            >
              <span className="material-symbols-outlined text-sm">medical_services</span>
              Reportar Lesión en Salud
            </button>
          )}
        </div>

        {/* MORNING / WEEKLY: Sleep + Quality */}
        {(context === 'MORNING' || context === 'WEEKLY') && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-3 rounded-xl">
                <p className="text-[8px] text-slate-500 uppercase mb-2">Horas de Sueño</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => setSleep(Math.max(0, sleep - 0.5))} className="size-7 bg-white/5 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-slate-400">remove</span>
                  </button>
                  <span className="text-xl font-black text-white">{sleep}h</span>
                  <button onClick={() => setSleep(sleep + 0.5)} className="size-7 bg-white/5 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-slate-400">add</span>
                  </button>
                </div>
              </div>
              <div className="glass-card p-3 rounded-xl">
                <p className="text-[8px] text-slate-500 uppercase mb-2">Calidad Sueño</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => setSleepQuality(Math.max(1, sleepQuality - 1))} className="size-7 bg-white/5 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-slate-400">remove</span>
                  </button>
                  <span className={`text-xl font-black ${sleepQuality >= 7 ? 'text-success' : sleepQuality >= 5 ? 'text-warning' : 'text-danger'}`}>{sleepQuality}/10</span>
                  <button onClick={() => setSleepQuality(Math.min(10, sleepQuality + 1))} className="size-7 bg-white/5 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-slate-400">add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stress + Hydration */}
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-3 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[8px] text-slate-500 uppercase">Estrés</p>
                  <span className={`text-lg font-black ${stress > 7 ? 'text-danger' : stress > 4 ? 'text-warning' : 'text-success'}`}>{stress}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={stress}
                  onChange={(e) => setStress(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="glass-card p-3 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[8px] text-slate-500 uppercase">Hidratación</p>
                  <span className={`text-lg font-black ${hydration >= 7 ? 'text-success' : hydration >= 5 ? 'text-warning' : 'text-danger'}`}>{hydration}/10</span>
                </div>
                <input
                  type="range" min="1" max="10" value={hydration}
                  onChange={(e) => setHydration(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-info"
                />
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className={`w-full py-3 text-black rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${context === 'SESSION' ? 'bg-volt' : 'bg-primary'}`}
        >
          <span className="material-symbols-outlined text-base">bolt</span>
          {context === 'MORNING' ? 'Registrar Check-In' : context === 'WEEKLY' ? 'Generar Plan Semanal' : 'Registrar Feedback'}
        </button>

      </div>
    </div>
  );
};

export default AthleteCheckIn;