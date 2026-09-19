'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './nav-items';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { useAuth } from '@/providers/auth-provider';

// Accessibility + Product Polish (2026-08-19): tablet (768-1279px) previously fell through this
// component's `desktop:flex`/`desktop:hidden` binary switch (shared with MobileNavigation) to the
// phone's fixed bottom-tab nav — open since Sprint 4B, Roadmap V2 P1 item 8. Now renders a compact
// icon-rail at `tablet:` (768px) and the full labeled sidebar at `desktop:` (1280px) — same
// NAV_ITEMS, same active-state logic, same icons, no new visual language. Item labels use
// `sr-only`/`not-sr-only` (never `hidden`) at the rail width so every icon-only link keeps a real
// accessible name.
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const premiumQuery = usePremiumStatus({ enabled: !!user });

  return (
    <nav
      aria-label="Điều hướng chính"
      className="hidden w-16 shrink-0 flex-col items-center gap-6 border-r border-[rgba(213,173,98,0.16)] bg-canvas/95 px-2 py-6 tablet:flex desktop:w-56 desktop:items-stretch desktop:px-4"
    >
      <Link href="/" aria-label="Mệnh Vi" className="flex items-center justify-center px-2 desktop:justify-start">
        <Logo withWordmark={false} className="desktop:hidden" />
        <Logo className="hidden desktop:flex" />
      </Link>
      <ul className="flex w-full flex-col items-center gap-1 desktop:items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="w-full">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-3 rounded-md px-3 py-2 text-body-md transition-colors duration-fast desktop:justify-start',
                  active
                    ? // Subtle indigo wash + a thin antique-gold outline — not a bright fill.
                      'bg-[#4b3f9e]/[0.14] text-text-primary ring-1 ring-inset ring-[#d5ad62]/30'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-text-primary',
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
      {premiumQuery.data && !premiumQuery.data.isPremium && premiumQuery.data.paymentsEnabled && (
        <Link
          href="/premium"
          className="mt-auto hidden w-full flex-col gap-2 rounded-md border border-insight/25 bg-gradient-to-b from-insight/10 to-transparent p-4 text-left transition-colors hover:border-insight/45 desktop:flex"
        >
          <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-insight">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Mệnh Vi+
          </span>
          <span className="text-caption leading-relaxed text-text-secondary">
            Mở khóa toàn bộ tính năng và trải nghiệm chuyên sâu.
          </span>
          <span className="mt-1 inline-flex min-h-9 items-center justify-center rounded-md bg-insight px-3 text-caption font-semibold text-canvas">
            Nâng cấp ngay
          </span>
        </Link>
      )}
    </nav>
  );
}
