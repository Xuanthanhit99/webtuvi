import { classifyDuplicate, orderPair, type DuplicateCandidate } from './memory-duplicate.util';

function candidate(overrides: Partial<DuplicateCandidate> = {}): DuplicateCandidate {
  return {
    id: overrides.id ?? 'a',
    type: overrides.type ?? 'PREFERENCE',
    title: overrides.title ?? 'Title',
    summary: overrides.summary ?? 'Summary',
    structuredPayload: overrides.structuredPayload ?? null,
  };
}

describe('classifyDuplicate', () => {
  it('returns null for different types even if text is identical', () => {
    const a = candidate({ type: 'PREFERENCE', summary: 'I like coffee' });
    const b = candidate({ type: 'HABIT', summary: 'I like coffee' });
    expect(classifyDuplicate(a, b)).toBeNull();
  });

  it('detects EXACT duplicates (identical raw text)', () => {
    const a = candidate({ title: 'Coffee', summary: 'I like coffee' });
    const b = candidate({ title: 'Coffee', summary: 'I like coffee' });
    const match = classifyDuplicate(a, b);
    expect(match).toEqual({ matchType: 'EXACT', similarity: 100, reason: expect.any(String) });
  });

  it('detects NORMALIZED duplicates ("I like coffee." vs "I like coffee")', () => {
    const a = candidate({ title: 'Coffee', summary: 'I like coffee.' });
    const b = candidate({ title: 'Coffee', summary: 'I like coffee' });
    const match = classifyDuplicate(a, b);
    expect(match?.matchType).toBe('NORMALIZED');
    expect(match?.similarity).toBe(100);
  });

  it('detects STRUCTURED duplicates sharing a matching key even with different text', () => {
    const a = candidate({ summary: 'Lives downtown now', structuredPayload: { city: 'Tokyo' } });
    const b = candidate({ summary: 'Currently based there', structuredPayload: { city: 'Tokyo', note: 'confirmed' } });
    const match = classifyDuplicate(a, b);
    expect(match?.matchType).toBe('STRUCTURED');
  });

  it('does not flag STRUCTURED when the shared key differs (that is a conflict, not a duplicate)', () => {
    const a = candidate({ summary: 'Lives in Tokyo now', structuredPayload: { city: 'Tokyo' } });
    const b = candidate({ summary: 'Recently relocated somewhere else entirely', structuredPayload: { city: 'Osaka' } });
    expect(classifyDuplicate(a, b)).toBeNull();
  });

  it('detects TYPE_SPECIFIC duplicates via high token overlap without exact/normalized/structured match', () => {
    const a = candidate({ title: 'Morning coffee habit', summary: 'I drink coffee every single morning before work' });
    const b = candidate({ title: 'Coffee every morning', summary: 'I drink coffee every morning before work starts' });
    const match = classifyDuplicate(a, b);
    expect(match?.matchType).toBe('TYPE_SPECIFIC');
    expect(match!.similarity).toBeGreaterThanOrEqual(60);
  });

  it('returns null for genuinely unrelated same-type memories', () => {
    const a = candidate({ summary: 'I like coffee' });
    const b = candidate({ summary: 'My favorite season is autumn' });
    expect(classifyDuplicate(a, b)).toBeNull();
  });

  it('prioritizes EXACT over NORMALIZED/STRUCTURED when text is truly identical', () => {
    const a = candidate({ summary: 'Same text', structuredPayload: { key: 'x' } });
    const b = candidate({ summary: 'Same text', structuredPayload: { key: 'y' } });
    // Exact text match wins even though structured payload differs (would otherwise be
    // neither STRUCTURED nor a conflict per classifyDuplicate's own rules).
    expect(classifyDuplicate(a, b)?.matchType).toBe('EXACT');
  });
});

describe('orderPair', () => {
  it('returns the same order regardless of input order', () => {
    expect(orderPair('a', 'b')).toEqual(['a', 'b']);
    expect(orderPair('b', 'a')).toEqual(['a', 'b']);
  });
});
