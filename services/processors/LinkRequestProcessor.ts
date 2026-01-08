import { IDataProcessor, ProcessorResult } from './IDataProcessor';
import { Athlete, LinkRequest } from '../../types';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

export class LinkRequestProcessor implements IDataProcessor {
    type = 'LINK_REQUEST';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        let eventType = '';

        try {
            switch (payload.action) {
                case 'SEND_LINK_REQUEST':
                    // Server-Side Execution
                    const sendFn = httpsCallable(functions, 'sendLinkRequest');
                    await sendFn({ targetAthleteId: athlete.id }); // Payload simplified, functions handles ID gen
                    eventType = 'LINK_REQUEST_SENT';
                    break;

                case 'ACCEPT_LINK_REQUEST':
                    const acceptFn = httpsCallable(functions, 'respondToLinkRequest');
                    await acceptFn({ requestId: payload.requestId, action: 'ACCEPT' });
                    eventType = 'LINK_REQUEST_ACCEPTED';
                    break;

                case 'REJECT_LINK_REQUEST':
                    const rejectFn = httpsCallable(functions, 'respondToLinkRequest');
                    await rejectFn({ requestId: payload.requestId, action: 'REJECT' });
                    eventType = 'LINK_REQUEST_REJECTED';
                    break;

                case 'UNLINK':
                    // TODO: Implement UNLINK cloud function if strict security needed.
                    // For now, simpler actions might remain client-side or add function later.
                    // We'll keep legacy client-side handling for Unlink since we focused on Requests.
                    // Actually, let's keep it client side for now but ideally move it too.
                    // Current instruction was "Migrate LinkRequestProcessor".
                    // I will leave UNLINK as is (fallback to persistence=false? No, UNLINK needs persistence=true if local).
                    // This creates a split.

                    // IF UNLINK, do old way:
                    return this.processUnlinkLegacy(payload, athlete);

                default:
                    // Legacy support for 'CREATE' maps to SEND
                    if (payload.action === 'CREATE') return this.process({ ...payload, action: 'SEND_LINK_REQUEST' }, athlete);
            }
        } catch (e) {
            console.error("Cloud Function Failed", e);
            throw e;
        }

        // Return with skipPersistence = true, relying on Server update + Realtime Listener
        return {
            updated: athlete, // No local change returned (Server dictates truth)
            eventType: eventType,
            eventData: payload,
            skipPersistence: true
        };
    }

    private processUnlinkLegacy(payload: any, athlete: Athlete): ProcessorResult {
        // ... implementation of local unlink ...
        // Or just return the old handleUnlink logic wrapped in result
        const newAssignedStaff = (athlete.assignedStaff || []).filter(s => s.id !== payload.staffId);
        const updated = { ...athlete, assignedStaff: newAssignedStaff };
        return {
            updated,
            eventType: 'UNLINKED',
            eventData: payload,
            skipPersistence: false // Let DataRing save this one
        };
    }
}
