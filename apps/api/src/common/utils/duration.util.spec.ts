import { parseDurationMs } from './duration.util';

describe('parseDurationMs', () => {
  it('parses seconds', () => {
    expect(parseDurationMs('30s')).toBe(30_000);
  });

  it('parses minutes', () => {
    expect(parseDurationMs('15m')).toBe(15 * 60_000);
  });

  it('parses hours', () => {
    expect(parseDurationMs('1h')).toBe(60 * 60_000);
  });

  it('parses days', () => {
    expect(parseDurationMs('30d')).toBe(30 * 24 * 60 * 60_000);
  });

  it('throws on an invalid unit', () => {
    expect(() => parseDurationMs('15x')).toThrow();
  });

  it('throws on a malformed string', () => {
    expect(() => parseDurationMs('fifteen minutes')).toThrow();
  });
});
