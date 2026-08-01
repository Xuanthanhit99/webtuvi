export type SafetyCategory = 'none' | 'crisis' | 'prompt_injection' | 'unsafe_content' | 'too_long' | 'fabricated_sensitive_data';

export interface SafetyCheckResult {
  allowed: boolean;
  category: SafetyCategory;
  /** Internal-only detail for observability — never shown to the user, never logged with the offending text itself. */
  reason?: string;
  /** Calm, pre-written message to show the user instead of calling (or instead of returning) the LLM's output. Only set when !allowed. */
  refusalMessage?: string;
}
