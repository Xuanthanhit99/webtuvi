'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingMessageDto } from '@beaconvie/types';
import {
  useCompleteOnboarding,
  useMemoryConsent,
  useOnboardingState,
  useSelectDiscovery,
  useSendOnboardingMessage,
  useSkipOnboarding,
} from '../hooks/use-onboarding';
import { Avatar } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { ProgressCircular } from '@/components/ui/progress';
import { useAuth } from '@/providers/auth-provider';

function MessageBubble({ message }: { message: OnboardingMessageDto }) {
  const isCompanion = message.role === 'companion';
  return (
    <div className={`flex items-end gap-2 ${isCompanion ? '' : 'flex-row-reverse'}`}>
      {isCompanion ? <Logo withWordmark={false} /> : <Avatar name="You" size="sm" />}
      <div
        className={`max-w-sm rounded-lg px-4 py-3 text-body-md ${
          isCompanion
            ? 'rounded-bl-sm bg-surface text-text-primary'
            : 'rounded-br-sm bg-insight/15 text-text-primary'
        }`}
      >
        {isCompanion ? <p className="font-display text-body-lg">{message.content}</p> : message.content}
      </div>
    </div>
  );
}

export function OnboardingChat() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useOnboardingState();
  const sendMessage = useSendOnboardingMessage();
  const memoryConsent = useMemoryConsent();
  const selectDiscovery = useSelectDiscovery();
  const completeOnboarding = useCompleteOnboarding();
  const skipOnboarding = useSkipOnboarding();

  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [data?.messages.length]);

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-reading flex-col gap-4 px-4 py-8">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="ml-auto h-12 w-1/2" />
        <Skeleton className="h-16 w-2/3" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState description="We couldn't load your conversation." onRetry={() => refetch()} />;
  }

  const awaitingReply = data.stage === 'meet_companion' || data.stage === 'conversation';
  const awaitingMemoryConsent = data.stage === 'reflection';
  const awaitingDiscoveryChoice = data.stage === 'discovery_choice';
  const isDone = data.stage === 'success';

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft;
    try {
      await sendMessage.mutateAsync(text);
      setDraft('');
    } catch {
      // Preserve typed text on failure (docs/reference Module 7 §12) — don't clear `draft`.
    }
  }

  async function handleGoToDashboard() {
    await completeOnboarding.mutateAsync();
    router.push('/dashboard');
  }

  async function handleSkip() {
    await skipOnboarding.mutateAsync();
    router.push('/dashboard');
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-reading flex-col px-4 py-8 desktop:px-0">
      <div className="pointer-events-none absolute inset-x-[-6rem] top-0 -z-10 h-56 rounded-[50%] border border-insight/15" />
      <div className="mb-4 flex items-center justify-between">
        <Logo />
        {!isDone && (
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipOnboarding.isPending}
            className="text-body-sm text-text-secondary underline hover:text-text-primary"
          >
            Skip for now
          </button>
        )}
      </div>

      <div className="mb-5 rounded-lg border border-[rgba(213,173,98,0.16)] bg-surface/70 p-5">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-insight">Bắt đầu</p>
        <h1 className="mt-2 text-heading-md font-semibold text-text-primary">Thiết lập không gian Tử Vi Tarot của bạn</h1>
        <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
          Trả lời vài câu ngắn để cá nhân hóa trải nghiệm. Bạn có thể bỏ qua và quay lại sau.
        </p>
      </div>

      <div ref={listRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto py-4">
        {data.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {(sendMessage.isPending || memoryConsent.isPending || selectDiscovery.isPending) && (
          <ProgressCircular label="Thinking…" />
        )}
      </div>

      {awaitingMemoryConsent && (
        <div className="flex gap-3 py-4">
          <Button
            variant="secondary"
            loading={memoryConsent.isPending}
            onClick={() => memoryConsent.mutate(true)}
          >
            Yes, remember this
          </Button>
          <Button
            variant="ghost"
            disabled={memoryConsent.isPending}
            onClick={() => memoryConsent.mutate(false)}
          >
            Not yet
          </Button>
        </div>
      )}

      {awaitingDiscoveryChoice && (
        <div className="flex gap-3 py-4">
          <Button
            variant="secondary"
            loading={selectDiscovery.isPending}
            onClick={() => selectDiscovery.mutate('accepted')}
          >
            Let&rsquo;s see
          </Button>
          <Button
            variant="ghost"
            disabled={selectDiscovery.isPending}
            onClick={() => selectDiscovery.mutate('skipped')}
          >
            Maybe later
          </Button>
        </div>
      )}

      {awaitingReply && (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border-subtle py-4">
          <label htmlFor="onboarding-reply" className="sr-only">
            Your reply
          </label>
          <Input
            id="onboarding-reply"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say anything — even something small"
            disabled={sendMessage.isPending}
            autoComplete="off"
          />
          <Button type="submit" loading={sendMessage.isPending} disabled={!draft.trim()}>
            Send
          </Button>
        </form>
      )}

      {isDone && (
        <div className="flex flex-col items-center gap-4 border-t border-border-subtle py-8 text-center">
          <p className="text-body-md text-text-secondary">
            Glad to have you here{user ? `, ${user.displayName}` : ''}.
          </p>
          <Button size="lg" loading={completeOnboarding.isPending} onClick={handleGoToDashboard}>
            Go to Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
