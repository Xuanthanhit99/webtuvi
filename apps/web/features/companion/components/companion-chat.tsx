'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompanionMessageDto } from '@beaconvie/types';
import { companionApi } from '../api/companion-api';
import { Avatar } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { ProgressCircular } from '@/components/ui/progress';

const MESSAGES_KEY = ['companion', 'messages'];

function Bubble({ message }: { message: CompanionMessageDto }) {
  const isCompanion = message.role === 'companion';
  return (
    <div className={`flex items-end gap-2 ${isCompanion ? '' : 'flex-row-reverse'}`}>
      {isCompanion ? <Logo withWordmark={false} /> : <Avatar name="You" size="sm" />}
      <div
        className={`max-w-sm rounded-lg px-4 py-3 text-body-md ${
          isCompanion ? 'rounded-bl-sm bg-surface text-text-primary' : 'rounded-br-sm bg-insight/15 text-text-primary'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function CompanionChat() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: MESSAGES_KEY,
    queryFn: companionApi.getMessages,
  });
  const sendMessage = useMutation({
    mutationFn: companionApi.sendMessage,
    onSuccess: (newMessages) => {
      queryClient.setQueryData<CompanionMessageDto[]>(MESSAGES_KEY, (prev) => [...(prev ?? []), ...newMessages]);
    },
  });

  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [data?.length, sendMessage.isPending]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="ml-auto h-12 w-1/2" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="We couldn't reach your Companion right now." onRetry={() => refetch()} />;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft;
    try {
      await sendMessage.mutateAsync(text);
      setDraft('');
    } catch {
      // Preserve the draft on failure so nothing typed is lost.
    }
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col">
      <h1 className="mb-4 font-display text-heading-lg text-text-primary">Companion</h1>
      <div ref={listRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto">
        {data?.length === 0 && (
          <p className="text-body-md text-text-secondary">
            I&rsquo;m here whenever you&rsquo;re ready. We can start with something small.
          </p>
        )}
        {data?.map((m) => <Bubble key={m.id} message={m} />)}
        {sendMessage.isPending && <ProgressCircular label="Thinking…" />}
      </div>
      <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-4">
        <label htmlFor="companion-message" className="sr-only">
          Message your Companion
        </label>
        <Input
          id="companion-message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What's on your mind?"
          disabled={sendMessage.isPending}
          autoComplete="off"
        />
        <Button type="submit" loading={sendMessage.isPending} disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
