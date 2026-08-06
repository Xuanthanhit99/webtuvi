import { BadRequestException } from '@nestjs/common';
import { resolveTimelineRange } from './insight-timeline-range.util';

const NOW = new Date('2026-01-15T12:00:00.000Z');

describe('resolveTimelineRange', () => {
  it('today: from the start of the UTC calendar day to now', () => {
    const { from, to } = resolveTimelineRange('today', undefined, undefined, NOW);
    expect(from.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    expect(to).toBe(NOW);
  });

  it('week: the last 7 days', () => {
    const { from, to } = resolveTimelineRange('week', undefined, undefined, NOW);
    expect(from.toISOString()).toBe('2026-01-08T12:00:00.000Z');
    expect(to).toBe(NOW);
  });

  it('month: the last 30 days', () => {
    const { from, to } = resolveTimelineRange('month', undefined, undefined, NOW);
    expect(from.toISOString()).toBe('2025-12-16T12:00:00.000Z');
    expect(to).toBe(NOW);
  });

  it('custom: uses the caller-supplied from/to exactly, never guessed', () => {
    const { from, to } = resolveTimelineRange('custom', '2026-01-01T00:00:00.000Z', '2026-01-10T00:00:00.000Z', NOW);
    expect(from.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-01-10T00:00:00.000Z');
  });

  it('custom without from/to throws', () => {
    expect(() => resolveTimelineRange('custom', undefined, undefined, NOW)).toThrow(BadRequestException);
  });

  it('custom with from after to throws', () => {
    expect(() => resolveTimelineRange('custom', '2026-01-10T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NOW)).toThrow(BadRequestException);
  });
});
