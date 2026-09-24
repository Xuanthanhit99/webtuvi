'use client';

import dynamic from 'next/dynamic';
import { Suspense, type ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';
import type { Slug } from './public-system-landing';

const dashboards = {
  'tu-vi': dynamic(() => import('@/features/tu-vi/components/tu-vi-dashboard').then((m) => m.TuViDashboard)),
  tarot: dynamic(() => import('@/features/tarot/components/tarot-dashboard').then((m) => m.TarotDashboard)),
  'ban-do-sao': dynamic(() => import('@/features/natal-chart/components/natal-chart-dashboard').then((m) => m.NatalChartDashboard)),
  'than-so-hoc': dynamic(() => import('@/features/numerology/components/numerology-dashboard').then((m) => m.NumerologyDashboard)),
  'eastern-horoscope': dynamic(() => import('@/features/eastern-horoscope/components/eastern-horoscope-dashboard').then((m) => m.EasternHoroscopeDashboard)),
};

/** Server-render the public introduction; mount private queries only for an onboarded user. */
export function DiscoveryEntry({ system, children }: { system: Slug; children: ReactNode }) {
  const { user } = useAuth();
  if (!user?.onboardingCompletedAt) return children;
  const Dashboard = dashboards[system];
  return <Suspense fallback={<div role="status" className="min-h-[28rem]">Đang tải kết quả của bạn…</div>}><Dashboard /></Suspense>;
}
