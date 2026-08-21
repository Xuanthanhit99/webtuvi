import { buildTuViMainStarsContext } from './tu-vi-main-stars-context';
import { TU_VI_CHINH_TINH_IDS } from './tu-vi-chinh-tinh';

describe('buildTuViMainStarsContext — full orchestration', () => {
  it('assembles cucContext, chinhTinh (14 entries), and rulesetVersion', () => {
    const context = buildTuViMainStarsContext({ birthDate: '2024-02-10', birthTime: '10:30' });
    expect(context.cucContext.cuc).toBe('Kim Tứ Cục');
    expect(context.chinhTinh).toHaveLength(14);
    expect(context.chinhTinh.map((p) => p.star)).toEqual([...TU_VI_CHINH_TINH_IDS]);
    expect(context.rulesetVersion).toBe('vdttl-1956-v1');
  });

  it('the returned context is frozen (immutable)', () => {
    const context = buildTuViMainStarsContext({ birthDate: '2024-02-10', birthTime: '10:30' });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('consumes lunarDay from the calendar context correctly (end-to-end wiring check)', () => {
    // 2024-02-10 is Tết — lunarDay=1, Cục=Kim Tứ (per 18B.2/18B.3 tests) → Tử Vi anchor day1 → Hợi.
    const context = buildTuViMainStarsContext({ birthDate: '2024-02-10', birthTime: '10:30' });
    const tuVi = context.chinhTinh.find((p) => p.star === 'Tử Vi');
    expect(tuVi?.position).toBe('Hợi');
  });
});

describe('buildTuViMainStarsContext — determinism across process timezones', () => {
  it('produces an identical chinhTinh result under UTC/America/New_York/Asia/Tokyo', () => {
    const originalTz = process.env.TZ;
    try {
      const input = { birthDate: '2020-06-20', birthTime: '23:30' };
      process.env.TZ = 'UTC';
      const a = buildTuViMainStarsContext(input);
      process.env.TZ = 'America/New_York';
      const b = buildTuViMainStarsContext(input);
      process.env.TZ = 'Asia/Tokyo';
      const c = buildTuViMainStarsContext(input);
      expect(a.chinhTinh).toEqual(b.chinhTinh);
      expect(a.chinhTinh).toEqual(c.chinhTinh);
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });
});
