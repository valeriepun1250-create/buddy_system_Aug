'use client';

import { createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
import type { UserProfile, Case, RiskFactorChecklist } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, serverTimestamp, setDoc, getDoc, deleteDoc, type CollectionReference } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AppContextType {
  user: any; 
  userProfile: UserProfile | null;
  cases: Case[];
  users: UserProfile[];
  logout: () => void;
  addCase: (newCaseData: Omit<Case, 'id' | 'createdAt' | 'status'> & { riskFactorChecklist: RiskFactorChecklist }) => void;
  updateCase: (caseId: string, updates: Partial<Case>) => void;
  deleteCase: (caseId: string) => void;
  updateUserProfile: (username: string, updates: Partial<UserProfile>) => Promise<void>;
  findUserByName: (username: string) => UserProfile | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  // If Firebase isn't ready yet, show a minimal loading state
  if (!auth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return <AppProviderInner>{children}</AppProviderInner>;
}

function AppProviderInner({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { user: authUser, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const usersRef = useMemo(
    () => firestore ? collection(firestore, 'users') as CollectionReference<UserProfile> : null,
    [firestore]
  );
  
  const userProfileQuery = useMemo(() => authUser && usersRef ? query(usersRef, where('uid', '==', authUser.uid)) : null, [usersRef, authUser]);
  const { data: userProfileData, loading: profileLoading } = useCollection<UserProfile>(userProfileQuery);
  const userProfile = useMemo(() => (userProfileData && userProfileData.length > 0 ? userProfileData[0] : null), [userProfileData]);

  const casesRef = useMemo(
    () => firestore ? collection(firestore, 'cases') as CollectionReference<Case> : null,
    [firestore]
  );
  const { data: cases } = useCollection<Case>(casesRef);

  const { data: users } = useCollection<UserProfile>(usersRef);
  
  useEffect(() => {
    if (authLoading || profileLoading) return;

    const publicPaths = ['/'];

    if (authUser) {
      if (userProfile) {
        if (userProfile.approved) {
          if (pathname !== '/dashboard') router.replace('/dashboard');
        } else {
          if (!userProfile.role || !userProfile.name || !userProfile.phone) {
            if (pathname !== '/complete-profile') router.replace('/complete-profile');
          } else {
            if (pathname !== '/awaiting-approval') router.replace('/awaiting-approval');
          }
        }
      } else {
        if (pathname !== '/complete-profile') router.replace('/complete-profile');
      }
    } else {
      if (!publicPaths.includes(pathname)) router.replace('/');
    }
  }, [authUser, userProfile, authLoading, profileLoading, pathname, router]);

  const logout = async () => {
    if (!auth) {
      router.push('/');
      return;
    }
    await signOut(auth);
    router.push('/');
  };

  const addCase = (newCaseData: Omit<Case, 'id' | 'createdAt' | 'status'> & { riskFactorChecklist: RiskFactorChecklist }) => {
    if (!firestore || !userProfile) return;
    const casesCollection = collection(firestore, 'cases');
    
    const initialStatus = newCaseData.caseType === 'CGAT' 
      ? 'To be follow up by clerk/buddy OT' 
      : 'To be completed by clerk';

    const payload = {
      ...newCaseData,
      createdAt: serverTimestamp(),
      status: initialStatus,
      lastUpdatedById: userProfile.name,
    };

    addDoc(casesCollection, payload).catch((err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'cases',
        operation: 'create',
        requestResourceData: payload
      }));
    });
  };

  const updateCase = (caseId: string, updates: Partial<Case>) => {
    if (!firestore || !userProfile) return;
    const caseDoc = doc(firestore, 'cases', caseId);
    
    updateDoc(caseDoc, {
      ...updates,
      lastUpdatedById: userProfile.name,
    }).catch((err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `cases/${caseId}`,
        operation: 'update',
        requestResourceData: updates
      }));
    });
  };

  const deleteCase = (caseId: string) => {
    if (!firestore) return;
    const caseDoc = doc(firestore, 'cases', caseId);
    deleteDoc(caseDoc).catch((err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `cases/${caseId}`,
        operation: 'delete'
      }));
    });
  };
  
  const updateUserProfile = async (username: string, updates: Partial<UserProfile>) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', username);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists() && docSnap.data().uid !== updates.uid) {
        throw new Error("Username is already taken.");
    }
    
    const finalUpdates = {
        approved: false,
        ...updates
    };

    await setDoc(userDocRef, finalUpdates, { merge: true });
  };

  const findUserByName = (username: string) => users?.find(u => u.name === username);

  const value: AppContextType = {
    user: authUser,
    userProfile: userProfile || null,
    cases: cases || [],
    users: users || [],
    logout,
    addCase,
    updateCase,
    deleteCase,
    updateUserProfile,
    findUserByName,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
