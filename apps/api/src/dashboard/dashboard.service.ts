import { Injectable, NotFoundException } from '@nestjs/common';
import type { DashboardViewModelDto } from '@beaconvie/types';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import { ActivitiesService } from '../activities/activities.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function timeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * A deliberately simplified version of docs/reference Module 8 §18's decision
 * engine: it still resolves to exactly one item per optional panel (the one hard
 * invariant that matters), but Sprint 1 has no real memory-significance model,
 * so ranking is recency-based rather than significance-weighted. See
 * docs/architecture/sprint-1-decisions.md.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async getViewModel(userId: string): Promise<DashboardViewModelDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const now = new Date();
    const tod = timeOfDay(now);

    const [memoryHighlight, companionPreview, recentActivity] = await Promise.all([
      this.memoryService.mostRecent(userId),
      this.prisma.companionMessage.findMany({
        where: { userId, context: 'COMPANION' },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.activitiesService.recent(userId, 5),
    ]);

    const justOnboarded =
      user.onboardingCompletedAt !== null && now.getTime() - user.onboardingCompletedAt.getTime() < ONE_DAY_MS;

    let greeting: string;
    let subheadline: string;
    let ctaLabel: string;
    let ctaHref: string;
    let suggestionChip: string | null = null;

    if (justOnboarded) {
      greeting = `Good ${tod}, ${user.displayName}.`;
      subheadline = "Glad you're here — pick up right where we left off, whenever you're ready.";
      ctaLabel = 'Continue the conversation';
      ctaHref = '/companion';
      suggestionChip = 'How has today felt so far?';
    } else if (memoryHighlight) {
      greeting = `Good ${tod}, ${user.displayName}.`;
      subheadline = `Last time, you mentioned: “${memoryHighlight.content.replace(/^Remembered:\s*/, '')}”`;
      ctaLabel = 'Continue the conversation';
      ctaHref = '/companion';
      suggestionChip = 'Want to pick that up again?';
    } else {
      greeting = `${capitalize(tod)}, ${user.displayName}.`;
      subheadline = "We're just getting to know each other — say hello whenever you're ready.";
      ctaLabel = 'Say hello to your Companion';
      ctaHref = '/companion';
    }

    return {
      hero: { greeting, subheadline, ctaLabel, ctaHref },
      companionPanel: {
        previewMessages: companionPreview.reverse().map((m) => ({
          id: m.id,
          role: m.role === 'USER' ? 'user' : 'companion',
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
        suggestionChip,
      },
      memoryHighlight,
      discoverySuggestion: {
        title: 'Discovery',
        description: 'Tarot, your chart, your numbers — on their way.',
        href: '/discover',
        comingSoon: true,
      },
      recentActivity,
    };
  }
}
