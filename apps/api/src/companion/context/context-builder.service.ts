import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivitiesService } from '../../activities/activities.service';
import type { ConversationContext } from './context.types';

const RECENT_CONVERSATIONS_LIMIT = 3;
const EXCERPT_MAX_CHARS = 140;

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

    const [recentActivity, otherConversations] = await Promise.all([
      this.activitiesService.recent(userId, 5),
      this.prisma.conversation.findMany({
        where: { userId, ...(currentConversationId ? { id: { not: currentConversationId } } : {}) },
        orderBy: { updatedAt: 'desc' },
        take: RECENT_CONVERSATIONS_LIMIT,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
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
