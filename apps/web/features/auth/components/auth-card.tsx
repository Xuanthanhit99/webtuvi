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
    <div className="relative flex min-h-dvh items-start justify-center bg-canvas px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 tablet:items-center tablet:py-12 [&_.text-caution]:text-[#E5A69C]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(213,173,98,0.07),transparent_60%)]" aria-hidden="true" />
      <div className="relative w-full max-w-[440px] rounded-2xl border border-insight/15 bg-surface/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] tablet:p-8">
        <div className="mb-6">
          <Link href="/" aria-label="Mệnh Vi — về trang chủ" className="inline-flex min-h-11 items-center gap-3 text-insight">
            <Logo />
          </Link>
        </div>
        <h1 className="font-display text-heading-lg font-semibold text-text-primary">{title}</h1>
        {description && <p className="mt-2 text-body-sm text-text-secondary">{description}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-body-sm text-text-secondary">{footer}</div>}
      </div>
    </div>
  );
}
