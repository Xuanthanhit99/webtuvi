import { detectHighConfidenceFabrication, detectPii } from './pii-detector';

describe('detectPii', () => {
  it('detects an email address', () => {
    expect(detectPii('reach me at alex@example.com').categories).toContain('email');
  });

  it('detects a phone number', () => {
    expect(detectPii('call me at 415-555-0199').categories).toContain('phone');
  });

  it('detects an SSN-shaped number', () => {
    expect(detectPii('my ssn is 123-45-6789').categories).toContain('ssn');
  });

  it('finds nothing in ordinary text', () => {
    const result = detectPii('I had a good day today and felt calm.');
    expect(result.found).toBe(false);
    expect(result.categories).toHaveLength(0);
  });
});

describe('detectHighConfidenceFabrication', () => {
  it('flags an SSN-shaped number (used to catch the assistant fabricating one)', () => {
    expect(detectHighConfidenceFabrication('Your SSN is 123-45-6789')).toBe(true);
  });

  it('does not flag an email or ordinary sentence (too common/legitimate to block on)', () => {
    expect(detectHighConfidenceFabrication('Feel free to email me at alex@example.com')).toBe(false);
    expect(detectHighConfidenceFabrication('That sounds like a lot to carry.')).toBe(false);
  });
});
