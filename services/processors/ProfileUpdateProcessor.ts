import { Athlete } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';

/**
 * PROFILE UPDATE PROCESSOR
 * 
 * Handles updates to the core athlete profile information.
 */
export class ProfileUpdateProcessor implements IDataProcessor {
    readonly type = 'PROFILE_UPDATE';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        const updates = payload.updates;

        // Apply updates to the athlete object
        const updatedAthlete = {
            ...athlete,
            ...updates
        };

        return {
            updated: updatedAthlete,
            eventType: 'PROFILE'
        };
    }
}
