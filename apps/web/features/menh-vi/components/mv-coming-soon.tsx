import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MvComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Lightweight placeholder for Mệnh Vi nav destinations beyond the home dashboard. Only the
 * home page had a reference screenshot to build against (docs/design/menh-vi-reference-breakdown.md);
 * these surfaces are intentionally left as honest "coming soon" pages rather than guessed at,
 * per this being an isolated design exploration, not a full product build.
 */
export function MvComingSoon({ icon: Icon, title, description }: MvComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-mv-content flex-col items-center px-4 py-24 text-center tablet:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mv-violet/15">
        <Icon className="h-7 w-7 text-mv-violet-secondary" aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-heading-lg text-mv-text">{title}</h1>
      <p className="mt-3 max-w-sm text-body-sm text-mv-text-secondary">{description}</p>
      <Link
        href="/menh-vi"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-mv-border px-4 py-2 text-body-sm text-mv-text-secondary transition-colors duration-fast hover:border-mv-gold/40 hover:text-mv-text"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Về Hôm nay
      </Link>
    </div>
  );
}
