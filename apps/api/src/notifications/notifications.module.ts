import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './preferences/notification-preferences.service';
import { TarotDailyReminderEligibilityService } from './eligibility/tarot-daily-reminder.eligibility';
import { NotificationDeliveryService } from './delivery/notification-delivery.service';
import { NotificationsSchedulerService } from './scheduler/notifications-scheduler.service';

/**
 * Sprint 11 — Notification & Retention Foundation (Product Bible Module 19, V1 tier — the only
 * unshipped V1 module per docs/audit/sprint-11-pre-implementation-audit.md). See
 * docs/architecture/notification-retention.md for the full design.
 *
 * `PrismaService`/`MailService` are both `@Global()`-provided elsewhere and don't need to be
 * imported here. `NotificationsService` and `NotificationPreferencesService` are exported so
 * `PaymentModule` can create a `premium.activated` notification from inside
 * `PaymentWebhookService` without a second AI/notification integration.
 */
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationPreferencesService,
    TarotDailyReminderEligibilityService,
    NotificationDeliveryService,
    NotificationsSchedulerService,
  ],
  exports: [NotificationsService, NotificationPreferencesService],
})
export class NotificationsModule {}
