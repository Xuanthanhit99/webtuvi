import { Injectable, Logger } from '@nestjs/common';
import type { ReflectionRuleFinding, ReflectionUserData } from '../reflection.types';
import { ALL_RULES } from './reflection-rules';

/**
 * Runs every deterministic rule (Phase 3) over one user's data snapshot. Rules only — no AI, no
 * model call, no scoring here (that's ReflectionScoreService, kept separate so scoring weights
 * can change without touching rule logic, and so each is independently unit-testable). A rule
 * that throws is logged and skipped rather than failing the whole pass — one bad rule must never
 * take down every other rule's real findings.
 */
@Injectable()
export class ReflectionRuleEngine {
  private readonly logger = new Logger('ReflectionRuleEngine');

  run(data: ReflectionUserData): ReflectionRuleFinding[] {
    const findings: ReflectionRuleFinding[] = [];
    for (const rule of ALL_RULES) {
      try {
        findings.push(...rule(data));
      } catch (error) {
        this.logger.error(`Rule ${rule.name} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return findings;
  }
}
