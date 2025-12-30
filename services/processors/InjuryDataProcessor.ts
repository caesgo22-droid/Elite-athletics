import { Athlete, Injury } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';

/**
 * INJURY DATA PROCESSOR
 * 
 * Maneja actualizaciones de lesiones y cambios de estado del atleta.
 */
export class InjuryDataProcessor implements IDataProcessor {
    readonly type = 'INJURY_UPDATE';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        const injury = payload.injury as Injury;

        // Buscar si la lesión ya existe
        const exists = athlete.injuryHistory.find(i => i.id === injury.id);

        if (exists) {
            // Actualizar lesión existente
            Object.assign(exists, injury);
        } else {
            // Agregar nueva lesión al inicio del historial
            athlete.injuryHistory.unshift(injury);
        }

        // Actualizar estado del atleta basado en la severidad
        if (injury.status === 'ACTIVE' && injury.severity > 2) {
            athlete.status = 'HIGH_RISK';
        } else if (injury.status === 'RESOLVED') {
            // Lógica simple: si se resuelve una lesión, status a OPTIMAL
            athlete.status = 'OPTIMAL';
        }

        return {
            updated: athlete,
            eventType: 'INJURY'
        };
    }
}

/**
 * INJURY RESOLVED PROCESSOR
 * 
 * Maneja la resolución de lesiones específicas.
 */
export class InjuryResolvedProcessor implements IDataProcessor {
    readonly type = 'INJURY_RESOLVED';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        const injury = athlete.injuryHistory.find(i => i.id === payload.injuryId);

        if (injury) {
            injury.status = 'RESOLVED';
            // Recalcular estado del atleta
            const hasActiveInjuries = athlete.injuryHistory.some(i => i.status === 'ACTIVE' && i.severity > 2);
            if (!hasActiveInjuries) {
                athlete.status = 'OPTIMAL';
            }
        }

        return {
            updated: athlete,
            eventType: 'INJURY'
        };
    }
}
