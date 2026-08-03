import type { ComposerStatus } from '../hooks/use-companion-conversation';

/**
 * The single sentence announced to a screen reader (via one `sr-only`
 * `aria-live="polite"` region — see companion-view.tsx) when generation
 * begins. Deliberately NOT re-derived from `streamingText`: the growing
 * token-by-token text is `aria-hidden` (see StreamingMessageItem) precisely
 * so a screen reader announces this fixed sentence once, not every token.
 * The completed reply is announced separately and only once, by the
 * conversation `role="log"` region naturally picking up the new persisted
 * `MessageItem` — no need to duplicate it here. Sprint 2B audit Finding 5.
 */
export function deriveLiveAnnouncement(status: ComposerStatus): string {
  return status === 'streaming' ? 'Companion is responding…' : '';
}
