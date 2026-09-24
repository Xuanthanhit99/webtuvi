'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { MemoryTimelineItemDto, MemoryTypeValue } from '@beaconvie/types';
import { memoryApi } from '../api/memory-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ImportanceBadge } from './importance-badge';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả loại' },
  { value: 'IDENTITY', label: 'Danh tính' },
  { value: 'PREFERENCE', label: 'Sở thích' },
  { value: 'GOAL', label: 'Mục tiêu' },
  { value: 'RELATIONSHIP', label: 'Mối quan hệ' },
  { value: 'HABIT', label: 'Thói quen' },
  { value: 'ROUTINE', label: 'Lịch trình' },
  { value: 'ACHIEVEMENT', label: 'Thành tựu' },
  { value: 'CHALLENGE', label: 'Thử thách' },
  { value: 'EMOTION', label: 'Cảm xúc' },
  { value: 'IMPORTANT_EVENT', label: 'Sự kiện quan trọng' },
  { value: 'DECISION', label: 'Quyết định' },
  { value: 'INTEREST', label: 'Mối quan tâm' },
  { value: 'WORK', label: 'Công việc' },
  { value: 'STUDY', label: 'Học tập' },
  { value: 'PET', label: 'Thú cưng' },
  { value: 'LOCATION_PREFERENCE', label: 'Sở thích địa điểm' },
  { value: 'HEALTH', label: 'Sức khỏe' },
  { value: 'CUSTOM', label: 'Khác' },
];

const GROUP_LABELS: Record<MemoryTimelineItemDto['group'], string> = {
  today: 'Hôm nay',
  this_week: 'Tuần này',
  earlier: 'Trước đó',
};

export interface MemoryTimelineProps {
  onSelect: (id: string) => void;
}

export function MemoryTimeline({ onSelect }: MemoryTimelineProps) {
  const [type, setType] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filters = { type: (type || undefined) as MemoryTypeValue | undefined, status: showArchived ? 'ARCHIVED' : undefined };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useInfiniteQuery({
    queryKey: ['memory-timeline', filters],
    queryFn: ({ pageParam }: { pageParam?: string }) => memoryApi.timeline({ ...filters, cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Dropdown id="memory-type-filter" label="Lọc theo loại" value={type} options={TYPE_OPTIONS} onChange={setType} className="w-56" />
        <Button
          type="button"
          variant={showArchived ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'Đang hiện lưu trữ' : 'Hiện lưu trữ'}
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState description="Không thể tải dòng thời gian ký ức của bạn." onRetry={() => refetch()} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title={showArchived ? 'Chưa có ký ức lưu trữ nào.' : 'Chưa có ký ức nào.'}
          description={
            showArchived
              ? undefined
              : 'Khi bạn nhờ Mệnh Vi ghi nhớ điều gì đó từ một cuộc trò chuyện, nó sẽ hiện ở đây — cùng với nguồn, lý do, và lựa chọn đồng ý của bạn luôn hiển thị rõ.'
          }
        />
      )}

      <ol className="flex flex-col gap-5" aria-label="Dòng thời gian ký ức">
        {items.map((item, index) => {
          const showGroupHeader = index === 0 || item.group !== items[index - 1]?.group;
          return (
            <li key={item.id}>
              {showGroupHeader && (
                <h2 className="mb-2 text-body-sm font-semibold uppercase tracking-wide text-text-secondary">
                  {GROUP_LABELS[item.group]}
                </h2>
              )}
              <Card
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect(item.id)}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="insight">{item.type.replace(/_/g, ' ').toLowerCase()}</Badge>
                    <ImportanceBadge score={item.importanceScore} explanations={item.importanceExplanations} pinned={item.pinned} />
                  </div>
                  <time className="text-caption text-text-tertiary" dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </time>
                </div>
                <p className="font-medium text-text-primary">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-body-sm text-text-secondary">{item.summary}</p>
                <p className="mt-2 text-caption text-text-tertiary">
                  {item.whyThisMemory} {item.sourceAvailable ? '' : '(nguồn không còn khả dụng)'}
                </p>
              </Card>
            </li>
          );
        })}
      </ol>

      {hasNextPage && (
        <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
          Load more
        </Button>
      )}
    </div>
  );
}
