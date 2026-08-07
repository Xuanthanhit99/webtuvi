import { buildContribution, buildOverview, buildReview, buildSections, classifySection } from './review-builder.util';
import type { ReviewableItem, ReviewStatistics } from '../review.types';

function item(overrides: Partial<ReviewableItem> = {}): ReviewableItem {
  return {
    sourceType: 'INSIGHT',
    sourceId: 'i1',
    sourceTimestamp: new Date('2026-01-01T00:00:00.000Z'),
    category: 'TOPIC',
    priority: 50,
    reason: 'x',
    evidenceCount: 2,
    ...overrides,
  };
}

const zeroStats: ReviewStatistics = {
  journalCount: 0,
  memoryCreatedCount: 0,
  reflectionCount: 0,
  insightCount: 0,
  activityCount: 0,
  journalingStreakDays: 0,
  companionConversationCount: 0,
};

describe('classifySection', () => {
  it('maps the fixed category table deterministically', () => {
    expect(classifySection('MISMATCH')).toBe('CHALLENGES');
    expect(classifySection('INACTIVITY')).toBe('CHALLENGES');
    expect(classifySection('GOAL')).toBe('ACHIEVEMENTS');
    expect(classifySection('WELLBEING')).toBe('CHANGES');
    expect(classifySection('ALIGNMENT')).toBe('CHANGES');
    expect(classifySection('TOPIC')).toBe('HIGHLIGHTS');
    expect(classifySection('JOURNAL')).toBe('HIGHLIGHTS');
  });
});

describe('buildContribution', () => {
  it('never fabricates wording — reuses the real reason/priority verbatim', () => {
    const c = buildContribution(item({ sourceType: 'INSIGHT', reason: 'Real insight reason', priority: 72, evidenceCount: 3 }));
    expect(c).toBe('Insight: Real insight reason (priority 72). Backed by 3 reflections.');
  });

  it('uses "importance" as the metric label for MEMORY items', () => {
    const c = buildContribution(item({ sourceType: 'MEMORY', reason: 'Ran a marathon', priority: 80, evidenceCount: 0 }));
    expect(c).toBe('Memory: Ran a marathon (importance 80).');
  });

  it('omits the evidence-backing note for REFLECTION/JOURNAL/MEMORY items', () => {
    expect(buildContribution(item({ sourceType: 'REFLECTION', evidenceCount: 5 }))).not.toContain('Backed by');
  });

  it('a singular reflection count reads "1 reflection", not "1 reflections"', () => {
    const c = buildContribution(item({ sourceType: 'INSIGHT', evidenceCount: 1 }));
    expect(c).toContain('Backed by 1 reflection.');
  });
});

describe('buildSections', () => {
  it('groups items into sections by their real category, never a fabricated one', () => {
    const items = [
      item({ sourceId: 'a', category: 'GOAL', priority: 80 }),
      item({ sourceId: 'b', category: 'MISMATCH', priority: 60 }),
      item({ sourceId: 'c', category: 'TOPIC', priority: 40 }),
    ];
    const sections = buildSections(items);
    expect(sections.map((s) => s.type)).toEqual(['HIGHLIGHTS', 'ACHIEVEMENTS', 'CHALLENGES']);
  });

  it('never creates an empty section', () => {
    expect(buildSections([])).toEqual([]);
  });

  it('sorts items within a section by priority descending', () => {
    const items = [item({ sourceId: 'low', category: 'GOAL', priority: 10 }), item({ sourceId: 'high', category: 'GOAL', priority: 90 })];
    const sections = buildSections(items);
    expect(sections[0]!.items.map((i) => i.sourceId)).toEqual(['high', 'low']);
  });

  it('bounds a section to the first 20 items by priority, never silently unbounded', () => {
    const items = Array.from({ length: 25 }, (_, i) => item({ sourceId: `id-${i}`, category: 'TOPIC', priority: i }));
    const sections = buildSections(items);
    expect(sections[0]!.items).toHaveLength(20);
    expect(sections[0]!.items[0]!.priority).toBe(24);
  });

  it('computes a real average priority in the section summary', () => {
    const items = [item({ sourceId: 'a', category: 'TOPIC', priority: 40 }), item({ sourceId: 'b', category: 'TOPIC', priority: 60 })];
    const sections = buildSections(items);
    expect(sections[0]!.summary).toBe('2 items, average priority 50.');
  });
});

describe('buildOverview', () => {
  it('is a fixed template over real statistics, never a generated sentence', () => {
    const stats: ReviewStatistics = { ...zeroStats, journalCount: 3, memoryCreatedCount: 1, insightCount: 2, reflectionCount: 5 };
    const overview = buildOverview('WEEK', stats, []);
    expect(overview).toBe('This week you wrote 3 journal entries, saved 1 memory, and had 2 insights prepared from 5 reflections.');
  });

  it('appends a real section-count summary when sections exist', () => {
    const stats: ReviewStatistics = { ...zeroStats, journalCount: 1, memoryCreatedCount: 0, insightCount: 1, reflectionCount: 1 };
    const sections = buildSections([item({ category: 'GOAL', priority: 80 })]);
    const overview = buildOverview('MONTH', stats, sections);
    expect(overview).toContain('This month');
    expect(overview).toContain('1 achievements');
  });
});

describe('buildReview', () => {
  it('is NOT_READY when there is no evidence and every statistic is zero', () => {
    const result = buildReview('WEEK', [], zeroStats);
    expect(result.state).toBe('NOT_READY');
    expect(result.sections).toEqual([]);
  });

  it('is READY once real evidence exists, even if some statistics are zero', () => {
    const result = buildReview('WEEK', [item({ category: 'GOAL' })], zeroStats);
    expect(result.state).toBe('READY');
  });

  it('is READY when statistics alone show real activity, even with no classifiable items', () => {
    const stats: ReviewStatistics = { ...zeroStats, journalCount: 2 };
    const result = buildReview('WEEK', [], stats);
    expect(result.state).toBe('READY');
  });

  it('is deterministic — the same input always produces the same output', () => {
    const items = [item({ category: 'GOAL' }), item({ sourceId: 'b', category: 'MISMATCH' })];
    const stats: ReviewStatistics = { ...zeroStats, journalCount: 4 };
    expect(buildReview('MONTH', items, stats)).toEqual(buildReview('MONTH', items, stats));
  });
});
