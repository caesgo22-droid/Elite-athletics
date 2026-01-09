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
                    const unlinkFn = httpsCallable(functions, 'unlinkStaff');
                    await unlinkFn({
                        athleteId: athlete.id,
                        staffId: payload.staffId
                    });
                    eventType = 'UNLINKED';
                    break;

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
}
