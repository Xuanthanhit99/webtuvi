import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReviewUserData } from '../review.types';

/** Same order-of-magnitude bound every prior engine in this codebase discloses (Insight
 * Preparation: 200 reflections/180-day lookback). A review window is at most a calendar month, so
 * this is generous headroom, not a real limiting factor in practice. */
const INSIGHT_BOUND = 200;
const REFLECTION_BOUND = 300;
/** Journaling-streak lookback — bounded, not exhaustive (disclosed in review-engine.md), wide
 * enough to capture any realistic streak ending at windowEnd without an unbounded scan. */
const STREAK_LOOKBACK_DAYS = 60;
/** A "loose" reflection (Phase 2's supplementary evidence unit) must clear the same MEDIUM-tier
 * priority threshold Insight Experience's own renderer already uses (see insight-renderer.ts
 * PRIORITY_TIER_MEDIUM_MIN) — never a separately-invented cutoff. */
const LOOSE_REFLECTION_MIN_SCORE = 40;

/**
 * Fetches one bounded, deterministic `ReviewUserData` snapshot for `ReviewGenerationService`.
 * Reads only `InsightCandidate`/`ReflectionCandidate` for evidence (never re-derives what those
 * layers already computed), plus real `JournalEntry`/`Memory`/`ActivityEvent`/`Conversation` row
 * counts for Phase 3 statistics only — never for evidence (see review.types.ts
 * `ReviewEvidenceSourceType`, which has no `ACTIVITY`/`COMPANION` value).
 */
@Injectable()
export class ReviewDataSourceService {
  constructor(private readonly prisma: PrismaService) {}

  async fetch(userId: string, windowStart: Date, windowEnd: Date, now: Date = new Date()): Promise<ReviewUserData> {
    const asOf = windowEnd.getTime() < now.getTime() ? windowEnd : now;
    const [
      insights,
      allEvidenceReflectionIds,
      journalCount,
      memoryCreatedCount,
      activityCount,
      companionConversationCount,
      streakJournalEntries,
      achievementMemories,
      pinnedJournalEntries,
    ] = await Promise.all([
        this.prisma.insightCandidate.findMany({
          where: { userId, status: { in: ['READY', 'ARCHIVED'] }, createdAt: { gte: windowStart, lte: windowEnd } },
          include: { evidence: { include: { reflectionCandidate: true } } },
          orderBy: { priority: 'desc' },
          take: INSIGHT_BOUND,
        }),
        this.prisma.insightEvidence.findMany({
          where: { insightCandidate: { userId } },
          select: { reflectionCandidateId: true },
        }),
        this.prisma.journalEntry.count({ where: { userId, state: 'PUBLISHED', createdAt: { gte: windowStart, lte: windowEnd } } }),
        this.prisma.memory.count({ where: { userId, status: 'ACCEPTED', createdAt: { gte: windowStart, lte: windowEnd } } }),
        this.prisma.activityEvent.count({ where: { userId, createdAt: { gte: windowStart, lte: windowEnd } } }),
        this.prisma.conversation.count({ where: { userId, createdAt: { gte: windowStart, lte: windowEnd } } }),
        this.prisma.journalEntry.findMany({
          where: {
            userId,
            state: 'PUBLISHED',
            createdAt: { gte: new Date(asOf.getTime() - STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000), lte: asOf },
          },
          select: { createdAt: true },
        }),
        this.prisma.memory.findMany({
          where: { userId, status: 'ACCEPTED', type: 'ACHIEVEMENT', createdAt: { gte: windowStart, lte: windowEnd } },
          orderBy: { importanceScore: 'desc' },
          take: INSIGHT_BOUND,
        }),
        this.prisma.journalEntry.findMany({
          where: { userId, state: 'PUBLISHED', pinned: true, createdAt: { gte: windowStart, lte: windowEnd } },
          orderBy: { createdAt: 'desc' },
          take: INSIGHT_BOUND,
        }),
      ]);

    const clusteredReflectionIds = new Set(allEvidenceReflectionIds.map((e) => e.reflectionCandidateId));

    const reflectionCount = await this.prisma.reflectionCandidate.count({
      where: { userId, state: { not: 'EXPIRED' }, createdAt: { gte: windowStart, lte: windowEnd } },
    });

    const looseReflections = await this.prisma.reflectionCandidate.findMany({
      where: {
        userId,
        state: { not: 'EXPIRED' },
        createdAt: { gte: windowStart, lte: windowEnd },
        score: { gte: LOOSE_REFLECTION_MIN_SCORE },
        id: { notIn: [...clusteredReflectionIds] },
      },
      include: { sources: true },
      orderBy: { score: 'desc' },
      take: REFLECTION_BOUND,
    });

    const journalDays = [...new Set(streakJournalEntries.map((e) => e.createdAt.toISOString().slice(0, 10)))];

    return {
      userId,
      windowStart,
      windowEnd,
      asOf,
      insights,
      looseReflections,
      achievementMemories,
      pinnedJournalEntries,
      counts: {
        journalCount,
        memoryCreatedCount,
        reflectionCount,
        insightCount: insights.length,
        activityCount,
        companionConversationCount,
      },
      journalDays,
    };
  }
}
