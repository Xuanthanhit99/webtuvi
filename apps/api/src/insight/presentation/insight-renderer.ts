import type { InsightCategory, InsightStatus, InsightWindow, ReflectionSourceType } from '@prisma/client';
import { explainInsightPriorityFactors } from '../priority/insight-priority.calculator';
import { INSIGHT_CATEGORY_LABELS, INSIGHT_SOURCE_TYPE_LABELS, INSIGHT_STATUS_LABELS } from './insight-presentation-labels';
import type {
  InsightCard,
  InsightCategoryPresentation,
  InsightEvidenceCard,
  InsightEvidenceSourceItem,
  InsightPriorityBadge,
  InsightPriorityTier,
  InsightReason,
  InsightStatusPresentation,
  InsightTimelineCard,
} from './insight-presentation.types';

/**
 * Phase 2 — the deterministic renderer. Input: an already-persisted `InsightCandidate` (Insight
 * Preparation, Sprint 4C). Output: `InsightCard`. Every function here is pure — no DB access, no
 * randomness, no LLM — and every rendered field is either copied straight off the input or built
 * from a fixed, documented template. Never fabricates wording: `reason.headline` is always the
 * candidate's own `ruleExplanation`; `reason.whyItMatters` is always
 * `explainInsightPriorityFactors(candidate.priorityFactors)`, the same array Sprint 4C's own API
 * already returns as `priorityExplanation` — this renderer never recomputes that text differently.
 */

/** Reuses this codebase's own existing constants rather than inventing new thresholds: 40 is the
 * readiness cutoff already in `readiness/insight-readiness.util.ts` (`priority < 40` -> `NOT_READY`),
 * 70 is `SINGLETON_MIN_SCORE` already in `clustering/insight-clustering.util.ts`. */
const PRIORITY_TIER_MEDIUM_MIN = 40;
const PRIORITY_TIER_HIGH_MIN = 70;

export function priorityTierFor(priority: number): InsightPriorityTier {
  if (priority >= PRIORITY_TIER_HIGH_MIN) return 'HIGH';
  if (priority >= PRIORITY_TIER_MEDIUM_MIN) return 'MEDIUM';
  return 'LOW';
}

const PRIORITY_TIER_LABELS: Record<InsightPriorityTier, string> = {
  LOW: 'Low priority',
  MEDIUM: 'Medium priority',
  HIGH: 'High priority',
};

export function toPriorityBadge(priority: number): InsightPriorityBadge {
  const tier = priorityTierFor(priority);
  return { tier, label: PRIORITY_TIER_LABELS[tier], priority };
}

export function toCategoryPresentation(category: InsightCategory): InsightCategoryPresentation {
  return { value: category, label: INSIGHT_CATEGORY_LABELS[category] };
}

export function toStatusPresentation(status: InsightStatus): InsightStatusPresentation {
  return { value: status, label: INSIGHT_STATUS_LABELS[status] };
}

function buildEvidenceSummary(evidenceCount: number, relationshipCount: number): string {
  const evidencePart = `Backed by ${evidenceCount} reflection${evidenceCount === 1 ? '' : 's'}`;
  if (relationshipCount === 0) return `${evidencePart}.`;
  return `${evidencePart}, connected by ${relationshipCount} relationship${relationshipCount === 1 ? '' : 's'}.`;
}

export function toInsightReason(
  ruleExplanation: string,
  priorityFactors: Record<string, number> | null,
  evidenceCount: number,
  relationshipCount: number,
): InsightReason {
  return {
    headline: ruleExplanation,
    whyItMatters: explainInsightPriorityFactors(priorityFactors ?? {}),
    evidenceSummary: buildEvidenceSummary(evidenceCount, relationshipCount),
  };
}

/** The minimal shape the renderer needs off a persisted `InsightCandidate` row — deliberately not
 * the full Prisma model, so callers can pass either a fully-included row or a lighter `_count`
 * projection. */
export interface RenderableInsightCandidate {
  id: string;
  category: InsightCategory;
  status: InsightStatus;
  window: InsightWindow;
  windowStart: Date;
  windowEnd: Date;
  ruleExplanation: string;
  priority: number;
  priorityFactors: unknown;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  evidenceCount: number;
  relationshipCount: number;
}

export function renderInsightCard(candidate: RenderableInsightCandidate): InsightCard {
  return {
    id: candidate.id,
    category: toCategoryPresentation(candidate.category),
    status: toStatusPresentation(candidate.status),
    window: candidate.window,
    windowStart: candidate.windowStart.toISOString(),
    windowEnd: candidate.windowEnd.toISOString(),
    reason: toInsightReason(
      candidate.ruleExplanation,
      (candidate.priorityFactors as Record<string, number> | null) ?? null,
      candidate.evidenceCount,
      candidate.relationshipCount,
    ),
    priorityBadge: toPriorityBadge(candidate.priority),
    evidenceCount: candidate.evidenceCount,
    relationshipCount: candidate.relationshipCount,
    pinned: candidate.pinned,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    resolvedAt: candidate.resolvedAt?.toISOString() ?? null,
  };
}

/** `YYYY-MM-DD` in UTC — the one deterministic bucket key every Timeline grouping mode (Phase 4)
 * groups on top of. Matches the existing `bucketFor()`/timeline precedent's own use of `createdAt`
 * (`reflection-record.service.ts`), never a separate "insight date" concept. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function renderTimelineCard(candidate: RenderableInsightCandidate): InsightTimelineCard {
  return { ...renderInsightCard(candidate), day: dayKey(candidate.createdAt) };
}

/** Evidence link rules (Phase 3) — mirrors `ReflectionSourceViewer`'s own deep-link/no-link rule
 * exactly: `JOURNAL`/`MEMORY` sources deep-link to their real detail view, `ACTIVITY`/`COMPANION`
 * sources have no standalone detail view in this product, so `href` is `null` for them. */
export function hrefForSource(sourceType: ReflectionSourceType, sourceId: string): string | null {
  if (sourceType === 'JOURNAL') return `/journal?item=${sourceId}`;
  if (sourceType === 'MEMORY') return `/memory?item=${sourceId}`;
  return null;
}

export function renderEvidenceSourceItem(
  sourceType: ReflectionSourceType,
  sourceId: string,
  sourceTimestamp: Date,
  available: boolean,
): InsightEvidenceSourceItem {
  return {
    sourceType,
    sourceTypeLabel: INSIGHT_SOURCE_TYPE_LABELS[sourceType],
    sourceId,
    sourceTimestamp: sourceTimestamp.toISOString(),
    href: available ? hrefForSource(sourceType, sourceId) : null,
    available,
  };
}

export interface RenderableEvidence {
  reflectionCandidateId: string;
  reflectionCategory: import('@prisma/client').ReflectionCategory;
  reflectionScore: number;
  reflectionState: import('@prisma/client').ReflectionState;
  contribution: string;
  sources: InsightEvidenceSourceItem[];
}

export function renderEvidenceCard(evidence: RenderableEvidence): InsightEvidenceCard {
  return {
    reflectionCandidateId: evidence.reflectionCandidateId,
    reflectionCategory: evidence.reflectionCategory,
    reflectionScore: evidence.reflectionScore,
    reflectionState: evidence.reflectionState,
    contribution: evidence.contribution,
    href: `/reflections?item=${evidence.reflectionCandidateId}`,
    sources: evidence.sources,
  };
}
