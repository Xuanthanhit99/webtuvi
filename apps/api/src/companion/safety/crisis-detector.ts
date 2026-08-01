/**
 * Heuristic, keyword-based crisis/self-harm detection — deliberately not an
 * LLM-based classifier (no extra provider round-trip before we even know if
 * it's safe to call one). False negatives are possible; this is one layer of
 * defense, not a clinical tool. See docs/security/ai-safety.md "Refusal policy".
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid(e|al)\b/i,
  /\bkill(ing)?\s+myself\b/i,
  /\bend(ing)?\s+my\s+life\b/i,
  /\bwant(ed)?\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive)\b/i,
  /\bself[- ]harm(ing)?\b/i,
  /\bhurt(ing)?\s+myself\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bbetter\s+off\s+dead\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

export const CRISIS_REFUSAL_MESSAGE =
  "I'm really glad you told me. I'm not able to help with something this serious — please reach out to a " +
  'crisis line or someone you trust right now. In the US you can call or text 988 (Suicide & Crisis Lifeline); ' +
  'if you\'re elsewhere, a quick search for "crisis line" plus your country will find a local number. ' +
  "You deserve real support, and I want you to have it.";
