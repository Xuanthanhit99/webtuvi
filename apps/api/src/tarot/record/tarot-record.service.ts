import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, TarotReadingStatus, TarotReadingType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
import { EntitlementService } from '../../payment/entitlement/entitlement.service';
import { CostControlService } from '../../companion/cost/cost-control.service';
import { GenerationLockService } from '../../companion/concurrency/generation-lock.service';
import { AnalyticsService } from '../../analytics/analytics.service';
import { drawCards } from '../draw/tarot-draw-engine.util';
import { TarotInterpretationService } from '../interpretation/tarot-interpretation.service';
import { toTarotReadingDto, toTarotReadingHistoryDto, type TarotReadingDto, type TarotReadingHistoryDto } from '../tarot.mappers';
import type { DrawReadingDto } from '../dto/draw-reading.dto';

export interface ListReadingsParams {
  status?: TarotReadingStatus;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListReadingsResult {
  items: TarotReadingDto[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const INCLUDE = { spread: true, cards: { include: { card: true } } } as const;

const SPREAD_SLUG_BY_TYPE: Record<TarotReadingType, string> = {
  DAILY_DRAW: 'daily-draw',
  SINGLE_CARD: 'single-card',
  THREE_CARD: 'three-card-ppf',
};

const TAROT_ANALYTICS_SPREAD_TYPE: Record<TarotReadingType, 'daily_draw' | 'single_card' | 'three_card'> = {
  DAILY_DRAW: 'daily_draw',
  SINGLE_CARD: 'single_card',
  THREE_CARD: 'three_card',
};

// Sprint 7, Phase 8 — documented product change: Single Card and Three Card Spread were unlimited
// in Sprint 6; both are still fully available to Free users (never removed), just given the same
// kind of reasonable daily cap Daily Draw already had. Daily Draw itself is unchanged for both
// tiers — its "no re-draw" reflective premise applies equally to Free and Premium (see
// assertNoDailyDrawToday). See docs/architecture/premium-entitlements.md "Free vs Premium matrix".
const FREE_DAILY_LIMITS: Partial<Record<TarotReadingType, number>> = { SINGLE_CARD: 3, THREE_CARD: 1 };
const PREMIUM_DAILY_LIMITS: Partial<Record<TarotReadingType, number>> = { SINGLE_CARD: 15, THREE_CARD: 10 };

/** Free users can browse only their most recent 20 readings (any page/pageSize combination whose
 * window falls entirely within that range); requesting further back is an explicit PREMIUM_REQUIRED
 * denial, never a silently-truncated result. Premium is unlimited (existing pagination). */
const FREE_HISTORY_LIMIT = 20;

/**
 * Phase 3/5 — Reading persistence and lifecycle. `draw()` is the one place a new
 * `TarotReading`/`TarotReadingCard`/`TarotReadingSession` gets created: the deterministic engine
 * runs first and its output is persisted as-is, then interpretation is attempted as a best-effort
 * addition — a provider failure never invalidates or blocks the already-real drawn result (see
 * docs/architecture/tarot-discovery.md "Draw -> persist -> interpret").
 */
@Injectable()
export class TarotRecordService {
  private readonly logger = new Logger('Tarot');

  constructor(
    private readonly prisma: PrismaService,
    private readonly interpretation: TarotInterpretationService,
    private readonly memoryRetrieval: MemoryRetrievalService,
    private readonly entitlementService: EntitlementService,
    private readonly costControl: CostControlService,
    private readonly generationLock: GenerationLockService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async draw(userId: string, dto: DrawReadingDto): Promise<TarotReadingDto> {
    if (dto.type === 'DAILY_DRAW') {
      await this.assertNoDailyDrawToday(userId);
    } else {
      await this.assertWithinDailyLimit(userId, dto.type);
    }

    const spread = await this.prisma.tarotSpread.findUnique({ where: { slug: SPREAD_SLUG_BY_TYPE[dto.type] } });
    if (!spread) {
      throw new BadRequestException({ code: 'TAROT_SPREAD_NOT_SEEDED', message: 'That spread is not available yet.' });
    }
    const positions = spread.positions as { order: number; label: string }[];

    // Stable, deterministic ordering — the draw engine's reproducibility depends on the same
    // seed always being shuffled against the same input order (see tarot-draw-engine.util.ts).
    const allCards = await this.prisma.tarotCard.findMany({ orderBy: { slug: 'asc' }, select: { id: true } });
    const cardIds = allCards.map((c) => c.id);

    const draw = drawCards({ cardIds, count: spread.cardCount });

    const reading = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tarotReading.create({
        // Sprint 6 scope decision (see sprint-6-progress.md): defaults to COMPANION_VISIBLE, not
        // the DB column's own conservative PRIVATE default — Module 12 treats the Companion-chat
        // bridge as every reading's intended next step, not an opt-in extra, unlike Goal/
        // Reflection/Memory's own "opt in explicitly" precedent for more sensitive content.
        data: { userId, type: dto.type, spreadId: spread.id, question: dto.question ?? null, visibility: 'COMPANION_VISIBLE' },
      });
      await tx.tarotReadingCard.createMany({
        data: draw.drawnCards.map((dc, index) => ({
          readingId: created.id,
          cardId: dc.cardId,
          position: index,
          positionLabel: positions.find((p) => p.order === index)?.label ?? null,
          isReversed: dc.isReversed,
        })),
      });
      await tx.tarotReadingSession.create({
        data: { readingId: created.id, seed: draw.seed, algorithm: draw.algorithm, shuffledCardIds: draw.shuffledCardIds },
      });
      await tx.tarotReadingHistory.create({
        data: { readingId: created.id, action: 'CREATED', detail: `${dto.type.replace('_', ' ').toLowerCase()} reading drawn.` },
      });
      return created;
    });

    this.logger.log(`Tarot reading drawn id=${reading.id} type=${dto.type} cards=${draw.drawnCards.length}`);
    void this.analyticsService.trackServerEvent({
      event: 'tarot_completed',
      userId,
      properties: { feature: 'tarot', spreadType: TAROT_ANALYTICS_SPREAD_TYPE[dto.type] },
    });

    await this.generateInterpretation(userId, reading.id);

    return this.getOne(userId, reading.id);
  }

  /** Best-effort — never throws; a provider failure, an exhausted AI budget, or a concurrent
   * generation already in flight for this exact reading all leave `interpretation: null` exactly
   * like a provider failure would, which the caller (and `POST /tarot/readings/:id/interpret`) can
   * retry later. Sprint 12 — deliberately does NOT surface a distinct error to the caller for a
   * budget/lock rejection: the existing "Interpretation isn't ready yet" + retry UX already covers
   * this honestly, and inventing a new error state here would mean redesigning Discovery UX this
   * sprint is explicitly not supposed to touch. The budget check is GLOBAL per user (shared with
   * Companion — see CostControlService.checkBudget), and the lock is scoped to this exact
   * (feature, user, reading) — see GenerationLockService.tryAcquireDiscovery's docstring. */
  private async generateInterpretation(userId: string, readingId: string): Promise<void> {
    const budget = await this.costControl.checkBudget(userId);
    if (!budget.allowed) {
      this.logger.warn(`Tarot interpretation skipped for reading=${readingId}: ${budget.reason}`);
      return;
    }

    const acquired = await this.generationLock.tryAcquireDiscovery('tarot', userId, readingId);
    if (!acquired) {
      this.logger.warn(`Tarot interpretation skipped for reading=${readingId}: concurrent generation already in flight`);
      return;
    }

    try {
      const full = await this.prisma.tarotReading.findUniqueOrThrow({ where: { id: readingId }, include: INCLUDE });
      const isPremium = await this.entitlementService.hasPremiumAccess(userId);

      // Sprint 7, Phase 13 — Free interpretations never receive a memory reference: the retrieval
      // call itself is skipped for Free, not merely fetched-then-hidden (see tarot.types.ts
      // InterpretationTier docstring).
      let memoryReference: { title: string; summary: string } | null = null;
      if (isPremium) {
        try {
          const recommended = await this.memoryRetrieval.recommend(userId, { limit: 1, contextText: full.question ?? undefined });
          const top = recommended.items[0];
          if (top) memoryReference = { title: top.title, summary: top.summary };
        } catch {
          // Memory retrieval failing never blocks a Tarot reading — the interpretation just
          // proceeds without a memory reference.
        }
      }

      const interpretation = await this.interpretation.interpret(
        {
          readingType: full.type,
          question: full.question,
          cards: [...full.cards]
            .sort((a, b) => a.position - b.position)
            .map((rc) => ({ card: rc.card, position: rc.position, positionLabel: rc.positionLabel, isReversed: rc.isReversed })),
          tier: isPremium ? 'PREMIUM' : 'FREE',
          memoryReference,
        },
        { userId, sourceId: readingId },
      );

      if (interpretation) {
        await this.prisma.tarotReading.update({ where: { id: readingId }, data: { interpretation } });
        await this.prisma.tarotReadingHistory.create({ data: { readingId, action: 'INTERPRETED', detail: 'AI interpretation generated.' } });
        void this.analyticsService.trackServerEvent({ event: 'tarot_interpretation_completed', userId, properties: { feature: 'tarot' } });
      }
    } catch (error) {
      this.logger.warn(`Tarot interpretation generation failed for reading=${readingId}: ${error instanceof Error ? error.message : 'unknown'}`);
    } finally {
      await this.generationLock.releaseDiscovery('tarot', userId, readingId);
    }
  }

  async retryInterpretation(userId: string, id: string): Promise<TarotReadingDto> {
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

    const where: Prisma.TarotReadingWhereInput = {
      userId,
      status: params.status ?? { not: 'DELETED' },
      ...(params.type ? { type: params.type as TarotReadingType } : {}),
      ...(params.search ? { question: { contains: params.search, mode: 'insensitive' } } : {}),
    };

    const [totalRaw, rows] = await Promise.all([
      this.prisma.tarotReading.count({ where }),
      this.prisma.tarotReading.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    ]);
    const total = isPremium ? totalRaw : Math.min(totalRaw, FREE_HISTORY_LIMIT);

    return { items: rows.map(toTarotReadingDto), total, page, pageSize };
  }

  async getOne(userId: string, id: string): Promise<TarotReadingDto> {
    const reading = await this.findOwned(userId, id);
    await this.prisma.tarotReadingHistory.create({ data: { readingId: id, action: 'VIEWED', detail: 'Reading viewed.' } });
    return toTarotReadingDto(reading);
  }

  async history(userId: string, id: string): Promise<TarotReadingHistoryDto[]> {
    await this.findOwned(userId, id);
    const rows = await this.prisma.tarotReadingHistory.findMany({ where: { readingId: id }, orderBy: { createdAt: 'desc' } });
    return rows.map(toTarotReadingHistoryDto);
  }

  async archive(userId: string, id: string): Promise<TarotReadingDto> {
    const reading = await this.findOwned(userId, id);
    if (reading.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'TAROT_READING_INVALID_TRANSITION', message: `Cannot archive a reading with status ${reading.status}.` });
    }
    await this.prisma.tarotReading.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    await this.prisma.tarotReadingHistory.create({ data: { readingId: id, action: 'ARCHIVED', detail: 'Reading archived.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async restore(userId: string, id: string): Promise<TarotReadingDto> {
    const reading = await this.findOwned(userId, id);
    if (reading.status === 'ACTIVE') {
      throw new BadRequestException({ code: 'TAROT_READING_INVALID_TRANSITION', message: 'That reading is already active.' });
    }
    await this.prisma.tarotReading.update({ where: { id }, data: { status: 'ACTIVE', archivedAt: null, deletedAt: null } });
    await this.prisma.tarotReadingHistory.create({ data: { readingId: id, action: 'RESTORED', detail: 'Reading restored.' } });
    return this.getOneWithoutViewTracking(id);
  }

  async remove(userId: string, id: string): Promise<TarotReadingDto> {
    const reading = await this.findOwned(userId, id);
    if (reading.status === 'DELETED') {
      throw new BadRequestException({ code: 'TAROT_READING_INVALID_TRANSITION', message: 'That reading is already deleted.' });
    }
    await this.prisma.tarotReading.update({ where: { id }, data: { status: 'DELETED', deletedAt: new Date() } });
    await this.prisma.tarotReadingHistory.create({ data: { readingId: id, action: 'DELETED', detail: 'Reading deleted.' } });
    return this.getOneWithoutViewTracking(id);
  }

  private async getOneWithoutViewTracking(id: string): Promise<TarotReadingDto> {
    const reading = await this.prisma.tarotReading.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    return toTarotReadingDto(reading);
  }

  private async assertNoDailyDrawToday(userId: string): Promise<void> {
    const startOfDayUtc = getStartOfUtcDay();
    // Deliberately status-agnostic (Phase 9 security review finding): "already drawn today" is a
    // fact about whether the draw event happened, not about the reading's current lifecycle
    // status — excluding DELETED here would let a user soft-delete today's Daily Draw and redraw,
    // defeating the "no re-draw" rule Module 12 requires.
    const existing = await this.prisma.tarotReading.findFirst({
      where: { userId, type: 'DAILY_DRAW', createdAt: { gte: startOfDayUtc } },
    });
    if (existing) {
      throw new BadRequestException({
        code: 'TAROT_DAILY_DRAW_ALREADY_TAKEN',
        message: 'You’ve already drawn today’s card — come back tomorrow for a new one.',
      });
    }
  }

  /** Sprint 7, Phase 9/10 — server-side usage-limit enforcement for Single Card / Three Card
   * Spread. Same status-agnostic counting rationale as `assertNoDailyDrawToday`. When a Free user
   * hits their (lower) cap and Premium would actually raise it, the denial is the normalized
   * `PREMIUM_REQUIRED` shape (Phase 9); when even Premium's cap is reached, it's a plain usage-limit
   * error instead — upgrading wouldn't help, so it would be misleading to say Premium is required. */
  private async assertWithinDailyLimit(userId: string, type: TarotReadingType): Promise<void> {
    const isPremium = await this.entitlementService.hasPremiumAccess(userId);
    const limit = (isPremium ? PREMIUM_DAILY_LIMITS : FREE_DAILY_LIMITS)[type];
    if (limit === undefined) return;

    const startOfDayUtc = getStartOfUtcDay();
    const count = await this.prisma.tarotReading.count({ where: { userId, type, createdAt: { gte: startOfDayUtc } } });
    if (count < limit) return;

    const label = type.replace('_', ' ').toLowerCase();
    const premiumLimit = PREMIUM_DAILY_LIMITS[type];
    if (!isPremium && premiumLimit !== undefined && count < premiumLimit) {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: `You've reached today's free ${label} limit (${limit}). Upgrade to Premium for a higher daily allowance.`,
      });
    }
    throw new BadRequestException({
      code: 'TAROT_DAILY_LIMIT_REACHED',
      message: `You've reached today's ${label} limit (${limit}). Come back tomorrow.`,
    });
  }

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else". */
  private async findOwned(userId: string, id: string) {
    const reading = await this.prisma.tarotReading.findUnique({ where: { id }, include: INCLUDE });
    if (!reading || reading.userId !== userId) {
      throw new NotFoundException({ code: 'TAROT_READING_NOT_FOUND', message: 'That reading was not found.' });
    }
    return reading;
  }
}

function getStartOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
