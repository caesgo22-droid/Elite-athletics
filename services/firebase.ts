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
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "CONFIG_ERR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "CONFIG_ERR_DOMAIN",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "CONFIG_ERR_PROJECT",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "CONFIG_ERR_BUCKET",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "CONFIG_ERR_SENDER",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "CONFIG_ERR_APPID"
};

// Validar configuración básica para alertar sobre variables de entorno faltantes
if (firebaseConfig.apiKey.startsWith("CONFIG_ERR")) {
    console.error("🔥 [FIREBASE] Critical Error: Missing Firebase Credentials. Ensure VITE_FIREBASE_* env vars are set.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
// Initialize Cloud Functions (Region defaults to us-central1)
import { getFunctions } from 'firebase/functions';
const functions = getFunctions(app);

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

export { app, db, auth, storage, functions };
