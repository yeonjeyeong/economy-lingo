import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
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

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators only in development environment
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Prevent multiple connections during hot reload
    // @ts-ignore
    if (!auth.emulatorConfig) {
        // connectAuthEmulator(auth, "http://localhost:9099"); // Disable Auth Emulator for real Google Login
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firestore Emulator (Auth is real)');
    }
}

export default app;
