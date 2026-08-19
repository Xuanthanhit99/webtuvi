import { AdminNotificationHealthService } from './admin-notification-health.service';

describe('AdminNotificationHealthService', () => {
  it('aggregates real Notification rows by type/emailStatus for both windows, and marks scheduler-run telemetry as not collected', async () => {
    const groupBy = jest
      .fn()
      .mockResolvedValueOnce([{ type: 'tarot.daily_reminder', emailStatus: 'SENT', _count: { _all: 12 } }])
      .mockResolvedValueOnce([
        { type: 'tarot.daily_reminder', emailStatus: 'SENT', _count: { _all: 80 } },
        { type: 'premium.activated', emailStatus: 'FAILED', _count: { _all: 1 } },
      ]);
    const prisma = { notification: { groupBy } };
    const service = new AdminNotificationHealthService(prisma as never);

    const result = await service.getHealth();

    expect(result.schedulerRunTelemetry).toBe('NOT_COLLECTED');
    expect(result.last24h).toEqual([{ type: 'tarot.daily_reminder', emailStatus: 'SENT', count: 12 }]);
    expect(result.last7d).toEqual([
      { type: 'tarot.daily_reminder', emailStatus: 'SENT', count: 80 },
      { type: 'premium.activated', emailStatus: 'FAILED', count: 1 },
    ]);
    expect(groupBy).toHaveBeenCalledTimes(2);
  });

  it('never queries or returns Notification.body/title — this service only ever groups by type/emailStatus', async () => {
    const groupBy = jest.fn().mockResolvedValue([]);
    const service = new AdminNotificationHealthService({ notification: { groupBy } } as never);
    await service.getHealth();
    for (const call of groupBy.mock.calls) {
      const args = call[0] as { by: string[] };
      expect(args.by).toEqual(['type', 'emailStatus']);
    }
  });
});
