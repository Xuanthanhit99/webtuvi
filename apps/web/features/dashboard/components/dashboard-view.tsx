'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NatalChartDto, NumerologyReadingDto, TarotReadingDto, TuViChartDto, TuViCurrentTieuHanDto, TuViDaiVanCycleDto } from '@beaconvie/types';
import { dashboardApi } from '../api/dashboard-api';
import { HomeFooter } from './home/home-footer';
import { HomeV5Experience } from './home/home-v5-experience';
import type { TodayOverviewSignal } from './home/today-overview';
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
  const currentDaiVan = formatDaiVan(tuViChart?.currentDaiVan ?? null);
  const currentTieuHan = formatTieuHan(tuViChart?.currentTieuHan ?? null);
  const todayTuVi: TodayOverviewSignal | null = tuViChart
    ? {
        label: 'Tử Vi hiện tại',
        value: currentTieuHan ?? currentDaiVan ?? `Mệnh an tại ${tuViChart.palaces.menh}`,
        href: '/discover/tu-vi',
      }
    : null;
  const todayTarot: TodayOverviewSignal | null = tarotReading
    ? {
        label: 'Tarot gần nhất',
        value: `${tarotReading.spreadName}${tarotReading.cards[0]?.card.name ? ` · ${tarotReading.cards[0].card.name}` : ''}`,
        href: '/discover/tarot',
      }
    : null;
  const todayNatal: TodayOverviewSignal | null = natalChart
    ? {
        label: 'Bản đồ sao',
        value: `Mặt Trời ${sunSign ?? 'đã tính'} · Mặt Trăng ${moonSign ?? 'đã tính'}`,
        href: '/discover/natal-chart',
      }
    : null;
  const todayNumerology: TodayOverviewSignal | null = numerologyReading && lifePath !== null
    ? {
        label: 'Thần số học',
        value: `Con số chủ đạo ${lifePath}`,
        href: '/discover/numerology',
      }
    : null;
  const todayOverviewLoading = !isGuest && (tuViQuery.isLoading || tarotQuery.isLoading || natalQuery.isLoading || numerologyQuery.isLoading);

  useEffect(() => {
    if (authLoading) return;
    trackEvent('home_viewed', { feature: 'home', source: isGuest ? 'guest' : 'authenticated' });
  }, [authLoading, isGuest]);

  return (
    <div className="relative flex flex-col gap-10 text-[#f2eee5] tablet:gap-12">
      <HomeV5Experience
        isGuest={isGuest}
        greeting={greeting}
        userName={firstName(user?.displayName)}
        loading={todayOverviewLoading}
        signals={[todayTarot, todayTuVi, todayNatal, todayNumerology].filter((signal): signal is TodayOverviewSignal => signal !== null)}
        continuity={continuityItem ? { title: continuityItem.title, description: continuityItem.description, href: continuityItem.href } : null}
      />

      <HomeFooter />
    </div>
  );
}

