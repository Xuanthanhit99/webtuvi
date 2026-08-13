'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Sparkles, Smartphone } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MV_SIDEBAR_NAV } from '../lib/nav-items';

/**
 * Desktop left sidebar — reference structure (docs/design/menh-vi-reference-breakdown.md
 * Round 2: reference fidelity supersedes the earlier "no SaaS sidebar" call). Desktop-only;
 * mobile keeps its own separate bottom-nav composition, unaffected.
 */
export function MvSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[232px] shrink-0 flex-col overflow-y-auto border-r border-mv-border bg-mv-elevated/60 px-3 py-4 desktop:flex">
      <nav aria-label="Điều hướng Mệnh Vi" className="flex flex-col gap-0.5">
        {MV_SIDEBAR_NAV.map((item) => {
          const active = item.href === '/menh-vi' ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm transition-colors duration-fast',
                active ? 'bg-mv-violet/15 font-medium text-mv-gold' : 'text-mv-text-secondary hover:bg-mv-surface hover:text-mv-text',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col gap-2.5">
        <div className="rounded-xl border border-mv-gold/20 bg-mv-surface/60 p-3.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mv-gold/15">
            <Sparkles className="h-3.5 w-3.5 text-mv-gold" aria-hidden="true" />
          </span>
          <p className="mt-2.5 text-caption font-semibold uppercase tracking-wider text-mv-gold">Mệnh Vi Premium</p>
          <p className="mt-1 text-caption text-mv-text-secondary">
            Mở khóa toàn bộ luận giải chuyên sâu và tính năng nâng cao.
          </p>
          <button
            type="button"
            className="mt-2.5 w-full rounded-full bg-mv-gold px-3 py-1.5 text-caption font-semibold text-mv-bg transition-transform duration-fast hover:scale-[1.02]"
          >
            Nâng cấp ngay
          </button>
        </div>

        <div className="rounded-xl border border-mv-border bg-mv-surface/60 p-3.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mv-violet/15">
            <Smartphone className="h-3.5 w-3.5 text-mv-violet-secondary" aria-hidden="true" />
          </span>
          <p className="mt-2.5 text-caption font-semibold text-mv-text">Mệnh Vi trên mobile</p>
          <p className="mt-1 text-caption text-mv-text-secondary">Trải nghiệm đầy đủ mọi tính năng trên ứng dụng di động.</p>
          <div className="mt-2.5 flex gap-2 text-[10px] text-mv-text-secondary">
            <span className="rounded-md border border-mv-border px-2 py-1">App Store</span>
            <span className="rounded-md border border-mv-border px-2 py-1">Google Play</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
