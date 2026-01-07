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
        console.log('[VIDEO PROCESSOR] 🎬 Processing video entry...', { entryId: payload.entry?.id });
        const videoEntry = payload.entry as VideoAnalysisEntry;

        // Actualizar el objeto local para que el DataRing tenga la versión correcta
        if (!athlete.videoHistory) {
            console.log('[VIDEO PROCESSOR] 📝 Initializing videoHistory array');
            athlete.videoHistory = [];
        }
        console.log('[VIDEO PROCESSOR] ➕ Adding entry to local array (current count:', athlete.videoHistory.length, ')');
        athlete.videoHistory.push(videoEntry);
        console.log('[VIDEO PROCESSOR] ✓ Entry added to local array (new count:', athlete.videoHistory.length, ')');

        // Delegar a StorageSatellite para persistencia física
        console.log('[VIDEO PROCESSOR] 💾 Calling StorageSatellite.addVideoEntry...');
        await StorageSatellite.addVideoEntry(payload.athleteId, videoEntry);
        console.log('[VIDEO PROCESSOR] ✅ Video entry processed successfully');

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
        console.log('[VIDEO UPDATE PROCESSOR] 🔄 Processing video update...', { entryId: payload.id });

        // Update using StorageSatellite's updateVideoEntry method
        // This properly handles Firestore array updates and uploads telestration/voice data
        await StorageSatellite.updateVideoEntry(payload.athleteId, payload.id, payload);

        // Update local athlete object for immediate UI feedback
        athlete.videoHistory = athlete.videoHistory?.map(entry =>
            entry.id === payload.id ? { ...entry, ...payload } : entry
        ) || [];

        console.log('[VIDEO UPDATE PROCESSOR] ✅ Video update processed successfully');

        return {
            updated: athlete,
            eventType: 'VIDEO'
        };
    }
}
