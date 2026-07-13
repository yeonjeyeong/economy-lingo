import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Firebase SDK objects are exported even in an unconfigured local checkout so
// public, guest-friendly pages can still render. Network-backed features check
// `isFirebaseConfigured` before using them.
const runtimeConfig = isFirebaseConfigured
    ? firebaseConfig
    : {
        apiKey: 'local-demo-key',
        authDomain: 'localhost',
        projectId: 'economy-lingo-local',
        appId: 'local-demo-app'
    };

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(runtimeConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators only in development environment
if (
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' &&
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
) {
    const globalWithEmulator = globalThis as typeof globalThis & {
        __economyLingoFirestoreEmulator?: boolean;
    };
    if (!globalWithEmulator.__economyLingoFirestoreEmulator) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        globalWithEmulator.__economyLingoFirestoreEmulator = true;
        console.log('Connected to Firestore Emulator (Auth is real)');
    }
}

export default app;
