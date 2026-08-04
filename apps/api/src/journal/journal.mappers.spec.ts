import { countWords, readingTimeMinutesFor } from './journal.mappers';

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('returns 0 for empty or whitespace-only content', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('collapses multiple whitespace runs', () => {
    expect(countWords('one   two\n\nthree')).toBe(3);
  });
});

describe('readingTimeMinutesFor', () => {
  it('is 0 for an empty entry', () => {
    expect(readingTimeMinutesFor(0)).toBe(0);
  });

  it('rounds up so a short entry still reads "1 min," never "0 min"', () => {
    expect(readingTimeMinutesFor(5)).toBe(1);
  });

  it('is deterministic and derived only from word count — 400 words is 2 minutes at 200wpm', () => {
    expect(readingTimeMinutesFor(400)).toBe(2);
    expect(readingTimeMinutesFor(401)).toBe(3);
  });
});
