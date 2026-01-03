/**
 * WIDGET FACADES - Patrón de Desacoplamiento
 * 
 * Este servicio expone resúmenes de cada sección para que el Dashboard
 * no acceda directamente al Data Ring. Cada facade es responsable de
 * obtener y formatear su propia información.
 */

import { DataRing } from './CoreArchitecture';
import { ViewState, TrainingSession } from '../types';

// --- INTERFACES DE RESUMEN ---

export interface HealthWidgetSummary {
    activeInjuries: number;
    riskLevel: 'OPTIMAL' | 'WARNING' | 'HIGH_RISK';
    acwr: number;
    readiness: number;
    lastTherapy?: string;
    link: ViewState;
}

export interface VideoWidgetSummary {
    totalAnalyses: number;
    lastScore?: number;
    lastExercise?: string;
    pendingCorrections: number; // New: videos with feedback
    link: ViewState;
}

export interface RecoveryWidgetSummary {
    hrv: number;
    lastRPE?: number;
    sleepQuality?: number;
    protocol: string;
    activeIcons: string[]; // Icons for recommendations: massage, ice, hydration, sleep, nutrition
    link: ViewState;
}

export interface TrainingWidgetSummary {
    nextSession?: {
        title: string;
        day: string;
        date: string;
        type: string;
    };
    todayExercises: Array<{ name: string; detail: string }>; // Exercises for today
    phase: string;
    weekProgress: number; // Porcentaje de sesiones completadas
    link: ViewState;
}

export interface StatsWidgetSummary {
    bestTime100m?: number;
    trend: 'up' | 'down' | 'neutral';
    totalRecords: number;
    chartData: Array<{ val: number, type: string }>;
    link: ViewState;
}

export interface MacrocycleWidgetSummary {
    loadTrend: number[];
    acwrActual: number;
    competitions: Array<{ name: string; week: number }>;
    injuries: Array<{ week: number }>;
    therapies: Array<{ week: number }>;
    link: ViewState;
}

export interface ProfileWidgetSummary {
    name: string;
    imgUrl: string;
    status: 'OPTIMAL' | 'CAUTION' | 'HIGH_RISK';
    age: number;
    yearsExperience: number;
    height: string;
    weight: string;
    events: Array<{ name: string; pb: string }>;
    availableDays: string[];
    upcomingCompetitions: Array<{ name: string; date: string }>;
}

export interface CheckInWidgetSummary {
    lastCheckIn?: string;
    isPending: boolean;
    lastRPE?: number;
    lastSleep?: number;
    link: ViewState;
}

// --- FACADES ---

export const ProfileFacade = {
    getSummary(athleteId: string = '1'): ProfileWidgetSummary {
        const athlete = DataRing.getAthlete(athleteId);

        if (!athlete) {
            return {
                name: 'Atleta',
                imgUrl: 'https://i.pravatar.cc/150?u=default',
                status: 'OPTIMAL',
                age: 24,
                yearsExperience: 5,
                height: '1.80m',
                weight: '75kg',
                events: [{ name: '100m', pb: '10.50' }],
                availableDays: ['L', 'M', 'X', 'J', 'V'],
                upcomingCompetitions: []
            };
        }

        // Extract events from statsHistory - get best times per event
        const eventMap = new Map<string, number>();
        athlete.statsHistory?.forEach(stat => {
            const current = eventMap.get(stat.event);
            if (!current || stat.numericResult < current) {
                eventMap.set(stat.event, stat.numericResult);
            }
        });

        const events = Array.from(eventMap.entries()).map(([name, pb]) => ({
            name: name.replace(' Lisos', ''),
            pb: pb.toFixed(2)
        }));

        return {
            name: athlete.name,
            imgUrl: athlete.imgUrl,
            status: athlete.status,
            age: athlete.age || 24,
            yearsExperience: athlete.experienceYears || 5,
            height: `${((athlete as any).height || 180)}cm`,
            weight: `${((athlete as any).weight || 75)}kg`,
            events: events.length > 0 ? events : [{ name: '100m', pb: '--' }],
            availableDays: (athlete as any).availableDays || ['L', 'M', 'X', 'J', 'V'],
            upcomingCompetitions: athlete.upcomingCompetitions?.slice(0, 2).map(c => ({
                name: c.name,
                date: c.date
            })) || []
        };
    }
};

export const CheckInFacade = {
    getSummary(athleteId: string = '1'): CheckInWidgetSummary {
        // In a real app, this would check today's check-in status
        const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

        return {
            lastCheckIn: undefined, // Would be populated from actual data
            isPending: true, // Default to pending for demo
            lastRPE: undefined,
            lastSleep: undefined,
            link: ViewState.ATHLETE_INPUT
        };
    }
};



export const HealthFacade = {
    getSummary(athleteId: string = '1'): HealthWidgetSummary {
        const athlete = DataRing.getAthlete(athleteId);
        if (!athlete) {
            return {
                activeInjuries: 0,
                riskLevel: 'OPTIMAL',
                acwr: 1.0,
                readiness: 80,
                link: ViewState.HEALTH
            };
        }

        const activeInjuries = athlete.injuryHistory?.filter(i => i.status === 'ACTIVE').length || 0;
        const lastTherapy = athlete.recentTherapies?.[0]?.type;

        // Map CAUTION to WARNING for our interface
        const riskLevel: 'OPTIMAL' | 'WARNING' | 'HIGH_RISK' =
            athlete.status === 'HIGH_RISK' ? 'HIGH_RISK' :
                athlete.status === 'CAUTION' ? 'WARNING' : 'OPTIMAL';

        return {
            activeInjuries,
            riskLevel,
            acwr: athlete.acwr,
            readiness: athlete.readiness,
            lastTherapy,
            link: ViewState.HEALTH
        };
    }
};

export const VideoFacade = {
    getSummary(athleteId: string = '1'): VideoWidgetSummary {
        const athlete = DataRing.getAthlete(athleteId);
        const history = athlete?.videoHistory || [];

        return {
            totalAnalyses: history.length,
            lastScore: history[0]?.score,
            lastExercise: history[0]?.exerciseName,
            pendingCorrections: 3, // Demo: would check for videos with corrections
            link: ViewState.VIDEO_ANALYSIS
        };
    }
};

export const RecoveryFacade = {
    getSummary(athleteId: string = '1'): RecoveryWidgetSummary {
        const athlete = DataRing.getAthlete(athleteId);

        // Determine recovery icons based on athlete status
        const icons: string[] = ['spa']; // Default: always suggest recovery
        if (athlete?.status === 'HIGH_RISK') {
            icons.push('ac_unit', 'hotel', 'restaurant');
        } else if (athlete?.status === 'CAUTION') {
            icons.push('water_drop', 'hotel');
        } else {
            icons.push('water_drop');
        }

        return {
            hrv: athlete?.hrv || 75,
            lastRPE: undefined, // Populated from daily check-in
            sleepQuality: undefined, // Populated from daily check-in
            protocol: athlete?.status === 'HIGH_RISK' ? 'Regeneración Activa' : 'Protocolo Estándar',
            activeIcons: icons,
            link: ViewState.RECOVERY_PLAN
        };
    }
};

export const TrainingFacade = {
    getSummary(athleteId: string = '1'): TrainingWidgetSummary {
        const plan = DataRing.getWeeklyPlan(athleteId);

        if (!plan || plan.sessions.length === 0) {
            return {
                phase: 'PREPARACIÓN',
                weekProgress: 0,
                todayExercises: [],
                link: ViewState.PLANNING
            };
        }

        const nextSession = plan.sessions.find(s => s.status === 'PLANNED');
        const completedCount = plan.sessions.filter(s => s.status === 'COMPLETED').length;
        const weekProgress = Math.round((completedCount / plan.sessions.length) * 100);

        // Get today's exercises - demo data (would come from actual session)
        const todayExercises = [
            { name: 'Sprints', detail: '6x60m' },
            { name: 'Squat', detail: '3x5' },
            { name: 'Core', detail: '3x15' }
        ];

        return {
            nextSession: nextSession ? {
                title: nextSession.title,
                day: nextSession.day,
                date: nextSession.date,
                type: nextSession.type
            } : undefined,
            todayExercises,
            phase: plan.trainingPhase,
            weekProgress,
            link: ViewState.PLANNING
        };
    }
};

export const StatsFacade = {
    getSummary(athleteId: string = '1'): StatsWidgetSummary {
        const athlete = DataRing.getAthlete(athleteId);
        const history = athlete?.statsHistory || [];

        // Get all unique events
        const eventTypes = Array.from(new Set(history.map(s => s.event)));

        // For the widget, show best time from primary event (100m if exists, otherwise first event)
        const primaryEvent = eventTypes.find(e => e.includes('100m')) || eventTypes[0];
        const primaryHistory = history.filter(s => s.event === primaryEvent);
        const times = primaryHistory.map(s => s.numericResult).filter(Boolean);
        const bestTime = times.length > 0 ? Math.min(...times) : undefined;

        // Calculate trend based on last 3 records of primary event
        let trend: 'up' | 'down' | 'neutral' = 'neutral';
        if (times.length >= 3) {
            const recent = times.slice(-3);
            if (recent[2] < recent[0]) trend = 'up'; // Menor tiempo = mejor
            else if (recent[2] > recent[0]) trend = 'down';
        }

        // Get chart data for ALL events (last 5 records per event)
        const eventColors: Record<string, string> = {
            '100m': '#67e8f9',
            '200m': '#a5b4fc',
            '400m': '#f9a8d4',
        };

        const chartData = eventTypes.flatMap(eventType => {
            const eventHistory = history
                .filter(s => s.event === eventType)
                .slice(0, 5)
                .reverse();

            return eventHistory.map(s => ({
                val: s.numericResult,
                type: s.type,
                event: eventType,
                color: eventColors[eventType.replace(' Lisos', '')] || '#67e8f9'
            }));
        });

        return {
            bestTime100m: bestTime,
            trend,
            totalRecords: history.length,
            chartData,
            link: ViewState.STATS
        };
    }
};

export const MacrocycleFacade = {
    getSummary(athleteId: string = '1'): MacrocycleWidgetSummary {
        const athlete = DataRing.getAthlete(athleteId);

        if (!athlete) {
            return {
                loadTrend: [20, 15, 40, 60, 80, 55, 90, 85],
                acwrActual: 1.0,
                competitions: [],
                injuries: [],
                therapies: [],
                link: ViewState.PLANNING
            };
        }

        return {
            loadTrend: athlete.loadTrend.length > 0
                ? athlete.loadTrend
                : [20, 15, 40, 60, 80, 55, 90, 85],
            acwrActual: athlete.acwr,
            competitions: athlete.upcomingCompetitions.map(c => ({
                name: c.name,
                week: 6 // Aproximado para demo
            })),
            injuries: athlete.injuryHistory
                .filter(i => i.status === 'ACTIVE')
                .map(() => ({ week: 2 })),
            therapies: athlete.recentTherapies.map(() => ({ week: 4 })),
            link: ViewState.PLANNING
        };
    }
};

// --- FACADE UNIFICADO ---

export const WidgetFacades = {
    profile: ProfileFacade,
    health: HealthFacade,
    video: VideoFacade,
    recovery: RecoveryFacade,
    training: TrainingFacade,
    stats: StatsFacade,
    macrocycle: MacrocycleFacade,
    checkIn: CheckInFacade
};

export default WidgetFacades;
