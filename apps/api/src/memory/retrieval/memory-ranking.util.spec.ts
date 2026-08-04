import { rankMemories, type RankableMemory } from './memory-ranking.util';

function item(overrides: Partial<RankableMemory> & { id: string }): RankableMemory {
  return {
    type: 'CUSTOM',
    importanceScore: 0,
    pinned: false,
    referencedCount: 0,
    createdAt: new Date('2026-01-01'),
    lastReferencedAt: null,
    ...overrides,
  };
}

describe('rankMemories', () => {
  it('ranks pinned memories above unpinned ones regardless of importance', () => {
    const items = [item({ id: 'low-pinned', importanceScore: 5, pinned: true }), item({ id: 'high-unpinned', importanceScore: 90 })];
    expect(rankMemories(items).map((i) => i.id)).toEqual(['low-pinned', 'high-unpinned']);
  });

  it('ranks by importanceScore descending when pin status ties', () => {
    const items = [item({ id: 'low', importanceScore: 10 }), item({ id: 'high', importanceScore: 90 })];
    expect(rankMemories(items).map((i) => i.id)).toEqual(['high', 'low']);
  });

  it('breaks an importance tie with goal relation', () => {
    const items = [
      item({ id: 'emotion', importanceScore: 50, type: 'EMOTION' }),
      item({ id: 'goal', importanceScore: 50, type: 'GOAL' }),
    ];
    expect(rankMemories(items).map((i) => i.id)).toEqual(['goal', 'emotion']);
  });

  it('breaks a goal-relation tie with recency (lastReferencedAt preferred over createdAt)', () => {
    const items = [
      item({ id: 'older-ref', importanceScore: 50, lastReferencedAt: new Date('2026-01-01') }),
      item({ id: 'newer-ref', importanceScore: 50, lastReferencedAt: new Date('2026-06-01') }),
    ];
    expect(rankMemories(items).map((i) => i.id)).toEqual(['newer-ref', 'older-ref']);
  });

  it('falls back to createdAt when lastReferencedAt is null', () => {
    const items = [
      item({ id: 'older', importanceScore: 50, createdAt: new Date('2026-01-01') }),
      item({ id: 'newer', importanceScore: 50, createdAt: new Date('2026-06-01') }),
    ];
    expect(rankMemories(items).map((i) => i.id)).toEqual(['newer', 'older']);
  });

  it('breaks a recency tie with referencedCount (frequency) descending', () => {
    const items = [
      item({ id: 'rare', importanceScore: 50, referencedCount: 1 }),
      item({ id: 'frequent', importanceScore: 50, referencedCount: 9 }),
    ];
    expect(rankMemories(items).map((i) => i.id)).toEqual(['frequent', 'rare']);
  });

  it('finally breaks a complete tie with ascending id, deterministically', () => {
    const items = [item({ id: 'zeta' }), item({ id: 'alpha' })];
    expect(rankMemories(items).map((i) => i.id)).toEqual(['alpha', 'zeta']);
    // Order-independence: reversing the input yields the same output.
    expect(rankMemories([...items].reverse()).map((i) => i.id)).toEqual(['alpha', 'zeta']);
  });

  it('does not mutate the input array', () => {
    const items = [item({ id: 'b', importanceScore: 1 }), item({ id: 'a', importanceScore: 99 })];
    const original = [...items];
    rankMemories(items);
    expect(items).toEqual(original);
  });
});
