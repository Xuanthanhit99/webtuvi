import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/auth-card';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

// SEO + Shareability Foundation — carries a one-time password-reset token in the URL; must never
// be indexed/cached under any circumstance. Defense-in-depth alongside the robots.ts fix.
export const metadata: Metadata = { title: 'Set a new password', robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" description="Choose a new password for your account.">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
