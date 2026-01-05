import React from 'react';
import { Notification } from '../../services/NotificationService';
import NotificationItem from './NotificationItem';

interface NotificationListProps {
    notifications: Notification[];
    onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, onClose }) => {
    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="size-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-600 text-2xl">notifications_off</span>
                </div>
                <p className="text-slate-500 text-sm font-bold">No hay notificaciones</p>
                <p className="text-slate-600 text-[10px] mt-1">Te avisaremos cuando haya novedades</p>
            </div>
        );
    }

    return (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={onClose}
                />
            ))}
        </div>
    );
};

export default NotificationList;
