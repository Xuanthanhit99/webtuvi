import type { InsightCandidate, InsightEvidence, InsightRelationship, ReflectionCandidate } from '@prisma/client';
import { explainInsightPriorityFactors } from './priority/insight-priority.calculator';

export interface InsightEvidenceDto {
  reflectionCandidateId: string;
  contribution: string;
  reflectionCategory: ReflectionCandidate['category'];
  reflectionTrigger: ReflectionCandidate['trigger'];
  reflectionScore: number;
  reflectionState: ReflectionCandidate['state'];
}

export interface InsightRelationshipDto {
  id: string;
  reflectionAId: string;
  reflectionBId: string;
  type: InsightRelationship['type'];
  reason: string;
}

export interface InsightCandidateDto {
  id: string;
  category: InsightCandidate['category'];
  status: InsightCandidate['status'];
  window: InsightCandidate['window'];
  windowStart: string;
  windowEnd: string;
  ruleExplanation: string;
  priority: number;
  priorityExplanation: string[];
  evidence: InsightEvidenceDto[];
  relationships: InsightRelationshipDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

type EvidenceWithReflection = InsightEvidence & { reflectionCandidate: ReflectionCandidate };
type CandidateWithRelations = InsightCandidate & { evidence: EvidenceWithReflection[]; relationships: InsightRelationship[] };

/** Shared by every Insight Preparation surface so they all render an identical shape.
 * `priorityExplanation` is always derived from the persisted `priorityFactors`, never recomputed
 * differently per caller — mirrors ReflectionCandidateDto's own "always explain" discipline. */
export function toInsightCandidateDto(candidate: CandidateWithRelations): InsightCandidateDto {
  const factors = (candidate.priorityFactors as Record<string, number> | null) ?? {};
  return {
    id: candidate.id,
    category: candidate.category,
    status: candidate.status,
    window: candidate.window,
    windowStart: candidate.windowStart.toISOString(),
    windowEnd: candidate.windowEnd.toISOString(),
    ruleExplanation: candidate.ruleExplanation,
    priority: candidate.priority,
    priorityExplanation: explainInsightPriorityFactors(factors),
    evidence: candidate.evidence.map((e) => ({
      reflectionCandidateId: e.reflectionCandidateId,
      contribution: e.contribution,
      reflectionCategory: e.reflectionCandidate.category,
      reflectionTrigger: e.reflectionCandidate.trigger,
      reflectionScore: e.reflectionCandidate.score,
      reflectionState: e.reflectionCandidate.state,
    })),
    relationships: candidate.relationships.map((r) => ({
      id: r.id,
      reflectionAId: r.reflectionAId,
      reflectionBId: r.reflectionBId,
      type: r.type,
      reason: r.reason,
    })),
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    resolvedAt: candidate.resolvedAt?.toISOString() ?? null,
  };
}
