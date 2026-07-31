import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to continue with your Companion."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="text-insight underline">
            Create an account
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <LoginForm />
    </AuthCard>
  );
}
