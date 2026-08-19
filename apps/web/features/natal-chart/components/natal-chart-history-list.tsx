'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { natalChartApi, type ListChartsFilters } from '../api/natal-chart-api';
import { CHART_STATUS_BADGE_VARIANT, CHART_STATUS_LABELS } from '../labels';

// Mirrors the backend's NATAL_CHART_FREE_HISTORY_LIMIT (natal-chart-constants.ts) — display-only,
// never enforced here; the server truncates `total` itself for Free accounts regardless.
const FREE_HISTORY_LIMIT = 20;

/** Real, persisted past charts only — never a fabricated list (mirrors
 * NumerologyHistoryList/TarotHistoryList's own precedent). */
export function NatalChartHistoryList({ filters, onSelect }: { filters: ListChartsFilters; onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['natal-chart', 'charts', filters], queryFn: () => natalChartApi.listCharts(filters) });
  const { data: premiumStatus } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="No charts yet" description="Calculate your first chart to start your Natal Chart history." />;
  }

  const atFreeCap = !premiumStatus?.isPremium && data.total >= FREE_HISTORY_LIMIT;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Chart history">
        {data.items.map((chart) => (
          <li key={chart.id}>
            <button
              type="button"
              onClick={() => onSelect(chart.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-left transition-colors duration-fast hover:bg-surface-raised"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-sm font-semibold text-text-primary">{chart.birthPlaceLabel}</span>
                <span className="text-caption text-text-secondary">
                  Born {chart.birthDate}
                  {chart.birthTime ? ` at ${chart.birthTime}` : ''}
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
          Showing your most recent {FREE_HISTORY_LIMIT} charts on the Free plan.{' '}
          <Link href="/premium?reason=required" className="text-insight hover:underline">
            Upgrade for unlimited history
          </Link>
          .
        </p>
      )}
    </div>
  );
}
