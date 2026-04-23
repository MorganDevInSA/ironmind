import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const EMULATOR_GUARD_KEY = '__ironmindFirebaseEmulatorsConnected';

function shouldUseFirebaseEmulators(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' ||
    process.env.USE_FIREBASE_EMULATORS === 'true'
  );
}

/** Wire the client SDK to local Auth + Firestore emulators (call once per process). */
function connectClientToFirebaseEmulators(): void {
  const g = globalThis as unknown as Record<string, boolean>;
  if (g[EMULATOR_GUARD_KEY]) return;
  if (!shouldUseFirebaseEmulators() || !db || !auth) return;

  const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? '127.0.0.1';
  const firestorePort = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? '8080');
  connectFirestoreEmulator(db, firestoreHost, firestorePort);

  const authUrl = process.env.NEXT_PUBLIC_AUTH_EMULATOR_URL ?? 'http://127.0.0.1:9099';
  connectAuthEmulator(auth, authUrl);

  g[EMULATOR_GUARD_KEY] = true;
}

// Firebase configuration - using environment variables for security
// These should be set in .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if all required config is present
const hasValidConfig = Object.values(firebaseConfig).every((value) => value !== '');

// Initialize Firebase
const app = hasValidConfig
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

// Initialize services
export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;

connectClientToFirebaseEmulators();

// Enable offline persistence (browser only)
if (typeof window !== 'undefined' && db) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open — persistence only works in one tab at a time
      console.warn('Firestore persistence unavailable (multiple tabs)');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      console.warn('Firestore persistence not supported in this browser');
    }
  });
}

// Export app for direct access if needed
export { app };

// Development mock mode flag
export const isMockMode = !hasValidConfig;

// Helper to check if Firebase is initialized
export function isFirebaseInitialized(): boolean {
  return app !== null && db !== null && auth !== null;
}

// Collection paths helper
export const collections = {
  users: 'users',
  profiles: (uid: string) => `users/${uid}/profile`,
  programs: (uid: string) => `users/${uid}/programs`,
  workouts: (uid: string) => `users/${uid}/workouts`,
  nutritionDays: (uid: string) => `users/${uid}/nutrition`,
  supplementLogs: (uid: string) => `users/${uid}/supplements`,
  recoveryEntries: (uid: string) => `users/${uid}/recovery`,
  checkIns: (uid: string) => `users/${uid}/checkins`,
  phases: (uid: string) => `users/${uid}/phases`,
  journalEntries: (uid: string) => `users/${uid}/journal`,
  volumeLandmarks: (uid: string) => `users/${uid}/landmarks`,
  supplementProtocol: (uid: string) => `users/${uid}/protocol`,
  nutritionPlan: (uid: string) => `users/${uid}/nutritionPlan`,
  /** One doc per `importCoachData` run for audit / retry UX (principal review). */
  importJobs: (uid: string) => `users/${uid}/importJobs`,
  seedJobs: (uid: string) => `users/${uid}/seedJobs`,
  weeklyVolumeRollups: (uid: string) => `users/${uid}/weeklyVolumeRollups`,
} as const;
