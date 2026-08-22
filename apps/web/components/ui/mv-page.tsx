import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function MvPage({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-8', className)} {...props} />;
}

export function MvPageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('relative overflow-hidden rounded-lg border border-[rgba(213,173,98,0.16)] bg-surface px-5 py-6 shadow-[0_20px_64px_rgba(0,0,0,0.22)] tablet:px-7', className)}>
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle,rgba(242,238,229,0.22)_1px,transparent_1.5px)] [background-size:38px_38px]" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-insight/20" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-80 rounded-[50%] border border-trust/20" />
      <div className="relative max-w-3xl">
        {eyebrow && <p className="text-caption font-semibold uppercase tracking-[0.18em] text-insight">{eyebrow}</p>}
        <h1 className="mt-2 text-heading-lg font-semibold text-text-primary">{title}</h1>
        {description && <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </header>
  );
}

export function MvSection({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-heading`;
  return (
    <section aria-labelledby={id} className={cn('space-y-4', className)}>
      <div>
        {eyebrow && <p className="text-caption font-semibold uppercase tracking-[0.16em] text-insight">{eyebrow}</p>}
        <h2 id={id} className="mt-1 text-heading-md font-semibold text-text-primary">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
