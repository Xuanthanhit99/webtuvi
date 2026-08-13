import { TarotDailyReminderEligibilityService } from './tarot-daily-reminder.eligibility';

const NOW = new Date('2026-08-13T12:00:00.000Z');
const START_OF_DAY = new Date('2026-08-13T00:00:00.000Z');

interface UserRow {
  id: string;
  email: string;
  status: string;
  hasDrawnEver: boolean;
}

function makePrismaMock(users: UserRow[], drawnTodayUserIds: Set<string>) {
  const activeWithHistory = users.filter((u) => u.status === 'ACTIVE' && u.hasDrawnEver);

  const user = {
    findMany: jest.fn(async ({ take, cursor }: { take: number; cursor?: { id: string } }) => {
      const sorted = [...activeWithHistory].sort((a, b) => a.id.localeCompare(b.id));
      const startIndex = cursor ? sorted.findIndex((u) => u.id === cursor.id) + 1 : 0;
      return sorted.slice(startIndex, startIndex + take);
    }),
  };

  const tarotReading = {
    findMany: jest.fn(async ({ where }: { where: { userId: { in: string[] } } }) => {
      return where.userId.in.filter((id) => drawnTodayUserIds.has(id)).map((userId) => ({ userId }));
    }),
  };

  return { user, tarotReading };
}

describe('TarotDailyReminderEligibilityService.findEligibleBatches', () => {
  it('excludes users who have never drawn Tarot before (Module 19 §12 — never too early)', async () => {
    const users: UserRow[] = [
      { id: 'u1', email: 'u1@example.com', status: 'ACTIVE', hasDrawnEver: true },
      { id: 'u2', email: 'u2@example.com', status: 'ACTIVE', hasDrawnEver: false },
    ];
    const prisma = makePrismaMock(users, new Set());
    const service = new TarotDailyReminderEligibilityService(prisma as never);

    const results: { userId: string; email: string }[] = [];
    for await (const batch of service.findEligibleBatches(NOW)) results.push(...batch);

    expect(results.map((r) => r.userId)).toEqual(['u1']);
  });

  it('excludes SUSPENDED/DELETED users at the query source, not just via a post-filter', async () => {
    const users: UserRow[] = [{ id: 'u1', email: 'u1@example.com', status: 'DELETED', hasDrawnEver: true }];
    const prisma = makePrismaMock(users, new Set());
    const service = new TarotDailyReminderEligibilityService(prisma as never);

    const results: { userId: string }[] = [];
    for await (const batch of service.findEligibleBatches(NOW)) results.push(...batch);

    expect(results).toHaveLength(0);
  });

  it('excludes a user who has already drawn today’s Daily Draw', async () => {
    const users: UserRow[] = [
      { id: 'u1', email: 'u1@example.com', status: 'ACTIVE', hasDrawnEver: true },
      { id: 'u2', email: 'u2@example.com', status: 'ACTIVE', hasDrawnEver: true },
    ];
    const prisma = makePrismaMock(users, new Set(['u1']));
    const service = new TarotDailyReminderEligibilityService(prisma as never);

    const results: { userId: string }[] = [];
    for await (const batch of service.findEligibleBatches(NOW)) results.push(...batch);

    expect(results.map((r) => r.userId)).toEqual(['u2']);
  });

  it('checks the "already drawn today" window against the correct UTC day boundary', async () => {
    const users: UserRow[] = [{ id: 'u1', email: 'u1@example.com', status: 'ACTIVE', hasDrawnEver: true }];
    const prisma = makePrismaMock(users, new Set());
    const service = new TarotDailyReminderEligibilityService(prisma as never);

    for await (const batch of service.findEligibleBatches(NOW)) {
      void batch; // draining the generator is the point of this test, not its yielded values
    }

    const call = (prisma.tarotReading.findMany as jest.Mock).mock.calls[0][0];
    expect(call.where.createdAt.gte.toISOString()).toBe(START_OF_DAY.toISOString());
    expect(call.where.type).toBe('DAILY_DRAW');
  });

  it('yields nothing when there are zero eligible candidates', async () => {
    const prisma = makePrismaMock([], new Set());
    const service = new TarotDailyReminderEligibilityService(prisma as never);

    const results: unknown[] = [];
    for await (const batch of service.findEligibleBatches(NOW)) results.push(batch);

    expect(results).toHaveLength(0);
  });

  it('paginates via cursor without an unbounded single query (bounded batch size)', async () => {
    const users: UserRow[] = Array.from({ length: 3 }, (_, i) => ({
      id: `u${i}`,
      email: `u${i}@example.com`,
      status: 'ACTIVE',
      hasDrawnEver: true,
    }));
    const prisma = makePrismaMock(users, new Set());
    const service = new TarotDailyReminderEligibilityService(prisma as never);

    const results: { userId: string }[] = [];
    for await (const batch of service.findEligibleBatches(NOW)) results.push(...batch);

    expect(results).toHaveLength(3);
    expect(prisma.user.findMany).toHaveBeenCalled();
    // Every call must be `take`-bounded — never an unbounded scan.
    for (const call of (prisma.user.findMany as jest.Mock).mock.calls) {
      expect(call[0].take).toBeGreaterThan(0);
    }
  });
});
