import { classifyConflict, type ConflictCandidate } from './memory-conflict.util';

function candidate(overrides: Partial<ConflictCandidate> = {}): ConflictCandidate {
  return {
    id: overrides.id ?? 'a',
    type: overrides.type ?? 'LOCATION_PREFERENCE',
    title: overrides.title ?? 'Title',
    summary: overrides.summary ?? 'Summary',
    structuredPayload: overrides.structuredPayload ?? null,
  };
}

describe('classifyConflict', () => {
  it('detects the canonical "moved to" supersession example', () => {
    const older = candidate({ type: 'LOCATION_PREFERENCE', title: 'Lives in Tokyo', summary: 'I live in Tokyo' });
    const newer = candidate({ type: 'LOCATION_PREFERENCE', title: 'Moved', summary: 'I moved to Osaka' });
    const match = classifyConflict(older, newer);
    expect(match?.status).toBe('SUPERSEDED');
  });

  it('returns null for different types', () => {
    const older = candidate({ type: 'LOCATION_PREFERENCE' });
    const newer = candidate({ type: 'WORK' });
    expect(classifyConflict(older, newer)).toBeNull();
  });

  it('returns null when the pair is actually a duplicate, not a conflict', () => {
    const older = candidate({ summary: 'I live in Tokyo.' });
    const newer = candidate({ summary: 'I live in Tokyo' });
    expect(classifyConflict(older, newer)).toBeNull();
  });

  it('flags a plain CONFLICT for a single-valued type with no supersession keyword', () => {
    const older = candidate({ type: 'LOCATION_PREFERENCE', summary: 'I live in Tokyo' });
    const newer = candidate({ type: 'LOCATION_PREFERENCE', summary: 'My home base is Berlin' });
    const match = classifyConflict(older, newer);
    expect(match?.status).toBe('CONFLICT');
  });

  it('flags a structured-field CONFLICT for a non-single-valued type when a shared key differs', () => {
    const older = candidate({
      type: 'GOAL',
      summary: 'Targeting a promotion this year',
      structuredPayload: { targetDate: '2026-01-01' },
    });
    const newer = candidate({
      type: 'GOAL',
      summary: 'Aiming higher than before',
      structuredPayload: { targetDate: '2027-06-01' },
    });
    const match = classifyConflict(older, newer);
    expect(match?.status).toBe('CONFLICT');
    expect(match?.reason).toContain('targetDate');
  });

  it('relabels a structured-field disagreement as SUPERSEDED when a supersession keyword is present', () => {
    const older = candidate({
      type: 'GOAL',
      summary: 'Targeting a promotion this year',
      structuredPayload: { targetDate: '2026-01-01' },
    });
    const newer = candidate({
      type: 'GOAL',
      summary: 'I switched to a new target date',
      structuredPayload: { targetDate: '2027-06-01' },
    });
    expect(classifyConflict(older, newer)?.status).toBe('SUPERSEDED');
  });

  it('does not flag non-single-valued types with no structured disagreement', () => {
    const older = candidate({ type: 'EMOTION', summary: 'Feeling anxious about exams' });
    const newer = candidate({ type: 'EMOTION', summary: 'Feeling excited about a trip' });
    expect(classifyConflict(older, newer)).toBeNull();
  });

  it('never returns null-crashing on missing structuredPayload', () => {
    const older = candidate({ type: 'IDENTITY', structuredPayload: null, summary: 'Goes by Alex' });
    const newer = candidate({ type: 'IDENTITY', structuredPayload: null, summary: 'Prefers to be called Sam now' });
    expect(() => classifyConflict(older, newer)).not.toThrow();
  });
});
