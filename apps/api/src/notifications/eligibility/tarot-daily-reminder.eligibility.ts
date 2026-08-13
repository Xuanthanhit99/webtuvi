import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getStartOfUtcDay } from './date-key.util';

export interface TarotDailyReminderCandidate {
  userId: string;
  email: string;
}

const BATCH_SIZE = 200;

/**
 * Sprint 11 — deterministic, no I/O beyond Postgres, no AI. A candidate is eligible only if all of
 * the following hold (see docs/architecture/notification-retention.md "Initial retention events"):
 *  1. the account is ACTIVE (never DELETED/SUSPENDED — see §27 "Account deletion");
 *  2. they have drawn Tarot at least once before — Module 19 §4/§12's standing rule that a
 *     Discovery reminder is "never pushed for a user who hasn't shown genuine engagement with that
 *     specific Discovery system," and that a first notification "should not arrive too early";
 *  3. they have not already drawn today's Daily Draw — the exact same status-agnostic
 *     `createdAt >= startOfUtcDay` check `TarotRecordService.assertNoDailyDrawToday` uses, so this
 *     never drifts from the real day-boundary logic that actually gates a re-draw.
 *
 * Preference and dedupe are deliberately NOT checked here — those are the next two pipeline
 * stages (`NotificationPreferencesService`, then `NotificationsService.create`'s DB-unique-
 * constraint dedupe), kept separate so each stage has exactly one job (Sprint 11 brief §2's
 * architecture diagram).
 */
@Injectable()
export class TarotDailyReminderEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Cursor-paginated, bounded per page — never a single unbounded table scan (Sprint 11 brief
   * §10: "no uncontrolled full-user scan"). Yields only the users eligible within each page; a
   * page with zero eligible candidates is simply skipped, not yielded as an empty array. */
  async *findEligibleBatches(now: Date = new Date()): AsyncGenerator<TarotDailyReminderCandidate[]> {
    const startOfDayUtc = getStartOfUtcDay(now);
    let cursor: string | undefined;

    for (;;) {
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE', tarotReadings: { some: {} } },
        select: { id: true, email: true },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (users.length === 0) return;
      cursor = users[users.length - 1]!.id;

      const alreadyDrawnToday = await this.prisma.tarotReading.findMany({
        where: { userId: { in: users.map((u) => u.id) }, type: 'DAILY_DRAW', createdAt: { gte: startOfDayUtc } },
        select: { userId: true },
      });
      const drawnUserIds = new Set(alreadyDrawnToday.map((r) => r.userId));

      const eligible = users.filter((u) => !drawnUserIds.has(u.id)).map((u) => ({ userId: u.id, email: u.email }));
      if (eligible.length > 0) yield eligible;

      if (users.length < BATCH_SIZE) return;
    }
  }
}
