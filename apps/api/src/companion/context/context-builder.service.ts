import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivitiesService } from '../../activities/activities.service';
import type { ConversationContext } from './context.types';

const RECENT_CONVERSATIONS_LIMIT = 3;
const EXCERPT_MAX_CHARS = 140;
/** Same "never inject an unbounded list" discipline `MAX_MEMORIES_PER_TURN` already applies one
 * layer over in `MemoryContextAssembler` — a hard cap, not a token-budget calculation, since
 * titles alone are always short. */
const ACTIVE_GOALS_LIMIT = 10;

function excerpt(text: string, maxChars = EXCERPT_MAX_CHARS): string {
  const trimmed = text.trim();
  return trimmed.length <= maxChars ? trimmed : `${trimmed.slice(0, maxChars)}…`;
}

/**
 * Gathers profile/preferences/onboarding/recent-activity/recent-conversations/
 * time — no Memory Engine, no embeddings, no semantic search. Every field
 * traces to a direct Prisma read; nothing here is inferred or generated.
 */
@Injectable()
export class ContextBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async build(userId: string, currentConversationId?: string): Promise<ConversationContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, preference: true },
    });
    if (!user) throw new NotFoundException();

    const [recentActivity, otherConversations, activeGoals, latestTarotReading, latestNumerologyReading] = await Promise.all([
      this.activitiesService.recent(userId, 5),
      this.prisma.conversation.findMany({
        where: { userId, ...(currentConversationId ? { id: { not: currentConversationId } } : {}) },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_CONVERSATIONS_LIMIT,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      // Sprint 5C Phase 7 — read-only, structural goal awareness: real, already-stored titles
      // only, never a progress/coaching summary. COMPANION_VISIBLE mirrors Memory's own PRIVATE/
      // COMPANION_ALLOWED precedent (memory-engine.md) — a PRIVATE goal is never referenced here.
      this.prisma.goal.findMany({
        where: { userId, status: 'ACTIVE', visibility: 'COMPANION_VISIBLE' },
        orderBy: { createdAt: 'desc' },
        take: ACTIVE_GOALS_LIMIT,
        select: { title: true },
      }),
      // Sprint 6 Phase 7 — read-only Tarot bridge: the real cards/orientations and the real
      // already-generated interpretation of the user's most recent visible reading, never
      // re-interpreted or re-drawn here. COMPANION_VISIBLE mirrors the same Goal/Memory precedent.
      this.prisma.tarotReading.findFirst({
        where: { userId, status: 'ACTIVE', visibility: 'COMPANION_VISIBLE' },
        orderBy: { createdAt: 'desc' },
        include: { cards: { include: { card: true }, orderBy: { position: 'asc' } } },
      }),
      // Sprint 8 Phase 9 — read-only Numerology bridge: the real, already-calculated core numbers
      // and the real already-generated interpretation of the user's most recent visible reading,
      // never recalculated or edited here. Mirrors the Tarot bridge immediately above exactly.
      this.prisma.numerologyReading.findFirst({
        where: { userId, status: 'ACTIVE', visibility: 'COMPANION_VISIBLE' },
        orderBy: { createdAt: 'desc' },
        include: { values: { orderBy: { order: 'asc' } } },
      }),
    ]);

    const now = new Date();

    return {
      displayName: user.displayName,
      timezone: user.profile?.timezone ?? null,
      locale: user.profile?.locale ?? null,
      pronouns: user.profile?.pronouns ?? null,
      onboardingCompleted: user.onboardingCompletedAt !== null,
      memoryPreference: user.preference?.memoryPreference ?? 'ASK_BEFORE_SAVING',
      reflectionFrequency: user.preference?.reflectionFrequency ?? 'NOT_SURE_YET',
      recentActivityLabels: recentActivity.map((event) => event.label),
      recentConversationSummaries: otherConversations
        .filter((c) => c.messages.length > 0)
        .map((c) => ({
          title: c.title,
          lastMessageExcerpt: excerpt(c.messages[0]!.content),
          updatedAt: c.updatedAt.toISOString(),
        })),
      activeGoalTitles: activeGoals.map((g) => g.title),
      latestTarotReading: latestTarotReading
        ? {
            cardNames: latestTarotReading.cards.map((rc) => `${rc.card.name}${rc.isReversed ? ' (reversed)' : ''}`),
            interpretation: latestTarotReading.interpretation,
            createdAt: latestTarotReading.createdAt.toISOString(),
          }
        : null,
      latestNumerologyReading: latestNumerologyReading
        ? {
            values: latestNumerologyReading.values.map((v) => ({ type: v.type, value: v.value, isMasterNumber: v.isMasterNumber })),
            interpretation: latestNumerologyReading.interpretation,
            createdAt: latestNumerologyReading.createdAt.toISOString(),
          }
        : null,
      currentTimeIso: now.toISOString(),
      currentTimeLabel: formatTimeLabel(now, user.profile?.timezone ?? undefined),
    };
  }
}

function formatTimeLabel(date: Date, timezone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    }).format(date);
  } catch {
    // Invalid/unknown timezone string — fall back to UTC rather than throwing.
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(date);
  }
}
