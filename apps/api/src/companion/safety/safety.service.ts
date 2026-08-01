import { Injectable, Logger } from '@nestjs/common';
import { CRISIS_REFUSAL_MESSAGE, detectCrisis } from './crisis-detector';
import { PROMPT_INJECTION_REFUSAL_MESSAGE, detectPromptInjection } from './prompt-injection-detector';
import { detectHighConfidenceFabrication } from './pii-detector';
import type { SafetyCheckResult } from './safety.types';

/** Defense-in-depth alongside the DTO's own @MaxLength — a safety-layer responsibility, not just input validation. */
export const MAX_INPUT_LENGTH = 4000;

const SAFE_RESULT: SafetyCheckResult = { allowed: true, category: 'none' };

/**
 * Input moderation, output moderation, prompt-injection detection, and the
 * refusal policy in one place. Crisis language short-circuits *before* any
 * provider is ever called — see docs/security/ai-safety.md "Refusal policy".
 * Never logs the checked text itself, only the category of what was found.
 */
@Injectable()
export class SafetyService {
  private readonly logger = new Logger('AISafety');

  checkInput(text: string): SafetyCheckResult {
    if (text.length > MAX_INPUT_LENGTH) {
      this.logRefusal('too_long');
      return {
        allowed: false,
        category: 'too_long',
        refusalMessage: `That message is a bit long for me to take in at once — could you shorten it to under ${MAX_INPUT_LENGTH} characters?`,
      };
    }

    if (detectCrisis(text)) {
      this.logRefusal('crisis');
      return { allowed: false, category: 'crisis', refusalMessage: CRISIS_REFUSAL_MESSAGE };
    }

    if (detectPromptInjection(text)) {
      this.logRefusal('prompt_injection');
      return { allowed: false, category: 'prompt_injection', refusalMessage: PROMPT_INJECTION_REFUSAL_MESSAGE };
    }

    return SAFE_RESULT;
  }

  checkOutput(text: string): SafetyCheckResult {
    if (detectHighConfidenceFabrication(text)) {
      this.logRefusal('fabricated_sensitive_data');
      return {
        allowed: false,
        category: 'fabricated_sensitive_data',
        refusalMessage:
          "I noticed I was about to say something that looked like sensitive personal data I was never given — " +
          "I don't have that information, so I won't guess at it. Could we go back to what you were sharing?",
      };
    }

    return SAFE_RESULT;
  }

  private logRefusal(category: SafetyCheckResult['category']): void {
    // Category only — never the message text itself.
    this.logger.warn(`Safety refusal: category=${category}`);
  }
}
