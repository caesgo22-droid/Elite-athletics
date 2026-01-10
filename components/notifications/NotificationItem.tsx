import React from 'react';
import { Notification, notificationService } from '../../services/NotificationService';
import { EventBus } from '../../services/CoreArchitecture';
import { ViewState } from '../../types';
import { DataRing } from '../../services/CoreArchitecture';

interface NotificationItemProps {
    notification: Notification;
    onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    const handleClick = async () => {
        try {
            // Mark as read
            if (!notification.read) {
                await notificationService.markAsRead(notification.id);
            }

            // Navigate if actionUrl exists
            if (notification.actionUrl) {
                if (notification.actionUrl === '/direct-chat' || notification.actionUrl === '/chat') {
                    EventBus.publish('NAVIGATE', {
                        view: ViewState.DIRECT_CHAT,
                        params: notification.data?.senderId
                    });
                } else if (notification.actionUrl === '/video-analysis') {
                    EventBus.publish('NAVIGATE', {
                        view: ViewState.VIDEO_ANALYSIS,
                        params: notification.data?.videoId
                    });
                } else if (notification.actionUrl.startsWith('/athlete/')) {
                    // Parse athlete ID from /athlete/{id}/...
                    const parts = notification.actionUrl.split('/');
                    const athleteId = parts[2];
                    if (athleteId) {
                        EventBus.publish('NAVIGATE', {
                            view: ViewState.STAFF_ATHLETE_DETAIL,
                            params: athleteId
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[NotificationItem] Error handling click:', error);
        } finally {
            onClose();
        }
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'HIGH_PAIN':
                return { icon: 'crisis_alert', color: 'text-danger' };
            case 'NEW_VIDEO':
                return { icon: 'videocam', color: 'text-volt' };
            case 'CHECKIN_COMPLETE':
                return { icon: 'check_circle', color: 'text-success' };
            case 'PLAN_READY':
                return { icon: 'event_available', color: 'text-primary' };
            case 'PLAN_APPROVED':
                return { icon: 'verified', color: 'text-success' };
            case 'PLAN_REJECTED':
                return { icon: 'cancel', color: 'text-warning' };
            case 'CHAT_MESSAGE':
                return { icon: 'chat', color: 'text-info' };
            default:
                return { icon: 'notifications', color: 'text-slate-400' };
        }
    };

    const getPriorityBorder = () => {
        switch (notification.priority) {
            case 'HIGH':
                return 'border-l-danger';
            case 'MEDIUM':
                return 'border-l-volt';
            case 'LOW':
                return 'border-l-slate-600';
            default:
                return 'border-l-slate-700';
        }
    };

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now.getTime() - notifTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return notifTime.toLocaleDateString();
    };

    const { icon, color } = getIcon();

    return (
        <button
            onClick={handleClick}
            className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-all border-l-2 ${getPriorityBorder()} ${!notification.read ? 'bg-white/[0.02]' : ''
                }`}
        >
            {/* Icon */}
            <div className={`size-9 rounded-lg bg-black/40 flex items-center justify-center shrink-0 ${!notification.read ? 'ring-2 ring-volt/30' : ''
                }`}>
                <span className={`material-symbols-outlined text-base ${color}`}>
                    {icon}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 text-left min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`text-xs font-bold ${!notification.read ? 'text-white' : 'text-slate-300'}`}>
                        <div className="flex items-center gap-2">
                            {notification.title}
                        </div>
                    </h4>
                    {!notification.read && (
                        <div className="size-2 rounded-full bg-volt shrink-0 mt-1" />
                    )}
                </div>

                <p className="text-[11px] text-slate-500 leading-tight mb-1.5">
                    {notification.message}
                </p>

                <span className="text-[9px] text-slate-600 font-mono uppercase tracking-wider">
                    {getTimeAgo(notification.timestamp)}
                </span>
            </div>
        </button>
    );
};

export default NotificationItem;
