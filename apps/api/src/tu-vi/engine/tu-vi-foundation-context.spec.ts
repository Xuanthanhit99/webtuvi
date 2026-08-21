import { buildTuViFoundationContext } from './tu-vi-foundation-context';
import { isValidThanOffset } from './tu-vi-menh-than';

describe('buildTuViFoundationContext — full orchestration', () => {
  it('assembles calendarContext, yearCanChi, menhPosition, thanPosition, palaceLayout, rulesetVersion', () => {
    const context = buildTuViFoundationContext({ birthDate: '2024-02-10', birthTime: '10:30' });

    expect(context.calendarContext.lunarDate).toEqual({ lunarYear: 2024, lunarMonth: 1, lunarDay: 1, isLeapMonth: false });
    expect(context.yearCanChi).toEqual({ lunarYear: 2024, stem: 'Giáp', branch: 'Thìn' });
    // tháng=1, giờ=Tỵ (10:30): R0=(1+1)mod12=2=Dần. giờ0(Tỵ)=5. Mệnh0=(2-5)mod12=9=Dậu. Thân0=(2+5)mod12=7=Mùi.
    expect(context.menhPosition).toBe('Dậu');
    expect(context.thanPosition).toBe('Mùi');
    expect(context.palaceLayout[context.menhPosition]).toBe('Mệnh');
    expect(context.palaceLayout[context.thanPosition]).toBe('Phu Thê');
    expect(context.rulesetVersion).toBe('vdttl-1956-v1');
  });

  it('the returned context is frozen (immutable)', () => {
    const context = buildTuViFoundationContext({ birthDate: '2024-02-10', birthTime: '10:30' });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('the Thân offset invariant holds for the assembled context', () => {
    const context = buildTuViFoundationContext({ birthDate: '1990-06-15', birthTime: '03:20' });
    expect(isValidThanOffset(context.menhPosition, context.thanPosition)).toBe(true);
  });
});

describe('buildTuViFoundationContext — Lunar New Year boundary, end to end', () => {
  it('a birth the day before Tết 2024 gets year Can Chi Quý Mão (2023)', () => {
    const context = buildTuViFoundationContext({ birthDate: '2024-02-09', birthTime: '12:00' });
    expect(context.yearCanChi).toEqual({ lunarYear: 2023, stem: 'Quý', branch: 'Mão' });
  });

  it('a birth on Tết 2024 itself gets year Can Chi Giáp Thìn (2024) — a genuinely different year, not smoothed over', () => {
    const context = buildTuViFoundationContext({ birthDate: '2024-02-10', birthTime: '12:00' });
    expect(context.yearCanChi).toEqual({ lunarYear: 2024, stem: 'Giáp', branch: 'Thìn' });
  });
});

/**
 * TUVI-GIO-01/02 end to end: a Tý-hour birth pair straddling BOTH the midnight civil-date boundary
 * AND a real lunar-month-number change (2020-06-20 → lunarMonth 4 leap; 2020-06-21 → lunarMonth 5,
 * confirmed in `tu-vi-calendar.adapter.spec.ts`'s own leap-month boundary test). Both births share
 * the same hour-branch label (Tý) but must NOT share the same Mệnh/Thân, proving Mệnh/Thân correctly
 * consume the calendar layer's already-correct per-civil-date lunar month rather than re-deriving
 * or confusing it.
 */
describe('buildTuViFoundationContext — Tý-hour boundary crossing a real lunar-month change', () => {
  it('23:30 on 2020-06-20 (still lunar month 4) and 00:30 on 2020-06-21 (lunar month 5) share the same hour branch but produce different Mệnh/Thân', () => {
    const before = buildTuViFoundationContext({ birthDate: '2020-06-20', birthTime: '23:30' });
    const after = buildTuViFoundationContext({ birthDate: '2020-06-21', birthTime: '00:30' });

    expect(before.calendarContext.hourBranch).toBe('Tý');
    expect(after.calendarContext.hourBranch).toBe('Tý');
    expect(before.calendarContext.lunarDate.lunarMonth).toBe(4);
    expect(after.calendarContext.lunarDate.lunarMonth).toBe(5);

    expect(before.menhPosition).not.toBe(after.menhPosition);
  });

  it('all other Tý-boundary times (22:59, 23:00, 23:59, 00:00, 00:59, 01:00) on stable (non-boundary) dates produce valid, invariant-satisfying charts', () => {
    const times: Array<[date: string, time: string]> = [
      ['2024-03-15', '22:59'],
      ['2024-03-15', '23:00'],
      ['2024-03-15', '23:59'],
      ['2024-03-16', '00:00'],
      ['2024-03-16', '00:59'],
      ['2024-03-16', '01:00'],
    ];
    for (const [birthDate, birthTime] of times) {
      const context = buildTuViFoundationContext({ birthDate, birthTime });
      expect(isValidThanOffset(context.menhPosition, context.thanPosition)).toBe(true);
    }
  });
});

describe('buildTuViFoundationContext — environment (timezone) independence', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  });

  it('produces an identical result under UTC, America/New_York, and Asia/Tokyo process timezones', () => {
    const input = { birthDate: '2020-06-20', birthTime: '23:30' };

    process.env.TZ = 'UTC';
    const resultUtc = buildTuViFoundationContext(input);

    process.env.TZ = 'America/New_York';
    const resultNewYork = buildTuViFoundationContext(input);

    process.env.TZ = 'Asia/Tokyo';
    const resultTokyo = buildTuViFoundationContext(input);

    expect(resultNewYork).toEqual(resultUtc);
    expect(resultTokyo).toEqual(resultUtc);
  });
});
