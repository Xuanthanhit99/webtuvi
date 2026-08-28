'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Play, Sparkles } from 'lucide-react';
import type {
  ClientAnalyticsEventName,
  NatalChartDto,
  NumerologyReadingDto,
  TarotReadingDto,
  TuViChartDto,
  TuViCurrentTieuHanDto,
  TuViDaiVanCycleDto,
} from '@beaconvie/types';
import { calculateLifePathNumber } from '@beaconvie/types/numerology';
import { dashboardApi } from '../api/dashboard-api';
import { DestinyOrbit } from './home/destiny-orbit';
import { useHeroParallax } from './home/use-hero-parallax';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/providers/auth-provider';
import { tarotApi } from '@/features/tarot/api/tarot-api';
import { numerologyApi } from '@/features/numerology/api/numerology-api';
import { natalChartApi } from '@/features/natal-chart/api/natal-chart-api';
import { tuViApi } from '@/features/tu-vi/api/tu-vi-api';
import { readGuestNumerologyTrial, readGuestTarotTrial, saveGuestNumerologyTrial, saveGuestTarotTrial } from '@/features/guest-trials/guest-trial-storage';
import { cn } from '@/lib/cn';
import { trackEvent } from '@/lib/analytics';

const HOME_ASSET_BASE = '/assets/menh-vi/home';
/**
 * The founder-approved Board 01 reference art (hero mountains/mist/clouds and the 4 small
 * circular icon badges) lives at this path — see
 * apps/web/public/assets/menh_vi_board01_generated_assets/README.txt and manifest.json. The
 * Destiny Wheel is hand-authored SVG — see `home/destiny-orbit.tsx`.
 */
const BOARD01_ASSET_BASE = '/assets/menh_vi_board01_generated_assets';

/**
 * PRODUCTION FEATURE-ART ASSET CONTRACT (2026-08-26): after two rejected hand-SVG passes
 * (`home/feature-illustrations.tsx`, kept on disk but no longer imported — rollback only, not
 * production), the art direction is now HYBRID: Hero + feature illustrations are commissioned
 * raster, Destiny Wheel + UI glyphs stay SVG. The founder will supply transparent-background
 * artwork at:
 *
 *   apps/web/public/assets/menh-vi/features/feature-tuvi.webp
 *   apps/web/public/assets/menh-vi/features/feature-tarot.webp
 *   apps/web/public/assets/menh-vi/features/feature-natal.webp
 *   apps/web/public/assets/menh-vi/features/feature-numerology.webp
 *
 * Recommended spec for whoever produces that art: ~1024×1024 (or the card's own ~4:5), true
 * alpha transparency (PNG or lossless WebP — matches every existing Board 01 asset, verified via
 * PNG IHDR earlier in this project), main subject weighted toward the bottom-right third with at
 * least ~15% clear transparent margin on the other edges so it can bleed into the card's alpha
 * mask (see FeatureCard/guest-try components below) without a visible hard crop line.
 *
 * Until that art lands, this points at the pre-existing approved Board 01 raster
 * (06/07/09/10_feature_*.webp) as an honest interim placeholder, per the founder's explicit
 * instruction to use the previous approved asset rather than a generic icon or a fabricated
 * "final" claim. Swap only the values below when the new files exist — no other code changes
 * should be needed, since the card/mask treatment is already built for this contract.
 */
/**
 * HD ART INTEGRATION (2026-08-27): founder-approved 1254×1254 RGBA replacements for the
 * previous sub-400px placeholders — see HD_FEATURE_ART_BRIEF.md in BOARD01_ASSET_BASE for the
 * brief this was delivered against. Old `07/06/09/10_feature_*.webp` files are left on disk,
 * unreferenced, in case of rollback.
 */
const FEATURE_ART_ASSET: Record<'tu_vi' | 'tarot' | 'natal_chart' | 'numerology', string> = {
  tu_vi: `${BOARD01_ASSET_BASE}/07_feature_tuvi_pagoda.webp`,
  tarot: `${BOARD01_ASSET_BASE}/06_feature_tarot_cards.webp`,
  natal_chart: `${BOARD01_ASSET_BASE}/09_feature_natal_orbit.webp`,
  numerology: `${BOARD01_ASSET_BASE}/10_feature_numerology.webp`,
};

const FEATURE_ICON_ASSET: Record<'tu_vi' | 'tarot' | 'natal_chart' | 'numerology', string> = {
  tu_vi: '02_icon_tuvi',
  tarot: '03_icon_tarot',
  natal_chart: '04_icon_natal',
  numerology: '05_icon_numerology',
};

/**
 * HD ART INTEGRATION: the previous per-asset multipliers here were calibrated against the old
 * sub-400px files' four different native aspect ratios — not valid for the new HD set, which is
 * a uniform 1254×1254 (1:1) across all four, so `object-contain` alone already gives identical
 * optical footprints without any correction. Reset to neutral; re-tune only if live inspection
 * shows an actual mismatch (it doesn't — verified below).
 */
const FEATURE_ART_SCALE: Record<'tu_vi' | 'tarot' | 'natal_chart' | 'numerology', number> = {
  tu_vi: 1,
  tarot: 1,
  natal_chart: 1,
  numerology: 1,
};
/**
 * Sparse hero sky stars — [xPercent, yPercent, radius, opacity].
 * V9 COMPOSITION PASS: added 8 more, weighted toward the very top strip (y 1-6%) — the founder's
 * "upper sky reads too empty" call-out — plus 2 slightly larger accent stars for a touch of
 * variety. Still a scatter of plain dots, not an illustration.
 */
const HERO_STARS = [
  [6, 10, 1.4, 0.55],
  [16, 24, 1, 0.4],
  [28, 6, 1.2, 0.45],
  [40, 30, 0.9, 0.35],
  [52, 14, 1.3, 0.5],
  [64, 34, 1, 0.4],
  [76, 8, 1.1, 0.45],
  [88, 26, 1.4, 0.5],
  [96, 12, 0.9, 0.35],
  [12, 42, 1, 0.4],
  [34, 48, 1.2, 0.4],
  [58, 44, 0.9, 0.35],
  [3, 3, 1.1, 0.4],
  [22, 2, 0.9, 0.35],
  [46, 4, 1, 0.4],
  [68, 2, 1.6, 0.5],
  [82, 4, 0.9, 0.32],
  [98, 3, 1.1, 0.38],
  [44, 20, 1.7, 0.55],
  [8, 32, 1.6, 0.48],
] as const;
const HOME_QUERY_OPTIONS = {
  enabled: false,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
};

type FeatureAnalyticsEvent = Extract<
  ClientAnalyticsEventName,
  'home_tuvi_clicked' | 'home_tarot_clicked' | 'home_astrology_clicked' | 'home_numerology_clicked'
>;

interface HomeArticle {
  category: string;
  slug: string;
  title: string;
  readTime: string;
  image: string;
  href: string;
}

const natalSignLabels: Record<string, string> = {
  aries: 'Bạch Dương',
  taurus: 'Kim Ngưu',
  gemini: 'Song Tử',
  cancer: 'Cự Giải',
  leo: 'Sư Tử',
  virgo: 'Xử Nữ',
  libra: 'Thiên Bình',
  scorpio: 'Bọ Cạp',
  sagittarius: 'Nhân Mã',
  capricorn: 'Ma Kết',
  aquarius: 'Bảo Bình',
  pisces: 'Song Ngư',
};

const editorialFallbacks: HomeArticle[] = [
  {
    category: 'Tử Vi',
    slug: 'tu-vi-cung-menh',
    title: 'Hiểu về cung Mệnh trong lá số Tử Vi',
    readTime: '5 phút đọc',
    image: `${HOME_ASSET_BASE}/article-tuvi.png`,
    href: '/discover/tu-vi',
  },
  {
    category: 'Tarot',
    slug: 'tarot-the-star',
    title: 'Ý nghĩa lá The Star trong hành trình chữa lành',
    readTime: '7 phút đọc',
    image: `${HOME_ASSET_BASE}/article-tarot.png`,
    href: '/discover/tarot',
  },
  {
    category: 'Chiêm tinh',
    slug: 'astrology-venus-retrograde',
    title: 'Sao Kim nghịch hành tác động đến tình cảm',
    readTime: '6 phút đọc',
    image: `${HOME_ASSET_BASE}/article-astrology.png`,
    href: '/discover/natal-chart',
  },
  {
    category: 'Thần số',
    slug: 'numerology-life-path-8',
    title: 'Con số chủ đạo 8: Tham vọng & Trách nhiệm',
    readTime: '5 phút đọc',
    image: `${HOME_ASSET_BASE}/article-numerology.png`,
    href: '/discover/numerology',
  },
];

const guestTarotCards = [
  { name: 'The Star', meaning: 'Một tín hiệu về hy vọng, chữa lành và niềm tin đang trở lại.' },
  { name: 'The Magician', meaning: 'Bạn đã có đủ công cụ để bắt đầu, điều cần nhất là hành động rõ ràng.' },
  { name: 'Temperance', meaning: 'Sự cân bằng đang quan trọng hơn tốc độ. Hãy điều chỉnh nhịp của mình.' },
];

function latest<T extends { createdAt: string }>(items: T[] | undefined): T | null {
  if (!items || items.length === 0) return null;
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}

function getLifePath(reading: NumerologyReadingDto | null): number | null {
  return reading?.values.find((value) => value.type === 'LIFE_PATH')?.value ?? null;
}

function getPlacementSign(chart: NatalChartDto | null, body: 'sun' | 'moon'): string | null {
  const sign = chart?.placements.find((placement) => placement.body === body)?.sign;
  return sign ? natalSignLabels[sign] ?? null : null;
}

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng,';
  if (hour < 18) return 'Chào buổi chiều,';
  return 'Chào buổi tối,';
}

function firstName(displayName?: string | null): string {
  const trimmed = displayName?.trim();
  if (!trimmed) return 'Bạn';
  return trimmed.split(/\s+/)[0] ?? 'Bạn';
}

type ContinuityItem = {
  kind: 'tarot' | 'natal' | 'numerology';
  createdAt: string;
  title: string;
  description: string;
  href: string;
};

function buildContinuityItem(
  tarotReading: TarotReadingDto | null,
  natalChart: NatalChartDto | null,
  numerologyReading: NumerologyReadingDto | null,
  sunSign: string | null,
  moonSign: string | null,
  lifePath: number | null,
): ContinuityItem | null {
  const items: ContinuityItem[] = [];
  if (tarotReading) {
    items.push({
      kind: 'tarot',
      createdAt: tarotReading.createdAt,
      title: 'Tarot gần nhất',
      description: `${tarotReading.spreadName}${tarotReading.cards[0]?.card.name ? ` · ${tarotReading.cards[0].card.name}` : ''}`,
      href: '/discover/tarot',
    });
  }
  if (natalChart) {
    items.push({
      kind: 'natal',
      createdAt: natalChart.createdAt,
      title: 'Bản đồ sao gần nhất',
      description: `Mặt Trời ${sunSign ?? 'đã tính'} · Mặt Trăng ${moonSign ?? 'đã tính'}`,
      href: '/discover/natal-chart',
    });
  }
  if (numerologyReading && lifePath !== null) {
    items.push({
      kind: 'numerology',
      createdAt: numerologyReading.createdAt,
      title: 'Thần số học gần nhất',
      description: `Con số chủ đạo ${lifePath}`,
      href: '/discover/numerology',
    });
  }
  if (items.length === 0) return null;
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}

function formatDaiVan(cycle: TuViDaiVanCycleDto | null): string | null {
  if (!cycle) return null;
  return `${cycle.ageStart}–${cycle.ageEnd} tuổi · Cung ${cycle.role} tại ${cycle.position}`;
}

function formatTieuHan(tieuHan: TuViCurrentTieuHanDto | null): string | null {
  if (!tieuHan) return null;
  return `${tieuHan.tuoi} tuổi (Âm lịch ${tieuHan.lunarYear}) · Cung ${tieuHan.palace}`;
}

export function DashboardView() {
  const { user, isLoading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;

  const dashboardQuery = useQuery({
    ...HOME_QUERY_OPTIONS,
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    enabled: !!user,
  });
  const tarotQuery = useQuery({
    ...HOME_QUERY_OPTIONS,
    queryKey: ['tarot', 'readings', 'home-latest'],
    queryFn: () => tarotApi.listReadings({ status: 'ACTIVE', page: 1, pageSize: 1 }),
    enabled: !!user,
  });
  const tuViQuery = useQuery({
    ...HOME_QUERY_OPTIONS,
    queryKey: ['tu-vi', 'charts', 'home-latest'],
    queryFn: () => tuViApi.listCharts({ status: 'ACTIVE', page: 1, pageSize: 1 }),
    enabled: !!user,
  });
  const natalQuery = useQuery({
    ...HOME_QUERY_OPTIONS,
    queryKey: ['natal-charts', 'home-latest'],
    queryFn: () => natalChartApi.listCharts({ status: 'ACTIVE', page: 1, pageSize: 1 }),
    enabled: !!user,
  });
  const numerologyQuery = useQuery({
    ...HOME_QUERY_OPTIONS,
    queryKey: ['numerology', 'readings', 'home-latest'],
    queryFn: () => numerologyApi.listReadings({ status: 'ACTIVE', page: 1, pageSize: 1 }),
    enabled: !!user,
  });

  const greeting = useMemo(() => greetingForNow(), []);
  const tuViChart = latest<TuViChartDto>(tuViQuery.data?.items);
  const tarotReading = latest<TarotReadingDto>(tarotQuery.data?.items);
  const natalChart = latest<NatalChartDto>(natalQuery.data?.items);
  const numerologyReading = latest<NumerologyReadingDto>(numerologyQuery.data?.items);
  const lifePath = getLifePath(numerologyReading);
  const sunSign = getPlacementSign(natalChart, 'sun');
  const moonSign = getPlacementSign(natalChart, 'moon');
  const continuityItem = buildContinuityItem(tarotReading, natalChart, numerologyReading, sunSign, moonSign, lifePath);
  const continuityLoading = !isGuest && (tarotQuery.isLoading || natalQuery.isLoading || numerologyQuery.isLoading);

  useEffect(() => {
    if (authLoading) return;
    trackEvent('home_viewed', { feature: 'home', source: isGuest ? 'guest' : 'authenticated' });
  }, [authLoading, isGuest]);

  return (
    <div className="relative flex flex-col gap-7 text-[#f2eee5] tablet:gap-8 desktop:gap-9">
      <PageAtmosphere />
      <HomeHero
        authLoading={authLoading}
        isGuest={isGuest}
        userName={firstName(user?.displayName)}
        greeting={greeting}
        dashboardLoading={dashboardQuery.isLoading}
        dashboardError={dashboardQuery.isError}
        onRetryDashboard={() => dashboardQuery.refetch()}
        dailyText={dashboardQuery.data?.discoverySuggestion?.description}
        tuViChart={tuViChart}
        tuViLoading={!isGuest && tuViQuery.isLoading}
      />

      <section aria-labelledby="features-heading" className="space-y-3">
        <SectionHeading
          id="features-heading"
          eyebrow={isGuest ? '' : 'Khám phá nhanh'}
          title={isGuest ? 'Khám phá 4 hệ thống chính' : 'Tử Vi · Tarot · Bản đồ sao · Thần số học'}
        />
        <div className="grid grid-cols-2 gap-2.5 tablet:gap-3 desktop:grid-cols-4">
          <FeatureCard
            title="Lá số Tử Vi"
            description={isGuest ? 'Khám phá lá số của bạn, rồi đăng nhập để lưu lá số đầy đủ.' : tuViChart ? `Mệnh an tại ${tuViChart.palaces.menh}.` : 'Bản đồ vận mệnh theo Tử Vi Đẩu Số.'}
            cta={isGuest ? 'Bắt đầu' : tuViChart ? 'Xem lá số' : 'Lập lá số'}
            href={isGuest ? '#try-tu-vi' : '/discover/tu-vi'}
            loading={!isGuest && tuViQuery.isLoading}
            error={tuViQuery.isError ? 'Không thể tải lá số.' : undefined}
            onRetry={() => tuViQuery.refetch()}
            analyticsEvent="home_tuvi_clicked"
            analyticsFeature="tu_vi"
            asset="tu_vi"
            surface={CARD_SURFACE}
            accent="radial-gradient(circle at 82% 78%, rgba(198,146,67,0.22), transparent 62%)"
          />
          <FeatureCard
            title="Tarot"
            description={
              isGuest
                ? 'Một lá bài cho câu hỏi hôm nay.'
                : tarotReading
                ? `Gần nhất: ${tarotReading.spreadName}${tarotReading.cards[0]?.card.name ? ` · ${tarotReading.cards[0].card.name}` : ''}.`
                : 'Một lá bài cho câu hỏi của bạn.'
            }
            cta={isGuest ? 'Rút một lá' : tarotReading ? 'Xem trải bài' : 'Rút bài'}
            href={isGuest ? '#try-tarot' : '/discover/tarot'}
            loading={!isGuest && tarotQuery.isLoading}
            error={tarotQuery.isError ? 'Không thể tải lịch sử Tarot.' : undefined}
            onRetry={() => tarotQuery.refetch()}
            analyticsEvent="home_tarot_clicked"
            analyticsFeature="tarot"
            asset="tarot"
            surface={CARD_SURFACE}
            accent="radial-gradient(circle at 82% 78%, rgba(122,142,168,0.22), transparent 62%)"
          />
          <FeatureCard
            title="Bản đồ sao"
            description={
              isGuest
                ? 'Khám phá bầu trời lúc bạn sinh ra.'
                : natalChart
                ? `Mặt Trời ${sunSign ?? 'đã tính'} · Mặt Trăng ${moonSign ?? 'đã tính'}.`
                : 'Cần ngày, giờ và nơi sinh để lập bản đồ.'
            }
            cta={isGuest ? 'Tìm hiểu' : natalChart ? 'Xem bản đồ' : 'Tạo bản đồ'}
            href={isGuest ? '#editorial-heading' : '/discover/natal-chart'}
            loading={!isGuest && natalQuery.isLoading}
            error={natalQuery.isError ? 'Không thể tải bản đồ sao.' : undefined}
            onRetry={() => natalQuery.refetch()}
            analyticsEvent="home_astrology_clicked"
            analyticsFeature="natal_chart"
            asset="natal_chart"
            surface={CARD_SURFACE}
            accent="radial-gradient(circle at 82% 78%, rgba(143,174,159,0.2), transparent 62%)"
          />
          <FeatureCard
            title="Thần số học"
            description={isGuest ? 'Con số nào đang kể câu chuyện của bạn?' : lifePath ? `Con số chủ đạo: ${lifePath}.` : 'Các con số cốt lõi từ tên và ngày sinh.'}
            cta={isGuest ? 'Tính thử' : lifePath ? 'Xem luận giải' : 'Tính ngay'}
            href={isGuest ? '#try-numerology' : '/discover/numerology'}
            loading={!isGuest && numerologyQuery.isLoading}
            error={numerologyQuery.isError ? 'Không thể tải thần số học.' : undefined}
            onRetry={() => numerologyQuery.refetch()}
            analyticsEvent="home_numerology_clicked"
            analyticsFeature="numerology"
            asset="numerology"
            surface={CARD_SURFACE}
            accent="radial-gradient(circle at 82% 78%, rgba(213,173,98,0.2), transparent 62%)"
          />
        </div>
      </section>

      {!isGuest && (
        <ForYouSection
          tuViChart={tuViChart}
          tuViLoading={!isGuest && tuViQuery.isLoading}
          continuityItem={continuityItem}
          continuityLoading={continuityLoading}
        />
      )}

      {isGuest && (
        <>
          <TrustSection />
          <GuestTrySection />
        </>
      )}
    </div>
  );
}

function HomeHero({
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
      className={cn(
        'relative overflow-hidden',
        isGuest
          ? // Board 01 guest hero is a contained cinematic panel, aligned with the sections below.
            // card here made the page read as "a website with a hero card on it" instead of
            // Board 01's continuous cinematic composition where header + hero share one canvas.
            // The `left-1/2 right-1/2 -mx-[50vw] w-screen` triplet is the standard breakout
            // technique — it escapes the parent's max-width/padding regardless of viewport, so
            // the background art reaches the true page edges while the inner content below stays
            // readable inside its own centered max-width. Auth (isGuest=false) keeps the original
            // boxed treatment — it renders inside AppShell's sidebar layout, a different context
            // this pass isn't correcting.
            // BOARD 01 SCALE PASS: desktop padding cut from py-20 (80px) to py-10 (40px) — the
            // founder flagged the Hero as too tall/dominant; this plus the smaller Wheel and
            // headline clamp below bring the measured section height from 898px to the requested
            // ~560–620px band at 1440/1536, without touching the mountain/mist artwork itself.
            'min-h-[360px] rounded-[10px] border border-[#d5ad62]/25 px-4 py-6 tablet:min-h-[390px] tablet:px-6 tablet:py-7 desktop:min-h-[410px] desktop:px-8 desktop:py-7'
          : 'min-h-[390px] rounded-[10px] border border-[#d5ad62]/25 bg-[#0c1420]/80 px-4 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] tablet:min-h-[420px] tablet:px-6 tablet:py-7 desktop:min-h-[440px] desktop:px-8 desktop:py-7',
      )}
    >
      {/* BOARD 01 LOCKED: sky base stays a deliberate vertical gradient (deep ink navy → a touch
          warmer near the horizon) — the approved asset set has no full-sky texture of its own,
          so this CSS layer is the sky the approved raster layers below sit on top of. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a1220_0%,#0d1a2c_45%,#16233a_100%)]" />
      {/* Sparse sky stars — the approved asset set has no dedicated full-sky starfield (only the
          constellation/nebula patch below), and Board 01 clearly shows stars scattered across the
          whole sky, not just in one patch. A few plain dots, not an illustration system. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {HERO_STARS.map(([x, y, r, o], index) => (
          <circle key={index} cx={`${x}%`} cy={`${y}%`} r={r} fill="#f1e9db" opacity={o} />
        ))}
        {/* V9 COMPOSITION PASS: one faint gold construction-line + linked nodes in the upper sky —
            Zone 1's "very subtle constellation structure, small gold accents." SVG `d` path data
            doesn't accept percentage units, so this is two plain `<line>`s (which do) rather than
            a curved path — same restrained visual result, the same language as
            DestinyOrbit/PageAtmosphere. */}
        <line x1="20%" y1="8%" x2="34%" y2="3%" stroke="#d5ad62" strokeOpacity="0.16" strokeWidth="0.6" />
        <line x1="34%" y1="3%" x2="50%" y2="9%" stroke="#d5ad62" strokeOpacity="0.16" strokeWidth="0.6" />
        <circle cx="20%" cy="8%" r="1.1" fill="#e0bd72" opacity="0.4" />
        <circle cx="50%" cy="9%" r="0.9" fill="#e0bd72" opacity="0.35" />
      </svg>
      {/* Approved constellation/nebula patch, used as the localized celestial glow behind the
          Destiny Wheel instead of a CSS radial-gradient approximation — the founder's brief
          explicitly called out "not a giant yellow radial gradient." */}
      <Image
        src={`${BOARD01_ASSET_BASE}/12_constellation_cloud.webp`}
        alt=""
        aria-hidden="true"
        width={380}
        height={280}
        sizes="(min-width: 1280px) 480px, 320px"
        className="pointer-events-none absolute right-[6%] top-[6%] hidden h-auto w-[42%] max-w-[480px] opacity-70 desktop:block"
      />
      {/* V8 SHARPNESS PASS (2026-08-27): the Board 01 sheet's own mountain layer
          (11_hero_mountains.webp) is only 875×295px — stretched across a full-bleed 100vw hero
          (≥1440px, ≥2880px at 2x DPR) that's a measured 1.6-3.3x upscale, the actual root cause of
          the founder's "looks blurry" call-out (verified via naturalWidth vs rendered rect, not
          guessed). `menh-vi/home/hero-mountains.png` is the same restrained dark-navy/gold-rim-lit
          silhouette direction at 1840×854 — sharp at this section's real render size. The mist/sky
          glow still comes from the approved Board 01 overlay layers below, unchanged. */}
      {/* Parallax: `--px`/`--py` come from `useHeroParallax` on the section; each layer scales
          them into its own few-px offset (see the brief's depth budget: far/mountain ~2px,
          mist ~4px, wheel ~2px) — desktop pointer only, no-op elsewhere. */}
      <Image
        src="/assets/menh-vi/home/hero-mountains-board01-v2.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        unoptimized
        sizes="100vw"
        className="object-cover object-bottom opacity-95"
        style={{ transform: 'scale(1.02) translate(calc(var(--px, 0) * 2px), calc(var(--py, 0) * 2px))' }}
      />
      {/* Approved center mist/mountain glow — the brightest point of the scene, the "sun through
          the valley" the reference reads as celestial illumination, not a flat yellow wash.
          V9 COMPOSITION PASS: the founder read this as "a dense horizontal band... pasted across
          the Hero" rather than atmosphere. Per the explicit instruction not to just drop opacity
          globally: narrowed 75%/820px→58%/620px so it reads as a localized glow instead of
          spanning most of the Hero width, added a soft top/side mask-fade so its own edges blend
          into the sky rather than having a visible boundary, and switched to `screen` blend mode
          so it lightens the mountain/sky beneath it (like light) instead of sitting on top of it
          like a translucent sheet — opacity only dropped as a secondary adjustment (0.9→0.7),
          alongside those other changes, not as the fix on its own. */}
      {/* V9 COMPOSITION PASS: a restrained horizon depth gradient — Zone 3's "visible depth" —
          without touching the mountain raster itself (no blur, no upscale). Just a dark wash
          right at the skyline transitioning to nothing, so the ridge reads with more separation
          from the sky above it. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[28%] h-[18%] bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,10,18,0.35)_100%)]" />
      {/* Approved center mist, restored after the hero-shrink pass (min-h 600-660px -> 360-410px)
          dropped it — max-w/width caps scaled down ~0.6x to match, since the mist's fixed intrinsic
          aspect ratio would otherwise read oversized against the now-shorter hero. Very slow
          alternating horizontal drift (`motion-safe:` only) plus the same pointer-parallax budget
          as the mountain/wheel layers, just a touch stronger since it's meant to feel airborne. */}
      <Image
        src={`${BOARD01_ASSET_BASE}/15_mist_mountains_center.webp`}
        alt=""
        aria-hidden="true"
        width={550}
        height={175}
        sizes="(min-width: 1280px) 380px, 42vw"
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-auto w-[40%] max-w-[380px] opacity-70 mix-blend-screen motion-safe:animate-[mv-mist-drift_66s_ease-in-out_infinite]"
        style={{
          WebkitMaskImage: 'radial-gradient(ellipse 55% 75% at 50% 85%, black 35%, transparent 88%)',
          maskImage: 'radial-gradient(ellipse 55% 75% at 50% 85%, black 35%, transparent 88%)',
          translate: 'calc(var(--px, 0) * 4px) calc(var(--py, 0) * 4px)',
        }}
      />
      {/* Approved left mist bank. */}
      <Image
        src={`${BOARD01_ASSET_BASE}/14_mist_left.webp`}
        alt=""
        aria-hidden="true"
        width={430}
        height={175}
        sizes="(min-width: 1280px) 260px, 26vw"
        className="pointer-events-none absolute bottom-0 left-0 hidden h-auto w-[26%] max-w-[260px] opacity-80 motion-safe:animate-[mv-mist-drift_74s_ease-in-out_infinite] tablet:block"
        style={{ translate: 'calc(var(--px, 0) * 4px) calc(var(--py, 0) * 4px)' }}
      />
      {/* Approved gold cloud-scroll ornaments — small, peripheral corner accents (replaces the
          earlier hand-drawn CloudLines SVG approximation of this exact eastern cloud-scroll
          motif with the founder-approved artwork). Static — the brief keeps only mist adrift,
          ornaments stay put as fixed corner accents. */}
      <Image
        src={`${BOARD01_ASSET_BASE}/16_cloud_ornament_center.webp`}
        alt=""
        aria-hidden="true"
        width={315}
        height={155}
        sizes="130px"
        className="pointer-events-none absolute bottom-[10%] left-[2%] hidden h-auto w-[11%] max-w-[130px] opacity-50 tablet:block"
      />
      <Image
        src={`${BOARD01_ASSET_BASE}/17_cloud_ornament_right.webp`}
        alt=""
        aria-hidden="true"
        width={455}
        height={165}
        sizes="145px"
        className="pointer-events-none absolute bottom-[12%] right-[2%] hidden h-auto w-[12%] max-w-[145px] opacity-50 tablet:block"
      />

      {/* V8: content wrapper — the background layers above are full-bleed (edge to edge on
          guest), but headline/orbit/panel/quick-actions stay inside a wide-but-centered column so
          text remains readable while the artwork itself reads as panoramic. */}
      <div className="relative z-10 mx-auto w-full max-w-[1600px]">
        <div
          className={cn(
            'grid gap-5 tablet:grid-cols-[1fr_1fr] tablet:gap-5 desktop:items-stretch desktop:gap-6',
            isGuest ? 'desktop:grid-cols-[1.05fr_1fr]' : 'desktop:grid-cols-[0.9fr_1.2fr_0.78fr]',
          )}
        >
          <div className="max-w-lg self-center tablet:self-start">
            {authLoading ? (
              <Skeleton className="mb-5 h-20 w-56 bg-white/10" />
            ) : isGuest ? (
              <>
                <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#e6c980]">Tử Vi Tarot</p>
                <h1
                  id="home-hero-heading"
                  className="mt-2 font-display text-[clamp(2rem,3vw,3.15rem)] font-semibold uppercase leading-[1.07] tracking-normal text-[#f2eee5]"
                >
                  Hiểu mình.
                  <br />
                  Hiểu vận.
                  <br />
                  Sống an nhiên.
                </h1>
              </>
            ) : (
              <>
                <p className="text-body-md text-[#e6c980]">{greeting}</p>
                <h1 id="home-hero-heading" className="mt-2 font-display text-[clamp(2.4rem,4.2vw,4.3rem)] font-semibold leading-[1.08] tracking-normal text-[#f2eee5]">
                  {userName}
                </h1>
              </>
            )}
            <p className="mt-3 max-w-md text-body-sm leading-relaxed text-[#d8d1c2]">
              {isGuest ? 'Tử Vi · Tarot · Bản đồ sao · Thần số học. Không cần đăng ký để bắt đầu khám phá.' : 'Vũ trụ luôn vận động. Hiểu mình, hiểu thời vận, sống chủ động hơn mỗi ngày.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <HomeButton href={isGuest ? '#try-tarot' : '/discover'} variant="primary">
                {isGuest ? 'Khám phá ngay' : 'Xem vận trình hôm nay'}
              </HomeButton>
              <HomeButton
                href={isGuest ? '#features-heading' : '/companion'}
                variant="secondary"
                icon={isGuest ? undefined : <Play className="h-4 w-4" aria-hidden="true" />}
              >
                {isGuest ? 'Tìm hiểu thêm' : 'Giới thiệu Tử Vi Tarot'}
              </HomeButton>
            </div>
          </div>
          <div
            className={cn(
              'col-auto row-auto mx-auto w-full max-w-[230px] self-center tablet:col-start-2 tablet:row-start-1 tablet:max-w-[300px] tablet:self-start desktop:col-auto desktop:row-auto desktop:self-center',
              isGuest ? 'desktop:max-w-[360px]' : 'desktop:max-w-[340px]',
            )}
          >
            <div style={{ translate: 'calc(var(--px, 0) * 2px) calc(var(--py, 0) * 2px)' }}>
              <DestinyOrbit className="h-full w-full drop-shadow-[0_0_24px_rgba(213,173,98,0.18)]" />
            </div>
          </div>
          {/* BOARD 01 FINAL CORRECTION: the founder-approved guest reference has no right-side
              context panel — only the authenticated screen does. Removed for guests (presentation
              only; HeroContextPanel's data/API wiring is untouched and still renders for auth). The
              freed column goes to the headline/Orbit instead (see the grid-cols swap above). */}
          {!isGuest && (
            // V8: `desktop:self-end` moves the panel down from the top-aligned position the audit
            // flagged — it now sits toward the lower half of the hero, secondary to the headline
            // and Orbit rather than pinned level with the Orbit's top edge.
            <div className="col-auto row-auto mx-auto w-full max-w-[280px] tablet:col-start-2 tablet:row-start-2 tablet:ml-auto tablet:mr-0 tablet:max-w-[260px] desktop:col-auto desktop:row-auto desktop:max-w-none desktop:self-end">
              <HeroContextPanel
                loading={dashboardLoading}
                error={dashboardError}
                text={dailyText}
                onRetry={onRetryDashboard}
                tuViChart={tuViChart}
                tuViLoading={tuViLoading}
              />
            </div>
          )}
        </div>
        {!isGuest && (
          <div className="mt-4 border-t border-white/[0.06] pt-3">
            <QuickActions isGuest={false} />
          </div>
        )}
      </div>
    </section>
  );
}

const GUEST_QUICK_ACTIONS = [
  { label: 'Lập lá số', href: '#try-tu-vi', asset: 'tu_vi' },
  { label: 'Rút Tarot', href: '#try-tarot', asset: 'tarot' },
  { label: 'Bản đồ sao', href: '#editorial-heading', asset: 'natal_chart' },
  { label: 'Thần số', href: '#try-numerology', asset: 'numerology' },
] as const;

const AUTH_QUICK_ACTIONS: Array<{
  label: string;
  href: string;
  asset: 'tu_vi' | 'tarot' | 'natal_chart' | 'numerology';
  analyticsEvent: FeatureAnalyticsEvent;
  analyticsFeature: 'tu_vi' | 'tarot' | 'natal_chart' | 'numerology';
}> = [
  { label: 'Lá số của tôi', href: '/discover/tu-vi', asset: 'tu_vi', analyticsEvent: 'home_tuvi_clicked', analyticsFeature: 'tu_vi' },
  { label: 'Tarot hôm nay', href: '/discover/tarot', asset: 'tarot', analyticsEvent: 'home_tarot_clicked', analyticsFeature: 'tarot' },
  { label: 'Bản đồ sao', href: '/discover/natal-chart', asset: 'natal_chart', analyticsEvent: 'home_astrology_clicked', analyticsFeature: 'natal_chart' },
  { label: 'Thần số học', href: '/discover/numerology', asset: 'numerology', analyticsEvent: 'home_numerology_clicked', analyticsFeature: 'numerology' },
];

/**
 * BOARD 01 LOCKED: quick actions now render the founder-approved circular icon badges
 * (02–05_icon_*.webp) directly — those assets already bake in their own dark circle + gold ring,
 * so the old Lucide-icon-inside-a-CSS-circle treatment is removed rather than layered underneath.
 */
function QuickActions({ isGuest }: { isGuest: boolean }) {
  const items = isGuest ? GUEST_QUICK_ACTIONS : AUTH_QUICK_ACTIONS;
  return (
    <div className="flex flex-wrap justify-center gap-6 tablet:justify-start tablet:gap-9">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={
            'analyticsEvent' in item
              ? () => {
                  trackEvent('home_feature_clicked', { feature: 'home', source: item.label });
                  trackEvent(item.analyticsEvent, { feature: item.analyticsFeature, source: 'home' });
                }
              : undefined
          }
          className="group flex w-[84px] flex-col items-center gap-2.5 rounded-full text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d5ad62]"
        >
          <span className="relative flex h-16 w-16 items-center justify-center transition-transform duration-standard group-hover:scale-[1.06]">
            <Image
              src={`${BOARD01_ASSET_BASE}/${FEATURE_ICON_ASSET[item.asset]}.webp`}
              alt=""
              aria-hidden="true"
              fill
              sizes="64px"
              className="object-contain drop-shadow-[0_0_0_rgba(0,0,0,0)] transition-[filter] group-hover:drop-shadow-[0_0_14px_rgba(213,173,98,0.35)]"
            />
          </span>
          <span className="text-caption font-medium leading-tight text-[#d8d1c2]">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}

function CycleRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-caption uppercase tracking-[0.14em] text-[#a6a7ac]">{label}</p>
      <p className="mt-1 text-body-sm font-semibold text-[#f2eee5]">{value}</p>
    </div>
  );
}

function HeroContextPanel({
  loading,
  error,
  text,
  onRetry,
  tuViChart,
  tuViLoading,
}: {
  loading: boolean;
  error: boolean;
  text?: string;
  onRetry: () => void;
  tuViChart: TuViChartDto | null;
  tuViLoading: boolean;
}) {
  if (loading || tuViLoading) {
    return (
      <div className="rounded-[18px] border border-[#d5ad62]/20 bg-[#0e1726]/80 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
        <Skeleton className="mb-4 h-5 w-28 bg-white/10" />
        <Skeleton className="h-28 w-full bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-[#d5ad62]/20 bg-[#0e1726]/80 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
        <p className="text-body-sm font-semibold text-[#e6c980]">Vận trình hôm nay</p>
        <p className="mt-3 text-body-sm text-[#a6a7ac]">Không thể tải vận trình hôm nay.</p>
        <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-md border border-[#d5ad62]/35 px-4 text-body-sm font-semibold text-[#e6c980]">
          Thử lại
        </button>
      </div>
    );
  }

  const daiVanText = formatDaiVan(tuViChart?.currentDaiVan ?? null);
  const tieuHanText = formatTieuHan(tuViChart?.currentTieuHan ?? null);

  return (
    <div className="rounded-[18px] border border-[#d5ad62]/20 bg-[#0e1726]/80 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
      <p className="text-body-sm font-semibold text-[#e6c980]">Vận trình hiện tại</p>
      {tuViChart ? (
        <div className="mt-3 space-y-3">
          <CycleRow label="Đại Vận" value={daiVanText ?? 'Chưa xác định cho lá số này.'} />
          <CycleRow label="Tiểu Hạn" value={tieuHanText ?? 'Chưa xác định cho lá số này.'} />
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-body-sm text-[#a6a7ac]">Bạn chưa lập lá số Tử Vi.</p>
          <Link href="/discover/tu-vi" className="mt-3 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
            Lập lá số đầu tiên <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-caption uppercase tracking-[0.14em] text-[#a6a7ac]">Gợi ý hôm nay</p>
        <p className="mt-2 text-body-sm leading-relaxed text-[#d8d1c2]">{text ?? 'Vận trình hôm nay chưa được tạo.'}</p>
        <Link href="/discover" className="mt-3 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
          Xem vận trình hôm nay <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function StripItem({ title, loading, children }: { title: string; loading?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex-1 px-6 py-5 first:pl-0 last:pr-0 tablet:py-0">
      <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">{title}</p>
      <div className="mt-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-4 w-full bg-white/10" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ForYouSection({
  tuViChart,
  tuViLoading,
  continuityItem,
  continuityLoading,
}: {
  tuViChart: TuViChartDto | null;
  tuViLoading: boolean;
  continuityItem: ContinuityItem | null;
  continuityLoading: boolean;
}) {
  const daiVanText = formatDaiVan(tuViChart?.currentDaiVan ?? null);
  const tieuHanText = formatTieuHan(tuViChart?.currentTieuHan ?? null);

  return (
    <section aria-labelledby="for-you-heading" className="space-y-5">
      <SectionHeading id="for-you-heading" eyebrow="Dành cho bạn" title="Điều đang diễn ra với bạn" />
      <div className="flex flex-col divide-y divide-white/[0.08] rounded-[18px] border border-white/[0.1] bg-[#16233a]/70 px-6 tablet:flex-row tablet:divide-x tablet:divide-y-0">
        <StripItem title="Vận trình hiện tại" loading={tuViLoading}>
          {tuViChart ? (
            <div className="space-y-3">
              <CycleRow label="Đại Vận" value={daiVanText ?? 'Chưa xác định cho lá số này.'} />
              <CycleRow label="Tiểu Hạn" value={tieuHanText ?? 'Chưa xác định cho lá số này.'} />
              <Link href="/discover/tu-vi" className="inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
                Xem chi tiết lá số <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <p className="text-body-sm text-[#a6a7ac]">Bạn chưa lập lá số.</p>
              <Link href="/discover/tu-vi" className="mt-3 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
                Lập lá số đầu tiên <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </>
          )}
        </StripItem>
        <StripItem title="Tiếp tục hành trình" loading={continuityLoading}>
          {continuityItem ? (
            <>
              <p className="text-body-sm font-semibold text-[#f2eee5]">{continuityItem.title}</p>
              <p className="mt-2 text-body-sm leading-relaxed text-[#a6a7ac]">{continuityItem.description}</p>
              <Link href={continuityItem.href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
                Xem chi tiết <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-body-sm text-[#a6a7ac]">Bạn chưa có lần trải bài hay bản đồ nào gần đây.</p>
              <Link href="/discover" className="mt-3 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
                Khám phá ngay <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </>
          )}
        </StripItem>
        <StripItem title="Cộng đồng">
          <p className="text-body-sm leading-relaxed text-[#a6a7ac]">
            Một không gian để chia sẻ trải nghiệm và góc nhìn của riêng bạn. Tính năng đang được hoàn thiện.
          </p>
          <Link href="/community" className="mt-3 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
            Xem trạng thái cộng đồng <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </StripItem>
      </div>
    </section>
  );
}

/**
 * BOARD 01 FINAL CORRECTION: the prior 188/204px height was tuned to avoid a "tall poster" card,
 * but it also left no room for the approved illustration to read as anything but a small corner
 * thumbnail — the founder's explicit "still reads like a dashboard card with a thumbnail attached"
 * call-out. Grown enough for the artwork to have real atmospheric presence (see the illustration
 * block below) while staying a compact card, not a poster.
 */
const FEATURE_CARD_SHAPE = 'flex h-[176px] flex-col rounded-[10px] border border-[#d5ad62]/25 p-3 tablet:h-[184px] tablet:p-3.5 desktop:h-[192px]';

/**
 * V7 reference-fidelity: Board 01's 4 Discovery cards are one coherent dark-navy family, not four
 * differently-hued "modules." Every card now shares this exact base gradient — per-feature
 * distinction comes only from a small `accent` corner wash (see call sites), never from a
 * different base hue.
 */
const CARD_SURFACE = 'linear-gradient(165deg, rgba(14,20,32,0.78) 0%, rgba(10,15,24,0.85) 55%, rgba(7,10,16,0.92) 100%)';

/**
 * V9 COMPOSITION PASS: a tiny, fixed (non-random, so SSR/CSR markup matches exactly) scatter of
 * dots + one thin arc behind the artwork zone — the "restrained background glow / subtle star
 * field / faint celestial construction line" the founder asked for so each card reads as one
 * composed panel, not text-plus-pasted-image. Deliberately reuses the exact gold tones and
 * near-invisible opacities already established by `DestinyOrbit`/`PageAtmosphere` rather than
 * inventing a new decorative language.
 */
function CardCelestialAccent() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <circle cx="78%" cy="18%" r="0.9" fill="#f1e3bb" opacity="0.35" />
      <circle cx="90%" cy="34%" r="0.7" fill="#e0bd72" opacity="0.3" />
      <circle cx="70%" cy="46%" r="1" fill="#f1e3bb" opacity="0.28" />
      <circle cx="95%" cy="58%" r="0.7" fill="#e0bd72" opacity="0.25" />
      {/* SVG `d` path data doesn't accept percentage units, so this is plain `<line>`s (which do)
          rather than a curved arc path. */}
      <line x1="62%" y1="12%" x2="80%" y2="24%" stroke="#d5ad62" strokeOpacity="0.14" strokeWidth="0.6" />
      <line x1="80%" y1="24%" x2="98%" y2="48%" stroke="#d5ad62" strokeOpacity="0.14" strokeWidth="0.6" />
    </svg>
  );
}

function FeatureCard({
  title,
  description,
  cta,
  href,
  loading,
  error,
  onRetry,
  analyticsEvent,
  analyticsFeature,
  asset,
  surface,
  accent,
}: {
  title: string;
  description: string;
  cta: string;
  href: string;
  loading?: boolean;
  error?: string;
  onRetry: () => void;
  analyticsEvent: FeatureAnalyticsEvent;
  analyticsFeature: 'tu_vi' | 'tarot' | 'natal_chart' | 'numerology';
  /** Selects the founder-approved Board 01 icon badge + feature illustration for this card. */
  asset: 'tu_vi' | 'tarot' | 'natal_chart' | 'numerology';
  /** Shared translucent navy base (real alpha, not opaque) so the page's own background scenery
      shows through the card. Always CARD_SURFACE — kept as a prop rather than hard-coded so the
      loading/error states above can render without it. */
  surface: string;
  /** The one small per-feature distinction allowed: a faint corner-only tint wash, not a
      different base hue. */
  accent: string;
}) {
  if (loading) {
    return (
      <div className={cn(FEATURE_CARD_SHAPE, 'bg-[#12203350]')} aria-label={`${title} đang tải`}>
        <Skeleton className="h-5 w-24 bg-white/10" />
        <Skeleton className="mt-2 h-8 w-full bg-white/10" />
        <Skeleton className="mt-auto h-4 w-20 bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(FEATURE_CARD_SHAPE, 'bg-[#12203350]')}>
        <h3 className="text-body-md font-semibold text-[#f2eee5]">{title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-caption leading-snug text-[#a6a7ac]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex min-h-8 items-center text-caption font-semibold text-[#e6c980] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => {
        trackEvent('home_feature_clicked', { feature: 'home', source: title });
        trackEvent(analyticsEvent, { feature: analyticsFeature, source: 'home' });
      }}
      style={{ background: surface }}
      className={cn(
        FEATURE_CARD_SHAPE,
        // V8 SHARPNESS PASS: `backdrop-blur` here was softening this card's own artwork layer
        // (measured — verified this was a real applied blur(2px), not an illusion of "AI-looking"
        // art), for no visible purpose since CARD_SURFACE is dark enough not to need it.
        // Ritual milestone 1: card now lifts 3px + gets a restrained gold bloom on hover/focus,
        // on top of the existing border/artwork response — still within duration-standard (250ms),
        // still no glow explosion per the brief's "no exaggerated" rule.
        'group relative overflow-hidden transition-[color,border-color,transform,box-shadow] duration-standard hover:-translate-y-[3px] hover:border-[#d5ad62]/50 hover:shadow-[0_10px_26px_-8px_rgba(213,173,98,0.28)] focus-visible:-translate-y-[3px] focus-visible:border-[#d5ad62]/50 focus-visible:shadow-[0_10px_26px_-8px_rgba(213,173,98,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] motion-reduce:transform-none',
      )}
    >
      {/* V9 COMPOSITION PASS: `accent` now centers on the artwork zone (lower-right) instead of the
          top-left corner — a restrained background glow the artwork sits inside, so the card reads
          as one composed panel rather than "text + a pasted image." */}
      <div className="pointer-events-none absolute inset-0" style={{ background: accent }} aria-hidden="true" />
      <CardCelestialAccent />
      {/* PRODUCTION ART CONTAINER (§8 contract), V9 COMPOSITION PASS: narrowed from 52%→38% of the
          card — the founder's explicit call-out was that artwork read as too large/"object-like"
          against the reduced-scale reference (target ~35-50% of the card's visual area, not
          60-75%). Still full height so it can bleed toward top/bottom rather than sitting boxed. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[48%] opacity-90 transition-[opacity,transform] duration-standard group-hover:opacity-100 group-hover:scale-[1.02]"
        style={{
          WebkitMaskImage: 'linear-gradient(to left, black 72%, transparent 100%)',
          maskImage: 'linear-gradient(to left, black 72%, transparent 100%)',
        }}
      >
        <Image
          src={FEATURE_ART_ASSET[asset]}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1280px) 220px, 160px"
          className="object-contain object-bottom"
          style={{ transform: `scale(${FEATURE_ART_SCALE[asset]})`, transformOrigin: 'bottom center' }}
        />
      </div>
      {/* Protects the copy column: a soft left-to-right scrim instead of relying on the mask alone
          to keep text legible now that the artwork is larger and brighter. */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080b12]/75 via-[#080b12]/30 to-transparent"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2">
        <span className="relative h-6 w-6 shrink-0">
          <Image src={`${BOARD01_ASSET_BASE}/${FEATURE_ICON_ASSET[asset]}.webp`} alt="" fill sizes="24px" className="object-contain" />
        </span>
        <h3 className="text-caption font-semibold uppercase tracking-[0.1em] text-[#e6c980]">{title}</h3>
      </div>
      {/* `flex-1` previously lived on this <p> to push the CTA to the card's bottom edge, but that
          combination silently defeats `line-clamp-2` — Tailwind's clamp needs the box's own content
          height, and a flex-grown box instead stretches to fill the remaining column, so a 3rd
          wrapped line stays visible below the "clamped" 2 lines instead of being cut. Verified via
          computed styles: height was 186px (~11 line-heights) with `flex-1`, not the ~33px 2 lines
          should occupy. Fixed by keeping the paragraph's natural clamped height and pushing the CTA
          down with `mt-auto` on the flex column instead. */}
      <p className="relative mt-2 line-clamp-2 max-w-[60%] text-caption leading-snug text-[#a6a7ac]">{description}</p>
      <span className="relative mt-auto inline-flex items-center gap-1.5 pt-2 text-caption font-semibold text-[#e6c980]">
        {cta} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function GuestTrySection() {
  return (
    <section aria-labelledby="try-heading" className="space-y-5">
      <SectionHeading id="try-heading" eyebrow="Dành cho bạn" title="Bắt đầu từ đâu?" />
      {/* V8.1 FOUNDER CORRECTION: the founder rejected the previous 1.12fr/1fr/1fr asymmetry —
          all 3 cards must render at equal width. Straight grid-cols-3, no special-casing for the
          Tarot preview's richer content. */}
      <div className="grid items-stretch gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
        {/* V9 COMPOSITION PASS fix: this extra wrapper div (needed for the tablet col-span) doesn't
            inherit the grid's stretched cell height by itself — it was left at its child's
            intrinsic content height, so when V9's wider text max-widths let GuestTarotPreview wrap
            one line shorter, this card alone shrank (229px vs its siblings' 252px, measured live).
            `h-full` on both this wrapper and GuestTarotPreview's own root propagates the grid's
            stretch all the way down again. */}
        <div className="h-full tablet:col-span-2 desktop:col-span-1">
          <GuestTarotPreview />
        </div>
        <GuestNumerologyPreview />
        <GuestTuViBoundary />
      </div>
    </section>
  );
}

/**
 * V7 reference-fidelity: the 3 guest-try sections previously carried visibly different saturated
 * hues (indigo/jade/brown) at high alpha — the same "different colored modules" mismatch flagged
 * for the Discovery cards. All three now share one navy base; distinction comes only from a small
 * corner tint, matching each feature's own Discovery-card accent.
 */
const GUEST_SECTION_BASE = 'linear-gradient(135deg, rgba(14,20,32,0.85) 0%, rgba(10,15,24,0.9) 55%, rgba(7,10,16,0.94) 100%)';

function GuestTarotPreview() {
  const [card, setCard] = useState<(typeof guestTarotCards)[number] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const saved = readGuestTarotTrial();
    if (saved) setCard({ name: saved.cardName, meaning: saved.cardMeaning });
  }, []);

  function drawCard() {
    setIsDrawing(true);
    setCard(null);
    trackEvent('guest_tarot_started', { feature: 'tarot', spreadType: 'single_card' });
    window.setTimeout(() => {
      const next = guestTarotCards[Math.floor(Math.random() * guestTarotCards.length)] ?? guestTarotCards[0]!;
      setCard(next);
      setIsDrawing(false);
      saveGuestTarotTrial(next);
      trackEvent('guest_tarot_preview_completed', { feature: 'tarot', spreadType: 'single_card' });
    }, 180);
  }

  return (
    <section
      id="try-tarot"
      className="relative h-full overflow-hidden rounded-[18px] border border-white/[0.1] p-5"
      style={{ background: `radial-gradient(circle at 92% 4%, rgba(122,142,168,0.16), transparent 55%), ${GUEST_SECTION_BASE}` }}
    >
      {/* PRODUCTION ART CONTAINER (§9), V9 COMPOSITION PASS: narrowed 46%→26-34% (responsive —
          smaller on mobile, growing at wider breakpoints instead of holding the desktop scale at
          every width) and the text column's max-width tightened to a matching complement, so the
          two bounding boxes never overlap by construction — not "usually fine because of the mask
          fade." Card fan still bleeds off the right edge for atmosphere via the same mask-fade
          technique. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[26%] opacity-85 tablet:w-[30%] desktop:w-[34%]"
        style={{
          WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 88%)',
          maskImage: 'linear-gradient(to left, black 30%, transparent 88%)',
        }}
        aria-hidden="true"
      >
        <Image src={FEATURE_ART_ASSET.tarot} alt="" fill sizes="200px" className="object-contain object-right" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080b12]/70 via-[#080b12]/20 to-transparent" aria-hidden="true" />
      <div className="relative">
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Tarot</p>
        <h3 className="relative mt-2 max-w-[58%] text-body-lg font-semibold text-[#f2eee5]">Rút một lá cho hôm nay</h3>
      </div>
      <p className="relative mt-2 max-w-[58%] text-body-sm leading-relaxed text-[#a6a7ac]">Bản thử này không lưu lịch sử và không gọi AI. Luận giải đầy đủ cần tài khoản để giữ ngữ cảnh cho bạn.</p>
      {isDrawing && <Skeleton className="relative mt-4 h-28 w-full bg-white/10" />}
      {card && (
        <div className="relative mt-4 rounded-[14px] border border-[#d5ad62]/20 bg-[#070b12]/70 p-4" aria-live="polite">
          <p className="font-display text-heading-md text-[#f2eee5]">{card.name}</p>
          <p className="mt-2 text-body-sm text-[#d8d1c2]">{card.meaning}</p>
        </div>
      )}
      {/* V9 COMPOSITION PASS fix: this row had no max-width, so the 2 buttons together could
          extend further right than the (constrained) title/paragraph above them, into the
          artwork zone — measured live as a real 16px bounding-box overlap. */}
      <div className="relative mt-4 flex max-w-[58%] flex-wrap gap-3">
        <button type="button" onClick={drawCard} disabled={isDrawing} className="min-h-11 rounded-md bg-[#d5ad62] px-4 text-body-sm font-semibold text-[#070b12] disabled:cursor-not-allowed disabled:opacity-70">
          {isDrawing ? 'Đang rút...' : card ? 'Rút lá khác' : 'Rút một lá'}
        </button>
        <button type="button" onClick={() => setGateOpen(true)} disabled={!card || isDrawing} className="min-h-11 rounded-md border border-[#d5ad62]/35 px-4 text-body-sm font-semibold text-[#e6c980] disabled:cursor-not-allowed disabled:opacity-60">
          Xem luận giải đầy đủ
        </button>
      </div>
      <AuthValueGate open={gateOpen} onClose={() => setGateOpen(false)} source="guest_tarot" />
    </section>
  );
}

function lifePathPreview(date: string): number | null {
  try {
    return calculateLifePathNumber(date).value;
  } catch {
    return null;
  }
}

function GuestNumerologyPreview() {
  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const saved = readGuestNumerologyTrial();
    if (!saved) return;
    setBirthDate(saved.birthDate);
    setResult(saved.lifePath);
  }, []);

  function calculate(event: React.FormEvent) {
    event.preventDefault();
    trackEvent('guest_numerology_started', { feature: 'numerology' });
    if (!birthDate) {
      setResult(null);
      setError('Vui lòng chọn ngày sinh.');
      return;
    }
    if (birthDate > new Date().toISOString().slice(0, 10)) {
      setResult(null);
      setError('Ngày sinh không thể ở tương lai.');
      return;
    }
    const next = lifePathPreview(birthDate);
    setResult(next);
    setError(next === null ? 'Ngày sinh chưa hợp lệ.' : null);
    if (next !== null) {
      saveGuestNumerologyTrial({ birthDate, lifePath: next });
      trackEvent('guest_numerology_preview_completed', { feature: 'numerology' });
    }
  }

  return (
    <section
      id="try-numerology"
      className="relative overflow-hidden rounded-[18px] border border-white/[0.1] p-5"
      style={{ background: `radial-gradient(circle at 92% 4%, rgba(213,173,98,0.14), transparent 55%), ${GUEST_SECTION_BASE}` }}
    >
      {/* PRODUCTION ART CONTAINER (§9), V9 COMPOSITION PASS: narrowed 48%→28-36% (responsive) with
          a matching text-column max-width so the illustration and the date-input row never share
          the same horizontal space — a real non-overlap guarantee, not reliant on the input's
          opaque background to mask a collision. */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[28%] opacity-85 tablet:w-[32%] desktop:w-[36%]"
        style={{
          WebkitMaskImage: 'linear-gradient(to left, black 28%, transparent 88%)',
          maskImage: 'linear-gradient(to left, black 28%, transparent 88%)',
        }}
        aria-hidden="true"
      >
        <Image src={FEATURE_ART_ASSET.numerology} alt="" fill sizes="200px" className="object-contain" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080b12]/70 via-[#080b12]/20 to-transparent" aria-hidden="true" />
      <div className="relative">
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Thần số học</p>
        <h3 className="mt-2 max-w-[56%] text-body-lg font-semibold text-[#f2eee5]">Tính nhanh con số chủ đạo</h3>
      </div>
      <p className="relative mt-2 max-w-[56%] text-body-sm leading-relaxed text-[#a6a7ac]">Ngày sinh chỉ ở trong trình duyệt cho bản thử này. Hồ sơ đầy đủ dùng engine backend sau khi đăng nhập.</p>
      <form onSubmit={calculate} noValidate className="relative mt-4 flex max-w-[56%] flex-col gap-2">
        <label htmlFor="guest-birth-date" className="sr-only">
          Ngày sinh
        </label>
        <div className="flex gap-2">
          <input
            id="guest-birth-date"
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => {
              setBirthDate(event.target.value);
              setError(null);
            }}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-white/10 bg-[#0b1220] px-3 text-body-sm text-[#f2eee5]"
          />
          <button type="submit" className="min-h-11 shrink-0 rounded-md bg-[#d5ad62] px-4 text-body-sm font-semibold text-[#070b12]">
            Tính thử
          </button>
        </div>
        {error && (
          <p className="text-body-sm text-[#e6c980]" role="alert">
            {error}
          </p>
        )}
      </form>
      {result !== null && (
        <div className="relative mt-4 rounded-[14px] border border-[#d5ad62]/20 bg-[#070b12]/70 p-4">
          <p className="text-caption uppercase tracking-[0.14em] text-[#a6a7ac]">Con số chủ đạo</p>
          <p className="mt-1 text-[2rem] font-semibold leading-none text-[#f2eee5]">{result}</p>
          <p className="mt-2 text-body-sm text-[#d8d1c2]">Đây là phần mở đầu của hồ sơ thần số học. Luận giải đầy đủ sẽ dùng engine backend sau khi bạn đăng nhập.</p>
          <button type="button" onClick={() => setGateOpen(true)} className="mt-4 min-h-11 rounded-md border border-[#d5ad62]/35 px-4 text-body-sm font-semibold text-[#e6c980]">
            Xem hồ sơ đầy đủ
          </button>
        </div>
      )}
      <AuthValueGate open={gateOpen} onClose={() => setGateOpen(false)} source="guest_numerology" />
    </section>
  );
}

function GuestTuViBoundary() {
  const [gateOpen, setGateOpen] = useState(false);
  return (
    <section
      id="try-tu-vi"
      className="relative overflow-hidden rounded-[18px] border border-white/[0.1] p-5"
      style={{ background: `radial-gradient(circle at 92% 4%, rgba(198,146,67,0.14), transparent 55%), ${GUEST_SECTION_BASE}` }}
    >
      {/* PRODUCTION ART CONTAINER (§9), V9 COMPOSITION PASS: shrunk from 92%×58%→70%×36-44%
          (responsive) with the diagonal fade starting earlier, so the pavilion scene reads as a
          lower-right corner accent rather than a large scene competing with the body copy. */}
      <div
        className="pointer-events-none absolute -bottom-4 -right-4 h-[70%] w-[36%] opacity-85 tablet:w-[40%] desktop:w-[44%]"
        style={{
          WebkitMaskImage: 'linear-gradient(128deg, transparent 6%, transparent 14%, black 50%)',
          maskImage: 'linear-gradient(128deg, transparent 6%, transparent 14%, black 50%)',
        }}
        aria-hidden="true"
      >
        <Image src={FEATURE_ART_ASSET.tu_vi} alt="" fill sizes="200px" className="object-contain object-bottom" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080b12]/70 via-[#080b12]/20 to-transparent" aria-hidden="true" />
      <div className="relative">
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Lá số Tử Vi</p>
        <h3 className="mt-2 max-w-[48%] text-body-lg font-semibold text-[#f2eee5]">Xem trước cách lập lá số</h3>
      </div>
      <p className="relative mt-2 max-w-[48%] text-body-sm leading-relaxed text-[#a6a7ac]">
        Tử Vi cần giờ sinh và giới tính, nên phần lập lá số đầy đủ chỉ mở sau khi bạn có tài khoản để bảo vệ dữ liệu cá nhân và lưu đúng nơi.
      </p>
      <button
        type="button"
        onClick={() => {
          trackEvent('guest_tuvi_started', { feature: 'tu_vi' });
          setGateOpen(true);
        }}
        className="relative mt-4 min-h-11 rounded-md bg-[#d5ad62] px-4 text-body-sm font-semibold text-[#070b12]"
      >
        Lập lá số đầy đủ
      </button>
      <AuthValueGate open={gateOpen} onClose={() => setGateOpen(false)} source="guest_tuvi" />
    </section>
  );
}

function continuationPath(source: string): string {
  if (source === 'guest_tarot') return '/discover/tarot';
  if (source === 'guest_numerology') return '/discover/numerology';
  if (source === 'guest_tuvi') return '/discover/tu-vi';
  return '/';
}

function AuthValueGate({ open, onClose, source }: { open: boolean; onClose: () => void; source: string }) {
  const next = continuationPath(source);
  const encodedNext = encodeURIComponent(next);

  useEffect(() => {
    if (open) trackEvent('auth_gate_viewed', { feature: 'auth', source });
  }, [open, source]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Lưu lại hành trình của bạn"
      description="Tạo tài khoản miễn phí để xem đầy đủ luận giải, lưu kết quả và tiếp tục bất cứ lúc nào."
    >
      <div className="flex flex-col gap-3">
        <Link
          href={`/register?next=${encodedNext}`}
          onClick={() => trackEvent('auth_gate_signup_clicked', { feature: 'auth', source })}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-insight px-4 text-body-sm font-semibold text-canvas"
        >
          Đăng ký miễn phí
        </Link>
        <Link
          href={`/login?next=${encodedNext}`}
          onClick={() => trackEvent('auth_gate_login_clicked', { feature: 'auth', source })}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-subtle px-4 text-body-sm font-semibold text-text-primary"
        >
          Đã có tài khoản? Đăng nhập
        </Link>
      </div>
    </Dialog>
  );
}

function SectionHeading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div>
      {eyebrow && <p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">{eyebrow}</p>}
      <h2 id={id} className={cn('font-display text-heading-md font-semibold text-[#f2eee5]', eyebrow && 'mt-1')}>
        {title}
      </h2>
    </div>
  );
}

function EditorialSection() {
  const [featured, ...rest] = editorialFallbacks;
  if (!featured) return null;

  return (
    <section aria-labelledby="editorial-heading" className="space-y-5">
      <SectionHeading id="editorial-heading" eyebrow="Bài viết nổi bật" title="Đọc thêm để hiểu mình" />
      {/* BOARD 01 FINAL CORRECTION: grown from 460px to 528px on desktop — the founder flagged this
          section as feeling small against the full desktop canvas. Same layout/imagery, just more
          room for the featured card and the 3-row secondary list to breathe. */}
      <div className="grid gap-4 desktop:h-[528px] desktop:grid-cols-[1.5fr_1fr]">
        <Link
          href={featured.href}
          onClick={() => trackEvent('home_article_clicked', { feature: 'home', source: featured.slug })}
          className="group relative flex h-[320px] flex-col justify-end overflow-hidden rounded-[18px] border border-[#d5ad62]/12 transition-colors hover:border-[#d5ad62]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] desktop:h-full"
        >
          <Image src={featured.image} alt="" fill sizes="(min-width: 1280px) 780px, 100vw" className="object-cover transition-transform duration-500 ease-organic group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1420] via-[#0c1420]/35 to-transparent" />
          <div className="relative z-10 p-5 desktop:p-7">
            <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#e6c980]">{featured.category}</p>
            <h3 className="mt-2 max-w-md text-heading-md font-semibold text-[#f2eee5] desktop:text-heading-lg">{featured.title}</h3>
            <p className="mt-2 text-caption text-[#d8d1c2]">{featured.readTime}</p>
          </div>
        </Link>
        <div className="grid gap-4 tablet:grid-cols-3 desktop:grid-cols-1 desktop:grid-rows-3">
          {rest.map((article) => (
            <Link
              key={article.title}
              href={article.href}
              onClick={() => trackEvent('home_article_clicked', { feature: 'home', source: article.slug })}
              className="group flex gap-4 overflow-hidden rounded-[18px] border border-[#d5ad62]/12 bg-[#1c2c46]/65 transition-colors hover:border-[#d5ad62]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] desktop:h-full"
            >
              <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-[12px] desktop:h-auto">
                <Image src={article.image} alt="" fill sizes="96px" className="object-cover transition-transform duration-500 ease-organic group-hover:scale-[1.03]" />
              </div>
              <div className="min-w-0 py-0.5">
                <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#e6c980]">{article.category}</p>
                <h3 className="mt-1 line-clamp-2 text-body-sm font-semibold text-[#f2eee5]">{article.title}</h3>
                <p className="mt-1 text-caption text-[#a6a7ac]">{article.readTime}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PremiumRail({
  isLoading,
  isError,
  onRetry,
  isPremium,
  paymentsEnabled,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  isPremium: boolean;
  paymentsEnabled: boolean;
}) {
  return (
    <RailCard title="Tử Vi Tarot+" icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}>
      {isLoading ? (
        <Skeleton className="h-20 w-full bg-white/10" />
      ) : isError ? (
        <>
          <p className="text-body-sm text-[#a6a7ac]">Không thể tải trạng thái Premium.</p>
          <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
            Thử lại <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      ) : isPremium ? (
        <p className="text-body-sm text-[#a6a7ac]">Đang hoạt động.</p>
      ) : (
        <>
          <p className="text-body-sm text-[#a6a7ac]">Mở khóa toàn bộ tính năng và trải nghiệm chuyên sâu.</p>
          <Link
            href="/premium"
            onClick={() => trackEvent('home_premium_clicked', { feature: 'premium' })}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]"
            aria-disabled={!paymentsEnabled}
          >
            Khám phá ngay <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      )}
    </RailCard>
  );
}

function RailCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-[#1c2c46]/65 p-4 backdrop-blur-[2px]">
      <div className="mb-3 flex items-center gap-2 text-[#e6c980]">
        {icon}
        <h3 className="text-body-sm font-semibold uppercase tracking-[0.14em]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function TrustCompassGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill="none" stroke="#d5ad62" strokeOpacity="0.6" strokeWidth="1.3" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#d5ad62" strokeOpacity="0.36" strokeWidth="1.2" />
      <path d="M20 6v6M20 28v6M6 20h6M28 20h6" stroke="#d5ad62" strokeOpacity="0.6" strokeWidth="1.3" />
      <path d="M20 12l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e6c980" opacity="0.85" />
    </svg>
  );
}

function TrustCardsGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
      <rect x="9" y="7" width="17" height="26" rx="3" fill="none" stroke="#d5ad62" strokeOpacity="0.42" strokeWidth="1.2" transform="rotate(-10 17.5 20)" />
      <rect x="14" y="6" width="17" height="26" rx="3" fill="#0b1220" stroke="#d5ad62" strokeOpacity="0.75" strokeWidth="1.2" transform="rotate(8 22.5 19)" />
      <path d="M22.5 15l2 4.6 4.6 2-4.6 2-2 4.6-2-4.6-4.6-2 4.6-2z" fill="#e6c980" opacity="0.85" />
    </svg>
  );
}

function TrustSparkleGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
      <path d="M20 5l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" fill="none" stroke="#708c79" strokeOpacity="0.65" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="3.5" fill="#e6c980" opacity="0.9" />
    </svg>
  );
}

const TRUST_POINTS = [
  {
    glyph: TrustCompassGlyph,
    title: 'Tử Vi · Chiêm tinh · Thần số',
    description: 'Tính bằng công thức xác định, không do AI tạo ra.',
    atmosphere: 'radial-gradient(circle at 0% 0%, rgba(213,173,98,0.1), transparent 65%)',
  },
  {
    glyph: TrustCardsGlyph,
    title: 'Tarot',
    description: 'Rút ngẫu nhiên, minh bạch trong bộ 78 lá cổ điển.',
    atmosphere: 'radial-gradient(circle at 0% 0%, rgba(122,142,168,0.14), transparent 65%)',
  },
  {
    glyph: TrustSparkleGlyph,
    title: 'AI',
    description: 'Chỉ diễn giải kết quả — không thay đổi số liệu gốc.',
    atmosphere: 'radial-gradient(circle at 0% 0%, rgba(112,140,121,0.12), transparent 65%)',
  },
] as const;

function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="space-y-3">
      <div className="text-center">
        <h2 id="trust-heading" className="font-display text-heading-md font-semibold uppercase text-[#d5ad62]">
          Bắt đầu hành trình của bạn
        </h2>
      </div>
      {/* BOARD 01 FINAL CORRECTION: the founder flagged this row as visually thin/weak. Grown via
          padding, a larger icon badge, and a slightly heavier title — still 3 restrained pillars,
          no structural redesign. */}
      <div className="grid overflow-hidden rounded-[10px] border border-[#d5ad62]/20 tablet:grid-cols-3 tablet:divide-x tablet:divide-[#d5ad62]/15">
        {TRUST_POINTS.map((point) => (
          <div key={point.title} className="relative flex min-h-[92px] items-center gap-3 overflow-hidden border-b border-[#d5ad62]/15 bg-[#0d1623]/55 px-4 py-3 last:border-b-0 tablet:border-b-0">
            <div className="pointer-events-none absolute inset-0" style={{ background: point.atmosphere }} aria-hidden="true" />
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d5ad62]/25 bg-[#070b12]/50">
              <point.glyph />
            </span>
            <div className="relative">
              <h3 className="text-body-md font-semibold text-[#f2eee5]">{point.title}</h3>
              <p className="mt-1 text-body-sm leading-snug text-[#a6a7ac]">{point.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ isGuest }: { isGuest: boolean }) {
  return (
    <section aria-labelledby="final-cta-heading" className="relative overflow-hidden rounded-[24px] border border-[rgba(213,173,98,0.22)] bg-[#132030] px-6 py-14 text-center tablet:px-10 desktop:py-20">
      {/* Real painted celestial-mountain artwork (founder-supplied, previously unused) instead of a
          synthetic SVG approximation — gives the closing chapter genuine atmospheric depth.
          BOARD 01 FINAL CORRECTION: opacity raised (45% → 60%) and section padding grown so this
          reads as a deliberate cinematic close rather than a small banner in empty space. Same
          artwork, same layout — presence only. */}
      <Image
        src={`${HOME_ASSET_BASE}/ChatGPT Image Aug 21, 2026, 10_14_23 PM.png`}
        alt=""
        fill
        sizes="(min-width: 1280px) 1200px, 100vw"
        className="object-cover opacity-60"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(213,173,98,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#132030]/55 via-[#132030]/15 to-[#132030]/65" />
      {/* Approved Board 01 cloud-scroll ornaments replace the earlier hand-drawn CloudLines SVG
          approximation of the same motif. */}
      <Image
        src={`${BOARD01_ASSET_BASE}/16_cloud_ornament_center.webp`}
        alt=""
        aria-hidden="true"
        width={315}
        height={155}
        sizes="180px"
        className="pointer-events-none absolute -left-6 bottom-10 hidden h-auto w-44 opacity-[0.18] tablet:block"
      />
      <Image
        src={`${BOARD01_ASSET_BASE}/17_cloud_ornament_right.webp`}
        alt=""
        aria-hidden="true"
        width={455}
        height={165}
        sizes="180px"
        className="pointer-events-none absolute -right-6 bottom-10 hidden h-auto w-44 -scale-x-100 opacity-[0.18] tablet:block"
      />
      <div className="relative mx-auto max-w-xl">
        <h2 id="final-cta-heading" className="font-display text-heading-lg font-semibold text-[#f2eee5] desktop:text-display-lg">
          Hiểu mình từ nhiều góc nhìn.
        </h2>
        <p className="mt-3 text-body-md leading-relaxed text-[#d8d1c2]">
          Tử Vi, Tarot, bản đồ sao và thần số học — mỗi hệ thống một góc nhìn, cùng hướng về một câu hỏi: bạn là ai, và bạn đang ở đâu trên hành trình của mình.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <HomeButton href={isGuest ? '#try-tu-vi' : '/discover'} variant="primary">
            Khám phá bản thân
          </HomeButton>
          <HomeButton href={isGuest ? '#try-tarot' : '/discover/tarot'} variant="secondary">
            Trải Tarot
          </HomeButton>
        </div>
      </div>
    </section>
  );
}

function HomeButton({ href, children, variant, icon }: { href: string; children: React.ReactNode; variant: 'primary' | 'secondary'; icon?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-body-sm font-semibold transition-colors',
        variant === 'primary'
          ? 'bg-[#d5ad62] text-[#070b12] hover:bg-[#e6c980]'
          : 'border border-[#d5ad62]/35 bg-[#0b1220]/65 text-[#e6c980] hover:border-[#d5ad62]/60',
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

/**
 * V9 COMPOSITION PASS: 12 stars over a page that can run several thousand px tall reads as
 * essentially none per viewport — doubled the count and nudged opacity up (~×1.3) so the field is
 * actually visible while scrolling, still a plain low-opacity dot scatter, nothing added per
 * section.
 */
const PAGE_STARS = [
  [4, 8, 1.6, 0.42],
  [92, 4, 1.2, 0.32],
  [12, 22, 1, 0.3],
  [80, 30, 1.8, 0.4],
  [30, 15, 0.9, 0.26],
  [60, 45, 1.3, 0.34],
  [8, 55, 1, 0.28],
  [95, 60, 1.5, 0.36],
  [45, 70, 1, 0.26],
  [22, 85, 1.6, 0.38],
  [70, 90, 1, 0.28],
  [88, 95, 1.3, 0.32],
  [55, 10, 1.2, 0.3],
  [18, 40, 1.4, 0.3],
  [38, 60, 1, 0.24],
  [65, 65, 1.3, 0.3],
  [3, 78, 1.5, 0.34],
  [50, 82, 1, 0.24],
  [78, 48, 1.6, 0.32],
  [98, 88, 1.1, 0.26],
] as const;

/**
 * A very sparse, low-opacity star field + near-invisible film grain behind the whole Home page
 * (negative z-index so it sits behind every section without touching each section's own markup).
 * Home-scoped only — lives inside DashboardView, never touches styles/globals.css, so it can't leak
 * into any other route or Board. Positions are percentages so it scales with the page's real content
 * height instead of a fixed pixel canvas.
 */
/**
 * Approximate chapter journey down the page — soft, broad, percentage-positioned gradient washes
 * on this one shared layer. Section heights vary by content/auth state, so these are deliberately
 * diffuse rather than pinned to exact pixel boundaries — the goal is a quiet ambient drift as you
 * scroll, not a hard-edged zone map.
 *
 * V7 note (Board 01 reference-fidelity pass): the founder rejected the earlier version's two full
 * painted ink-wash mountain ridges + cloud bank + manuscript arc drawn across the middle of the
 * page as "filling every empty area" with scenery, when the reference keeps the middle of the page
 * quiet and reserves strong landscape art for the Hero and Final CTA (which already have their own
 * real imagery). This layer is now just the gradient wash + one faint celestial ring + sparse
 * stars — deep navy atmosphere, not a fantasy landscape.
 */
/**
 * V9 COMPOSITION PASS: the founder read the post-Hero page as "nearly flat black" — this system
 * already existed (added after an *earlier* rejection of two full painted mountain
 * ridges/cloud-bank filling the middle of the page, see the note below), so the fix here is
 * turning its existing washes up, not adding new landscape illustration. 3 washes → 5, roughly
 * lined up with Discovery / "Bắt đầu từ đâu" / Editorial / Trust / Final-CTA, each a little
 * stronger than before, still the same restrained navy+antique-gold family (no new hue, no new
 * imagery).
 */
const CHAPTER_ATMOSPHERE = [
  'radial-gradient(ellipse 100% 20% at 50% 14%, rgba(198,146,67,0.16), transparent 72%)',
  'radial-gradient(ellipse 100% 22% at 50% 34%, rgba(122,142,168,0.14), transparent 72%)',
  'radial-gradient(ellipse 100% 24% at 50% 55%, rgba(30,44,66,0.55), transparent 72%)',
  'radial-gradient(ellipse 100% 20% at 50% 74%, rgba(143,174,159,0.1), transparent 72%)',
  'radial-gradient(ellipse 100% 22% at 50% 92%, rgba(198,146,67,0.14), transparent 72%)',
  'linear-gradient(to bottom, #0b131f 0%, #101c2e 25%, #0f1c2c 50%, #0d1826 75%, #0b131f 100%)',
].join(', ');

function PageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: CHAPTER_ATMOSPHERE }} />
      {/* Two faint celestial rings — Discovery and Trust — an "occasional antique-gold haze," not
          scenery drawn at every chapter boundary. V9: added the 2nd ring, opacity nudged up. */}
      <svg className="h-full w-full" viewBox="0 0 1000 2600" preserveAspectRatio="none" aria-hidden="true">
        <circle cx="150" cy="480" r="420" fill="none" stroke="#e0bd72" strokeOpacity="0.16" strokeWidth="1.5" />
        <circle cx="880" cy="1980" r="360" fill="none" stroke="#e0bd72" strokeOpacity="0.13" strokeWidth="1.2" />
      </svg>
      <svg className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="page-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.94  0 0 0 0 0.91  0 0 0 0 0.86  0 0 0 0.05 0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#page-grain)" />
        {/* A handful of stars breathe (fixed indices/durations, not runtime Math.random — avoids
            SSR/CSR hydration mismatch, same approach as DestinyOrbit's constellation nodes). Most
            stars stay static per the brief's "not every star" rule. */}
        {PAGE_STARS.map(([x, y, r, o], i) => (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={r}
            fill={i % 5 === 0 ? '#e0bd72' : '#f1e9db'}
            opacity={o}
            className={
              i === 3
                ? 'motion-safe:animate-[mv-breathe_6s_ease-in-out_infinite]'
                : i === 9
                  ? 'motion-safe:animate-[mv-breathe_8s_ease-in-out_infinite]'
                  : i === 16
                    ? 'motion-safe:animate-[mv-breathe_9.5s_ease-in-out_infinite]'
                    : undefined
            }
          />
        ))}
      </svg>
    </div>
  );
}
