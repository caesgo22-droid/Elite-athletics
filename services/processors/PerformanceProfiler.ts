import { Athlete, StatEntry } from '../../types';

export type AthleteLevel = 'ROOKIE' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE' | 'WORLD_CLASS';

interface Benchmark {
    event: string;
    gender: 'M' | 'F';
    eliteStandard: number; // e.g., 10.00s for 100m
    worldClassStandard: number; // e.g. 9.85s
}

// Simplified Benchmarks (Male)
const BENCHMARKS: Benchmark[] = [
    { event: '100m', gender: 'M', eliteStandard: 10.20, worldClassStandard: 9.95 },
    { event: '200m', gender: 'M', eliteStandard: 20.50, worldClassStandard: 19.90 },
    { event: '400m', gender: 'M', eliteStandard: 45.50, worldClassStandard: 44.20 }
];

export const PerformanceProfiler = {

    determineLevel(athlete: Athlete): AthleteLevel {
        // 1. Basic Age/Experience Filter
        if (athlete.age < 16) return 'ROOKIE';
        if (athlete.experienceYears < 2) return 'ROOKIE';

        // 2. Performance Analysis based on PBs
        const bestEvent = this.findBestEvent(athlete.statsHistory);
        if (!bestEvent) return 'INTERMEDIATE'; // Default if no data

        const benchmark = BENCHMARKS.find(b => b.event === bestEvent.event); // Assume Male for now
        if (!benchmark) return 'INTERMEDIATE'; // No benchmark found

        const val = bestEvent.value;

        // Logic for TIMED events (Lower is better)
        if (val <= benchmark.worldClassStandard) return 'WORLD_CLASS';
        if (val <= benchmark.eliteStandard) return 'ELITE';
        if (val <= benchmark.eliteStandard * 1.05) return 'ADVANCED'; // Within 5% of Elite
        if (val <= benchmark.eliteStandard * 1.15) return 'INTERMEDIATE'; // Within 15%

        return 'ROOKIE';
    },

    findBestEvent(stats: StatEntry[]): StatEntry | null {
        // Find the PB for the highest priority event
        // Ideally we know the 'Target Event', but we scan for known sprints
        const sprintEvents = ['100m', '200m', '400m'];
        const pbs = stats.filter(s => s.isPB && sprintEvents.includes(s.event));

        if (pbs.length === 0) return null;

        // Return the one closest to elite (simplified: just return first found or 100m)
        return pbs.find(s => s.event === '100m') || pbs[0];
    },

    getGapAnalysis(athlete: Athlete): string {
        const level = this.determineLevel(athlete);
        const best = this.findBestEvent(athlete.statsHistory);

        if (!best) return "Sin datos suficientes para perfilar.";

        const benchmark = BENCHMARKS.find(b => b.event === best.event);
        if (!benchmark) return `Nivel estimado: ${level}`;

        const gap = ((best.value - benchmark.eliteStandard) / benchmark.eliteStandard) * 100;

        if (gap > 0) {
            return `Nivel: ${level}. ${gap.toFixed(1)}% más lento que el estándar Élite (${benchmark.eliteStandard}s).`;
        } else {
            return `Nivel: ${level}. Supera el estándar Élite por ${Math.abs(gap).toFixed(1)}%.`;
        }
    }
};
