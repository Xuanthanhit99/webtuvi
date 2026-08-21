import { buildTuViCalendarContext, TUVI_RULESET_VERSION } from './tu-vi-calendar-context';
import { TuViBirthInputValidationError } from './tu-vi-canonical-input';
import { TUVI_CALENDAR_VERSION } from './tu-vi-calendar.adapter';

describe('buildTuViCalendarContext — full orchestration', () => {
  it('assembles solarDate, birthTime, lunarDate, hourBranch, effectiveTuViDate, and both versions', () => {
    const context = buildTuViCalendarContext({ birthDate: '2024-02-10', birthTime: '10:30' });
    expect(context.solarDate).toEqual({ year: 2024, month: 2, day: 10 });
    expect(context.birthTime).toEqual({ hour: 10, minute: 30 });
    expect(context.timezoneOffsetHours).toBe(7);
    expect(context.lunarDate).toEqual({ lunarYear: 2024, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
    expect(context.hourBranch).toBe('Tỵ');
    expect(context.effectiveTuViDate).toEqual({ year: 2024, month: 2, day: 10 });
    expect(context.calendarVersion).toBe(TUVI_CALENDAR_VERSION);
    expect(context.rulesetVersion).toBe(TUVI_RULESET_VERSION);
  });

  it('the returned context and its nested objects are frozen (immutable)', () => {
    const context = buildTuViCalendarContext({ birthDate: '2024-02-10', birthTime: '10:30' });
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.solarDate)).toBe(true);
    expect(Object.isFrozen(context.birthTime)).toBe(true);
    expect(Object.isFrozen(context.lunarDate)).toBe(true);
    expect(Object.isFrozen(context.effectiveTuViDate)).toBe(true);
  });

  it('propagates TuViBirthInputValidationError for invalid input rather than swallowing it', () => {
    expect(() => buildTuViCalendarContext({ birthDate: '2025-02-31', birthTime: '10:00' })).toThrow(TuViBirthInputValidationError);
  });
});

describe('buildTuViCalendarContext — version fields (exact expected values)', () => {
  it('calendarVersion is exactly "tuvi-calendar-hnd-v1"', () => {
    const context = buildTuViCalendarContext({ birthDate: '2000-01-01', birthTime: '00:00' });
    expect(context.calendarVersion).toBe('tuvi-calendar-hnd-v1');
  });

  it('rulesetVersion is exactly "vdttl-1956-v1" (canonical-ruleset-v1.md §7)', () => {
    const context = buildTuViCalendarContext({ birthDate: '2000-01-01', birthTime: '00:00' });
    expect(context.rulesetVersion).toBe('vdttl-1956-v1');
  });
});

/**
 * TUVI-GIO-02 — the midnight-rollover convention lock, exercised end to end. `effectiveTuViDate`
 * must never shift relative to `solarDate` under this locked convention, even directly across the
 * Tý-hour midnight boundary where the hour BRANCH label stays constant but the calendar day does
 * not.
 */
describe('buildTuViCalendarContext — effective-day policy (TUVI-GIO-02 convention lock)', () => {
  it('a 23:30 birth uses its own calendar date as the effective date — the day that is ending, not shifted forward', () => {
    const context = buildTuViCalendarContext({ birthDate: '2024-03-15', birthTime: '23:30' });
    expect(context.hourBranch).toBe('Tý');
    expect(context.effectiveTuViDate).toEqual({ year: 2024, month: 3, day: 15 });
  });

  it('a 00:30 birth the next civil day uses ITS OWN calendar date as the effective date — the day that has begun, not shifted backward', () => {
    const context = buildTuViCalendarContext({ birthDate: '2024-03-16', birthTime: '00:30' });
    expect(context.hourBranch).toBe('Tý');
    expect(context.effectiveTuViDate).toEqual({ year: 2024, month: 3, day: 16 });
  });

  it('these two adjacent-hour, same-hour-branch births produce DIFFERENT effective dates and different lunar days — proving no "Giờ Tý Sơ"-style whole-window shift is applied', () => {
    const before = buildTuViCalendarContext({ birthDate: '2024-03-15', birthTime: '23:30' });
    const after = buildTuViCalendarContext({ birthDate: '2024-03-16', birthTime: '00:30' });
    expect(before.hourBranch).toBe(after.hourBranch); // same label ("Tý")
    expect(before.effectiveTuViDate).not.toEqual(after.effectiveTuViDate); // different effective day
    expect(before.lunarDate.lunarDay).not.toBe(after.lunarDate.lunarDay); // different lunar day
  });

  it('effectiveTuViDate always equals solarDate under the locked convention, for an arbitrary spread of hours including both sides of midnight', () => {
    const hours: Array<[date: string, time: string]> = [
      ['2024-06-01', '00:00'],
      ['2024-06-01', '12:00'],
      ['2024-06-01', '23:59'],
      ['2024-06-02', '00:00'],
    ];
    for (const [birthDate, birthTime] of hours) {
      const context = buildTuViCalendarContext({ birthDate, birthTime });
      expect(context.effectiveTuViDate).toEqual(context.solarDate);
    }
  });
});

/**
 * Phase 10 "Environment independence" — the implementation exclusively uses `Date.UTC` /
 * `getUTC*` accessors (never local-timezone-sensitive `Date` methods), so the process's own `TZ`
 * environment variable must have zero effect on the result. This test changes `process.env.TZ`
 * mid-run to demonstrate that property directly, rather than merely asserting it in a comment.
 */
describe('buildTuViCalendarContext — environment (timezone) independence', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  });

  it('produces an identical result under UTC, America/New_York, and Asia/Tokyo process timezones', () => {
    const input = { birthDate: '2024-02-10', birthTime: '23:30' };

    process.env.TZ = 'UTC';
    const resultUtc = buildTuViCalendarContext(input);

    process.env.TZ = 'America/New_York';
    const resultNewYork = buildTuViCalendarContext(input);

    process.env.TZ = 'Asia/Tokyo';
    const resultTokyo = buildTuViCalendarContext(input);

    expect(resultNewYork).toEqual(resultUtc);
    expect(resultTokyo).toEqual(resultUtc);
  });
});
