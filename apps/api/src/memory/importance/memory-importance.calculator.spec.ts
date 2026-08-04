import { MemoryImportanceCalculator, IMPORTANCE_PINNED_FLOOR } from './memory-importance.calculator';

const NOW = new Date('2026-08-04T00:00:00.000Z');

function baseInput(overrides: Partial<Parameters<typeof MemoryImportanceCalculator.calculate>[0]> = {}) {
  return {
    type: 'CUSTOM' as const,
    sourceType: 'MIGRATED_LEGACY' as const,
    pinned: false,
    explicitEmphasis: false,
    explicitFutureRelevance: false,
    recurrenceCount: 0,
    createdAt: NOW,
    lastReferencedAt: null,
    now: NOW,
    ...overrides,
  };
}

describe('MemoryImportanceCalculator', () => {
  it('scores a brand-new, unremarkable migrated memory low but non-zero (recency only)', () => {
    const result = MemoryImportanceCalculator.calculate(baseInput());
    expect(result.score).toBe(10);
    expect(result.factors).toEqual({ recency: 10 });
  });

  it('is deterministic — identical input always yields identical output', () => {
    const input = baseInput({ type: 'GOAL', recurrenceCount: 3 });
    const a = MemoryImportanceCalculator.calculate(input);
    const b = MemoryImportanceCalculator.calculate(input);
    expect(a).toEqual(b);
  });

  it('floors a pinned memory at the pinned floor even with otherwise-low factors', () => {
    const result = MemoryImportanceCalculator.calculate(
      baseInput({ pinned: true, createdAt: new Date('2020-01-01T00:00:00.000Z'), lastReferencedAt: null }),
    );
    expect(result.score).toBe(IMPORTANCE_PINNED_FLOOR);
    expect(result.factors.manualPin).toBe(35);
  });

  it('lets a pinned memory exceed the floor when other factors push it higher', () => {
    const result = MemoryImportanceCalculator.calculate(
      baseInput({ pinned: true, type: 'IMPORTANT_EVENT', sourceType: 'USER_EXPLICIT', recurrenceCount: 4 }),
    );
    // 35 (pin) + 15 (emphasis, USER_EXPLICIT) + 14 (life event) + 16 (recurrence cap) + 10 (recency) + 8 (source) = 98
    expect(result.score).toBe(98);
    expect(result.score).toBeGreaterThan(IMPORTANCE_PINNED_FLOOR);
  });

  it('credits explicit user emphasis for USER_EXPLICIT source even without a structuredPayload flag', () => {
    const result = MemoryImportanceCalculator.calculate(baseInput({ sourceType: 'USER_EXPLICIT' }));
    expect(result.factors.explicitEmphasis).toBe(15);
  });

  it('credits future relevance for GOAL/DECISION types automatically', () => {
    expect(MemoryImportanceCalculator.calculate(baseInput({ type: 'GOAL' })).factors.futureRelevance).toBe(12);
    expect(MemoryImportanceCalculator.calculate(baseInput({ type: 'DECISION' })).factors.futureRelevance).toBe(12);
    expect(MemoryImportanceCalculator.calculate(baseInput({ type: 'EMOTION' })).factors.futureRelevance).toBeUndefined();
  });

  it('caps the recurrence contribution at 16 regardless of how large recurrenceCount grows', () => {
    expect(MemoryImportanceCalculator.calculate(baseInput({ recurrenceCount: 4 })).factors.recurrence).toBe(16);
    expect(MemoryImportanceCalculator.calculate(baseInput({ recurrenceCount: 100 })).factors.recurrence).toBe(16);
  });

  it('credits goal-relation types', () => {
    for (const type of ['GOAL', 'ACHIEVEMENT', 'CHALLENGE'] as const) {
      expect(MemoryImportanceCalculator.calculate(baseInput({ type })).factors.goalRelation).toBe(10);
    }
  });

  it('credits preference-relation types', () => {
    for (const type of ['PREFERENCE', 'INTEREST', 'LOCATION_PREFERENCE'] as const) {
      expect(MemoryImportanceCalculator.calculate(baseInput({ type })).factors.preferenceRelation).toBe(6);
    }
  });

  it('credits life-event type', () => {
    expect(MemoryImportanceCalculator.calculate(baseInput({ type: 'IMPORTANT_EVENT' })).factors.lifeEvent).toBe(14);
  });

  it('credits long-term-usefulness types', () => {
    for (const type of ['IDENTITY', 'RELATIONSHIP', 'HABIT', 'ROUTINE', 'WORK', 'STUDY', 'PET'] as const) {
      expect(MemoryImportanceCalculator.calculate(baseInput({ type })).factors.longTermUsefulness).toBe(10);
    }
  });

  it('decays recency by 1 point per 15-day period since last reference (or creation)', () => {
    const result = MemoryImportanceCalculator.calculate(
      baseInput({ createdAt: new Date('2026-07-01T00:00:00.000Z') }), // 34 days before NOW
    );
    // floor(34/15) = 2 decay steps -> 10 - 2 = 8
    expect(result.factors.recency).toBe(8);
  });

  it('prefers lastReferencedAt over createdAt for recency when both are present', () => {
    const result = MemoryImportanceCalculator.calculate(
      baseInput({
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
        lastReferencedAt: NOW,
      }),
    );
    expect(result.factors.recency).toBe(10);
  });

  it('never lets recency go negative for very old memories', () => {
    const result = MemoryImportanceCalculator.calculate(
      baseInput({ createdAt: new Date('2000-01-01T00:00:00.000Z') }),
    );
    expect(result.factors.recency).toBeUndefined();
    expect(result.score).toBe(0);
  });

  it('credits user-created-vs-imported for USER_EXPLICIT/COMPANION/ONBOARDING but not MIGRATED_LEGACY/SYSTEM_TEST', () => {
    for (const sourceType of ['USER_EXPLICIT', 'COMPANION', 'ONBOARDING'] as const) {
      expect(MemoryImportanceCalculator.calculate(baseInput({ sourceType })).factors.userCreatedSource).toBe(8);
    }
    for (const sourceType of ['MIGRATED_LEGACY', 'SYSTEM_TEST'] as const) {
      expect(MemoryImportanceCalculator.calculate(baseInput({ sourceType })).factors.userCreatedSource).toBeUndefined();
    }
  });

  it('clamps the total score at 100 even if every factor fires at once', () => {
    const result = MemoryImportanceCalculator.calculate(
      baseInput({
        pinned: true,
        type: 'IMPORTANT_EVENT',
        sourceType: 'USER_EXPLICIT',
        explicitEmphasis: true,
        explicitFutureRelevance: true,
        recurrenceCount: 10,
      }),
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('never returns a negative score', () => {
    const result = MemoryImportanceCalculator.calculate(
      baseInput({ createdAt: new Date('1990-01-01T00:00:00.000Z'), sourceType: 'SYSTEM_TEST' }),
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
