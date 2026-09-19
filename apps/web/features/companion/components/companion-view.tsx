'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowDown, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../api/conversations-api';
import { useCompanionConversation } from '../hooks/use-companion-conversation';
import { useAutoScroll } from '../hooks/use-auto-scroll';
import { deriveLiveAnnouncement } from '../lib/live-announcement';
import { ConversationSidebar } from './conversation-sidebar';
import { MessageItem, StreamingMessageItem } from './message-item';
import { MemorySuggestionCard } from './memory-suggestion-card';
import { ForgetSuggestionCard } from './forget-suggestion-card';
import { JournalSuggestionCard } from './journal-suggestion-card';
import { ReflectionHintBanner } from './reflection-hint-banner';
import { Composer } from './composer';
import { IconButton } from '@/components/ui/icon-button';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    onError: () => toast.error('Không thể bắt đầu cuộc trò chuyện mới. Vui lòng thử lại.'),
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => conversationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      selectConversation(null);
      setShowListOnMobile(true);
      setConfirmDelete(false);
      toast.success('Đã xóa cuộc trò chuyện.');
    },
    onError: () => {
      setConfirmDelete(false);
      toast.error('Không thể xóa cuộc trò chuyện đó. Vui lòng thử lại.');
    },
  });

  const {
    messages,
    status,
    streamingText,
    errorMessage,
    isLoadingHistory,
    draft,
    setDraft,
    send,
    cancel,
    retry,
    reset,
    pendingMemorySuggestion,
    clearMemorySuggestion,
    pendingForgetSuggestion,
    clearForgetSuggestion,
    pendingJournalSuggestion,
    clearJournalSuggestion,
    lastTurnMemoryUsage,
  } = useCompanionConversation(activeId);

  const { containerRef: listRef, hasNewMessage, handleScroll, scrollToBottom } = useAutoScroll({
    itemCount: messages.length,
    streamingLength: streamingText.length,
  });

  const liveAnnouncement = deriveLiveAnnouncement(status);

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
          <ErrorState description="Không thể tải các cuộc trò chuyện của bạn." onRetry={() => refetchConversations()} />
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
              Mình luôn sẵn sàng khi bạn cần. Chúng ta có thể bắt đầu từ một điều nhỏ thôi.
            </p>
            <Button onClick={handleCreate} loading={createConversation.isPending}>
              Bắt đầu trò chuyện
            </Button>
          </div>
        )}

        {activeId && (
          <>
            <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <IconButton
                  aria-label="Quay lại danh sách trò chuyện"
                  onClick={() => setShowListOnMobile(true)}
                  className="tablet:hidden"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <h1 className="font-display text-heading-md text-text-primary">
                  {activeConversation?.title ?? 'Người bạn đồng hành'}
                </h1>
                {/* Sprint 8.5 remediation — once per conversation header, not per message, so the
                    conversation is clearly AI-powered without turning every reply into AI marketing. */}
                <Badge variant="insight">AI</Badge>
              </div>
              <IconButton aria-label="Xóa cuộc trò chuyện này" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </div>

            <ReflectionHintBanner />

            <div className="relative min-h-0 flex-1">
              <div
                ref={listRef}
                onScroll={handleScroll}
                role="log"
                aria-label="Cuộc trò chuyện"
                className="h-full space-y-5 overflow-y-auto pb-4"
              >
                {isLoadingHistory && (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-16 w-3/4" />
                    <Skeleton className="ml-auto h-12 w-1/2" />
                  </div>
                )}
                {!isLoadingHistory && messages.length === 0 && status === 'idle' && (
                  <p className="text-body-md text-text-secondary">
                    Mình luôn sẵn sàng khi bạn cần. Chúng ta có thể bắt đầu từ một điều nhỏ thôi.
                  </p>
                )}
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    conversationId={activeId ?? undefined}
                    memoryUsage={lastTurnMemoryUsage?.messageId === message.id ? lastTurnMemoryUsage.memoryUsage : undefined}
                  />
                ))}
                {status === 'streaming' && streamingText && <StreamingMessageItem text={streamingText} />}

                {/* Phases 4/5 — surfaced once, right after the turn that produced them; never
                    acted on automatically, and dismissed only by an explicit user choice. */}
                {activeId && pendingMemorySuggestion && (
                  <MemorySuggestionCard
                    suggestion={pendingMemorySuggestion.suggestion}
                    sourceConversationId={pendingMemorySuggestion.sourceConversationId}
                    sourceMessageId={pendingMemorySuggestion.sourceMessageId}
                    onResolved={clearMemorySuggestion}
                  />
                )}
                {pendingForgetSuggestion && (
                  <ForgetSuggestionCard suggestion={pendingForgetSuggestion.suggestion} onResolved={clearForgetSuggestion} />
                )}
                {/* Phase 8 — same "surfaced once, never automatic" rule as the memory cards above. */}
                {activeId && pendingJournalSuggestion && (
                  <JournalSuggestionCard
                    suggestion={pendingJournalSuggestion.suggestion}
                    sourceConversationId={pendingJournalSuggestion.sourceConversationId}
                    sourceMessageId={pendingJournalSuggestion.sourceMessageId}
                    onResolved={clearJournalSuggestion}
                  />
                )}
              </div>

              {/* Sprint 2B audit Finding 5: a single, dedicated status region — announced
                  once when generation begins, never per token (the growing text above is
                  aria-hidden). The completed reply is announced separately and once, by
                  the `role="log"` region above picking up the new MessageItem on `done`. */}
              <div role="status" aria-live="polite" className="sr-only">
                {liveAnnouncement}
              </div>

              {hasNewMessage && (
                <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="pointer-events-auto shadow-md"
                    onClick={() => scrollToBottom()}
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    Tin nhắn mới
                  </Button>
                </div>
              )}
            </div>

            <Composer
              status={status}
              errorMessage={errorMessage}
              draft={draft}
              onDraftChange={setDraft}
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
        title="Xóa cuộc trò chuyện này?"
        description="Thao tác này sẽ xóa vĩnh viễn cuộc trò chuyện và toàn bộ nội dung bên trong."
        variant="destructive"
      >
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleteConversation.isPending}
            onClick={() => activeId && deleteConversation.mutate(activeId)}
          >
            Xóa
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
