import { BadRequestException } from '@nestjs/common';

/**
 * Phase 1 — the three supported windows. `WEEK`/`MONTH` resolve to a stable *calendar* period
 * (ISO week Monday-Sunday / calendar month), not a rolling "last N days from now" — this is what
 * makes `ensureGenerated()` idempotent within the same period: regenerating on Wednesday of the
 * same ISO week reuses the same `windowStart`/`windowEnd` (and therefore the same `dedupeKey`) a
 * regeneration on Friday of that week would, converging on one row that gets richer as the week's
 * real evidence accumulates — the same "upsert by a stable fingerprint" discipline every prior
 * engine in this codebase uses. A rolling window would instead mint a new row on every single read.
 */
export type ReviewWindowKind = 'WEEK' | 'MONTH' | 'CUSTOM';

function startOfIsoWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  return d;
}

function endOfIsoWeek(start: Date): Date {
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(start: Date): Date {
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
  return end;
}

/** Resolves `WEEK`/`MONTH` relative to `now` (injectable for deterministic tests) into their
 * containing calendar period; `CUSTOM` requires both `from` and `to` from the caller, never
 * guessed, mirroring `resolveTimelineRange()`'s own validation (Insight Experience, Sprint 5A). */
export function resolveReviewWindow(
  window: ReviewWindowKind,
  from: string | undefined,
  to: string | undefined,
  now: Date = new Date(),
): { windowStart: Date; windowEnd: Date } {
  if (window === 'CUSTOM') {
    if (!from || !to) {
      throw new BadRequestException({ code: 'REVIEW_WINDOW_RANGE_REQUIRED', message: 'A custom review requires both from and to.' });
    }
    const windowStart = new Date(from);
    const windowEnd = new Date(to);
    if (windowStart.getTime() > windowEnd.getTime()) {
      throw new BadRequestException({ code: 'REVIEW_WINDOW_RANGE_INVALID', message: 'from must be before to.' });
    }
    return { windowStart, windowEnd };
  }

  if (window === 'WEEK') {
    const windowStart = startOfIsoWeek(now);
    return { windowStart, windowEnd: endOfIsoWeek(windowStart) };
  }

  const windowStart = startOfMonth(now);
  return { windowStart, windowEnd: endOfMonth(windowStart) };
}

export function buildReviewDedupeKey(window: ReviewWindowKind, windowStart: Date, windowEnd: Date): string {
  return `${window}:${windowStart.toISOString()}:${windowEnd.toISOString()}`;
}
