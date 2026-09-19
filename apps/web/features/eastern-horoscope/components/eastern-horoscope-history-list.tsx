'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePremiumStatus } from '@/features/premium/hooks/use-premium-status';
import { easternHoroscopeApi, type ListProfilesFilters } from '../api/eastern-horoscope-api';
import { PROFILE_STATUS_BADGE_VARIANT, PROFILE_STATUS_LABELS } from '../labels';

// Mirrors the backend's FREE_HISTORY_LIMIT (eastern-horoscope-record.service.ts) — display-only.
const FREE_HISTORY_LIMIT = 20;

export function EasternHoroscopeHistoryList({ filters, onSelect }: { filters: ListProfilesFilters; onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['eastern-horoscope', 'profiles', filters], queryFn: () => easternHoroscopeApi.listProfiles(filters) });
  const { data: premiumStatus } = usePremiumStatus();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="Chưa có hồ sơ" description="Khám phá bản mệnh để bắt đầu lưu lịch sử Ngũ Hành Phương Đông." />;
  }

  const atFreeCap = !premiumStatus?.isPremium && data.total >= FREE_HISTORY_LIMIT;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label="Lịch sử hồ sơ">
        {data.items.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              onClick={() => onSelect(profile.id)}
              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2 text-left transition-colors duration-fast hover:bg-surface-raised"
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-sm font-semibold text-text-primary">
                  {profile.zodiacAnimal.vi} — {profile.element}
                </span>
                <span className="text-caption text-text-secondary">Ngày sinh {profile.birthDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={PROFILE_STATUS_BADGE_VARIANT[profile.status]}>{PROFILE_STATUS_LABELS[profile.status]}</Badge>
                <span className="text-caption text-text-tertiary">{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {atFreeCap && (
        <p className="text-caption text-text-secondary">
          Gói Miễn phí hiển thị {FREE_HISTORY_LIMIT} hồ sơ gần nhất.{' '}
          <Link href="/premium?reason=required" className="text-insight hover:underline">
            Nâng cấp để lưu lịch sử không giới hạn
          </Link>
          .
        </p>
      )}
    </div>
  );
}
