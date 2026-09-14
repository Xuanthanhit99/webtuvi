import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/auth-card';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification-form';

// SEO + Shareability Foundation — thin, transactional, no SEO value.
export const metadata: Metadata = { title: 'Xác minh email', robots: { index: false, follow: false } };

export default function VerifyEmailPendingPage() {
  return (
    <AuthCard
      title="Kiểm tra hộp thư"
      description="Mở liên kết xác minh trong email. Bạn có thể yêu cầu liên kết mới nếu chưa nhận được hoặc liên kết đã hết hạn."
    >
      <ResendVerificationForm />
    </AuthCard>
  );
}
