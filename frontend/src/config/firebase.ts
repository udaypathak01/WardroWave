import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { missingFirebaseVariables } from '../lib/api/runtimeConfig';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const configuredApp: FirebaseApp | null = missingFirebaseVariables.length
  ? null
  : initializeApp(firebaseConfig);

export const auth: Auth | null = configuredApp ? getAuth(configuredApp) : null;
export const app = configuredApp;

export function requireFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase is not configured. Set the required VITE_FIREBASE_* variables.');
  }
  return auth;
}

export default app;
