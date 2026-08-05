import { determineInsightReadiness } from './insight-readiness.util';

describe('determineInsightReadiness', () => {
  it('returns NOT_READY when there is no evidence at all', () => {
    expect(determineInsightReadiness(80, 0, 0)).toBe('NOT_READY');
  });

  it('returns NOT_READY when priority is below the floor, regardless of evidence', () => {
    expect(determineInsightReadiness(39, 5, 90)).toBe('NOT_READY');
  });

  it('returns INSUFFICIENT_EVIDENCE for a decent priority with only 1 weak-scored evidence', () => {
    expect(determineInsightReadiness(50, 1, 50)).toBe('INSUFFICIENT_EVIDENCE');
  });

  it('returns READY for a single but strongly-scored piece of evidence', () => {
    expect(determineInsightReadiness(50, 1, 70)).toBe('READY');
  });

  it('returns READY for >= 2 evidence with sufficient priority, regardless of individual scores', () => {
    expect(determineInsightReadiness(50, 2, 40)).toBe('READY');
  });
});
