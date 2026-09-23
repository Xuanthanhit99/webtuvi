'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { tuViApi, type ListTuViChartsFilters } from '../api/tu-vi-api';
import { CHART_STATUS_BADGE_VARIANT, CHART_STATUS_LABELS } from '../labels';

// Mirrors the backend's FREE_HISTORY_LIMIT (tu-vi-record.service.ts) — display-only.
const FREE_HISTORY_LIMIT = 20;

export function TuViHistoryList({ filters, onSelect }: { filters: ListTuViChartsFilters; onSelect: (id: string) => void }) {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['tu-vi', 'charts', filters], queryFn: () => tuViApi.listCharts(filters) });
  const { data: premiumStatus } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (isError) return <ErrorState description="Chưa thể tải lịch sử lá số Tử Vi." onRetry={() => refetch()} />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="Chưa có lá số" description="Lập lá số đầu tiên để bắt đầu hành trình khám phá của bạn." />;
  }

  const atFreeCap = !premiumStatus?.isPremium && data.total >= FREE_HISTORY_LIMIT;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Lịch sử lá số Tử Vi">
        {data.items.map((chart) => (
          <li key={chart.id}>
            <button
              type="button"
              onClick={() => onSelect(chart.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-[rgba(213,173,98,0.16)] bg-surface px-4 py-3 text-left transition-colors duration-fast hover:border-insight/40 hover:bg-surface-raised"
            >
              <div className="flex flex-col gap-1">
                <span className="font-display text-body-md font-semibold text-text-primary">
                  {chart.cuc} — Mệnh tại {chart.palaces.menh}
                </span>
                <span className="text-caption text-text-secondary">
                  Sinh ngày {chart.birthDate}, lúc {chart.birthTime} · {chart.sex}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={CHART_STATUS_BADGE_VARIANT[chart.status]}>{CHART_STATUS_LABELS[chart.status]}</Badge>
                <span className="text-caption text-text-tertiary">{new Date(chart.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {atFreeCap && (
        <p className="text-caption text-text-secondary">
          Gói Miễn phí hiển thị {FREE_HISTORY_LIMIT} lá số gần nhất.{' '}
          <Link href="/premium?reason=required" className="text-insight hover:underline">
            Nâng cấp để lưu không giới hạn
          </Link>
          .
        </p>
      )}
    </div>
  );
}
