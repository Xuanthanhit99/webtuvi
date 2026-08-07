import { drawCards } from './tarot-draw-engine.util';

const DECK = Array.from({ length: 78 }, (_, i) => `card-${String(i).padStart(2, '0')}`);

describe('drawCards', () => {
  it('is deterministic — the same seed and input always produce the same draw', () => {
    const first = drawCards({ cardIds: DECK, count: 3, seed: 'fixed-seed' });
    const second = drawCards({ cardIds: DECK, count: 3, seed: 'fixed-seed' });
    expect(first).toEqual(second);
  });

  it('different seeds produce different draws (with overwhelming probability)', () => {
    const a = drawCards({ cardIds: DECK, count: 3, seed: 'seed-a' });
    const b = drawCards({ cardIds: DECK, count: 3, seed: 'seed-b' });
    expect(a.drawnCards).not.toEqual(b.drawnCards);
  });

  it('never draws a duplicate card', () => {
    const result = drawCards({ cardIds: DECK, count: 10, seed: 'dup-check' });
    const ids = result.drawnCards.map((c) => c.cardId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never draws a card outside the supplied pool', () => {
    const result = drawCards({ cardIds: DECK, count: 5, seed: 'pool-check' });
    for (const card of result.drawnCards) {
      expect(DECK).toContain(card.cardId);
    }
  });

  it('shuffledCardIds contains every input card exactly once, just reordered', () => {
    const result = drawCards({ cardIds: DECK, count: 1, seed: 'full-shuffle-check' });
    expect([...result.shuffledCardIds].sort()).toEqual([...DECK].sort());
  });

  it('respects allowReversed: false — every card is upright', () => {
    const result = drawCards({ cardIds: DECK, count: 20, seed: 'no-reverse', allowReversed: false });
    expect(result.drawnCards.every((c) => c.isReversed === false)).toBe(true);
  });

  it('with allowReversed: true (default), produces a mix of upright and reversed over many draws', () => {
    const result = drawCards({ cardIds: DECK, count: 78, seed: 'reverse-mix' });
    const reversedCount = result.drawnCards.filter((c) => c.isReversed).length;
    expect(reversedCount).toBeGreaterThan(0);
    expect(reversedCount).toBeLessThan(78);
  });

  it('auto-generates a seed when none is supplied, and returns it', () => {
    const result = drawCards({ cardIds: DECK, count: 1 });
    expect(result.seed).toBeTruthy();
    expect(typeof result.seed).toBe('string');
  });

  it('throws for count < 1', () => {
    expect(() => drawCards({ cardIds: DECK, count: 0, seed: 'x' })).toThrow();
  });

  it('throws for count exceeding the pool size', () => {
    expect(() => drawCards({ cardIds: DECK, count: 79, seed: 'x' })).toThrow();
  });

  it('reproducibility holds for the full 78-card deck and every reading size this sprint supports', () => {
    for (const count of [1, 3]) {
      const a = drawCards({ cardIds: DECK, count, seed: `repro-${count}` });
      const b = drawCards({ cardIds: DECK, count, seed: `repro-${count}` });
      expect(a).toEqual(b);
    }
  });
});
