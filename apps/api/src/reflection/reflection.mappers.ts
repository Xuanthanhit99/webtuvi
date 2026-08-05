import type { ReflectionCandidate, ReflectionSourceRef } from '@prisma/client';
import { explainReflectionScoreFactors } from './scoring/reflection-score.calculator';

export interface ReflectionSourceDto {
  sourceType: ReflectionSourceRef['sourceType'];
  sourceId: string;
  sourceTimestamp: string;
}

export interface ReflectionCandidateDto {
  id: string;
  category: ReflectionCandidate['category'];
  trigger: ReflectionCandidate['trigger'];
  state: ReflectionCandidate['state'];
  window: ReflectionCandidate['window'];
  windowStart: string;
  windowEnd: string;
  reason: string;
  score: number;
  scoreExplanation: string[];
  groupKey: string;
  visibility: ReflectionCandidate['visibility'];
  pinned: boolean;
  sources: ReflectionSourceDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  expiredAt: string | null;
}

type CandidateWithSources = ReflectionCandidate & { sources: ReflectionSourceRef[] };

/** Shared by every Reflection surface (list, feed, timeline, detail, groups) so they all render
 * an identical shape — mirrors JournalEntryDto/MemoryDto's own "one mapper, every surface"
 * precedent. `scoreExplanation` is always derived from the persisted `scoreFactors`, never
 * recomputed differently per caller (Product Bible's "always explain" creed, structural not a UI
 * convention). */
export function toReflectionCandidateDto(candidate: CandidateWithSources): ReflectionCandidateDto {
  const factors = (candidate.scoreFactors as Record<string, number> | null) ?? {};
  return {
    id: candidate.id,
    category: candidate.category,
    trigger: candidate.trigger,
    state: candidate.state,
    window: candidate.window,
    windowStart: candidate.windowStart.toISOString(),
    windowEnd: candidate.windowEnd.toISOString(),
    reason: candidate.reason,
    score: candidate.score,
    scoreExplanation: explainReflectionScoreFactors(factors),
    groupKey: candidate.groupKey,
    visibility: candidate.visibility,
    pinned: candidate.pinned,
    sources: candidate.sources.map((s) => ({
      sourceType: s.sourceType,
      sourceId: s.sourceId,
      sourceTimestamp: s.sourceTimestamp.toISOString(),
    })),
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    resolvedAt: candidate.resolvedAt?.toISOString() ?? null,
    expiredAt: candidate.expiredAt?.toISOString() ?? null,
  };
}
