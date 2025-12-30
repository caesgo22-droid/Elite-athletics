import { z } from 'zod';

/**
 * ZOD SCHEMAS FOR DATA VALIDATION (v2.0)
 * 
 * Propósito: Garantizar la integridad de los datos antes de guardarlos en Firestore
 * o procesarlos en el Aro de Datos.
 */

export const InjurySchema = z.object({
    id: z.string(),
    bodyPart: z.string(),
    type: z.enum(['MUSCULAR', 'TENDON', 'BONE', 'LIGAMENT', 'OTHER']),
    severity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    dateOccurred: z.string(),
    dateResolved: z.string().optional(),
    status: z.enum(['ACTIVE', 'RESOLVED']),
    notes: z.string(),
    vasPain: z.number().min(0).max(10),
});

export const CompetitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    priority: z.enum(['A', 'B', 'C']),
    targetEvent: z.string(),
});

export const TherapyLogSchema = z.object({
    id: z.string(),
    date: z.string(),
    time: z.string(),
    type: z.string(),
    duration: z.number(),
    notes: z.string(),
    typeLabel: z.string().optional(),
});

export const StatEntrySchema = z.object({
    id: z.string(),
    date: z.string(),
    event: z.string(),
    result: z.string(),
    numericResult: z.number(),
    type: z.enum(['TRAINING', 'COMPETITION']),
    isPB: z.boolean(),
    location: z.string().optional(),
    notes: z.string().optional(),
});

export const VideoAnalysisEntrySchema = z.object({
    id: z.string(),
    date: z.string(),
    thumbnailUrl: z.string(),
    videoUrl: z.string().optional(),
    exerciseName: z.string(),
    score: z.number(),
    status: z.enum(['REVIEWED', 'PENDING']),
    coachFeedback: z.string().optional(),
    aiAnalysis: z.object({
        successes: z.array(z.string()).optional().default([]),
        weaknesses: z.array(z.string()).optional().default([]),
        correctionPlan: z.array(z.object({
            drillName: z.string(),
            prescription: z.string(),
            focus: z.string(),
            videoRef: z.string().optional()
        })).optional().default([])
    }).optional(),
    biomechanics: z.array(z.object({
        joint: z.string(),
        angle: z.string(),
        ideal: z.string().optional(),
        recommendation: z.string().optional(),
        status: z.enum(['optimal', 'warning', 'critical']),
        expertNote: z.string().optional()
    })),
    expertMetrics: z.object({
        gctEstimate: z.string().optional(),
        comOscillation: z.string().optional(),
        asymmetryRisk: z.enum(['LOW', 'MODERATE', 'HIGH']).optional(),
        energyLeaks: z.array(z.string()).optional(),
        performanceVerdict: z.string().optional(),
    }).optional(),
    skeletonSequence: z.array(z.object({
        time: z.number(),
        landmarks: z.record(z.string(), z.object({
            x: z.number(),
            y: z.number(),
            z: z.number().optional(),
            visibility: z.number().optional()
        }))
    })).optional(),
    voiceNotes: z.array(z.object({
        id: z.string(),
        url: z.string(),
        duration: z.number(),
        timestamp: z.string()
    })).optional(),
    telestrationData: z.string().optional(),
    hasFeedback: z.boolean().optional(),
});

export const StaffMemberSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    email: z.string().email(),
    phone: z.string(),
    imgUrl: z.string(),
});

export const AthleteSchema = z.object({
    id: z.string(),
    name: z.string(),
    age: z.number().optional(),
    experienceYears: z.number().optional(),
    level: z.enum(['ROOKIE', 'INTERMEDIATE', 'ADVANCED', 'ELITE', 'WORLD_CLASS']).optional(),
    specialty: z.string(),
    status: z.enum(['OPTIMAL', 'CAUTION', 'HIGH_RISK']),
    acwr: z.number(),
    readiness: z.number().min(0).max(100),
    hrv: z.number(),
    hrvTrend: z.enum(['up', 'down', 'stable']),
    loadTrend: z.array(z.number()),
    imgUrl: z.string(),
    injuryHistory: z.array(InjurySchema),
    upcomingCompetitions: z.array(CompetitionSchema),
    recentTherapies: z.array(TherapyLogSchema),
    statsHistory: z.array(StatEntrySchema),
    videoHistory: z.array(VideoAnalysisEntrySchema),
    staff: z.array(StaffMemberSchema).optional(),
});

export const TrainingSessionSchema = z.object({
    id: z.string(),
    day: z.string(),
    date: z.string(),
    title: z.string(),
    type: z.enum(['SPEED', 'RECOVERY', 'STRENGTH', 'TECHNIQUE', 'ENDURANCE']),
    intensityZone: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    durationMin: z.number(),
    isAiAdjusted: z.boolean(),
    originalTitle: z.string().optional(),
    aiReason: z.string().optional(),
    status: z.enum(['COMPLETED', 'PLANNED', 'SKIPPED']),
    rpe: z.number().optional(),
    rpeTarget: z.number().optional(),
    kpis: z.array(z.string()).optional(),
    context: z.string().optional(),
    psychology: z.string().optional(),
    gymWork: z.string().optional(),
    videoRef: z.string().optional(),
});

export const WeeklyPlanSchema = z.object({
    athleteId: z.string(),
    trainingPhase: z.enum(['PRE_SEASON', 'COMPETITIVE', 'TRANSITION', 'TAPERING']),
    sessions: z.array(TrainingSessionSchema),
});

export const MacrocycleSchema = z.object({
    id: z.string(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    goal: z.string(),
    focusPoints: z.array(z.string()),
    phase: z.enum(['PRE_SEASON', 'COMPETITIVE', 'TRANSITION', 'TAPERING']),
});

export const ChatMessageSchema = z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.string(),
    metadata: z.any().optional(),
});
