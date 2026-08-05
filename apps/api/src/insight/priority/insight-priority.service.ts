import { Injectable } from '@nestjs/common';
import {
  calculateInsightPriority,
  explainInsightPriorityFactors,
  type InsightPriorityResult,
} from './insight-priority.calculator';
import type { InsightPriorityHints } from '../insight.types';

/** Thin, injectable wrapper around the pure calculator (Phase 4) — mirrors
 * ReflectionScoreService's own role wrapping its calculator, kept as its own service so it can be
 * mocked/verified independently. */
@Injectable()
export class InsightPriorityService {
  score(hints: InsightPriorityHints): InsightPriorityResult {
    return calculateInsightPriority(hints);
  }

  explain(factors: Record<string, number>): string[] {
    return explainInsightPriorityFactors(factors);
  }
}
