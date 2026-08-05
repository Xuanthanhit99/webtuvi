import { classifyRelationship } from './insight-relationship.util';
import { makeReflection, daysAfter } from '../test-fixtures';

describe('classifyRelationship', () => {
  it('returns null for two identical (same-id) candidates', () => {
    const r = makeReflection({ id: 'r1' });
    expect(classifyRelationship(r, r)).toBeNull();
  });

  it('returns null when neither groupKey nor category match', () => {
    const a = makeReflection({ id: 'r1', groupKey: 'TOPIC:a', category: 'TOPIC', trigger: 'REPEATED_TOPIC' });
    const b = makeReflection({ id: 'r2', groupKey: 'GOAL:b', category: 'GOAL', trigger: 'REPEATED_GOAL' });
    expect(classifyRelationship(a, b)).toBeNull();
  });

  describe('same groupKey + same trigger (temporal family)', () => {
    it('classifies REPEATS when the older candidate was resolved', () => {
      const older = makeReflection({
        id: 'r1', groupKey: 'JOURNAL:tag:running', trigger: 'REPEATED_JOURNAL_THEME', state: 'DISMISSED',
        windowEnd: new Date('2026-01-01'), score: 40,
      });
      const newer = makeReflection({
        id: 'r2', groupKey: 'JOURNAL:tag:running', trigger: 'REPEATED_JOURNAL_THEME', state: 'READY',
        windowStart: new Date('2026-01-10'), windowEnd: new Date('2026-01-15'), score: 44,
      });
      const result = classifyRelationship(older, newer);
      expect(result?.type).toBe('REPEATS');
    });

    it('classifies STAGNATES when scores are within the stagnation band', () => {
      const older = makeReflection({ id: 'r1', groupKey: 'GOAL:g1', trigger: 'GOAL_ACTIVITY_MISMATCH', state: 'READY', windowEnd: new Date('2026-01-01'), score: 50 });
      const newer = makeReflection({ id: 'r2', groupKey: 'GOAL:g1', trigger: 'GOAL_ACTIVITY_MISMATCH', state: 'READY', windowStart: new Date('2026-01-15'), windowEnd: new Date('2026-01-15'), score: 54 });
      expect(classifyRelationship(older, newer)?.type).toBe('STAGNATES');
    });

    it('classifies IMPROVES when score rises by >= the improve threshold', () => {
      const older = makeReflection({ id: 'r1', groupKey: 'WELLBEING:positive:a', trigger: 'POSITIVE_STREAK', state: 'READY', windowEnd: new Date('2026-01-01'), score: 40 });
      const newer = makeReflection({ id: 'r2', groupKey: 'WELLBEING:positive:a', trigger: 'POSITIVE_STREAK', state: 'READY', windowStart: new Date('2026-01-10'), windowEnd: new Date('2026-01-10'), score: 60 });
      expect(classifyRelationship(older, newer)?.type).toBe('IMPROVES');
    });

    it('classifies REGRESSES when score falls by >= the regress threshold', () => {
      const older = makeReflection({ id: 'r1', groupKey: 'WELLBEING:positive:a', trigger: 'POSITIVE_STREAK', state: 'READY', windowEnd: new Date('2026-01-01'), score: 60 });
      const newer = makeReflection({ id: 'r2', groupKey: 'WELLBEING:positive:a', trigger: 'POSITIVE_STREAK', state: 'READY', windowStart: new Date('2026-01-10'), windowEnd: new Date('2026-01-10'), score: 40 });
      expect(classifyRelationship(older, newer)?.type).toBe('REGRESSES');
    });

    it('classifies CONTINUES for an unresolved, non-stagnant, non-improving/regressing repeat', () => {
      const older = makeReflection({ id: 'r1', groupKey: 'TOPIC:t1', trigger: 'REPEATED_TOPIC', state: 'READY', windowEnd: new Date('2026-01-01'), score: 40 });
      // delta of exactly 9 is >= STAGNATION_BAND(8) and < IMPROVE_THRESHOLD(10) -> CONTINUES
      const newer = makeReflection({ id: 'r2', groupKey: 'TOPIC:t1', trigger: 'REPEATED_TOPIC', state: 'READY', windowStart: new Date('2026-01-10'), windowEnd: new Date('2026-01-10'), score: 49 });
      expect(classifyRelationship(older, newer)?.type).toBe('CONTINUES');
    });

    it('is symmetric — argument order does not change the result', () => {
      const older = makeReflection({ id: 'r1', groupKey: 'TOPIC:t1', trigger: 'REPEATED_TOPIC', state: 'READY', windowEnd: new Date('2026-01-01'), score: 40 });
      const newer = makeReflection({ id: 'r2', groupKey: 'TOPIC:t1', trigger: 'REPEATED_TOPIC', state: 'READY', windowStart: new Date('2026-01-10'), windowEnd: new Date('2026-01-10'), score: 60 });
      expect(classifyRelationship(older, newer)?.type).toBe(classifyRelationship(newer, older)?.type);
    });
  });

  describe('same category, different groupKey (cross-evidence)', () => {
    it('classifies CONTRADICTS for a fixed opposite-trigger pair within the relation window', () => {
      const a = makeReflection({ id: 'r1', category: 'WELLBEING', groupKey: 'WELLBEING:positive:a', trigger: 'POSITIVE_STREAK', windowEnd: new Date('2026-01-01') });
      const b = makeReflection({ id: 'r2', category: 'WELLBEING', groupKey: 'WELLBEING:negative:b', trigger: 'NEGATIVE_STREAK', windowStart: new Date('2026-01-05'), windowEnd: new Date('2026-01-05') });
      expect(classifyRelationship(a, b)?.type).toBe('CONTRADICTS');
    });

    it('classifies SUPPORTS for a same-category, non-contradicting pair within the relation window', () => {
      const a = makeReflection({ id: 'r1', category: 'GOAL', groupKey: 'GOAL:memory-1', trigger: 'REPEATED_GOAL', windowEnd: new Date('2026-01-01') });
      const b = makeReflection({ id: 'r2', category: 'GOAL', groupKey: 'ALIGNMENT:memory-1:journal-1', trigger: 'MEMORY_JOURNAL_ALIGNMENT', windowStart: new Date('2026-01-05'), windowEnd: new Date('2026-01-05') });
      expect(classifyRelationship(a, b)?.type).toBe('SUPPORTS');
    });

    it('returns null when the same-category pair is further apart than the relation window', () => {
      const a = makeReflection({ id: 'r1', category: 'GOAL', groupKey: 'GOAL:memory-1', trigger: 'REPEATED_GOAL', windowEnd: new Date('2026-01-01') });
      const b = makeReflection({ id: 'r2', category: 'GOAL', groupKey: 'GOAL:memory-2', trigger: 'REPEATED_GOAL', windowStart: daysAfter(60, new Date('2026-01-01')), windowEnd: daysAfter(60, new Date('2026-01-01')) });
      expect(classifyRelationship(a, b)).toBeNull();
    });
  });
});
