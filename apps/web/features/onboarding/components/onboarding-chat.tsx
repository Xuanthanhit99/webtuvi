'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { safeNextPath } from '@/lib/safe-next-path';
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
import { Alert } from '@/components/ui/alert';

function MessageBubble({ message }: { message: OnboardingMessageDto }) {
  const isCompanion = message.role === 'companion';
  return (
    <div className={`flex items-end gap-2 ${isCompanion ? '' : 'flex-row-reverse'}`}>
      {isCompanion ? <Logo withWordmark={false} /> : <Avatar name="Bạn" size="sm" />}
      <div
        className={`min-w-0 max-w-sm break-words rounded-lg px-4 py-3 text-body-md ${
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
  const searchParams = useSearchParams();
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
    return <ErrorState description="Chưa thể tải cuộc trò chuyện." onRetry={() => refetch()} />;
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
    try {
      await completeOnboarding.mutateAsync();
      router.push(safeNextPath(searchParams.get('next')));
    } catch { /* The mutation error below keeps the current step available for retry. */ }
  }

  async function handleSkip() {
    try {
      await skipOnboarding.mutateAsync();
      router.push(safeNextPath(searchParams.get('next')));
    } catch { /* Preserve the current step on failure. */ }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-reading flex-col px-4 py-8 desktop:px-0 [&_.text-caution]:text-[#E5A69C]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 rounded-[50%] border border-insight/15" />
      <div className="mb-4 flex items-center justify-between">
        <Logo />
        {!isDone && (
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipOnboarding.isPending}
            className="min-h-11 px-2 text-body-sm text-text-secondary underline hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-insight"
          >
            Bỏ qua lúc này
          </button>
        )}
      </div>

      <div className="mb-5 rounded-lg border border-[rgba(213,173,98,0.16)] bg-surface/70 p-5">
        <p className="text-caption font-semibold uppercase tracking-[0.18em] text-insight">Bắt đầu</p>
        <h1 className="mt-2 text-heading-md font-semibold text-text-primary">Chào mừng bạn đến với Mệnh Vi</h1>
        <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
          Chia sẻ vài điều để làm quen và chọn nội dung bạn muốn ghi nhớ. Bạn có thể bỏ qua để bắt đầu khám phá.
        </p>
        {user && !user.emailVerifiedAt && <p className="mt-3 text-body-sm text-text-secondary">Hãy kiểm tra email để xác minh tài khoản. <Link href="/verify-email/pending" className="text-insight underline">Gửi lại liên kết</Link>. Bạn vẫn có thể tiếp tục làm quen.</p>}
      </div>

      <div ref={listRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto py-4">
        {data.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {(sendMessage.isPending || memoryConsent.isPending || selectDiscovery.isPending) && (
          <ProgressCircular label="Đang xử lý…" />
        )}
      </div>

      {(sendMessage.isError || memoryConsent.isError || selectDiscovery.isError || completeOnboarding.isError || skipOnboarding.isError) && <Alert variant="error">Chưa thể lưu bước này. Nội dung của bạn vẫn ở đây; vui lòng thử lại.</Alert>}

      {awaitingMemoryConsent && (
        <div className="flex flex-wrap gap-3 py-4">
          <Button
            variant="secondary"
            loading={memoryConsent.isPending}
            onClick={() => memoryConsent.mutate(true)}
          >
            Đồng ý ghi nhớ
          </Button>
          <Button
            variant="ghost"
            disabled={memoryConsent.isPending}
            onClick={() => memoryConsent.mutate(false)}
          >
            Chưa lưu
          </Button>
        </div>
      )}

      {awaitingDiscoveryChoice && (
        <div className="flex flex-wrap gap-3 py-4">
          <Button
            variant="secondary"
            loading={selectDiscovery.isPending}
            onClick={() => selectDiscovery.mutate('accepted')}
          >
            Khám phá ngay
          </Button>
          <Button
            variant="ghost"
            disabled={selectDiscovery.isPending}
            onClick={() => selectDiscovery.mutate('skipped')}
          >
            Để sau
          </Button>
        </div>
      )}

      {awaitingReply && (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border-subtle py-4">
          <label htmlFor="onboarding-reply" className="sr-only">
            Câu trả lời của bạn
          </label>
          <Input
            id="onboarding-reply"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Chia sẻ điều bạn đang nghĩ"
            disabled={sendMessage.isPending}
            autoComplete="off"
          />
          <Button type="submit" loading={sendMessage.isPending} disabled={!draft.trim()}>
            Gửi
          </Button>
        </form>
      )}

      {isDone && (
        <div className="flex flex-col items-center gap-4 border-t border-border-subtle py-8 text-center">
          <p className="text-body-md text-text-secondary">
            Rất vui được gặp bạn{user ? `, ${user.displayName}` : ''}.
          </p>
          <Button size="lg" loading={completeOnboarding.isPending} onClick={handleGoToDashboard}>
            Bắt đầu khám phá
          </Button>
        </div>
      )}
    </div>
  );
}
