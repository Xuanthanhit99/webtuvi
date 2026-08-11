import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, NumerologyReadingStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import { EntitlementService } from '../../payment/entitlement/entitlement.service';
import { BirthDateValidationError } from '../engine/numerology-date.util';
import { calculateNumerology, NUMEROLOGY_ENGINE_VERSION, NUMEROLOGY_VALUE_TYPES, type NumerologyCalculationResult } from '../engine/numerology-engine';
import { NUMEROLOGY_NAME_NORMALIZATION_VERSION, NameValidationError } from '../engine/numerology-name.util';
import { NumerologyInterpretationService } from '../interpretation/numerology-interpretation.service';
import {
  toNumerologyReadingDto,
  toNumerologyReadingHistoryDto,
  type NumerologyReadingDto,
  type NumerologyReadingHistoryDto,
} from '../numerology.mappers';
import type { CalculateNumerologyDto } from '../dto/calculate-numerology.dto';

export interface ListReadingsParams {
  status?: NumerologyReadingStatus;
  page?: number;
  pageSize?: number;
}

export interface ListReadingsResult {
  items: NumerologyReadingDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const INCLUDE = { values: true } as const;

/** Free users can browse only their most recent 20 readings — mirrors Tarot's own
 * FREE_HISTORY_LIMIT exactly (see docs/architecture/premium-entitlements.md). */
const FREE_HISTORY_LIMIT = 20;

// Sprint 8, Phase 16/11 — anti-abuse/cost-control only, NOT a content gate: the Product Bible
// (Module 2 §8) is explicit that all Discovery-system content, including Numerology's core
// numbers, is free for every account. This daily ceiling exists purely to bound AI-interpretation
// cost and discourage automated "try every name variant" abuse (Module 15 §16's own acknowledged
// edge case) — the deterministic calculation and basic interpretation are never hidden behind it
// for a user acting normally. Premium's higher ceiling is real usage headroom, mirroring Tarot's
// own Free/Premium daily-limit shape, not a way to unlock otherwise-hidden content.
const FREE_DAILY_CALCULATION_LIMIT = 5;
const PREMIUM_DAILY_CALCULATION_LIMIT = 15;

const VALUE_ORDER: Record<string, number> = Object.fromEntries(NUMEROLOGY_VALUE_TYPES.map((type, index) => [type, index]));

/**
 * Phase 3/6 — reading persistence and lifecycle. `calculate()` is the one place a new
 * `NumerologyReading`/`NumerologyValue` set gets created: the deterministic engine runs first and
 * its output is persisted as-is, then interpretation is attempted as a best-effort addition — a
 * provider failure never invalidates or blocks the already-real calculated result (mirrors
 * `TarotRecordService`'s own "calculate -> persist -> interpret" precedent exactly).
 */
@Injectable()
export class NumerologyRecordService {
  private readonly logger = new Logger('Numerology');

  constructor(
    private readonly prisma: PrismaService,
    private readonly interpretation: NumerologyInterpretationService,
    private readonly memoryRetrieval: MemoryRetrievalService,
    private readonly entitlementService: EntitlementService,
  ) {}

  async calculate(userId: string, dto: CalculateNumerologyDto): Promise<NumerologyReadingDto> {
    await this.assertWithinDailyLimit(userId);

    let result: NumerologyCalculationResult;
    try {
      result = calculateNumerology({ fullBirthName: dto.fullBirthName, birthDate: dto.birthDate });
    } catch (error) {
      if (error instanceof BirthDateValidationError || error instanceof NameValidationError) {
        throw new BadRequestException({ code: error.code, message: error.message });
      }
      throw error;
    }

    const reading = await this.prisma.$transaction(async (tx) => {
      const created = await tx.numerologyReading.create({
        // Sprint 6/Tarot precedent (see tarot-record.service.ts): defaults to COMPANION_VISIBLE at
        // the application layer, not the DB column's own conservative PRIVATE default — Module 15
        // treats the Companion-chat bridge as every reading's intended next step ("every number
        // exists to open a Companion conversation", §1), not an opt-in extra.
        data: {
          userId,
          birthNameInput: dto.fullBirthName,
          normalizedBirthName: result.normalizedInput.birthName,
          birthDate: new Date(`${result.normalizedInput.birthDate}T00:00:00.000Z`),
          calculationVersion: NUMEROLOGY_ENGINE_VERSION,
          normalizationVersion: NUMEROLOGY_NAME_NORMALIZATION_VERSION,
          visibility: 'COMPANION_VISIBLE',
        },
      });

      await tx.numerologyValue.createMany({
        data: NUMEROLOGY_VALUE_TYPES.map((type) => {
          const entry = result.values[type];
          return {
            readingId: created.id,
            type,
            value: entry.value,
            isMasterNumber: entry.isMasterNumber,
            breakdown: entry.breakdown as unknown as Prisma.InputJsonValue,
            appliesToYear: type === 'PERSONAL_YEAR' ? result.personalYearAppliesTo : null,
            order: VALUE_ORDER[type]!,
          };
        }),
      });

      await tx.numerologyReadingHistory.create({
        data: { readingId: created.id, action: 'CREATED', detail: 'Numerology reading calculated.' },
      });

      return created;
    });

    this.logger.log(`Numerology reading calculated id=${reading.id}`);

    await this.generateInterpretation(userId, reading.id);

    return this.getOne(userId, reading.id);
  }

  /** Best-effort — never throws; a provider failure leaves `interpretation: null`, retryable via
   * `POST /numerology/readings/:id/interpret` (mirrors `TarotRecordService.generateInterpretation`). */
  private async generateInterpretation(userId: string, readingId: string): Promise<void> {
    try {
      const full = await this.prisma.numerologyReading.findUniqueOrThrow({ where: { id: readingId }, include: INCLUDE });
      const isPremium = await this.entitlementService.hasPremiumAccess(userId);

      let memoryReference: { title: string; summary: string } | null = null;
      if (isPremium) {
        try {
          const recommended = await this.memoryRetrieval.recommend(userId, { limit: 1 });
          const top = recommended.items[0];
          if (top) memoryReference = { title: top.title, summary: top.summary };
        } catch {
          // Memory retrieval failing never blocks a Numerology reading.
        }
      }

      const interpretation = await this.interpretation.interpret({
        normalizedBirthName: full.normalizedBirthName,
        values: [...full.values]
          .sort((a, b) => a.order - b.order)
          .map((v) => ({ type: v.type, value: v.value, isMasterNumber: v.isMasterNumber })),
        tier: isPremium ? 'PREMIUM' : 'FREE',
        memoryReference,
      });

      if (interpretation) {
        await this.prisma.numerologyReading.update({ where: { id: readingId }, data: { interpretation, interpretedAt: new Date() } });
        await this.prisma.numerologyReadingHistory.create({ data: { readingId, action: 'INTERPRETED', detail: 'AI interpretation generated.' } });
      }
    } catch (error) {
      this.logger.warn(`Numerology interpretation generation failed for reading=${readingId}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async retryInterpretation(userId: string, id: string): Promise<NumerologyReadingDto> {
    await this.findOwned(userId, id);
    await this.generateInterpretation(userId, id);
    return this.getOne(userId, id);
  }

  async list(userId: string, params: ListReadingsParams): Promise<ListReadingsResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    if (!isPremium && skip >= FREE_HISTORY_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `Free accounts can browse their most recent ${FREE_HISTORY_LIMIT} readings. Upgrade to Premium for unlimited history.`,
      });
    }
    const take = isPremium ? pageSize : Math.min(pageSize, FREE_HISTORY_LIMIT - skip);

    const where: Prisma.NumerologyReadingWhereInput = { userId, status: params.status ?? { not: 'DELETED' } };

    const [totalRaw, rows] = await Promise.all([
      this.prisma.numerologyReading.count({ where }),
      this.prisma.numerologyReading.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    const total = isPremium ? totalRaw : Math.min(totalRaw, FREE_HISTORY_LIMIT);

    return { items: rows.map(toNumerologyReadingDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<NumerologyReadingDto> {
    const reading = await this.findOwned(userId, id);
    await this.prisma.numerologyReadingHistory.create({ data: { readingId: id, action: 'VIEWED', detail: 'Reading viewed.' } });
    return toNumerologyReadingDto(reading);
  }

  async history(userId: string, id: string): Promise<NumerologyReadingHistoryDto[]> {
    await this.findOwned(userId, id);
    const rows = await this.prisma.numerologyReadingHistory.findMany({ where: { readingId: id }, orderBy: { createdAt: 'desc' } });
    return rows.map(toNumerologyReadingHistoryDto);
  }

  async archive(userId: string, id: string): Promise<NumerologyReadingDto> {
    const reading = await this.findOwned(userId, id);
    if (reading.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'NUMEROLOGY_READING_INVALID_TRANSITION', message: `Cannot archive a reading with status ${reading.status}.` });
    }
    await this.prisma.numerologyReading.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    await this.prisma.numerologyReadingHistory.create({ data: { readingId: id, action: 'ARCHIVED', detail: 'Reading archived.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async restore(userId: string, id: string): Promise<NumerologyReadingDto> {
    const reading = await this.findOwned(userId, id);
    if (reading.status === 'ACTIVE') {
      throw new BadRequestException({ code: 'NUMEROLOGY_READING_INVALID_TRANSITION', message: 'That reading is already active.' });
    }
    await this.prisma.numerologyReading.update({ where: { id }, data: { status: 'ACTIVE', archivedAt: null, deletedAt: null } });
    await this.prisma.numerologyReadingHistory.create({ data: { readingId: id, action: 'RESTORED', detail: 'Reading restored.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async remove(userId: string, id: string): Promise<NumerologyReadingDto> {
    const reading = await this.findOwned(userId, id);
    if (reading.status === 'DELETED') {
      throw new BadRequestException({ code: 'NUMEROLOGY_READING_INVALID_TRANSITION', message: 'That reading is already deleted.' });
    }
    await this.prisma.numerologyReading.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
    await this.prisma.numerologyReadingHistory.create({ data: { readingId: id, action: 'DELETED', detail: 'Reading deleted.' } });
    return this.getOneWithoutViewTracking(id);
  }

  private async getOneWithoutViewTracking(id: string): Promise<NumerologyReadingDto> {
    const reading = await this.prisma.numerologyReading.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    return toNumerologyReadingDto(reading);
  }

  /** Sprint 8, Phase 16 — deliberately status-agnostic counting (Tarot's own Phase 9 security-review
   * finding, `tarot-record.service.ts#assertNoDailyDrawToday`): "already calculated N times today"
   * is a fact about how many calculate events happened, not about readings' current lifecycle
   * status — excluding DELETED here would let a user delete-then-recalculate past the daily ceiling. */
  private async assertWithinDailyLimit(userId: string): Promise<void> {
    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    const limit = isPremium ? PREMIUM_DAILY_CALCULATION_LIMIT : FREE_DAILY_CALCULATION_LIMIT;

    const startOfDayUtc = getStartOfUtcDay();
    const count = await this.prisma.numerologyReading.count({ where: { userId, createdAt: { gte: startOfDayUtc } } });
    if (count < limit) return;

    if (!isPremium && count < PREMIUM_DAILY_CALCULATION_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `You've reached today's free calculation limit (${FREE_DAILY_CALCULATION_LIMIT}). Upgrade to Premium for a higher daily allowance.`,
      });
    }
    throw new BadRequestException({
      code: 'NUMEROLOGY_DAILY_LIMIT_REACHED',
      message: `You've reached today's calculation limit (${limit}). Come back tomorrow.`,
    });
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else". */
  private async findOwned(userId: string, id: string) {
    const reading = await this.prisma.numerologyReading.findUnique({ where: { id }, include: INCLUDE });
    if (!reading || reading.userId !== userId) {
      throw new NotFoundException({ code: 'NUMEROLOGY_READING_NOT_FOUND', message: 'That reading was not found.' });
    }
    return reading;
  }
}

function getStartOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
