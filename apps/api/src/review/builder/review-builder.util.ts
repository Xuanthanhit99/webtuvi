import type { ReviewBuildResult, ReviewSectionDraft, ReviewSectionType, ReviewStatistics, ReviewableItem } from '../review.types';

/**
 * Phase 2 — the deterministic Review Builder. Pure functions only: no DB access, no randomness, no
 * LLM. Every string is either copied straight from a real, already-computed field
 * (`InsightCandidate.ruleExplanation`/`priority`, `ReflectionCandidate.reason`/`score`) or built
 * from one of the fixed templates below. Classification uses only `category` — the same isomorphic
 * 7-value enum `InsightCategory`/`ReflectionCategory` already share (see
 * docs/architecture/reflection-foundation.md) — never a new taxonomy, never semantic similarity.
 */

const MAX_ITEMS_PER_SECTION = 20;

const SECTION_TITLES: Record<ReviewSectionType, string> = {
  HIGHLIGHTS: 'Highlights',
  CHANGES: 'Changes',
  ACHIEVEMENTS: 'Achievements',
  CHALLENGES: 'Challenges',
};

/** Fixed, documented category -> section mapping — no re-weighting, no scoring model.
 * `MISMATCH`/`INACTIVITY` (a goal drifting from activity, or a real gap in engagement) are always
 * challenges; `GOAL` (a goal-relevant cluster/reflection) is always an achievement; `WELLBEING`/
 * `ALIGNMENT` (a mood pattern, or a memory+journal alignment) describe something that changed;
 * everything else (`TOPIC`/`JOURNAL`) is a general highlight. */
export function classifySection(category: string): ReviewSectionType {
  if (category === 'MISMATCH' || category === 'INACTIVITY') return 'CHALLENGES';
  if (category === 'GOAL') return 'ACHIEVEMENTS';
  if (category === 'WELLBEING' || category === 'ALIGNMENT') return 'CHANGES';
  return 'HIGHLIGHTS';
}

const SOURCE_LABELS: Record<ReviewableItem['sourceType'], string> = {
  INSIGHT: 'Insight',
  REFLECTION: 'Reflection',
  MEMORY: 'Memory',
  JOURNAL: 'Journal',
};

export function buildContribution(item: ReviewableItem): string {
  const sourceLabel = SOURCE_LABELS[item.sourceType];
  const priorityLabel = item.sourceType === 'MEMORY' ? 'importance' : 'priority';
  const evidenceNote = item.sourceType === 'INSIGHT' && item.evidenceCount > 0 ? ` Backed by ${item.evidenceCount} reflection${item.evidenceCount === 1 ? '' : 's'}.` : '';
  return `${sourceLabel}: ${item.reason} (${priorityLabel} ${item.priority}).${evidenceNote}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function buildSectionSummary(items: ReviewableItem[]): string {
  const count = items.length;
  const averagePriority = Math.round(items.reduce((sum, item) => sum + item.priority, 0) / count);
  return `${count} ${pluralize(count, 'item', 'items')}, average priority ${averagePriority}.`;
}

/** Groups already-classified items into non-empty sections, sorted by priority descending within
 * each section, bounded to MAX_ITEMS_PER_SECTION (same order-of-magnitude discipline every prior
 * sprint's own bounds use) — never a fabricated empty section. */
export function buildSections(items: ReviewableItem[]): ReviewSectionDraft[] {
  const byType = new Map<ReviewSectionType, ReviewableItem[]>();
  for (const item of items) {
    const type = classifySection(item.category);
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(item);
  }

  const order: ReviewSectionType[] = ['HIGHLIGHTS', 'ACHIEVEMENTS', 'CHANGES', 'CHALLENGES'];
  const sections: ReviewSectionDraft[] = [];
  for (const type of order) {
    const sectionItems = byType.get(type);
    if (!sectionItems || sectionItems.length === 0) continue;
    const sorted = [...sectionItems].sort((a, b) => b.priority - a.priority || a.sourceId.localeCompare(b.sourceId));
    const bounded = sorted.slice(0, MAX_ITEMS_PER_SECTION);
    sections.push({
      type,
      title: SECTION_TITLES[type],
      summary: buildSectionSummary(bounded),
      items: bounded.map((item) => ({ ...item, contribution: buildContribution(item) })),
    });
  }
  return sections;
}

const WINDOW_LABELS: Record<'WEEK' | 'MONTH' | 'CUSTOM', string> = {
  WEEK: 'This week',
  MONTH: 'This month',
  CUSTOM: 'In this period',
};

/** Phase 2 "Overview" — a fixed template over already-computed statistics and section counts.
 * Never a generated summary sentence; every number here is real. */
export function buildOverview(window: 'WEEK' | 'MONTH' | 'CUSTOM', statistics: ReviewStatistics, sections: ReviewSectionDraft[]): string {
  const windowLabel = WINDOW_LABELS[window];
  const parts = [
    `${windowLabel} you wrote ${statistics.journalCount} journal ${pluralize(statistics.journalCount, 'entry', 'entries')}`,
    `saved ${statistics.memoryCreatedCount} ${pluralize(statistics.memoryCreatedCount, 'memory', 'memories')}`,
    `and had ${statistics.insightCount} ${pluralize(statistics.insightCount, 'insight', 'insights')} prepared from ${statistics.reflectionCount} ${pluralize(statistics.reflectionCount, 'reflection', 'reflections')}`,
  ];
  const sentence = `${parts.join(', ')}.`;

  if (sections.length === 0) return sentence;
  const sectionSummary = sections.map((s) => `${s.items.length} ${s.title.toLowerCase()}`).join(', ');
  return `${sentence} That surfaced ${sectionSummary}.`;
}

/** Phase 2 orchestrator — pure, deterministic, ties the functions above together. `state` is
 * `NOT_READY` when there is nothing at all to show (no sections and every statistic is zero) —
 * never a review claiming activity that didn't happen. */
export function buildReview(window: 'WEEK' | 'MONTH' | 'CUSTOM', items: ReviewableItem[], statistics: ReviewStatistics): ReviewBuildResult {
  const sections = buildSections(items);
  const overview = buildOverview(window, statistics, sections);
  const hasAnyActivity = sections.length > 0 || Object.values(statistics).some((v) => v > 0);
  return { state: hasAnyActivity ? 'READY' : 'NOT_READY', overview, statistics, sections };
}
