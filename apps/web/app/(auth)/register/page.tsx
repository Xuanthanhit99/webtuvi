import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/auth-card';
import { RegisterForm } from '@/features/auth/components/register-form';
import { buildMetadata } from '@/lib/seo';
import { authReturnUrl } from '@/lib/safe-next-path';

export const metadata: Metadata = buildMetadata({
  title: 'Tạo tài khoản',
  description: 'Tạo tài khoản Mệnh Vi miễn phí để lưu Tarot, lá số Tử Vi, bản đồ sao và thần số học.',
  path: '/register',
  // Auth forms stay out of the index; the (auth) layout's noindex would otherwise be overridden here.
  noindex: true,
});

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = (await searchParams).next;
  return (
    <AuthCard
      title="Bắt đầu với Mệnh Vi"
      description="Tạo tài khoản miễn phí để lưu kết quả và tiếp tục sau."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link href={authReturnUrl('/login', next)} className="text-insight underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
