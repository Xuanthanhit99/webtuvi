'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
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
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['tarot', 'readings', filters], queryFn: () => tarotApi.listReadings(filters) });
  const { data: premiumStatus } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <ErrorState description="Chưa thể tải lịch sử Tarot." onRetry={() => refetch()} />;
  if (!data || data.items.length === 0) return <EmptyState title="Chưa có trải bài" description="Rút lá bài đầu tiên để bắt đầu lưu hành trình Tarot của bạn." />;

  const atFreeCap = !premiumStatus?.isPremium && data.total >= FREE_HISTORY_LIMIT;

  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-md border border-[rgba(213,173,98,0.28)] bg-[#07111D] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <ul className="flex flex-col gap-2" aria-label="Lịch sử trải bài Tarot">
        {data.items.map((reading) => (
          <li key={reading.id}>
            <button
              type="button"
              onClick={() => onSelect(reading.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 rounded-md border border-[rgba(213,173,98,0.18)] bg-[#0A1622]/90 px-3 py-3 text-left transition-colors duration-fast hover:border-insight/50 hover:bg-[#101827]"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-sm font-semibold text-text-primary">
                  {reading.cards.map((c) => `${c.card.name} ${c.isReversed ? '(Ngược)' : '(Xuôi)'}`).join(', ')}
                </span>
                {reading.question && <span className="text-caption text-text-secondary">“{reading.question}”</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{READING_TYPE_LABELS[reading.type]}</Badge>
                <Badge
                  variant={READING_STATUS_BADGE_VARIANT[reading.status]}
                  className={reading.status === 'ACTIVE' ? 'bg-[#123D34] text-[#B9F6D8]' : undefined}
                >
                  {READING_STATUS_LABELS[reading.status]}
                </Badge>
                <span className="text-caption text-text-secondary">{new Date(reading.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {atFreeCap && (
        <p className="text-caption text-text-secondary">
          Gói Miễn phí hiển thị {FREE_HISTORY_LIMIT} trải bài gần nhất.{' '}
          <Link href="/premium?reason=required" className="text-insight hover:underline">
            Nâng cấp để xem lịch sử không giới hạn
          </Link>
          .
        </p>
      )}
    </div>
  );
}
