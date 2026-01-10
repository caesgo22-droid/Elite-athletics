/**
 * ACWR (Acute:Chronic Workload Ratio) Utility
 * 
 * Formula: Acute Load (last 7 days average) / Chronic Load (last 28 days average)
 * Ideal range: 0.8 - 1.3
 * Danger zone: > 1.5 (High injury risk)
 */

export const ACWRCalculator = {
    /**
     * Calculates ACWR based on a series of daily loads (RPE * Duration or just RPE factor)
     * @param loads Array of daily load values (ordered from oldest to newest)
     */
    calculate(loads: number[]): number {
        if (!loads || loads.length === 0) return 1.0;

        // Current acute window (last 7 entries)
        const acuteWindow = loads.slice(-7);
        const acuteLoad = acuteWindow.length > 0
            ? acuteWindow.reduce((a, b) => a + b, 0) / acuteWindow.length
            : 0;

        // Chronic window (last 28 entries)
        const chronicWindow = loads.slice(-28);
        const chronicLoad = chronicWindow.length > 0
            ? chronicWindow.reduce((a, b) => a + b, 0) / chronicWindow.length
            : 0;

        if (chronicLoad === 0) return acuteLoad > 0 ? 2.0 : 1.0;

        const ratio = acuteLoad / chronicLoad;

        // Capping to reasonable display range
        return parseFloat(Math.min(3.0, ratio).toFixed(2));
    }
};
