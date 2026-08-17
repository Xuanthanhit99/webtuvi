import type { Metadata } from 'next';
import { AnalyticsPageView } from '@/components/analytics/analytics-page-view';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <>
      <AnalyticsPageView event="dashboard_viewed" properties={{ feature: 'dashboard' }} />
      <DashboardView />
    </>
  );
}
