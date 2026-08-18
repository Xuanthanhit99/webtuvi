import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, EasternHoroscopeProfileStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import { EntitlementService } from '../../payment/entitlement/entitlement.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { GenerationLockService } from '../../companion/concurrency/generation-lock.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { BirthDateValidationError, calculateEasternHoroscope } from '../engine/eastern-horoscope-engine';
import { getLunarYearForGregorianDate, EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS } from '../engine/lunar-calendar.adapter';
import { getStemBranchForLunarYear, STEM_ELEMENT, BRANCH_ANIMAL, getYearEnergyRelationship, type FiveElement } from '../engine/eastern-horoscope-tables';
import { EasternHoroscopeInterpretationService } from '../interpretation/eastern-horoscope-interpretation.service';
import {
  toEasternHoroscopeProfileDto,
  toEasternHoroscopeProfileHistoryDto,
  type EasternHoroscopeProfileDto,
  type EasternHoroscopeProfileHistoryDto,
} from '../eastern-horoscope.mappers';
import type { CalculateEasternHoroscopeDto } from '../dto/calculate-eastern-horoscope.dto';

export interface ListProfilesParams {
  status?: EasternHoroscopeProfileStatus;
  page?: number;
  pageSize?: number;
}

export interface ListProfilesResult {
  items: EasternHoroscopeProfileDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Free users can browse only their most recent 20 profiles — mirrors Numerology/Tarot's own
 * FREE_HISTORY_LIMIT exactly (see docs/architecture/premium-entitlements.md). */
const FREE_HISTORY_LIMIT = 20;

// Anti-abuse/cost-control only, NOT a content gate — mirrors Numerology's own daily-ceiling
// precedent (numerology-record.service.ts) exactly: the deterministic calculation and basic
// interpretation are never hidden behind this for a user acting normally, this only bounds AI
// interpretation cost against automated "try every birth date" abuse.
const FREE_DAILY_CALCULATION_LIMIT = 5;
const PREMIUM_DAILY_CALCULATION_LIMIT = 15;

/**
 * Sprint 17 — profile persistence and lifecycle. `calculate()` is the one place a new
 * `EasternHoroscopeProfile` row gets created: the deterministic engine runs first and its output
 * is persisted as-is, then interpretation is attempted as a best-effort addition — a provider
 * failure never invalidates or blocks the already-real calculated result (mirrors
 * `NumerologyRecordService`'s own "calculate -> persist -> interpret" precedent exactly).
 */
@Injectable()
export class EasternHoroscopeRecordService {
  private readonly logger = new Logger('EasternHoroscope');

  constructor(
    private readonly prisma: PrismaService,
    private readonly interpretation: EasternHoroscopeInterpretationService,
    private readonly memoryRetrieval: MemoryRetrievalService,
    private readonly entitlementService: EntitlementService,
    private readonly costControl: CostControlService,
    private readonly generationLock: GenerationLockService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async calculate(userId: string, dto: CalculateEasternHoroscopeDto): Promise<EasternHoroscopeProfileDto> {
    await this.assertWithinDailyLimit(userId);

    let result: ReturnType<typeof calculateEasternHoroscope>;
    try {
      result = calculateEasternHoroscope({ birthDate: dto.birthDate });
    } catch (error) {
      if (error instanceof BirthDateValidationError) {
        throw new BadRequestException({ code: error.code, message: error.message });
      }
      throw error;
    }

    const profile = await this.prisma.$transaction(async (tx) => {
      const created = await tx.easternHoroscopeProfile.create({
        data: {
          userId,
          birthDate: new Date(`${dto.birthDate}T00:00:00.000Z`),
          engineVersion: result.engineVersion,
          calendarVersion: result.calendarVersion,
          rulesetVersion: result.rulesetVersion,
          stem: result.birthProfile.stem,
          branch: result.birthProfile.branch,
          element: result.birthProfile.element,
          yinYang: result.birthProfile.yinYang,
          zodiacAnimalEn: result.birthProfile.zodiacAnimal.en,
          zodiacAnimalVi: result.birthProfile.zodiacAnimal.vi,
        },
      });
      await tx.easternHoroscopeProfileHistory.create({
        data: { profileId: created.id, action: 'CREATED', detail: 'Eastern Horoscope profile calculated.' },
      });
      return created;
    });

    this.logger.log(`Eastern Horoscope profile calculated id=${profile.id}`);
    void this.analyticsService.trackServerEvent({ event: 'eastern_horoscope_completed', userId, properties: { feature: 'eastern_horoscope' } });

    await this.generateInterpretation(userId, profile.id);

    return this.getOne(userId, profile.id);
  }

  /** Best-effort — never throws; a provider failure, an exhausted AI budget, or a concurrent
   * generation already in flight all leave `interpretation: null`, retryable via
   * `POST /eastern-horoscope/profiles/:id/interpret` (mirrors
   * `NumerologyRecordService.generateInterpretation` exactly). Always interprets the CURRENT
   * calendar year's Year Energy — never a stale or arbitrary year. */
  private async generateInterpretation(userId: string, profileId: string): Promise<void> {
    const budget = await this.costControl.checkBudget(userId);
    if (!budget.allowed) {
      this.logger.warn(`Eastern Horoscope interpretation skipped for profile=${profileId}: ${budget.reason}`);
      return;
    }

    const acquired = await this.generationLock.tryAcquireDiscovery('eastern_horoscope', userId, profileId);
    if (!acquired) {
      this.logger.warn(`Eastern Horoscope interpretation skipped for profile=${profileId}: concurrent generation already in flight`);
      return;
    }

    try {
      const full = await this.prisma.easternHoroscopeProfile.findUniqueOrThrow({ where: { id: profileId } });
      const isPremium = await this.entitlementService.hasPremiumAccess(userId);

      const now = new Date();
      const currentLunarYear = getLunarYearForGregorianDate(now, EASTERN_HOROSCOPE_TIMEZONE_OFFSET_HOURS);
      const currentYearProfile = getStemBranchForLunarYear(currentLunarYear);
      const currentElement = STEM_ELEMENT[currentYearProfile.stem];
      const birthElement = full.element as FiveElement;
      const relationship = getYearEnergyRelationship(currentElement.element, birthElement);

      let memoryReference: { title: string; summary: string } | null = null;
      if (isPremium) {
        try {
          const recommended = await this.memoryRetrieval.recommend(userId, { limit: 1 });
          const top = recommended.items[0];
          if (top) memoryReference = { title: top.title, summary: top.summary };
        } catch {
          // Memory retrieval failing never blocks an Eastern Horoscope profile.
        }
      }

      const interpretation = await this.interpretation.interpret(
        {
          stem: full.stem as never,
          branch: full.branch as never,
          element: birthElement,
          yinYang: full.yinYang as never,
          zodiacAnimal: { vi: full.zodiacAnimalVi, en: full.zodiacAnimalEn },
          yearEnergy: {
            calendarYear: currentLunarYear,
            yearStem: currentYearProfile.stem,
            yearElement: currentElement.element,
            yearZodiacAnimal: BRANCH_ANIMAL[currentYearProfile.branch],
            relationship,
          },
          tier: isPremium ? 'PREMIUM' : 'FREE',
          memoryReference,
        },
        { userId, sourceId: profileId },
      );

      if (interpretation) {
        await this.prisma.easternHoroscopeProfile.update({
          where: { id: profileId },
          data: { interpretation, interpretationYear: currentLunarYear, interpretedAt: new Date() },
        });
        await this.prisma.easternHoroscopeProfileHistory.create({ data: { profileId, action: 'INTERPRETED', detail: 'AI interpretation generated.' } });
        // Sprint 17 audit §31: deliberately no separate interpretation-completed analytics event —
        // `eastern_horoscope_completed` plus the existing Companion-continuation event already
        // answer this funnel question; a third event would duplicate coverage without new value.
      }
    } catch (error) {
      this.logger.warn(`Eastern Horoscope interpretation generation failed for profile=${profileId}: ${error instanceof Error ? error.message : 'unknown'}`);
    } finally {
      await this.generationLock.releaseDiscovery('eastern_horoscope', userId, profileId);
    }
  }

  async retryInterpretation(userId: string, id: string): Promise<EasternHoroscopeProfileDto> {
    await this.findOwned(userId, id);
    await this.generateInterpretation(userId, id);
    return this.getOne(userId, id);
  }

  async list(userId: string, params: ListProfilesParams): Promise<ListProfilesResult> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * pageSize;

    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    if (!isPremium && skip >= FREE_HISTORY_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `Free accounts can browse their most recent ${FREE_HISTORY_LIMIT} profiles. Upgrade to Premium for unlimited history.`,
      });
    }
    const take = isPremium ? pageSize : Math.min(pageSize, FREE_HISTORY_LIMIT - skip);

    const where: Prisma.EasternHoroscopeProfileWhereInput = { userId, status: params.status ?? { not: 'DELETED' } };

    const [totalRaw, rows] = await Promise.all([
      this.prisma.easternHoroscopeProfile.count({ where }),
      this.prisma.easternHoroscopeProfile.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    const total = isPremium ? totalRaw : Math.min(totalRaw, FREE_HISTORY_LIMIT);

    return { items: rows.map((r) => toEasternHoroscopeProfileDto(r)), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<EasternHoroscopeProfileDto> {
    const profile = await this.findOwned(userId, id);
    await this.prisma.easternHoroscopeProfileHistory.create({ data: { profileId: id, action: 'VIEWED', detail: 'Profile viewed.' } });
    return toEasternHoroscopeProfileDto(profile);
  }

  async history(userId: string, id: string): Promise<EasternHoroscopeProfileHistoryDto[]> {
    await this.findOwned(userId, id);
    const rows = await this.prisma.easternHoroscopeProfileHistory.findMany({ where: { profileId: id }, orderBy: { createdAt: 'desc' } });
    return rows.map(toEasternHoroscopeProfileHistoryDto);
  }

  async archive(userId: string, id: string): Promise<EasternHoroscopeProfileDto> {
    const profile = await this.findOwned(userId, id);
    if (profile.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'EASTERN_HOROSCOPE_PROFILE_INVALID_TRANSITION', message: `Cannot archive a profile with status ${profile.status}.` });
    }
    await this.prisma.easternHoroscopeProfile.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    await this.prisma.easternHoroscopeProfileHistory.create({ data: { profileId: id, action: 'ARCHIVED', detail: 'Profile archived.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async restore(userId: string, id: string): Promise<EasternHoroscopeProfileDto> {
    const profile = await this.findOwned(userId, id);
    if (profile.status === 'ACTIVE') {
      throw new BadRequestException({ code: 'EASTERN_HOROSCOPE_PROFILE_INVALID_TRANSITION', message: 'That profile is already active.' });
    }
    await this.prisma.easternHoroscopeProfile.update({ where: { id }, data: { status: 'ACTIVE', archivedAt: null, deletedAt: null } });
    await this.prisma.easternHoroscopeProfileHistory.create({ data: { profileId: id, action: 'RESTORED', detail: 'Profile restored.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async remove(userId: string, id: string): Promise<EasternHoroscopeProfileDto> {
    const profile = await this.findOwned(userId, id);
    if (profile.status === 'DELETED') {
      throw new BadRequestException({ code: 'EASTERN_HOROSCOPE_PROFILE_INVALID_TRANSITION', message: 'That profile is already deleted.' });
    }
    await this.prisma.easternHoroscopeProfile.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
    await this.prisma.easternHoroscopeProfileHistory.create({ data: { profileId: id, action: 'DELETED', detail: 'Profile deleted.' } });
    return this.getOneWithoutViewTracking(id);
  }

  private async getOneWithoutViewTracking(id: string): Promise<EasternHoroscopeProfileDto> {
    const profile = await this.prisma.easternHoroscopeProfile.findUniqueOrThrow({ where: { id } });
    return toEasternHoroscopeProfileDto(profile);
  }

  private async assertWithinDailyLimit(userId: string): Promise<void> {
    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    const limit = isPremium ? PREMIUM_DAILY_CALCULATION_LIMIT : FREE_DAILY_CALCULATION_LIMIT;

    const startOfDayUtc = getStartOfUtcDay();
    const count = await this.prisma.easternHoroscopeProfile.count({ where: { userId, createdAt: { gte: startOfDayUtc } } });
    if (count < limit) return;

    if (!isPremium && count < PREMIUM_DAILY_CALCULATION_LIMIT) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `You've reached today's free calculation limit (${FREE_DAILY_CALCULATION_LIMIT}). Upgrade to Premium for a higher daily allowance.`,
      });
    }
    throw new BadRequestException({
      code: 'EASTERN_HOROSCOPE_DAILY_LIMIT_REACHED',
      message: `You've reached today's calculation limit (${limit}). Come back tomorrow.`,
    });
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else". */
  private async findOwned(userId: string, id: string) {
    const profile = await this.prisma.easternHoroscopeProfile.findUnique({ where: { id } });
    if (!profile || profile.userId !== userId) {
      throw new NotFoundException({ code: 'EASTERN_HOROSCOPE_PROFILE_NOT_FOUND', message: 'That profile was not found.' });
    }
    return profile;
  }
}

function getStartOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
