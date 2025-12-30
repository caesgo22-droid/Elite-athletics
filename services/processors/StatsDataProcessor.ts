import { Athlete, StatEntry } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';

/**
 * STATS DATA PROCESSOR
 * 
 * Maneja actualizaciones y eliminaciones de estadísticas de rendimiento.
 */
export class StatsDataProcessor implements IDataProcessor {
    readonly type = 'STAT_UPDATE';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        const stat = payload.stat as StatEntry;
        const action = payload.action;

        if (action === 'DELETE') {
            // Eliminar estadística del historial
            athlete.statsHistory = athlete.statsHistory.filter(s => s.id !== stat.id);
        } else {
            // Actualizar o agregar estadística
            const index = athlete.statsHistory.findIndex(s => s.id === stat.id);

            // LOGICA OMNI-CONSCIENTE: Gestión de PB
            // Si la nueva stat es PB, quitar el flag a las anteriores del mismo evento
            if (stat.isPB) {
                athlete.statsHistory.forEach(s => {
                    if (s.event === stat.event && s.id !== stat.id) {
                        s.isPB = false;
                    }
                });
            }

            if (index >= 0) {
                // Actualizar existente
                athlete.statsHistory[index] = stat;
            } else {
                // Agregar nueva
                athlete.statsHistory.push(stat);
            }
        }

        return {
            updated: athlete,
            eventType: 'STATS'
        };
    }
}
