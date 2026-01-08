import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataRing } from './CoreArchitecture'; // Use the DataRing Singleton
import { StorageSatellite } from './satellites/StorageSatellite';
import { OmniContext, WeeklyPlan, TrainingPhase } from '../types';

// Mock Dependencies
vi.mock('./satellites/StorageSatellite', () => ({
    StorageSatellite: {
        getWeeklyPlan: vi.fn(),
        updateWeeklyPlan: vi.fn(),
        getAthlete: vi.fn(),
        saveMacrocycle: vi.fn(),
        getMacrocycle: vi.fn().mockResolvedValue({}), // Added this
        getAllAthletes: vi.fn().mockResolvedValue([{ id: 'ath1', name: 'Tester', videoHistory: [], stats: [] }]),
        getAllWeeklyPlans: vi.fn().mockResolvedValue([])
    }
}));

// Mock AI Agents
vi.mock('../ai/agents', () => ({
    generateEliteTrainingPlan: vi.fn().mockResolvedValue({
        id: 'new_plan_1',
        athleteId: 'ath1',
        trainingPhase: 'General Preparation' as TrainingPhase,
        sessions: [],
        weeklyVolume: 0,
        goals: []
    } as WeeklyPlan),
    chatWithBrain: vi.fn()
}));

// Mock EventBus
vi.mock('./EventBus', () => ({
    EventBus: {
        publish: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn()
    }
}));

// Mock MemorySatellite
vi.mock('./satellites/MemorySatellite', () => ({
    MemorySatellite: {
        getRelevantMemories: vi.fn().mockReturnValue([]),
        consolidateMemory: vi.fn(),
        getLongTermMemory: vi.fn().mockResolvedValue([]) // Added this
    }
}));

import { generateEliteTrainingPlan } from '../ai/agents';

describe('CoreArchitecture - Plan Generation', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Since DataRing is a singleton initialized at module level, 
        // we rely on mocks being swapped. Vitest handles module mocking well.
    });

    it('regeneratePlan calls AI and updates Storage', async () => {
        // Setup State
        const mockAthlete = { id: 'ath1', name: 'Tester', videoHistory: [], statsHistory: [] };

        // Mock Storage responses for 'getOmniContextWithMemory'
        (StorageSatellite.getAthlete as any).mockResolvedValue(mockAthlete);
        (StorageSatellite.getWeeklyPlan as any).mockResolvedValue({ sessions: [] });
        (StorageSatellite.getAllAthletes as any).mockResolvedValue([mockAthlete]); // Explicit override

        // PRIME CACHE! (Important because DataRing is singleton)
        // We need to ensure local cache has the athlete and plan
        await DataRing.refreshCache('ath1');

        // Act
        await DataRing.regeneratePlan('ath1', 'Specific Preparation' as TrainingPhase);

        // Assert
        // 1. AI was called
        expect(generateEliteTrainingPlan).toHaveBeenCalled();

        // 2. Storage was updated with the "new plan" returned by mock
        expect(StorageSatellite.updateWeeklyPlan).toHaveBeenCalledWith(expect.objectContaining({
            id: 'new_plan_1'
        }));
    });
});
