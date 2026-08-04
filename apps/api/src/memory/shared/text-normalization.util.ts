/**
 * Deterministic, non-AI text normalization shared by importance recurrence scoring,
 * duplicate detection, and conflict detection (Sprint 3B). No embeddings, no ML model,
 * no external calls — pure string/token arithmetic only. See
 * docs/architecture/memory-intelligence.md "Duplicate policy" for how these are used.
 */

const PUNCTUATION_RE = /[.,!?;:'"()[\]{}\-_]/g;
const WHITESPACE_RE = /\s+/g;

/** Lowercases, strips punctuation, collapses whitespace, trims. Order matters: punctuation is
 * stripped before whitespace collapse so "coffee." and "coffee" normalize identically. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(PUNCTUATION_RE, '')
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'i', 'me', 'my', 'you', 'your', 'is', 'am', 'are', 'was', 'were',
  'to', 'of', 'in', 'on', 'at', 'and', 'or', 'but', 'it', 'this', 'that', 'for', 'with',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'so', 'very', 'really',
]);

/** Normalizes then splits into non-empty word tokens. Stopwords are kept by default —
 * callers that want a "meaningful overlap" check should use `significantTokens`. */
export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  return normalized.length === 0 ? [] : normalized.split(' ').filter(Boolean);
}

/** Tokens with common stopwords removed — used where overlap must reflect subject matter,
 * not just shared function words (e.g. supersession-keyword conflict detection). */
export function significantTokens(input: string): string[] {
  return tokenize(input).filter((token) => !STOPWORDS.has(token) && token.length > 1);
}

/** Jaccard similarity (|intersection| / |union|) of two token sets — 0 if both are empty. */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Token-overlap similarity between two raw strings, as an integer 0-100. Deterministic
 * text-overlap only — never a semantic/embedding distance. */
export function similarityScore(a: string, b: string): number {
  return Math.round(jaccardSimilarity(tokenize(a), tokenize(b)) * 100);
}

/** Deep, key-order-independent structural equality for two JSON-like values — used to compare
 * `structuredPayload` blobs without caring about property insertion order. */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqualJson(item, b[index]));
  }
  const aKeys = Object.keys(a as Record<string, unknown>).sort();
  const bKeys = Object.keys(b as Record<string, unknown>).sort();
  if (aKeys.length !== bKeys.length || aKeys.some((key, index) => key !== bKeys[index])) {
    return false;
  }
  return aKeys.every((key) =>
    deepEqualJson((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** Keys shared by both objects whose values differ (deep) — used to explain a structured
 * conflict/duplicate in plain language rather than just asserting "these differ." */
export function differingSharedKeys(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): string[] {
  if (!a || !b) return [];
  const sharedKeys = Object.keys(a).filter((key) => Object.prototype.hasOwnProperty.call(b, key));
  return sharedKeys.filter((key) => !deepEqualJson(a[key], b[key]));
}

/** Keys shared by both objects with identical (deep-equal) values. */
export function matchingSharedKeys(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): string[] {
  if (!a || !b) return [];
  const sharedKeys = Object.keys(a).filter((key) => Object.prototype.hasOwnProperty.call(b, key));
  return sharedKeys.filter((key) => deepEqualJson(a[key], b[key]));
}
