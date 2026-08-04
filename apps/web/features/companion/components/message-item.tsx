import type { CompanionMemoryUsageDto, ConversationMessageDto } from '@beaconvie/types';
import { Logo } from '@/components/ui/logo';
import { Avatar } from '@/components/ui/avatar';
import { RememberThisButton } from '@/features/memory/components/remember-this-button';
import { MemoryUsedSection } from './memory-used-section';

/**
 * Deliberately not chat-bubble UI — a calm, minimal, journal-like reading
 * layout (see docs/architecture/companion-core.md "UX"): plain text blocks,
 * a small identity marker, no color-coded bubbles.
 *
 * `conversationId` is optional and, when provided, adds a "Remember this"
 * action to the caller's own messages only (never on an assistant reply —
 * see Sprint 3A's memory-engine.md "Candidate lifecycle": a candidate must
 * always trace to real user-authored content).
 *
 * `memoryUsage` is the ephemeral, this-turn-only `skipped` view (Phase 8) —
 * only ever passed for the assistant message that was *just* generated (see
 * `lastTurnMemoryUsage` in `useCompanionConversation`). Every other assistant
 * message still shows "Memory used" from its own persisted `memoryUsed`.
 */
export function MessageItem({
  message,
  conversationId,
  memoryUsage,
}: {
  message: ConversationMessageDto;
  conversationId?: string;
  memoryUsage?: CompanionMemoryUsageDto;
}) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={isAssistant ? 'flex gap-3' : 'group flex gap-3 border-l-2 border-border-subtle pl-4'}>
      <div className="mt-0.5 shrink-0">
        {isAssistant ? <Logo withWordmark={false} /> : <Avatar name="You" size="sm" />}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-caption font-medium text-text-secondary">{isAssistant ? 'Companion' : 'You'}</p>
          {!isAssistant && conversationId && (
            <RememberThisButton conversationId={conversationId} messageId={message.id} content={message.content} />
          )}
        </div>
        <p className="whitespace-pre-wrap text-body-md text-text-primary">{message.content}</p>
        {isAssistant && conversationId && (
          <MemoryUsedSection
            conversationId={conversationId}
            messageId={message.id}
            used={message.memoryUsed ?? []}
            skipped={memoryUsage?.skipped}
          />
        )}
      </div>
    </div>
  );
}

/**
 * `aria-hidden` on the whole node: this text mutates once per streamed
 * token, and it lives inside the conversation's `role="log"` region (an
 * implicit ARIA live region) — without this, a screen reader would announce
 * every single token as it arrives. Sighted users still see it stream
 * normally; screen reader users instead get one "Companion is responding…"
 * announcement (see live-announcement.ts) while it's in progress, and the
 * completed reply once, naturally, when the real `MessageItem` is appended
 * to the log on `done`. Sprint 2B audit Finding 5.
 */
export function StreamingMessageItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3" aria-hidden="true">
      <div className="mt-0.5 shrink-0">
        <Logo withWordmark={false} />
      </div>
      <div className="flex-1">
        <p className="mb-1 text-caption font-medium text-text-secondary">Companion</p>
        <p className="whitespace-pre-wrap text-body-md text-text-primary">
          {text}
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-insight/60 align-text-bottom motion-reduce:animate-none" />
        </p>
      </div>
    </div>
  );
}
