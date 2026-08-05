import { calculateReflectionScore, explainReflectionScoreFactors } from './reflection-score.calculator';
import type { ReflectionScoreHints } from '../reflection.types';

const NO_HINTS: ReflectionScoreHints = { importanceScore: null, isGoalRelevant: false, hasActivitySource: false, journalSourceCount: 0 };

describe('calculateReflectionScore', () => {
  it('returns 0 with no contributing factors', () => {
    const result = calculateReflectionScore({ sourceCount: 1, daysSinceWindowEnd: 999, hints: NO_HINTS, pinned: false });
    expect(result.score).toBe(0);
    expect(result.factors).toEqual({});
  });

  it('awards frequency for each source beyond the first, capped', () => {
    const result = calculateReflectionScore({ sourceCount: 10, daysSinceWindowEnd: 999, hints: NO_HINTS, pinned: false });
    expect(result.factors.frequency).toBe(24); // capped, not 9*6=54
  });

  it('awards recency that decays to 0 over time', () => {
    const fresh = calculateReflectionScore({ sourceCount: 1, daysSinceWindowEnd: 0, hints: NO_HINTS, pinned: false });
    expect(fresh.factors.recency).toBe(20);

    const old = calculateReflectionScore({ sourceCount: 1, daysSinceWindowEnd: 20, hints: NO_HINTS, pinned: false });
    expect(old.factors.recency).toBeUndefined();
  });

  it('scales importance from the hint', () => {
    const result = calculateReflectionScore({
      sourceCount: 1,
      daysSinceWindowEnd: 999,
      hints: { ...NO_HINTS, importanceScore: 80 },
      pinned: false,
    });
    expect(result.factors.importance).toBe(16); // round(80 * 0.2)
  });

  it('awards goal relevance, journal density (capped), and activity flatly', () => {
    const result = calculateReflectionScore({
      sourceCount: 1,
      daysSinceWindowEnd: 999,
      hints: { importanceScore: null, isGoalRelevant: true, hasActivitySource: true, journalSourceCount: 10 },
      pinned: false,
    });
    expect(result.factors.goalRelevance).toBe(15);
    expect(result.factors.journalDensity).toBe(16); // capped, not 40
    expect(result.factors.activity).toBe(10);
  });

  it('clamps the total at 100', () => {
    const result = calculateReflectionScore({
      sourceCount: 20,
      daysSinceWindowEnd: 0,
      hints: { importanceScore: 100, isGoalRelevant: true, hasActivitySource: true, journalSourceCount: 20 },
      pinned: false,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('pinning floors the score at 70 without lowering an already-higher score', () => {
    const low = calculateReflectionScore({ sourceCount: 1, daysSinceWindowEnd: 999, hints: NO_HINTS, pinned: true });
    expect(low.score).toBe(70);
    expect(low.factors.manualPin).toBe(70);

    const alreadyHigh = calculateReflectionScore({
      sourceCount: 20,
      daysSinceWindowEnd: 0,
      hints: { importanceScore: 100, isGoalRelevant: true, hasActivitySource: true, journalSourceCount: 20 },
      pinned: true,
    });
    expect(alreadyHigh.score).toBe(100);
    expect(alreadyHigh.factors.manualPin).toBeUndefined();
  });
});

describe('explainReflectionScoreFactors', () => {
  it('returns one plain-language sentence per factor, ordered by contribution descending', () => {
    const lines = explainReflectionScoreFactors({ recency: 10, frequency: 24, activity: 10 });
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('multiple related entries');
  });

  it('returns an empty array for no factors', () => {
    expect(explainReflectionScoreFactors({})).toEqual([]);
  });
});
