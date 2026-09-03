'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { Calendar, Moon, Play } from 'lucide-react';
import type { TuViChartDto } from '@beaconvie/types';
import { useHeroParallax } from './use-hero-parallax';
import { HOME_BACKGROUND } from './production-assets';
import { DailyFlowPanel, DailyFlowPanelLocked } from './daily-flow-panel';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Static fallback — the lunar date and "mệnh khí" score are real almanac/personal-energy data
 * that a lunar-calendar / Eastern Horoscope engine would compute; that engine is backend-only
 * today and not exposed to the web app (see CLAUDE.md — Eastern Horoscope is spec'd but not
 * built). The weekday/date next to them IS real, computed client-side below. Swap the two
 * fallback values for real data once a Home data contract exists — do not compute them here.
 */
function HeroStatusBar({ isGuest }: { isGuest: boolean }) {
  const todayLabel = useMemo(() => {
    const formatted = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5 text-caption text-[#d8d1c2]">
      <span className="inline-flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-[#e6c980]" aria-hidden="true" />
        {todayLabel}
      </span>
      {/* Lunar date / "mệnh khí" are personal-energy data — shown as static fallback for a
          signed-in user (see the comment above), skipped entirely for a guest who has no account
          for either to describe. */}
      {!isGuest && (
        <>
          <span className="h-3.5 w-px bg-white/15" aria-hidden="true" />
          <span className="inline-flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-[#e6c980]" aria-hidden="true" />
            Âm lịch: đang cập nhật
          </span>
          <span className="h-3.5 w-px bg-white/15" aria-hidden="true" />
          <span>
            Mệnh khí của bạn: <span className="font-semibold text-[#e6c980]">đang cập nhật</span>
          </span>
        </>
      )}
    </div>
  );
}

export function HomeHero({
  authLoading,
  isGuest,
  userName,
  greeting,
  dashboardLoading,
  dashboardError,
  dailyText,
  onRetryDashboard,
  tuViChart,
  tuViLoading,
}: {
  authLoading: boolean;
  isGuest: boolean;
  userName: string;
  greeting: string;
  dashboardLoading: boolean;
  dashboardError: boolean;
  dailyText?: string;
  onRetryDashboard: () => void;
  tuViChart: TuViChartDto | null;
  tuViLoading: boolean;
}) {
  const parallaxRef = useHeroParallax<HTMLElement>();

  return (
    <section
      ref={parallaxRef}
      aria-labelledby="home-hero-heading"
      className="relative isolate overflow-hidden rounded-[22px] border border-white/[0.08] px-5 py-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] min-[430px]:py-7 tablet:px-8 tablet:py-11 desktop:min-h-[580px] desktop:px-12 desktop:py-14"
    >
      {/* The user's personal destiny space, not a marketing banner — production hero scenery
          (mountains, lake, moon, the celestial wheel already painted into the sky) with a light
          pointer-parallax drift, off under `prefers-reduced-motion`. */}
      <Image
        src={HOME_BACKGROUND.hero}
        alt=""
        aria-hidden="true"
        fill
        priority
        // Verified against the actual /_next/image output (not just assumed): Next.js never
        // upscales past a source's natural size — w=1080 and w=3840 both return the identical
        // native 895x472 JPEG. Below native, though, it DOES downscale for real (w=256→256x135,
        // w=640→640x338), so an overly "precise" sizes hint can backfire on this undersized
        // source — e.g. calc(100vw-128px) dips to exactly 640px at the 768px tablet breakpoint,
        // which would land BELOW the 895px native width and throw away real detail for no
        // reason. Simpler and safer: 100vw on phones (where the hero genuinely is small and
        // downscaling is correct), a flat 1248px from tablet up — anything ≥895px lands in the
        // native-cap zone and costs the same bytes as asking for more.
        sizes="(max-width: 767px) 100vw, 1248px"
        className="object-cover object-[62%_center] tablet:object-center"
        style={{ transform: 'scale(1.05) translate(calc(var(--px, 0) * 3px), calc(var(--py, 0) * 3px))' }}
      />
      {/* A soft glow behind the wheel already painted into the scene, so it reads as an
          integrated part of the sky rather than a flat backdrop — not a second wheel layered on
          top, just atmosphere. Static; the scenery itself carries the only motion. */}
      <div
        className="pointer-events-none absolute -top-[8%] right-[8%] h-[55%] w-[42%] opacity-70 mix-blend-screen"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(243,217,152,0.22), transparent 70%)' }}
        aria-hidden="true"
      />
      {/* Legibility scrim — a directional gradient anchored to the copy column, kept light enough
          that the moon/mountains/lake stay visible through it rather than a dark wash over the
          whole scene. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(100deg, rgba(5,8,14,0.28) 0%, rgba(5,8,14,0.12) 34%, rgba(5,8,14,0.01) 58%, rgba(5,8,14,0.08) 100%)' }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-[#050810]/18 to-transparent" />

      <div className="relative z-10 flex h-full w-full flex-col justify-center">
        <div className="grid gap-6 tablet:grid-cols-[1.3fr_1fr] tablet:gap-12 tablet:items-center">
          <div className="max-w-lg">
            {authLoading ? (
              <Skeleton className="mb-5 h-16 w-56 bg-white/10" />
            ) : isGuest ? (
              <>
                <p className="text-body-sm font-medium text-[#e6c980]">Chào mừng bạn đến với</p>
                <h1 id="home-hero-heading" className="mt-2 font-display text-[clamp(2.1rem,3.6vw,3.4rem)] font-semibold leading-[1.1] text-[#f2eee5]">
                  Mệnh Vi
                </h1>
              </>
            ) : (
              <>
                <p className="text-body-md text-[#e6c980]">{greeting}</p>
                <h1 id="home-hero-heading" className="mt-2 font-display text-[clamp(2.3rem,4vw,4rem)] font-semibold leading-[1.1] text-[#f2eee5]">
                  {userName}
                </h1>
              </>
            )}
            <p className="mt-3 max-w-md text-body-sm leading-relaxed text-[#d8d1c2] tablet:mt-4">
              {isGuest
                ? 'Đăng nhập để xem Dòng chảy hôm nay, lưu lá số và tiếp tục hành trình của riêng bạn.'
                : 'Mỗi ngày là một cơ hội mới để hiểu mình hơn và sống tốt hơn.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 tablet:mt-6">
              <Link
                href={isGuest ? '/login?next=%2F' : '/discover'}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d5ad62] px-5 text-body-sm font-semibold text-[#070b12] transition-colors hover:bg-[#e6c980]"
              >
                {isGuest ? 'Đăng nhập' : 'Xem vận hôm nay'}
              </Link>
              <Link
                href={isGuest ? '/register?next=%2F' : '/companion'}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d5ad62]/35 bg-[#0b1220]/50 px-5 text-body-sm font-semibold text-[#e6c980] transition-colors hover:border-[#d5ad62]/60"
              >
                {isGuest ? 'Tạo tài khoản' : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" /> Khám phá thêm
                  </>
                )}
              </Link>
            </div>
          </div>

          {/* "Dòng chảy hôm nay" — a translucent glass panel inside the Hero, always present so
              the two-column composition holds for every visitor. Guests see a locked teaser (no
              chart/account to summarize yet); authenticated users get real status (loading/error/
              no-chart) plus 3 illustrative flow signals. */}
          <div className="w-full max-w-[360px] tablet:ml-auto">
            {isGuest ? (
              <DailyFlowPanelLocked />
            ) : (
              <DailyFlowPanel
                loading={dashboardLoading}
                error={dashboardError}
                text={dailyText}
                onRetry={onRetryDashboard}
                tuViChart={tuViChart}
                tuViLoading={tuViLoading}
              />
            )}
          </div>
        </div>

        <div className="hidden tablet:block">
          <HeroStatusBar isGuest={isGuest} />
        </div>
      </div>
    </section>
  );
}
