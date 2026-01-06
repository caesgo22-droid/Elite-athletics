import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Badge } from './common/Atomic';

interface Activity {
    id: string;
    type: 'video' | 'plan' | 'message' | 'approval' | 'injury' | 'therapy';
    athleteId: string;
    athleteName: string;
    title: string;
    description: string;
    timestamp: Date;
    metadata?: any;
}

interface ActivityFeedProps {
    userId?: string;
    userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN';
    athleteFilter?: string; // For coaches to filter by athlete
    limit?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
    userId,
    userRole = 'ATHLETE',
    athleteFilter,
    limit: activityLimit = 10
}) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        if (!userId) return;

        setLoading(true);

        // Build query based on role
        let q;
        if (userRole === 'STAFF' || userRole === 'ADMIN') {
            // Coaches see all activities, optionally filtered by athlete
            q = athleteFilter
                ? query(
                    collection(db, 'activities'),
                    where('athleteId', '==', athleteFilter),
                    orderBy('timestamp', 'desc'),
                    limit(activityLimit)
                )
                : query(
                    collection(db, 'activities'),
                    orderBy('timestamp', 'desc'),
                    limit(activityLimit)
                );
        } else {
            // Athletes see only their activities
            q = query(
                collection(db, 'activities'),
                where('athleteId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(activityLimit)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const acts: Activity[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                acts.push({
                    id: doc.id,
                    type: data.type,
                    athleteId: data.athleteId,
                    athleteName: data.athleteName,
                    title: data.title,
                    description: data.description,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    metadata: data.metadata
                });
            });
            setActivities(acts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, userRole, athleteFilter, activityLimit]);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'video': return 'videocam';
            case 'plan': return 'event_note';
            case 'message': return 'chat';
            case 'approval': return 'check_circle';
            case 'injury': return 'healing';
            case 'therapy': return 'spa';
            default: return 'notifications';
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'video': return 'text-primary';
            case 'plan': return 'text-volt';
            case 'message': return 'text-info';
            case 'approval': return 'text-success';
            case 'injury': return 'text-danger';
            case 'therapy': return 'text-warning';
            default: return 'text-slate-400';
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days}d`;
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    if (loading) {
        return (
            <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-center py-8">
                    <span className="material-symbols-outlined text-slate-600 text-3xl animate-spin">refresh</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-4 lg:p-6 rounded-2xl border-white/5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-volt text-xl">timeline</span>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider">Actividad Reciente</h3>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${filter === 'all'
                                ? 'bg-volt text-black'
                                : 'bg-white/5 text-slate-500 hover:text-white'
                            }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('video')}
                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${filter === 'video'
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-slate-500 hover:text-white'
                            }`}
                    >
                        Video
                    </button>
                    <button
                        onClick={() => setFilter('plan')}
                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${filter === 'plan'
                                ? 'bg-volt text-black'
                                : 'bg-white/5 text-slate-500 hover:text-white'
                            }`}
                    >
                        Plan
                    </button>
                </div>
            </div>

            {/* Activity List */}
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {filteredActivities.length === 0 ? (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-slate-600 text-3xl mb-2">history</span>
                        <p className="text-slate-500 text-xs">No hay actividad reciente</p>
                    </div>
                ) : (
                    filteredActivities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 transition-all group"
                        >
                            {/* Icon */}
                            <div className={`size-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                                <span className="material-symbols-outlined text-sm">
                                    {getActivityIcon(activity.type)}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="text-white text-xs font-bold leading-tight">
                                        {activity.title}
                                    </h4>
                                    <span className="text-[9px] text-slate-600 font-mono shrink-0">
                                        {formatTimestamp(activity.timestamp)}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-2">
                                    {activity.description}
                                </p>
                                {(userRole === 'STAFF' || userRole === 'ADMIN') && (
                                    <Badge variant="outline" className="mt-1 text-[8px]">
                                        {activity.athleteName}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* View All Link */}
            {filteredActivities.length > 0 && (
                <button className="w-full text-center text-[9px] text-slate-500 hover:text-volt uppercase tracking-wider font-bold transition-colors">
                    Ver todo el historial →
                </button>
            )}
        </div>
    );
};

export default ActivityFeed;
