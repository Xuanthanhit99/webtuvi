import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { RegisterForm } from '@/features/auth/components/register-form';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Create your account',
  description: 'Create a free BeaconVie account — start with a real Tarot draw and a Companion that remembers you.',
  path: '/register',
});

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
