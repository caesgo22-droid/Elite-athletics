import React, { useState, useEffect, useRef } from 'react';
import { notificationService, Notification } from '../../services/NotificationService';
import NotificationList from './NotificationList';

interface NotificationBellProps {
    userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const lastNotifIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!userId) {
            console.warn('[NotificationBell] No userId provided');
            return;
        }

        console.log('[NotificationBell] Subscribing to notifications for user:', userId);

        // Subscribe to real-time notifications
        const unsubscribe = notificationService.subscribeToNotifications(
            userId,
            (newNotifications) => {
                console.log('[NotificationBell] Received snapshot:', newNotifications.length, 'notifications');
                setNotifications(newNotifications);

                const unread = newNotifications.filter((n) => !n.read);
                setUnreadCount(unread.length);

                // Toast Logic: If there's a new unread notification that we haven't toasted yet
                if (unread.length > 0) {
                    const newest = unread[0];
                    if (newest.id !== lastNotifIdRef.current) {
                        lastNotifIdRef.current = newest.id;

                        // Emit global feedback via EventBus
                        import('../../services/CoreArchitecture').then(({ EventBus }) => {
                            EventBus.publish('UI_FEEDBACK', {
                                message: `🔔 ${newest.title}: ${newest.message.substring(0, 40)}${newest.message.length > 40 ? '...' : ''}`,
                                type: 'info'
                            });
                        });
                    }
                }
            }
        );

        return () => {
            console.log('[NotificationBell] Unsubscribing from notifications');
            unsubscribe();
        };
    }, [userId]);

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead(userId);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative size-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
                title="Notificaciones"
            >
                <span className="material-symbols-outlined text-white text-lg group-hover:scale-110 transition-transform">
                    notifications
                </span>

                {/* Badge */}
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 size-5 bg-danger rounded-full flex items-center justify-center shadow-glow-danger">
                        <span className="text-white text-[10px] font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </div>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Notification Panel */}
                    <div className="absolute right-0 top-12 z-50 w-[380px] max-h-[500px] bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                        {/* Header */}
                        <div className="bg-black/40 border-b border-white/5 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-volt text-base">notifications_active</span>
                                <h3 className="text-white font-bold text-sm">Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] text-slate-500">
                                        ({unreadCount} nuevas)
                                    </span>
                                )}
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-[10px] text-volt hover:text-volt/80 font-bold uppercase tracking-wider"
                                >
                                    Marcar todas
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <NotificationList
                            notifications={notifications}
                            onClose={() => setIsOpen(false)}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
