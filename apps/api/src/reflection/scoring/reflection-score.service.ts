import { Injectable } from '@nestjs/common';
import {
  calculateReflectionScore,
  explainReflectionScoreFactors,
  type ReflectionScoreInput,
  type ReflectionScoreResult,
} from './reflection-score.calculator';

/** Thin, injectable wrapper around the pure calculator (Phase 5) — kept as its own service so it
 * can be mocked/verified independently and to match this sprint's explicit "Create
 * ReflectionScoreService" requirement, mirroring ImportanceScoringService's own role wrapping
 * MemoryImportanceCalculator. */
@Injectable()
export class ReflectionScoreService {
  score(input: ReflectionScoreInput): ReflectionScoreResult {
    return calculateReflectionScore(input);
  }

  explain(factors: Record<string, number>): string[] {
    return explainReflectionScoreFactors(factors);
  }
}
