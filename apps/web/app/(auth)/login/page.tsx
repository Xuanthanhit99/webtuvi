import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { LoginForm } from '@/features/auth/components/login-form';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Đăng nhập',
  description: 'Đăng nhập Tử Vi Tarot để tiếp tục hành trình Tử Vi, Tarot, bản đồ sao và thần số học của bạn.',
  path: '/login',
});

export default function LoginPage() {
  return (
    <AuthCard
      title="Chào mừng trở lại"
      description="Đăng nhập để tiếp tục hành trình của bạn."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-insight underline">
            Tạo tài khoản
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <LoginForm />
    </AuthCard>
  );
}
