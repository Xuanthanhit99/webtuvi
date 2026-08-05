import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { InsightCategory, InsightStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightGenerationService } from '../generation/insight-generation.service';
import { toInsightCandidateDto, type InsightCandidateDto } from '../insight.mappers';

export interface ListInsightsParams {
  category?: InsightCategory;
  status?: InsightStatus;
  page?: number;
  pageSize?: number;
}

export interface ListInsightsResult {
  items: InsightCandidateDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InsightStatisticsDto {
  total: number;
  byStatus: Record<InsightStatus, number>;
  byCategory: Partial<Record<InsightCategory, number>>;
  averagePriority: number;
  readyCount: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const INCLUDE = { evidence: { include: { reflectionCandidate: true } }, relationships: true } as const;

/**
 * Insight Preparation's read/lifecycle surface (Phase 6). Every method re-generates
 * (`InsightGenerationService.ensureGenerated`) before reading, so every response reflects the
 * user's *current* Reflection Candidates — an Insight Candidate is never a stale snapshot.
 * Ownership is enforced the same way Reflection/Memory/Journal do: `findOwned()` returns an
 * identical 404 for "doesn't exist" and "belongs to someone else."
 */
@Injectable()
export class InsightRecordService {
  private readonly logger = new Logger('Insight');

  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: InsightGenerationService,
  ) {}

  async list(userId: string, params: ListInsightsParams): Promise<ListInsightsResult> {
    await this.generation.ensureGenerated(userId);
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = {
      userId,
      ...(params.category ? { category: params.category } : {}),
      // Matches Memory/Journal/Reflection's own default-list behavior: excluded from the default
      // (unfiltered) view once resolved; an explicit `status=ARCHIVED` is the only way to see it.
      status: params.status ?? { not: 'ARCHIVED' as InsightStatus },
    };

    const [total, rows] = await Promise.all([
      this.prisma.insightCandidate.count({ where }),
      this.prisma.insightCandidate.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ priority: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: rows.map(toInsightCandidateDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<InsightCandidateDto> {
    await this.generation.ensureGenerated(userId);
    const candidate = await this.findOwned(userId, id);
    return toInsightCandidateDto(candidate);
  }

  async statistics(userId: string): Promise<InsightStatisticsDto> {
    await this.generation.ensureGenerated(userId);
    const rows = await this.prisma.insightCandidate.findMany({ where: { userId } });

    const byStatus: Record<InsightStatus, number> = { NOT_READY: 0, READY: 0, INSUFFICIENT_EVIDENCE: 0, ARCHIVED: 0 };
    const byCategory: Partial<Record<InsightCategory, number>> = {};
    for (const row of rows) {
      byStatus[row.status] += 1;
      byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
    }

    const total = rows.length;
    const averagePriority = total === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.priority, 0) / total);

    return { total, byStatus, byCategory, averagePriority, readyCount: byStatus.READY };
  }

  async archive(userId: string, id: string): Promise<InsightCandidateDto> {
    const candidate = await this.findOwned(userId, id);
    if (candidate.status === 'ARCHIVED') return toInsightCandidateDto(candidate);

    const updated = await this.prisma.insightCandidate.update({
      where: { id },
      data: { status: 'ARCHIVED', resolvedAt: new Date() },
      include: INCLUDE,
    });
    this.logger.log(`Insight archived id=${id}`);
    return toInsightCandidateDto(updated);
  }

  private async findOwned(userId: string, id: string) {
    const candidate = await this.prisma.insightCandidate.findUnique({ where: { id }, include: INCLUDE });
    if (!candidate || candidate.userId !== userId) {
      throw new NotFoundException({ code: 'INSIGHT_NOT_FOUND', message: 'That insight was not found.' });
    }
    return candidate;
  }
}
