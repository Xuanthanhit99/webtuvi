import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function MvV2Surface({
  children,
  className,
  as: Tag = 'section',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return (
    <Tag
      className={cn(
        'relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#0b1321]/80 shadow-[0_18px_55px_rgba(0,0,0,0.2)]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function MvV2Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]', className)}>{children}</p>;
}

export function MvV2Signal({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="text-caption uppercase tracking-[0.12em] text-[#8f9299]">{label}</span>
      <span className="mt-1 block text-body-sm font-semibold leading-relaxed text-[#f2eee5]">{value}</span>
    </>
  );

  if (!href) return <div className="min-w-0">{body}</div>;

  return (
    <Link
      href={href}
      className="group min-w-0 rounded-md outline-none transition-colors hover:text-[#e6c980] focus-visible:ring-2 focus-visible:ring-[#d5ad62]/70"
    >
      {body}
      <span className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-[#d5ad62]">
        Xem chi tiết
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
      </span>
    </Link>
  );
}
