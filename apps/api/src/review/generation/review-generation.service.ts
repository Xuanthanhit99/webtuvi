import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, ReviewEvidenceSourceType, ReviewSectionType as PrismaReviewSectionType, ReviewState, ReviewWindow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightGenerationService } from '../../insight/generation/insight-generation.service';
import { ReviewDataSourceService } from '../sources/review-data-source.service';
import { computeStatistics } from '../statistics/review-statistics.util';
import { buildReview } from '../builder/review-builder.util';
import { buildReviewDedupeKey, resolveReviewWindow, type ReviewWindowKind } from '../review-window.util';
import type { ReviewableItem } from '../review.types';

/**
 * Orchestrates Review generation (Phases 2/3) — compute-on-read, no background job, mirroring
 * every prior engine's own precedent exactly. `ensureGenerated()` re-runs Insight Preparation's own
 * regenerate pass first (`InsightGenerationService.ensureGenerated()`, which itself re-runs
 * Reflection Foundation's own pass) so a Review never reads a stale lower layer — the same
 * transitive-freshness chain Insight Experience already established one layer down. Generates NO
 * new InsightCandidate/ReflectionCandidate rows itself; only reads, classifies, and persists a
 * Review document over what those layers already produced.
 */
@Injectable()
export class ReviewGenerationService {
  private readonly logger = new Logger('ReviewGeneration');

  // Per-(user, dedupeKey) single-flight lock — same reasoning InsightGenerationService documents
  // for its own concurrent-caller race (a page's list + detail requests landing together).
  private readonly inFlight = new Map<string, Promise<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly insightGeneration: InsightGenerationService,
    private readonly dataSource: ReviewDataSourceService,
  ) {}

  /** Returns the generated/updated Review's id. */
  async ensureGenerated(userId: string, window: ReviewWindowKind, from?: string, to?: string): Promise<string> {
    const { windowStart, windowEnd } = resolveReviewWindow(window, from, to);
    const dedupeKey = buildReviewDedupeKey(window, windowStart, windowEnd);
    const lockKey = `${userId}:${dedupeKey}`;

    const existing = this.inFlight.get(lockKey);
    if (existing) return existing;

    const run = this.runGeneration(userId, window, windowStart, windowEnd, dedupeKey).finally(() => {
      this.inFlight.delete(lockKey);
    });
    this.inFlight.set(lockKey, run);
    return run;
  }

  private async runGeneration(userId: string, window: ReviewWindowKind, windowStart: Date, windowEnd: Date, dedupeKey: string): Promise<string> {
    const startedAt = Date.now();

    const existingArchived = await this.prisma.review.findUnique({ where: { userId_dedupeKey: { userId, dedupeKey } } });
    if (existingArchived?.state === 'ARCHIVED') return existingArchived.id;

    await this.insightGeneration.ensureGenerated(userId);
    const data = await this.dataSource.fetch(userId, windowStart, windowEnd);
    const statistics = computeStatistics(data);

    const items: ReviewableItem[] = [
      ...data.insights.map(
        (insight): ReviewableItem => ({
          sourceType: 'INSIGHT',
          sourceId: insight.id,
          sourceTimestamp: insight.createdAt,
          category: insight.category,
          priority: insight.priority,
          reason: insight.ruleExplanation,
          evidenceCount: insight.evidence.length,
        }),
      ),
      ...data.looseReflections.map(
        (reflection): ReviewableItem => ({
          sourceType: 'REFLECTION',
          sourceId: reflection.id,
          sourceTimestamp: reflection.createdAt,
          category: reflection.category,
          priority: reflection.score,
          reason: reflection.reason,
          evidenceCount: reflection.sources.length,
        }),
      ),
      // Real Memory rows of type ACHIEVEMENT, classified as GOAL — the same "achievement/goal are
      // goal-relation types" precedent Reflection/Insight Foundation already establish (see
      // sprint-5b-progress.md) — so they land in the Achievements section via the same, unmodified
      // classifySection() rule, never a special-cased second taxonomy.
      ...data.achievementMemories.map(
        (memory): ReviewableItem => ({
          sourceType: 'MEMORY',
          sourceId: memory.id,
          sourceTimestamp: memory.createdAt,
          category: 'GOAL',
          priority: memory.importanceScore,
          reason: memory.summary,
          evidenceCount: 0,
        }),
      ),
      // Real, user-pinned journal entries — the pin is the user's own explicit importance signal,
      // the same "manual pin" precedent reflection-score.calculator.ts already floors a score at
      // 70 for; reused here verbatim rather than inventing a new constant.
      ...data.pinnedJournalEntries.map(
        (entry): ReviewableItem => ({
          sourceType: 'JOURNAL',
          sourceId: entry.id,
          sourceTimestamp: entry.createdAt,
          category: 'JOURNAL',
          priority: 70,
          reason: entry.title,
          evidenceCount: 0,
        }),
      ),
    ];

    const result = buildReview(window, items, statistics);

    const review = await this.prisma.review.upsert({
      where: { userId_dedupeKey: { userId, dedupeKey } },
      create: {
        userId,
        window: window as ReviewWindow,
        windowStart,
        windowEnd,
        state: result.state as ReviewState,
        overview: result.overview,
        statistics: result.statistics as unknown as Prisma.InputJsonValue,
        dedupeKey,
      },
      update: {
        state: result.state as ReviewState,
        overview: result.overview,
        statistics: result.statistics as unknown as Prisma.InputJsonValue,
      },
    });

    // Replace sections/evidence wholesale each pass — cheap (bounded item counts) and avoids
    // reconciling a diff, the same "recompute from scratch" precedent MemoryDuplicateService/
    // MemoryConflictService/InsightRelationshipService already use for their own compute-on-read
    // passes.
    await this.prisma.reviewSection.deleteMany({ where: { reviewId: review.id } });
    let order = 0;
    for (const section of result.sections) {
      const createdSection = await this.prisma.reviewSection.create({
        data: {
          reviewId: review.id,
          type: section.type as PrismaReviewSectionType,
          title: section.title,
          summary: section.summary,
          order: order++,
        },
      });
      if (section.items.length > 0) {
        await this.prisma.reviewEvidence.createMany({
          data: section.items.map((item) => ({
            reviewSectionId: createdSection.id,
            sourceType: item.sourceType as ReviewEvidenceSourceType,
            sourceId: item.sourceId,
            category: item.category,
            priority: item.priority,
            sourceTimestamp: item.sourceTimestamp,
            contribution: item.contribution,
          })),
        });
      }
    }

    this.logger.log(
      `Review generation: user window=${window} insights=${data.insights.length} looseReflections=${data.looseReflections.length} sections=${result.sections.length} state=${result.state} latencyMs=${Date.now() - startedAt}`,
    );

    return review.id;
  }
}
