import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminNotificationHealthDto, AdminNotificationHealthWindowDto } from '../admin.types';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Interim Sprint — Admin Operator Tooling. Aggregates real, already-persisted `Notification` rows
 * (`type` × `emailStatus`) — never a fabricated metric. Deliberately does NOT report whether the
 * daily scheduler job itself ran: that telemetry is not persisted anywhere today (see
 * `NotificationsSchedulerService` — it only logs a structured line and, on failure, a Sentry
 * breadcrumb). See docs/audit/admin-operator-tooling-pre-implementation-audit.md §8 — building a new
 * `SchedulerRunLog` table for that signal is an explicitly deferred, separate product decision, not
 * silently added here.
 */
@Injectable()
export class AdminNotificationHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<AdminNotificationHealthDto> {
    const now = Date.now();
    const [last24h, last7d] = await Promise.all([
      this.groupCounts(new Date(now - DAY_MS)),
      this.groupCounts(new Date(now - 7 * DAY_MS)),
    ]);

    return { schedulerRunTelemetry: 'NOT_COLLECTED', last24h, last7d };
  }

  private async groupCounts(since: Date): Promise<AdminNotificationHealthWindowDto[]> {
    const rows = await this.prisma.notification.groupBy({
      by: ['type', 'emailStatus'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });
    return rows.map((row) => ({ type: row.type, emailStatus: row.emailStatus, count: row._count._all }));
  }
}
