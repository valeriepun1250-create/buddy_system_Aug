'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type { Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp | undefined;
  auth: Auth | undefined;
  firestore: Firestore | undefined;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

interface FirebaseProviderProps {
  firebaseApp?: FirebaseApp;
  auth?: Auth;
  firestore?: Firestore;
  children: ReactNode;
}

export function FirebaseProvider({
  firebaseApp,
  auth,
  firestore,
  children,
}: FirebaseProviderProps) {
  const value = useMemo(
    () => ({
      firebaseApp,
      auth,
      firestore,
    }),
    [firebaseApp, auth, firestore]
  );

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

function useFirebaseContextSafe(): FirebaseContextValue | undefined {
  return useContext(FirebaseContext);
}

export function useFirebaseApp(): FirebaseApp | undefined {
  const context = useFirebaseContextSafe();
  return context?.firebaseApp;
}

export function useAuth(): Auth | undefined {
  const context = useFirebaseContextSafe();
  return context?.auth;
}

export function useFirestore(): Firestore | undefined {
  const context = useFirebaseContextSafe();
  return context?.firestore;
}
