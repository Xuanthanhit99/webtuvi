import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GoalDashboard } from '@/features/goal/components/goal-dashboard';

export const metadata: Metadata = { title: 'Goals' };

export default function GoalsPage() {
  return (
    <Suspense fallback={null}>
      <GoalDashboard />
    </Suspense>
  );
}
