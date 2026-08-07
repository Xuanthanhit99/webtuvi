import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { GoalUserData } from '../goal.types';

/** Same order-of-magnitude bound every prior engine in this codebase discloses (Review: 200/300;
 * Insight Preparation: 200/180-day). A goal's evidence is unbounded in time (unlike a Review's
 * calendar window), so this matters more here — generous headroom, not a real limiting factor for
 * a single goal's realistic evidence volume. */
const EVIDENCE_BOUND = 200;

/**
 * Phase 3/4 — fetches one bounded, deterministic `GoalUserData` snapshot for `GoalProgressEngine`.
 * Every source is matched by real, deterministic tag/category equality only (see
 * `sprint-5c-progress.md` "Evidence linking") — never semantic/AI matching. `ACTIVITY` is
 * deliberately absent: no goal-specific `ActivityType` exists in this product (disclosed, not
 * fabricated).
 */
@Injectable()
export class GoalDataSourceService {
  constructor(private readonly prisma: PrismaService) {}

  async fetch(userId: string, linkedTag: string, startedAt: Date): Promise<GoalUserData> {
    const tagLower = linkedTag.toLowerCase();

    const [journalEntries, memories, reflections] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId, state: 'PUBLISHED', tags: { has: linkedTag } },
        orderBy: { createdAt: 'desc' },
        take: EVIDENCE_BOUND,
      }),
      this.prisma.memory.findMany({
        where: { userId, status: 'ACCEPTED', type: { in: ['GOAL', 'ACHIEVEMENT', 'CHALLENGE'] }, createdAt: { gte: startedAt } },
        orderBy: { createdAt: 'desc' },
        take: EVIDENCE_BOUND,
      }),
      this.prisma.reflectionCandidate.findMany({
        where: { userId, state: { not: 'EXPIRED' }, createdAt: { gte: startedAt } },
        orderBy: { createdAt: 'desc' },
        take: EVIDENCE_BOUND,
      }),
    ]);

    // MEMORY — a case-insensitive substring match on title/summary against linkedTag, disclosed
    // as a substring match, not semantic similarity (same "heuristic, not semantic" disclosure
    // Reflection's own GOAL_ACTIVITY_MISMATCH rule already carries).
    const matchedMemories = memories.filter((m) => m.title.toLowerCase().includes(tagLower) || m.summary.toLowerCase().includes(tagLower));

    // REFLECTION — groupKey contains linkedTag (Reflection groupKeys already embed real tags, e.g.
    // "JOURNAL:tag:<tag>" — see reflection-foundation.md "Grouping"), or category GOAL.
    const matchedReflections = reflections.filter((r) => r.groupKey.toLowerCase().includes(tagLower) || r.category === 'GOAL');
    const matchedReflectionIds = new Set(matchedReflections.map((r) => r.id));

    // INSIGHT — category GOAL, evidenced by at least one matched reflection above.
    const insightEvidenceRows =
      matchedReflectionIds.size > 0
        ? await this.prisma.insightEvidence.findMany({
            where: { reflectionCandidateId: { in: [...matchedReflectionIds] }, insightCandidate: { userId, status: { in: ['READY', 'ARCHIVED'] }, category: 'GOAL' } },
            include: { insightCandidate: true },
            take: EVIDENCE_BOUND,
          })
        : [];
    const matchedInsights = [...new Map(insightEvidenceRows.map((e) => [e.insightCandidateId, e.insightCandidate])).values()];

    // REVIEW — cited coarsely (the Review row itself, category GOAL evidence, created after the
    // goal started) to avoid double-counting the same underlying Insight/Reflection through two
    // paths (see sprint-5c-progress.md #2).
    const reviewEvidenceRows = await this.prisma.reviewEvidence.findMany({
      where: { category: 'GOAL', sourceTimestamp: { gte: startedAt }, reviewSection: { review: { userId } } },
      include: { reviewSection: { include: { review: true } } },
      take: EVIDENCE_BOUND,
    });
    const matchedReviews = [...new Map(reviewEvidenceRows.map((e) => [e.reviewSection.review.id, e.reviewSection.review])).values()];

    const evidence: GoalUserData['evidence'] = [
      ...journalEntries.map((e) => ({
        sourceType: 'JOURNAL' as const,
        sourceId: e.id,
        sourceTimestamp: e.createdAt,
        contribution: `Journal entry tagged "${linkedTag}", published ${e.createdAt.toISOString().slice(0, 10)}.`,
      })),
      ...matchedMemories.map((m) => ({
        sourceType: 'MEMORY' as const,
        sourceId: m.id,
        sourceTimestamp: m.createdAt,
        contribution: `Memory "${m.title}" (${m.type.toLowerCase()}), saved ${m.createdAt.toISOString().slice(0, 10)}.`,
      })),
      ...matchedReflections.map((r) => ({
        sourceType: 'REFLECTION' as const,
        sourceId: r.id,
        sourceTimestamp: r.createdAt,
        contribution: `Reflection: ${r.reason} (score ${r.score}).`,
      })),
      ...matchedInsights.map((i) => ({
        sourceType: 'INSIGHT' as const,
        sourceId: i.id,
        sourceTimestamp: i.createdAt,
        contribution: `Insight: ${i.ruleExplanation} (priority ${i.priority}).`,
      })),
      ...matchedReviews.map((r) => ({
        sourceType: 'REVIEW' as const,
        sourceId: r.id,
        sourceTimestamp: r.createdAt,
        contribution: `Review (${r.window.toLowerCase()}) noted goal-related activity: ${r.overview}`,
      })),
    ];

    return { evidence };
  }
}
