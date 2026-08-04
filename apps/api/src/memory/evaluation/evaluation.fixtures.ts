import type { Memory, MemoryType } from '@prisma/client';

/**
 * Hand-labeled fixtures for Phase 8 evaluation. These are small, deterministic, and checked
 * into the repo (not real user data) — the point is to give MemoryEvaluationService a fixed,
 * reproducible ground truth to measure the retrieval/duplicate/conflict algorithms against
 * without a live database. See docs/architecture/memory-intelligence.md "Evaluation
 * methodology" for why fixture-based evaluation was chosen this sprint (no production usage
 * data existed yet to evaluate against, and this session had no reachable database — see
 * docs/progress/sprint-3b-progress.md "Environment note").
 */

function fixtureMemory(overrides: {
  id: string;
  type: MemoryType;
  title: string;
  summary: string;
  pinned?: boolean;
  importanceScore?: number;
  importanceFactors?: Record<string, number> | null;
  referencedCount?: number;
  createdAt?: string;
  lastReferencedAt?: string | null;
  structuredPayload?: Record<string, unknown> | null;
}): Memory {
  return {
    id: overrides.id,
    userId: 'fixture-user',
    type: overrides.type,
    title: overrides.title,
    summary: overrides.summary,
    structuredPayload: overrides.structuredPayload ?? null,
    status: 'ACCEPTED',
    consentState: 'ALLOW_SELECTED',
    visibility: 'PRIVATE',
    sourceType: 'USER_EXPLICIT',
    sourceConversationId: null,
    sourceMessageId: null,
    expiresAt: null,
    version: 1,
    lastReferencedAt: overrides.lastReferencedAt ? new Date(overrides.lastReferencedAt) : null,
    createdAt: new Date(overrides.createdAt ?? '2026-01-01T00:00:00.000Z'),
    updatedAt: new Date(overrides.createdAt ?? '2026-01-01T00:00:00.000Z'),
    archivedAt: null,
    deletedAt: null,
    importanceScore: overrides.importanceScore ?? 0,
    importanceFactors: overrides.importanceFactors ?? null,
    pinned: overrides.pinned ?? false,
    referencedCount: overrides.referencedCount ?? 0,
  } as Memory;
}

export interface RetrievalScenario {
  name: string;
  memories: Memory[];
  contextText?: string;
  /** Ground truth: ids the retrieval policy should surface (order not required to match). */
  expectedRelevantIds: string[];
  limit?: number;
}

export const RETRIEVAL_SCENARIOS: RetrievalScenario[] = [
  {
    name: 'pinned memory always surfaces over higher-importance-but-unpinned noise',
    memories: [
      fixtureMemory({ id: 'goal-1', type: 'GOAL', title: 'Learn Japanese', summary: 'Working toward JLPT N3', importanceScore: 40 }),
      fixtureMemory({ id: 'pinned-1', type: 'CUSTOM', title: 'Anniversary', summary: 'Wedding anniversary is in June', pinned: true, importanceScore: 20 }),
      fixtureMemory({ id: 'noise-1', type: 'EMOTION', title: 'Mood', summary: 'Felt tired on a Tuesday', importanceScore: 5 }),
    ],
    expectedRelevantIds: ['pinned-1', 'goal-1'],
    limit: 2,
  },
  {
    name: 'context text about coffee surfaces the coffee preference over an unrelated pet memory',
    memories: [
      fixtureMemory({ id: 'coffee-1', type: 'PREFERENCE', title: 'Coffee', summary: 'Loves drinking coffee in the morning', importanceScore: 30 }),
      fixtureMemory({ id: 'pet-1', type: 'PET', title: 'Cat', summary: 'Has a cat named Miso', importanceScore: 30 }),
    ],
    contextText: 'What does the user usually drink in the morning, coffee or tea?',
    expectedRelevantIds: ['coffee-1'],
    limit: 1,
  },
  {
    name: 'goal-relation breaks a tie between two equally-important memories',
    memories: [
      fixtureMemory({ id: 'goal-2', type: 'ACHIEVEMENT', title: 'Marathon', summary: 'Finished first marathon', importanceScore: 50 }),
      fixtureMemory({ id: 'habit-1', type: 'HABIT', title: 'Morning run', summary: 'Runs most mornings', importanceScore: 50 }),
    ],
    expectedRelevantIds: ['goal-2'],
    limit: 1,
  },
  {
    name: 'an unmatched context falls back to ranking every consented candidate, not an empty result',
    memories: [fixtureMemory({ id: 'solo-1', type: 'IDENTITY', title: 'Name', summary: 'Prefers to be called Alex', importanceScore: 20 })],
    contextText: 'something completely unrelated to anything stored',
    expectedRelevantIds: ['solo-1'],
    limit: 5,
  },
];

export interface PairFixture {
  name: string;
  a: Memory;
  b: Memory;
  expectedDuplicate: boolean;
}

export const DUPLICATE_PAIR_FIXTURES: PairFixture[] = [
  {
    name: 'exact punctuation-only difference',
    a: fixtureMemory({ id: 'p1', type: 'PREFERENCE', title: 'Coffee', summary: 'I like coffee.' }),
    b: fixtureMemory({ id: 'p2', type: 'PREFERENCE', title: 'Coffee', summary: 'I like coffee' }),
    expectedDuplicate: true,
  },
  {
    name: 'same structured city field, different wording',
    a: fixtureMemory({ id: 'l1', type: 'LOCATION_PREFERENCE', title: 'City', summary: 'Lives downtown', structuredPayload: { city: 'Tokyo' } }),
    b: fixtureMemory({ id: 'l2', type: 'LOCATION_PREFERENCE', title: 'Base', summary: 'Currently based there', structuredPayload: { city: 'Tokyo', note: 'confirmed' } }),
    expectedDuplicate: true,
  },
  {
    name: 'high token overlap, same type, no exact/structured match',
    a: fixtureMemory({ id: 't1', type: 'HABIT', title: 'Morning run', summary: 'Goes for a run most mornings before breakfast' }),
    b: fixtureMemory({ id: 't2', type: 'HABIT', title: 'Runs mornings', summary: 'Goes for a run most mornings before work' }),
    expectedDuplicate: true,
  },
  {
    name: 'genuinely unrelated memories of the same type',
    a: fixtureMemory({ id: 'u1', type: 'PREFERENCE', title: 'Coffee', summary: 'I like coffee' }),
    b: fixtureMemory({ id: 'u2', type: 'PREFERENCE', title: 'Music', summary: 'Enjoys jazz on weekends' }),
    expectedDuplicate: false,
  },
  {
    name: 'different types, identical text — never a duplicate by this sprint\'s definition',
    a: fixtureMemory({ id: 'd1', type: 'PREFERENCE', title: 'Coffee', summary: 'I like coffee' }),
    b: fixtureMemory({ id: 'd2', type: 'HABIT', title: 'Coffee', summary: 'I like coffee' }),
    expectedDuplicate: false,
  },
];

export const CONFLICT_PAIR_FIXTURES: PairFixture[] = [
  {
    name: 'canonical Tokyo -> Osaka supersession',
    a: fixtureMemory({ id: 'c1', type: 'LOCATION_PREFERENCE', title: 'Lives', summary: 'I live in Tokyo', createdAt: '2026-01-01' }),
    b: fixtureMemory({ id: 'c2', type: 'LOCATION_PREFERENCE', title: 'Moved', summary: 'I moved to Osaka', createdAt: '2026-06-01' }),
    expectedDuplicate: true, // "expectedDuplicate" reused as "expected conflict" for this fixture list
  },
  {
    name: 'two unrelated EMOTION memories — not a conflict',
    a: fixtureMemory({ id: 'c3', type: 'EMOTION', title: 'Mood', summary: 'Felt anxious about exams', createdAt: '2026-01-01' }),
    b: fixtureMemory({ id: 'c4', type: 'EMOTION', title: 'Mood', summary: 'Felt excited about a trip', createdAt: '2026-02-01' }),
    expectedDuplicate: false,
  },
];
