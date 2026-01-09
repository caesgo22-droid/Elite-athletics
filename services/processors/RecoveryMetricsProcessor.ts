import { Athlete } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';
import { notificationService } from '../NotificationService';

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
        if (payload.rpe) {
            athlete.loadTrend.push(payload.rpe * 10);
        }

        // Lógica de detección de HIGH_RISK
        if (payload.rpe > 7 || payload.pain > 3) {
            athlete.status = 'HIGH_RISK';
            athlete.acwr = parseFloat((athlete.acwr + 0.15).toFixed(2));
            athlete.hrv = Math.max(30, athlete.hrv - 12);
            athlete.hrvTrend = 'down';

            // Notify staff if pain is high
            if (payload.pain >= 5) {
                try {
                    if (athlete.assignedStaff && athlete.assignedStaff.length > 0) {
                        for (const staff of athlete.assignedStaff) {
                            await notificationService.notifyStaffHighPain(
                                staff.id,
                                athlete.id,
                                athlete.name,
                                payload.pain,
                                payload.painLocation
                            );
                        }
                    }
                } catch (error) {
                    console.error('[RECOVERY PROCESSOR] Notification failed:', error);
                }
            }
        } else {
            // Reducir riesgo si estaba en HIGH_RISK
            if (athlete.status === 'HIGH_RISK') {
                athlete.status = 'CAUTION';
            }
        }

        return {
            updated: athlete,
            eventType: 'RECOVERY',
            eventData: payload
        };
    }
}
