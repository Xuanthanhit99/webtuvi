import { estimateCostUsd } from './pricing';

describe('estimateCostUsd', () => {
  it('computes cost from prompt + completion tokens for a known model', () => {
    const cost = estimateCostUsd('openai', 'gpt-4o-mini', 1000, 1000);
    expect(cost).toBeCloseTo(0.00015 + 0.0006, 6);
  });

  it('returns 0 for the mock provider (no real cost)', () => {
    expect(estimateCostUsd('mock', 'mock-model', 10_000, 10_000)).toBe(0);
  });

  it('returns 0 for an unknown model rather than throwing', () => {
    expect(estimateCostUsd('openai', 'not-a-real-model', 1000, 1000)).toBe(0);
  });
});
