"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPlanGenerated = exports.onNewChatMessage = exports.onNewVideoUpload = exports.onHighPainReport = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
/**
 * Cloud Function: onHighPainReport
 * Triggered when a high pain report is detected
 */
exports.onHighPainReport = (0, firestore_1.onDocumentCreated)('athletes/{athleteId}/healthData/{docId}', async (event) => {
    var _a, _b, _c;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const athleteId = event.params.athleteId;
    if (!data)
        return;
    // Check if pain level is high (>= 7)
    if (data.painLevel && data.painLevel >= 7) {
        console.log(`High pain detected for athlete ${athleteId}: ${data.painLevel}`);
        // Get athlete data
        const athleteDoc = await admin.firestore().collection('athletes').doc(athleteId).get();
        const athlete = athleteDoc.data();
        if (!athlete) {
            console.error(`Athlete ${athleteId} not found`);
            return;
        }
        // Get staff ID (first staff member)
        const staffId = ((_c = (_b = athlete.staff) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id) || 'staff_default';
        // Create notification
        await admin.firestore().collection('notifications').add({
            userId: staffId,
            type: 'HIGH_PAIN',
            title: '⚠️ Reporte de Dolor Alto',
            message: `${athlete.name} reportó dolor nivel ${data.painLevel}/10 en ${data.bodyPart || 'zona no especificada'}`,
            athleteId: athleteId,
            athleteName: athlete.name,
            severity: 'HIGH',
            read: false,
            actionUrl: `/athlete/${athleteId}/health`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Notification created for staff ${staffId}`);
    }
});
/**
 * Cloud Function: onNewVideoUpload
 * Triggered when a new video is uploaded
 */
exports.onNewVideoUpload = (0, firestore_1.onDocumentCreated)('athletes/{athleteId}/videos/{videoId}', async (event) => {
    var _a, _b, _c;
    const videoData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const athleteId = event.params.athleteId;
    const videoId = event.params.videoId;
    if (!videoData)
        return;
    console.log(`New video uploaded by athlete ${athleteId}`);
    // Get athlete data
    const athleteDoc = await admin.firestore().collection('athletes').doc(athleteId).get();
    const athlete = athleteDoc.data();
    if (!athlete) {
        console.error(`Athlete ${athleteId} not found`);
        return;
    }
    // Get staff ID
    const staffId = ((_c = (_b = athlete.staff) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id) || 'staff_default';
    // Create notification
    await admin.firestore().collection('notifications').add({
        userId: staffId,
        type: 'NEW_VIDEO',
        title: '🎥 Nuevo Video Subido',
        message: `${athlete.name} subió un nuevo video: ${videoData.exerciseName || 'Análisis de técnica'}`,
        athleteId: athleteId,
        athleteName: athlete.name,
        severity: 'MEDIUM',
        read: false,
        actionUrl: `/video/${videoId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Video notification created for staff ${staffId}`);
});
/**
 * Cloud Function: onNewChatMessage
 * Triggered when a new chat message is sent
 */
exports.onNewChatMessage = (0, firestore_1.onDocumentCreated)('chatRooms/{roomId}/messages/{messageId}', async (event) => {
    var _a;
    const message = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const roomId = event.params.roomId;
    if (!message)
        return;
    console.log(`New message in room ${roomId}`);
    // Get chat room data
    const roomDoc = await admin.firestore().collection('chatRooms').doc(roomId).get();
    const room = roomDoc.data();
    if (!room) {
        console.error(`Chat room ${roomId} not found`);
        return;
    }
    // Find the recipient (the participant who didn't send the message)
    const recipientId = room.participants.find((p) => p !== message.senderId);
    if (!recipientId) {
        console.error('No recipient found');
        return;
    }
    // Create notification for recipient
    await admin.firestore().collection('notifications').add({
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: '💬 Nuevo Mensaje',
        message: `${message.senderName}: ${message.type === 'TEXT' ? message.content : `[${message.type}]`}`,
        severity: 'LOW',
        read: false,
        actionUrl: `/chat/${roomId}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Chat notification created for user ${recipientId}`);
});
/**
 * Cloud Function: onPlanGenerated
 * Triggered when a new training plan is created
 */
exports.onPlanGenerated = (0, firestore_1.onDocumentCreated)('weeklyPlans/{planId}', async (event) => {
    var _a;
    const plan = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!plan)
        return;
    const athleteId = plan.athleteId;
    console.log(`New plan generated for athlete ${athleteId}`);
    // Get athlete data
    const athleteDoc = await admin.firestore().collection('athletes').doc(athleteId).get();
    const athlete = athleteDoc.data();
    if (!athlete) {
        console.error(`Athlete ${athleteId} not found`);
        return;
    }
    // Create notification for athlete
    await admin.firestore().collection('notifications').add({
        userId: athleteId,
        type: 'PLAN_READY',
        title: '📋 Plan de Entrenamiento Listo',
        message: `Tu plan de entrenamiento para la semana está listo. Fase: ${plan.trainingPhase}`,
        severity: 'LOW',
        read: false,
        actionUrl: `/planning`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Plan notification created for athlete ${athleteId}`);
});
//# sourceMappingURL=index.js.map