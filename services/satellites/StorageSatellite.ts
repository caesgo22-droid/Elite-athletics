
import { Athlete, WeeklyPlan, VideoAnalysisEntry, Macrocycle } from '../../types';
import { MOCK_ATHLETES, MOCK_WEEKLY_PLAN } from '../../constants';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, arrayUnion } from 'firebase/firestore';
import { AthleteSchema, WeeklyPlanSchema } from '../schemas';

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

            // Fallback to Mock for initial setup if not in cloud
            const mock = MOCK_ATHLETES.find(a => a.id === id);
            if (mock) return mock;

            // If it's an authenticated user ID ('1' is the old mock ID), create a skeleton record
            if (id !== '1') {
                const skeleton: Athlete = {
                    ...MOCK_ATHLETES[0],
                    id: id,
                    name: 'Nuevo Atleta',
                    statsHistory: [],
                    injuryHistory: [],
                    videoHistory: [],
                    upcomingCompetitions: [],
                    recentTherapies: []
                };
                await this.updateAthlete(skeleton);
                return skeleton;
            }
            return undefined;
        } catch (e) {
            console.error("[STORAGE] Error fetching athlete from cloud", e);
            return MOCK_ATHLETES.find(a => a.id === id);
        }
    }

    async getAllAthletes(): Promise<Athlete[]> {
        try {
            const querySnapshot = await getDocs(collection(db, 'athletes'));
            const athletes: Athlete[] = [];
            querySnapshot.forEach((doc) => {
                athletes.push(doc.data() as Athlete);
            });
            return athletes.length > 0 ? athletes : MOCK_ATHLETES;
        } catch (e) {
            return MOCK_ATHLETES;
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
        // Mock Data for "Deep Context" demo
        // In production, this would fetch from Firestore 'macrocycles' collection
        return {
            id: 'macro-1',
            name: 'Road to Nationals 2024',
            startDate: '2024-01-01',
            endDate: '2024-03-01',
            goal: 'Sub 10.50s in 100m',
            focusPoints: ['Max Velocity', 'Drive Phase Mechanics', 'Force Production'],
            phase: 'COMPETITIVE'
        };
    }

    async saveMacrocycle(athleteId: string, macrocycle: Macrocycle): Promise<void> {
        // In production, setDoc to 'macrocycles' collection
        console.log(`[STORAGE] Saved Macrocycle for ${athleteId}:`, macrocycle);
        // Mock persistence for session
        localStorage.setItem(`MACRO_${athleteId}`, JSON.stringify(macrocycle));
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
        const athleteRef = doc(db, 'athletes', athleteId);
        await updateDoc(athleteRef, {
            videoHistory: arrayUnion(entry)
        });
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
