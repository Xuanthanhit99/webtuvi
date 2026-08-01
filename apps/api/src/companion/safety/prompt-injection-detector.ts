/**
 * Heuristic detection of attempts to override the system prompt or extract
 * it. Kept narrow (high-confidence patterns only) to avoid false-positiving
 * on normal emotional language ("pretend everything's fine" is common
 * phrasing, not an attack). See docs/security/ai-safety.md "Prompt injection".
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(all\s+|any\s+|the\s+)?(previous|prior|above)\s+(instructions?|rules?)/i,
  /reveal\s+(your\s+)?(system\s+)?(prompt|instructions)/i,
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions)/i,
  /\bdeveloper\s+mode\b/i,
  /\bjailbreak\b/i,
  /\bDAN\b/, // "Do Anything Now" jailbreak persona — case-sensitive to avoid matching the common word "dan".
  /do\s+anything\s+now/i,
];

export function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export const PROMPT_INJECTION_REFUSAL_MESSAGE =
  "I can't do that, but I'm here if you want to talk about what's actually on your mind.";
