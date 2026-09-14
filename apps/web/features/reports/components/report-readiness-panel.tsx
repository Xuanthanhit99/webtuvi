'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsApi } from '../api/reports-api';

/** Honest source-readiness checklist (locked decision #4/#6 — "no partial report... show a
 * source-readiness state with CTA to complete the missing source"). Tarot/Memory are shown as
 * optional context, never blocking, and never presented as if required. */
export function ReportReadinessPanel() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ['reports', 'readiness'], queryFn: reportsApi.readiness });

  if (isLoading) {
    return (
      <div role="status" aria-label="Đang kiểm tra nguồn dữ liệu báo cáo">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Chưa thể kiểm tra nguồn báo cáo"
        description="Kết nối tới hệ thống báo cáo đang gián đoạn. Hãy thử lại để biết bạn đã đủ dữ liệu tạo báo cáo hay chưa."
        onRetry={() => refetch()}
        retryLabel={isFetching ? 'Đang thử lại...' : 'Thử lại'}
      />
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-body-sm font-semibold text-text-secondary">Nguồn dữ liệu của báo cáo</p>
      <ul className="flex flex-col gap-2" aria-label="Nguồn bắt buộc">
        <ReadinessRow
          label="Bản đồ sao"
          available={data.natalChart.available}
          ctaHref="/discover/natal-chart"
          ctaLabel="Tạo Bản đồ sao"
        />
        <ReadinessRow
          label="Thần số học"
          available={data.numerology.available}
          ctaHref="/discover/numerology"
          ctaLabel="Tạo Thần số học"
        />
      </ul>
      <div className="border-t border-border-subtle pt-3">
        <p className="mb-2 text-caption font-medium text-text-secondary">Bối cảnh bổ sung, không bắt buộc</p>
        <ul className="flex flex-col gap-1.5" aria-label="Nguồn bổ sung tùy chọn">
          <OptionalRow label="Trải bài Tarot gần đây" available={data.tarot.available} />
          <OptionalRow label="Ký ức đã được bạn cho phép dùng" available={data.memory.available} />
        </ul>
      </div>
    </Card>
  );
}

function ReadinessRow({ label, available, ctaHref, ctaLabel }: { label: string; available: boolean; ctaHref: string; ctaLabel: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-body-sm text-text-primary">
        {available ? (
          <CheckCircle2 className="h-4 w-4 text-trust" aria-hidden="true" />
        ) : (
          <Circle className="h-4 w-4 text-text-disabled" aria-hidden="true" />
        )}
        {label}
      </span>
      {!available && (
        <Link href={ctaHref} className="text-caption text-insight hover:underline">
          {ctaLabel}
        </Link>
      )}
    </li>
  );
}

function OptionalRow({ label, available }: { label: string; available: boolean }) {
  return (
    <li className="flex items-center gap-2 text-caption text-text-secondary">
      {available ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-text-disabled" aria-hidden="true" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-text-disabled" aria-hidden="true" />
      )}
      {label}
    </li>
  );
}
