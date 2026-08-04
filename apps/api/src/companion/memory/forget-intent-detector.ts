import type { MemoryType } from '@prisma/client';

export type ForgetIntentKind = 'FORGET_RECENT' | 'NEVER_REMEMBER_TYPE' | 'DELETE_ABOUT';

export interface DetectedForgetIntent {
  kind: ForgetIntentKind;
  /** Set only for NEVER_REMEMBER_TYPE — the type to deny, deterministically mapped from a fixed
   * keyword dictionary (see TYPE_KEYWORDS below), never inferred by a model. */
  type?: MemoryType;
  /** Set only for DELETE_ABOUT — the free-text topic to search the user's own memories for
   * (deterministic token-overlap search, performed by CompanionForgetService — never executed
   * without the user confirming which specific memories they mean). */
  topic?: string;
}

/** Deterministic keyword → MemoryType mapping for "never remember my ___" phrasing. Kept small
 * and literal on purpose — an unmatched keyword falls through to DELETE_ABOUT / no match rather
 * than guessing a type. */
const TYPE_KEYWORDS: { keywords: RegExp; type: MemoryType }[] = [
  { keywords: /\bhealth\b/i, type: 'HEALTH' },
  { keywords: /\bwork\b/i, type: 'WORK' },
  { keywords: /\brelationships?\b/i, type: 'RELATIONSHIP' },
  { keywords: /\bgoals?\b/i, type: 'GOAL' },
  { keywords: /\bpreferences?\b/i, type: 'PREFERENCE' },
  { keywords: /\bhabits?\b/i, type: 'HABIT' },
  { keywords: /\bpets?\b/i, type: 'PET' },
  { keywords: /\bstudy|school\b/i, type: 'STUDY' },
];

/**
 * Deterministic detection of the four forget-intent phrasings Phase 5 lists, in priority order.
 * Never deletes or changes consent by itself — see `CompanionForgetService` for the
 * confirmation-required mapping to the real Memory API. Same style as
 * `memory-suggestion-detector.ts`/`crisis-detector.ts`: fixed patterns, no model call.
 */
export function detectForgetIntent(text: string): DetectedForgetIntent | null {
  const trimmed = text.trim();

  const neverMatch = /\bnever remember\b(.*)/i.exec(trimmed);
  if (neverMatch) {
    const tail = neverMatch[1] ?? '';
    const typeMatch = TYPE_KEYWORDS.find((k) => k.keywords.test(tail));
    if (typeMatch) return { kind: 'NEVER_REMEMBER_TYPE', type: typeMatch.type };
  }

  if (/\b(forget (that|what i just said|the last thing)|don'?t remember (this|that))\b/i.test(trimmed)) {
    return { kind: 'FORGET_RECENT' };
  }

  const deleteMatch = /\bdelete everything about\s+(.+)/i.exec(trimmed);
  if (deleteMatch && deleteMatch[1]!.trim().length > 0) {
    return { kind: 'DELETE_ABOUT', topic: deleteMatch[1]!.trim().replace(/[.!?]+$/, '') };
  }

  return null;
}
