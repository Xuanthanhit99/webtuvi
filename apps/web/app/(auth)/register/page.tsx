import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Meet your Companion"
      description="Create an account to get started — it takes less than a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-insight underline">
            Log in
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <RegisterForm />
    </AuthCard>
  );
}
