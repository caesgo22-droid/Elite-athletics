import { Athlete } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';
import { notificationService } from '../NotificationService';
import { ACWRCalculator } from '../math/acwr';

/**
 * RECOVERY METRICS PROCESSOR
 * 
 * Maneja la ingesta de métricas de recuperación (RPE, dolor, sueño, HRV).
 * Actualiza el estado de riesgo del atleta basado en umbrales científicos.
 */
export class RecoveryMetricsProcessor implements IDataProcessor {
    readonly type = 'RECOVERY_METRICS';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        // Actualizar tendencia de carga si hay RPE
        if (!athlete.loadTrend) {
            athlete.loadTrend = [];
        }

        if (payload.rpe) {
            athlete.loadTrend.push(payload.rpe * 10);
        }

        // NEW: Persist granular daily log for history
        if (!athlete.dailyLogs) {
            athlete.dailyLogs = [];
        }

        // Avoid duplicates for same day? Or just append?
        // Let's simple append for now, UI can filter by latest if needed or we can dedupe here.
        // Simple dedupe by date string:
        const todayStr = new Date().toISOString().split('T')[0];
        const existingLogIndex = athlete.dailyLogs.findIndex(l => l.date === todayStr);

        const newLogEntry = {
            date: todayStr,
            metrics: {
                sleepHours: payload.sleep || 0,  // Fixed: was sleepHours, now maps to sleep from payload
                sleepQuality: payload.sleepQuality || 0,
                rpe: payload.rpe,
                stress: payload.stress,
                mood: payload.mood,
                pain: payload.pain,
                hydration: payload.hydration  // Added: was missing
            }
        };

        if (existingLogIndex >= 0) {
            athlete.dailyLogs[existingLogIndex] = newLogEntry; // Update today's entry
        } else {
            athlete.dailyLogs.push(newLogEntry);
        }

        // Keep last 30 days only to save space?
        if (athlete.dailyLogs.length > 60) {
            athlete.dailyLogs = athlete.dailyLogs.slice(-60);
        }

        // Recalcular ACWR con la tendencia de carga real
        athlete.acwr = ACWRCalculator.calculate(athlete.loadTrend);

        // Lógica de detección de riesgo OMNI-CONSCIENTE
        const hasHighPain = payload.pain >= 4;
        const hasHighRPE = payload.rpe >= 8;
        const hasACWRDanger = athlete.acwr >= 1.5;
        const hasModerateWarning = (payload.pain >= 2 && payload.rpe >= 6) || athlete.acwr > 1.3;

        if (hasHighPain || hasHighRPE || hasModerateWarning || hasACWRDanger) {
            athlete.status = 'HIGH_RISK';

            // Impact on HRV (physiological stress)
            const stressImpact = (payload.pain || 0) * 2 + (payload.rpe || 0) + (athlete.acwr > 1.5 ? 10 : 0);
            athlete.hrv = Math.max(30, athlete.hrv - stressImpact);
            athlete.hrvTrend = 'down';

            // Notify staff if situation is critical
            if (payload.pain >= 5 || (payload.pain >= 3 && payload.rpe >= 8) || athlete.acwr >= 1.7) {
                try {
                    const staffToNotify = athlete.assignedStaff || athlete.staff;
                    if (staffToNotify && staffToNotify.length > 0) {
                        for (const staff of staffToNotify) {
                            await notificationService.notifyStaffHighPain(
                                staff.id,
                                athlete.id,
                                athlete.name,
                                payload.pain,
                                payload.painLocation || 'No especificada (Feedback de Sesión)'
                            );
                        }
                    }
                } catch (error) {
                    console.error('[RECOVERY PROCESSOR] Notification failed:', error);
                }
            }
        } else {
            // Recuperación gradual si las métricas son buenas
            if (athlete.status === 'HIGH_RISK') {
                athlete.status = 'CAUTION';
            } else if (athlete.status === 'CAUTION' && payload.pain === 0 && (payload.rpe || 0) < 5) {
                athlete.status = 'OPTIMAL';
            }

            // HRV Recovery
            if (payload.sleepQuality >= 8) {
                athlete.hrv = Math.min(100, athlete.hrv + 5);
                athlete.hrvTrend = 'up';
            }
        }

        return {
            updated: athlete,
            eventType: 'RECOVERY',
            eventData: payload
        };
    }
}
