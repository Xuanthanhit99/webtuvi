import type { MemoryType } from '@prisma/client';
import { classifyDuplicate } from '../duplicate/memory-duplicate.util';
import { differingSharedKeys, normalizeText } from '../shared/text-normalization.util';

/**
 * Fixed, literal phrase list — deterministic substring matching only, never an LLM or
 * classifier. A newer memory containing one of these phrases is treated as an explicit signal
 * that it *replaces* an older fact of the same type, not merely contradicts it (see
 * `classifyConflict`'s SUPERSEDED branch). See docs/architecture/memory-intelligence.md
 * "Conflict policy" for the full rationale and its disclosed false-positive/negative risk.
 */
export const SUPERSESSION_KEYWORDS = [
  'moved to',
  'no longer',
  'not anymore',
  'used to',
  'switched to',
  'changed to',
  'now lives',
  'now live',
  'now working',
  'now working at',
  'instead of',
  'not the case anymore',
] as const;

/**
 * Types treated as describing one evolving "slot" per user rather than an open-ended list of
 * independent facts — e.g. a person has one current city, one current job, at a time. This is
 * a deliberate, disclosed simplification: it will false-positive for legitimately-plural facts
 * within the same type (e.g. two distinct IDENTITY facts) and false-negative for contradictions
 * across different types. See "Known limitations" in memory-intelligence.md.
 */
export const SINGLE_VALUED_CONFLICT_TYPES = new Set<MemoryType>([
  'LOCATION_PREFERENCE',
  'WORK',
  'STUDY',
  'RELATIONSHIP',
  'IDENTITY',
]);

export type ConflictStatusResult = 'CONFLICT' | 'SUPERSEDED';

export interface ConflictCandidate {
  id: string;
  type: MemoryType;
  title: string;
  summary: string;
  structuredPayload: Record<string, unknown> | null;
}

export interface ConflictMatch {
  status: ConflictStatusResult;
  reason: string;
}

function containsSupersessionKeyword(text: string): string | null {
  const normalized = normalizeText(text);
  return SUPERSESSION_KEYWORDS.find((keyword) => normalized.includes(keyword)) ?? null;
}

/**
 * Deterministic conflict classification between two of the same user's ACCEPTED memories.
 * `older`/`newer` must be the same `type` and ordered by `createdAt`. Returns null when the
 * pair is a duplicate (see classifyDuplicate — restating the same fact isn't a conflict) or
 * when neither a structured-field disagreement nor a "single-valued type" applies (too risky
 * to flag arbitrary same-type text differences as contradictions — see
 * SINGLE_VALUED_CONFLICT_TYPES above).
 *
 * `SUPERSEDED` is returned when the newer memory's text contains an explicit
 * supersession-signal phrase (see SUPERSESSION_KEYWORDS) — a clear "this replaces that," not
 * just an unresolved disagreement. Otherwise a structural/type-level contradiction is reported
 * as a plain `CONFLICT`, since it is ambiguous which of the two is still true.
 */
export function classifyConflict(older: ConflictCandidate, newer: ConflictCandidate): ConflictMatch | null {
  if (older.type !== newer.type) return null;
  if (classifyDuplicate(older, newer) !== null) return null;

  const structuredConflictKeys = differingSharedKeys(older.structuredPayload, newer.structuredPayload);
  const eligible = SINGLE_VALUED_CONFLICT_TYPES.has(older.type) || structuredConflictKeys.length > 0;
  if (!eligible) return null;

  const keyword = containsSupersessionKeyword(`${newer.title} ${newer.summary}`);

  if (keyword) {
    return {
      status: 'SUPERSEDED',
      reason:
        structuredConflictKeys.length > 0
          ? `The newer memory ("${keyword}") appears to replace the older one's ${structuredConflictKeys.join(', ')}.`
          : `The newer memory ("${keyword}") appears to replace this earlier ${older.type.toLowerCase().replace('_', ' ')} memory.`,
    };
  }

  return {
    status: 'CONFLICT',
    reason:
      structuredConflictKeys.length > 0
        ? `These two memories disagree on ${structuredConflictKeys.join(', ')}.`
        : `These two ${older.type.toLowerCase().replace('_', ' ')} memories appear to contradict each other.`,
  };
}
