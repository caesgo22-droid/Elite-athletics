import { IDataProcessor, ProcessorResult } from './IDataProcessor';
import { Athlete, PendingLinkRequest, LinkRequest } from '../../types';

export class LinkRequestProcessor implements IDataProcessor {
    type = 'LINK_REQUEST';

    async process(payload: any, athlete: Athlete): Promise<ProcessorResult> {
        let updatedAthlete = { ...athlete };
        let eventType = '';

        switch (payload.action) {
            case 'SEND_LINK_REQUEST':
                // In a real backend, this would create a LinkRequest document.
                // Here in the DataRing context (Client-Side Simulation/Optimistic UI),
                // we update the athlete's local state if applicable (e.g. if athlete initiated it).
                updatedAthlete = this.handleSendRequest(payload.request, updatedAthlete);
                eventType = 'LINK_REQUEST_SENT';
                break;
            case 'ACCEPT_LINK_REQUEST':
                updatedAthlete = this.handleAccept(payload, updatedAthlete);
                eventType = 'LINK_REQUEST_ACCEPTED';
                break;
            case 'REJECT_LINK_REQUEST':
                updatedAthlete = this.handleReject(payload, updatedAthlete);
                eventType = 'LINK_REQUEST_REJECTED';
                break;
            case 'UNLINK':
                updatedAthlete = this.handleUnlink(payload, updatedAthlete);
                eventType = 'UNLINKED';
                break;
            default:
                // Legacy support
                if (payload.action === 'CREATE') return this.process({ ...payload, action: 'SEND_LINK_REQUEST' }, athlete);
                if (payload.action === 'ACCEPT') return this.process({ ...payload, action: 'ACCEPT_LINK_REQUEST' }, athlete);
                if (payload.action === 'REJECT') return this.process({ ...payload, action: 'REJECT_LINK_REQUEST' }, athlete);
        }

        return {
            updated: updatedAthlete,
            eventType: eventType,
            eventData: payload
        };
    }

    private handleSendRequest(request: LinkRequest, athlete: Athlete): Athlete {
        // Only relevant if the athlete is the one sending or receiving in a way that affects their profile immediately
        // For simplicity, we track all relevant requests on the athlete profile
        const currentRequests = athlete.pendingLinkRequests || [];
        if (!currentRequests.find(r => r.id === request.id)) {
            // Cast to PendingLinkRequest compat
            const compatRequest = request as unknown as PendingLinkRequest;
            return {
                ...athlete,
                pendingLinkRequests: [...currentRequests, compatRequest]
            };
        }
        return athlete;
    }

    private handleAccept(data: { requestId: string, staffMember: any }, athlete: Athlete): Athlete {
        const requests = athlete.pendingLinkRequests || [];

        // 1. Update Request Status
        const newRequests = requests.map(r =>
            r.id === data.requestId ? { ...r, status: 'ACCEPTED' as const } : r
        );

        // 2. Add to Assigned Staff (Squad)
        let newAssignedStaff = [...(athlete.assignedStaff || [])];
        if (!newAssignedStaff.find(s => s.id === data.staffMember.uid)) {
            newAssignedStaff.push({
                id: data.staffMember.uid,
                name: data.staffMember.displayName || data.staffMember.email,
                role: data.staffMember.role || 'Coach'
            });
        }

        // Legacy 'staff' array support
        // let newStaff = [...(athlete.staff || [])]; ... (omitted for cleaner RBAC pivot)

        return {
            ...athlete,
            pendingLinkRequests: newRequests,
            assignedStaff: newAssignedStaff
        };
    }

    private handleReject(data: { requestId: string }, athlete: Athlete): Athlete {
        const requests = athlete.pendingLinkRequests || [];
        const newRequests = requests.map(r =>
            r.id === data.requestId ? { ...r, status: 'REJECTED' as const } : r
        );
        return { ...athlete, pendingLinkRequests: newRequests };
    }

    private handleUnlink(data: { staffId: string }, athlete: Athlete): Athlete {
        // Remove from assignedStaff
        const newAssignedStaff = (athlete.assignedStaff || []).filter(s => s.id !== data.staffId);
        return {
            ...athlete,
            assignedStaff: newAssignedStaff
        };
    }
}
