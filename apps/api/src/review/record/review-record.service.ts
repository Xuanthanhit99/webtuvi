import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Review, ReviewEvidence, ReviewSection, ReviewState, ReviewWindow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { priorityTierFor } from '../../insight/presentation/insight-renderer';
import type { InsightPriorityTier } from '../../insight/presentation/insight-presentation.types';
import { ReviewGenerationService } from '../generation/review-generation.service';
import { toReviewSummaryDto, type ReviewSummaryDto } from '../review.mappers';
import type { ReviewWindowKind } from '../review-window.util';

export interface ListReviewsParams {
  window?: ReviewWindow;
  state?: ReviewState;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReviewsResult {
  items: ReviewSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** Phase 6 evidence-level filters — applied within a single review's already-fetched sections/
 * evidence, never a second DB round-trip. `category` matches the real, persisted
 * `ReviewEvidence.category`; `priorityTier` reuses Insight Experience's own thresholds (via
 * `priorityTierFor`) over the persisted `ReviewEvidence.priority` — never a separately-invented
 * cutoff. A section that ends up with zero evidence after filtering is dropped, never shown empty. */
export interface ReviewDetailFilters {
  category?: string;
  priorityTier?: InsightPriorityTier;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type ReviewWithSections = Review & { sections: (ReviewSection & { evidence: ReviewEvidence[] })[] };

const INCLUDE = { sections: { include: { evidence: true } } } as const;

/**
 * Review's read/lifecycle surface (Phases 5/6/8) — mirrors `InsightRecordService`'s own shape.
 * Every method re-generates via `ReviewGenerationService.ensureGenerated()` first for the *current*
 * period's window (WEEK/MONTH); `getOne()`/`archive()` operate on an already-materialized row by id
 * and never regenerate it (an archived or historical custom review is a fixed record of a period
 * that has already passed, the same "resolved decisions aren't re-litigated" precedent Reflection/
 * Insight already establish).
 */
@Injectable()
export class ReviewRecordService {
  private readonly logger = new Logger('Review');

  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: ReviewGenerationService,
  ) {}

  async ensureCurrent(userId: string, window: ReviewWindowKind): Promise<ReviewSummaryDto> {
    const id = await this.generation.ensureGenerated(userId, window);
    return this.getOne(userId, id);
  }

  async ensureCustom(userId: string, from: string | undefined, to: string | undefined): Promise<ReviewSummaryDto> {
    const id = await this.generation.ensureGenerated(userId, 'CUSTOM', from, to);
    return this.getOne(userId, id);
  }

  async list(userId: string, params: ListReviewsParams): Promise<ListReviewsResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = {
      userId,
      ...(params.window ? { window: params.window } : {}),
      state: params.state ?? { not: 'ARCHIVED' as ReviewState },
      ...(params.from || params.to
        ? { windowStart: { ...(params.from ? { gte: new Date(params.from) } : {}), ...(params.to ? { lte: new Date(params.to) } : {}) } }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ windowStart: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: rows.map(toReviewSummaryDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string, filters: ReviewDetailFilters = {}): Promise<ReviewSummaryDto> {
    const review = await this.findOwned(userId, id);
    return toReviewSummaryDto(this.applyFilters(review, filters));
  }

  async archive(userId: string, id: string): Promise<ReviewSummaryDto> {
    const review = await this.findOwned(userId, id);
    if (review.state === 'ARCHIVED') return toReviewSummaryDto(review);

    const updated = await this.prisma.review.update({
      where: { id },
      data: { state: 'ARCHIVED', resolvedAt: new Date() },
      include: INCLUDE,
    });
    this.logger.log(`Review archived id=${id}`);
    return toReviewSummaryDto(updated);
  }

  /** Owner-scoped fetch used by both the presentation and export surfaces — 404s identically for
   * "doesn't exist" and "belongs to someone else", the same discipline every prior engine here
   * uses. */
  async findOwnedRaw(userId: string, id: string): Promise<ReviewWithSections> {
    return this.findOwned(userId, id);
  }

  private async findOwned(userId: string, id: string): Promise<ReviewWithSections> {
    const review = await this.prisma.review.findUnique({ where: { id }, include: INCLUDE });
    if (!review || review.userId !== userId) {
      throw new NotFoundException({ code: 'REVIEW_NOT_FOUND', message: 'That review was not found.' });
    }
    return review;
  }

  private applyFilters(review: ReviewWithSections, filters: ReviewDetailFilters): ReviewWithSections {
    if (!filters.category && !filters.priorityTier) return review;

    const sections = review.sections
      .map((section) => ({
        ...section,
        evidence: section.evidence.filter((evidence) => {
          if (filters.category && evidence.category !== filters.category) return false;
          if (filters.priorityTier && priorityTierFor(evidence.priority) !== filters.priorityTier) return false;
          return true;
        }),
      }))
      .filter((section) => section.evidence.length > 0);

    return { ...review, sections };
  }
}
