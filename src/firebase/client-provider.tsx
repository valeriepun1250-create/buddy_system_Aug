'use client';

import {
  FirebaseProvider,
} from './provider';
import { initializeFirebase } from '.';
import type { ReactNode } from 'react';
import { useMemo, useEffect, useState } from 'react';

// Initialize Firebase lazily on the client side
let firebaseInstance: ReturnType<typeof initializeFirebase> | null = null;

function getFirebaseInstance() {
  if (typeof window === 'undefined') {
    // Return a mock instance during SSR/build
    throw new Error('Firebase cannot be initialized during server-side rendering');
  }
  if (!firebaseInstance) {
    console.log('[Firebase] Initializing Firebase SDK...');
    try {
      firebaseInstance = initializeFirebase();
      console.log('[Firebase] ✓ Firebase initialized successfully');
    } catch (error) {
      console.error('[Firebase] ✗ Error initializing Firebase:', error);
      throw error;
    }
  }
  return firebaseInstance;
}

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // Only initialize Firebase on the client side
    if (typeof window !== 'undefined') {
      try {
        console.log('[Firebase] Starting Firebase initialization...');
        setFirebase(getFirebaseInstance());
      } catch (error) {
        console.error('[Firebase] Failed to initialize Firebase in provider:', error);
      }
    }
  }, []);

  // Always render with FirebaseProvider, even if Firebase isn't initialized
  // The hooks will return undefined until Firebase is ready
  return <FirebaseProvider 
    firebaseApp={firebase?.firebaseApp}
    auth={firebase?.auth}
    firestore={firebase?.firestore}
  >{children}</FirebaseProvider>;
}
