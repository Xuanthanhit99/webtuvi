import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TarotDailyReminderEligibilityService } from '../eligibility/tarot-daily-reminder.eligibility';
import { NotificationPreferencesService } from '../preferences/notification-preferences.service';
import { NotificationsService } from '../notifications.service';
import { NotificationDeliveryService } from '../delivery/notification-delivery.service';
import { dedupeKeyForTarotDailyReminder, getUtcDateKey } from '../eligibility/date-key.util';

/**
 * Sprint 11 — the one scheduled evaluation run this sprint introduces (Product Bible Module 19's
 * Notification Intelligence/Timing Engines, deliberately scoped down — see
 * docs/architecture/notification-retention.md "Scheduler architecture" for the full reasoning
 * behind every choice below).
 *
 * Cadence: once daily, 09:00 UTC — a single fixed time, not per-user-timezone-aware (see
 * `date-key.util.ts` and the architecture doc's "Timezone behavior" section for why). Chosen over
 * any finer cadence per the brief's explicit "retention reminders do not need second/minute
 * precision."
 *
 * Duplicate-safety: NOT achieved via a distributed lock (no such infrastructure exists in this
 * repo — see docs/audit/sprint-11-pre-implementation-audit.md §19/§33) but via
 * `NotificationsService.create`'s DB-level `@@unique([userId, dedupeKey])` constraint — if this
 * job somehow ran twice (e.g. two instances during a deploy overlap), the second pass's `create()`
 * calls all no-op safely rather than double-notifying. This is the same idempotency-over-locking
 * design `PaymentWebhookService` already established for this codebase.
 *
 * Restart safety: an in-process `@Cron` job does not persist "it already ran today" — if the
 * process restarts near 09:00 UTC, that day's run may be skipped entirely. Accepted as a
 * documented limitation appropriate to a low-stakes daily reminder (Sprint 11 brief §10: "do not
 * build distributed scheduling infrastructure beyond current scale") rather than solved with new
 * infrastructure this sprint doesn't need.
 */
@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger('NotificationsScheduler');

  constructor(
    private readonly tarotEligibility: TarotDailyReminderEligibilityService,
    private readonly preferences: NotificationPreferencesService,
    private readonly notifications: NotificationsService,
    private readonly delivery: NotificationDeliveryService,
  ) {}

  @Cron('0 9 * * *', { name: 'notifications.tarot-daily-reminder' })
  async runTarotDailyReminder(): Promise<void> {
    await this.evaluateTarotDailyReminder(new Date());
  }

  /** Separated from the `@Cron` entry point so tests can invoke it directly with a fixed `now`,
   * without needing to fake NestJS's scheduler. */
  async evaluateTarotDailyReminder(now: Date): Promise<{ evaluated: number; created: number; emailed: number }> {
    const dateKey = getUtcDateKey(now);
    const dedupeKey = dedupeKeyForTarotDailyReminder(dateKey);
    let evaluated = 0;
    let created = 0;
    let emailed = 0;

    for await (const batch of this.tarotEligibility.findEligibleBatches(now)) {
      for (const candidate of batch) {
        evaluated++;

        // --- Preference/Consent stage: the expected, common outcome is NO_ACTION here. ---
        const prefs = await this.preferences.resolve(candidate.userId);
        if (!prefs.reminderInApp) continue;

        // --- Notification record stage (dedupe enforced at the DB layer inside create()). ---
        const result = await this.notifications.create({
          userId: candidate.userId,
          type: 'tarot.daily_reminder',
          title: "Today's card is ready",
          body: "You haven't drawn your Daily Tarot card yet today — it's still here whenever you'd like it.",
          deepLink: '/discover/tarot',
          dedupeKey,
        });
        if (!result.created) continue; // already notified for this UTC day — safe no-op

        created++;

        // --- Delivery channel stage: EMAIL only, only if the user opted in. ---
        if (prefs.reminderEmail) {
          await this.delivery.deliverEmail(result.notification, candidate.email, "Draw today's card");
          emailed++;
        }
      }
    }

    this.logger.log(`notifications.scheduler.tarot_daily_reminder date=${dateKey} evaluated=${evaluated} created=${created} emailed=${emailed}`);
    return { evaluated, created, emailed };
  }
}
