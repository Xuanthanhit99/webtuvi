import type { MemoryType } from '@prisma/client';
import { differingSharedKeys, matchingSharedKeys, normalizeText, similarityScore } from '../shared/text-normalization.util';

/** Same-type pairs only above this raw token-overlap score are considered a TYPE_SPECIFIC
 * duplicate — deliberately looser than exact/normalized text equality but still a plain
 * deterministic threshold, never an ML/embedding similarity. See
 * docs/architecture/memory-intelligence.md "Duplicate policy". */
export const TYPE_SPECIFIC_SIMILARITY_THRESHOLD = 60;

export type DuplicateMatchType = 'EXACT' | 'NORMALIZED' | 'STRUCTURED' | 'TYPE_SPECIFIC';

export interface DuplicateCandidate {
  id: string;
  type: MemoryType;
  title: string;
  summary: string;
  structuredPayload: Record<string, unknown> | null;
}

export interface DuplicateMatch {
  matchType: DuplicateMatchType;
  similarity: number;
  /** Plain-language reason, safe to show the user directly. */
  reason: string;
}

/**
 * Deterministic duplicate classification between two memories of the same user. Checked in a
 * fixed priority order — the first rule that matches wins:
 *
 * 1. EXACT — identical raw title+summary text.
 * 2. NORMALIZED — identical after lowercasing/punctuation-stripping/whitespace-collapsing
 *    (e.g. "I like coffee." vs "I like coffee").
 * 3. STRUCTURED — both have a `structuredPayload`, share at least one key, and every shared
 *    key's value matches (e.g. two memories both tagging the same `city`).
 * 4. TYPE_SPECIFIC — same type, no exact/normalized/structured match, but raw token overlap
 *    is at or above TYPE_SPECIFIC_SIMILARITY_THRESHOLD.
 *
 * Returns null when no rule matches (including whenever the two memories are of different
 * types — a duplicate, by this sprint's definition, restates the same type of fact).
 */
export function classifyDuplicate(a: DuplicateCandidate, b: DuplicateCandidate): DuplicateMatch | null {
  if (a.type !== b.type) return null;

  const rawA = `${a.title}\n${a.summary}`.trim();
  const rawB = `${b.title}\n${b.summary}`.trim();

  if (rawA === rawB) {
    return { matchType: 'EXACT', similarity: 100, reason: 'These two memories have identical text.' };
  }

  if (normalizeText(rawA) === normalizeText(rawB)) {
    return {
      matchType: 'NORMALIZED',
      similarity: 100,
      reason: 'These two memories say exactly the same thing, just worded/punctuated slightly differently.',
    };
  }

  if (a.structuredPayload && b.structuredPayload) {
    const matching = matchingSharedKeys(a.structuredPayload, b.structuredPayload);
    const differing = differingSharedKeys(a.structuredPayload, b.structuredPayload);
    if (matching.length > 0 && differing.length === 0) {
      return {
        matchType: 'STRUCTURED',
        similarity: 90,
        reason: `These two memories share the same structured detail (${matching.join(', ')}).`,
      };
    }
  }

  const score = similarityScore(rawA, rawB);
  if (score >= TYPE_SPECIFIC_SIMILARITY_THRESHOLD) {
    return {
      matchType: 'TYPE_SPECIFIC',
      similarity: score,
      reason: `These two ${a.type.toLowerCase().replace('_', ' ')} memories overlap heavily (${score}% shared wording).`,
    };
  }

  return null;
}

/** Lexicographic pair ordering so (a, b) and (b, a) always upsert the same row — required
 * because MemoryDuplicate has a `@@unique([memoryAId, memoryBId])` constraint. */
export function orderPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}
