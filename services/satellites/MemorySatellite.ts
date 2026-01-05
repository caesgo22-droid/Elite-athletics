import { WeeklySummary } from '../../types';
import { logger } from '../Logger';

export class MemorySatellite {
    private static readonly STORAGE_KEY_PREFIX = 'elite_memory_';

    static async getLongTermMemory(athleteId: string, weeks: number = 4): Promise<WeeklySummary[]> {
        try {
            // Simulate API latency
            await new Promise(resolve => setTimeout(resolve, 300));

            const key = `${this.STORAGE_KEY_PREFIX}${athleteId}`;
            const raw = localStorage.getItem(key);
            if (!raw) return this.generateMockMemory(athleteId); // Fallback for demo

            const allHistory: WeeklySummary[] = JSON.parse(raw);
            // Return sorted by date descending, limit to N weeks
            return allHistory
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                .slice(0, weeks);
        } catch (e) {
            console.error('Error fetching memory:', e);
            return [];
        }
    }

    static async saveWeeklySummary(athleteId: string, summary: WeeklySummary): Promise<void> {
        const key = `${this.STORAGE_KEY_PREFIX}${athleteId}`;
        const raw = localStorage.getItem(key);
        const history: WeeklySummary[] = raw ? JSON.parse(raw) : [];

        // Check if summary for this week already exists, update or push
        const index = history.findIndex(h => h.id === summary.id);
        if (index >= 0) {
            history[index] = summary;
        } else {
            history.push(summary);
        }

        localStorage.setItem(key, JSON.stringify(history));
        logger.log(`[MEMORY] Saved summary for ${summary.id}`);
    }

    // Generate some realistic past data so the AI has something to work with immediately
    private static generateMockMemory(athleteId: string): WeeklySummary[] {
        const memories: WeeklySummary[] = [
            {
                id: '2025-CW03',
                weekNumber: 3,
                startDate: '2025-01-13',
                endDate: '2025-01-19',
                trainingPhase: 'PRE_SEASON', // Was SPECIFIC_PREP
                avgSleep: 7.2,
                avgRpe: 6.5,
                totalVolumeLoad: 850,
                keyAchievement: "Maintained velocity under fatigue.",
                primaryStruggle: "Sleep quality dropped on Tuesday/Wednesday.",
                adaptationFocus: "Speed Endurance"
            },
            {
                id: '2025-CW02',
                weekNumber: 2,
                startDate: '2025-01-06',
                endDate: '2025-01-12',
                trainingPhase: 'PRE_SEASON', // Was GENERAL_PREP
                avgSleep: 8.1,
                avgRpe: 5.0,
                totalVolumeLoad: 1200,
                keyAchievement: "High volume successfully absorbed.",
                primaryStruggle: "None reporting.",
                adaptationFocus: "Aerobic Capacity"
            }
        ];
        // Persist mocks so we can edit them later
        localStorage.setItem(`${this.STORAGE_KEY_PREFIX}${athleteId}`, JSON.stringify(memories));
        return memories;
    }
}
