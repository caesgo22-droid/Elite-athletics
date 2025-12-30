import React from 'react';
import { useDataRing } from '../services/CoreArchitecture';
import { Badge } from './common/Atomic';

interface RecoveryPlanProps {
  rpe?: number;
  onComplete: () => void;
  userRole?: 'ATHLETE' | 'STAFF';
  athleteId?: string;
}

const PROTOCOLS = [
  { id: 'sleep', name: 'Descanso', icon: 'bedtime', color: '#818cf8', priority: 'high' },
  { id: 'nutrition', name: 'Nutrición', icon: 'restaurant', color: '#fb923c', priority: 'high' },
  { id: 'hydration', name: 'Hidratación', icon: 'water_drop', color: '#38bdf8', priority: 'high' },
  { id: 'cold', name: 'Crioterapia', icon: 'ac_unit', color: '#67e8f9', priority: 'medium' },
  { id: 'hot', name: 'Hidroterapia', icon: 'hot_tub', color: '#f97316', priority: 'medium' },
  { id: 'massage', name: 'Masaje', icon: 'spa', color: '#a78bfa', priority: 'medium' },
  { id: 'stretch', name: 'Estiramientos', icon: 'self_improvement', color: '#4ade80', priority: 'low' },
  { id: 'compression', name: 'Compresión', icon: 'compress', color: '#94a3b8', priority: 'low' },
  { id: 'stem', name: 'STEM', icon: 'electric_bolt', color: '#facc15', priority: 'low' },
];

const RecoveryPlan: React.FC<RecoveryPlanProps> = ({ rpe = 7, onComplete, athleteId = '1' }) => {
  const athlete = useDataRing((ring) => ring.getAthlete(athleteId));

  // Mock wearable data (in real app would come from athlete or wearable integration)
  const wearableData = {
    spO2: 98,
    heartRate: 62,
    hrv: athlete?.hrv || 72,
    caloriesBurned: 850,
    sleepQuality: 85
  };

  // Mock session data (would come from last training session)
  const sessionData = {
    rpe: rpe,
    painLevel: 3,
    duration: 90, // minutes
    type: 'Velocidad'
  };

  // Determine recommended protocols based on status
  const getRecommendedProtocols = () => {
    const recommended = new Set<string>();

    // Always recommend basics
    recommended.add('sleep');
    recommended.add('nutrition');
    recommended.add('hydration');

    // High RPE = more recovery
    if (sessionData.rpe >= 7) {
      recommended.add('cold');
      recommended.add('massage');
    }

    // Pain = specific recovery
    if (sessionData.painLevel >= 4) {
      recommended.add('cold');
      recommended.add('stretch');
      recommended.add('compression');
    }

    // Low HRV = active recovery
    if (wearableData.hrv < 60) {
      recommended.add('stretch');
      recommended.add('hot');
    }

    return recommended;
  };

  const recommendedProtocols = getRecommendedProtocols();

  return (
    <div className="h-full bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto p-3 pb-24 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-background py-2 -mx-3 px-3">
          <div className="flex items-center gap-2">
            <button onClick={onComplete} className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
            <h1 className="text-sm font-black text-white uppercase">Recovery</h1>
          </div>
          <Badge variant={sessionData.rpe >= 8 ? 'danger' : sessionData.rpe >= 6 ? 'warning' : 'neutral'} className="text-[8px]">
            RPE {sessionData.rpe}
          </Badge>
        </div>

        {/* Session Biomarkers */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Última Sesión</span>
            <span className="text-[8px] text-slate-600">{sessionData.type} • {sessionData.duration}min</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className={`text-lg font-mono font-black ${sessionData.rpe >= 8 ? 'text-danger' : sessionData.rpe >= 6 ? 'text-warning' : 'text-success'}`}>
                {sessionData.rpe}
              </p>
              <p className="text-[7px] text-slate-500 uppercase">RPE</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-mono font-black ${sessionData.painLevel >= 5 ? 'text-danger' : sessionData.painLevel >= 3 ? 'text-warning' : 'text-success'}`}>
                {sessionData.painLevel}
              </p>
              <p className="text-[7px] text-slate-500 uppercase">Dolor</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-black text-white">{sessionData.duration}</p>
              <p className="text-[7px] text-slate-500 uppercase">Min</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-black text-info">{wearableData.caloriesBurned}</p>
              <p className="text-[7px] text-slate-500 uppercase">Kcal</p>
            </div>
          </div>
        </div>

        {/* Wearable Data */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Wearable</span>
            <span className="material-symbols-outlined text-slate-600 text-sm">watch</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="text-lg font-mono font-black text-success">{wearableData.spO2}%</p>
              <p className="text-[7px] text-slate-500 uppercase">SpO2</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-black text-danger">{wearableData.heartRate}</p>
              <p className="text-[7px] text-slate-500 uppercase">BPM</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-mono font-black ${wearableData.hrv < 60 ? 'text-warning' : 'text-success'}`}>
                {wearableData.hrv}
              </p>
              <p className="text-[7px] text-slate-500 uppercase">HRV</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-mono font-black ${wearableData.sleepQuality < 70 ? 'text-warning' : 'text-success'}`}>
                {wearableData.sleepQuality}%
              </p>
              <p className="text-[7px] text-slate-500 uppercase">Sueño</p>
            </div>
          </div>
        </div>

        {/* Recommended Protocols */}
        <div className="glass-card p-3 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Protocolos Recomendados</span>
            <Badge variant="volt" className="text-[7px]">{recommendedProtocols.size} activos</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PROTOCOLS.map(protocol => {
              const isRecommended = recommendedProtocols.has(protocol.id);
              return (
                <div
                  key={protocol.id}
                  className={`p-2 rounded-lg text-center transition-all cursor-pointer ${isRecommended
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-black/30 border border-white/5 opacity-40'
                    }`}
                >
                  <div
                    className={`size-8 rounded-lg mx-auto mb-1 flex items-center justify-center ${isRecommended ? '' : 'opacity-50'}`}
                    style={{ backgroundColor: `${protocol.color}20`, color: protocol.color }}
                  >
                    <span className="material-symbols-outlined text-sm">{protocol.icon}</span>
                  </div>
                  <p className={`text-[8px] font-bold ${isRecommended ? 'text-white' : 'text-slate-600'}`}>
                    {protocol.name}
                  </p>
                  {isRecommended && (
                    <span className="material-symbols-outlined text-success text-[10px]">check_circle</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="glass-card p-3 rounded-xl bg-primary/5 border-primary/20">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-primary text-sm">tips_and_updates</span>
            <div>
              <p className="text-[9px] text-primary font-bold uppercase mb-1">Recomendación IA</p>
              <p className="text-[10px] text-slate-400">
                {sessionData.rpe >= 8
                  ? 'Sesión de alta intensidad. Prioriza hidratación inmediata y 9+ horas de sueño.'
                  : sessionData.rpe >= 6
                    ? 'Carga moderada. Mantén hidratación y considera masaje o estiramientos.'
                    : 'Sesión ligera. Mantén rutina normal de recuperación.'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecoveryPlan;