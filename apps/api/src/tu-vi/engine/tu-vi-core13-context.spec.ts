import { buildTuViCore13Context } from './tu-vi-core13-context';
import { Core13InputError } from './tu-vi-core13';
import { TU_VI_CORE13_STAR_IDS } from './tu-vi-core13';

describe('buildTuViCore13Context — full orchestration', () => {
  it('assembles mainStarsContext, core13 (13 entries), and rulesetVersion', () => {
    const context = buildTuViCore13Context({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' });
    expect(context.core13).toHaveLength(13);
    expect(context.core13.map((p) => p.star)).toEqual([...TU_VI_CORE13_STAR_IDS]);
    expect(context.rulesetVersion).toBe('vdttl-1956-v1');
  });

  it('the returned context is frozen', () => {
    const context = buildTuViCore13Context({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('throws Core13InputError when sex is omitted, with a clear message, rather than silently defaulting', () => {
    expect(() => buildTuViCore13Context({ birthDate: '2024-02-10', birthTime: '10:30' })).toThrow(Core13InputError);
  });

  it('the underlying main-stars/cục/foundation/calendar contexts are all still present and correct (chain integrity)', () => {
    const context = buildTuViCore13Context({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nữ' });
    expect(context.mainStarsContext.chinhTinh).toHaveLength(14);
    expect(context.mainStarsContext.cucContext.cuc).toBe('Kim Tứ Cục');
    expect(context.mainStarsContext.cucContext.foundationContext.menhPosition).toBeDefined();
  });
});

describe('buildTuViCore13Context — determinism across process timezones', () => {
  it('produces an identical core13 result under UTC/America/New_York/Asia/Tokyo', () => {
    const originalTz = process.env.TZ;
    try {
      const input = { birthDate: '1990-06-15', birthTime: '03:20', sex: 'Nam' as const };
      process.env.TZ = 'UTC';
      const a = buildTuViCore13Context(input);
      process.env.TZ = 'America/New_York';
      const b = buildTuViCore13Context(input);
      process.env.TZ = 'Asia/Tokyo';
      const c = buildTuViCore13Context(input);
      expect(a.core13).toEqual(b.core13);
      expect(a.core13).toEqual(c.core13);
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });
});
