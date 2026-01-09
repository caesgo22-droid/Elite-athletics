import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, updateDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { logger } from './Logger';

export interface Notification {
    id: string;
    userId: string;
    type: 'HIGH_PAIN' | 'NEW_VIDEO' | 'CHECKIN_COMPLETE' | 'PLAN_READY' | 'CHAT_MESSAGE' | 'PLAN_APPROVED' | 'PLAN_REJECTED';
    title: string;
    message: string;
    data?: any;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    read: boolean;
    timestamp: string;
    actionUrl?: string;
}

class NotificationService {
    /**
     * Send a notification to a specific user
     */
    async sendNotification(
        userId: string,
        type: Notification['type'],
        title: string,
        message: string,
        options?: {
            data?: any;
            priority?: 'HIGH' | 'MEDIUM' | 'LOW';
            actionUrl?: string;
        }
    ): Promise<void> {
        try {
            const notificationData = {
                userId,
                type,
                title,
                message,
                data: options?.data || null,
                priority: options?.priority || 'MEDIUM',
                read: false,
                timestamp: new Date().toISOString(),
                actionUrl: options?.actionUrl || null,
            };

            await addDoc(collection(db, 'notifications'), notificationData);

            logger.log(`[NOTIFICATION] Sent ${type} to user ${userId}: ${title}`);
        } catch (error) {
            logger.error('[NOTIFICATION] Error sending notification:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user
     */
    async getNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            const notifications: Notification[] = [];

            snapshot.forEach((doc) => {
                notifications.push({
                    id: doc.id,
                    ...doc.data(),
                } as Notification);
            });

            return notifications;
        } catch (error) {
            logger.error('[NOTIFICATION] Error getting notifications:', error);
            return [];
        }
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            logger.error('[NOTIFICATION] Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true,
            });

            logger.log(`[NOTIFICATION] Marked ${notificationId} as read`);
        } catch (error) {
            logger.error('[NOTIFICATION] Error marking as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(q);
            const updates = snapshot.docs.map((document) =>
                updateDoc(doc(db, 'notifications', document.id), { read: true })
            );

            await Promise.all(updates);
            logger.log(`[NOTIFICATION] Marked all notifications as read for user ${userId}`);
        } catch (error) {
            logger.error('[NOTIFICATION] Error marking all as read:', error);
            throw error;
        }
    }

    /**
     * Subscribe to notifications in real-time
     */
    subscribeToNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void
    ): () => void {
        console.log('[NotificationService] Setting up subscription for user:', userId);

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                console.log('[NotificationService] Snapshot received, docs:', snapshot.size);
                const notifications: Notification[] = [];
                snapshot.forEach((doc) => {
                    notifications.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Notification);
                });

                console.log('[NotificationService] Parsed notifications:', notifications);
                callback(notifications);
            },
            (error) => {
                console.error('[NotificationService] Subscription error:', error);
                console.error('[NotificationService] Error code:', error.code);
                console.error('[NotificationService] Error message:', error.message);

                // If it's an index error, provide helpful guidance
                if (error.code === 'failed-precondition' || error.message.includes('index')) {
                    console.error('⚠️ FIRESTORE INDEX REQUIRED!');
                    console.error('Run: firebase deploy --only firestore:indexes');
                    console.error('Or create index manually in Firebase Console');
                }
            }
        );

        return unsubscribe;
    }

    /**
     * Helper: Notify staff when athlete reports high pain
     */
    async notifyStaffHighPain(
        staffId: string,
        athleteId: string,
        athleteName: string,
        painLevel: number,
        bodyPart?: string
    ): Promise<void> {
        const message = bodyPart
            ? `${athleteName} reportó dolor ${painLevel}/10 en ${bodyPart}`
            : `${athleteName} reportó dolor ${painLevel}/10`;

        await this.sendNotification(
            staffId,
            'HIGH_PAIN',
            '🚨 Alerta de Dolor Alto',
            message,
            {
                priority: 'HIGH',
                data: { athleteId, painLevel, bodyPart },
                actionUrl: `/athlete/${athleteId}/health`,
            }
        );
    }

    /**
     * Helper: Notify coach when new video is uploaded
     */
    async notifyCoachNewVideo(
        coachId: string,
        athleteId: string,
        athleteName: string,
        videoId: string
    ): Promise<void> {
        await this.sendNotification(
            coachId,
            'NEW_VIDEO',
            '📹 Nuevo Video para Revisar',
            `${athleteName} subió un nuevo video de análisis`,
            {
                priority: 'MEDIUM',
                data: { athleteId, videoId },
                actionUrl: `/athlete/${athleteId}/video/${videoId}`,
            }
        );
    }

    /**
     * Helper: Notify staff when weekly check-in is complete
     */
    async notifyStaffCheckInComplete(
        staffId: string,
        athleteId: string,
        athleteName: string
    ): Promise<void> {
        await this.sendNotification(
            staffId,
            'CHECKIN_COMPLETE',
            '✅ Check-In Dominical Completado',
            `${athleteName} completó su check-in semanal`,
            {
                priority: 'LOW',
                data: { athleteId },
                actionUrl: `/athlete/${athleteId}`,
            }
        );
    }

    /**
     * Helper: Notify athlete when plan is ready
     */
    async notifyAthletePlanReady(
        athleteId: string,
        weekStart: string
    ): Promise<void> {
        await this.sendNotification(
            athleteId,
            'PLAN_READY',
            '📋 Plan Semanal Generado',
            `Tu plan de entrenamiento para la semana del ${weekStart} está listo`,
            {
                priority: 'MEDIUM',
                data: { weekStart },
                actionUrl: '/planning',
            }
        );
    }

    /**
     * Helper: Notify athlete when plan is approved
     */
    async notifyAthletePlanApproved(
        athleteId: string,
        coachName: string,
        weekStart: string
    ): Promise<void> {
        await this.sendNotification(
            athleteId,
            'PLAN_APPROVED',
            '✅ Plan Aprobado',
            `${coachName} aprobó tu plan de entrenamiento para la semana del ${weekStart}`,
            {
                priority: 'MEDIUM',
                data: { weekStart },
                actionUrl: '/planning',
            }
        );
    }

    /**
     * Helper: Notify athlete when plan is rejected
     */
    async notifyAthletePlanRejected(
        athleteId: string,
        coachName: string,
        reason: string,
        weekStart: string
    ): Promise<void> {
        await this.sendNotification(
            athleteId,
            'PLAN_REJECTED',
            '❌ Plan Requiere Ajustes',
            `${coachName} solicitó cambios en tu plan: ${reason}`,
            {
                priority: 'HIGH',
                data: { weekStart, reason },
                actionUrl: '/planning',
            }
        );
    }

    /**
     * Helper: Notify athlete when coach provides feedback on a video
     */
    async notifyAthleteNewFeedback(
        athleteId: string,
        coachName: string,
        videoId: string
    ): Promise<void> {
        await this.sendNotification(
            athleteId,
            'CHAT_MESSAGE',
            '🎨 Nuevo Feedback de Video',
            `${coachName} revisó tu video y añadió comentarios técnicos`,
            {
                priority: 'MEDIUM',
                data: { videoId },
                actionUrl: `/video-analysis`,
            }
        );
    }
}

export const notificationService = new NotificationService();
