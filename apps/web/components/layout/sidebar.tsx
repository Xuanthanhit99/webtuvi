'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav-items';

// Accessibility + Product Polish (2026-08-19): tablet (768-1279px) previously fell through this
// component's `desktop:flex`/`desktop:hidden` binary switch (shared with MobileNavigation) to the
// phone's fixed bottom-tab nav — open since Sprint 4B, Roadmap V2 P1 item 8. Now renders a compact
// icon-rail at `tablet:` (768px) and the full labeled sidebar at `desktop:` (1280px) — same
// NAV_ITEMS, same active-state logic, same icons, no new visual language. Item labels use
// `sr-only`/`not-sr-only` (never `hidden`) at the rail width so every icon-only link keeps a real
// accessible name.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="hidden w-16 shrink-0 flex-col items-center gap-6 border-r border-border-subtle bg-canvas px-2 py-6 tablet:flex desktop:w-60 desktop:items-stretch desktop:px-4"
    >
      <Link href="/dashboard" aria-label="Tử Vi Tarot" className="flex items-center justify-center px-2 desktop:justify-start">
        <Logo withWordmark={false} className="desktop:hidden" />
        <Logo className="hidden desktop:flex" />
      </Link>
      <ul className="flex w-full flex-col items-center gap-1 desktop:items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="w-full">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-3 rounded-md px-3 py-2 text-body-md transition-colors duration-fast desktop:justify-start',
                  active
                    ? 'bg-surface text-text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sr-only flex-1 desktop:not-sr-only">{item.label}</span>
                {item.comingSoon && (
                  <Badge variant="neutral" className="hidden shrink-0 desktop:inline-flex">
                    Soon
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
