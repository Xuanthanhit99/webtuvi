'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations-api';
import { useCompanionConversation } from '../hooks/use-companion-conversation';
import { ConversationSidebar } from './conversation-sidebar';
import { MessageItem, StreamingMessageItem } from './message-item';
import { Composer } from './composer';
import { IconButton } from '@/components/ui/icon-button';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toast';

const CONVERSATIONS_KEY = ['companion', 'conversations'];

export function CompanionView() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  // The active conversation lives in the URL (?c=<id>) — not just component
  // state — so a reload or a shared/bookmarked link returns to the same
  // conversation instead of silently losing it.
  const activeId = searchParams.get('c');
  const [showListOnMobile, setShowListOnMobile] = useState(!activeId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function selectConversation(id: string | null) {
    router.replace(id ? `/companion?c=${id}` : '/companion', { scroll: false });
  }

  const {
    data: conversations,
    isLoading: conversationsLoading,
    isError: conversationsError,
    refetch: refetchConversations,
  } = useQuery({ queryKey: CONVERSATIONS_KEY, queryFn: conversationsApi.list });

  const createConversation = useMutation({
    mutationFn: () => conversationsApi.create(),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      selectConversation(conversation.id);
      setShowListOnMobile(false);
    },
    onError: () => toast.error("Couldn't start a new conversation. Please try again."),
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      selectConversation(null);
      setShowListOnMobile(true);
      setConfirmDelete(false);
      toast.success('Conversation deleted.');
    },
    onError: () => {
      setConfirmDelete(false);
      toast.error("Couldn't delete that conversation. Please try again.");
    },
  });

  const { messages, status, streamingText, errorMessage, isLoadingHistory, send, cancel, retry, reset } =
    useCompanionConversation(activeId);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, streamingText]);

  function handleSelect(id: string) {
    selectConversation(id);
    setShowListOnMobile(false);
  }

  function handleCreate() {
    createConversation.mutate();
  }

  const activeConversation = conversations?.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] gap-6 tablet:h-[calc(100dvh-6rem)]">
      <div
        className={`w-full shrink-0 tablet:w-72 ${showListOnMobile ? 'block' : 'hidden'} tablet:block`}
      >
        {conversationsError ? (
          <ErrorState description="Couldn't load your conversations." onRetry={() => refetchConversations()} />
        ) : (
          <ConversationSidebar
            conversations={conversations ?? []}
            isLoading={conversationsLoading}
            activeId={activeId}
            onSelect={handleSelect}
            onCreate={handleCreate}
            creating={createConversation.isPending}
          />
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${showListOnMobile ? 'hidden' : 'flex'} tablet:flex`}>
        {!activeId && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-body-md text-text-secondary">
              I&rsquo;m here whenever you&rsquo;re ready. We can start with something small.
            </p>
            <Button onClick={handleCreate} loading={createConversation.isPending}>
              Start a conversation
            </Button>
          </div>
        )}

        {activeId && (
          <>
            <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <IconButton
                  aria-label="Back to conversations"
                  onClick={() => setShowListOnMobile(true)}
                  className="tablet:hidden"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <h1 className="font-display text-heading-md text-text-primary">
                  {activeConversation?.title ?? 'Companion'}
                </h1>
              </div>
              <IconButton aria-label="Delete this conversation" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </div>

            <div ref={listRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-5 overflow-y-auto pb-4">
              {isLoadingHistory && (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-16 w-3/4" />
                  <Skeleton className="ml-auto h-12 w-1/2" />
                </div>
              )}
              {!isLoadingHistory && messages.length === 0 && status === 'idle' && (
                <p className="text-body-md text-text-secondary">
                  I&rsquo;m here whenever you&rsquo;re ready. We can start with something small.
                </p>
              )}
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
              {status === 'streaming' && streamingText && <StreamingMessageItem text={streamingText} />}
            </div>

            <Composer
              status={status}
              errorMessage={errorMessage}
              onSend={(content) => activeId && void send(content, activeId)}
              onCancel={cancel}
              onRetry={retry}
              onDismiss={reset}
            />
          </>
        )}
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this conversation?"
        description="This permanently removes it and everything in it."
        variant="destructive"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteConversation.isPending}
            onClick={() => activeId && deleteConversation.mutate(activeId)}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
