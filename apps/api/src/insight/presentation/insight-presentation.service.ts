import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { InsightCategory, InsightStatus, Prisma, ReflectionSourceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightGenerationService } from '../generation/insight-generation.service';
import type { InsightPriorityTier } from './insight-presentation.types';
import type { InsightCard, InsightEvidenceCard, InsightTimelineGroupBy, InsightTimelineRange, InsightTimelineResult } from './insight-presentation.types';
import { renderEvidenceCard, renderEvidenceSourceItem, renderInsightCard, renderTimelineCard } from './insight-renderer';
import { dominantGroupKey, groupTimelineCards, type TimelineCardWithTopic } from './insight-timeline.util';
import { resolveTimelineRange } from './insight-timeline-range.util';

export interface CardsFilters {
  category?: InsightCategory;
  status?: InsightStatus;
  priorityTier?: InsightPriorityTier;
  source?: ReflectionSourceType;
  pinned?: boolean;
  from?: string;
  to?: string;
  sort?: 'priority' | 'recent';
  page?: number;
  pageSize?: number;
}

export interface CardsResult {
  items: InsightCard[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TimelineFilters {
  range?: InsightTimelineRange;
  from?: string;
  to?: string;
  groupBy?: InsightTimelineGroupBy;
  category?: InsightCategory;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const PRIORITY_TIER_RANGE: Record<InsightPriorityTier, { gte?: number; lt?: number }> = {
  LOW: { lt: 40 },
  MEDIUM: { gte: 40, lt: 70 },
  HIGH: { gte: 70 },
};

const COUNTS_INCLUDE = { _count: { select: { evidence: true, relationships: true } } } as const;

/**
 * Phase 2/3/4/5/6 read surface — the Insight Experience's own presentation service, layered on top
 * of Sprint 4C's `InsightGenerationService`/`InsightCandidate` rows (never a second generation
 * path). Every method calls `ensureGenerated()` first, same as `InsightRecordService`, so every
 * response reflects the caller's *current* materialized candidates.
 */
@Injectable()
export class InsightPresentationService {
  private readonly logger = new Logger('InsightPresentation');

  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: InsightGenerationService,
  ) {}

  async cards(userId: string, filters: CardsFilters): Promise<CardsResult> {
    await this.generation.ensureGenerated(userId);
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = this.whereFor(userId, filters);
    const orderBy: Prisma.InsightCandidateOrderByWithRelationInput[] =
      filters.sort === 'recent' ? [{ createdAt: 'desc' }, { id: 'asc' }] : [{ priority: 'desc' }, { id: 'asc' }];

    const [total, rows] = await Promise.all([
      this.prisma.insightCandidate.count({ where }),
      this.prisma.insightCandidate.findMany({
        where,
        include: COUNTS_INCLUDE,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = rows.map((row) => renderInsightCard({ ...row, evidenceCount: row._count.evidence, relationshipCount: row._count.relationships }));
    return { items, total, page, pageSize };
  }

  async timeline(userId: string, filters: TimelineFilters): Promise<InsightTimelineResult> {
    await this.generation.ensureGenerated(userId);
    const range = filters.range ?? 'week';
    const groupBy = filters.groupBy ?? 'category';
    const { from, to } = resolveTimelineRange(range, filters.from, filters.to);

    const where: Prisma.InsightCandidateWhereInput = {
      userId,
      createdAt: { gte: from, lte: to },
      ...(filters.category ? { category: filters.category } : {}),
    };

    const rows = await this.prisma.insightCandidate.findMany({
      where,
      include: {
        ...COUNTS_INCLUDE,
        evidence: { select: { reflectionCandidate: { select: { groupKey: true } } } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    const items: TimelineCardWithTopic[] = rows.map((row) => ({
      ...renderTimelineCard({ ...row, evidenceCount: row._count.evidence, relationshipCount: row._count.relationships }),
      topicKey: dominantGroupKey(row.evidence.map((e) => e.reflectionCandidate.groupKey)),
    }));

    return { range, from: from.toISOString(), to: to.toISOString(), groupBy, groups: groupTimelineCards(items, groupBy) };
  }

  /** Phase 3 — Evidence View. Resolves every `InsightEvidence` row down to its real cited
   * `ReflectionCandidate` and that reflection's own real `ReflectionSourceRef`s, verifying each
   * cited Memory/Journal record still exists (Phase 8 defense-in-depth — belt-and-suspenders on
   * top of `ReflectionValidityService`'s own guarantee that a currently-cited, non-EXPIRED
   * reflection can't already point at a deleted source). Never fabricates an evidence item. */
  async evidence(userId: string, insightId: string): Promise<InsightEvidenceCard[]> {
    await this.generation.ensureGenerated(userId);
    const candidate = await this.prisma.insightCandidate.findUnique({
      where: { id: insightId },
      include: { evidence: { include: { reflectionCandidate: { include: { sources: true } } } } },
    });
    if (!candidate || candidate.userId !== userId) {
      throw new NotFoundException({ code: 'INSIGHT_NOT_FOUND', message: 'That insight was not found.' });
    }

    const journalIds = new Set<string>();
    const memoryIds = new Set<string>();
    for (const e of candidate.evidence) {
      for (const s of e.reflectionCandidate.sources) {
        if (s.sourceType === 'JOURNAL') journalIds.add(s.sourceId);
        else if (s.sourceType === 'MEMORY') memoryIds.add(s.sourceId);
      }
    }

    const [journals, memories] = await Promise.all([
      journalIds.size > 0
        ? this.prisma.journalEntry.findMany({ where: { id: { in: [...journalIds] }, userId, state: { not: 'DELETED' } }, select: { id: true } })
        : Promise.resolve([]),
      memoryIds.size > 0 ? this.prisma.memory.findMany({ where: { id: { in: [...memoryIds] }, userId }, select: { id: true } }) : Promise.resolve([]),
    ]);
    const availableJournalIds = new Set(journals.map((j) => j.id));
    const availableMemoryIds = new Set(memories.map((m) => m.id));

    return candidate.evidence.map((e) =>
      renderEvidenceCard({
        reflectionCandidateId: e.reflectionCandidateId,
        reflectionCategory: e.reflectionCandidate.category,
        reflectionScore: e.reflectionCandidate.score,
        reflectionState: e.reflectionCandidate.state,
        contribution: e.contribution,
        sources: e.reflectionCandidate.sources.map((s) => {
          const available =
            s.sourceType === 'JOURNAL'
              ? availableJournalIds.has(s.sourceId)
              : s.sourceType === 'MEMORY'
                ? availableMemoryIds.has(s.sourceId)
                : true;
          return renderEvidenceSourceItem(s.sourceType, s.sourceId, s.sourceTimestamp, available);
        }),
      }),
    );
  }

  /** A single rendered `InsightCard` by id — the same renderer `cards()`/`timeline()` use, for
   * direct-link/refresh cases where the frontend doesn't already have the card in memory (it lists
   * a card, then opens its detail view by id). */
  async card(userId: string, id: string): Promise<InsightCard> {
    await this.generation.ensureGenerated(userId);
    const candidate = await this.prisma.insightCandidate.findUnique({ where: { id }, include: COUNTS_INCLUDE });
    if (!candidate || candidate.userId !== userId) {
      throw new NotFoundException({ code: 'INSIGHT_NOT_FOUND', message: 'That insight was not found.' });
    }
    return renderInsightCard({ ...candidate, evidenceCount: candidate._count.evidence, relationshipCount: candidate._count.relationships });
  }

  async setPinned(userId: string, id: string, pinned: boolean): Promise<InsightCard> {
    const candidate = await this.prisma.insightCandidate.findUnique({ where: { id }, include: COUNTS_INCLUDE });
    if (!candidate || candidate.userId !== userId) {
      throw new NotFoundException({ code: 'INSIGHT_NOT_FOUND', message: 'That insight was not found.' });
    }
    if (candidate.pinned === pinned) {
      return renderInsightCard({ ...candidate, evidenceCount: candidate._count.evidence, relationshipCount: candidate._count.relationships });
    }

    const updated = await this.prisma.insightCandidate.update({ where: { id }, data: { pinned }, include: COUNTS_INCLUDE });
    this.logger.log(`Insight ${pinned ? 'pinned' : 'unpinned'} id=${id}`);
    return renderInsightCard({ ...updated, evidenceCount: updated._count.evidence, relationshipCount: updated._count.relationships });
  }

  private whereFor(userId: string, filters: CardsFilters): Prisma.InsightCandidateWhereInput {
    return {
      userId,
      ...(filters.category ? { category: filters.category } : {}),
      status: filters.status ?? { not: 'ARCHIVED' as InsightStatus },
      ...(filters.priorityTier ? { priority: PRIORITY_TIER_RANGE[filters.priorityTier] } : {}),
      ...(filters.pinned !== undefined ? { pinned: filters.pinned } : {}),
      ...(filters.source ? { evidence: { some: { reflectionCandidate: { sources: { some: { sourceType: filters.source } } } } } } : {}),
      ...(filters.from || filters.to
        ? { createdAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) } }
        : {}),
    };
  }
}
