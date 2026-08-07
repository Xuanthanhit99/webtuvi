import { BadRequestException } from '@nestjs/common';
import { buildReviewDedupeKey, resolveReviewWindow } from './review-window.util';

describe('resolveReviewWindow', () => {
  it('WEEK resolves to the containing ISO week (Monday 00:00 UTC - Sunday 23:59:59.999 UTC)', () => {
    // 2026-01-07 is a Wednesday.
    const now = new Date('2026-01-07T15:30:00.000Z');
    const { windowStart, windowEnd } = resolveReviewWindow('WEEK', undefined, undefined, now);
    expect(windowStart.toISOString()).toBe('2026-01-05T00:00:00.000Z');
    expect(windowEnd.toISOString()).toBe('2026-01-11T23:59:59.999Z');
  });

  it('WEEK correctly handles a Sunday (day 0)', () => {
    const now = new Date('2026-01-11T08:00:00.000Z');
    const { windowStart, windowEnd } = resolveReviewWindow('WEEK', undefined, undefined, now);
    expect(windowStart.toISOString()).toBe('2026-01-05T00:00:00.000Z');
    expect(windowEnd.toISOString()).toBe('2026-01-11T23:59:59.999Z');
  });

  it('MONTH resolves to the containing calendar month', () => {
    const now = new Date('2026-02-15T12:00:00.000Z');
    const { windowStart, windowEnd } = resolveReviewWindow('MONTH', undefined, undefined, now);
    expect(windowStart.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(windowEnd.toISOString()).toBe('2026-02-28T23:59:59.999Z');
  });

  it('regenerating later in the same week/month resolves to the identical window — the idempotent-regeneration invariant', () => {
    const monday = resolveReviewWindow('WEEK', undefined, undefined, new Date('2026-01-05T00:00:01.000Z'));
    const friday = resolveReviewWindow('WEEK', undefined, undefined, new Date('2026-01-09T23:00:00.000Z'));
    expect(monday.windowStart.getTime()).toBe(friday.windowStart.getTime());
    expect(monday.windowEnd.getTime()).toBe(friday.windowEnd.getTime());
  });

  it('CUSTOM uses the caller-supplied from/to exactly', () => {
    const { windowStart, windowEnd } = resolveReviewWindow('CUSTOM', '2026-01-01T00:00:00.000Z', '2026-01-10T00:00:00.000Z');
    expect(windowStart.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(windowEnd.toISOString()).toBe('2026-01-10T00:00:00.000Z');
  });

  it('CUSTOM without from/to throws', () => {
    expect(() => resolveReviewWindow('CUSTOM', undefined, undefined)).toThrow(BadRequestException);
  });

  it('CUSTOM with from after to throws', () => {
    expect(() => resolveReviewWindow('CUSTOM', '2026-02-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')).toThrow(BadRequestException);
  });
});

describe('buildReviewDedupeKey', () => {
  it('is stable for the same window/start/end', () => {
    const start = new Date('2026-01-05T00:00:00.000Z');
    const end = new Date('2026-01-11T23:59:59.999Z');
    expect(buildReviewDedupeKey('WEEK', start, end)).toBe(buildReviewDedupeKey('WEEK', start, end));
  });

  it('differs across windows for the same dates', () => {
    const start = new Date('2026-01-05T00:00:00.000Z');
    const end = new Date('2026-01-11T23:59:59.999Z');
    expect(buildReviewDedupeKey('WEEK', start, end)).not.toBe(buildReviewDedupeKey('CUSTOM', start, end));
  });
});
