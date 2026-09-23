import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReportsDashboard } from '@/features/reports/components/reports-dashboard';

export const metadata: Metadata = {
  title: 'Báo Cáo Vận Mệnh',
  description: 'Báo cáo Premium kết hợp dữ liệu Bản đồ sao và Thần số học đã được tính từ hồ sơ của bạn thành một bản luận giải dài.',
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-[24rem] animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" aria-label="Đang tải báo cáo" />}>
      <ReportsDashboard />
    </Suspense>
  );
}
