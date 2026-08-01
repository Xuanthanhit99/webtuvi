import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/auth-card';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification-form';

export const metadata: Metadata = { title: 'Verify your email' };

export default function VerifyEmailPendingPage() {
  return (
    <AuthCard
      title="Almost there"
      description="We sent a verification link when you signed up. Didn't get it, or did it expire?"
    >
      <ResendVerificationForm />
    </AuthCard>
  );
}
