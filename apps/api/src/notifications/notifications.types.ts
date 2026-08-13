import type { NotificationCategory, NotificationClass } from '@prisma/client';

/**
 * Sprint 11 — bounded, application-layer type taxonomy (Product Bible Module 19 §4:
 * "a bounded enum... derive types from real product behavior"). Stored as free text on the
 * `Notification` row (see schema.prisma doc comment) so a new type can ship without a migration,
 * but the set of *valid* types is closed here, not open-ended — `NotificationsService.create()`
 * rejects anything not listed below via TypeScript, and every type maps to exactly one
 * `category`/`class` pair so callers never have to (and can't accidentally mis-)supply them.
 *
 * Deliberately excluded, and why (see docs/architecture/notification-retention.md "Deliberately
 * excluded" for the full reasoning): Journal/Memory "haven't thought about this" reminders (no
 * deterministic, non-speculative trigger exists today — inventing one is explicitly forbidden),
 * generic SECURITY notifications (existing auth flows already email password-reset/verification
 * directly; duplicating them as Notification rows would violate "do not rebuild auth email flows
 * unnecessarily"), Companion/Community/Reports triggers (none of those systems exist/are wired
 * yet).
 */
export const NOTIFICATION_TYPES = ['tarot.daily_reminder', 'premium.activated'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationTypeMeta {
  category: NotificationCategory;
  class: NotificationClass;
}

/**
 * `class` governs preference gating (see NotificationPreferencesService): TRANSACTIONAL
 * notifications ignore preferences entirely and are always created (and, where applicable,
 * always emailed) — never accidentally suppressible, per Module 19 §6. REMINDER notifications are
 * gated by `NotificationPreference.reminderInApp`/`reminderEmail`. PRODUCT is defined for forward
 * compatibility but has no Sprint 11 trigger — see NOTIFICATION_TYPES doc comment above.
 */
export const NOTIFICATION_TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  'tarot.daily_reminder': { category: 'DISCOVERY', class: 'REMINDER' },
  'premium.activated': { category: 'PREMIUM', class: 'TRANSACTIONAL' },
};

export function isTransactional(type: NotificationType): boolean {
  return NOTIFICATION_TYPE_META[type].class === 'TRANSACTIONAL';
}
