import { ReportReadinessService } from './report-readiness.service';

interface ReadinessFixture {
  natalChart?: { id: string } | null;
  numerology?: { id: string } | null;
  tarotCount?: number;
  /** Distinct types of the user's ACCEPTED memories — what the service actually reads before
   * asking MemoryConsentService whether any of them may still be used. */
  memoryTypes?: string[];
}

function makePrismaMock(overrides: ReadinessFixture) {
  return {
    natalChart: { findFirst: jest.fn(async () => overrides.natalChart ?? null) },
    numerologyReading: { findFirst: jest.fn(async () => overrides.numerology ?? null) },
    tarotReading: { count: jest.fn(async () => overrides.tarotCount ?? 0) },
    memory: { findMany: jest.fn(async () => (overrides.memoryTypes ?? []).map((type) => ({ type }))) },
  };
}

function makeConsentMock(allowed: boolean | Record<string, boolean> = true) {
  return {
    canAccept: jest.fn(async (_userId: string, type: string) => ({
      allowed: typeof allowed === 'boolean' ? allowed : (allowed[type] ?? false),
    })),
  };
}

function makeService(overrides: ReadinessFixture, consent = makeConsentMock()) {
  return new ReportReadinessService(makePrismaMock(overrides) as never, consent as never);
}

describe('ReportReadinessService', () => {
  it('is not ready when both Natal Chart and Numerology are missing', async () => {
    const result = await makeService({}).check('user-1');
    expect(result.ready).toBe(false);
    expect(result.natalChart.available).toBe(false);
    expect(result.numerology.available).toBe(false);
  });

  it('is not ready when only Natal Chart exists (Numerology missing) — no partial readiness', async () => {
    const result = await makeService({ natalChart: { id: 'natal-1' } }).check('user-1');
    expect(result.ready).toBe(false);
    expect(result.natalChart.available).toBe(true);
    expect(result.numerology.available).toBe(false);
  });

  it('is not ready when only Numerology exists (Natal Chart missing) — no partial readiness', async () => {
    const result = await makeService({ numerology: { id: 'num-1' } }).check('user-1');
    expect(result.ready).toBe(false);
  });

  it('is ready when both required sources exist, regardless of Tarot/Memory', async () => {
    const result = await makeService({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, tarotCount: 0, memoryTypes: [] }).check('user-1');
    expect(result.ready).toBe(true);
    expect(result.natalChart.sourceId).toBe('natal-1');
    expect(result.numerology.sourceId).toBe('num-1');
    expect(result.tarot.available).toBe(false);
    expect(result.memory.available).toBe(false);
  });

  it('reports Tarot/Memory as available (optional enrichment) when present, without affecting readiness', async () => {
    const result = await makeService({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, tarotCount: 3, memoryTypes: ['PREFERENCE'] }).check('user-1');
    expect(result.ready).toBe(true);
    expect(result.tarot.available).toBe(true);
    expect(result.tarot.count).toBe(3);
    expect(result.memory.available).toBe(true);
  });

  it('caps the reported Tarot count at the lookback window, never an unbounded number', async () => {
    const result = await makeService({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, tarotCount: 500 }).check('user-1');
    expect(result.tarot.count).toBeLessThanOrEqual(5);
  });

  it('does not claim Memory is available when current consent denies every accepted memory', async () => {
    const consent = makeConsentMock(false);
    const result = await makeService({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, memoryTypes: ['PREFERENCE', 'HEALTH'] }, consent).check('user-1');
    // Readiness must agree with what the snapshot would actually receive from
    // MemoryRetrievalService, which re-checks consent per type — never claim consented context the
    // generated report would then silently contain none of.
    expect(result.memory.available).toBe(false);
    expect(result.ready).toBe(true);
  });

  it('claims Memory is available when at least one accepted memory type is still consented', async () => {
    const consent = makeConsentMock({ PREFERENCE: true, HEALTH: false });
    const result = await makeService({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, memoryTypes: ['HEALTH', 'PREFERENCE'] }, consent).check('user-1');
    expect(result.memory.available).toBe(true);
  });

  it('never asks about consent at all when the user has no accepted memories', async () => {
    const consent = makeConsentMock(true);
    const result = await makeService({ natalChart: { id: 'natal-1' }, numerology: { id: 'num-1' }, memoryTypes: [] }, consent).check('user-1');
    expect(result.memory.available).toBe(false);
    expect(consent.canAccept).not.toHaveBeenCalled();
  });
});
