import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma, TarotReadingStatus, TarotReadingType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryRetrievalService } from '../../memory/retrieval/memory-retrieval.service';
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
  ) {}

  async draw(userId: string, dto: DrawReadingDto): Promise<TarotReadingDto> {
    if (dto.type === 'DAILY_DRAW') {
      await this.assertNoDailyDrawToday(userId);
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

    await this.generateInterpretation(userId, reading.id);

    return this.getOne(userId, reading.id);
  }

  /** Best-effort — never throws; a provider failure leaves `interpretation: null`, which the
   * caller (and `POST /tarot/readings/:id/interpret`) can retry later. */
  private async generateInterpretation(userId: string, readingId: string): Promise<void> {
    try {
      const full = await this.prisma.tarotReading.findUniqueOrThrow({ where: { id: readingId }, include: INCLUDE });

      let memoryReference: { title: string; summary: string } | null = null;
      try {
        const recommended = await this.memoryRetrieval.recommend(userId, { limit: 1, contextText: full.question ?? undefined });
        const top = recommended.items[0];
        if (top) memoryReference = { title: top.title, summary: top.summary };
      } catch {
        // Memory retrieval failing never blocks a Tarot reading — the interpretation just
        // proceeds without a memory reference.
      }

      const interpretation = await this.interpretation.interpret({
        readingType: full.type,
        question: full.question,
        cards: [...full.cards]
          .sort((a, b) => a.position - b.position)
          .map((rc) => ({ card: rc.card, position: rc.position, positionLabel: rc.positionLabel, isReversed: rc.isReversed })),
        memoryReference,
      });

      if (interpretation) {
        await this.prisma.tarotReading.update({ where: { id: readingId }, data: { interpretation } });
        await this.prisma.tarotReadingHistory.create({ data: { readingId, action: 'INTERPRETED', detail: 'AI interpretation generated.' } });
      }
    } catch (error) {
      this.logger.warn(`Tarot interpretation generation failed for reading=${readingId}: ${error instanceof Error ? error.message : 'unknown'}`);
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

    const where: Prisma.TarotReadingWhereInput = {
      userId,
      status: params.status ?? { not: 'DELETED' },
      ...(params.type ? { type: params.type as TarotReadingType } : {}),
      ...(params.search ? { question: { contains: params.search, mode: 'insensitive' } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.tarotReading.count({ where }),
      this.prisma.tarotReading.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    ]);

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
    const now = new Date();
    const startOfDayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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

  /** Owner-scoped fetch — 404s identically for "doesn't exist" and "belongs to someone else". */
  private async findOwned(userId: string, id: string) {
    const reading = await this.prisma.tarotReading.findUnique({ where: { id }, include: INCLUDE });
    if (!reading || reading.userId !== userId) {
      throw new NotFoundException({ code: 'TAROT_READING_NOT_FOUND', message: 'That reading was not found.' });
    }
    return reading;
  }
}
