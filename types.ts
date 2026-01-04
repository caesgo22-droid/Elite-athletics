
export interface Injury {
  id: string;
  bodyPart: string; // e.g., "Isquiotibial Derecho"
  type: 'MUSCULAR' | 'TENDON' | 'BONE' | 'LIGAMENT' | 'OTHER';
  severity: 1 | 2 | 3 | 4 | 5; // Grade 1 to 5
  dateOccurred: string;
  dateResolved?: string;
  status: 'ACTIVE' | 'RESOLVED';
  notes: string;
  vasPain: number;
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  priority: 'A' | 'B' | 'C'; // A = Main Event
  targetEvent: string; // e.g., "100m"
}

export interface TherapyLog {
  id: string;
  date: string;
  time: string;
  type: string;
  duration: number;
  notes: string;
  typeLabel?: string;
}

export interface StatEntry {
  id: string;
  date: string;
  event: string;
  result: string; // "10.5s"
  numericResult: number; // 10.5 for charting
  type: 'TRAINING' | 'COMPETITION';
  isPB: boolean;
  location?: string;
  notes?: string;
}

export interface VideoAnalysisEntry {
  id: string;
  date: string;
  thumbnailUrl: string; // Base64 or URL
  videoUrl?: string; // Added for video playback
  exerciseName: string;
  score: number;
  status: 'REVIEWED' | 'PENDING';
  coachFeedback?: string;
  aiAnalysis: {
    successes: string[];
    weaknesses: string[];
    correctionPlan: { drillName: string; prescription: string; focus: string; videoRef?: string }[];
  };
  biomechanics: {
    joint: string;
    angle: string;
    ideal?: string;
    recommendation?: string;
    status: 'optimal' | 'warning' | 'critical';
    expertNote?: string; // NEW: Deep insight specifically for this joint
  }[];
  expertMetrics?: {
    gctEstimate?: string;
    comOscillation?: string;
    asymmetryRisk?: 'LOW' | 'MODERATE' | 'HIGH';
    energyLeaks?: string[];
    performanceVerdict?: string;
  };
  landmarks?: Record<string, { x: number; y: number; visibility?: number }>; // Representative frame
  skeletonSequence?: { time: number; landmarks: Record<string, { x: number; y: number; visibility?: number }> }[]; // NEW: Sequence for tracking

  // Phase 7: Feedback Persistence
  voiceNotes?: { id: string; url: string; duration: number; timestamp: string }[];
  telestrationData?: string; // JSON string of drawing paths
  hasFeedback?: boolean;
}

export interface RecoveryAction {
  id: string;
  title: string;
  duration: string;
  type: 'PASSIVE' | 'ACTIVE' | 'NUTRITION' | 'SLEEP';
  description: string;
  videoUrl?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string; // e.g. "Head Coach", "Physio"
  email: string;
  phone: string;
  imgUrl: string;
}

export interface PendingLinkRequest {
  id: string;
  coachId: string;
  coachName: string;
  coachEmail: string;
  coachRole: string;
  coachImgUrl?: string;
  requestDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  message?: string;
}

export interface Athlete {
  id: string;
  name: string;
  age: number;
  experienceYears: number;
  height?: number; // in cm
  weight?: number; // in kg
  availableDays?: string[]; // e.g. ['L', 'M', 'X', 'J', 'V']
  level?: 'ROOKIE' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE' | 'WORLD_CLASS';
  specialty: string;
  status: 'OPTIMAL' | 'CAUTION' | 'HIGH_RISK';
  acwr: number;
  readiness: number; // 0-100
  hrv: number; // ms
  hrvTrend: 'up' | 'down' | 'stable';
  loadTrend: number[]; // Array for sparkline
  imgUrl: string;
  // Omni-conscious Data Points
  injuryHistory: Injury[];
  upcomingCompetitions: Competition[];
  recentTherapies: TherapyLog[];
  statsHistory: StatEntry[];
  videoHistory: VideoAnalysisEntry[];
  staff?: StaffMember[];
  pendingLinkRequests?: PendingLinkRequest[];
}

export interface TrainingSession {
  id: string;
  day: string;
  date: string;
  title: string;
  type: 'SPEED' | 'RECOVERY' | 'STRENGTH' | 'TECHNIQUE' | 'ENDURANCE';
  intensityZone: 1 | 2 | 3 | 4 | 5;
  durationMin: number;
  isAiAdjusted: boolean;
  originalTitle?: string;
  aiReason?: string;
  status: 'COMPLETED' | 'PLANNED' | 'SKIPPED';
  rpe?: number; // Rate of Perceived Exertion
  rpeTarget?: number; // Target RPE set by coach
  // World Athletics Standards
  kpis?: string[]; // e.g. "Contact Time < 0.12s"
  context?: string; // Why this session?
  psychology?: string; // Mental cues
  // Structured Session Data (Elite Standard)
  structure?: {
    ramp: string; // Warmup (Raise, Activate, Mobilize, Potentiate)
    track: string; // Main block (e.g. 3x30m flys)
    transfer: string; // Plyometrics (e.g. Box Jumps)
    gym: string; // Strength work (e.g. Cleans, Squats)
  };
  gymWork?: string; // Complementary work
  videoRef?: string; // Reference URL
  feedback?: string; // NEW: Daily user feedback (e.g. "Pain in hamstring")
}

export type TrainingPhase = 'PRE_SEASON' | 'COMPETITIVE' | 'TRANSITION' | 'TAPERING';

export interface WeeklyPlan {
  athleteId: string;
  trainingPhase: TrainingPhase; // New Field
  sessions: TrainingSession[];
}

// The "Context Object" defined in PDF Page 16
// --- MEMORY MODULE ---
export interface WeeklySummary {
  id: string; // "YYYY-CW##"
  weekNumber: number;
  startDate: string;
  endDate: string;
  trainingPhase: TrainingPhase;
  // Quantitative Aggregates
  avgSleep: number;
  avgRpe: number;
  totalVolumeLoad: number;
  // Qualitative AI Insights
  keyAchievement: string; // "Improved top speed mechanics"
  primaryStruggle: string; // "Lower back fatigue mid-week"
  adaptationFocus: string; // "Neuromuscular efficiency"
  coachNotes?: string;
}

export interface Macrocycle {
  id: string;
  name: string; // e.g. "Road to Nationals"
  startDate: string;
  endDate: string;
  goal: string; // e.g. "Improve Max Velocity by 5%"
  focusPoints: string[]; // ["Drive Phase", "Top Speed"]
  phase: TrainingPhase;
}

export interface OmniContext {
  athlete: Athlete;
  currentPlan: WeeklyPlan;
  macrocycle?: Macrocycle; // NEW: The "Big Picture"
  history: VideoAnalysisEntry[]; // Short term memory (current session/week)
  stats: StatEntry[];
  injuries: Injury[];
  therapy: TherapyLog[];
  userMemory?: WeeklySummary[]; // NEW: Long Term Memory (Last 4-12 weeks)
  profiling?: { gapAnalysis: string }; // Performance Comparison
  // NEW: Daily Feedback Loop
  recentLogs?: { date: string; feedback: string; rpe: number }[];
  // NEW: Technical Trends
  technicalTrends?: { trend: 'IMPROVING' | 'STAGNANT' | 'REGRESSING'; summary: string };
}

export interface AgentMessage {
  id: string;
  agent: 'PHYSIOLOGIST' | 'STRATEGIST' | 'BIOMECHANIST' | 'HEAD_COACH' | 'AUDITOR';
  content: string;
  timestamp: string;
  type: 'PROPOSAL' | 'CRITIQUE' | 'VERDICT';
  source?: 'REAL_AI' | 'SIMULATION'; // New field to track origin
  metrics?: { label: string; value: string; status: 'ok' | 'warning' | 'danger' }[];
}

// NEW: Staff Wall Post Structure
export interface WallPost {
  id: string;
  author: string;
  role: 'HEAD COACH' | 'PHYSIO' | 'BIOMECHANIST';
  content: string;
  timestamp: string;
  tags: string[]; // e.g. ["#Medical", "#Urgent"]
  likes: number;
}

export enum ViewState {
  LOGIN = 'LOGIN', // New Entry Point
  DASHBOARD = 'DASHBOARD',
  PLANNING = 'PLANNING',
  HEALTH = 'HEALTH',
  VIDEO_ANALYSIS = 'VIDEO_ANALYSIS',
  STATS = 'STATS',
  CHAT = 'CHAT',
  ATHLETE_INPUT = 'ATHLETE_INPUT',
  PROFILE = 'PROFILE',
  ATHLETE_PROFILE = 'ATHLETE_PROFILE', // Read-only athlete info page
  ROUND_TABLE = 'ROUND_TABLE',
  RECOVERY_PLAN = 'RECOVERY_PLAN',
  STAFF_DASHBOARD = 'STAFF_DASHBOARD',
  STAFF_ATHLETE_DETAIL = 'STAFF_ATHLETE_DETAIL',
  STAFF_WALL = 'STAFF_WALL', // NUEVO ESTADO PARA EL MURO
  STAFF_PROFILE = 'STAFF_PROFILE', // NEW: Dedicated Coach Profile View
  STAFF_STRATEGY = 'STAFF_STRATEGY', // NEW: Strategic Planning (Macrocycle, etc.)
  SYSTEM_INFO = 'SYSTEM_INFO'
}

// Aliases for compatibility
export type AthleteProfile = Athlete;
export type TrainingPlan = WeeklyPlan;
