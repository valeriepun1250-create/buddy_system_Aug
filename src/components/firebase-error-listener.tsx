'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', (error: any) => {
      // In development, this will also trigger the Next.js error overlay
      // if we throw the error, but we'll start with a destructive toast.
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: error.message || 'You do not have permission to perform this action.',
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Firestore Permission Error Context:', error.context);
      }
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
