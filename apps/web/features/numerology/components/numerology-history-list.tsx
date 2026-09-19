'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { numerologyApi, type ListReadingsFilters } from '../api/numerology-api';
import { READING_STATUS_BADGE_VARIANT, READING_STATUS_LABELS } from '../labels';

// Mirrors the backend's FREE_HISTORY_LIMIT (numerology-record.service.ts) — display-only, never
// enforced here; the server truncates `total` itself for Free accounts regardless of this constant.
const FREE_HISTORY_LIMIT = 20;

/** Real, persisted past readings only — never a fabricated list. A Free account whose history is
 * at the server-enforced cap sees a plain explanation, not a silently-truncated list with no
 * context (mirrors TarotHistoryList's own Sprint 7 precedent). */
export function NumerologyHistoryList({ filters, onSelect }: { filters: ListReadingsFilters; onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['numerology', 'readings', filters], queryFn: () => numerologyApi.listReadings(filters) });
  const { data: premiumStatus } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="Chưa có hồ sơ" description="Tạo hồ sơ đầu tiên để bắt đầu hành trình Thần số học của bạn." />;
  }

  const atFreeCap = !premiumStatus?.isPremium && data.total >= FREE_HISTORY_LIMIT;

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 tablet:grid-cols-2" aria-label="Lịch sử hồ sơ số học">
        {data.items.map((reading) => (
          <li key={reading.id}>
            <button
              type="button"
              onClick={() => onSelect(reading.id)}
              className="flex min-h-20 w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-[#b78ad0]/16 bg-[#0b1020] px-4 py-3 text-left transition-colors duration-fast hover:border-[#b78ad0]/40 hover:bg-[#11152a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-sm font-semibold text-text-primary">{reading.normalizedBirthName}</span>
                <span className="text-caption text-text-secondary">Ngày sinh {reading.birthDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={READING_STATUS_BADGE_VARIANT[reading.status]}>{READING_STATUS_LABELS[reading.status]}</Badge>
                <span className="text-caption text-text-secondary">{new Date(reading.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {atFreeCap && (
        <p className="text-caption text-text-secondary">
          Gói miễn phí đang hiển thị {FREE_HISTORY_LIMIT} hồ sơ gần nhất.{' '}
          <Link href="/premium?reason=required" className="text-insight hover:underline">
            Nâng cấp để xem lịch sử không giới hạn
          </Link>
          .
        </p>
      )}
    </div>
  );
}
