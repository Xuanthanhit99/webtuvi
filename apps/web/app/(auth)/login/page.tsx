import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { LoginForm } from '@/features/auth/components/login-form';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Log in',
  description: 'Log in to Tử Vi Tarot to continue your reflection practice with your Companion.',
  path: '/login',
});

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
