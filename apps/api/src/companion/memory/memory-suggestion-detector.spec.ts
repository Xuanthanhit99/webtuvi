import { detectSuggestion } from './memory-suggestion-detector';

describe('detectSuggestion', () => {
  it('detects a GOAL statement', () => {
    const result = detectSuggestion('My goal is to run a marathon next year');
    expect(result?.type).toBe('GOAL');
  });

  it('detects an IDENTITY statement', () => {
    const result = detectSuggestion('My name is Alex and I use they/them pronouns');
    expect(result?.type).toBe('IDENTITY');
  });

  it('detects an IMPORTANT_EVENT statement', () => {
    const result = detectSuggestion('I just got married last weekend, it was wonderful');
    expect(result?.type).toBe('IMPORTANT_EVENT');
  });

  it('detects a WORK statement', () => {
    const result = detectSuggestion('I just started a new job at a tech company');
    expect(result?.type).toBe('WORK');
  });

  it('detects a LOCATION_PREFERENCE statement', () => {
    const result = detectSuggestion('I just moved to Osaka last month');
    expect(result?.type).toBe('LOCATION_PREFERENCE');
  });

  it('detects a RELATIONSHIP statement', () => {
    const result = detectSuggestion('My partner and I have been together for five years');
    expect(result?.type).toBe('RELATIONSHIP');
  });

  it('detects a PET statement', () => {
    const result = detectSuggestion('My dog named Biscuit turned three today');
    expect(result?.type).toBe('PET');
  });

  it('detects a PREFERENCE statement', () => {
    const result = detectSuggestion('I really love drinking coffee in the morning');
    expect(result?.type).toBe('PREFERENCE');
  });

  it('never detects a HEALTH suggestion, even from health-shaped language', () => {
    const result = detectSuggestion('I was just diagnosed with something and I feel like I love learning about it');
    // The PREFERENCE rule ("I love") may still match — the point is no rule ever emits HEALTH.
    expect(result?.type).not.toBe('HEALTH');
  });

  it('returns null for short, unremarkable text', () => {
    expect(detectSuggestion('ok')).toBeNull();
    expect(detectSuggestion('lol')).toBeNull();
  });

  it('returns null for text matching no rule', () => {
    expect(detectSuggestion('The weather has been quite unpredictable this week')).toBeNull();
  });

  it('is deterministic — identical input always yields identical output', () => {
    const a = detectSuggestion('My goal is to learn Japanese');
    const b = detectSuggestion('My goal is to learn Japanese');
    expect(a).toEqual(b);
  });

  it('never includes a reason that fabricates certainty — reason is always the fixed rule text', () => {
    const result = detectSuggestion('My goal is to learn Japanese');
    expect(result?.reason).toBe('This sounds like a goal you have.');
  });
});
