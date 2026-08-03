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
          <ProgressCircular label="Companion is responding…" />
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Cancel
          </Button>
        </div>
      )}

      {status === 'cancelled' && (
        <Alert variant="info" action={<Button size="sm" variant="secondary" onClick={onDismiss}>Dismiss</Button>}>
          You cancelled that reply.
        </Alert>
      )}

      {status === 'safety_refused' && (
        <Alert variant="info" action={<Button size="sm" variant="secondary" onClick={onDismiss}>OK</Button>}>
          {errorMessage ?? "I wasn't able to respond to that the usual way."}
        </Alert>
      )}

      {status === 'rate_limited' && (
        <Alert
          variant="error"
          title="Slow down a little"
          action={<Button size="sm" variant="secondary" onClick={onDismiss}>OK</Button>}
        >
          {errorMessage ?? "You've sent a lot of messages quickly — please wait a moment before trying again."}
        </Alert>
      )}

      {status === 'offline' && (
        <Alert
          variant="error"
          title="You're offline"
          action={canRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button> : undefined}
        >
          Check your connection and try again.
        </Alert>
      )}

      {status === 'error' && (
        <Alert
          variant="error"
          title="Something went wrong"
          action={canRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button> : undefined}
        >
          {errorMessage ?? "Your Companion couldn't respond right now."}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <label htmlFor="companion-composer" className="sr-only">
          Message your Companion
        </label>
        <textarea
          id="companion-composer"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          disabled={busy}
          maxLength={MAX_LENGTH}
          rows={2}
          className="h-11 max-h-40 min-h-11 w-full flex-1 resize-y rounded-md border border-border-subtle bg-surface px-3 py-2.5 text-body-md text-text-primary placeholder:text-text-disabled focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-insight disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button type="submit" loading={status === 'sending'} disabled={busy || !draft.trim()} aria-label="Send message">
          <Send className="h-4 w-4" aria-hidden="true" />
          Send
        </Button>
      </form>
    </div>
  );
}
