import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { OAuthButtons } from '@/features/auth/components/oauth-buttons';
import { RegisterForm } from '@/features/auth/components/register-form';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Tạo tài khoản',
  description: 'Tạo tài khoản Tử Vi Tarot miễn phí để lưu Tarot, lá số Tử Vi, bản đồ sao và thần số học.',
  path: '/register',
});

export default function RegisterPage() {
  return (
    <AuthCard
      title="Bắt đầu với Tử Vi Tarot"
      description="Tạo tài khoản miễn phí để lưu kết quả và tiếp tục sau."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-insight underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <RegisterForm />
    </AuthCard>
  );
}
