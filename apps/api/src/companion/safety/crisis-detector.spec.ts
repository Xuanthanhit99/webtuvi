import { detectCrisis } from './crisis-detector';

describe('detectCrisis', () => {
  it('detects common crisis phrasing', () => {
    expect(detectCrisis('I want to kill myself')).toBe(true);
    expect(detectCrisis("I don't want to live anymore")).toBe(true);
    expect(detectCrisis('thinking about suicide lately')).toBe(true);
    expect(detectCrisis('I keep hurting myself')).toBe(true);
    expect(detectCrisis("I'd be better off dead")).toBe(true);
  });

  it('does not flag ordinary difficult conversation', () => {
    expect(detectCrisis('I had a really hard day at work')).toBe(false);
    expect(detectCrisis('My job is killing me with stress')).toBe(false);
    expect(detectCrisis('I feel stuck and unsure what to do next')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(detectCrisis('I WANT TO DIE')).toBe(true);
  });
});
