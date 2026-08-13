/** Same UTC-day convention as `TarotRecordService.assertNoDailyDrawToday` — a single, deliberate,
 * disclosed simplification (see docs/architecture/notification-retention.md "Timezone behavior"):
 * this sprint has no reliable per-user local-time signal to schedule against (`UserProfile.timezone`
 * is optional and only ever set after a manual profile edit), so "today" means UTC-today for every
 * user, not their own local day. */
export function getStartOfUtcDay(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** `YYYY-MM-DD`, UTC — the date component of a dedupe key, so a scheduler re-run later the same
 * UTC day never mints a second reminder. */
export function getUtcDateKey(now: Date = new Date()): string {
  return getStartOfUtcDay(now).toISOString().slice(0, 10);
}

export function dedupeKeyForTarotDailyReminder(dateKey: string): string {
  return `tarot-daily-reminder:${dateKey}`;
}

export function dedupeKeyForPremiumActivated(orderId: string): string {
  return `premium-activated:${orderId}`;
}
