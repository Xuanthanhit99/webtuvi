import { ReportReadinessService } from './report-readiness.service';

function makePrismaMock(overrides: {
  natalChart?: { id: string } | null;
  numerology?: { id: string } | null;
  tarotCount?: number;
  memoryCount?: number;
}) {
  return {
    natalChart: { findFirst: jest.fn(async () => overrides.natalChart ?? null) },
    numerologyReading: { findFirst: jest.fn(async () => overrides.numerology ?? null) },
    tarotReading: { count: jest.fn(async () => overrides.tarotCount ?? 0) },
    memory: { count: jest.fn(async () => overrides.memoryCount ?? 0) },
  };
}

describe('ReportReadinessService', () => {
  it('is not ready when both Natal Chart and Numerology are missing', async () => {
    const service = new ReportReadinessService(makePrismaMock({}) as never);
    const result = await service.check('user-1');
    expect(result.ready).toBe(false);
    expect(result.natalChart.available).toBe(false);
    expect(result.numerology.available).toBe(false);
  });

  it('is not ready when only Natal Chart exists (Numerology missing) — no partial readiness', async () => {
    const service = new ReportReadinessService(makePrismaMock({ natalChart: { id: 'natal-1' } }) as never);
    const result = await service.check('user-1');
    expect(result.ready).toBe(false);
    expect(result.natalChart.available).toBe(true);
    expect(result.numerology.available).toBe(false);
  });

  it('is not ready when only Numerology exists (Natal Chart missing) — no partial readiness', async () => {
    const service = new ReportReadinessService(makePrismaMock({ numerology: { id: 'num-1' } }) as never);
    const result = await service.check('user-1');
    expect(result.ready).toBe(false);
  });

  it('is ready when both required sources exist, regardless of Tarot/Memory', async () => {
    const service = new ReportReadinessService(
      makePrismaMock({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, tarotCount: 0, memoryCount: 0 }) as never,
    );
    const result = await service.check('user-1');
    expect(result.ready).toBe(true);
    expect(result.natalChart.sourceId).toBe('natal-1');
    expect(result.numerology.sourceId).toBe('num-1');
    expect(result.tarot.available).toBe(false);
    expect(result.memory.available).toBe(false);
  });

  it('reports Tarot/Memory as available (optional enrichment) when present, without affecting readiness', async () => {
    const service = new ReportReadinessService(
      makePrismaMock({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, tarotCount: 3, memoryCount: 5 }) as never,
    );
    const result = await service.check('user-1');
    expect(result.ready).toBe(true);
    expect(result.tarot.available).toBe(true);
    expect(result.tarot.count).toBe(3);
    expect(result.memory.available).toBe(true);
  });

  it('caps the reported Tarot count at the lookback window, never an unbounded number', async () => {
    const service = new ReportReadinessService(
      makePrismaMock({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, tarotCount: 500 }) as never,
    );
    const result = await service.check('user-1');
    expect(result.tarot.count).toBeLessThanOrEqual(5);
  });
});
