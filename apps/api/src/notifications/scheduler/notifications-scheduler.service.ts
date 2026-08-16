import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/nestjs';
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

  /** The `@Cron`-decorated entry point must never let an exception escape as an unhandled promise
   * rejection — `@nestjs/schedule`'s underlying `cron` library does not catch or log this itself,
   * so an uncaught throw here would silently end that day's entire run with zero operational
   * record beyond a missing log line (Sprint 12 audit §21/§38). This outer try/catch is the
   * durable failure signal for anything that fails outside the per-candidate loop below (e.g. the
   * eligibility query itself, on its very first page). */
  @Cron('0 9 * * *', { name: 'notifications.tarot-daily-reminder' })
  async runTarotDailyReminder(): Promise<void> {
    const dateKey = getUtcDateKey(new Date());
    try {
      await this.evaluateTarotDailyReminder(new Date());
    } catch (error) {
      this.logger.error(
        `notifications.scheduler.tarot_daily_reminder.run_failed date=${dateKey} error=${error instanceof Error ? error.message : 'unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Sprint 12 — scheduler correctness never depends on Sentry (the Logger.error above is
      // the durable signal regardless); this is purely additive visibility. No-ops when Sentry
      // is disabled.
      Sentry.captureException(error, { tags: { scheduler: 'notifications.tarot_daily_reminder', scope: 'run' } });
    }
  }

  /** Separated from the `@Cron` entry point so tests can invoke it directly with a fixed `now`,
   * without needing to fake NestJS's scheduler. */
  async evaluateTarotDailyReminder(now: Date): Promise<{ evaluated: number; created: number; emailed: number; failed: number }> {
    const dateKey = getUtcDateKey(now);
    const dedupeKey = dedupeKeyForTarotDailyReminder(dateKey);
    let evaluated = 0;
    let created = 0;
    let emailed = 0;
    let failed = 0;

    for await (const batch of this.tarotEligibility.findEligibleBatches(now)) {
      for (const candidate of batch) {
        evaluated++;

        // One candidate's failure (a transient DB blip, an unexpected error from
        // NotificationsService.create/delivery) must not abort evaluation of the rest of the
        // batch/page — isolated per-candidate so a single bad row can't silently zero out
        // everyone else's reminder for the day. Never logs email or notification content, only
        // the internal userId (an opaque identifier, not PII) and the error message.
        try {
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
        } catch (error) {
          failed++;
          this.logger.error(
            `notifications.scheduler.tarot_daily_reminder.candidate_failed date=${dateKey} userId=${candidate.userId} error=${error instanceof Error ? error.message : 'unknown'}`,
          );
          Sentry.captureException(error, { tags: { scheduler: 'notifications.tarot_daily_reminder', scope: 'candidate' } });
        }
      }
    }

    this.logger.log(
      `notifications.scheduler.tarot_daily_reminder date=${dateKey} evaluated=${evaluated} created=${created} emailed=${emailed} failed=${failed}`,
    );
    return { evaluated, created, emailed, failed };
  }
}
