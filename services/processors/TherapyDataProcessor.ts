import { Athlete, TherapyLog } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';

/**
 * THERAPY DATA PROCESSOR
 * 
 * Maneja el registro de sesiones de terapia/recuperación.
 */
export class TherapyDataProcessor implements IDataProcessor {
    readonly type = 'THERAPY_SESSION';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        const therapy = payload.therapy as TherapyLog;

        // Agregar terapia al inicio del historial
        athlete.recentTherapies.unshift(therapy);

        return {
            updated: athlete,
            eventType: 'THERAPY'
        };
    }
}
