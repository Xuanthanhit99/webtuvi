import type { ReflectionCandidate, ReflectionSourceRef } from '@prisma/client';

/** A ReflectionCandidate together with its own source refs — the only shape the Relationship,
 * Evidence, and Priority engines ever operate on. Never re-fetches Journal/Memory/Activity/
 * Companion directly; those are Reflection Foundation's job. */
export type ReflectionCandidateWithSources = ReflectionCandidate & { sources: ReflectionSourceRef[] };

/** Bounded, deterministic snapshot of one user's active/recently-resolved Reflection Candidates —
 * fetched once per generation pass by InsightDataSourceService. */
export interface InsightUserData {
  userId: string;
  reflections: ReflectionCandidateWithSources[];
  /** Memory.importanceScore keyed by memory id, for every MEMORY-type source cited across
   * `reflections` — fetched once, bounded, real data (never fabricated) for the Priority
   * Engine's "memory importance" factor. */
  memoryImportanceById: Map<string, number>;
}

/** Inputs InsightPriorityService needs, derived once per cluster by the clustering step. */
export interface InsightPriorityHints {
  evidenceCount: number;
  averageReflectionScore: number;
  maxReflectionScore: number;
  hasContinuesOrRepeats: boolean;
  sameCategoryCount: number;
  isGoalRelevant: boolean;
  hasActivitySource: boolean;
  journalBackedEvidenceCount: number;
  averageMemoryImportance: number | null;
}
