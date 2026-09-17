'use client';

import { Plus } from 'lucide-react';
import type { ConversationDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export interface ConversationSidebarProps {
  conversations: ConversationDto[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  creating: boolean;
}

export function ConversationSidebar({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onCreate,
  creating,
}: ConversationSidebarProps) {
  return (
    <nav aria-label="Cuộc trò chuyện" className="flex h-full flex-col gap-3">
      <Button onClick={onCreate} loading={creating} fullWidth variant="secondary" size="sm">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Cuộc trò chuyện mới
      </Button>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
        <p className="px-1 text-body-sm text-text-secondary">Chưa có cuộc trò chuyện nào. Nói lời chào bất cứ khi nào bạn sẵn sàng.</p>
      )}

      <ul className="flex flex-col gap-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              aria-current={conversation.id === activeId ? 'true' : undefined}
              className={cn(
                'flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors duration-fast',
                conversation.id === activeId
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary',
              )}
            >
              <span className="truncate text-body-sm font-medium">{conversation.title ?? 'Cuộc trò chuyện chưa có tiêu đề'}</span>
              <span className="text-caption text-text-tertiary">{timeAgo(conversation.updatedAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
