import { Athlete, VideoAnalysisEntry } from '../../types';
import { IDataProcessor, ProcessorResult } from './IDataProcessor';
import { StorageSatellite } from '../satellites/StorageSatellite';

/**
 * VIDEO DATA PROCESSOR
 * 
 * Maneja la ingesta y eliminación de entradas de análisis de video.
 */
export class VideoDataProcessor implements IDataProcessor {
    readonly type = 'VIDEO_UPLOAD';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        const videoEntry = payload.entry as VideoAnalysisEntry;

        // Actualizar el objeto local para que el DataRing tenga la versión correcta
        if (!athlete.videoHistory) athlete.videoHistory = [];
        athlete.videoHistory.push(videoEntry);

        // Delegar a StorageSatellite para persistencia física
        await StorageSatellite.addVideoEntry(payload.athleteId, videoEntry);

        return {
            updated: athlete,
            eventType: 'VIDEO'
        };
    }
}

/**
 * VIDEO DELETE PROCESSOR
 * 
 * Maneja la eliminación de entradas de video del historial.
 */
export class VideoDeleteProcessor implements IDataProcessor {
    readonly type = 'VIDEO_DELETE';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        // Actualizar localmente primero para asegurar consistencia en el DataRing
        athlete.videoHistory = athlete.videoHistory?.filter(v => v.id !== payload.entryId) || [];

        const updatedAthlete = await StorageSatellite.deleteVideoEntry(payload.athleteId, payload.entryId);

        return {
            updated: updatedAthlete || athlete,
            eventType: 'VIDEO'
        };
    }
}
/**
 * VIDEO UPDATE PROCESSOR
 * 
 * Maneja la actualización de feedback (comentarios, dibujos, notas de voz)
 * en entradas de video existentes.
 */
export class VideoUpdateProcessor implements IDataProcessor {
    readonly type = 'VIDEO_DATA';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        // En este arquitectura offline-first, el payload ya trae el objeto actualizado
        // o los campos a actualizar. 

        // Actualizar el historial del atleta localmente
        athlete.videoHistory = athlete.videoHistory?.map(entry =>
            entry.id === payload.id ? { ...entry, ...payload } : entry
        ) || [];

        // Persistir cambio total del atleta
        await StorageSatellite.updateAthlete(athlete);

        return {
            updated: athlete,
            eventType: 'VIDEO'
        };
    }
}
