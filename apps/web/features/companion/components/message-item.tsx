import type { ConversationMessageDto } from '@beaconvie/types';
import { Logo } from '@/components/ui/logo';
import { Avatar } from '@/components/ui/avatar';

/**
 * Deliberately not chat-bubble UI — a calm, minimal, journal-like reading
 * layout (see docs/architecture/companion-core.md "UX"): plain text blocks,
 * a small identity marker, no color-coded bubbles.
 */
export function MessageItem({ message }: { message: ConversationMessageDto }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={isAssistant ? 'flex gap-3' : 'flex gap-3 border-l-2 border-border-subtle pl-4'}>
      <div className="mt-0.5 shrink-0">
        {isAssistant ? <Logo withWordmark={false} /> : <Avatar name="You" size="sm" />}
      </div>
      <div className="flex-1">
        <p className="mb-1 text-caption font-medium text-text-secondary">{isAssistant ? 'Companion' : 'You'}</p>
        <p className="whitespace-pre-wrap text-body-md text-text-primary">{message.content}</p>
      </div>
    </div>
  );
}

export function StreamingMessageItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <Logo withWordmark={false} />
      </div>
      <div className="flex-1">
        <p className="mb-1 text-caption font-medium text-text-secondary">Companion</p>
        <p className="whitespace-pre-wrap text-body-md text-text-primary">
          {text}
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-insight/60 align-text-bottom motion-reduce:animate-none" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}
