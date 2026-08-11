import { Injectable, NotFoundException } from '@nestjs/common';
import type { DashboardViewModelDto } from '@beaconvie/types';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import { MemoryRecordService } from '../memory/record/memory-record.service';
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
    private readonly memoryRecordService: MemoryRecordService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  async getViewModel(userId: string): Promise<DashboardViewModelDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const now = new Date();
    const tod = timeOfDay(now);

    const [recentMemory, legacyMemoryNote, latestConversation, recentActivity, tarotReading, numerologyReading] =
      await Promise.all([
        // Sprint 3A: the real, accepted Memory model takes priority over the
        // legacy MemoryNote fallback below — only ever a genuinely accepted
        // memory, never a candidate/archived/deleted one. See
        // docs/architecture/memory-engine.md "Dashboard integration".
        this.memoryRecordService.mostRecentAccepted(userId),
        this.memoryService.mostRecent(userId),
        // Sprint 2B: previously read companionMessage(context='COMPANION') directly;
        // now sourced from the real Conversation model (Companion Core) — see
        // docs/architecture/companion-core.md "Dashboard integration".
        this.prisma.conversation.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 3 } },
        }),
        this.activitiesService.recent(userId, 5),
        // Sprint 8.5 remediation: existence-only checks (not full reads) so the hero CTA can tell a
        // user who has never tried Discovery apart from one who has, instead of always pointing at
        // Companion — see the `hasTriedDiscovery` branch below.
        this.prisma.tarotReading.findFirst({ where: { userId }, select: { id: true } }),
        this.prisma.numerologyReading.findFirst({ where: { userId }, select: { id: true } }),
      ]);
    const memoryHighlight = recentMemory
      ? { content: recentMemory.summary, createdAt: recentMemory.createdAt }
      : legacyMemoryNote;
    const companionPreview = latestConversation?.messages ?? [];

    const justOnboarded =
      user.onboardingCompletedAt !== null && now.getTime() - user.onboardingCompletedAt.getTime() < ONE_DAY_MS;
    const hasTriedDiscovery = !!tarotReading || !!numerologyReading;

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
    } else if (!hasTriedDiscovery) {
      // Landing copy and onboarding both frame Discovery (a real Tarot draw or Numerology
      // reading) as the product's starting point — a brand-new user who hasn't tried either yet
      // (e.g. they skipped it during onboarding) is pointed there rather than at an empty
      // Companion chat, matching the actual first-run experience the product promises.
      greeting = `${capitalize(tod)}, ${user.displayName}.`;
      subheadline = 'Start with a real Tarot draw or a real Numerology reading — your Companion picks up from there.';
      ctaLabel = 'Start Discovery';
      ctaHref = '/discover';
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
          role: m.role === 'USER' ? ('user' as const) : ('companion' as const),
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
        suggestionChip,
      },
      memoryHighlight,
      // Sprint 8 release-closure fix: this was a static, hardcoded object never updated as
      // Discovery systems actually shipped — it still claimed "on their way" for Tarot (live
      // since Sprint 6) and Numerology (live since Sprint 8) alike. Natal Chart/Eastern Horoscope
      // remain genuinely pending, so `comingSoon` now reflects the section honestly rather than
      // being permanently true.
      discoverySuggestion: {
        title: 'Discovery',
        description: 'A real Tarot draw and a real Numerology reading — your chart is on its way.',
        href: '/discover',
        comingSoon: false,
      },
      recentActivity,
    };
  }
}
