'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/components/providers/app-provider';
import { Header } from '@/components/dashboard/header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, userProfile } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/');
    } else if (userProfile && !userProfile.approved) {
      router.replace('/awaiting-approval');
    }
  }, [user, userProfile, router]);

  if (!user || !userProfile || !userProfile.approved) {
    // Render a loading state or null while redirecting
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Securing your session...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col bg-background">
        {children}
      </main>
    </div>
  );
}
