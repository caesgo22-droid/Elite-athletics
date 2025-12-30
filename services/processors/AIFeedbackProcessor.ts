import { Athlete } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';

/**
 * AI FEEDBACK PROCESSOR
 * 
 * Maneja el almacenamiento de feedback del usuario sobre las respuestas de la IA.
 * Esto se usará para el aprendizaje continuo del sistema.
 */
export class AIFeedbackProcessor implements IDataProcessor {
    readonly type = 'AI_FEEDBACK';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        // En este MVP, simplemente pasamos el dato para que se publique el evento
        // La persistencia se puede extender si queremos una base de datos de aprendizaje

        return {
            updated: athlete,
            eventType: 'UI_FEEDBACK',
            eventData: payload
        };
    }
}
