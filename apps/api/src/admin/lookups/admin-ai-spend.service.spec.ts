import { AdminAiSpendService } from './admin-ai-spend.service';

describe('AdminAiSpendService', () => {
  function makePrisma(sumUsd: number | null, requestCount: number, failureCount: number) {
    return {
      aIUsage: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { estimatedCostUsd: sumUsd === null ? null : { toNumber: () => sumUsd } },
          _count: { _all: requestCount },
        }),
      },
      providerLog: { count: jest.fn().mockResolvedValue(failureCount) },
    };
  }

  it('returns spend/requests/failures for an unfiltered window', async () => {
    const prisma = makePrisma(1.234567, 42, 3);
    const service = new AdminAiSpendService(prisma as never);
    const result = await service.getSpend({ window: '7d' });
    expect(result).toEqual({
      window: '7d',
      filters: { feature: null, provider: null, userId: null },
      estimatedCostUsd: 1.234567,
      requestCount: 42,
      failureCount: 3,
    });
  });

  it('returns estimatedCostUsd 0, never null/undefined, when there is no usage in the window', async () => {
    const prisma = makePrisma(null, 0, 0);
    const service = new AdminAiSpendService(prisma as never);
    const result = await service.getSpend({ window: 'today' });
    expect(result.estimatedCostUsd).toBe(0);
  });

  it('never computes failureCount when userId is set — ProviderLog has no userId column, so this must be null, not a wrong number', async () => {
    const prisma = makePrisma(0.5, 5, 2);
    const service = new AdminAiSpendService(prisma as never);
    const result = await service.getSpend({ window: 'today', userId: 'user-1' });
    expect(result.failureCount).toBeNull();
    expect(prisma.providerLog.count).not.toHaveBeenCalled();
  });

  it('the response shape has no field capable of holding prompt/completion content', async () => {
    const prisma = makePrisma(0.5, 5, 2);
    const service = new AdminAiSpendService(prisma as never);
    const result = await service.getSpend({ window: 'today' });
    const allowedKeys = ['window', 'filters', 'estimatedCostUsd', 'requestCount', 'failureCount'];
    expect(Object.keys(result).sort()).toEqual(allowedKeys.sort());
  });
});
