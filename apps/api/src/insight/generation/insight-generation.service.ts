import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { InsightCategory, InsightWindow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReflectionGenerationService } from '../../reflection/generation/reflection-generation.service';
import { ReflectionValidityService } from '../../reflection/validity/reflection-validity.service';
import { InsightDataSourceService } from '../sources/insight-data-source.service';
import { InsightRelationshipService } from '../relationships/insight-relationship.service';
import { InsightPriorityService } from '../priority/insight-priority.service';
import { clusterReflections, type ClusterEdge } from '../clustering/insight-clustering.util';
import { determineInsightReadiness } from '../readiness/insight-readiness.util';
import type { InsightPriorityHints, ReflectionCandidateWithSources } from '../insight.types';

const DAY_MS = 24 * 60 * 60 * 1000;

interface ClusterResult {
  category: InsightCategory;
  window: InsightWindow;
  windowStart: Date;
  windowEnd: Date;
  ruleExplanation: string;
  priority: number;
  factors: Record<string, number>;
  status: 'NOT_READY' | 'READY' | 'INSUFFICIENT_EVIDENCE';
  contributionByReflectionId: Map<string, string>;
}

/**
 * Orchestrates Phases 2-5: fetch Reflection Candidates -> detect relationships -> cluster ->
 * score -> determine readiness -> persist. Compute-on-read, no background job — mirrors
 * ReflectionGenerationService's own precedent exactly, including "never resurrect a resolved
 * (ARCHIVED) candidate" via `dedupeKey`.
 *
 * Also owns Phase 8's "deleted source invalidation" / "stale references" handling
 * (`reconcileStaleCandidates`) rather than a separate InsightValidityService class: because this
 * service already recomputes every current cluster's evidence from scratch on every call (the
 * same way MemoryDuplicateService/MemoryConflictService recompute their own pairwise findings
 * from scratch), a candidate whose evidence referenced a Reflection Candidate that has since
 * expired is naturally excluded from the *current* fetch — the only extra step needed is
 * reconciling *existing* candidate rows that this pass's clusters didn't touch, which is what
 * `reconcileStaleCandidates` does.
 */
@Injectable()
export class InsightGenerationService {
  private readonly logger = new Logger('InsightGeneration');

  // Per-user single-flight lock: `ensureGenerated` is deterministic and idempotent (repeated runs
  // over the same underlying Reflection Candidates converge to the same rows), so concurrent
  // callers for the same user — e.g. a page's list + statistics requests landing together, or a
  // fast double-navigation — can safely share one in-progress run instead of each independently
  // read-then-writing the same InsightRelationship/InsightCandidate/InsightEvidence rows. Without
  // this, two overlapping runs race past each other's reads and collide on the same unique
  // constraints (found via this sprint's own Playwright verification, which fires exactly this
  // kind of overlapping request pair).
  private readonly inFlightByUser = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflectionGeneration: ReflectionGenerationService,
    private readonly reflectionValidity: ReflectionValidityService,
    private readonly dataSource: InsightDataSourceService,
    private readonly relationshipService: InsightRelationshipService,
    private readonly priorityService: InsightPriorityService,
  ) {}

  async ensureGenerated(userId: string): Promise<void> {
    const existing = this.inFlightByUser.get(userId);
    if (existing) return existing;

    const run = this.runGeneration(userId).finally(() => {
      this.inFlightByUser.delete(userId);
    });
    this.inFlightByUser.set(userId, run);
    return run;
  }

  private async runGeneration(userId: string): Promise<void> {
    const startedAt = Date.now();
    // Insight Preparation is layered strictly on top of Reflection Foundation — re-run Reflection's
    // own regenerate-then-revalidate pass first so this never reads a stale or not-yet-generated
    // Reflection layer (mirrors ReflectionRecordService.ensureFresh()'s own two-step call).
    await this.reflectionGeneration.ensureGenerated(userId);
    await this.reflectionValidity.revalidateForUser(userId);

    const data = await this.dataSource.fetch(userId);
    await this.relationshipService.detectForUser(userId, data.reflections);

    const reflectionIds = data.reflections.map((r) => r.id);
    const reflectionById = new Map(data.reflections.map((r) => [r.id, r]));
    const scoreById = new Map(data.reflections.map((r) => [r.id, r.score]));

    const relationshipRows = reflectionIds.length
      ? await this.prisma.insightRelationship.findMany({
          where: { userId, reflectionAId: { in: reflectionIds }, reflectionBId: { in: reflectionIds } },
        })
      : [];
    const edges: ClusterEdge[] = relationshipRows.map((r) => ({
      reflectionAId: r.reflectionAId,
      reflectionBId: r.reflectionBId,
      type: r.type,
      reason: r.reason,
    }));

    const clusters = clusterReflections(reflectionIds, scoreById, edges);

    const touchedDedupeKeys = new Set<string>();
    let created = 0;
    let updated = 0;

    for (const cluster of clusters) {
      const clusterReflections = cluster.reflectionIds.map((id) => reflectionById.get(id)!);
      // Anchored on the cluster's *most recently created* member, not the oldest/smallest id.
      // This keeps regeneration idempotent while a cluster's membership is unchanged (the newest
      // member stays the same, so the key stays the same and the row updates in place), but lets
      // genuinely new evidence "roll forward" past an archived decision: once new evidence with a
      // newer id joins, the anchor changes, producing a fresh dedupeKey rather than permanently
      // colliding with — and being silently skipped in favor of — an old, broad, since-archived
      // cluster it happens to transitively connect to (a real failure mode found via this
      // sprint's own Playwright verification against the shared demo account's real history).
      const anchor = [...clusterReflections].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id))[0]!;
      const category = dominantCategory(clusterReflections);
      const dedupeKey = `${category}:${anchor.id}`;
      touchedDedupeKeys.add(dedupeKey);

      const result = this.computeClusterResult(clusterReflections, cluster.edges, data.memoryImportanceById);

      const existing = await this.prisma.insightCandidate.findUnique({
        where: { userId_dedupeKey: { userId, dedupeKey } },
      });
      if (existing && existing.status === 'ARCHIVED') continue;

      // `upsert` on the compound unique key (rather than a plain `create()` in the `!existing`
      // branch) keeps this safe when concurrent requests for the same user (e.g. the frontend
      // firing list + statistics in parallel) both read `existing` as null and both reach this
      // point for the same dedupeKey — see the identical race and fix in
      // InsightRelationshipService.detectForUser. Both sides compute the same deterministic
      // `result` from the same input reflections, so the loser applying its write as an update
      // instead of throwing on the unique constraint is safe and idempotent.
      const candidate = await this.prisma.insightCandidate.upsert({
        where: { userId_dedupeKey: { userId, dedupeKey } },
        create: {
          userId,
          category: result.category,
          status: result.status,
          window: result.window,
          windowStart: result.windowStart,
          windowEnd: result.windowEnd,
          ruleExplanation: result.ruleExplanation,
          priority: result.priority,
          priorityFactors: result.factors,
          dedupeKey,
        },
        update: {
          category: result.category,
          status: result.status,
          window: result.window,
          windowStart: result.windowStart,
          windowEnd: result.windowEnd,
          ruleExplanation: result.ruleExplanation,
          priority: result.priority,
          priorityFactors: result.factors,
        },
      });

      await this.prisma.insightEvidence.deleteMany({ where: { insightCandidateId: candidate.id } });
      await this.prisma.insightEvidence.createMany({
        data: clusterReflections.map((r) => ({
          insightCandidateId: candidate.id,
          reflectionCandidateId: r.id,
          contribution: result.contributionByReflectionId.get(r.id) ?? `${r.category} — score ${r.score}.`,
        })),
      });

      const clusterReflectionIdSet = new Set(cluster.reflectionIds);
      const clusterRelationshipIds = relationshipRows
        .filter((r) => clusterReflectionIdSet.has(r.reflectionAId) && clusterReflectionIdSet.has(r.reflectionBId))
        .map((r) => r.id);
      if (clusterRelationshipIds.length > 0) {
        await this.prisma.insightRelationship.updateMany({
          where: { id: { in: clusterRelationshipIds } },
          data: { insightCandidateId: candidate.id },
        });
      }

      if (existing) updated += 1;
      else created += 1;
    }

    await this.reconcileStaleCandidates(userId, touchedDedupeKeys, new Set(reflectionIds), reflectionById, edges);

    this.logger.log(
      `Insight generation: user reflections=${data.reflections.length} clusters=${clusters.length} created=${created} updated=${updated} latencyMs=${Date.now() - startedAt}`,
    );
  }

  /** Phase 8 — an existing, still-active candidate whose evidence references a Reflection
   * Candidate no longer in the current (non-expired) fetch has that evidence removed and its
   * priority/status recomputed from whatever real evidence remains. Never touches an ARCHIVED
   * candidate. */
  private async reconcileStaleCandidates(
    userId: string,
    touchedDedupeKeys: Set<string>,
    validReflectionIds: Set<string>,
    reflectionById: Map<string, ReflectionCandidateWithSources>,
    edges: ClusterEdge[],
  ): Promise<void> {
    const candidates = await this.prisma.insightCandidate.findMany({
      where: {
        userId,
        status: { in: ['NOT_READY', 'READY', 'INSUFFICIENT_EVIDENCE'] },
        dedupeKey: { notIn: [...touchedDedupeKeys] },
      },
      include: { evidence: true },
    });

    for (const candidate of candidates) {
      const invalidEvidenceIds = candidate.evidence.filter((e) => !validReflectionIds.has(e.reflectionCandidateId)).map((e) => e.id);
      if (invalidEvidenceIds.length === 0) continue;

      await this.prisma.insightEvidence.deleteMany({ where: { id: { in: invalidEvidenceIds } } });
      const remaining = candidate.evidence.filter((e) => validReflectionIds.has(e.reflectionCandidateId));

      if (remaining.length === 0) {
        await this.prisma.insightCandidate.update({
          where: { id: candidate.id },
          data: { status: 'NOT_READY', priority: 0, priorityFactors: Prisma.JsonNull },
        });
        continue;
      }

      const remainingReflections = remaining.map((e) => reflectionById.get(e.reflectionCandidateId)!);
      const remainingIds = new Set(remaining.map((e) => e.reflectionCandidateId));
      const remainingEdges = edges.filter((e) => remainingIds.has(e.reflectionAId) && remainingIds.has(e.reflectionBId));
      // Memory importance isn't re-derived here (would require re-fetching); the priority factor
      // simply drops out on reconciliation, a conservative (never-overstated) approximation.
      const result = this.computeClusterResult(remainingReflections, remainingEdges, new Map());

      await this.prisma.insightCandidate.update({
        where: { id: candidate.id },
        data: { status: result.status, priority: result.priority, priorityFactors: result.factors },
      });
    }
  }

  private computeClusterResult(
    reflections: ReflectionCandidateWithSources[],
    edges: ClusterEdge[],
    memoryImportanceById: Map<string, number>,
  ): ClusterResult {
    const category = dominantCategory(reflections);
    const timestamps = reflections.flatMap((r) => [r.windowStart, r.windowEnd]);
    const windowStart = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const windowEnd = new Date(Math.max(...timestamps.map((t) => t.getTime())));
    const window = windowFor(daysBetween(windowStart, windowEnd));

    const scores = reflections.map((r) => r.score);
    const averageReflectionScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxReflectionScore = Math.max(...scores);

    const categoryCounts = new Map<string, number>();
    for (const r of reflections) categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
    const sameCategoryCount = categoryCounts.get(category) ?? 0;

    const hasContinuesOrRepeats = edges.some((e) => e.type === 'CONTINUES' || e.type === 'REPEATS');
    const isGoalRelevant = category === 'GOAL' || reflections.some((r) => r.category === 'GOAL');
    const hasActivitySource = reflections.some((r) => r.sources.some((s) => s.sourceType === 'ACTIVITY'));
    const journalBackedEvidenceCount = reflections.filter((r) => r.sources.some((s) => s.sourceType === 'JOURNAL')).length;

    const memoryScores = reflections
      .flatMap((r) => r.sources.filter((s) => s.sourceType === 'MEMORY').map((s) => memoryImportanceById.get(s.sourceId)))
      .filter((v): v is number => v !== undefined);
    const averageMemoryImportance = memoryScores.length > 0 ? memoryScores.reduce((a, b) => a + b, 0) / memoryScores.length : null;

    const hints: InsightPriorityHints = {
      evidenceCount: reflections.length,
      averageReflectionScore,
      maxReflectionScore,
      hasContinuesOrRepeats,
      sameCategoryCount,
      isGoalRelevant,
      hasActivitySource,
      journalBackedEvidenceCount,
      averageMemoryImportance,
    };
    const { priority, factors } = this.priorityService.score(hints);
    const status = determineInsightReadiness(priority, reflections.length, maxReflectionScore);

    const ruleExplanation = buildRuleExplanation(reflections, edges);
    const contributionByReflectionId = new Map(
      reflections.map((r) => [r.id, `${r.reason} (score ${r.score}, observed ${r.windowEnd.toISOString().slice(0, 10)}).`]),
    );

    return { category, window, windowStart, windowEnd, ruleExplanation, priority, factors, status, contributionByReflectionId };
  }
}

function dominantCategory(reflections: ReflectionCandidateWithSources[]): InsightCategory {
  const counts = new Map<InsightCategory, number>();
  for (const r of reflections) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0])).map(([category]) => category)[0]!;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / DAY_MS;
}

function windowFor(span: number): InsightWindow {
  if (span <= 1) return 'DAY';
  if (span <= 7) return 'WEEK';
  if (span <= 31) return 'MONTH';
  return 'CUSTOM';
}

function buildRuleExplanation(reflections: ReflectionCandidateWithSources[], edges: ClusterEdge[]): string {
  if (edges.length === 0) {
    const r = reflections[0]!;
    return `A single strong reflection (score ${r.score}) about ${r.category.toLowerCase()}.`;
  }
  const types = [...new Set(edges.map((e) => e.type))].sort().join(', ');
  return `${reflections.length} reflections connected by ${types} relationships.`;
}
