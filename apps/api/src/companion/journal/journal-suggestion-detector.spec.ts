import { detectJournalSuggestion, excerptFor } from './journal-suggestion-detector';

describe('detectJournalSuggestion', () => {
  it('detects reflective, day-in-review phrasing', () => {
    expect(detectJournalSuggestion('Today was such an emotional rollercoaster, I want to remember this.')).not.toBeNull();
    expect(detectJournalSuggestion("I've been thinking a lot about where my life is heading lately.")).not.toBeNull();
    expect(detectJournalSuggestion('Looking back on this year, it has been a lot.')).not.toBeNull();
  });

  it('never flags a short message, even if it contains a matching phrase', () => {
    expect(detectJournalSuggestion('today was ok')).toBeNull();
  });

  it('never flags ordinary unrelated content', () => {
    expect(detectJournalSuggestion('Can you help me plan my grocery list for the week?')).toBeNull();
  });

  it('never fabricates a reason beyond the fixed template', () => {
    const result = detectJournalSuggestion('Today was such an emotional day, I want to remember this one.');
    expect(result?.reason).toBe('This sounds like something worth keeping — a moment you might want to look back on.');
  });
});

describe('excerptFor', () => {
  it('returns short text unchanged', () => {
    expect(excerptFor('Today was good.')).toBe('Today was good.');
  });

  it('truncates long text with an ellipsis, never fabricating content', () => {
    const long = 'a'.repeat(300);
    const excerpt = excerptFor(long);
    expect(excerpt.length).toBe(201);
    expect(excerpt.endsWith('…')).toBe(true);
    expect(long.startsWith(excerpt.slice(0, -1))).toBe(true);
  });
});
