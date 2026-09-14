'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { reportsApi, type ListReportsFilters } from '../api/reports-api';
import { REPORT_STATUS_BADGE_VARIANT, REPORT_STATUS_LABELS } from '../labels';

/** Real, persisted report history only (locked decision #16 — never overwritten, newest first). */
export function ReportHistoryList({ filters, onSelect }: { filters: ListReportsFilters; onSelect: (id: string) => void }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['reports', 'list', filters],
    queryFn: () => reportsApi.listReports(filters),
  });

  if (isLoading) {
    return (
      <div role="status" aria-label="Đang tải lịch sử báo cáo">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <ErrorState
        title="Chưa thể tải lịch sử báo cáo"
        description="Lịch sử báo cáo chưa tải được, nên mình không coi đây là trạng thái trống."
        onRetry={() => refetch()}
        retryLabel={isFetching ? 'Đang thử lại...' : 'Thử lại'}
      />
    );
  }
  if (!data || data.items.length === 0) {
    return <EmptyState title="Chưa có báo cáo" description="Sau khi bạn tạo Báo cáo Định mệnh Cá nhân đầu tiên, báo cáo sẽ xuất hiện tại đây." />;
  }

  return (
    <ul className="flex flex-col gap-2" aria-label="Lịch sử báo cáo">
      {data.items.map((report) => (
        <li key={report.id}>
          <button
            type="button"
            onClick={() => onSelect(report.id)}
            className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-left transition-colors duration-fast hover:bg-surface-raised"
          >
            <span className="text-body-sm font-semibold text-text-primary">Báo cáo Định mệnh Cá nhân</span>
            <div className="flex items-center gap-2">
              <Badge variant={REPORT_STATUS_BADGE_VARIANT[report.status]}>{REPORT_STATUS_LABELS[report.status]}</Badge>
              <span className="text-caption text-text-tertiary">{new Date(report.createdAt).toLocaleDateString()}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
