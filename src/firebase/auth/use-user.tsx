'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useAuth } from '../provider';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { useMemo } from 'react';

// Dummy auth object for when Firebase isn't initialized
const createDummyAuth = (): Auth => {
  // Return a minimal object that won't throw when passed to useAuthState
  return {
    currentUser: null,
  } as unknown as Auth;
};

export function useUser() {
  const auth = useAuth();
  
  // Use a valid auth or dummy to avoid hook errors
  const authToUse = useMemo(() => {
    return auth || createDummyAuth();
  }, [auth]);

  const [user, loading, error] = useAuthState(authToUse);

  // If auth wasn't ready, keep loading true
  return {
    user: auth ? user : null,
    loading: auth ? loading : true,
    error: auth ? error : null,
  };
}
