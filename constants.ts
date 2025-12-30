
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

export const MOCK_ATHLETES: Athlete[] = [
  {
    id: '1',
    name: 'Mateo Rodriguez',
    age: 24, // NEW
    experienceYears: 8, // NEW
    level: 'ELITE',
    specialty: 'Velocidad',
    status: 'OPTIMAL', // Empezamos en estado óptimo para que la simulación lo cambie a RIESGO
    acwr: 1.2, // Valor normal
    readiness: 88,
    hrv: 65, // Valor normal
    hrvTrend: 'stable',
    loadTrend: [20, 15, 40, 60, 80, 100],
    imgUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4Dy1aTeXZz8-JNqbR7Jej3zTzcUthch6PQGJhHLBF7bkoyOE03qxxELHJuPashkjGsug3AM2UlCJHss9qujl9UzbDOKnmAA4EKppVKQ9xcxHDY1Khbo3sXEYoKxb5yhAeWYpWkie0nH2SLgizwuFK6Ck3PqLCHhAeGASzPWWKVlUBQ3I99l3pVkm6FAjKYsSB15fg7R1OoI5H4I7VLAHPyQn3NG37ukgNF1fzcDsQfJCKp9ot26Rv5bTnN4malyqZZcy-hssaZSM',
    injuryHistory: [
      {
        id: 'inj_1',
        bodyPart: 'Isquiotibial Derecho',
        type: 'MUSCULAR',
        severity: 2,
        dateOccurred: '2023-11-15',
        status: 'RESOLVED',
        notes: 'Desgarro miofascial grado 2. Recurrente ante cargas de velocidad >95%.',
        vasPain: 0
      }
    ],
    upcomingCompetitions: [
      {
        id: 'comp_1',
        name: 'Clasificatorio Nacional',
        date: '2024-06-05',
        priority: 'A',
        targetEvent: '100m'
      }
    ],
    recentTherapies: [
      {
        id: 'th_1',
        date: '2024-05-22',
        time: '15:30',
        duration: 45,
        type: 'MASSAGE',
        notes: 'Descarga profunda en cadena posterior. Tono muscular alto.'
      }
    ],
    statsHistory: [
      {
        id: 'stat_1',
        date: '2024-05-10',
        event: '100m Lisos',
        result: '10.45s',
        numericResult: 10.45,
        type: 'TRAINING',
        isPB: false,
        notes: 'Viento a favor +1.2'
      }
    ],
    videoHistory: [
      {
        id: 'vid_1',
        date: '2024-05-20',
        thumbnailUrl: 'https://images.unsplash.com/photo-1552674605-46d536d2e681?q=80&w=600&auto=format&fit=crop',
        exerciseName: 'Salida de Tacos (Block Start)',
        score: 82,
        status: 'REVIEWED',
        coachFeedback: 'Buena extensión triple. El ángulo de la tibia está un poco alto en el primer paso.',
        aiAnalysis: {
          successes: ['Extensión de cadera completa', 'Brazo delantero a 90°'],
          weaknesses: ['Talón muy alto en recuperación', 'Torso demasiado erguido temprano'],
          correctionPlan: [{ drillName: 'Wall Drills', prescription: '3x15s', focus: 'Posture' }]
        },
        biomechanics: [
          { joint: 'Knee Angle', angle: '125°', status: 'optimal' },
          { joint: 'Torso Angle', angle: '45°', status: 'warning' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    age: 28, // NEW
    experienceYears: 10,
    level: 'ADVANCED',
    specialty: '400m',
    status: 'HIGH_RISK',
    acwr: 1.6,
    readiness: 45,
    hrv: 45,
    hrvTrend: 'stable',
    loadTrend: [800, 850, 900, 950, 1000, 1100],
    imgUrl: 'https://i.pravatar.cc/150?u=2',
    injuryHistory: [],
    upcomingCompetitions: [],
    recentTherapies: [],
    statsHistory: [],
    videoHistory: []
  },
  {
    id: '3',
    name: 'Marcus Fenix',
    age: 32,
    experienceYears: 15,
    level: 'ELITE',
    specialty: 'Decathlon',
    status: 'CAUTION',
    acwr: 1.3,
    readiness: 72,
    hrv: 65,
    hrvTrend: 'down',
    loadTrend: [700, 700, 750, 800, 800, 850],
    imgUrl: 'https://i.pravatar.cc/150?u=3',
    injuryHistory: [],
    upcomingCompetitions: [],
    recentTherapies: [],
    statsHistory: [],
    videoHistory: []
  },
  {
    id: '4',
    name: 'Elena Fisher',
    age: 22,
    experienceYears: 4,
    level: 'INTERMEDIATE',
    specialty: 'Heptathlon',
    status: 'OPTIMAL',
    acwr: 0.9,
    readiness: 92,
    hrv: 95,
    hrvTrend: 'up',
    loadTrend: [500, 550, 500, 550, 600, 600],
    imgUrl: 'https://i.pravatar.cc/150?u=4',
    injuryHistory: [],
    upcomingCompetitions: [],
    recentTherapies: [],
    statsHistory: [],
    videoHistory: []
  },
  {
    id: '5',
    name: 'Nathan Drake',
    age: 26,
    experienceYears: 6,
    level: 'ADVANCED',
    specialty: 'Parkour',
    status: 'OPTIMAL',
    acwr: 1.0,
    readiness: 95,
    hrv: 105,
    hrvTrend: 'up',
    loadTrend: [600, 650, 700, 650, 700, 750],
    imgUrl: 'https://i.pravatar.cc/150?u=5',
    injuryHistory: [],
    upcomingCompetitions: [],
    recentTherapies: [],
    statsHistory: [],
    videoHistory: []
  }
];

export const MOCK_WEEKLY_PLAN: WeeklyPlan = {
  athleteId: '1', // Mateo
  trainingPhase: 'COMPETITIVE',
  sessions: [
    {
      id: 's1',
      day: 'LUN',
      date: '20 May',
      title: 'Fuerza Explosiva',
      type: 'STRENGTH',
      intensityZone: 4,
      durationMin: 75,
      isAiAdjusted: false,
      status: 'COMPLETED',
      rpe: 8
    },
    {
      id: 's2',
      day: 'MAR',
      date: '21 May',
      title: 'Técnica de Carrera',
      type: 'TECHNIQUE',
      intensityZone: 2,
      durationMin: 60,
      isAiAdjusted: false,
      status: 'COMPLETED',
      rpe: 4
    },
    {
      id: 's3',
      day: 'MIE',
      date: '22 May',
      title: 'Series Velocidad 60m',
      type: 'SPEED',
      intensityZone: 5,
      durationMin: 90,
      isAiAdjusted: false,
      status: 'COMPLETED',
      rpe: 9
    },
    // CORRECCIÓN: Esta sesión ahora es de ALTA INTENSIDAD (Original)
    // Para que la IA pueda "vetarla" durante la simulación.
    {
      id: 's4',
      day: 'JUE',
      date: '23 May',
      title: 'Intervalos Lactato 400m',
      type: 'SPEED',
      intensityZone: 5,
      durationMin: 70,
      isAiAdjusted: false, // Todavía no ajustada
      status: 'PLANNED',
      kpis: ["Mantener lactato < 8mmol", "Recuperación cardíaca < 130bpm en 90s"],
      context: "Desarrollo de tolerancia al lactato para el último tercio de carrera.",
      psychology: "Atacar el suelo con agresividad controlada.",
      videoRef: "https://youtu.be/example"
    },
    {
      id: 's5',
      day: 'VIE',
      date: '24 May',
      title: 'Potencia Aeróbica',
      type: 'ENDURANCE',
      intensityZone: 3,
      durationMin: 60,
      isAiAdjusted: false,
      status: 'PLANNED'
    },
    {
      id: 's6',
      day: 'SAB',
      date: '25 May',
      title: 'Activación Pre-Comp',
      type: 'SPEED',
      intensityZone: 3,
      durationMin: 45,
      isAiAdjusted: false,
      status: 'PLANNED'
    },
    {
      id: 's7',
      day: 'DOM',
      date: '26 May',
      title: 'Descanso Total',
      type: 'RECOVERY',
      intensityZone: 1,
      durationMin: 0,
      isAiAdjusted: false,
      status: 'PLANNED'
    }
  ]
};
