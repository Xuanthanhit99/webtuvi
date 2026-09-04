import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NumerologyDashboard } from '@/features/numerology/components/numerology-dashboard';

export const metadata: Metadata = {
  title: 'Thần Số Học',
  description: 'Khám phá sáu chỉ số Thần số học cốt lõi từ họ tên khai sinh và ngày sinh của bạn.',
};

export default function NumerologyPage() {
  return (
    <Suspense fallback={null}>
      <NumerologyDashboard />
    </Suspense>
  );
}
