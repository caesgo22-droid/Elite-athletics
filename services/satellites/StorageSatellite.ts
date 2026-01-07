import { Athlete, WeeklyPlan, VideoAnalysisEntry, Macrocycle } from '../../types';
import { MOCK_ATHLETES, MOCK_WEEKLY_PLAN } from '../../constants';
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

            // Create skeleton record for new authenticated users
            if (id !== '1') {
                logger.log(`[STORAGE] Creating new athlete record for ID: ${id}`);
                const skeleton: Athlete = {
                    id: id,
                    name: 'Nuevo Atleta',
                    age: 24,
                    experienceYears: 1,
                    specialty: 'Sprint',
                    status: 'OPTIMAL',
                    acwr: 1.0,
                    readiness: 85,
                    hrv: 70,
                    hrvTrend: 'stable',
                    loadTrend: [20, 15, 40, 60, 80, 100, 90, 85],
                    imgUrl: `https://ui-avatars.com/api/?name=Atleta&background=random`,
                    statsHistory: [],
                    injuryHistory: [],
                    videoHistory: [],
                    upcomingCompetitions: [],
                    recentTherapies: [],
                    staff: []
                };
                await this.updateAthlete(skeleton);
                return skeleton;
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
            await setDoc(docRef, athlete, { merge: true });

            // Sync local cache
            localStorage.setItem(`ATHLETE_${athlete.id}`, JSON.stringify(athlete));
        } catch (e) {
            console.error("[STORAGE] validation or cloud sync failed", e);
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

    // --- SPECIALIZED WRITES ---

    async addVideoEntry(athleteId: string, entry: VideoAnalysisEntry): Promise<void> {
        try {
            logger.log('[STORAGE] 💾 Adding video entry to Firestore...', { athleteId, entryId: entry.id });

            // Helper to remove undefined fields (Firestore doesn't accept undefined)
            const removeUndefined = (obj: any): any => {
                if (Array.isArray(obj)) {
                    return obj.map(removeUndefined).filter(item => item !== undefined);
                }
                if (obj && typeof obj === 'object') {
                    const cleaned: any = {};
                    Object.keys(obj).forEach(key => {
                        const value = obj[key];
                        if (value !== undefined) {
                            cleaned[key] = removeUndefined(value);
                        }
                    });
                    return cleaned;
                }
                return obj;
            };

            // Upload thumbnail to Firebase Storage if it's base64
            let thumbnailUrl = entry.thumbnailUrl;
            if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
                logger.log('[STORAGE] 📤 Uploading thumbnail to Firebase Storage...');
                thumbnailUrl = await this.uploadThumbnail(athleteId, thumbnailUrl);
            }

            // Process telestration data - upload captures to Firebase Storage
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
                    // If it's not JSON or parsing fails, check if it's a single base64 image
                    if (telestrationData.startsWith('data:')) {
                        logger.log('[STORAGE] 📤 Uploading single telestration capture...');
                        telestrationData = await this.uploadTelestrationCapture(athleteId, telestrationData);
                    }
                }
            }

            const athleteRef = doc(db, 'athletes', athleteId);

            // Prepare sanitized entry with uploaded assets
            const sanitizedEntry: any = {
                id: entry.id,
                date: entry.date,
                exerciseName: entry.exerciseName,
                score: entry.score,
                status: entry.status,
                thumbnailUrl: thumbnailUrl, // Now a Firebase Storage URL or base64 fallback
                videoUrl: entry.videoUrl, // Keep as-is (can be Firebase URL, idb://, or blob:)
                aiAnalysis: entry.aiAnalysis,
                expertMetrics: entry.expertMetrics,
                biomechanics: entry.biomechanics,
                skeletonSequence: entry.skeletonSequence && entry.skeletonSequence.length > 0
                    ? [
                        entry.skeletonSequence[0],
                        entry.skeletonSequence[Math.floor(entry.skeletonSequence.length / 2)],
                        entry.skeletonSequence[entry.skeletonSequence.length - 1]
                    ].map(frame => ({
                        time: frame.time,
                        landmarks: frame.landmarks
                    }))
                    : [],
                coachFeedback: entry.coachFeedback,
                hasFeedback: entry.hasFeedback,
                voiceNotes: entry.voiceNotes, // Keep voice notes as base64 (small size)
                telestrationData: telestrationData // Now contains Firebase Storage URLs
            };

            // Remove all undefined fields
            const cleanedEntry = removeUndefined(sanitizedEntry);

            // Use setDoc with merge to handle cases where document doesn't exist
            await setDoc(athleteRef, {
                videoHistory: arrayUnion(cleanedEntry)
            }, { merge: true });

            logger.log('[STORAGE] ✅ Video entry added successfully with uploaded assets');
        } catch (error) {
            console.error('[STORAGE] ❌ Failed to add video entry:', error);
            throw error; // Re-throw to propagate error up the chain
        }
    }

    async uploadThumbnail(athleteId: string, base64Data: string): Promise<string> {
        try {
            // Convert base64 to blob
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
            const downloadUrl = await getDownloadURL(storageRef);

            logger.log('[STORAGE] ✅ Thumbnail uploaded successfully');
            return downloadUrl;
        } catch (e) {
            console.warn('[STORAGE] ⚠️ Thumbnail upload failed, keeping base64', e);
            return base64Data; // Fallback to base64 if upload fails
        }
    }

    async uploadTelestrationCapture(athleteId: string, base64Data: string): Promise<string> {
        try {
            // Convert base64 to blob
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
            const downloadUrl = await getDownloadURL(storageRef);

            logger.log('[STORAGE] ✅ Telestration capture uploaded successfully');
            return downloadUrl;
        } catch (e) {
            console.warn('[STORAGE] ⚠️ Telestration upload failed, keeping base64', e);
            return base64Data; // Fallback to base64 if upload fails
        }
    }

    async uploadVideo(athleteId: string, file: Blob): Promise<string> {
        if (!file) throw new Error("No file provided");

        // Try Firebase Storage with retry logic
        const maxRetries = 2;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                logger.log(`[STORAGE] 📤 Uploading video (attempt ${attempt + 1}/${maxRetries + 1})...`);

                const filename = `videos/${athleteId}/${Date.now()}.webm`;
                const storageRef = ref(storage, filename);

                await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(storageRef);

                logger.log('[STORAGE] ✅ Video uploaded successfully');
                return downloadUrl;
            } catch (e) {
                console.warn(`[STORAGE] ⚠️ Video upload attempt ${attempt + 1} failed:`, e);

                // If this was the last attempt, fall back to IndexedDB
                if (attempt === maxRetries) {
                    console.warn("[STORAGE] All upload attempts failed, using IndexedDB fallback");

                    try {
                        const localId = `video_${athleteId}_${Date.now()}`;
                        await this.saveToLocalDB(localId, file);
                        return `idb://${localId}`;
                    } catch (dbErr) {
                        console.error("IndexedDB save failed", dbErr);
                        return URL.createObjectURL(file); // Ultimate fallback (session only)
                    }
                }

                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }

        // This should never be reached, but TypeScript needs it
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

    async deleteVideoEntry(athleteId: string, entryId: string): Promise<Athlete | undefined> {
        const athlete = await this.getAthlete(athleteId);
        if (athlete) {
            athlete.videoHistory = athlete.videoHistory?.filter(v => v.id !== entryId) || [];
            await this.updateAthlete(athlete);
            return athlete;
        }
        return undefined;
    }
}

export const StorageSatellite = new StorageSatelliteService();
