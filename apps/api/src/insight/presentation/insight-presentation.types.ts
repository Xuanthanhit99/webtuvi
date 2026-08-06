import type {
  InsightCategory,
  InsightStatus,
  InsightWindow,
  ReflectionCategory,
  ReflectionSourceType,
  ReflectionState,
} from '@prisma/client';

/**
 * Phase 1 (Sprint 5A) — presentation objects rendered deterministically from an already-persisted
 * `InsightCandidate`. Nothing here is computed by an LLM or free-text generation; every field is
 * either copied straight off the row (or a row it already, transitively, cites) or built from a
 * fixed template — see `insight-renderer.ts`.
 */

export type InsightPriorityTier = 'LOW' | 'MEDIUM' | 'HIGH';

/** Thresholds intentionally reuse this codebase's own existing constants rather than inventing
 * new ones: 40 is the readiness cutoff already in `readiness/insight-readiness.util.ts`, 70 is
 * `SINGLETON_MIN_SCORE` already in `clustering/insight-clustering.util.ts`. */
export interface InsightPriorityBadge {
  tier: InsightPriorityTier;
  label: string;
  priority: number;
}

/** "What happened / why it matters" — both strings are reused verbatim from fields the candidate
 * already carries (`ruleExplanation`, the priority-factor explanation array); nothing here is
 * newly generated. */
export interface InsightReason {
  headline: string;
  whyItMatters: string[];
  evidenceSummary: string;
}

export interface InsightCategoryPresentation {
  value: InsightCategory;
  label: string;
}

export interface InsightStatusPresentation {
  value: InsightStatus;
  label: string;
}

export interface InsightCard {
  id: string;
  category: InsightCategoryPresentation;
  status: InsightStatusPresentation;
  window: InsightWindow;
  windowStart: string;
  windowEnd: string;
  reason: InsightReason;
  priorityBadge: InsightPriorityBadge;
  evidenceCount: number;
  relationshipCount: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export type InsightTimelineRange = 'today' | 'week' | 'month' | 'custom';
export type InsightTimelineGroupBy = 'category' | 'priority' | 'topic';

export interface InsightTimelineCard extends InsightCard {
  /** The `createdAt` calendar day, in ISO `YYYY-MM-DD` — the one deterministic bucket key every
   * grouping mode buckets on top of. */
  day: string;
}

export interface InsightTimelineGroup {
  key: string;
  label: string;
  items: InsightTimelineCard[];
}

export interface InsightTimelineResult {
  range: InsightTimelineRange;
  from: string;
  to: string;
  groupBy: InsightTimelineGroupBy;
  groups: InsightTimelineGroup[];
}

/** One real source record a cited Reflection Candidate points at. `href` is only ever populated
 * for source types this product already has a real detail view for (`JOURNAL`/`MEMORY`) — mirrors
 * `ReflectionSourceViewer`'s own deep-link/no-link rule exactly, so the two surfaces can never
 * drift. `available` is false when the underlying record could not be confirmed to still exist
 * (Phase 8 — deleted/stale source handling). */
export interface InsightEvidenceSourceItem {
  sourceType: ReflectionSourceType;
  sourceTypeLabel: string;
  sourceId: string;
  sourceTimestamp: string;
  href: string | null;
  available: boolean;
}

/** One `InsightEvidence` row, resolved down to the real Reflection Candidate it cites and that
 * reflection's own real sources — "Users can inspect Memory, Journal, Reflection, Activity that
 * contributed to an insight" (Phase 3), every item linking back to its source. */
export interface InsightEvidenceCard {
  reflectionCandidateId: string;
  reflectionCategory: ReflectionCategory;
  reflectionScore: number;
  reflectionState: ReflectionState;
  contribution: string;
  href: string;
  sources: InsightEvidenceSourceItem[];
}
