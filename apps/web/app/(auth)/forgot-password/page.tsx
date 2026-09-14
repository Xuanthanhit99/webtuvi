import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

// SEO + Shareability Foundation — thin, transactional, no SEO value; noindex at the metadata
// level (defense-in-depth, not currently covered by robots.ts's disallow list either).
export const metadata: Metadata = { title: 'Đặt lại mật khẩu', robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Quên mật khẩu?"
      description="Nhập email để yêu cầu liên kết đặt lại mật khẩu."
      footer={
        <Link href="/login" className="text-insight underline">
          Về trang đăng nhập
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
