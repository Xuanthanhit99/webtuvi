'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Gift, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MvLogo } from './mv-logo';
import { MV_TOP_NAV } from '../lib/nav-items';

// Compact tablet nav (768–1439px) shows only the top-priority destinations as labels; the rest
// live behind the "Thêm" trigger. Full labeled nav returns at mv-wide (1440px+).
const PRIMARY_COUNT = 3;

function isActive(pathname: string | null, href: string) {
  return href === '/menh-vi' ? pathname === href : (pathname?.startsWith(href) ?? false);
}

export function MvTopNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const primaryItems = MV_TOP_NAV.slice(0, PRIMARY_COUNT);
  const moreItems = MV_TOP_NAV.slice(PRIMARY_COUNT);
  const moreActive = moreItems.some((item) => isActive(pathname, item.href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  return (
    <header className="sticky top-0 z-dropdown hidden border-b border-mv-border bg-mv-bg/70 backdrop-blur-md tablet:block">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/menh-vi" aria-label="Mệnh Vi — Hôm nay">
          <MvLogo />
        </Link>

        {/* Full labeled nav — desktop 1440px+ */}
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 mv-wide:flex">
          {MV_TOP_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative whitespace-nowrap rounded-md px-3 py-2 text-body-sm font-medium transition-colors duration-fast',
                  active ? 'text-mv-text' : 'text-mv-text-secondary hover:text-mv-text',
                )}
              >
                {item.label}
                {active && <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-mv-gold" />}
              </Link>
            );
          })}
        </nav>

        {/* Compact tablet nav — 768–1439px: top destinations by label + "Thêm" for the rest */}
        <nav aria-label="Điều hướng chính" className="flex items-center gap-0.5 mv-wide:hidden">
          {primaryItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative whitespace-nowrap rounded-md px-2.5 py-2 text-body-sm font-medium transition-colors duration-fast',
                  active ? 'text-mv-text' : 'text-mv-text-secondary hover:text-mv-text',
                )}
              >
                {item.label}
                {active && <span className="absolute inset-x-2.5 -bottom-[1px] h-0.5 rounded-full bg-mv-gold" />}
              </Link>
            );
          })}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={cn(
                'relative flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-2 text-body-sm font-medium transition-colors duration-fast',
                moreActive || moreOpen ? 'text-mv-text' : 'text-mv-text-secondary hover:text-mv-text',
              )}
            >
              Thêm
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform duration-fast', moreOpen && 'rotate-180')}
                aria-hidden="true"
              />
              {moreActive && <span className="absolute inset-x-2.5 -bottom-[1px] h-0.5 rounded-full bg-mv-gold" />}
            </button>

            {moreOpen && (
              <div
                role="menu"
                aria-label="Thêm điều hướng"
                className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-mv-border bg-mv-elevated py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
              >
                {moreItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={cn(
                        'flex items-center gap-2.5 px-3.5 py-2 text-body-sm transition-colors duration-fast',
                        active ? 'text-mv-gold' : 'text-mv-text-secondary hover:bg-mv-surface hover:text-mv-text',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
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
