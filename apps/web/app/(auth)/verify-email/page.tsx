import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/auth-card';
import { VerifyEmailStatus } from '@/features/auth/components/verify-email-status';

// SEO + Shareability Foundation — carries a one-time verification token in the URL; must never be
// indexed/cached. Defense-in-depth alongside the robots.ts fix in this same pass.
export const metadata: Metadata = { title: 'Xác minh email', robots: { index: false, follow: false } };

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Xác minh email" description="Xác nhận địa chỉ email của bạn.">
      <Suspense fallback={null}>
        <VerifyEmailStatus />
      </Suspense>
    </AuthCard>
  );
}
