import type { ReflectionCandidate, ReflectionState, ReflectionTrigger } from '@prisma/client';
import type { InsightRelationshipType } from '@prisma/client';

/**
 * Deterministic, structural relationship classification between two Reflection Candidates
 * (Phase 2). "No semantic similarity" — every check below compares fields already on the row
 * (`category`/`trigger`/`groupKey`/`score`/`window`/`state`) against fixed thresholds and a fixed
 * table of "contradicting trigger" pairs. Never token/Jaccard/embedding comparison.
 */

const STAGNATION_BAND = 8;
const IMPROVE_THRESHOLD = 10;
const REGRESS_THRESHOLD = 10;
const RELATION_WINDOW_DAYS = 21;
const DAY_MS = 24 * 60 * 60 * 1000;

const RESOLVED_STATES: ReflectionState[] = ['DISMISSED', 'ARCHIVED'];

/** Unordered pairs of triggers that represent opposite directions on the same theme. */
const CONTRADICTING_TRIGGER_PAIRS: [ReflectionTrigger, ReflectionTrigger][] = [
  ['POSITIVE_STREAK', 'NEGATIVE_STREAK'],
  ['REPEATED_GOAL', 'GOAL_REGRESSION'],
  ['REPEATED_GOAL', 'GOAL_ACTIVITY_MISMATCH'],
];

function isContradictingPair(a: ReflectionTrigger, b: ReflectionTrigger): boolean {
  return CONTRADICTING_TRIGGER_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

const TRIGGER_LABELS: Record<ReflectionTrigger, string> = {
  REPEATED_TOPIC: 'a repeated topic',
  REPEATED_GOAL: 'a repeated goal',
  LONG_INACTIVITY: 'long inactivity',
  GOAL_REGRESSION: 'a goal regression',
  POSITIVE_STREAK: 'a positive streak',
  NEGATIVE_STREAK: 'a negative streak',
  REPEATED_JOURNAL_THEME: 'a repeated journal theme',
  MEMORY_JOURNAL_ALIGNMENT: 'a memory + journal alignment',
  GOAL_ACTIVITY_MISMATCH: 'a goal + activity mismatch',
};

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / DAY_MS;
}

export interface RelationshipClassification {
  type: InsightRelationshipType;
  reason: string;
}

/** `a`/`b` are the two candidates in any order — the function itself determines chronological
 * order (by `windowEnd`) so the classification and reason text are always stated consistently. */
export function classifyRelationship(a: ReflectionCandidate, b: ReflectionCandidate): RelationshipClassification | null {
  const [older, newer] = a.windowEnd <= b.windowEnd ? [a, b] : [b, a];
  if (older.id === newer.id) return null;

  if (older.groupKey === newer.groupKey && older.trigger === newer.trigger) {
    const label = TRIGGER_LABELS[older.trigger];

    if (RESOLVED_STATES.includes(older.state)) {
      return {
        type: 'REPEATS',
        reason: `The same pattern (${label}) returned after being ${older.state.toLowerCase()}.`,
      };
    }

    const delta = newer.score - older.score;
    if (Math.abs(delta) < STAGNATION_BAND) {
      return {
        type: 'STAGNATES',
        reason: `Score stayed about the same (${older.score} -> ${newer.score}) across repeated occurrences of ${label}.`,
      };
    }
    if (delta >= IMPROVE_THRESHOLD) {
      return { type: 'IMPROVES', reason: `Score rose from ${older.score} to ${newer.score} for ${label}.` };
    }
    if (delta <= -REGRESS_THRESHOLD) {
      return { type: 'REGRESSES', reason: `Score fell from ${older.score} to ${newer.score} for ${label}.` };
    }
    return {
      type: 'CONTINUES',
      reason: `An ongoing pattern (${label}), observed again ${Math.round(daysBetween(older.windowEnd, newer.windowStart))} days later.`,
    };
  }

  if (older.category === newer.category && older.groupKey !== newer.groupKey) {
    const gapDays = daysBetween(older.windowEnd, newer.windowStart);
    if (gapDays > RELATION_WINDOW_DAYS) return null;

    const olderLabel = TRIGGER_LABELS[older.trigger];
    const newerLabel = TRIGGER_LABELS[newer.trigger];

    if (isContradictingPair(older.trigger, newer.trigger)) {
      return {
        type: 'CONTRADICTS',
        reason: `${capitalize(olderLabel)} and ${newerLabel} point in different directions within ${RELATION_WINDOW_DAYS} days of each other.`,
      };
    }
    return {
      type: 'SUPPORTS',
      reason: `${capitalize(olderLabel)} and ${newerLabel} both relate to ${older.category.toLowerCase()} and occurred within ${RELATION_WINDOW_DAYS} days of each other.`,
    };
  }

  return null;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
