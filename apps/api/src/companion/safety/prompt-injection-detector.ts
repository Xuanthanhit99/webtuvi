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

/**
 * Sprint 3C, Phase 12 — narrow, high-confidence patterns for prompt injection specifically
 * *attempting memory access*: extracting the raw retrieval/prompt-assembly mechanics, bypassing
 * consent, or reaching another user's data. Deliberately does **not** flag ordinary questions
 * like "what do you remember about me" — that's a legitimate question the Companion already
 * answers honestly (only from what's actually retrieved, per the system prompt's own "never
 * fabricate" rule); these patterns require clear extraction/bypass framing (dump, bypass,
 * ignore consent, another user's memory), not mere curiosity about one's own memories.
 */
const MEMORY_INJECTION_PATTERNS: RegExp[] = [
  /\bdump\s+(the\s+|your\s+|all\s+)?memor(y|ies)(\s+(database|table|data))?\b/i,
  /\bprint\s+(all\s+|every\s+)?(stored\s+|saved\s+)?memories\b/i,
  /\bbypass\s+(the\s+)?(memory\s+)?consent\b/i,
  /\bignore\s+(the\s+|your\s+)?consent(\s+settings)?\b/i,
  /\b(access|show|reveal)\b.{0,20}\b(another|other|someone else)\b.{0,15}\bmemor(y|ies)\b/i,
  /\bshow\s+me\s+(the\s+)?raw\s+memory\s+data\b/i,
];

export function detectPromptInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text)) || MEMORY_INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export const PROMPT_INJECTION_REFUSAL_MESSAGE =
  "I can't do that, but I'm here if you want to talk about what's actually on your mind.";
