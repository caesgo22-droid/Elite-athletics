import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LinkRequestProcessor } from './LinkRequestProcessor';
import { Athlete } from '../../types';

// Mock Firebase Functions
vi.mock('../firebase', () => ({
    functions: {}
}));
vi.mock('firebase/functions', () => ({
    httpsCallable: vi.fn(() => vi.fn().mockResolvedValue({ data: { success: true } })),
    getFunctions: vi.fn() // Added this
}));

import { httpsCallable } from 'firebase/functions';

describe('LinkRequestProcessor', () => {
    let processor: LinkRequestProcessor;
    let mockAthlete: Athlete;

    beforeEach(() => {
        processor = new LinkRequestProcessor();
        mockAthlete = { id: 'ath1', name: 'Test Athlete', pendingLinkRequests: [] } as any;
        vi.clearAllMocks();
    });

    it('handles SEND_LINK_REQUEST by calling Cloud Function', async () => {
        const payload = { action: 'SEND_LINK_REQUEST' };

        // Mock specific return for sendLinkRequest if needed, 
        // but default mock above is enough to verify call.

        const result = await processor.process(payload, mockAthlete);

        // Verify Function Call
        expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'sendLinkRequest');
        // Verify skipPersistence (Client DB should NOT be touched, Server does it)
        expect(result.skipPersistence).toBe(true);
        expect(result.eventType).toBe('LINK_REQUEST_SENT');
    });

    it('handles ACCEPT_LINK_REQUEST by calling Cloud Function', async () => {
        const payload = { action: 'ACCEPT_LINK_REQUEST', requestId: 'req1' };

        const result = await processor.process(payload, mockAthlete);

        expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'respondToLinkRequest');
        expect(result.skipPersistence).toBe(true);
        expect(result.eventType).toBe('LINK_REQUEST_ACCEPTED');
    });
});
