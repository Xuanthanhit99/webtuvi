import type { JournalEntry, JournalMood, Memory } from '@prisma/client';
import { jaccardSimilarity, significantTokens } from '../../memory/shared/text-normalization.util';
import type { ReflectionRuleFinding, ReflectionUserData } from '../reflection.types';

/**
 * Nine deterministic rules (Phase 3). Every rule is a pure function: `(ReflectionUserData) =>
 * ReflectionRuleFinding[]`. No AI, no embeddings — every similarity check below is the same
 * Jaccard token-overlap arithmetic Memory Intelligence already uses (Sprint 3B), reused rather
 * than reimplemented. Every finding cites >= 1 real source record; a rule that finds no
 * qualifying evidence returns an empty array, never a fabricated one.
 *
 * Thresholds are fixed constants, documented once here — see docs/architecture/
 * reflection-foundation.md "Rule Engine" for the full table and rationale.
 */

const TOPIC_SIMILARITY_THRESHOLD = 0.3;
const TOPIC_MIN_CLUSTER_SIZE = 3;
const TOPIC_SCAN_LIMIT = 100;

const GOAL_SIMILARITY_THRESHOLD = 0.5;
const GOAL_MIN_REPEAT = 2;

const INACTIVITY_GAP_DAYS = 10;

const STREAK_MIN_LENGTH = 3;
const POSITIVE_MOODS: JournalMood[] = ['GREAT', 'GOOD'];
const NEGATIVE_MOODS: JournalMood[] = ['LOW', 'DIFFICULT'];

const JOURNAL_THEME_MIN_TAG_COUNT = 3;

const ALIGNMENT_SIMILARITY_THRESHOLD = 0.3;
const ALIGNMENT_WINDOW_DAYS = 7;
const ALIGNMENT_SCAN_LIMIT = 100;
const ALIGNMENT_MAX_FINDINGS = 20;

const GOAL_ACTIVITY_MISMATCH_MIN_AGE_DAYS = 14;
const GOAL_ACTIVITY_MISMATCH_LOOKBACK_DAYS = 14;
const GOAL_ACTIVITY_MISMATCH_TOKEN_THRESHOLD = 0.15;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / DAY_MS;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function windowFor(span: number): 'DAY' | 'WEEK' | 'MONTH' | 'CUSTOM' {
  if (span <= 1) return 'DAY';
  if (span <= 7) return 'WEEK';
  if (span <= 31) return 'MONTH';
  return 'CUSTOM';
}

function memoryText(memory: Memory): string {
  return `${memory.title} ${memory.summary}`;
}

function journalText(journal: JournalEntry): string {
  return `${journal.title} ${journal.content}`;
}

function mostFrequentToken(tokenLists: string[][]): string | null {
  const counts = new Map<string, number>();
  for (const tokens of tokenLists) {
    for (const token of new Set(tokens)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [token, count] of counts) {
    if (count > bestCount) {
      best = token;
      bestCount = count;
    }
  }
  return best;
}

function avgImportance(memories: Memory[]): number | null {
  if (memories.length === 0) return null;
  const sum = memories.reduce((total, m) => total + m.importanceScore, 0);
  return Math.round(sum / memories.length);
}

// ---------------------------------------------------------------------------
// Rule 1 — Repeated topic: >= 3 journal entries / memories share significant-token overlap.
// ---------------------------------------------------------------------------
export function repeatedTopicRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  interface Item { sourceType: 'JOURNAL' | 'MEMORY'; id: string; timestamp: Date; tokens: string[]; memory?: Memory }
  const items: Item[] = [
    ...data.journals.slice(0, TOPIC_SCAN_LIMIT).map((j): Item => ({ sourceType: 'JOURNAL', id: j.id, timestamp: j.createdAt, tokens: significantTokens(journalText(j)) })),
    ...data.memories.slice(0, TOPIC_SCAN_LIMIT).map((m): Item => ({ sourceType: 'MEMORY', id: m.id, timestamp: m.createdAt, tokens: significantTokens(memoryText(m)), memory: m })),
  ].filter((item) => item.tokens.length > 0);

  const clusters: Item[][] = [];
  for (const item of items) {
    const cluster = clusters.find((c) => jaccardSimilarity(c[0]!.tokens, item.tokens) >= TOPIC_SIMILARITY_THRESHOLD);
    if (cluster) cluster.push(item);
    else clusters.push([item]);
  }

  const findings: ReflectionRuleFinding[] = [];
  for (const cluster of clusters) {
    if (cluster.length < TOPIC_MIN_CLUSTER_SIZE) continue;
    const timestamps = cluster.map((i) => i.timestamp);
    const windowStart = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const windowEnd = new Date(Math.max(...timestamps.map((t) => t.getTime())));
    const topic = mostFrequentToken(cluster.map((i) => i.tokens)) ?? 'a topic';
    const memoriesInCluster = cluster.map((i) => i.memory).filter((m): m is Memory => Boolean(m));
    const journalCount = cluster.filter((i) => i.sourceType === 'JOURNAL').length;
    const anchor = [...cluster].sort((a, b) => a.id.localeCompare(b.id))[0]!;

    findings.push({
      trigger: 'REPEATED_TOPIC',
      category: 'TOPIC',
      window: windowFor(daysBetween(windowStart, windowEnd)),
      windowStart,
      windowEnd,
      reason: `You've mentioned "${topic}" ${cluster.length} times across your journal and memories recently.`,
      groupKey: `TOPIC:${topic}:${anchor.id}`,
      sources: cluster.map((i) => ({ sourceType: i.sourceType, sourceId: i.id, sourceTimestamp: i.timestamp })),
      scoreHints: {
        importanceScore: avgImportance(memoriesInCluster),
        isGoalRelevant: memoriesInCluster.some((m) => ['GOAL', 'ACHIEVEMENT', 'CHALLENGE'].includes(m.type)),
        hasActivitySource: false,
        journalSourceCount: journalCount,
      },
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Rule 2 — Repeated goal: >= 2 goal-related memories with high textual similarity.
// ---------------------------------------------------------------------------
export function repeatedGoalRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  const items = data.goalMemories.map((m) => ({ memory: m, tokens: significantTokens(memoryText(m)) })).filter((i) => i.tokens.length > 0);

  const clusters: (typeof items)[] = [];
  for (const item of items) {
    const cluster = clusters.find((c) => jaccardSimilarity(c[0]!.tokens, item.tokens) >= GOAL_SIMILARITY_THRESHOLD);
    if (cluster) cluster.push(item);
    else clusters.push([item]);
  }

  const findings: ReflectionRuleFinding[] = [];
  for (const cluster of clusters) {
    if (cluster.length < GOAL_MIN_REPEAT) continue;
    const sorted = [...cluster].sort((a, b) => a.memory.createdAt.getTime() - b.memory.createdAt.getTime());
    const windowStart = sorted[0]!.memory.createdAt;
    const windowEnd = sorted[sorted.length - 1]!.memory.createdAt;

    findings.push({
      trigger: 'REPEATED_GOAL',
      category: 'GOAL',
      window: windowFor(daysBetween(windowStart, windowEnd)),
      windowStart,
      windowEnd,
      reason: `You've returned to a similar goal ${cluster.length} times: "${sorted[0]!.memory.title}".`,
      groupKey: `GOAL:${sorted[0]!.memory.id}`,
      sources: cluster.map((i) => ({ sourceType: 'MEMORY' as const, sourceId: i.memory.id, sourceTimestamp: i.memory.createdAt })),
      scoreHints: {
        importanceScore: avgImportance(cluster.map((i) => i.memory)),
        isGoalRelevant: true,
        hasActivitySource: false,
        journalSourceCount: 0,
      },
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Rule 3 — Long inactivity: the gap since the most recent signal across every source exceeds
// the threshold.
// ---------------------------------------------------------------------------
export function longInactivityRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  interface Signal { sourceType: 'JOURNAL' | 'MEMORY' | 'ACTIVITY' | 'COMPANION'; id: string; timestamp: Date }
  const signals: Signal[] = [
    ...data.journals.map((j): Signal => ({ sourceType: 'JOURNAL', id: j.id, timestamp: j.createdAt })),
    ...data.memories.map((m): Signal => ({ sourceType: 'MEMORY', id: m.id, timestamp: m.createdAt })),
    ...data.activityEvents.map((a): Signal => ({ sourceType: 'ACTIVITY', id: a.id, timestamp: a.createdAt })),
    ...data.companionMessages.map((c): Signal => ({ sourceType: 'COMPANION', id: c.id, timestamp: c.createdAt })),
  ];
  if (signals.length === 0) return [];

  const latest = signals.reduce((max, s) => (s.timestamp > max.timestamp ? s : max));
  const now = new Date();
  const gapDays = Math.floor(daysBetween(latest.timestamp, now));
  if (gapDays < INACTIVITY_GAP_DAYS) return [];

  return [{
    trigger: 'LONG_INACTIVITY',
    category: 'INACTIVITY',
    window: windowFor(gapDays),
    windowStart: latest.timestamp,
    windowEnd: now,
    reason: `It's been ${gapDays} days since your last activity in BeaconVie.`,
    groupKey: `INACTIVITY:${data.userId}`,
    sources: [{ sourceType: latest.sourceType, sourceId: latest.id, sourceTimestamp: latest.timestamp }],
    scoreHints: {
      importanceScore: null,
      isGoalRelevant: false,
      hasActivitySource: latest.sourceType === 'ACTIVITY',
      journalSourceCount: 0,
    },
  }];
}

// ---------------------------------------------------------------------------
// Rule 4 — Goal regression: an existing, unresolved MemoryConflict (Sprint 3B) between two
// goal-related memories. Reuses detection rather than reimplementing it.
// ---------------------------------------------------------------------------
export function goalRegressionRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  const memoryById = new Map(data.goalMemories.map((m) => [m.id, m]));
  const findings: ReflectionRuleFinding[] = [];

  for (const conflict of data.goalConflicts) {
    const memoryA = memoryById.get(conflict.memoryAId);
    const memoryB = memoryById.get(conflict.memoryBId);
    if (!memoryA || !memoryB) continue;

    findings.push({
      trigger: 'GOAL_REGRESSION',
      category: 'GOAL',
      window: 'CUSTOM',
      windowStart: memoryA.createdAt < memoryB.createdAt ? memoryA.createdAt : memoryB.createdAt,
      windowEnd: conflict.detectedAt,
      reason: `Two of your goal-related memories don't agree: ${conflict.reason}`,
      groupKey: `GOAL:conflict:${conflict.id}`,
      sources: [
        { sourceType: 'MEMORY', sourceId: memoryA.id, sourceTimestamp: memoryA.createdAt },
        { sourceType: 'MEMORY', sourceId: memoryB.id, sourceTimestamp: memoryB.createdAt },
      ],
      scoreHints: {
        importanceScore: avgImportance([memoryA, memoryB]),
        isGoalRelevant: true,
        hasActivitySource: false,
        journalSourceCount: 0,
      },
    });
  }
  return findings;
}

function moodStreaks(journals: JournalEntry[], moods: JournalMood[]): JournalEntry[][] {
  const withMood = journals.filter((j) => j.mood && moods.includes(j.mood));
  const byDay = new Map<string, JournalEntry>();
  for (const entry of withMood) {
    const key = dayKey(entry.createdAt);
    const existing = byDay.get(key);
    if (!existing || entry.createdAt > existing.createdAt) byDay.set(key, entry);
  }
  const sortedDays = [...byDay.entries()].sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());

  const streaks: JournalEntry[][] = [];
  let current: JournalEntry[] = [];
  let previousDate: Date | null = null;
  for (const [, entry] of sortedDays) {
    if (previousDate && daysBetween(previousDate, entry.createdAt) <= 1.5 && daysBetween(previousDate, entry.createdAt) >= 0.5) {
      current.push(entry);
    } else {
      if (current.length >= STREAK_MIN_LENGTH) streaks.push(current);
      current = [entry];
    }
    previousDate = entry.createdAt;
  }
  if (current.length >= STREAK_MIN_LENGTH) streaks.push(current);
  return streaks;
}

// ---------------------------------------------------------------------------
// Rule 5 — Positive streak: >= 3 consecutive calendar days of GREAT/GOOD journal mood.
// ---------------------------------------------------------------------------
export function positiveStreakRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  return moodStreaks(data.journals, POSITIVE_MOODS).map((streak) => {
    const windowStart = streak[0]!.createdAt;
    const windowEnd = streak[streak.length - 1]!.createdAt;
    return {
      trigger: 'POSITIVE_STREAK' as const,
      category: 'WELLBEING' as const,
      window: windowFor(daysBetween(windowStart, windowEnd)),
      windowStart,
      windowEnd,
      reason: `You've logged a positive mood in your journal for ${streak.length} days in a row.`,
      groupKey: `WELLBEING:positive:${streak[0]!.id}`,
      sources: streak.map((j) => ({ sourceType: 'JOURNAL' as const, sourceId: j.id, sourceTimestamp: j.createdAt })),
      scoreHints: { importanceScore: null, isGoalRelevant: false, hasActivitySource: false, journalSourceCount: streak.length },
    };
  });
}

// ---------------------------------------------------------------------------
// Rule 6 — Negative streak: >= 3 consecutive calendar days of LOW/DIFFICULT journal mood.
// ---------------------------------------------------------------------------
export function negativeStreakRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  return moodStreaks(data.journals, NEGATIVE_MOODS).map((streak) => {
    const windowStart = streak[0]!.createdAt;
    const windowEnd = streak[streak.length - 1]!.createdAt;
    return {
      trigger: 'NEGATIVE_STREAK' as const,
      category: 'WELLBEING' as const,
      window: windowFor(daysBetween(windowStart, windowEnd)),
      windowStart,
      windowEnd,
      reason: `You've logged a difficult mood in your journal for ${streak.length} days in a row.`,
      groupKey: `WELLBEING:negative:${streak[0]!.id}`,
      sources: streak.map((j) => ({ sourceType: 'JOURNAL' as const, sourceId: j.id, sourceTimestamp: j.createdAt })),
      scoreHints: { importanceScore: null, isGoalRelevant: false, hasActivitySource: false, journalSourceCount: streak.length },
    };
  });
}

// ---------------------------------------------------------------------------
// Rule 7 — Repeated journal theme: the same tag used on >= 3 journal entries.
// ---------------------------------------------------------------------------
export function repeatedJournalThemeRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  const byTag = new Map<string, JournalEntry[]>();
  for (const entry of data.journals) {
    for (const tag of entry.tags) {
      const list = byTag.get(tag) ?? [];
      list.push(entry);
      byTag.set(tag, list);
    }
  }

  const findings: ReflectionRuleFinding[] = [];
  for (const [tag, entries] of byTag) {
    if (entries.length < JOURNAL_THEME_MIN_TAG_COUNT) continue;
    const sorted = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const windowStart = sorted[0]!.createdAt;
    const windowEnd = sorted[sorted.length - 1]!.createdAt;
    findings.push({
      trigger: 'REPEATED_JOURNAL_THEME',
      category: 'JOURNAL',
      window: windowFor(daysBetween(windowStart, windowEnd)),
      windowStart,
      windowEnd,
      reason: `You've tagged ${entries.length} journal entries "${tag}".`,
      groupKey: `JOURNAL:tag:${tag}`,
      sources: sorted.map((j) => ({ sourceType: 'JOURNAL' as const, sourceId: j.id, sourceTimestamp: j.createdAt })),
      scoreHints: { importanceScore: null, isGoalRelevant: false, hasActivitySource: false, journalSourceCount: entries.length },
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Rule 8 — Memory + journal alignment: a memory and a journal entry close in time with
// overlapping significant tokens.
// ---------------------------------------------------------------------------
export function memoryJournalAlignmentRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  const memories = data.memories.slice(0, ALIGNMENT_SCAN_LIMIT);
  const journals = data.journals.slice(0, ALIGNMENT_SCAN_LIMIT);
  const findings: ReflectionRuleFinding[] = [];

  for (const memory of memories) {
    const memoryTokens = significantTokens(memoryText(memory));
    if (memoryTokens.length === 0) continue;
    for (const journal of journals) {
      if (daysBetween(memory.createdAt, journal.createdAt) > ALIGNMENT_WINDOW_DAYS) continue;
      const journalTokens = significantTokens(journalText(journal));
      if (journalTokens.length === 0) continue;
      const similarity = jaccardSimilarity(memoryTokens, journalTokens);
      if (similarity < ALIGNMENT_SIMILARITY_THRESHOLD) continue;

      const windowStart = memory.createdAt < journal.createdAt ? memory.createdAt : journal.createdAt;
      const windowEnd = memory.createdAt > journal.createdAt ? memory.createdAt : journal.createdAt;
      findings.push({
        trigger: 'MEMORY_JOURNAL_ALIGNMENT',
        category: 'ALIGNMENT',
        window: windowFor(daysBetween(windowStart, windowEnd)),
        windowStart,
        windowEnd,
        reason: `A memory ("${memory.title}") and a journal entry ("${journal.title || 'Untitled'}") from around the same time cover similar ground.`,
        groupKey: `ALIGNMENT:${memory.id}:${journal.id}`,
        sources: [
          { sourceType: 'MEMORY', sourceId: memory.id, sourceTimestamp: memory.createdAt },
          { sourceType: 'JOURNAL', sourceId: journal.id, sourceTimestamp: journal.createdAt },
        ],
        scoreHints: {
          importanceScore: avgImportance([memory]),
          isGoalRelevant: ['GOAL', 'ACHIEVEMENT', 'CHALLENGE'].includes(memory.type),
          hasActivitySource: false,
          journalSourceCount: 1,
        },
      });
      if (findings.length >= ALIGNMENT_MAX_FINDINGS) return findings;
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Rule 9 — Goal + activity mismatch: a goal-related memory old enough to expect follow-through,
// with no matching activity/journal/companion signal in the recent lookback window. The absence
// of evidence is never represented by a fabricated source — only the goal memory itself is cited.
// ---------------------------------------------------------------------------
export function goalActivityMismatchRule(data: ReflectionUserData): ReflectionRuleFinding[] {
  const now = new Date();
  const lookbackStart = new Date(now.getTime() - GOAL_ACTIVITY_MISMATCH_LOOKBACK_DAYS * DAY_MS);

  const recentSignals = [
    ...data.activityEvents.filter((a) => a.createdAt >= lookbackStart),
    ...data.journals.filter((j) => j.createdAt >= lookbackStart).map((j) => ({ tokens: significantTokens(journalText(j)) })),
    ...data.companionMessages.filter((c) => c.createdAt >= lookbackStart).map((c) => ({ tokens: significantTokens(c.content) })),
  ];
  const journalAndCompanionTokenSets = [
    ...data.journals.filter((j) => j.createdAt >= lookbackStart).map((j) => significantTokens(journalText(j))),
    ...data.companionMessages.filter((c) => c.createdAt >= lookbackStart).map((c) => significantTokens(c.content)),
  ];
  void recentSignals;

  const findings: ReflectionRuleFinding[] = [];
  for (const goal of data.goalMemories) {
    const ageDays = daysBetween(goal.createdAt, now);
    if (ageDays < GOAL_ACTIVITY_MISMATCH_MIN_AGE_DAYS) continue;

    const goalTokens = significantTokens(memoryText(goal));
    if (goalTokens.length === 0) continue;

    const hasMatchingSignal = journalAndCompanionTokenSets.some(
      (tokens) => jaccardSimilarity(goalTokens, tokens) >= GOAL_ACTIVITY_MISMATCH_TOKEN_THRESHOLD,
    );
    if (hasMatchingSignal) continue;

    findings.push({
      trigger: 'GOAL_ACTIVITY_MISMATCH',
      category: 'MISMATCH',
      window: 'CUSTOM',
      windowStart: lookbackStart,
      windowEnd: now,
      reason: `Your goal "${goal.title}" hasn't shown up in your journal or Companion conversations in the last ${GOAL_ACTIVITY_MISMATCH_LOOKBACK_DAYS} days.`,
      groupKey: `MISMATCH:${goal.id}`,
      sources: [{ sourceType: 'MEMORY', sourceId: goal.id, sourceTimestamp: goal.createdAt }],
      scoreHints: { importanceScore: avgImportance([goal]), isGoalRelevant: true, hasActivitySource: false, journalSourceCount: 0 },
    });
  }
  return findings;
}

export const ALL_RULES = [
  repeatedTopicRule,
  repeatedGoalRule,
  longInactivityRule,
  goalRegressionRule,
  positiveStreakRule,
  negativeStreakRule,
  repeatedJournalThemeRule,
  memoryJournalAlignmentRule,
  goalActivityMismatchRule,
];
