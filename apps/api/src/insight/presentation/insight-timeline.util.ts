import type { InsightTimelineCard, InsightTimelineGroup, InsightTimelineGroupBy } from './insight-presentation.types';

/**
 * Phase 4 — grouping. No semantic clustering anywhere: `category`/`priority` group by fields the
 * card already carries; `topic` groups by each candidate's *dominant evidence reflection's*
 * `groupKey` — a real, already-computed structural string (`ReflectionCandidate.groupKey`, see
 * `reflection-foundation.md` "Grouping"), never a fabricated or semantically-derived taxonomy.
 */
export function dominantGroupKey(groupKeys: string[]): string {
  if (groupKeys.length === 0) return 'ungrouped';
  const counts = new Map<string, number>();
  for (const k of groupKeys) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0];
}

export type TimelineCardWithTopic = InsightTimelineCard & { topicKey: string };

const PRIORITY_TIER_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function groupTimelineCards(items: TimelineCardWithTopic[], groupBy: InsightTimelineGroupBy): InsightTimelineGroup[] {
  const buckets = new Map<string, { label: string; items: InsightTimelineCard[] }>();
  for (const item of items) {
    const { key, label } = groupKeyFor(item, groupBy);
    if (!buckets.has(key)) buckets.set(key, { label, items: [] });
    buckets.get(key)!.items.push(item);
  }

  const groups = [...buckets.entries()].map(([key, { label, items: groupItems }]) => ({
    key,
    label,
    items: [...groupItems].sort(sortByDayThenPriorityDesc),
  }));

  if (groupBy === 'priority') {
    return groups.sort((a, b) => (PRIORITY_TIER_ORDER[a.key] ?? 99) - (PRIORITY_TIER_ORDER[b.key] ?? 99));
  }
  return groups.sort((a, b) => a.label.localeCompare(b.label));
}

function groupKeyFor(item: TimelineCardWithTopic, groupBy: InsightTimelineGroupBy): { key: string; label: string } {
  if (groupBy === 'category') return { key: item.category.value, label: item.category.label };
  if (groupBy === 'priority') return { key: item.priorityBadge.tier, label: item.priorityBadge.label };
  return { key: item.topicKey, label: item.topicKey };
}

function sortByDayThenPriorityDesc(a: InsightTimelineCard, b: InsightTimelineCard): number {
  return b.day.localeCompare(a.day) || b.priorityBadge.priority - a.priorityBadge.priority;
}
