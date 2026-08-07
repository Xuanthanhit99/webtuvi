import type { Review, ReviewEvidence, ReviewSection } from '@prisma/client';
import type { ReviewStatistics } from './review.types';

export interface ReviewEvidenceDto {
  sourceType: ReviewEvidence['sourceType'];
  sourceId: string;
  category: string;
  priority: number;
  sourceTimestamp: string;
  contribution: string;
  /** Deep link back to the real record — mirrors Insight Experience's own evidence-link rule.
   * `INSIGHT`/`REFLECTION` always resolve (their detail views exist for any state); `JOURNAL`/
   * `MEMORY` link to their own real detail views. Never null here — Reviews only ever cite
   * evidence types that do have a real destination in this product. */
  href: string;
}

export interface ReviewSectionDto {
  type: ReviewSection['type'];
  title: string;
  summary: string;
  evidence: ReviewEvidenceDto[];
}

export interface ReviewSummaryDto {
  id: string;
  window: Review['window'];
  windowStart: string;
  windowEnd: string;
  state: Review['state'];
  overview: string;
  statistics: ReviewStatistics;
  sections: ReviewSectionDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

function hrefFor(sourceType: ReviewEvidence['sourceType'], sourceId: string): string {
  switch (sourceType) {
    case 'INSIGHT':
      return `/insights?item=${sourceId}`;
    case 'REFLECTION':
      return `/reflections?item=${sourceId}`;
    case 'JOURNAL':
      return `/journal?item=${sourceId}`;
    case 'MEMORY':
      return `/memory?item=${sourceId}`;
  }
}

function toReviewEvidenceDto(evidence: ReviewEvidence): ReviewEvidenceDto {
  return {
    sourceType: evidence.sourceType,
    sourceId: evidence.sourceId,
    category: evidence.category,
    priority: evidence.priority,
    sourceTimestamp: evidence.sourceTimestamp.toISOString(),
    contribution: evidence.contribution,
    href: hrefFor(evidence.sourceType, evidence.sourceId),
  };
}

function toReviewSectionDto(section: ReviewSection & { evidence: ReviewEvidence[] }): ReviewSectionDto {
  return {
    type: section.type,
    title: section.title,
    summary: section.summary,
    evidence: section.evidence.map(toReviewEvidenceDto),
  };
}

/** The one shape every Review surface renders — mirrors `toInsightCandidateDto`'s own "single
 * source of truth" discipline exactly. */
export function toReviewSummaryDto(review: Review & { sections: (ReviewSection & { evidence: ReviewEvidence[] })[] }): ReviewSummaryDto {
  return {
    id: review.id,
    window: review.window,
    windowStart: review.windowStart.toISOString(),
    windowEnd: review.windowEnd.toISOString(),
    state: review.state,
    overview: review.overview,
    statistics: review.statistics as unknown as ReviewStatistics,
    sections: [...review.sections].sort((a, b) => a.order - b.order).map(toReviewSectionDto),
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    resolvedAt: review.resolvedAt?.toISOString() ?? null,
  };
}
