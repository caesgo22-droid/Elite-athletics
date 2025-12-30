import { VideoAnalysisEntry } from '../../types';

export class TrendAnalyzer {

    /**
     * Propósito: Detectar regresión técnica antes de que cause una lesión.
     * Lógica: Analiza los últimos N videos para encontrar la pendiente de mejora.
     */
    static analyzeTechnicalTrend(history: VideoAnalysisEntry[]): { trend: 'IMPROVING' | 'STAGNANT' | 'REGRESSING', summary: string } {
        if (!history || history.length < 2) {
            return { trend: 'STAGNANT', summary: 'Insuficientes datos para tendencia.' };
        }

        // 1. Sort by date (oldest first)
        const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 2. Take last 5 entries max
        const recent = sorted.slice(-5);

        // 3. Calculate Scores
        const scores = recent.map(v => v.score);

        // 4. Simple Linear Regression Slope
        // x = 0, 1, 2...
        // y = score
        const n = scores.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += scores[i];
            sumXY += i * scores[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const lastScore = scores[n - 1];
        const prevScore = scores[n - 2];

        // 5. Determine Trend
        let trend: 'IMPROVING' | 'STAGNANT' | 'REGRESSING' = 'STAGNANT';
        if (slope > 2) trend = 'IMPROVING';
        else if (slope < -2) trend = 'REGRESSING';

        // 6. Generate Contextual Summary
        let summary = `Tendencia estable (${slope.toFixed(1)}).`;
        if (trend === 'IMPROVING') summary = `🔥 Mejora constante (+${slope.toFixed(1)}/sesión). Último score: ${lastScore}.`;
        if (trend === 'REGRESSING') summary = `⚠️ Regresión Técnica detectada (${slope.toFixed(1)}). Último score: ${lastScore} (vs ${prevScore}).`;

        return { trend, summary };
    }
}
