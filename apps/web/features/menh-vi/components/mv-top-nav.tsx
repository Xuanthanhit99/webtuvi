'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Gift, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MvLogo } from './mv-logo';
import { MV_TOP_NAV } from '../lib/nav-items';

export function MvTopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-dropdown hidden border-b border-mv-border bg-mv-bg/70 backdrop-blur-md tablet:block">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/menh-vi" aria-label="Mệnh Vi — Hôm nay">
          <MvLogo />
        </Link>

        <nav aria-label="Điều hướng chính" className="flex items-center gap-0.5 mv-wide:gap-1">
          {MV_TOP_NAV.map((item) => {
            const active = item.href === '/menh-vi' ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={item.label}
                className={cn(
                  'relative flex items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-2 text-body-sm font-medium transition-colors duration-fast mv-wide:px-3',
                  active ? 'text-mv-text' : 'text-mv-text-secondary hover:text-mv-text',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 mv-wide:hidden" aria-hidden="true" />
                <span className="hidden mv-wide:inline">{item.label}</span>
                {active && <span className="absolute inset-x-2.5 -bottom-[1px] h-0.5 rounded-full bg-mv-gold mv-wide:inset-x-3" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Tìm kiếm"
            className="rounded-full p-2 text-mv-text-secondary transition-colors duration-fast hover:bg-mv-surface hover:text-mv-text"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Ưu đãi"
            className="rounded-full p-2 text-mv-text-secondary transition-colors duration-fast hover:bg-mv-surface hover:text-mv-text"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Thông báo"
            className="relative rounded-full p-2 text-mv-text-secondary transition-colors duration-fast hover:bg-mv-surface hover:text-mv-text"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-mv-violet" />
          </button>
          <Link
            href="/menh-vi/toi"
            className="ml-1 flex items-center gap-2 rounded-full border border-mv-border py-1 pl-1 pr-3 text-body-sm text-mv-text transition-colors duration-fast hover:border-mv-gold/40"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mv-violet/30 text-caption font-semibold text-mv-text">
              T
            </span>
            <span className="hidden desktop:inline">Thành</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
