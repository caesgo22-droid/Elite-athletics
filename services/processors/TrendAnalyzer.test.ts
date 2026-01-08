import { describe, it, expect } from 'vitest';
import { TrendAnalyzer } from './TrendAnalyzer';
import { VideoAnalysisEntry } from '../../types';

describe('TrendAnalyzer', () => {
    const createEntry = (date: string, score: number): VideoAnalysisEntry => ({
        id: `vid_${date}`,
        date,
        videoUrl: 'http://test.com/vid.mp4',
        thumbnailUrl: 'http://test.com/thumb.jpg',
        aiAnalysis: {
            phaseAnalysis: {
                acceleration: { score, feedback: [] },
                maxVelocity: { score, feedback: [] },
                speedEndurance: { score, feedback: [] }
            },
            successes: [],
            weaknesses: [],
            correctionPlan: []
        },
        technicalScore: score, // This is what matters
        keyFaults: [],
        score: score,
        aiFeedback: 'Feedback'
    });

    it('identifies IMPROVING trend', () => {
        const history = [
            createEntry('2024-01-01', 60),
            createEntry('2024-01-02', 70),
            createEntry('2024-01-03', 80) // Slope ~10
        ];
        const result = TrendAnalyzer.analyzeTechnicalTrend(history);
        expect(result.trend).toBe('IMPROVING');
        expect(result.summary).toContain('Mejora constante');
    });

    it('identifies REGRESSING trend', () => {
        const history = [
            createEntry('2024-01-01', 80),
            createEntry('2024-01-02', 70),
            createEntry('2024-01-03', 60) // Slope ~-10
        ];
        const result = TrendAnalyzer.analyzeTechnicalTrend(history);
        expect(result.trend).toBe('REGRESSING');
        expect(result.summary).toContain('Regresión Técnica');
    });

    it('identifies STAGNANT trend', () => {
        const history = [
            createEntry('2024-01-01', 70),
            createEntry('2024-01-02', 71),
            createEntry('2024-01-03', 70) // Slope ~0
        ];
        const result = TrendAnalyzer.analyzeTechnicalTrend(history);
        expect(result.trend).toBe('STAGNANT');
        expect(result.summary).toContain('Tendencia estable');
    });

    it('handles insufficient data', () => {
        const history = [createEntry('2024-01-01', 70)];
        const result = TrendAnalyzer.analyzeTechnicalTrend(history);
        expect(result.trend).toBe('STAGNANT');
        expect(result.summary).toContain('Insuficientes datos');
    });
});
