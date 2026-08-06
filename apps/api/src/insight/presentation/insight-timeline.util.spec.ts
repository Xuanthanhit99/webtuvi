import { renderTimelineCard } from './insight-renderer';
import { dominantGroupKey, groupTimelineCards, type TimelineCardWithTopic } from './insight-timeline.util';
import type { RenderableInsightCandidate } from './insight-renderer';

function card(overrides: Partial<RenderableInsightCandidate> = {}, topicKey = 'TOPIC:example'): TimelineCardWithTopic {
  const base: RenderableInsightCandidate = {
    id: overrides.id ?? 'insight-1',
    category: overrides.category ?? 'GOAL',
    status: overrides.status ?? 'READY',
    window: overrides.window ?? 'WEEK',
    windowStart: overrides.windowStart ?? new Date('2026-01-01T00:00:00.000Z'),
    windowEnd: overrides.windowEnd ?? new Date('2026-01-05T00:00:00.000Z'),
    ruleExplanation: overrides.ruleExplanation ?? 'x',
    priority: overrides.priority ?? 50,
    priorityFactors: overrides.priorityFactors ?? {},
    pinned: overrides.pinned ?? false,
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-05T00:00:00.000Z'),
    resolvedAt: overrides.resolvedAt ?? null,
    evidenceCount: overrides.evidenceCount ?? 1,
    relationshipCount: overrides.relationshipCount ?? 0,
  };
  return { ...renderTimelineCard(base), topicKey };
}

describe('dominantGroupKey', () => {
  it('picks the most frequent groupKey', () => {
    expect(dominantGroupKey(['a', 'b', 'a', 'a', 'b'])).toBe('a');
  });

  it('breaks ties lexicographically, deterministically', () => {
    expect(dominantGroupKey(['b', 'a'])).toBe('a');
  });

  it('never fabricates a key for empty input', () => {
    expect(dominantGroupKey([])).toBe('ungrouped');
  });
});

describe('groupTimelineCards', () => {
  const items: TimelineCardWithTopic[] = [
    card({ id: 'i1', category: 'GOAL', priority: 80, createdAt: new Date('2026-01-05T00:00:00.000Z') }, 'GOAL:x'),
    card({ id: 'i2', category: 'GOAL', priority: 20, createdAt: new Date('2026-01-04T00:00:00.000Z') }, 'GOAL:x'),
    card({ id: 'i3', category: 'TOPIC', priority: 50, createdAt: new Date('2026-01-06T00:00:00.000Z') }, 'TOPIC:y'),
  ];

  it('groups by category, using the card’s own category label', () => {
    const groups = groupTimelineCards(items, 'category');
    const goalGroup = groups.find((g) => g.key === 'GOAL')!;
    expect(goalGroup.items.map((i) => i.id)).toEqual(['i1', 'i2']);
    expect(goalGroup.label).toBe('Goal');
  });

  it('groups by priority tier and orders groups HIGH, MEDIUM, LOW', () => {
    const groups = groupTimelineCards(items, 'priority');
    expect(groups.map((g) => g.key)).toEqual(['HIGH', 'MEDIUM', 'LOW']);
  });

  it('groups by topic using the dominant evidence reflection groupKey, never a fabricated taxonomy', () => {
    const groups = groupTimelineCards(items, 'topic');
    expect(groups.map((g) => g.key).sort()).toEqual(['GOAL:x', 'TOPIC:y']);
  });

  it('sorts items within a group by day desc then priority desc', () => {
    const groups = groupTimelineCards(items, 'category');
    const goalGroup = groups.find((g) => g.key === 'GOAL')!;
    expect(goalGroup.items[0]!.id).toBe('i1');
  });
});
