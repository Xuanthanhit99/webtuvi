/**
 * Regex-based PII shape detection — used defensively, never to block ordinary
 * conversation (a user is free to share their own email/phone if they
 * choose). Its real job is catching the ASSISTANT fabricating a
 * sensitive-looking number that was never provided (see SafetyService.checkOutput
 * and the system prompt's "never fabricate" rule) — a highly specific,
 * high-confidence signal, unlike a generic PII scan.
 */
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;
const CREDIT_CARD_RE = /\b(?:\d[ -]?){13,16}\b/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;

export interface PiiMatch {
  found: boolean;
  categories: string[];
}

export function detectPii(text: string): PiiMatch {
  const categories: string[] = [];
  if (SSN_RE.test(text)) categories.push('ssn');
  if (CREDIT_CARD_RE.test(text)) categories.push('credit_card');
  if (EMAIL_RE.test(text)) categories.push('email');
  if (PHONE_RE.test(text)) categories.push('phone');
  return { found: categories.length > 0, categories };
}

/** The specific high-confidence subset used to block a fabricated assistant reply — email/phone alone is too common/legitimate to block on. */
export function detectHighConfidenceFabrication(text: string): boolean {
  return SSN_RE.test(text) || CREDIT_CARD_RE.test(text);
}
