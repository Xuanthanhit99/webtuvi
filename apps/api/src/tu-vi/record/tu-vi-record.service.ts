import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, TuViChartStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementService } from '../../payment/entitlement/entitlement.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { GenerationLockService } from '../../companion/concurrency/generation-lock.service';
import { TuViBirthInputValidationError } from '../engine/tu-vi-canonical-input';
import { Core13InputError } from '../engine/tu-vi-core13';
import { validateTuViChart } from '../engine/tu-vi-chart';
import { TuViInterpretationService } from '../interpretation/tu-vi-interpretation.service';
import { buildTuViChart, toCreateData, toTuViChartDto, toTuViChartHistoryDto, type TuViChartDto, type TuViChartHistoryDto } from '../tu-vi.mappers';
import type { CalculateTuViChartDto } from '../dto/calculate-tu-vi-chart.dto';

export interface ListTuViChartsParams {
  status?: TuViChartStatus;
  page?: number;
  pageSize?: number;
}

export interface ListTuViChartsResult {
  items: TuViChartDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Free users can browse only their most recent 20 charts — mirrors Eastern Horoscope's own
 * FREE_HISTORY_LIMIT precedent exactly. */
const FREE_HISTORY_LIMIT = 20;

// Anti-abuse/cost-control only, NOT a content gate — mirrors Eastern Horoscope's own daily-ceiling
// precedent exactly: the deterministic calculation is never hidden behind this for a user acting
// normally, this only bounds against automated "try every birth date" abuse.
const FREE_DAILY_CALCULATION_LIMIT = 5;
const PREMIUM_DAILY_CALCULATION_LIMIT = 15;

/**
 * Sprint 18B.9/18B.10 — chart persistence, lifecycle, and AI interpretation. `calculate()` is the
 * one place a new `TuViChart` row gets created: the deterministic engine runs first, its output
 * passes the full invariant suite (`validateTuViChart`), and is persisted as-is — mirrors
 * `EasternHoroscopeRecordService`'s own "calculate -> validate -> persist -> interpret" precedent
 * exactly. Interpretation is additive and best-effort: a provider failure never invalidates or
 * blocks the already-real, already-persisted deterministic chart.
 */
@Injectable()
export class TuViRecordService {
  private readonly logger = new Logger('TuVi');

  constructor(
    private readonly prisma: PrismaService,
    private readonly interpretation: TuViInterpretationService,
    private readonly memoryRetrieval: MemoryRetrievalService,
    private readonly entitlementService: EntitlementService,
    private readonly costControl: CostControlService,
    private readonly generationLock: GenerationLockService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async calculate(userId: string, dto: CalculateTuViChartDto): Promise<TuViChartDto> {
    await this.assertWithinDailyLimit(userId);

    let chart: ReturnType<typeof buildTuViChart>;
    try {
      chart = buildTuViChart({ birthDate: dto.birthDate, birthTime: dto.birthTime, sex: dto.sex });
    } catch (error) {
      if (error instanceof TuViBirthInputValidationError || error instanceof Core13InputError) {
        throw new BadRequestException({ code: error.code, message: error.message });
      }
      throw error;
    }

    // Defense in depth: the engine's own invariant suite must pass before anything is persisted.
    // A violation here indicates a defect in the engine itself, never a possible valid outcome.
    validateTuViChart(chart);

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.tuViChart.create({ data: { userId, ...toCreateData(chart) } });
      await tx.tuViChartHistory.create({ data: { chartId: row.id, action: 'CREATED', detail: 'Tử Vi chart calculated.' } });
      return row;
    });

    this.logger.log(`Tử Vi chart calculated id=${created.id}`);
    void this.analyticsService.trackServerEvent({ event: 'tu_vi_completed', userId, properties: { feature: 'tu_vi' } });

    await this.generateInterpretation(userId, created.id);

    return this.getOne(userId, created.id);
  }

  /** Best-effort — never throws; a provider failure, an exhausted AI budget, or a concurrent
   * generation already in flight all leave `interpretation: null`, retryable via
   * `POST /tu-vi/charts/:id/interpret` (mirrors `EasternHoroscopeRecordService.generateInterpretation`
   * exactly). A Tử Vi chart is permanent — unlike Eastern Horoscope's annual Year Energy, there is
   * no "stale, needs a new year's interpretation" concept; this only ever generates ONCE per chart
   * unless the first attempt failed. */
  private async generateInterpretation(userId: string, chartId: string): Promise<void> {
    const budget = await this.costControl.checkBudget(userId);
    if (!budget.allowed) {
      this.logger.warn(`Tử Vi interpretation skipped for chart=${chartId}: ${budget.reason}`);
      return;
    }

    const acquired = await this.generationLock.tryAcquireDiscovery('tu_vi', userId, chartId);
    if (!acquired) {
      this.logger.warn(`Tử Vi interpretation skipped for chart=${chartId}: concurrent generation already in flight`);
      return;
    }

    try {
      const full = await this.prisma.tuViChart.findUniqueOrThrow({ where: { id: chartId } });
      if (full.interpretation) return; // already generated — retry is for failures only

      const isPremium = await this.entitlementService.hasPremiumAccess(userId);

      let memoryReference: { title: string; summary: string } | null = null;
      if (isPremium) {
        try {
          const recommended = await this.memoryRetrieval.recommend(userId, { limit: 1 });
          const top = recommended.items[0];
          if (top) memoryReference = { title: top.title, summary: top.summary };
        } catch {
          // Memory retrieval failing never blocks a Tử Vi chart.
        }
      }

      const dto = toTuViChartDto(full);
      const interpretation = await this.interpretation.interpret(
        {
          sex: dto.sex,
          cuc: dto.cuc,
          menhPosition: dto.palaces.menh,
          thanPosition: dto.palaces.than,
          yearStem: dto.canChi.year.stem,
          yearBranch: dto.canChi.year.branch,
          mainStars: dto.mainStars,
          auxiliaryStars: dto.auxiliaryStars,
          tuan: dto.tuan,
          triet: dto.triet,
          transformations: dto.transformations,
          tier: isPremium ? 'PREMIUM' : 'FREE',
          memoryReference,
        },
        { userId, sourceId: chartId },
      );

      if (interpretation) {
        await this.prisma.tuViChart.update({ where: { id: chartId }, data: { interpretation, interpretedAt: new Date() } });
        await this.prisma.tuViChartHistory.create({ data: { chartId, action: 'INTERPRETED', detail: 'AI interpretation generated.' } });
        // Deliberately no separate interpretation-completed analytics event — mirrors Eastern
        // Horoscope's own audit-backed precedent (§31): `tu_vi_completed` already answers this
        // funnel question; a third event would duplicate coverage without new value.
      }
    } catch (error) {
      this.logger.warn(`Tử Vi interpretation generation failed for chart=${chartId}: ${error instanceof Error ? error.message : 'unknown'}`);
    } finally {
      await this.generationLock.releaseDiscovery('tu_vi', userId, chartId);
    }
  }

  async retryInterpretation(userId: string, id: string): Promise<TuViChartDto> {
    await this.findOwned(userId, id);
    await this.generateInterpretation(userId, id);
    return this.getOne(userId, id);
  }

  async list(userId: string, params: ListTuViChartsParams): Promise<ListTuViChartsResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    if (!isPremium && skip >= FREE_HISTORY_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `Free accounts can browse their most recent ${FREE_HISTORY_LIMIT} charts. Upgrade to Premium for unlimited history.`,
      });
    }
    const take = isPremium ? pageSize : Math.min(pageSize, FREE_HISTORY_LIMIT - skip);

    const where: Prisma.TuViChartWhereInput = { userId, status: params.status ?? { not: 'DELETED' } };

    const [totalRaw, rows] = await Promise.all([
      this.prisma.tuViChart.count({ where }),
      this.prisma.tuViChart.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    const total = isPremium ? totalRaw : Math.min(totalRaw, FREE_HISTORY_LIMIT);

    return { items: rows.map((row) => toTuViChartDto(row)), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<TuViChartDto> {
    const chart = await this.findOwned(userId, id);
    await this.prisma.tuViChartHistory.create({ data: { chartId: id, action: 'VIEWED', detail: 'Chart viewed.' } });
    return toTuViChartDto(chart);
  }

  async history(userId: string, id: string): Promise<TuViChartHistoryDto[]> {
    await this.findOwned(userId, id);
    const rows = await this.prisma.tuViChartHistory.findMany({ where: { chartId: id }, orderBy: { createdAt: 'desc' } });
    return rows.map(toTuViChartHistoryDto);
  }

  async archive(userId: string, id: string): Promise<TuViChartDto> {
    const chart = await this.findOwned(userId, id);
    if (chart.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'TU_VI_CHART_INVALID_TRANSITION', message: `Cannot archive a chart with status ${chart.status}.` });
    }
    await this.prisma.tuViChart.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    await this.prisma.tuViChartHistory.create({ data: { chartId: id, action: 'ARCHIVED', detail: 'Chart archived.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async restore(userId: string, id: string): Promise<TuViChartDto> {
    const chart = await this.findOwned(userId, id);
    if (chart.status === 'ACTIVE') {
      throw new BadRequestException({ code: 'TU_VI_CHART_INVALID_TRANSITION', message: 'That chart is already active.' });
    }
    await this.prisma.tuViChart.update({ where: { id }, data: { status: 'ACTIVE', archivedAt: null, deletedAt: null } });
    await this.prisma.tuViChartHistory.create({ data: { chartId: id, action: 'RESTORED', detail: 'Chart restored.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async remove(userId: string, id: string): Promise<TuViChartDto> {
    const chart = await this.findOwned(userId, id);
    if (chart.status === 'DELETED') {
      throw new BadRequestException({ code: 'TU_VI_CHART_INVALID_TRANSITION', message: 'That chart is already deleted.' });
    }
    await this.prisma.tuViChart.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
    await this.prisma.tuViChartHistory.create({ data: { chartId: id, action: 'DELETED', detail: 'Chart deleted.' } });
    return this.getOneWithoutViewTracking(id);
  }

  private async getOneWithoutViewTracking(id: string): Promise<TuViChartDto> {
    const chart = await this.prisma.tuViChart.findUniqueOrThrow({ where: { id } });
    return toTuViChartDto(chart);
  }

  private async assertWithinDailyLimit(userId: string): Promise<void> {
    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    const limit = isPremium ? PREMIUM_DAILY_CALCULATION_LIMIT : FREE_DAILY_CALCULATION_LIMIT;

    const startOfDayUtc = getStartOfUtcDay();
    const count = await this.prisma.tuViChart.count({ where: { userId, createdAt: { gte: startOfDayUtc } } });
    if (count < limit) return;

    if (!isPremium && count < PREMIUM_DAILY_CALCULATION_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `You've reached today's free calculation limit (${FREE_DAILY_CALCULATION_LIMIT}). Upgrade to Premium for a higher daily allowance.`,
      });
    }
    throw new BadRequestException({
      code: 'TU_VI_DAILY_LIMIT_REACHED',
      message: `You've reached today's calculation limit (${limit}). Come back tomorrow.`,
    });
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else"
   * (mirrors EasternHoroscopeRecordService.findOwned exactly). */
  private async findOwned(userId: string, id: string) {
    const chart = await this.prisma.tuViChart.findUnique({ where: { id } });
    if (!chart || chart.userId !== userId) {
      throw new NotFoundException({ code: 'TU_VI_CHART_NOT_FOUND', message: 'That chart was not found.' });
    }
    return chart;
  }
}

function getStartOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
