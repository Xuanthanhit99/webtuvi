'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, Compass, Moon, Play, Sparkles, Star, UsersRound } from 'lucide-react';
import type { ClientAnalyticsEventName, NatalChartDto, NumerologyReadingDto, TarotReadingDto, TuViChartDto } from '@beaconvie/types';
import { calculateLifePathNumber } from '@beaconvie/types/numerology';
import { dashboardApi } from '../api/dashboard-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/providers/auth-provider';
import { tarotApi } from '@/features/tarot/api/tarot-api';
import { numerologyApi } from '@/features/numerology/api/numerology-api';
import { natalChartApi } from '@/features/natal-chart/api/natal-chart-api';
import { tuViApi } from '@/features/tu-vi/api/tu-vi-api';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { readGuestNumerologyTrial, readGuestTarotTrial, saveGuestNumerologyTrial, saveGuestTarotTrial } from '@/features/guest-trials/guest-trial-storage';
import { cn } from '@/lib/cn';
import { trackEvent } from '@/lib/analytics';

const HOME_ASSET_BASE = '/assets/menh-vi/home';
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
  const premiumQuery = usePremiumStatus({ enabled: !!user });

  const greeting = useMemo(() => greetingForNow(), []);
  const tuViChart = latest<TuViChartDto>(tuViQuery.data?.items);
  const tarotReading = latest<TarotReadingDto>(tarotQuery.data?.items);
  const natalChart = latest<NatalChartDto>(natalQuery.data?.items);
  const numerologyReading = latest<NumerologyReadingDto>(numerologyQuery.data?.items);
  const lifePath = getLifePath(numerologyReading);
  const sunSign = getPlacementSign(natalChart, 'sun');
  const moonSign = getPlacementSign(natalChart, 'moon');

  useEffect(() => {
    if (authLoading) return;
    trackEvent('home_viewed', { feature: 'home', source: isGuest ? 'guest' : 'authenticated' });
  }, [authLoading, isGuest]);

  return (
    <div className="-mx-1 flex flex-col gap-6 text-[#f2eee5] tablet:-mx-2">
      <HomeHero
        authLoading={authLoading}
        isGuest={isGuest}
        userName={firstName(user?.displayName)}
        greeting={greeting}
        dashboardLoading={dashboardQuery.isLoading}
        dashboardError={dashboardQuery.isError}
        onRetryDashboard={() => dashboardQuery.refetch()}
        dailyText={dashboardQuery.data?.discoverySuggestion?.description}
      />

      <section aria-labelledby="features-heading" className="space-y-4">
        <SectionHeading id="features-heading" eyebrow="Khám phá Tử Vi Tarot" title="Bốn cánh cửa chính" />
        <div className="grid gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
          <FeatureCard
            title="Lá số Tử Vi"
            description={isGuest ? 'Khám phá lá số của bạn, rồi đăng nhập để lập và lưu lá số đầy đủ.' : tuViChart ? `Lá số gần nhất: Mệnh an tại ${tuViChart.palaces.menh}.` : 'Khám phá bản đồ vận mệnh của bạn.'}
            cta={isGuest ? 'Bắt đầu' : tuViChart ? 'Xem lá số' : 'Lập lá số'}
            href={isGuest ? '#try-tu-vi' : '/discover/tu-vi'}
            loading={!isGuest && tuViQuery.isLoading}
            error={tuViQuery.isError ? 'Không thể tải lá số.' : undefined}
            onRetry={() => tuViQuery.refetch()}
            analyticsEvent="home_tuvi_clicked"
            analyticsFeature="tu_vi"
            visual={<TuViFeatureVisual />}
          />
          <FeatureCard
            title="Tarot"
            description={
              isGuest
                ? 'Một lá bài cho câu hỏi hôm nay.'
                : tarotReading
                ? `Lần đọc gần nhất: ${tarotReading.spreadName}${tarotReading.cards[0]?.card.name ? ` · ${tarotReading.cards[0].card.name}` : ''}.`
                : 'Một lá bài cho câu hỏi của bạn.'
            }
            cta={isGuest ? 'Rút một lá' : tarotReading ? 'Xem trải bài' : 'Rút bài'}
            href={isGuest ? '#try-tarot' : '/discover/tarot'}
            loading={!isGuest && tarotQuery.isLoading}
            error={tarotQuery.isError ? 'Không thể tải lịch sử Tarot.' : undefined}
            onRetry={() => tarotQuery.refetch()}
            analyticsEvent="home_tarot_clicked"
            analyticsFeature="tarot"
            visual={<TarotFeatureVisual />}
          />
          <FeatureCard
            title="Bản đồ sao"
            description={
              isGuest
                ? 'Khám phá bản đồ bầu trời khi bạn sinh ra.'
                : natalChart
                ? `Mặt Trời ${sunSign ?? 'đã tính'} · Mặt Trăng ${moonSign ?? 'đã tính'}${natalChart.ascendant ? ` · ASC ${natalSignLabels[natalChart.ascendant.sign] ?? natalChart.ascendant.sign}` : ''}.`
                : 'Cần ngày, giờ và nơi sinh để hoàn thiện bản đồ sao.'
            }
            cta={isGuest ? 'Tìm hiểu' : natalChart ? 'Xem bản đồ' : 'Tạo bản đồ'}
            href={isGuest ? '#editorial-heading' : '/discover/natal-chart'}
            loading={!isGuest && natalQuery.isLoading}
            error={natalQuery.isError ? 'Không thể tải bản đồ sao.' : undefined}
            onRetry={() => natalQuery.refetch()}
            analyticsEvent="home_astrology_clicked"
            analyticsFeature="natal_chart"
            visual={<NatalFeatureVisual />}
          />
          <FeatureCard
            title="Thần số học"
            description={isGuest ? 'Con số nào đang kể câu chuyện của bạn?' : lifePath ? `Con số chủ đạo gần nhất: ${lifePath}.` : 'Tính các con số cốt lõi từ tên và ngày sinh.'}
            cta={isGuest ? 'Tính thử' : lifePath ? 'Xem luận giải' : 'Tính ngay'}
            href={isGuest ? '#try-numerology' : '/discover/numerology'}
            loading={!isGuest && numerologyQuery.isLoading}
            error={numerologyQuery.isError ? 'Không thể tải thần số học.' : undefined}
            onRetry={() => numerologyQuery.refetch()}
            analyticsEvent="home_numerology_clicked"
            analyticsFeature="numerology"
            visual={<NumerologyFeatureVisual />}
          />
        </div>
      </section>

      {isGuest && <GuestTrySection />}

      <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_320px]">
        <EditorialSection />
        <aside className="space-y-4">
          {!isGuest && <UpcomingRail />}
          <CommunityRail isGuest={isGuest} />
          {!isGuest && (
            <PremiumRail
              isLoading={premiumQuery.isLoading}
              isError={premiumQuery.isError}
              onRetry={() => premiumQuery.refetch()}
              isPremium={premiumQuery.data?.isPremium ?? false}
              paymentsEnabled={premiumQuery.data?.paymentsEnabled ?? false}
            />
          )}
          <AppPromo />
        </aside>
      </div>
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
}: {
  authLoading: boolean;
  isGuest: boolean;
  userName: string;
  greeting: string;
  dashboardLoading: boolean;
  dashboardError: boolean;
  dailyText?: string;
  onRetryDashboard: () => void;
}) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative min-h-[520px] overflow-hidden rounded-[24px] border border-[rgba(213,173,98,0.16)] bg-[#070b12] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] tablet:px-8 desktop:px-10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(213,173,98,0.16),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(112,140,121,0.15),transparent_28%),radial-gradient(circle_at_55%_55%,rgba(157,69,62,0.12),transparent_36%)]" />
      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle,rgba(242,238,229,0.58)_1px,transparent_1.5px)] [background-size:42px_42px]" />
      <Image src={`${HOME_ASSET_BASE}/hero-mountains.png`} alt="" fill priority sizes="(min-width: 1280px) 1120px, 100vw" className="object-cover object-bottom opacity-70" />
      <Image src={`${HOME_ASSET_BASE}/hero-mist.png`} alt="" fill sizes="(min-width: 1280px) 1120px, 100vw" className="pointer-events-none object-cover opacity-55" />
      <CloudLines className="absolute right-4 top-6 hidden h-28 w-60 text-[#d5ad62] opacity-25 tablet:block" />

      <div className="relative z-10 grid min-h-[460px] gap-7 desktop:grid-cols-[minmax(0,1fr)_300px_220px] desktop:items-center">
        <div className="max-w-xl self-center">
          {authLoading ? (
            <Skeleton className="mb-5 h-20 w-56 bg-white/10" />
          ) : isGuest ? (
            <>
              <p className="text-caption font-semibold uppercase tracking-[0.24em] text-[#e6c980]">Tử Vi Tarot</p>
              <h1 id="home-hero-heading" className="mt-3 text-[clamp(2.7rem,8vw,4.4rem)] font-semibold leading-[0.95] tracking-normal text-[#f2eee5]">
                Hiểu mình.
                <br />
                Nắm thời vận.
                <br />
                Sống chủ động hơn.
              </h1>
            </>
          ) : (
            <>
              <p className="text-body-md text-[#e6c980]">{greeting}</p>
              <h1 id="home-hero-heading" className="mt-2 text-[clamp(2.75rem,7vw,4.35rem)] font-semibold leading-[0.95] tracking-normal text-[#f2eee5]">
                {userName}
              </h1>
            </>
          )}
          <p className="mt-5 max-w-md text-body-lg leading-relaxed text-[#d8d1c2]">
            {isGuest ? 'Tử Vi · Tarot · Bản đồ sao · Thần số học. Không cần đăng ký để bắt đầu khám phá.' : 'Vũ trụ luôn vận động. Hiểu mình, hiểu thời vận, sống chủ động hơn mỗi ngày.'}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <HomeButton href={isGuest ? '#try-tarot' : '/discover'} variant="primary">
              {isGuest ? 'Khám phá ngay' : 'Xem vận trình hôm nay'}
            </HomeButton>
            <HomeButton href={isGuest ? '#try-numerology' : '/companion'} variant="secondary" icon={<Play className="h-4 w-4" aria-hidden="true" />}>
              {isGuest ? 'Không cần đăng ký' : 'Giới thiệu Tử Vi Tarot'}
            </HomeButton>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[300px]">
          <DestinyCompass />
        </div>
        <DailyInsight
          isGuest={isGuest}
          loading={dashboardLoading}
          error={dashboardError}
          text={dailyText}
          onRetry={onRetryDashboard}
        />
      </div>
    </section>
  );
}

export function DestinyCompass() {
  const branches = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  const han = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  return (
    <svg viewBox="0 0 260 260" aria-hidden="true" className="h-full w-full drop-shadow-[0_0_22px_rgba(213,173,98,0.20)]">
      <defs>
        <radialGradient id="destinyGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e6c980" stopOpacity="0.2" />
          <stop offset="65%" stopColor="#d5ad62" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#d5ad62" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="130" cy="130" r="128" fill="url(#destinyGlow)" />
      <g className="origin-center animate-[mv-orbit-spin_110s_linear_infinite] motion-reduce:animate-none">
        {[114, 98, 82, 66, 50].map((radius) => (
          <circle key={radius} cx="130" cy="130" r={radius} fill="none" stroke="#d5ad62" strokeOpacity={radius === 114 ? 0.42 : 0.2} strokeWidth="1" />
        ))}
        {branches.map((branch, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = 130 + Math.cos(angle) * 42;
          const y1 = 130 + Math.sin(angle) * 42;
          const x2 = 130 + Math.cos(angle) * 116;
          const y2 = 130 + Math.sin(angle) * 116;
          const tx = 130 + Math.cos(angle) * 100;
          const ty = 130 + Math.sin(angle) * 100;
          return (
            <g key={branch}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d5ad62" strokeOpacity="0.2" strokeWidth="1" />
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#f2eee5" fontSize="10" fontWeight="600">
                {branch}
              </text>
              <text x={130 + Math.cos(angle) * 76} y={130 + Math.sin(angle) * 76} textAnchor="middle" dominantBaseline="middle" fill="#8e7243" fontSize="8">
                {han[index]}
              </text>
            </g>
          );
        })}
      </g>
      <ellipse cx="130" cy="130" rx="106" ry="34" fill="none" stroke="#708c79" strokeOpacity="0.28" strokeWidth="1" transform="rotate(-18 130 130)" />
      {([
        [-44, -28],
        [50, -8],
        [25, 55],
      ] as const).map(([dx, dy], index) => (
        <circle key={`${dx}-${dy}`} cx={130 + dx} cy={130 + dy} r={index === 0 ? 3.5 : 2.6} fill="#e6c980" className="animate-pulse motion-reduce:animate-none" opacity="0.85" />
      ))}
      <path d="M130 111l5 14 15 5-15 5-5 14-5-14-15-5 15-5z" fill="#e6c980" opacity="0.9" />
      <circle cx="130" cy="130" r="22" fill="none" stroke="#e6c980" strokeOpacity="0.38" />
    </svg>
  );
}

function DailyInsight({ isGuest, loading, error, text, onRetry }: { isGuest: boolean; loading: boolean; error: boolean; text?: string; onRetry: () => void }) {
  if (isGuest) {
    return (
      <div className="rounded-[18px] border border-white/10 bg-[#0b1220]/75 p-4 backdrop-blur">
        <p className="text-body-sm font-semibold text-[#e6c980]">Bắt đầu nhẹ nhàng</p>
        <EnergyGauge label="Không có điểm cá nhân khi chưa đăng nhập" />
        <p className="mt-4 text-body-sm leading-relaxed text-[#d8d1c2]">
          Thử một lá Tarot hoặc tính nhanh con số chủ đạo trước. Hồ sơ cá nhân, lịch sử và luận giải sâu sẽ mở sau khi bạn đăng nhập.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[18px] border border-white/10 bg-[#0b1220]/75 p-4 backdrop-blur">
        <Skeleton className="mb-4 h-5 w-28 bg-white/10" />
        <Skeleton className="h-28 w-full bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-white/10 bg-[#0b1220]/75 p-4 backdrop-blur">
        <p className="text-body-sm font-semibold text-[#e6c980]">Vận trình hôm nay</p>
        <p className="mt-3 text-body-sm text-[#a6a7ac]">Không thể tải vận trình hôm nay.</p>
        <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-md border border-[#d5ad62]/35 px-4 text-body-sm font-semibold text-[#e6c980]">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/10 bg-[#0b1220]/75 p-4 backdrop-blur">
      <p className="text-body-sm font-semibold text-[#e6c980]">Vận trình hôm nay</p>
      <EnergyGauge label="Chưa có điểm năng lượng" />
      <p className="mt-4 text-body-sm leading-relaxed text-[#d8d1c2]">{text ?? 'Vận trình hôm nay chưa được tạo.'}</p>
      <Link href="/discover" className="mt-4 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
        Xem vận trình hôm nay <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function EnergyGauge({ score, label }: { score?: number; label?: string }) {
  const normalized = typeof score === 'number' ? Math.max(0, Math.min(score, 100)) : null;
  const angle = normalized === null ? 0 : (normalized / 100) * 270;
  return (
    <div className="mt-4 flex items-center gap-4" aria-label={normalized === null ? label : `Năng lượng ${normalized} trên 100`}>
      <svg viewBox="0 0 120 74" className="h-20 w-28" aria-hidden="true">
        <path d="M18 62a42 42 0 0 1 84 0" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" strokeLinecap="round" />
        {normalized !== null && (
          <path
            d="M18 62a42 42 0 0 1 84 0"
            fill="none"
            stroke="#d5ad62"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${normalized} 100`}
          />
        )}
        <line x1="60" y1="62" x2="60" y2="30" stroke="#e6c980" strokeWidth="2" strokeLinecap="round" transform={`rotate(${angle - 135} 60 62)`} />
        <circle cx="60" cy="62" r="4" fill="#e6c980" />
      </svg>
      <div>
        <p className="text-[1.8rem] font-semibold leading-none text-[#f2eee5]">{normalized ?? '--'}</p>
        <p className="mt-1 text-caption uppercase tracking-[0.16em] text-[#a6a7ac]">{normalized === null ? 'Đang chờ dữ liệu' : 'trên 100'}</p>
      </div>
    </div>
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
  visual,
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
  visual: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[224px] flex-col rounded-[18px] border border-white/10 bg-[#101827] p-5" aria-label={`${title} đang tải`}>
        <div className="mb-4 h-20">{visual}</div>
        <Skeleton className="h-6 w-28 bg-white/10" />
        <Skeleton className="mt-3 h-16 w-full bg-white/10" />
        <Skeleton className="mt-auto h-5 w-24 bg-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[224px] flex-col rounded-[18px] border border-white/10 bg-[#101827] p-5">
        <div className="mb-4 h-20">{visual}</div>
        <h3 className="text-body-lg font-semibold text-[#f2eee5]">{title}</h3>
        <p className="mt-2 flex-1 text-body-sm leading-relaxed text-[#a6a7ac]">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-[#d5ad62]/35 px-4 text-body-sm font-semibold text-[#e6c980] transition-colors hover:border-[#d5ad62]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]"
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
      className="group flex min-h-[224px] flex-col rounded-[18px] border border-white/10 bg-[#101827] p-5 transition-colors hover:-translate-y-0.5 hover:border-[#d5ad62]/45 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62] motion-reduce:transform-none"
    >
      <div className="mb-4 h-20">{visual}</div>
      <h3 className="text-body-lg font-semibold text-[#f2eee5]">{title}</h3>
      <p className="mt-2 flex-1 text-body-sm leading-relaxed text-[#a6a7ac]">{description}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-body-sm font-semibold text-[#e6c980]">
        {cta} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function GuestTrySection() {
  return (
    <section aria-labelledby="try-heading" className="grid gap-4 desktop:grid-cols-3">
      <div className="desktop:col-span-3">
        <SectionHeading id="try-heading" eyebrow="Thử trước khi đăng ký" title="Nhận giá trị trước, lưu lại sau" />
      </div>
      <GuestTarotPreview />
      <GuestNumerologyPreview />
      <GuestTuViBoundary />
    </section>
  );
}

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
    <section id="try-tarot" className="rounded-[18px] border border-white/10 bg-[#101827] p-5">
      <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Tarot</p>
      <h3 className="mt-2 text-body-lg font-semibold text-[#f2eee5]">Rút một lá cho hôm nay</h3>
      <p className="mt-2 text-body-sm leading-relaxed text-[#a6a7ac]">Bản thử này không lưu lịch sử và không gọi AI. Luận giải đầy đủ cần tài khoản để giữ ngữ cảnh cho bạn.</p>
      {isDrawing && <Skeleton className="mt-4 h-28 w-full bg-white/10" />}
      {card && (
        <div className="mt-4 rounded-[14px] border border-[#d5ad62]/20 bg-[#070b12]/70 p-4" aria-live="polite">
          <p className="font-display text-heading-md text-[#f2eee5]">{card.name}</p>
          <p className="mt-2 text-body-sm text-[#d8d1c2]">{card.meaning}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
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
    <section id="try-numerology" className="rounded-[18px] border border-white/10 bg-[#101827] p-5">
      <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Thần số học</p>
      <h3 className="mt-2 text-body-lg font-semibold text-[#f2eee5]">Tính nhanh con số chủ đạo</h3>
      <p className="mt-2 text-body-sm leading-relaxed text-[#a6a7ac]">Ngày sinh chỉ ở trong trình duyệt cho bản thử này. Hồ sơ đầy đủ dùng engine backend sau khi đăng nhập.</p>
      <form onSubmit={calculate} noValidate className="mt-4 flex flex-col gap-3">
        <label htmlFor="guest-birth-date" className="text-body-sm font-semibold text-[#f2eee5]">
          Ngày sinh
        </label>
        <input
          id="guest-birth-date"
          type="date"
          value={birthDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) => {
            setBirthDate(event.target.value);
            setError(null);
          }}
          className="min-h-11 rounded-md border border-white/10 bg-[#0b1220] px-3 text-body-sm text-[#f2eee5]"
        />
        {error && (
          <p className="text-body-sm text-[#e6c980]" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="min-h-11 rounded-md bg-[#d5ad62] px-4 text-body-sm font-semibold text-[#070b12]">
          Tính thử
        </button>
      </form>
      {result !== null && (
        <div className="mt-4 rounded-[14px] border border-[#d5ad62]/20 bg-[#070b12]/70 p-4">
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
    <section id="try-tu-vi" className="rounded-[18px] border border-white/10 bg-[#101827] p-5">
      <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">Lá số Tử Vi</p>
      <h3 className="mt-2 text-body-lg font-semibold text-[#f2eee5]">Xem trước cách Tử Vi Tarot lập lá số</h3>
      <p className="mt-2 text-body-sm leading-relaxed text-[#a6a7ac]">
        Tử Vi cần giờ sinh và giới tính, nên Tử Vi Tarot chỉ mở phần lập lá số đầy đủ sau khi bạn có tài khoản để bảo vệ dữ liệu cá nhân và lưu kết quả đúng nơi.
      </p>
      <button
        type="button"
        onClick={() => {
          trackEvent('guest_tuvi_started', { feature: 'tu_vi' });
          setGateOpen(true);
        }}
        className="mt-4 min-h-11 rounded-md bg-[#d5ad62] px-4 text-body-sm font-semibold text-[#070b12]"
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
      <p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#d5ad62]">{eyebrow}</p>
      <h2 id={id} className="mt-1 text-heading-md font-semibold text-[#f2eee5]">
        {title}
      </h2>
    </div>
  );
}

function EditorialSection() {
  return (
    <section aria-labelledby="editorial-heading" className="space-y-4">
      <SectionHeading id="editorial-heading" eyebrow="Bài viết nổi bật" title="Đọc thêm để hiểu mình" />
      <div className="grid gap-4 tablet:grid-cols-2">
        {editorialFallbacks.map((article) => (
          <Link
            key={article.title}
            href={article.href}
            onClick={() => trackEvent('home_article_clicked', { feature: 'home', source: article.slug })}
            className="group overflow-hidden rounded-[18px] border border-white/10 bg-[#101827] transition-colors hover:border-[#d5ad62]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d5ad62]"
          >
            <div className="relative aspect-[16/10]">
              <Image src={article.image} alt="" fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            </div>
            <div className="p-4">
              <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#d5ad62]">{article.category}</p>
              <h3 className="mt-2 text-body-lg font-semibold text-[#f2eee5]">{article.title}</h3>
              <p className="mt-2 text-caption text-[#a6a7ac]">{article.readTime}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function UpcomingRail() {
  return (
    <RailCard title="Sắp tới" icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}>
      <p className="text-body-sm text-[#a6a7ac]">Chưa có sự kiện sắp tới.</p>
      <div className="mt-4 flex gap-2 text-[#d5ad62]">
        <Moon className="h-4 w-4" aria-hidden="true" />
        <Star className="h-4 w-4" aria-hidden="true" />
      </div>
    </RailCard>
  );
}

function CommunityRail({ isGuest }: { isGuest: boolean }) {
  return (
    <RailCard title="Cộng đồng" icon={<UsersRound className="h-4 w-4" aria-hidden="true" />}>
      <p className="text-body-sm text-[#a6a7ac]">
        Một không gian để chia sẻ trải nghiệm, góc nhìn và những câu chuyện của riêng bạn. Tính năng đang được hoàn thiện.
      </p>
      <Link
        href="/community"
        onClick={() => trackEvent('home_community_clicked', { feature: 'home', source: isGuest ? 'guest' : 'authenticated' })}
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-[#e6c980]"
      >
        Xem trạng thái cộng đồng <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </RailCard>
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

function AppPromo() {
  return (
    <RailCard title="Ứng dụng Tử Vi Tarot" icon={<Compass className="h-4 w-4" aria-hidden="true" />}>
      <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-[14px] bg-[#070b12]">
        <Image src={`${HOME_ASSET_BASE}/app-preview.png`} alt="" fill sizes="320px" className="object-cover" />
      </div>
      <p className="text-body-sm text-[#a6a7ac]">Sắp ra mắt.</p>
      <Link
        href="/contact"
        onClick={() => trackEvent('home_app_clicked', { feature: 'home', source: 'coming_soon' })}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-[#d5ad62]/35 px-4 text-body-sm font-semibold text-[#e6c980]"
      >
        Nhận tin ra mắt
      </Link>
    </RailCard>
  );
}

function RailCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-[#101827] p-4">
      <div className="mb-3 flex items-center gap-2 text-[#e6c980]">
        {icon}
        <h3 className="text-body-sm font-semibold uppercase tracking-[0.14em]">{title}</h3>
      </div>
      {children}
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

function CloudLines({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 120" className={className} fill="none" aria-hidden="true">
      <path d="M18 72h52c18 0 18-22 0-22H54c0-20 31-24 41-8 11-24 52-18 52 8h24c18 0 18 22 0 22H98" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M96 88h72c14 0 14-17 0-17h-12c0-15 22-18 30-6 9-19 40-14 40 6h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function TuViFeatureVisual() {
  return (
    <svg viewBox="0 0 180 78" className="h-full w-full" aria-hidden="true">
      <rect x="28" y="8" width="58" height="58" fill="none" stroke="#d5ad62" strokeOpacity="0.75" />
      {[1, 2].map((i) => (
        <line key={i} x1={28 + i * 19.3} y1="8" x2={28 + i * 19.3} y2="66" stroke="#d5ad62" strokeOpacity="0.32" />
      ))}
      {[1, 2].map((i) => (
        <line key={i} x1="28" y1={8 + i * 19.3} x2="86" y2={8 + i * 19.3} stroke="#d5ad62" strokeOpacity="0.32" />
      ))}
      <circle cx="122" cy="37" r="24" fill="none" stroke="#708c79" strokeOpacity="0.55" />
      <path d="M122 17v40M102 37h40" stroke="#708c79" strokeOpacity="0.35" />
    </svg>
  );
}

function TarotFeatureVisual() {
  return (
    <svg viewBox="0 0 180 78" className="h-full w-full" aria-hidden="true">
      <rect x="56" y="12" width="34" height="52" rx="5" fill="#0b1220" stroke="#d5ad62" strokeOpacity="0.72" transform="rotate(-8 73 38)" />
      <rect x="88" y="11" width="34" height="52" rx="5" fill="#0b1220" stroke="#d5ad62" strokeOpacity="0.72" transform="rotate(8 105 37)" />
      <path d="M73 29l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM105 28l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e6c980" opacity="0.75" />
    </svg>
  );
}

function NatalFeatureVisual() {
  return (
    <svg viewBox="0 0 180 78" className="h-full w-full" aria-hidden="true">
      <circle cx="88" cy="38" r="28" fill="none" stroke="#d5ad62" strokeOpacity="0.68" />
      <circle cx="88" cy="38" r="15" fill="none" stroke="#708c79" strokeOpacity="0.45" />
      <path d="M88 10v56M60 38h56M68 18l40 40M108 18L68 58" stroke="#d5ad62" strokeOpacity="0.22" />
      <circle cx="67" cy="20" r="3" fill="#e6c980" />
      <circle cx="108" cy="57" r="3" fill="#708c79" />
      <circle cx="116" cy="34" r="2.5" fill="#9d453e" />
    </svg>
  );
}

function NumerologyFeatureVisual() {
  return (
    <svg viewBox="0 0 180 78" className="h-full w-full" aria-hidden="true">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect key={`${row}-${col}`} x={54 + col * 24} y={8 + row * 20} width="18" height="14" rx="3" fill="none" stroke="#d5ad62" strokeOpacity="0.45" />
        )),
      )}
      {['1', '8', '6', '3', '9'].map((digit, index) => (
        <text key={digit + index} x={63 + (index % 3) * 24} y={19 + Math.floor(index / 3) * 20} textAnchor="middle" fill="#f2eee5" fontSize="10" fontWeight="700">
          {digit}
        </text>
      ))}
      <path d="M42 38c25-28 70-28 96 0-26 28-71 28-96 0z" fill="none" stroke="#708c79" strokeOpacity="0.38" />
    </svg>
  );
}
