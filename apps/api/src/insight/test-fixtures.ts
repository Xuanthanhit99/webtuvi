import type { ReflectionCandidate, ReflectionSourceRef } from '@prisma/client';
import type { ReflectionCandidateWithSources } from './insight.types';

export const USER_ID = 'user-1';

export function makeReflection(overrides: Partial<ReflectionCandidate> = {}): ReflectionCandidate {
  return {
    id: overrides.id ?? 'reflection-1',
    userId: overrides.userId ?? USER_ID,
    category: overrides.category ?? 'TOPIC',
    trigger: overrides.trigger ?? 'REPEATED_TOPIC',
    state: overrides.state ?? 'READY',
    window: overrides.window ?? 'WEEK',
    windowStart: overrides.windowStart ?? new Date('2026-01-01T00:00:00.000Z'),
    windowEnd: overrides.windowEnd ?? new Date('2026-01-05T00:00:00.000Z'),
    reason: overrides.reason ?? 'You mentioned this a few times.',
    score: overrides.score ?? 50,
    scoreFactors: overrides.scoreFactors ?? null,
    groupKey: overrides.groupKey ?? 'TOPIC:example',
    visibility: overrides.visibility ?? 'COMPANION_VISIBLE',
    pinned: overrides.pinned ?? false,
    dedupeKey: overrides.dedupeKey ?? `${overrides.trigger ?? 'REPEATED_TOPIC'}:${overrides.groupKey ?? 'TOPIC:example'}:2026-01-01T00:00:00.000Z`,
    createdAt: overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? overrides.createdAt ?? new Date('2026-01-05T00:00:00.000Z'),
    resolvedAt: overrides.resolvedAt ?? null,
    expiredAt: overrides.expiredAt ?? null,
  };
}

export function makeSourceRef(overrides: Partial<ReflectionSourceRef> = {}): ReflectionSourceRef {
  return {
    id: overrides.id ?? 'source-1',
    reflectionCandidateId: overrides.reflectionCandidateId ?? 'reflection-1',
    sourceType: overrides.sourceType ?? 'JOURNAL',
    sourceId: overrides.sourceId ?? 'journal-1',
    sourceTimestamp: overrides.sourceTimestamp ?? new Date('2026-01-01T00:00:00.000Z'),
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

export function makeReflectionWithSources(overrides: Partial<ReflectionCandidate> = {}, sources: Partial<ReflectionSourceRef>[] = []): ReflectionCandidateWithSources {
  const reflection = makeReflection(overrides);
  return {
    ...reflection,
    sources: sources.length > 0 ? sources.map((s) => makeSourceRef({ ...s, reflectionCandidateId: reflection.id })) : [makeSourceRef({ reflectionCandidateId: reflection.id })],
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
export function daysAfter(n: number, from = new Date('2026-01-01T00:00:00.000Z')): Date {
  return new Date(from.getTime() + n * DAY_MS);
}
