import { CostControlService } from './cost-control.service';
import type { ConfigService } from '@nestjs/config';

interface FakeUsageRow {
  userId: string;
  createdAt: Date;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

function makePrismaMock(rows: FakeUsageRow[] = []) {
  return {
    aIUsage: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row: FakeUsageRow = {
          userId: data.userId as string,
          createdAt: new Date(),
          promptTokens: data.promptTokens as number,
          completionTokens: data.completionTokens as number,
          totalTokens: data.totalTokens as number,
          estimatedCostUsd: data.estimatedCostUsd as number,
        };
        rows.push(row);
        return row;
      }),
      count: jest.fn(async ({ where }: { where: { userId: string; createdAt: { gte: Date } } }) =>
        rows.filter((r) => r.userId === where.userId && r.createdAt >= where.createdAt.gte).length,
      ),
      aggregate: jest.fn(async ({ where }: { where: { userId: string; createdAt: { gte: Date } } }) => {
        const matching = rows.filter((r) => r.userId === where.userId && r.createdAt >= where.createdAt.gte);
        return {
          _sum: {
            promptTokens: matching.reduce((sum, r) => sum + r.promptTokens, 0),
            completionTokens: matching.reduce((sum, r) => sum + r.completionTokens, 0),
            totalTokens: matching.reduce((sum, r) => sum + r.totalTokens, 0),
            estimatedCostUsd: matching.reduce((sum, r) => sum + r.estimatedCostUsd, 0),
          },
        };
      }),
    },
  };
}

function makeConfigService(budget: { dailyRequestLimit: number; dailyTokenLimit: number; monthlyTokenLimit: number }): ConfigService {
  return { get: () => ({ ai: { budget } }) } as unknown as ConfigService;
}

describe('CostControlService.checkBudget (Sprint 2B audit Finding 2C)', () => {
  it('allows a generation when the user is well within every limit', async () => {
    const prisma = makePrismaMock();
    const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 50, dailyTokenLimit: 200_000, monthlyTokenLimit: 2_000_000 }));

    expect(await service.checkBudget('user-1')).toEqual({ allowed: true });
  });

  it('blocks with daily_request_limit once today’s completed-generation count reaches the limit', async () => {
    const prisma = makePrismaMock();
    const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 2, dailyTokenLimit: 200_000, monthlyTokenLimit: 2_000_000 }));

    await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 10, completionTokens: 10 });
    await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 10, completionTokens: 10 });

    const result = await service.checkBudget('user-1');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('daily_request_limit');
  });

  it('blocks with daily_token_limit once today’s token total reaches the limit, even under the request-count limit', async () => {
    const prisma = makePrismaMock();
    const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 50, dailyTokenLimit: 100, monthlyTokenLimit: 2_000_000 }));

    await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 60, completionTokens: 60 });

    const result = await service.checkBudget('user-1');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('daily_token_limit');
  });

  it('blocks with monthly_token_limit once this month’s token total reaches the limit', async () => {
    const prisma = makePrismaMock();
    const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 50, dailyTokenLimit: 200_000, monthlyTokenLimit: 100 }));

    await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 60, completionTokens: 60 });

    const result = await service.checkBudget('user-1');
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('monthly_token_limit');
  });

  it('tracks each user’s budget independently', async () => {
    const prisma = makePrismaMock();
    const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 1, dailyTokenLimit: 200_000, monthlyTokenLimit: 2_000_000 }));

    await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 10, completionTokens: 10 });

    expect((await service.checkBudget('user-1')).allowed).toBe(false);
    expect((await service.checkBudget('user-2')).allowed).toBe(true);
  });

  it('record() writes exactly one AIUsage row per call — no duplicate accounting across retries/fallback', async () => {
    const prisma = makePrismaMock();
    const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 50, dailyTokenLimit: 200_000, monthlyTokenLimit: 2_000_000 }));

    await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'openai', model: 'gpt-4o-mini', promptTokens: 5, completionTokens: 5 });

    expect(prisma.aIUsage.create).toHaveBeenCalledTimes(1);
  });

  describe('Sprint 12 release closure — cross-feature budget bypass attack test (CRITICAL)', () => {
    it('a request-limit budget exhausted by Companion alone still blocks a subsequent Tarot/Numerology/Natal Chart generation for the same user — switching features cannot bypass the ceiling', async () => {
      const prisma = makePrismaMock();
      const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 3, dailyTokenLimit: 200_000, monthlyTokenLimit: 2_000_000 }));

      // Exhaust the ceiling using ONLY Companion.
      await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 10, completionTokens: 10 });
      await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 10, completionTokens: 10 });
      await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 10, completionTokens: 10 });

      // Attempting to "switch features" to escape the ceiling must not work — checkBudget has no
      // feature filter, so it must reject regardless of which feature is asking.
      const tarotAttempt = await service.checkBudget('user-1');
      expect(tarotAttempt.allowed).toBe(false);
      if (!tarotAttempt.allowed) expect(tarotAttempt.reason).toBe('daily_request_limit');
    });

    it('a token-limit budget exhausted across a MIX of features (Companion + Tarot + Numerology) blocks a subsequent Natal Chart generation — proves aggregation is truly cross-feature, not per-feature', async () => {
      const prisma = makePrismaMock();
      const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 50, dailyTokenLimit: 150, monthlyTokenLimit: 2_000_000 }));

      await service.record({ userId: 'user-1', feature: 'companion', conversationId: 'c1', provider: 'mock', model: 'mock-model', promptTokens: 30, completionTokens: 20 }); // 50
      await service.record({ userId: 'user-1', feature: 'tarot', sourceId: 'reading-1', provider: 'mock', model: 'mock-model', promptTokens: 30, completionTokens: 20 }); // +50 = 100
      await service.record({ userId: 'user-1', feature: 'numerology', sourceId: 'reading-2', provider: 'mock', model: 'mock-model', promptTokens: 30, completionTokens: 20 }); // +50 = 150

      // Natal Chart is the 4th feature and has never itself recorded a single row for this user —
      // if budgets were mistakenly per-feature, Natal Chart would see 0 usage and be allowed. The
      // real, correct behavior: the shared ceiling is already exhausted by the other three.
      const natalChartAttempt = await service.checkBudget('user-1');
      expect(natalChartAttempt.allowed).toBe(false);
      if (!natalChartAttempt.allowed) expect(natalChartAttempt.reason).toBe('daily_token_limit');
    });

    it('conversely, a user well within budget on every feature combined is allowed, regardless of which feature is asking', async () => {
      const prisma = makePrismaMock();
      const service = new CostControlService(prisma as never, makeConfigService({ dailyRequestLimit: 50, dailyTokenLimit: 200_000, monthlyTokenLimit: 2_000_000 }));

      await service.record({ userId: 'user-1', feature: 'natal_chart', sourceId: 'chart-1', provider: 'mock', model: 'mock-model', promptTokens: 10, completionTokens: 10 });

      expect((await service.checkBudget('user-1')).allowed).toBe(true);
    });
  });
});
