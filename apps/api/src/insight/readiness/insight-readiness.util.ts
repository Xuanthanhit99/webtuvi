import { SINGLETON_MIN_SCORE } from '../clustering/insight-clustering.util';

/**
 * Deterministic readiness classification (Phase 5) — exactly the four states this sprint's brief
 * specifies. `ARCHIVED` is never computed here: it is set only by an explicit user action
 * (`POST /insight-candidates/:id/archive`) and, once set, is never recomputed — the generation
 * service skips readiness recalculation for an already-archived candidate entirely, the same
 * "never resurrect a resolved decision" precedent Reflection Foundation's own generation service
 * already follows.
 */
const MIN_PRIORITY_FOR_READY = 40;
const MIN_EVIDENCE_FOR_READY = 2;

export type ComputedInsightStatus = 'NOT_READY' | 'READY' | 'INSUFFICIENT_EVIDENCE';

export function determineInsightReadiness(priority: number, evidenceCount: number, maxReflectionScore: number): ComputedInsightStatus {
  if (evidenceCount === 0) return 'NOT_READY';
  if (priority < MIN_PRIORITY_FOR_READY) return 'NOT_READY';
  if (evidenceCount < MIN_EVIDENCE_FOR_READY && maxReflectionScore < SINGLETON_MIN_SCORE) return 'INSUFFICIENT_EVIDENCE';
  return 'READY';
}
