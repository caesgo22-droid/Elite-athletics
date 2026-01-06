import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface ActivityLog {
    id?: string;
    athleteId: string;
    athleteName: string;
    type: 'PLAN_GENERATED' | 'VIDEO_UPLOAD' | 'CHECK_IN' | 'OTHER';
    description: string;
    metadata?: any;
    timestamp: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    requiresAction?: boolean;
}

class ActivityService {
    async createActivity(
        athleteId: string,
        athleteName: string,
        type: ActivityLog['type'],
        description: string,
        options?: {
            severity?: 'LOW' | 'MEDIUM' | 'HIGH';
            requiresAction?: boolean;
            metadata?: any;
        }
    ): Promise<void> {
        try {
            const activity: ActivityLog = {
                athleteId,
                athleteName,
                type,
                description,
                timestamp: new Date().toISOString(),
                severity: options?.severity || 'LOW',
                requiresAction: options?.requiresAction || false,
                metadata: options?.metadata || {}
            };

            await addDoc(collection(db, 'activities'), activity);
            console.log(`[ACTIVITY] Logged: ${description}`);
        } catch (error) {
            console.error('[ACTIVITY] Error creating activity log:', error);
            // Non-blocking error
        }
    }

    async getRecentActivities(limitCount: number = 20): Promise<ActivityLog[]> {
        try {
            const q = query(
                collection(db, 'activities'),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
        } catch (error) {
            console.error('[ACTIVITY] Error fetching activities:', error);
            return [];
        }
    }
}

export const activityService = new ActivityService();
export default activityService;
