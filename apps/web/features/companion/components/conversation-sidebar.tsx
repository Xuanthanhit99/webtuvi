'use client';

import { Plus } from 'lucide-react';
import type { ConversationDto } from '@beaconvie/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
    <nav aria-label="Conversations" className="flex h-full flex-col gap-3">
      <Button onClick={onCreate} loading={creating} fullWidth variant="secondary" size="sm">
        <Plus className="h-4 w-4" aria-hidden="true" />
        New conversation
      </Button>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
        <p className="px-1 text-body-sm text-text-secondary">No conversations yet. Say hello whenever you&rsquo;re ready.</p>
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
              <span className="truncate text-body-sm font-medium">{conversation.title ?? 'Untitled conversation'}</span>
              <span className="text-caption text-text-tertiary">{timeAgo(conversation.updatedAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
