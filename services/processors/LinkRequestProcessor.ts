import { IDataProcessor, ProcessorResult } from './IDataProcessor';
import { Athlete, PendingLinkRequest } from '../../types';

export class LinkRequestProcessor implements IDataProcessor {
    type = 'LINK_REQUEST';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        let updatedAthlete = { ...athlete };
        let eventType = '';

        if (payload.action === 'CREATE') {
            updatedAthlete = this.handleCreate(payload.request, updatedAthlete);
            eventType = 'LINK_REQUEST_CREATED';
        } else if (payload.action === 'ACCEPT') {
            updatedAthlete = this.handleAccept(payload, updatedAthlete);
            eventType = 'LINK_REQUEST_ACCEPTED';
        } else if (payload.action === 'REJECT') {
            updatedAthlete = this.handleReject(payload, updatedAthlete);
            eventType = 'LINK_REQUEST_REJECTED';
        }

        return {
            updated: updatedAthlete,
            eventType: eventType,
            eventData: payload
        };
    }

    private handleCreate(request: PendingLinkRequest, athlete: Athlete): Athlete {
        const currentRequests = athlete.pendingLinkRequests || [];
        // Check if same request already exists
        if (!currentRequests.find(r => r.coachId === request.coachId && r.status === 'PENDING')) {
            return {
                ...athlete,
                pendingLinkRequests: [...currentRequests, request]
            };
        }
        return athlete;
    }

    private handleAccept(data: { requestId: string, staffMember: any }, athlete: Athlete): Athlete {
        const requests = athlete.pendingLinkRequests || [];
        const requestIndex = requests.findIndex(r => r.id === data.requestId);

        // Clone arrays to ensure immutability
        let newRequests = [...requests];
        let newStaff = [...(athlete.staff || [])];

        if (requestIndex !== -1) {
            newRequests[requestIndex] = { ...newRequests[requestIndex], status: 'ACCEPTED' };

            // Add to staff if not exists
            if (!newStaff.find(s => s.id === data.staffMember.id)) {
                newStaff.push(data.staffMember);
            }
        }

        return {
            ...athlete,
            pendingLinkRequests: newRequests,
            staff: newStaff
        };
    }

    private handleReject(data: { requestId: string }, athlete: Athlete): Athlete {
        const requests = athlete.pendingLinkRequests || [];
        const requestIndex = requests.findIndex(r => r.id === data.requestId);

        if (requestIndex !== -1) {
            const newRequests = [...requests];
            newRequests[requestIndex] = { ...newRequests[requestIndex], status: 'REJECTED' };
            return { ...athlete, pendingLinkRequests: newRequests };
        }
        return athlete;
    }
}
