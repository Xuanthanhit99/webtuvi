import { Injectable } from '@nestjs/common';
import type { Memory, MemoryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryConflictService } from '../../memory/conflict/memory-conflict.service';
import { MemoryConsentService } from '../../memory/consent/memory-consent.service';
import type { ReflectionUserData } from '../reflection.types';

/** Same bound Memory Intelligence uses for its own O(n²) pairwise scans (see
 * memory-intelligence.md "Known limitations") — fine at this sprint's expected scale, would need
 * a smarter candidate-generation step if a single user's data grows far past this. */
const MEMORY_BOUND = 500;
const JOURNAL_BOUND = 300;
const ACTIVITY_BOUND = 300;
const COMPANION_MESSAGE_BOUND = 300;

/** How far back the rule engine looks. Long enough for LongInactivityRule to see a real gap,
 * bounded so this stays a fixed-cost read rather than an unbounded table scan. */
const LOOKBACK_DAYS = 180;

const GOAL_RELATED_MEMORY_TYPES = ['GOAL', 'ACHIEVEMENT', 'CHALLENGE'] as const;

/**
 * Fetches one bounded, deterministic snapshot of a user's data across every Reflection data
 * source (Phase 2) — Journal, Memory, Activity, Companion. "Goals" are never fetched separately;
 * see docs/progress/sprint-4b-progress.md "Goals" note and reflection.types.ts.
 *
 * Deliberately reads only content the user has already confirmed/finished, never in-progress
 * work: journal entries must be `PUBLISHED` (a `DRAFT` is unfinished — reflecting on it would be
 * noticing a pattern the user hasn't actually said anything about yet), memories must be
 * `ACCEPTED` (mirrors MemoryRetrievalService's own hard status exclusion), and companion messages
 * are the user's own (`role: 'USER'`) turns only — never an assistant reply.
 */
@Injectable()
export class ReflectionDataSourceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryConflicts: MemoryConflictService,
    private readonly memoryConsent: MemoryConsentService,
  ) {}

  async fetch(userId: string): Promise<ReflectionUserData> {
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const [journals, acceptedMemories, activityEvents, companionMessages] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId, state: 'PUBLISHED', createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: JOURNAL_BOUND,
      }),
      this.prisma.memory.findMany({
        where: { userId, status: 'ACCEPTED', createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: MEMORY_BOUND,
      }),
      this.prisma.activityEvent.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: ACTIVITY_BOUND,
      }),
      this.prisma.conversationMessage.findMany({
        where: { role: 'USER', createdAt: { gte: since }, conversation: { userId } },
        orderBy: { createdAt: 'desc' },
        take: COMPANION_MESSAGE_BOUND,
      }),
    ]);

    // Re-checked against the user's *current* consent settings, not just their ACCEPTED status —
    // the same per-distinct-type re-check MemoryRetrievalService already performs for Companion
    // context assembly (memory-intelligence.md "Retrieval algorithm" step 2). A memory whose type
    // has since been set to DENY_TYPE/DISABLED (or, for HEALTH, lost its explicit ALLOW_TYPE) must
    // never seed a *new* Reflection finding, even though the Memory row itself stays visible
    // elsewhere in the product — the same disclosed distinction Memory Intelligence already draws.
    const memories = await this.filterByCurrentConsent(userId, acceptedMemories);

    const goalMemories = memories.filter((memory) =>
      (GOAL_RELATED_MEMORY_TYPES as readonly string[]).includes(memory.type),
    );
    const goalMemoryIds = new Set(goalMemories.map((memory) => memory.id));

    // Reuses Sprint 3B's existing deterministic conflict detection rather than reimplementing
    // contradiction detection — see reflection-foundation.md "Rule engine" / GoalRegressionRule.
    // Only CONFLICT (unresolved contradiction) counts as a regression signal; SUPERSEDED (a clear
    // replacement, e.g. "moved to") is not a regression.
    const conflicts = await this.memoryConflicts.detectForUser(userId);
    const goalConflicts = conflicts
      .filter((c) => c.status === 'CONFLICT' && goalMemoryIds.has(c.memoryAId) && goalMemoryIds.has(c.memoryBId))
      .map((c) => ({ id: c.id, memoryAId: c.memoryAId, memoryBId: c.memoryBId, reason: c.reason, detectedAt: new Date(c.detectedAt) }));

    return { userId, journals, memories, goalMemories, activityEvents, companionMessages, goalConflicts };
  }

  /** Mirrors MemoryRetrievalService.filterByCurrentConsent — one canAccept() call per distinct
   * type present, not per row. */
  private async filterByCurrentConsent(userId: string, memories: Memory[]): Promise<Memory[]> {
    const distinctTypes = [...new Set(memories.map((m) => m.type))];
    const allowedByType = new Map<MemoryType, boolean>();
    for (const type of distinctTypes) {
      const decision = await this.memoryConsent.canAccept(userId, type);
      allowedByType.set(type, decision.allowed);
    }
    return memories.filter((memory) => allowedByType.get(memory.type) === true);
  }
}
