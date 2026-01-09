"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlinkStaff = exports.respondToLinkRequest = exports.sendLinkRequest = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
// Helper to get DB (admin must be initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Sends a Link Request from a Staff member to an Athlete.
 * @param request.data { targetAthleteId: string }
 */
exports.sendLinkRequest = (0, https_1.onCall)(async (request) => {
    // 1. Auth Check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be logged in.');
    }
    // 2. Validate Staff Role (Optional: strict check via Custom Claims or DB lookup)
    // For MVP, we trust the caller is staff, but better to check DB.
    const senderId = request.auth.uid;
    const senderEmail = request.auth.token.email || 'unknown';
    const senderName = request.auth.token.name || senderEmail;
    const { targetAthleteId } = request.data;
    if (!targetAthleteId) {
        throw new https_1.HttpsError('invalid-argument', 'Target Athlete ID required.');
    }
    try {
        const athleteRef = db.collection('athletes').doc(targetAthleteId);
        const athleteDoc = await athleteRef.get();
        if (!athleteDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Athlete not found.');
        }
        const athleteData = athleteDoc.data() || {};
        const currentRequests = athleteData.pendingLinkRequests || [];
        // Check for duplicate
        const existing = currentRequests.find((r) => r.fromUserId === senderId && r.status === 'PENDING');
        if (existing) {
            return { success: false, message: 'Request already pending.' };
        }
        const newRequest = {
            id: `req_${Date.now()}_${senderId}`,
            fromUserId: senderId,
            fromName: senderName,
            fromEmail: senderEmail,
            fromRole: 'STAFF',
            status: 'PENDING',
            sentAt: new Date().toISOString()
        };
        // Atomically update
        await athleteRef.update({
            pendingLinkRequests: firestore_1.FieldValue.arrayUnion(newRequest)
        });
        // Send notification to athlete
        await db.collection('notifications').add({
            userId: targetAthleteId,
            type: 'LINK_REQUEST',
            title: 'Nueva solicitud de vinculación',
            message: `${senderName} quiere conectarse contigo como entrenador`,
            priority: 'MEDIUM',
            actionUrl: '/profile',
            timestamp: new Date().toISOString(),
            read: false,
            data: {
                requestId: newRequest.id,
                staffId: senderId,
                staffName: senderName
            }
        });
        return { success: true, requestId: newRequest.id };
    }
    catch (error) {
        console.error("Error sending link request:", error);
        throw new https_1.HttpsError('internal', 'Database error.');
    }
});
/**
 * Responds to a Link Request (Accept/Reject).
 * Called by the Athlete.
 * @param request.data { requestId: string, action: 'ACCEPT' | 'REJECT' }
 */
exports.respondToLinkRequest = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { requestId, action } = request.data;
    const athleteId = request.auth.uid; // The actor is the athlete
    if (!['ACCEPT', 'REJECT'].includes(action)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid action.');
    }
    const athleteRef = db.collection('athletes').doc(athleteId);
    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(athleteRef);
            if (!doc.exists)
                throw new https_1.HttpsError('not-found', 'Profile not found.');
            const athleteData = doc.data() || {};
            const requests = athleteData.pendingLinkRequests || [];
            const targetRequestIndex = requests.findIndex((r) => r.id === requestId);
            if (targetRequestIndex === -1) {
                throw new https_1.HttpsError('not-found', 'Request not found.');
            }
            const req = requests[targetRequestIndex];
            // Update Status
            const updatedRequests = [...requests];
            updatedRequests[targetRequestIndex] = Object.assign(Object.assign({}, req), { status: action, respondedAt: new Date().toISOString() });
            const updates = { pendingLinkRequests: updatedRequests };
            // If Accepted, add to Assigned Staff
            if (action === 'ACCEPT') {
                // Prevent duplicate staff
                const assignedStaff = athleteData.assignedStaff || [];
                const alreadyAssigned = assignedStaff.find((s) => s.id === req.fromUserId);
                if (!alreadyAssigned) {
                    updates.assignedStaff = firestore_1.FieldValue.arrayUnion({
                        id: req.fromUserId,
                        name: req.fromName,
                        role: req.fromRole || 'Coach'
                    });
                }
            }
            t.update(athleteRef, updates);
        });
        return { success: true, action };
    }
    catch (error) {
        console.error("Error responding to request:", error);
        throw new https_1.HttpsError('internal', 'Transaction failed.');
    }
});
/**
 * Unlinks a staff member from an athlete.
 * Can be called by either the staff member or the athlete.
 * @param request.data { athleteId: string, staffId: string }
 */
exports.unlinkStaff = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const { athleteId, staffId } = request.data;
    if (!athleteId || !staffId) {
        throw new https_1.HttpsError('invalid-argument', 'Both athleteId and staffId are required.');
    }
    const callerId = request.auth.uid;
    // Verify caller is either the athlete or the staff member
    if (callerId !== athleteId && callerId !== staffId) {
        throw new https_1.HttpsError('permission-denied', 'You can only unlink yourself from a relationship.');
    }
    try {
        const athleteRef = db.collection('athletes').doc(athleteId);
        await db.runTransaction(async (t) => {
            const doc = await t.get(athleteRef);
            if (!doc.exists) {
                throw new https_1.HttpsError('not-found', 'Athlete profile not found.');
            }
            const athleteData = doc.data() || {};
            const assignedStaff = athleteData.assignedStaff || [];
            // Check if the staff is actually assigned
            const staffExists = assignedStaff.find((s) => s.id === staffId);
            if (!staffExists) {
                throw new https_1.HttpsError('not-found', 'Staff member is not linked to this athlete.');
            }
            // Remove the staff member
            const updatedStaff = assignedStaff.filter((s) => s.id !== staffId);
            t.update(athleteRef, { assignedStaff: updatedStaff });
        });
        console.log(`[UNLINK] Staff ${staffId} unlinked from athlete ${athleteId} by ${callerId}`);
        return { success: true };
    }
    catch (error) {
        console.error("Error unlinking staff:", error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Transaction failed.');
    }
});
//# sourceMappingURL=linkRequests.js.map