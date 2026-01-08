"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToLinkRequest = exports.sendLinkRequest = void 0;
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
        // Notify (Optional: Create Notification doc)
        // await db.collection('notifications').add({ ... })
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
//# sourceMappingURL=linkRequests.js.map