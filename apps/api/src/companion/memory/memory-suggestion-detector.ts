import type { MemoryType } from '@prisma/client';

export interface DetectedSuggestion {
  type: MemoryType;
  title: string;
  summary: string;
  reason: string;
}

/**
 * Deterministic, keyword/pattern-based detection of "this sounds worth remembering" — the same
 * style as `crisis-detector.ts`/`prompt-injection-detector.ts` (already in this codebase): fixed
 * regular expressions, no model call, no learned classifier. This is Phase 4's mandated
 * mechanism — Companion may *suggest*, it never saves anything itself; see
 * `MemorySuggestionService`/`RememberThisButton`'s existing propose+accept flow for the only
 * way a suggestion actually becomes a `Memory`.
 *
 * `HEALTH` is deliberately never a rule here — even suggesting that a health disclosure be
 * saved nudges toward capturing sensitive data; a user can still explicitly use "Remember this"
 * on any message regardless, that path is untouched. See docs/architecture/
 * companion-memory-integration.md "Memory suggestions" for the full rationale.
 */
const RULES: { type: MemoryType; patterns: RegExp[]; reason: string }[] = [
  {
    type: 'GOAL',
    patterns: [/\bmy goal is\b/i, /\bi('m| am) (trying|hoping|planning) to\b/i, /\bi want to\b/i],
    reason: 'This sounds like a goal you have.',
  },
  {
    type: 'IDENTITY',
    patterns: [/\bmy name is\b/i, /\bcall me\b/i, /\bi go by\b/i, /\bmy pronouns are\b/i],
    reason: 'This sounds like something about who you are.',
  },
  {
    type: 'IMPORTANT_EVENT',
    patterns: [/\bi (just )?(got married|graduated|had a baby|got engaged)\b/i, /\btoday is my\b/i],
    reason: 'This sounds like an important moment.',
  },
  {
    type: 'WORK',
    patterns: [/\bi (just )?started (a new job|working at)\b/i, /\bmy job is\b/i, /\bi work at\b/i],
    reason: 'This sounds like something about your work.',
  },
  {
    type: 'LOCATION_PREFERENCE',
    patterns: [/\bi (just )?moved to\b/i, /\bi live in\b/i],
    reason: 'This sounds like where you live.',
  },
  {
    type: 'RELATIONSHIP',
    patterns: [/\bmy (wife|husband|partner|girlfriend|boyfriend|best friend)\b/i],
    reason: 'This sounds like a relationship that matters to you.',
  },
  {
    type: 'PET',
    patterns: [/\bmy (dog|cat|pet)\b.*\bnamed\b/i],
    reason: 'This sounds like a pet of yours.',
  },
  {
    type: 'PREFERENCE',
    patterns: [/\bi (really )?(love|like|enjoy|prefer|can't stand|hate)\b/i],
    reason: 'This sounds like a preference of yours.',
  },
];

const MIN_LENGTH = 12;
const MAX_TITLE_LENGTH = 60;

export function detectSuggestion(text: string): DetectedSuggestion | null {
  const trimmed = text.trim();
  if (trimmed.length < MIN_LENGTH) return null;

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(trimmed))) {
      return {
        type: rule.type,
        title: trimmed.length <= MAX_TITLE_LENGTH ? trimmed : `${trimmed.slice(0, MAX_TITLE_LENGTH)}…`,
        summary: trimmed,
        reason: rule.reason,
      };
    }
  }

  return null;
}
