'use client';

import { Send, X } from 'lucide-react';
import type { ComposerStatus } from '../hooks/use-companion-conversation';
import { Button } from '@/components/ui/button';
import { ProgressCircular } from '@/components/ui/progress';
import { Alert } from '@/components/ui/alert';

const MAX_LENGTH = 4000;

export interface ComposerProps {
  status: ComposerStatus;
  errorMessage: string | null;
  /**
   * Owned by the parent (via useCompanionConversation), not local state —
   * it must survive a failed send/stream so the user never loses what they
   * typed. Only the hook clears it, and only on a definitive success
   * (completed reply, safety refusal, or cancel) — never synchronously on
   * submit. See Sprint 2B audit Finding 3.
   */
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (content: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

/** Retry re-opens the stream against the same still-pending user message — see use-companion-conversation.ts for why this only applies to these three statuses (a client-side cancel persists its own turn and has nothing left to retry). */
const RETRYABLE_STATUSES: ComposerStatus[] = ['error', 'rate_limited', 'offline'];

export function Composer({ status, errorMessage, draft, onDraftChange, onSend, onCancel, onRetry, onDismiss }: ComposerProps) {
  const busy = status === 'sending' || status === 'streaming';
  const canRetry = RETRYABLE_STATUSES.includes(status);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    // No local clearing here — onSend triggers the hook's send(), which only
    // clears the draft once the turn genuinely completes. If it fails, the
    // exact text the user typed is still right here, ready to resend.
    onSend(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
      {status === 'streaming' && (
        <div className="flex items-center justify-between">
          <ProgressCircular label="Người bạn đồng hành đang trả lời…" />
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Hủy
          </Button>
        </div>
      )}

      {status === 'cancelled' && (
        <Alert variant="info" action={<Button size="sm" variant="secondary" onClick={onDismiss}>Đóng</Button>}>
          Bạn đã hủy phản hồi đó.
        </Alert>
      )}

      {status === 'safety_refused' && (
        <Alert variant="info" action={<Button size="sm" variant="secondary" onClick={onDismiss}>OK</Button>}>
          {errorMessage ?? 'Mình không thể phản hồi điều đó theo cách thông thường.'}
        </Alert>
      )}

      {status === 'rate_limited' && (
        <Alert
          variant="error"
          title="Chậm lại một chút"
          action={<Button size="sm" variant="secondary" onClick={onDismiss}>OK</Button>}
        >
          {errorMessage ?? 'Bạn đã gửi khá nhiều tin nhắn liên tiếp — vui lòng đợi một chút rồi thử lại.'}
        </Alert>
      )}

      {status === 'offline' && (
        <Alert
          variant="error"
          title="Bạn đang ngoại tuyến"
          action={canRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Thử lại</Button> : undefined}
        >
          Kiểm tra kết nối mạng và thử lại.
        </Alert>
      )}

      {status === 'error' && (
        <Alert
          variant="error"
          title="Đã có lỗi xảy ra"
          action={canRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Thử lại</Button> : undefined}
        >
          {errorMessage ?? 'Người bạn đồng hành của bạn hiện không thể phản hồi.'}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <label htmlFor="companion-composer" className="sr-only">
          Nhắn tin cho người bạn đồng hành của bạn
        </label>
        <textarea
          id="companion-composer"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Bạn đang nghĩ gì?"
          disabled={busy}
          maxLength={MAX_LENGTH}
          rows={2}
          className="h-11 max-h-40 min-h-11 w-full flex-1 resize-y rounded-md border border-border-subtle bg-surface px-3 py-2.5 text-body-md text-text-primary placeholder:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button type="submit" loading={status === 'sending'} disabled={busy || !draft.trim()} aria-label="Gửi tin nhắn">
          <Send className="h-4 w-4" aria-hidden="true" />
          Gửi
        </Button>
      </form>
    </div>
  );
}
