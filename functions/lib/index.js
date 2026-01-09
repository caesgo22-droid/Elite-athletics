"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = exports.unlinkStaff = exports.respondToLinkRequest = exports.sendLinkRequest = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const linkRequests_1 = require("./linkRequests");
Object.defineProperty(exports, "sendLinkRequest", { enumerable: true, get: function () { return linkRequests_1.sendLinkRequest; } });
Object.defineProperty(exports, "respondToLinkRequest", { enumerable: true, get: function () { return linkRequests_1.respondToLinkRequest; } });
Object.defineProperty(exports, "unlinkStaff", { enumerable: true, get: function () { return linkRequests_1.unlinkStaff; } });
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase! Professional Mode Active.");
});
//# sourceMappingURL=index.js.map