'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Logo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/cn';
import { DashboardView } from './dashboard-view';

const guestLinks = [
  { label: 'Tử Vi', href: '#try-tu-vi' },
  { label: 'Tarot', href: '#try-tarot' },
  { label: 'Bản đồ sao', href: '#features-heading' },
  { label: 'Thần số học', href: '#try-numerology' },
  { label: 'Khám phá', href: '#editorial-heading' },
];

export function HomeRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main id="main-content" className="min-h-dvh bg-[#070b12] px-4 py-6 text-[#f2eee5]">
        <div className="mx-auto flex w-full max-w-content flex-col gap-6">
          <Skeleton className="h-12 w-40 bg-white/10" />
          <Skeleton className="h-[520px] w-full rounded-[24px] bg-white/10" />
        </div>
      </main>
    );
  }

  if (user) {
    return (
      <AppShell>
        <DashboardView />
      </AppShell>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#070b12] text-[#f2eee5]">
      <GuestHeader />
      {/* V8 (Board 01 reference-fidelity): no top padding here — the Hero is now a full-bleed
          section (see HomeHero's isGuest branch in dashboard-view.tsx) that must sit flush under
          the sticky, transparent-until-scrolled header so header + hero read as one continuous
          canvas, not "header, then a gap, then a boxed card." Everything after the Hero still gets
          its own horizontal padding from the max-w wrapper below. */}
      <main id="main-content" className="pb-16">
        <div className="mx-auto w-full max-w-[1360px] px-4 tablet:px-8">
          <DashboardView />
        </div>
      </main>
    </div>
  );
}

function GuestHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-drawer border-b transition-colors duration-standard',
        scrolled ? 'border-white/10 bg-[#070b12]/85 backdrop-blur' : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex min-h-16 max-w-[1360px] items-center justify-between gap-4 px-4 tablet:px-8">
        <Link href="/" aria-label="Tử Vi Tarot" className="flex shrink-0 items-center gap-3">
          <Logo withWordmark={false} />
          <span className="font-display text-body-lg font-semibold text-[#f2eee5]">Tử Vi Tarot</span>
        </Link>

        <nav aria-label="Tử Vi Tarot" className="hidden items-center gap-6 desktop:flex">
          {guestLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-body-sm text-[#a6a7ac] transition-colors hover:text-[#f2eee5]">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login?next=%2F" className="hidden min-h-11 items-center text-body-sm font-semibold text-[#a6a7ac] hover:text-[#f2eee5] tablet:inline-flex">
            Đăng nhập
          </Link>
          <Link
            href="/register?next=%2F"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#d5ad62] px-4 text-body-sm font-semibold text-[#070b12] hover:bg-[#e6c980]"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </div>
    </header>
  );
}
