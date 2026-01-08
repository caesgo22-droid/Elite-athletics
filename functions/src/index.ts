import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendLinkRequest, respondToLinkRequest } from "./linkRequests";

if (!admin.apps.length) {
    admin.initializeApp();
}

// Export Link Request Functions
export { sendLinkRequest, respondToLinkRequest };

export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase! Professional Mode Active.");
});
