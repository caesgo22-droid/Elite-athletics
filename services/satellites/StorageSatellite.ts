
import { Athlete, WeeklyPlan, VideoAnalysisEntry, Macrocycle } from '../../types';
import { MOCK_ATHLETES, MOCK_WEEKLY_PLAN } from '../../constants';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, arrayUnion } from 'firebase/firestore';
import { AthleteSchema, WeeklyPlanSchema, MacrocycleSchema, ChatMessageSchema } from '../schemas';

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
        console.log(`[${this.name}] 🟢 Hub Cloud Iniciado`);
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
                console.log(`[STORAGE] Creating new athlete record for ID: ${id}`);
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
            console.log(`[STORAGE] Loaded ${athletes.length} athletes from Firestore`);
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
            console.log('[STORAGE] 💾 Adding video entry to Firestore...', { athleteId, entryId: entry.id });

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

            const athleteRef = doc(db, 'athletes', athleteId);

            // CRITICAL: Sanitize entry to remove heavy data (base64 images, full skeleton sequences)
            // Firestore has a 1MB document limit, and base64 data easily exceeds this
            const sanitizedEntry: any = {
                id: entry.id,
                date: entry.date,
                exerciseName: entry.exerciseName,
                score: entry.score,
                status: entry.status,
                thumbnailUrl: entry.thumbnailUrl?.startsWith('data:')
                    ? '[BASE64_REMOVED]'
                    : entry.thumbnailUrl,
                videoUrl: entry.videoUrl?.startsWith('blob:')
                    ? '[BLOB_URL]'
                    : entry.videoUrl,
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
                voiceNotes: entry.voiceNotes,
                telestrationData: entry.telestrationData?.startsWith('data:')
                    ? '[BASE64_REMOVED]'
                    : entry.telestrationData
            };

            // Remove all undefined fields
            const cleanedEntry = removeUndefined(sanitizedEntry);

            // Use setDoc with merge to handle cases where document doesn't exist
            await setDoc(athleteRef, {
                videoHistory: arrayUnion(cleanedEntry)
            }, { merge: true });

            console.log('[STORAGE] ✅ Video entry added successfully (sanitized for size)');
        } catch (error) {
            console.error('[STORAGE] ❌ Failed to add video entry:', error);
            throw error; // Re-throw to propagate error up the chain
        }
    }

    async uploadVideo(athleteId: string, file: Blob): Promise<string> {
        if (!file) throw new Error("No file provided");

        // 1. Try Firebase Storage with Timeout
        try {
            const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
            const { storage } = await import('../firebase');

            const filename = `videos/${athleteId}/${Date.now()}.webm`;
            const storageRef = ref(storage, filename);

            // Create a timeout promise
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Upload timed out - likely CORS or Network")), 5000)
            );

            // Race the upload against the timeout
            await Promise.race([
                uploadBytes(storageRef, file),
                timeout
            ]);

            const downloadUrl = await getDownloadURL(storageRef);
            return downloadUrl;
        } catch (e) {
            console.warn("[STORAGE] Firebase Upload failed or timed out, using IndexedDB fallback.", e);

            // 2. Fallback: Save to IndexedDB for local persistence
            try {
                const localId = `video_${athleteId}_${Date.now()}`;
                await this.saveToLocalDB(localId, file);
                return `idb://${localId}`;
            } catch (dbErr) {
                console.error("IndexedDB save failed", dbErr);
                return URL.createObjectURL(file); // Ultimate fallback (session only)
            }
        }
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
