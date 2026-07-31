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
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-12 desktop:grid desktop:grid-cols-2 desktop:px-0 desktop:py-0">
      <div className="hidden h-full flex-col justify-center border-r border-border-subtle bg-surface px-12 desktop:flex">
        <Link href="/">
          <Logo />
        </Link>
        <p className="mt-8 max-w-sm font-display text-heading-lg text-text-primary">
          An AI that actually <span className="text-insight">remembers you.</span>
        </p>
      </div>
      <div className="w-full max-w-sm desktop:mx-auto desktop:px-8">
        <div className="mb-8 desktop:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <h1 className="font-display text-heading-lg text-text-primary">{title}</h1>
        {description && <p className="mt-2 text-body-sm text-text-secondary">{description}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-body-sm text-text-secondary">{footer}</div>}
      </div>
    </div>
  );
}
