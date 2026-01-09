import { Athlete, WeeklyPlan, VideoAnalysisEntry, Macrocycle } from '../../types';
import { MOCK_WEEKLY_PLAN } from '../../constants';
import { db, storage } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, query, where, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AthleteSchema, WeeklyPlanSchema, MacrocycleSchema, ChatMessageSchema } from '../schemas';
import { logger } from '../Logger';

/**
 * STORAGE SATELLITE (CLOUDV2 - FIRESTORE)
 * 
 * Responsabilidad: Persistir datos en la nube de Google con cache local.
 * Principio: Offline-First con validación estricta (Zod).
 */

import { ISatellite } from './ISatellite';

class StorageSatelliteService implements ISatellite {
    readonly name = "Storage Satellite (Firestore)";
    private initialized = false;

    async initialize() {
        logger.log(`[${this.name}] 🟢 Hub Cloud Iniciado`);
        this.initialized = true;
    }

    async healthCheck(): Promise<boolean> {
        return this.initialized;
    }

    // --- HELPERS ---

    /**
     * Firestore doesn't accept 'undefined' fields. This helper recursively removes them.
     */
    private removeUndefined(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(item => this.removeUndefined(item)).filter(item => item !== undefined);
        }
        if (obj && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Blob)) {
            const cleaned: any = {};
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (value !== undefined) {
                    cleaned[key] = this.removeUndefined(value);
                }
            });
            return cleaned;
        }
        return obj;
    }

    // --- ATHLETE OPERATIONS ---

    async getAthlete(id: string): Promise<Athlete | undefined> {
        try {
            const docRef = doc(db, 'athletes', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const validated = AthleteSchema.parse(data);
                return validated as Athlete;
            }

            console.warn(`[STORAGE] No athlete found for ID: ${id}`);
            return undefined;
        } catch (e) {
            console.error("[STORAGE] Error fetching athlete from cloud", e);
            return undefined;
        }
    }

    async getAllAthletes(): Promise<Athlete[]> {
        try {
            const querySnapshot = await getDocs(collection(db, 'athletes'));
            const athletes: Athlete[] = [];
            querySnapshot.forEach((doc) => {
                try {
                    const validated = AthleteSchema.parse(doc.data());
                    athletes.push(validated as Athlete);
                } catch (e) {
                    console.warn(`[STORAGE] Skipping invalid athlete document: ${doc.id}`, e);
                }
            });
            logger.log(`[STORAGE] Loaded ${athletes.length} athletes from Firestore`);
            return athletes;
        } catch (e) {
            console.error("[STORAGE] Error fetching athletes", e);
            return [];
        }
    }

    async updateAthlete(athlete: Athlete): Promise<void> {
        try {
            // Validar antes de subir
            AthleteSchema.parse(athlete);
            const docRef = doc(db, 'athletes', athlete.id);

            // Size check before sending to Firestore (Firestore limit is 1MB)
            const cleanedData = this.removeUndefined(athlete);
            const estimatedBytes = this.estimateSize(cleanedData);

            if (estimatedBytes > 1000000) { // ~1MB
                logger.error(`[STORAGE] CRITICAL: Document size (${estimatedBytes} bytes) exceeds Firestore limit. Save aborted.`);
                throw new Error('DOCUMENT_TOO_LARGE');
            }

            await setDoc(docRef, cleanedData, { merge: true });

            // Sync local cache
            localStorage.setItem(`ATHLETE_${athlete.id}`, JSON.stringify(athlete));
        } catch (e: any) {
            console.error("[STORAGE] validation or cloud sync failed", e);
            if (e.message?.includes('too large') || e.message === 'DOCUMENT_TOO_LARGE') {
                throw new Error('DOCUMENT_SIZE_EXCEEDED');
            }
            throw e;
        }
    }

    // --- PLAN OPERATIONS ---

    async getWeeklyPlan(athleteId: string): Promise<WeeklyPlan | undefined> {
        try {
            const docRef = doc(db, 'plans', athleteId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return WeeklyPlanSchema.parse(docSnap.data()) as WeeklyPlan;
            }
            return MOCK_WEEKLY_PLAN;
        } catch (e) {
            return MOCK_WEEKLY_PLAN;
        }
    }

    async getMacrocycle(athleteId: string): Promise<Macrocycle | undefined> {
        try {
            const docRef = doc(db, 'macrocycles', athleteId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return MacrocycleSchema.parse(data) as Macrocycle;
            }

            // Default mock if none exists
            return {
                id: 'macro-1',
                name: 'Plan de Temporada',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                goal: 'Mejorar marcas personales',
                focusPoints: ['Técnica', 'Fuerza'],
                phase: 'PRE_SEASON'
            };
        } catch (e) {
            console.error("[STORAGE] Error fetching macrocycle", e);
            return undefined;
        }
    }

    async saveMacrocycle(athleteId: string, macrocycle: Macrocycle): Promise<void> {
        try {
            MacrocycleSchema.parse(macrocycle);
            const docRef = doc(db, 'macrocycles', athleteId);
            await setDoc(docRef, macrocycle, { merge: true });

            localStorage.setItem(`MACRO_${athleteId}`, JSON.stringify(macrocycle));
        } catch (e) {
            console.error("[STORAGE] Error saving macrocycle", e);
        }
    }

    // --- CHAT OPERATIONS ---

    async getChatHistory(athleteId: string): Promise<any[]> {
        try {
            const docRef = doc(db, 'chats', athleteId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().messages || [];
            }
            return [];
        } catch (e) {
            console.error("[STORAGE] Error fetching chat history", e);
            return [];
        }
    }

    async saveChatMessage(athleteId: string, message: any): Promise<void> {
        try {
            const docRef = doc(db, 'chats', athleteId);
            await setDoc(docRef, {
                messages: arrayUnion(message),
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("[STORAGE] Error saving chat message", e);
        }
    }

    async updateWeeklyPlan(plan: WeeklyPlan): Promise<void> {
        try {
            WeeklyPlanSchema.parse(plan);
            const docRef = doc(db, 'plans', plan.athleteId);
            await setDoc(docRef, plan);
        } catch (e) {
            console.error("[STORAGE] Plan sync failed", e);
        }
    }

    // --- PAYLOAD OFFLOADING ---

    /**
     * Uploads heavy JSON data (like skeleton sequences) to Firebase Storage
     * returns a permanent URL. This prevents bloating the Firestore document.
     */
    async uploadJSONPayload(athleteId: string, entryId: string, type: 'skeleton' | 'telestration', data: any): Promise<string> {
        try {
            const jsonString = JSON.stringify(data);
            const blob = new Blob([jsonString], { type: 'application/json' });

            const filename = `payloads/${athleteId}/${entryId}_${type}.json`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);

            logger.log(`[STORAGE] ✅ ${type} JSON payload uploaded successfully`);
            return downloadUrl;
        } catch (e) {
            console.error(`[STORAGE] ❌ Failed to upload ${type} JSON payload:`, e);
            throw e;
        }
    }

    // --- SPECIALIZED WRITES ---

    async addVideoEntry(athleteId: string, entry: VideoAnalysisEntry): Promise<void> {
        try {
            logger.log('[STORAGE] 💾 Adding video entry to Firestore...', { athleteId, entryId: entry.id });

            // 1. Upload thumbnail to Firebase Storage if it's base64
            let thumbnailUrl = entry.thumbnailUrl;
            if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
                logger.log('[STORAGE] 📤 Uploading thumbnail to Firebase Storage...');
                thumbnailUrl = await this.uploadThumbnail(athleteId, thumbnailUrl);
            }

            // 2. Process telestration data - upload captures to Firebase Storage
            let telestrationData = entry.telestrationData;
            if (telestrationData) {
                try {
                    const parsed = JSON.parse(telestrationData);
                    if (Array.isArray(parsed)) {
                        logger.log('[STORAGE] 📤 Uploading telestration captures...');
                        const uploadedCaptures = await Promise.all(
                            parsed.map(async (capture: any) => {
                                if (capture.image && capture.image.startsWith('data:')) {
                                    const uploadedImage = await this.uploadTelestrationCapture(athleteId, capture.image);
                                    return { ...capture, image: uploadedImage };
                                }
                                return capture;
                            })
                        );
                        telestrationData = JSON.stringify(uploadedCaptures);
                    }
                } catch (e) {
                    if (telestrationData.startsWith('data:')) {
                        logger.log('[STORAGE] 📤 Uploading single telestration capture...');
                        telestrationData = await this.uploadTelestrationCapture(athleteId, telestrationData);
                    }
                }
            }

            // 3. CRITICAL: Offload skeleton sequence to JSON in Storage to stay under 1MB Firestore limit
            let skeletonPayloadUrl = '';
            let reducedSkeleton: any[] = [];

            if (entry.skeletonSequence && entry.skeletonSequence.length > 0) {
                try {
                    logger.log('[STORAGE] 📤 Offloading skeleton sequence to JSON Storage...');
                    skeletonPayloadUrl = await this.uploadJSONPayload(athleteId, entry.id, 'skeleton', entry.skeletonSequence);

                    // Keep a VERY tiny summary in Firestore (first, middle, last frame) for quick UI hints
                    reducedSkeleton = [
                        entry.skeletonSequence[0],
                        entry.skeletonSequence[Math.floor(entry.skeletonSequence.length / 2)],
                        entry.skeletonSequence[entry.skeletonSequence.length - 1]
                    ].map(frame => ({
                        time: frame.time,
                        landmarks: frame.landmarks
                    }));
                } catch (offloadError) {
                    console.warn('[STORAGE] ⚠️ Failed to offload skeleton, will use minimal summary only');
                }
            }

            const athleteRef = doc(db, 'athletes', athleteId);

            // 4. Prepare sanitized entry with offloaded assets
            const sanitizedEntry: any = {
                id: entry.id,
                date: entry.date,
                exerciseName: entry.exerciseName,
                score: entry.score,
                status: entry.status,
                thumbnailUrl: thumbnailUrl,
                videoUrl: entry.videoUrl,
                aiAnalysis: entry.aiAnalysis,
                expertMetrics: entry.expertMetrics,
                biomechanics: entry.biomechanics,
                skeletonSequence: reducedSkeleton,
                skeletonPayloadUrl: skeletonPayloadUrl,
                coachFeedback: entry.coachFeedback,
                hasFeedback: entry.hasFeedback,
                voiceNotes: entry.voiceNotes,
                telestrationData: telestrationData
            };

            // Remove all undefined fields before saving
            const cleanedEntry = this.removeUndefined(sanitizedEntry);

            // Use setDoc with merge to handles arrayUnion properly
            await setDoc(athleteRef, {
                videoHistory: arrayUnion(cleanedEntry)
            }, { merge: true });

            logger.log('[STORAGE] ✅ Video entry added successfully with offloaded payloads');
        } catch (error) {
            console.error('[STORAGE] ❌ Failed to add video entry:', error);
            throw error;
        }
    }

    async uploadThumbnail(athleteId: string, base64Data: string): Promise<string> {
        try {
            const base64Content = base64Data.split(',')[1] || base64Data;
            const mimeMatch = base64Data.match(/data:([^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            const filename = `thumbnails/${athleteId}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (e) {
            console.warn('[STORAGE] ⚠️ Thumbnail upload failed, keeping base64', e);
            // If it exceeds 1MB limit later, we will need to reconsider, but for now fallback
            return base64Data;
        }
    }

    async uploadTelestrationCapture(athleteId: string, base64Data: string): Promise<string> {
        try {
            const base64Content = base64Data.split(',')[1] || base64Data;
            const mimeMatch = base64Data.match(/data:([^;]+);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            const filename = `telestration/${athleteId}/${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            return await getDownloadURL(storageRef);
        } catch (e) {
            console.warn('[STORAGE] ⚠️ Telestration upload failed, keeping base64', e);
            return base64Data;
        }
    }

    async uploadVideo(athleteId: string, file: Blob): Promise<string> {
        if (!file) throw new Error("No file provided");

        const maxRetries = 2;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                logger.log(`[STORAGE] 📤 Uploading video (attempt ${attempt + 1}/${maxRetries + 1})...`);

                const filename = `videos/${athleteId}/${Date.now()}.webm`;
                const storageRef = ref(storage, filename);

                await uploadBytes(storageRef, file);
                return await getDownloadURL(storageRef);
            } catch (e) {
                console.warn(`[STORAGE] ⚠️ Video upload attempt ${attempt + 1} failed:`, e);

                if (attempt === maxRetries) {
                    console.warn("[STORAGE] All upload attempts failed, using IndexedDB fallback");
                    try {
                        const localId = `video_${athleteId}_${Date.now()}`;
                        await this.saveToLocalDB(localId, file);
                        return `idb://${localId}`;
                    } catch (dbErr) {
                        return URL.createObjectURL(file);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
        throw new Error("Upload failed");
    }

    // --- IDB HELPERS ---
    private async getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('EliteSyncVideos', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('videos')) {
                    db.createObjectStore('videos');
                }
            };
        });
    }

    private async saveToLocalDB(key: string, file: Blob): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('videos', 'readwrite');
            const store = tx.objectStore('videos');
            const req = store.put(file, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async getFromLocalDB(key: string): Promise<Blob | null> {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction('videos', 'readonly');
                const store = tx.objectStore('videos');
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result as Blob || null);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            return null;
        }
    }

    async updateVideoEntry(athleteId: string, entryId: string, updates: Partial<VideoAnalysisEntry>): Promise<void> {
        try {
            logger.log('[STORAGE] 🔄 Updating video entry...', { athleteId, entryId });

            const athlete = await this.getAthlete(athleteId);
            if (!athlete) throw new Error(`Athlete not found: ${athleteId}`);

            const entryIndex = athlete.videoHistory?.findIndex(v => v.id === entryId);
            if (entryIndex === undefined || entryIndex === -1) throw new Error(`Video entry not found: ${entryId}`);

            const currentEntry = athlete.videoHistory[entryIndex];

            // 1. Process telestration data if updated
            let telestrationData = updates.telestrationData;
            if (telestrationData && telestrationData !== currentEntry.telestrationData) {
                try {
                    const parsed = JSON.parse(telestrationData);
                    if (Array.isArray(parsed)) {
                        logger.log('[STORAGE] 📤 Uploading updated telestration captures...');
                        const uploadedCaptures = await Promise.all(
                            parsed.map(async (capture: any) => {
                                if (capture.image && capture.image.startsWith('data:')) {
                                    const uploadedImage = await this.uploadTelestrationCapture(athleteId, capture.image);
                                    return { ...capture, image: uploadedImage };
                                }
                                return capture;
                            })
                        );
                        telestrationData = JSON.stringify(uploadedCaptures);
                    }
                } catch (e) {
                    if (telestrationData.startsWith('data:')) {
                        telestrationData = await this.uploadTelestrationCapture(athleteId, telestrationData);
                    }
                }
            }

            // 2. Merge updates and sanitize
            const updatedEntry = {
                ...currentEntry,
                ...updates,
                telestrationData: telestrationData || currentEntry.telestrationData
            };

            athlete.videoHistory[entryIndex] = updatedEntry;

            // 3. Save back to Firestore
            await this.updateAthlete(athlete);

            logger.log('[STORAGE] ✅ Video entry updated successfully');
        } catch (error) {
            console.error('[STORAGE] ❌ Failed to update video entry:', error);
            throw error;
        }
    }

    async deleteVideoEntry(athleteId: string, entryId: string): Promise<Athlete | undefined> {
        const athlete = await this.getAthlete(athleteId);
        if (athlete) {
            athlete.videoHistory = athlete.videoHistory?.filter(v => v.id !== entryId) || [];
            await this.updateAthlete(athlete);
            return athlete;
        }
        return undefined;
    }
    /**
     * Data Repair: Prunes bloated fields to stay under Firestore's 1MB limit.
     */
    async pruneAthleteData(athleteId: string): Promise<void> {
        try {
            logger.log(`[STORAGE] 🛠️ Pruning data for athlete: ${athleteId}`);
            const athlete = await this.getAthlete(athleteId);
            if (!athlete) return;

            // Strategy: Clear video history which is usually the culprit for bloat
            const pruned: Athlete = {
                ...athlete,
                videoHistory: [], // Wipe current history to reset size
                recentTherapies: athlete.recentTherapies?.slice(-10) || [], // Keep only last 10
                statsHistory: athlete.statsHistory?.slice(-20) || [] // Keep only last 20
            };

            await this.updateAthlete(pruned);
            logger.log('[STORAGE] ✅ Data pruned successfully');
        } catch (error) {
            logger.error('[STORAGE] ❌ Failed to prune data:', error);
            throw error;
        }
    }

    /**
     * Helper to estimate object size in bytes
     */
    private estimateSize(obj: any): number {
        const str = JSON.stringify(obj);
        return encodeURI(str).split(/%..|./).length - 1;
    }
}

export const StorageSatellite = new StorageSatelliteService();
