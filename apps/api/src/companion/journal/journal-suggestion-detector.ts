export interface DetectedJournalSuggestion {
  reason: string;
}

/**
 * Deterministic, keyword/pattern-based detection of "this sounds worth saving as a journal
 * entry" — same style and spirit as `memory-suggestion-detector.ts`/`crisis-detector.ts`: fixed
 * regular expressions, no model call, no learned classifier. Tuned for reflective, narrative,
 * day-in-review content (what Memory's detector is *not* tuned for — Memory looks for standalone
 * facts worth remembering; Journal looks for a longer reflective moment worth keeping in full).
 *
 * Crisis-flagged messages never reach this detector at all — `SafetyService.checkInput()` runs
 * first and short-circuits `ConversationService.sendMessage()` before either suggestion detector
 * is ever called (see `docs/architecture/journal-foundation.md` "Companion integration").
 */
const REFLECTIVE_PATTERNS: RegExp[] = [
  /\btoday (was|has been|i)\b/i,
  /\bwhat a day\b/i,
  /\bi('m| am) (feeling|been feeling)\b/i,
  /\bi('ve| have) been (thinking|feeling|reflecting)\b/i,
  /\bi (just )?(want|need) to (write|remember|process) this\b/i,
  /\bi('ll| will) (always |never )?remember (this|today)\b/i,
  /\blooking back (on|at)\b/i,
  /\breflecting on\b/i,
  /\bit('s| has) been (a|quite a|such a)\b.{0,20}\b(day|week|month|year)\b/i,
];

/** Below this length, even a reflective-sounding phrase is more likely a passing remark than
 * something worth a full journal entry — mirrors memory-suggestion-detector's own MIN_LENGTH
 * guard against firing on very short messages. */
const MIN_LENGTH = 40;
const MAX_EXCERPT_LENGTH = 200;

export function detectJournalSuggestion(text: string): DetectedJournalSuggestion | null {
  const trimmed = text.trim();
  if (trimmed.length < MIN_LENGTH) return null;

  const matched = REFLECTIVE_PATTERNS.some((pattern) => pattern.test(trimmed));
  if (!matched) return null;

  return { reason: 'This sounds like something worth keeping — a moment you might want to look back on.' };
}

export function excerptFor(text: string): string {
  const trimmed = text.trim();
  return trimmed.length <= MAX_EXCERPT_LENGTH ? trimmed : `${trimmed.slice(0, MAX_EXCERPT_LENGTH)}…`;
}
