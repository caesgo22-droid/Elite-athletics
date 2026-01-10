
import { Athlete, WeeklyPlan } from './types';

export const ELITE_EXERCISE_LIBRARY = {
  SPEED: {
    label: 'Velocidad & Sprint',
    exercises: [
      'Flying 30m (Salida Lanzada)',
      'Block Starts 30m (Salida de Tacos)',
      'Drive Phase - Sled Pulls (Arrastres)',
      'Ins-Outs (Cambios de Ritmo)',
      'Speed Endurance 150m',
      'Wicket Runs (Vallas Bajas)',
      'Frequency Drills (Fast Feet)'
    ]
  },
  STRENGTH: {
    label: 'Fuerza & Potencia',
    exercises: [
      'Clean & Jerk (Dos Tiempos)',
      'Snatch (Arrancada)',
      'Back Squat (Sentadilla Trasera)',
      'Quarter Squat Explosiva',
      'Nordic Hamstring Curl',
      'Hip Thrust (Empuje de Cadera)',
      'Single Leg RDL'
    ]
  },
  PLYOMETRICS: {
    label: 'Pliometría & Reactividad',
    exercises: [
      'Depth Jumps (Caída desde cajón)',
      'Hurdle Hops (Saltos de Valla continuos)',
      'Single Leg Bounds',
      'Box Jumps',
      'Ankle Hops (Reactividad de Tobillo)'
    ]
  },
  ENDURANCE: {
    label: 'Resistencia & Tempo',
    exercises: [
      'Extensive Tempo 200m @ 70%',
      'Intensive Tempo 100m @ 85%',
      'Aerobic Capacity Intervals',
      'Recovery Run (Zone 1)',
      'Fartlek Pyramidal'
    ]
  },
  TECHNIQUE: {
    label: 'Técnica & Drills',
    exercises: [
      'A-Skip & B-Skip Series',
      'Wall Drills (Postura)',
      'Straight Leg Bounds',
      'Arm Action Drills',
      'Dribbles (Over the ankle/calf/knee)'
    ]
  }
};

export const ELITE_BENCHMARKS = {
  SPRINT: {
    'Maximum Velocity': { min: 11.5, max: 12.5, unit: 'm/s' },
    'Ground Contact Time': { min: 0.080, max: 0.095, unit: 's' },
    'Knee Angle (Touchdown)': { min: 145, max: 160, unit: '°' },
    'Hip Flexion (Recovery)': { min: 95, max: 110, unit: '°' },
    'Shin Angle (Touchdown)': { min: 85, max: 95, unit: '°' },
    'Stride Frequency': { min: 4.5, max: 5.0, unit: 'Hz' }
  }
};

// MOCK_ATHLETES removed - using live Firebase data

export const MOCK_WEEKLY_PLAN: WeeklyPlan = {
  athleteId: 'template',
  trainingPhase: 'PRE_SEASON',
  sessions: [
    {
      id: 's1', day: 'LUN', date: '', title: 'Sesión de Fuerza', type: 'STRENGTH',
      intensityZone: 3, durationMin: 60, isAiAdjusted: false, status: 'PLANNED',
      structure: { ramp: '', track: '', transfer: '', gym: '' }
    },
    {
      id: 's2', day: 'MAR', date: '', title: 'Velocidad & Técnica', type: 'SPEED',
      intensityZone: 4, durationMin: 90, isAiAdjusted: false, status: 'PLANNED',
      structure: { ramp: '', track: '', transfer: '', gym: '' }
    },
    {
      id: 's3', day: 'MIE', date: '', title: 'Recuperación Activa', type: 'RECOVERY',
      intensityZone: 1, durationMin: 45, isAiAdjusted: false, status: 'PLANNED',
      structure: { ramp: '', track: '', transfer: '', gym: '' }
    },
    {
      id: 's4', day: 'JUE', date: '', title: 'Potencia & Pliometría', type: 'STRENGTH',
      intensityZone: 4, durationMin: 75, isAiAdjusted: false, status: 'PLANNED',
      structure: { ramp: '', track: '', transfer: '', gym: '' }
    },
    {
      id: 's5', day: 'VIE', date: '', title: 'Velocidad Máxima', type: 'SPEED',
      intensityZone: 5, durationMin: 90, isAiAdjusted: false, status: 'PLANNED',
      structure: { ramp: '', track: '', transfer: '', gym: '' }
    },
    {
      id: 's6', day: 'SAB', date: '', title: 'Técnica Específica', type: 'TECHNIQUE',
      intensityZone: 2, durationMin: 60, isAiAdjusted: false, status: 'PLANNED',
      structure: { ramp: '', track: '', transfer: '', gym: '' }
    },
    {
      id: 's7', day: 'DOM', date: '', title: 'Descanso', type: 'RECOVERY',
      intensityZone: 1, durationMin: 0, isAiAdjusted: false, status: 'PLANNED',
      structure: { ramp: 'OFF', track: 'OFF', transfer: 'OFF', gym: 'OFF' }
    }
  ]
};
