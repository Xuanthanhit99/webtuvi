'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import type { NatalChartDto, NumerologyReadingDto, TarotReadingDto, TuViChartDto, TuViCurrentTieuHanDto, TuViDaiVanCycleDto } from '@beaconvie/types';
import { dashboardApi } from '../api/dashboard-api';
import { HomeHero } from './home/hero';
import { FeatureGrid } from './home/feature-grid';
import { TodaySuggestions } from './home/today-suggestions';
import { ArticlesSection } from './home/articles-section';
import { MobileAppPromo } from './home/mobile-app-promo';
import { HomeFooter } from './home/home-footer';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { tarotApi } from '@/features/tarot/api/tarot-api';
import { numerologyApi } from '@/features/numerology/api/numerology-api';
import { natalChartApi } from '@/features/natal-chart/api/natal-chart-api';
import { tuViApi } from '@/features/tu-vi/api/tu-vi-api';
import { trackEvent } from '@/lib/analytics';

const HOME_QUERY_OPTIONS = {
  enabled: false,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
};

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
  const isGuest = !user;

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
  const dailyText = dashboardQuery.data?.discoverySuggestion?.description;

  useEffect(() => {
    if (authLoading) return;
    trackEvent('home_viewed', { feature: 'home', source: isGuest ? 'guest' : 'authenticated' });
  }, [authLoading, isGuest]);

  return (
    <div className="relative flex flex-col gap-10 text-[#f2eee5] tablet:gap-12">
      <PageAtmosphere />
      <HomeHero
        authLoading={false}
        isGuest={isGuest}
        userName={firstName(user?.displayName)}
        greeting={greeting}
        dashboardLoading={dashboardQuery.isLoading}
        dashboardError={dashboardQuery.isError}
        onRetryDashboard={() => dashboardQuery.refetch()}
        dailyText={dailyText}
        tuViChart={tuViChart}
        tuViLoading={!isGuest && tuViQuery.isLoading}
      />

      <FeatureGrid
        isGuest={isGuest}
        tuViChart={tuViChart}
        tuViLoading={!isGuest && tuViQuery.isLoading}
        tuViError={tuViQuery.isError}
        onRetryTuVi={() => tuViQuery.refetch()}
        tarotReading={tarotReading}
        tarotLoading={!isGuest && tarotQuery.isLoading}
        tarotError={tarotQuery.isError}
        onRetryTarot={() => tarotQuery.refetch()}
        natalChart={natalChart}
        natalLoading={!isGuest && natalQuery.isLoading}
        natalError={natalQuery.isError}
        onRetryNatal={() => natalQuery.refetch()}
        sunSign={sunSign}
        moonSign={moonSign}
        lifePath={lifePath}
        numerologyLoading={!isGuest && numerologyQuery.isLoading}
        numerologyError={numerologyQuery.isError}
        onRetryNumerology={() => numerologyQuery.refetch()}
      />

      {!isGuest && (
        <ForYouSection tuViChart={tuViChart} tuViLoading={!isGuest && tuViQuery.isLoading} continuityItem={continuityItem} continuityLoading={continuityLoading} />
      )}

      <TodaySuggestions energyText={dailyText} />

      <ArticlesSection />

      <MobileAppPromo />

      <HomeFooter />
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

/**
 * Real, tested continuity data (current Đại Vận/Tiểu Hạn cycle, most recent reading across
 * modules) — not part of the founder's new named-section list, but not one of the onboarding/
 * trust sections it asked to delete either, so it's kept rather than discarded (see the Home
 * rebuild report for the reasoning).
 */
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
    <section aria-labelledby="for-you-heading" className="space-y-4">
      <h2 id="for-you-heading" className="font-display text-heading-md font-semibold text-[#f2eee5]">
        Điều đang diễn ra với bạn
      </h2>
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
 * Deep navy atmosphere, not a fantasy landscape — Hero/TodaySuggestions already carry their own
 * real imagery, this layer just keeps the quiet space between sections from reading as flat black.
 */
const CHAPTER_ATMOSPHERE = [
  'radial-gradient(ellipse 100% 20% at 50% 14%, rgba(198,146,67,0.16), transparent 72%)',
  'radial-gradient(ellipse 100% 22% at 50% 34%, rgba(147,112,219,0.14), transparent 72%)',
  'radial-gradient(ellipse 100% 24% at 50% 55%, rgba(30,44,66,0.55), transparent 72%)',
  'radial-gradient(ellipse 100% 20% at 50% 74%, rgba(74,124,196,0.1), transparent 72%)',
  'radial-gradient(ellipse 100% 22% at 50% 92%, rgba(198,146,67,0.14), transparent 72%)',
  'linear-gradient(to bottom, #0b131f 0%, #101c2e 25%, #0f1c2c 50%, #0d1826 75%, #0b131f 100%)',
].join(', ');

function PageAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: CHAPTER_ATMOSPHERE }} />
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
