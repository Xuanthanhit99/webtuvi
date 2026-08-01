import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/auth-card';
import { VerifyEmailStatus } from '@/features/auth/components/verify-email-status';

export const metadata: Metadata = { title: 'Verify your email' };

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Verify your email" description="Confirming your email address.">
      <Suspense fallback={null}>
        <VerifyEmailStatus />
      </Suspense>
    </AuthCard>
  );
}
