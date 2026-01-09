import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendLinkRequest, respondToLinkRequest, unlinkStaff } from "./linkRequests";

if (!admin.apps.length) {
    admin.initializeApp();
}

// Export Link Request Functions
export { sendLinkRequest, respondToLinkRequest, unlinkStaff };

export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase! Professional Mode Active.");
});
