import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { NatalChartStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import { EntitlementService } from '../../payment/entitlement/entitlement.service';
import { GeocodingService } from '../../geocoding/geocoding.service';
import { NatalChartCalculatorService } from '../engine/natal-chart-calculator.service';
import { NatalChartInterpretationService } from '../interpretation/natal-chart-interpretation.service';
import { BirthInputValidationError, normalizeBirthDate, normalizeBirthTime } from '../engine/natal-chart-birth-input.util';
import { composeAngleMeaning, composeAspectMeaning, composePlacementMeaning } from '../engine/natal-chart-meanings';
import {
  NATAL_CHART_FREE_DAILY_CREATE_LIMIT,
  NATAL_CHART_FREE_HISTORY_LIMIT,
  NATAL_CHART_INTERPRETATION_MAX_ASPECTS,
  NATAL_CHART_PREMIUM_DAILY_CREATE_LIMIT,
} from '../engine/natal-chart-constants';
import {
  fromPrismaAspectType,
  fromPrismaPlanet,
  fromPrismaPoint,
  fromPrismaSign,
  toPrismaAspectType,
  toPrismaPoint,
  toPrismaSign,
} from '../natal-chart-enum.util';
import { toNatalChartDto, toNatalChartHistoryDto, type NatalChartDto, type NatalChartHistoryDto } from '../natal-chart.mappers';
import type { CreateNatalChartDto } from '../dto/create-natal-chart.dto';

export interface ListNatalChartsParams {
  status?: NatalChartStatus;
  page?: number;
  pageSize?: number;
}

export interface ListNatalChartsResult {
  items: NatalChartDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const INCLUDE = { placements: true, houses: true, aspects: true } as const;

/**
 * Phase 9 — chart persistence and lifecycle. `create()` is the one place a new `NatalChart` (and
 * its `NatalPlacement`/`NatalHouse`/`NatalAspect` rows) gets created: the deterministic engine
 * runs first and its output is persisted as-is, then interpretation is attempted as a best-effort
 * addition — a provider failure never invalidates the already-real calculated chart (mirrors
 * `NumerologyRecordService`'s own "calculate -> persist -> interpret" precedent exactly).
 */
@Injectable()
export class NatalChartRecordService {
  private readonly logger = new Logger('NatalChart');

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: NatalChartCalculatorService,
    private readonly geocoding: GeocodingService,
    private readonly interpretation: NatalChartInterpretationService,
    private readonly memoryRetrieval: MemoryRetrievalService,
    private readonly entitlementService: EntitlementService,
  ) {}

  async create(userId: string, dto: CreateNatalChartDto): Promise<NatalChartDto> {
    await this.assertWithinDailyLimit(userId);

    let birthDate;
    let birthTime;
    try {
      birthDate = normalizeBirthDate(dto.birthDate);
      birthTime = normalizeBirthTime(dto.birthTime ?? null);
    } catch (error) {
      if (error instanceof BirthInputValidationError) {
        throw new BadRequestException({ code: error.code, message: error.message });
      }
      throw error;
    }

    const location = await this.geocoding.resolve(dto.locationToken);
    if (!location) {
      throw new BadRequestException({
        code: 'NATAL_CHART_LOCATION_NOT_RESOLVED',
        message: 'That location search result has expired — please search again and pick a place.',
      });
    }

    const result = this.calculator.calculate({
      birthDate,
      birthTime,
      latitude: location.latitude,
      longitude: location.longitude,
      countryCode: location.countryCode,
    });

    const chart = await this.prisma.$transaction(async (tx) => {
      const created = await tx.natalChart.create({
        data: {
          userId,
          // Sprint 6/8 precedent (see tarot-record.service.ts / numerology-record.service.ts):
          // defaults to COMPANION_VISIBLE at the application layer, not the DB column's own
          // conservative PRIVATE default — every chart is meant to open a Companion conversation.
          visibility: 'COMPANION_VISIBLE',
          birthDate: new Date(`${birthDate.iso}T00:00:00.000Z`),
          birthTime: birthTime?.iso ?? null,
          birthTimeKnown: birthTime !== null,
          birthPlaceLabel: location.label,
          latitude: location.latitude,
          longitude: location.longitude,
          timezone: result.timezone,
          zodiacMode: result.zodiacMode,
          houseSystem: result.houseSystem,
          housesAvailable: result.housesAvailable,
          calculationVersion: result.calculationVersion,
          engineVersion: result.engineVersion,
          ascendantLongitude: result.ascendant?.longitude ?? null,
          ascendantSign: result.ascendant ? toPrismaSign(result.ascendant.sign) : null,
          ascendantDegreeInSign: result.ascendant?.degreeInSign ?? null,
          midheavenLongitude: result.midheaven?.longitude ?? null,
          midheavenSign: result.midheaven ? toPrismaSign(result.midheaven.sign) : null,
          midheavenDegreeInSign: result.midheaven?.degreeInSign ?? null,
        },
      });

      await tx.natalPlacement.createMany({
        data: result.placements.map((p, index) => ({
          chartId: created.id,
          body: toPrismaPoint(p.body),
          longitude: p.longitude,
          sign: toPrismaSign(p.sign),
          degreeInSign: p.degreeInSign,
          house: p.house,
          retrograde: p.retrograde,
          order: index,
        })),
      });

      if (result.houses.length > 0) {
        await tx.natalHouse.createMany({
          data: result.houses.map((h) => ({ chartId: created.id, number: h.number, cuspLongitude: h.cuspLongitude, sign: toPrismaSign(h.sign) })),
        });
      }

      if (result.aspects.length > 0) {
        await tx.natalAspect.createMany({
          data: result.aspects.map((a) => ({
            chartId: created.id,
            pointA: toPrismaPoint(a.pointA),
            pointB: toPrismaPoint(a.pointB),
            type: toPrismaAspectType(a.type),
            orb: a.orb,
            angle: a.angle,
          })),
        });
      }

      await tx.natalChartHistory.create({ data: { chartId: created.id, action: 'CREATED', detail: 'Natal chart calculated.' } });

      return created;
    });

    this.logger.log(`Natal chart calculated id=${chart.id}`);

    await this.generateInterpretation(userId, chart.id);

    return this.getOne(userId, chart.id);
  }

  /** Best-effort — never throws; a provider failure leaves `interpretation: null`, retryable via
   * `POST /natal-charts/:id/interpret` (mirrors `NumerologyRecordService.generateInterpretation`). */
  private async generateInterpretation(userId: string, chartId: string): Promise<void> {
    try {
      const full = await this.prisma.natalChart.findUniqueOrThrow({ where: { id: chartId }, include: INCLUDE });
      const isPremium = await this.entitlementService.hasPremiumAccess(userId);

      let memoryReference: { title: string; summary: string } | null = null;
      if (isPremium) {
        try {
          const recommended = await this.memoryRetrieval.recommend(userId, { limit: 1 });
          const top = recommended.items[0];
          if (top) memoryReference = { title: top.title, summary: top.summary };
        } catch {
          // Memory retrieval failing never blocks a Natal Chart.
        }
      }

      const placements = full.placements.map((p) => {
        const body = fromPrismaPlanet(p.body);
        const sign = fromPrismaSign(p.sign);
        return { body, sign, house: p.house, retrograde: p.retrograde, meaning: composePlacementMeaning(body, sign, p.house) };
      });

      const keyAspects = [...full.aspects]
        .sort((a, b) => a.orb - b.orb)
        .slice(0, NATAL_CHART_INTERPRETATION_MAX_ASPECTS)
        .map((a) => {
          const pointA = fromPrismaPoint(a.pointA);
          const pointB = fromPrismaPoint(a.pointB);
          const type = fromPrismaAspectType(a.type);
          return { pointA, pointB, type, orb: a.orb, meaning: composeAspectMeaning(pointA, pointB, type) };
        });

      const interpretation = await this.interpretation.interpret({
        placements,
        housesAvailable: full.housesAvailable,
        ascendant: full.ascendantSign ? { sign: fromPrismaSign(full.ascendantSign), meaning: composeAngleMeaning('ascendant', fromPrismaSign(full.ascendantSign)) } : null,
        midheaven: full.midheavenSign ? { sign: fromPrismaSign(full.midheavenSign), meaning: composeAngleMeaning('midheaven', fromPrismaSign(full.midheavenSign)) } : null,
        keyAspects,
        birthPlaceLabel: full.birthPlaceLabel,
        tier: isPremium ? 'PREMIUM' : 'FREE',
        memoryReference,
      });

      if (interpretation) {
        await this.prisma.natalChart.update({
          where: { id: chartId },
          data: { interpretation: interpretation as unknown as Prisma.InputJsonValue, interpretedAt: new Date() },
        });
        await this.prisma.natalChartHistory.create({ data: { chartId, action: 'INTERPRETED', detail: 'AI interpretation generated.' } });
      }
    } catch (error) {
      this.logger.warn(`Natal Chart interpretation generation failed for chart=${chartId}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async retryInterpretation(userId: string, id: string): Promise<NatalChartDto> {
    await this.findOwned(userId, id);
    await this.generateInterpretation(userId, id);
    return this.getOne(userId, id);
  }

  async list(userId: string, params: ListNatalChartsParams): Promise<ListNatalChartsResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    if (!isPremium && skip >= NATAL_CHART_FREE_HISTORY_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `Free accounts can browse their most recent ${NATAL_CHART_FREE_HISTORY_LIMIT} charts. Upgrade to Premium for unlimited history.`,
      });
    }
    const take = isPremium ? pageSize : Math.min(pageSize, NATAL_CHART_FREE_HISTORY_LIMIT - skip);

    const where: Prisma.NatalChartWhereInput = { userId, status: params.status ?? { not: 'DELETED' } };

    const [totalRaw, rows] = await Promise.all([
      this.prisma.natalChart.count({ where }),
      this.prisma.natalChart.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    const total = isPremium ? totalRaw : Math.min(totalRaw, NATAL_CHART_FREE_HISTORY_LIMIT);

    return { items: rows.map(toNatalChartDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<NatalChartDto> {
    const chart = await this.findOwned(userId, id);
    await this.prisma.natalChartHistory.create({ data: { chartId: id, action: 'VIEWED', detail: 'Chart viewed.' } });
    return toNatalChartDto(chart);
  }

  async history(userId: string, id: string): Promise<NatalChartHistoryDto[]> {
    await this.findOwned(userId, id);
    const rows = await this.prisma.natalChartHistory.findMany({ where: { chartId: id }, orderBy: { createdAt: 'desc' } });
    return rows.map(toNatalChartHistoryDto);
  }

  async archive(userId: string, id: string): Promise<NatalChartDto> {
    const chart = await this.findOwned(userId, id);
    if (chart.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'NATAL_CHART_INVALID_TRANSITION', message: `Cannot archive a chart with status ${chart.status}.` });
    }
    await this.prisma.natalChart.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    await this.prisma.natalChartHistory.create({ data: { chartId: id, action: 'ARCHIVED', detail: 'Chart archived.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async restore(userId: string, id: string): Promise<NatalChartDto> {
    const chart = await this.findOwned(userId, id);
    if (chart.status === 'ACTIVE') {
      throw new BadRequestException({ code: 'NATAL_CHART_INVALID_TRANSITION', message: 'That chart is already active.' });
    }
    await this.prisma.natalChart.update({ where: { id }, data: { status: 'ACTIVE', archivedAt: null, deletedAt: null } });
    await this.prisma.natalChartHistory.create({ data: { chartId: id, action: 'RESTORED', detail: 'Chart restored.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async remove(userId: string, id: string): Promise<NatalChartDto> {
    const chart = await this.findOwned(userId, id);
    if (chart.status === 'DELETED') {
      throw new BadRequestException({ code: 'NATAL_CHART_INVALID_TRANSITION', message: 'That chart is already deleted.' });
    }
    await this.prisma.natalChart.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
    await this.prisma.natalChartHistory.create({ data: { chartId: id, action: 'DELETED', detail: 'Chart deleted.' } });
    return this.getOneWithoutViewTracking(id);
  }

  private async getOneWithoutViewTracking(id: string): Promise<NatalChartDto> {
    const chart = await this.prisma.natalChart.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    return toNatalChartDto(chart);
  }

  /** Sprint 9, mirrors Numerology's own Phase 16 precedent (`assertWithinDailyLimit`) —
   * deliberately status-agnostic counting: "already created N charts today" is a fact about how
   * many calculate events happened, not about charts' current lifecycle status — excluding
   * DELETED here would let a user delete-then-recalculate past the daily ceiling (the exact
   * security-review finding Tarot's own precedent fixed). */
  private async assertWithinDailyLimit(userId: string): Promise<void> {
    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    const limit = isPremium ? NATAL_CHART_PREMIUM_DAILY_CREATE_LIMIT : NATAL_CHART_FREE_DAILY_CREATE_LIMIT;

    const startOfDayUtc = getStartOfUtcDay();
    const count = await this.prisma.natalChart.count({ where: { userId, createdAt: { gte: startOfDayUtc } } });
    if (count < limit) return;

    if (!isPremium && count < NATAL_CHART_PREMIUM_DAILY_CREATE_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `You've reached today's free chart creation limit (${NATAL_CHART_FREE_DAILY_CREATE_LIMIT}). Upgrade to Premium for a higher daily allowance.`,
      });
    }
    throw new BadRequestException({
      code: 'NATAL_CHART_DAILY_LIMIT_REACHED',
      message: `You've reached today's chart creation limit (${limit}). Come back tomorrow.`,
    });
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else". */
  private async findOwned(userId: string, id: string) {
    const chart = await this.prisma.natalChart.findUnique({ where: { id }, include: INCLUDE });
    if (!chart || chart.userId !== userId) {
      throw new NotFoundException({ code: 'NATAL_CHART_NOT_FOUND', message: 'That chart was not found.' });
    }
    return chart;
  }
}

function getStartOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
