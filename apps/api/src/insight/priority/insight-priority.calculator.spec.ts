import { calculateInsightPriority, explainInsightPriorityFactors } from './insight-priority.calculator';
import type { InsightPriorityHints } from '../insight.types';

const BASE: InsightPriorityHints = {
  evidenceCount: 1,
  averageReflectionScore: 0,
  maxReflectionScore: 0,
  hasContinuesOrRepeats: false,
  sameCategoryCount: 1,
  isGoalRelevant: false,
  hasActivitySource: false,
  journalBackedEvidenceCount: 0,
  averageMemoryImportance: null,
};

describe('calculateInsightPriority', () => {
  it('returns 0 with no contributing factors', () => {
    const result = calculateInsightPriority(BASE);
    expect(result.priority).toBe(0);
    expect(result.factors).toEqual({});
  });

  it('awards frequency for each evidence beyond the first, capped', () => {
    const result = calculateInsightPriority({ ...BASE, evidenceCount: 10 });
    expect(result.factors.frequency).toBe(24);
  });

  it('awards strong consistency for CONTINUES/REPEATS, weak consistency otherwise', () => {
    const strong = calculateInsightPriority({ ...BASE, hasContinuesOrRepeats: true });
    expect(strong.factors.consistency).toBe(15);

    const weak = calculateInsightPriority({ ...BASE, sameCategoryCount: 2 });
    expect(weak.factors.consistency).toBe(6);

    const none = calculateInsightPriority({ ...BASE, sameCategoryCount: 1 });
    expect(none.factors.consistency).toBeUndefined();
  });

  it('scales reflection score, capped', () => {
    const result = calculateInsightPriority({ ...BASE, averageReflectionScore: 100 });
    expect(result.factors.reflectionScore).toBe(30);
  });

  it('awards goal relevance and activity flatly', () => {
    const result = calculateInsightPriority({ ...BASE, isGoalRelevant: true, hasActivitySource: true });
    expect(result.factors.goalRelevance).toBe(15);
    expect(result.factors.activity).toBe(10);
  });

  it('awards journal density, capped', () => {
    const result = calculateInsightPriority({ ...BASE, journalBackedEvidenceCount: 10 });
    expect(result.factors.journalDensity).toBe(16);
  });

  it('scales memory importance only when present, capped', () => {
    const withImportance = calculateInsightPriority({ ...BASE, averageMemoryImportance: 100 });
    expect(withImportance.factors.memoryImportance).toBe(20);

    const withoutImportance = calculateInsightPriority({ ...BASE, averageMemoryImportance: null });
    expect(withoutImportance.factors.memoryImportance).toBeUndefined();
  });

  it('clamps the total at 100', () => {
    const result = calculateInsightPriority({
      evidenceCount: 20,
      averageReflectionScore: 100,
      maxReflectionScore: 100,
      hasContinuesOrRepeats: true,
      sameCategoryCount: 20,
      isGoalRelevant: true,
      hasActivitySource: true,
      journalBackedEvidenceCount: 20,
      averageMemoryImportance: 100,
    });
    expect(result.priority).toBeLessThanOrEqual(100);
  });
});

describe('explainInsightPriorityFactors', () => {
  it('returns one sentence per factor, ordered by contribution descending', () => {
    const lines = explainInsightPriorityFactors({ reflectionScore: 10, frequency: 24, activity: 10 });
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('multiple related reflections');
  });

  it('returns an empty array for no factors', () => {
    expect(explainInsightPriorityFactors({})).toEqual([]);
  });
});
