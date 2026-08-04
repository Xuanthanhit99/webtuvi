import { Injectable } from '@nestjs/common';
import type { JournalEntry, JournalState } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toJournalEntryDto, type JournalEntryDto } from '../journal.mappers';
import type { TimelineGrouping } from './dto/timeline-query.dto';

export interface TimelineParams {
  groupBy?: TimelineGrouping;
  includeArchived?: boolean;
  cursor?: string;
  limit?: number;
}

export interface TimelineItemDto extends JournalEntryDto {
  groupKey: string;
  groupLabel: string;
}

export interface TimelineResult {
  items: TimelineItemDto[];
  nextCursor: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Reverse-chronological, cursor-paginated — the same simple "cursor is the previous page's last
 * `createdAt`" scheme Memory's timeline uses (sufficient at this sprint's scale, no opaque-cursor
 * infrastructure needed). Grouping (day/week/month) is computed per item, not via a separate
 * GROUP BY query, so pagination stays correct across group boundaries — a day/week/month never
 * silently splits a page in a way the client can't reassemble. */
@Injectable()
export class JournalTimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async timeline(userId: string, params: TimelineParams): Promise<TimelineResult> {
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
    const cursorDate = params.cursor ? new Date(params.cursor) : undefined;
    const groupBy = params.groupBy ?? 'day';

    const excludedStates: JournalState[] = params.includeArchived ? ['DELETED'] : ['DELETED', 'ARCHIVED'];

    const rows = await this.prisma.journalEntry.findMany({
      where: {
        userId,
        state: { notIn: excludedStates },
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]!.createdAt.toISOString() : null;

    return { items: page.map((entry) => toTimelineItemDto(entry, groupBy)), nextCursor };
  }
}

function toTimelineItemDto(entry: JournalEntry, groupBy: TimelineGrouping): TimelineItemDto {
  const { key, label } = groupFor(entry.createdAt, groupBy);
  return { ...toJournalEntryDto(entry), groupKey: key, groupLabel: label };
}

function groupFor(date: Date, groupBy: TimelineGrouping): { key: string; label: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (groupBy === 'month') {
    return { key: `${year}-${String(month + 1).padStart(2, '0')}`, label: `${MONTH_NAMES[month]} ${year}` };
  }

  if (groupBy === 'week') {
    const startOfWeek = new Date(year, month, day - date.getDay());
    const key = startOfWeek.toISOString().slice(0, 10);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const label = `Week of ${MONTH_NAMES[startOfWeek.getMonth()]!.slice(0, 3)} ${startOfWeek.getDate()}`;
    return { key, label };
  }

  // day
  const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const today = new Date();
  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === yesterday.getDate();
  const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : `${MONTH_NAMES[month]!.slice(0, 3)} ${day}, ${year}`;
  return { key, label };
}
