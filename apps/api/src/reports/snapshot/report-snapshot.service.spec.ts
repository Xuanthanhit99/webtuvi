import { readFileSync } from 'fs';
import { ReportSnapshotService } from './report-snapshot.service';

const NATAL_CHART = {
  id: 'natal-1',
  calculationVersion: 'natal-v1',
  engineVersion: 'engine-v1',
  ascendantSign: 'LEO',
  ascendantDegreeInSign: 12,
  midheavenSign: null,
  midheavenDegreeInSign: null,
  placements: [{ body: 'SUN', sign: 'ARIES', degreeInSign: 5, house: 1, retrograde: false }],
  aspects: [],
};

const NUMEROLOGY_READING = {
  id: 'num-1',
  calculationVersion: 'numerology-v1',
  values: [{ type: 'LIFE_PATH', value: 7, isMasterNumber: false }],
};

function makeDeps(overrides: { tarotRows?: unknown[]; memoryItems?: unknown[] } = {}) {
  const prisma = {
    natalChart: { findUniqueOrThrow: jest.fn(async () => NATAL_CHART) },
    numerologyReading: { findUniqueOrThrow: jest.fn(async () => NUMEROLOGY_READING) },
    tarotReading: { findMany: jest.fn(async () => overrides.tarotRows ?? []) },
  };
  const memoryRetrieval = { recommend: jest.fn(async () => ({ items: overrides.memoryItems ?? [] })) };
  return { prisma, memoryRetrieval };
}

describe('ReportSnapshotService', () => {
  it('builds required Natal Chart and Numerology facts from the exact source ids given', async () => {
    const deps = makeDeps();
    const service = new ReportSnapshotService(deps.prisma as never, deps.memoryRetrieval as never);
    const snapshot = await service.build('user-1', 'natal-1', 'num-1');

    expect(snapshot.natalChart.sourceId).toBe('natal-1');
    expect(snapshot.natalChart.calculationVersion).toBe('natal-v1');
    expect(snapshot.natalChart.placements).toHaveLength(1);
    expect(snapshot.numerology.sourceId).toBe('num-1');
    expect(snapshot.numerology.values[0]?.value).toBe(7);
  });

  it('leaves tarot/memory null (not an empty-array placeholder) when neither has any content', async () => {
    const deps = makeDeps({ tarotRows: [], memoryItems: [] });
    const service = new ReportSnapshotService(deps.prisma as never, deps.memoryRetrieval as never);
    const snapshot = await service.build('user-1', 'natal-1', 'num-1');
    expect(snapshot.tarot).toBeNull();
    expect(snapshot.memory).toBeNull();
  });

  it('includes bounded tarot context when readings exist', async () => {
    const deps = makeDeps({
      tarotRows: [{ id: 't1', createdAt: new Date(), type: 'SINGLE_CARD', cards: [{ position: 1, positionLabel: null, isReversed: false, card: { name: 'The Fool' } }] }],
    });
    const service = new ReportSnapshotService(deps.prisma as never, deps.memoryRetrieval as never);
    const snapshot = await service.build('user-1', 'natal-1', 'num-1');
    expect(snapshot.tarot).not.toBeNull();
    expect(snapshot.tarot?.[0]?.cards[0]?.name).toBe('The Fool');
  });

  it('includes bounded memory context when consented memories exist', async () => {
    const deps = makeDeps({ memoryItems: [{ title: 'A memory', summary: 'A summary' }] });
    const service = new ReportSnapshotService(deps.prisma as never, deps.memoryRetrieval as never);
    const snapshot = await service.build('user-1', 'natal-1', 'num-1');
    expect(snapshot.memory).toEqual([{ title: 'A memory', summary: 'A summary' }]);
  });

  it('never blocks the snapshot when Memory retrieval throws (mirrors Numerology/Tarot’s own "never blocks" precedent)', async () => {
    const deps = makeDeps();
    deps.memoryRetrieval.recommend = jest.fn(async () => {
      throw new Error('memory service down');
    });
    const service = new ReportSnapshotService(deps.prisma as never, deps.memoryRetrieval as never);
    const snapshot = await service.build('user-1', 'natal-1', 'num-1');
    expect(snapshot.memory).toBeNull();
    expect(snapshot.natalChart.sourceId).toBe('natal-1'); // required sources still succeed
  });

  it('imports nothing from Journal, Reflection, Insight, Review, or Goal (frozen modules excluded by construction)', () => {
    const source = readFileSync(require.resolve('./report-snapshot.service.ts'), 'utf-8');
    for (const forbidden of ['journal', 'reflection', 'insight', 'review', 'goal']) {
      expect(source.toLowerCase()).not.toContain(`'../../${forbidden}`);
    }
  });
});
