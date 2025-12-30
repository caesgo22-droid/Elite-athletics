import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * FIREBASE SERVICE INITIALIZATION (v2.0)
 * 
 * Propósito: Proveer acceso centralizado a los servicios de Google Cloud.
 * Las credenciales deben ser proveídas vía variables de entorno VITE_FIREBASE_*.
 */

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "PLACEHOLDER",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "PLACEHOLDER",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "PLACEHOLDER",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "PLACEHOLDER",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "PLACEHOLDER",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "PLACEHOLDER"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Habilitar persistencia offline para el Aro de Datos
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn("Firebase: Múltiples pestañas abiertas, persistencia deshabilitada.");
        } else if (err.code === 'unimplemented') {
            console.warn("Firebase: El navegador no soporta persistencia.");
        }
    });
}

export { app, db, auth, storage };
