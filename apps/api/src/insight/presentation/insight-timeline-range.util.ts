import { BadRequestException } from '@nestjs/common';
import type { InsightTimelineRange } from './insight-presentation.types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Resolves the four fixed Timeline ranges (Phase 4) into a concrete `[from, to]` window, relative
 * to `now` (injectable for deterministic tests). `custom` requires both `from` and `to` from the
 * caller — never guessed. */
export function resolveTimelineRange(
  range: InsightTimelineRange,
  from: string | undefined,
  to: string | undefined,
  now: Date = new Date(),
): { from: Date; to: Date } {
  if (range === 'custom') {
    if (!from || !to) {
      throw new BadRequestException({ code: 'INSIGHT_TIMELINE_RANGE_REQUIRED', message: 'A custom range requires both from and to.' });
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException({ code: 'INSIGHT_TIMELINE_RANGE_INVALID', message: 'from must be before to.' });
    }
    return { from: fromDate, to: toDate };
  }

  if (range === 'today') {
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return { from: startOfDay, to: now };
  }

  const days = range === 'month' ? 30 : 7;
  return { from: new Date(now.getTime() - days * DAY_MS), to: now };
}
