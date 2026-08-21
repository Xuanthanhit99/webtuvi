import { buildTuViCucContext } from './tu-vi-cuc-context';

describe('buildTuViCucContext — full orchestration', () => {
  it('assembles foundationContext, cuc, and rulesetVersion', () => {
    const context = buildTuViCucContext({ birthDate: '2024-02-10', birthTime: '10:30' });

    expect(context.foundationContext.yearCanChi).toEqual({ lunarYear: 2024, stem: 'Giáp', branch: 'Thìn' });
    expect(context.foundationContext.menhPosition).toBe('Dậu');
    // yearStem=Giáp (col 0), menhPosition=Dậu (Thân,Dậu row, row 4) → Kim Tứ Cục.
    expect(context.cuc).toBe('Kim Tứ Cục');
    expect(context.rulesetVersion).toBe('vdttl-1956-v1');
  });

  it('the returned context is frozen (immutable)', () => {
    const context = buildTuViCucContext({ birthDate: '2024-02-10', birthTime: '10:30' });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('reuses the exact foundationContext shape from 18B.2 unmodified (calendarContext, yearCanChi, menhPosition, thanPosition, palaceLayout all present)', () => {
    const context = buildTuViCucContext({ birthDate: '1990-06-15', birthTime: '03:20' });
    expect(context.foundationContext).toHaveProperty('calendarContext');
    expect(context.foundationContext).toHaveProperty('yearCanChi');
    expect(context.foundationContext).toHaveProperty('menhPosition');
    expect(context.foundationContext).toHaveProperty('thanPosition');
    expect(context.foundationContext).toHaveProperty('palaceLayout');
  });
});

describe('buildTuViCucContext — Lunar New Year boundary, end to end (Cục must track the correct lunar year Can, not the Gregorian year)', () => {
  it('a birth the day before Tết 2024 uses year Quý Mão (2023) for the Cục lookup', () => {
    const context = buildTuViCucContext({ birthDate: '2024-02-09', birthTime: '12:00' });
    expect(context.foundationContext.yearCanChi.stem).toBe('Quý');
  });

  it('a birth on Tết 2024 itself uses year Giáp Thìn (2024) — genuinely different Can, so a genuinely possible different Cục', () => {
    const before = buildTuViCucContext({ birthDate: '2024-02-09', birthTime: '12:00' });
    const onOrAfter = buildTuViCucContext({ birthDate: '2024-02-10', birthTime: '12:00' });
    expect(before.foundationContext.yearCanChi.stem).not.toBe(onOrAfter.foundationContext.yearCanChi.stem);
  });
});

describe('buildTuViCucContext — determinism', () => {
  it('repeated calls with identical input produce byte-identical cuc, across process timezones', () => {
    const originalTz = process.env.TZ;
    try {
      const input = { birthDate: '1990-06-15', birthTime: '03:20' };
      process.env.TZ = 'UTC';
      const a = buildTuViCucContext(input);
      process.env.TZ = 'America/New_York';
      const b = buildTuViCucContext(input);
      process.env.TZ = 'Asia/Tokyo';
      const c = buildTuViCucContext(input);
      expect(a.cuc).toBe(b.cuc);
      expect(a.cuc).toBe(c.cuc);
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });

  it('cuc depends only on canonical input, never on Date.now() or call order', () => {
    const input = { birthDate: '2000-01-01', birthTime: '00:00' };
    const first = buildTuViCucContext(input).cuc;
    for (let i = 0; i < 10; i++) {
      expect(buildTuViCucContext(input).cuc).toBe(first);
    }
  });
});
