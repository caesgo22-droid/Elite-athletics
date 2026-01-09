import { notificationService } from './services/NotificationService';
import { auth } from './services/firebase';

/**
 * Test script to manually send a notification
 * Run this in the browser console after importing
 */

export async function testNotification() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        console.error('❌ No user logged in');
        return;
    }

    console.log('🔔 Testing notification for user:', currentUser.uid);

    try {
        await notificationService.sendNotification(
            currentUser.uid,
            'CHAT_MESSAGE',
            'Prueba de Notificación',
            'Esta es una notificación de prueba para verificar el sistema',
            {
                priority: 'HIGH',
                actionUrl: '/direct-chat',
                data: { test: true }
            }
        );

        console.log('✅ Notification sent successfully!');
        console.log('Check the NotificationBell component to see if it appears');
    } catch (error) {
        console.error('❌ Error sending notification:', error);
    }
}

// Auto-run on import
if (typeof window !== 'undefined') {
    (window as any).testNotification = testNotification;
    console.log('📝 Test function loaded. Run testNotification() in console to test.');
}
