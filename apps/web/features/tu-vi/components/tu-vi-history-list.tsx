'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { tuViApi, type ListTuViChartsFilters } from '../api/tu-vi-api';
import { CHART_STATUS_BADGE_VARIANT, CHART_STATUS_LABELS } from '../labels';

// Mirrors the backend's FREE_HISTORY_LIMIT (tu-vi-record.service.ts) — display-only.
const FREE_HISTORY_LIMIT = 20;

export function TuViHistoryList({ filters, onSelect }: { filters: ListTuViChartsFilters; onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['tu-vi', 'charts', filters], queryFn: () => tuViApi.listCharts(filters) });
  const { data: premiumStatus } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="No lá số yet" description="Calculate your lá số to start your Tử Vi history." />;
  }

  const atFreeCap = !premiumStatus?.isPremium && data.total >= FREE_HISTORY_LIMIT;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Lá số history">
        {data.items.map((chart) => (
          <li key={chart.id}>
            <button
              type="button"
              onClick={() => onSelect(chart.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-left transition-colors duration-fast hover:bg-surface-raised"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-sm font-semibold text-text-primary">
                  {chart.cuc} — Mệnh tại {chart.palaces.menh}
                </span>
                <span className="text-caption text-text-secondary">
                  Born {chart.birthDate} at {chart.birthTime} · {chart.sex}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={CHART_STATUS_BADGE_VARIANT[chart.status]}>{CHART_STATUS_LABELS[chart.status]}</Badge>
                <span className="text-caption text-text-tertiary">{new Date(chart.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {atFreeCap && (
        <p className="text-caption text-text-secondary">
          Showing your most recent {FREE_HISTORY_LIMIT} lá số on the Free plan.{' '}
          <Link href="/premium?reason=required" className="text-insight hover:underline">
            Upgrade for unlimited history
          </Link>
          .
        </p>
      )}
    </div>
  );
}
