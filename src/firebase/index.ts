import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Log the Firebase config to verify it's loading correctly
if (typeof window !== 'undefined') {
  console.log('Environment Variables Debug:', {
    API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  console.log('Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey || 'UNDEFINED',
    authDomain: firebaseConfig.authDomain || 'UNDEFINED',
    projectId: firebaseConfig.projectId || 'UNDEFINED',
    storageBucket: firebaseConfig.storageBucket || 'UNDEFINED',
    messagingSenderId: firebaseConfig.messagingSenderId || 'UNDEFINED',
    appId: firebaseConfig.appId || 'UNDEFINED',
  });
}

// This function is not being used since initialization is now client-side only
// but we'll keep it for reference.
function initializeFirebase() {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { firebaseApp: app, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export { initializeFirebase };
