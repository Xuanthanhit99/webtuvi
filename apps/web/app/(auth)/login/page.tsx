import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { LoginForm } from '@/features/auth/components/login-form';
import { buildMetadata } from '@/lib/seo';
import { safeNextPath } from '@/lib/safe-next-path';

export const metadata: Metadata = buildMetadata({
  title: 'Đăng nhập',
  description: 'Đăng nhập Mệnh Vi để tiếp tục hành trình Tử Vi, Tarot, bản đồ sao và thần số học của bạn.',
  path: '/login',
  // Auth forms stay out of the index; the (auth) layout's noindex would otherwise be overridden here.
  noindex: true,
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  return (
    <AuthCard
      title="Chào mừng trở lại"
      description="Đăng nhập để tiếp tục hành trình của bạn."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href={next === '/' ? '/register' : `/register?next=${encodeURIComponent(next)}`} className="text-insight underline">
            Tạo tài khoản
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
