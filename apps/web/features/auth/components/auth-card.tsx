import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-12 desktop:grid desktop:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.75fr)] desktop:px-0 desktop:py-0">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(242,238,229,0.28)_1px,transparent_1.5px)] [background-size:42px_42px]" />
      <div className="hidden h-full flex-col justify-center border-r border-[rgba(213,173,98,0.16)] bg-surface/80 px-12 desktop:flex">
        <Link href="/">
          <Logo />
        </Link>
        <p className="mt-8 max-w-sm text-heading-lg font-semibold text-text-primary">
          Bước vào Mệnh Vi, giữ quyền kiểm soát dữ liệu của bạn.
        </p>
        <p className="mt-4 max-w-sm text-body-sm leading-relaxed text-text-secondary">
          Tử Vi, Tarot, Bản đồ sao và Thần số học dùng dữ liệu thật, lưu an toàn trong tài khoản của bạn.
        </p>
        <div className="mt-10 h-40 max-w-sm rounded-[50%] border border-insight/25" aria-hidden="true" />
      </div>
      <div className="relative w-full max-w-sm rounded-lg border border-[rgba(213,173,98,0.16)] bg-surface/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] desktop:mx-auto desktop:px-8 desktop:py-8">
        <div className="mb-8 desktop:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <h1 className="text-heading-lg font-semibold text-text-primary">{title}</h1>
        {description && <p className="mt-2 text-body-sm text-text-secondary">{description}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-body-sm text-text-secondary">{footer}</div>}
      </div>
    </div>
  );
}
