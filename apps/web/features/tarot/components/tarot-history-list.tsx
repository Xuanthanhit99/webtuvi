'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { tarotApi, type ListReadingsFilters } from '../api/tarot-api';
import { READING_STATUS_BADGE_VARIANT, READING_STATUS_LABELS, READING_TYPE_LABELS } from '../labels';

// Mirrors the backend's FREE_HISTORY_LIMIT (tarot-record.service.ts) — display-only, never
// enforced here; the server truncates `total` itself for Free accounts regardless of this constant.
const FREE_HISTORY_LIMIT = 20;

/** Phase 6 — History. Real, persisted past readings only — never a fabricated list. Sprint 7,
 * Phase 11: a Free account whose history is at the server-enforced cap sees a plain explanation,
 * not a silently-truncated list with no context. */
export function TarotHistoryList({ filters, onSelect }: { filters: ListReadingsFilters; onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['tarot', 'readings', filters], queryFn: () => tarotApi.listReadings(filters) });
  const { data: premiumStatus } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data || data.items.length === 0) return <EmptyState title="No readings yet" description="Draw your first card to start your Tarot history." />;

  const atFreeCap = !premiumStatus?.isPremium && data.total >= FREE_HISTORY_LIMIT;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Reading history">
        {data.items.map((reading) => (
          <li key={reading.id}>
            <button
              type="button"
              onClick={() => onSelect(reading.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-left transition-colors duration-fast hover:bg-surface-raised"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-sm font-semibold text-text-primary">
                  {reading.cards.map((c) => c.card.name).join(', ')}
                </span>
                {reading.question && <span className="text-caption text-text-secondary">“{reading.question}”</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{READING_TYPE_LABELS[reading.type]}</Badge>
                <Badge variant={READING_STATUS_BADGE_VARIANT[reading.status]}>{READING_STATUS_LABELS[reading.status]}</Badge>
                <span className="text-caption text-text-disabled">{new Date(reading.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {atFreeCap && (
        <p className="text-caption text-text-secondary">
          Showing your most recent {FREE_HISTORY_LIMIT} readings on the Free plan.{' '}
          <Link href="/premium?reason=required" className="text-insight hover:underline">
            Upgrade for unlimited history
          </Link>
          .
        </p>
      )}
    </div>
  );
}
