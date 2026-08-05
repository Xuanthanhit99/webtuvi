import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  ReflectionCandidate,
  ReflectionCategory,
  ReflectionSourceRef,
  ReflectionState,
  ReflectionTrigger,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReflectionGenerationService } from '../generation/reflection-generation.service';
import { ReflectionValidityService } from '../validity/reflection-validity.service';
import { toReflectionCandidateDto, type ReflectionCandidateDto } from '../reflection.mappers';

export interface ListReflectionsParams {
  category?: ReflectionCategory;
  trigger?: ReflectionTrigger;
  state?: ReflectionState;
  sort?: 'score' | 'recency' | 'category';
  page?: number;
  pageSize?: number;
}

export interface ListReflectionsResult {
  items: ReflectionCandidateDto[];
  total: number;
  page: number;
  pageSize: number;
}

export type TimelineBucket = 'today' | 'this_week' | 'last_week' | 'last_month' | 'earlier';

export interface TimelineItemDto extends ReflectionCandidateDto {
  bucket: TimelineBucket;
}

export interface TimelineParams {
  from?: Date;
  to?: Date;
  sort?: 'score' | 'recency' | 'category';
  category?: ReflectionCategory;
}

export interface TimelineResult {
  items: TimelineItemDto[];
}

export interface ReflectionGroupDto {
  groupKey: string;
  category: ReflectionCategory;
  trigger: ReflectionTrigger;
  count: number;
  averageScore: number;
  topScore: number;
  latest: ReflectionCandidateDto;
}

export interface ReflectionStatisticsDto {
  total: number;
  byState: Record<ReflectionState, number>;
  byCategory: Partial<Record<ReflectionCategory, number>>;
  byTrigger: Partial<Record<ReflectionTrigger, number>>;
  dismissalRate: number;
  archiveRate: number;
}

type CandidateWithSources = ReflectionCandidate & { sources: ReflectionSourceRef[] };

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DEFAULT_FEED_LIMIT = 20;
const MAX_FEED_LIMIT = 50;

/**
 * Reflection CRUD/lifecycle/read surfaces (Phases 6-8). Every method re-generates
 * (`ReflectionGenerationService.ensureGenerated`) and revalidates
 * (`ReflectionValidityService.revalidateForUser`) before reading, so every response reflects the
 * user's *current* data — a Reflection Candidate is never a stale snapshot. Ownership is enforced
 * the same way Memory/Journal do: `findOwned()` returns an identical 404 for "doesn't exist" and
 * "belongs to someone else."
 */
@Injectable()
export class ReflectionRecordService {
  private readonly logger = new Logger('Reflection');

  constructor(
    private readonly prisma: PrismaService,
    private readonly generation: ReflectionGenerationService,
    private readonly validity: ReflectionValidityService,
  ) {}

  private async ensureFresh(userId: string): Promise<void> {
    await this.generation.ensureGenerated(userId);
    await this.validity.revalidateForUser(userId);
  }

  async list(userId: string, params: ListReflectionsParams): Promise<ListReflectionsResult> {
    await this.ensureFresh(userId);
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

    const where = {
      userId,
      ...(params.category ? { category: params.category } : {}),
      ...(params.trigger ? { trigger: params.trigger } : {}),
      state: params.state ?? { notIn: ['EXPIRED'] as ReflectionState[] },
    };

    const [total, rows] = await Promise.all([
      this.prisma.reflectionCandidate.count({ where }),
      this.prisma.reflectionCandidate.findMany({
        where,
        include: { sources: true },
        orderBy: orderByFor(params.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: rows.map(toReflectionCandidateDto), total, page, pageSize };
  }

  /** Phase 7 — only real, currently-active candidates: `READY`, never dismissed/archived/expired. */
  async feed(userId: string, limit?: number): Promise<ReflectionCandidateDto[]> {
    await this.ensureFresh(userId);
    const take = Math.min(MAX_FEED_LIMIT, Math.max(1, limit ?? DEFAULT_FEED_LIMIT));

    const rows = await this.prisma.reflectionCandidate.findMany({
      where: { userId, state: 'READY' },
      include: { sources: true },
      orderBy: [{ score: 'desc' }, { windowEnd: 'desc' }, { id: 'asc' }],
      take,
    });

    return rows.map(toReflectionCandidateDto);
  }

  async getOne(userId: string, id: string): Promise<ReflectionCandidateDto> {
    await this.ensureFresh(userId);
    const candidate = await this.findOwned(userId, id);
    return toReflectionCandidateDto(candidate);
  }

  async timeline(userId: string, params: TimelineParams): Promise<TimelineResult> {
    await this.ensureFresh(userId);

    const where = {
      userId,
      state: { notIn: ['EXPIRED'] as ReflectionState[] },
      ...(params.category ? { category: params.category } : {}),
      ...(params.from || params.to
        ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    };

    const rows = await this.prisma.reflectionCandidate.findMany({
      where,
      include: { sources: true },
      orderBy: orderByFor(params.sort),
    });

    return { items: rows.map((row) => ({ ...toReflectionCandidateDto(row), bucket: bucketFor(row.createdAt) })) };
  }

  /** Phase 4 — deterministic grouping only, no semantic clustering. Aggregates active
   * (NEW/READY) candidates by their already-computed `groupKey`. */
  async groups(userId: string): Promise<ReflectionGroupDto[]> {
    await this.ensureFresh(userId);

    const rows = await this.prisma.reflectionCandidate.findMany({
      where: { userId, state: { in: ['NEW', 'READY'] } },
      include: { sources: true },
      orderBy: { score: 'desc' },
    });

    const byGroup = new Map<string, CandidateWithSources[]>();
    for (const row of rows) {
      const list = byGroup.get(row.groupKey) ?? [];
      list.push(row);
      byGroup.set(row.groupKey, list);
    }

    return [...byGroup.entries()]
      .map(([groupKey, items]): ReflectionGroupDto => {
        const latest = items.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
        const scores = items.map((i) => i.score);
        return {
          groupKey,
          category: latest.category,
          trigger: latest.trigger,
          count: items.length,
          averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          topScore: Math.max(...scores),
          latest: toReflectionCandidateDto(latest),
        };
      })
      .sort((a, b) => b.topScore - a.topScore);
  }

  async statistics(userId: string): Promise<ReflectionStatisticsDto> {
    await this.ensureFresh(userId);

    const rows = await this.prisma.reflectionCandidate.findMany({ where: { userId } });

    const byState: Record<ReflectionState, number> = { NEW: 0, READY: 0, DISMISSED: 0, ARCHIVED: 0, EXPIRED: 0 };
    const byCategory: Partial<Record<ReflectionCategory, number>> = {};
    const byTrigger: Partial<Record<ReflectionTrigger, number>> = {};

    for (const row of rows) {
      byState[row.state] += 1;
      byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;
      byTrigger[row.trigger] = (byTrigger[row.trigger] ?? 0) + 1;
    }

    const total = rows.length;
    return {
      total,
      byState,
      byCategory,
      byTrigger,
      dismissalRate: total === 0 ? 0 : Math.round((byState.DISMISSED / total) * 100) / 100,
      archiveRate: total === 0 ? 0 : Math.round((byState.ARCHIVED / total) * 100) / 100,
    };
  }

  async archive(userId: string, id: string): Promise<ReflectionCandidateDto> {
    const candidate = await this.findOwned(userId, id);
    if (candidate.state === 'ARCHIVED') return toReflectionCandidateDto(candidate);

    const updated = await this.prisma.reflectionCandidate.update({
      where: { id },
      data: { state: 'ARCHIVED', resolvedAt: new Date() },
      include: { sources: true },
    });
    this.logger.log(`Reflection archived id=${id}`);
    return toReflectionCandidateDto(updated);
  }

  async dismiss(userId: string, id: string): Promise<ReflectionCandidateDto> {
    const candidate = await this.findOwned(userId, id);
    if (candidate.state === 'DISMISSED') return toReflectionCandidateDto(candidate);

    const updated = await this.prisma.reflectionCandidate.update({
      where: { id },
      data: { state: 'DISMISSED', resolvedAt: new Date() },
      include: { sources: true },
    });
    this.logger.log(`Reflection dismissed id=${id}`);
    return toReflectionCandidateDto(updated);
  }

  private async findOwned(userId: string, id: string): Promise<CandidateWithSources> {
    const candidate = await this.prisma.reflectionCandidate.findUnique({ where: { id }, include: { sources: true } });
    if (!candidate || candidate.userId !== userId) {
      throw new NotFoundException({ code: 'REFLECTION_NOT_FOUND', message: 'That reflection was not found.' });
    }
    return candidate;
  }
}

function orderByFor(sort?: 'score' | 'recency' | 'category') {
  switch (sort) {
    case 'score':
      return [{ score: 'desc' as const }, { id: 'asc' as const }];
    case 'category':
      return [{ category: 'asc' as const }, { score: 'desc' as const }];
    case 'recency':
    default:
      return [{ createdAt: 'desc' as const }, { id: 'asc' as const }];
  }
}

function bucketFor(date: Date): TimelineBucket {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) return 'today';

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  if (date >= startOfWeek) return 'this_week';

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  if (date >= startOfLastWeek) return 'last_week';

  const startOfLastMonth = new Date(startOfToday);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  if (date >= startOfLastMonth) return 'last_month';

  return 'earlier';
}
