'use client';

// Force dynamic rendering to avoid Firebase initialization during build
export const dynamic = 'force-dynamic';

import { CaseDashboard } from '@/components/dashboard/case-dashboard';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <CaseDashboard />
    </div>
  );
}
