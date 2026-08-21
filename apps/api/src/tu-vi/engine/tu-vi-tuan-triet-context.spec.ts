import { buildTuViTuanTrietContext } from './tu-vi-tuan-triet-context';

describe('buildTuViTuanTrietContext — full orchestration', () => {
  it('assembles core13Context, tuan, triet, rulesetVersion', () => {
    const context = buildTuViTuanTrietContext({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' });
    // 2024-02-10 → Giáp Thìn year. Tuần decadeStart = Thìn-idx(Giáp=0)=Thìn → group "Thìn": Dần,Mão.
    expect(context.tuan).toEqual({ first: 'Dần', second: 'Mão' });
    // Triệt(Giáp) = Thân, Dậu.
    expect(context.triet).toEqual({ first: 'Thân', second: 'Dậu' });
    expect(context.rulesetVersion).toBe('vdttl-1956-v1');
  });

  it('the returned context is frozen', () => {
    const context = buildTuViTuanTrietContext({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('reproduces the historical Triệt conflict end to end for a Canh Ngọ birth year (this project\'s own reproduction case)', () => {
    // 1990-11-25 → Canh Ngọ year (per prior sprints' vectors). Triệt must be Mùi,Ngọ (locked), not
    // the book's own disputed Thân,Dậu worked-example value.
    const context = buildTuViTuanTrietContext({ birthDate: '1990-11-25', birthTime: '14:00', sex: 'Nữ' });
    expect(context.core13Context.mainStarsContext.cucContext.foundationContext.yearCanChi).toEqual({ lunarYear: 1990, stem: 'Canh', branch: 'Ngọ' });
    expect(context.triet).toEqual({ first: 'Mùi', second: 'Ngọ' });
  });

  it('full chain integrity: mainStars/core13/cục/foundation/calendar contexts are all present', () => {
    const context = buildTuViTuanTrietContext({ birthDate: '1990-06-15', birthTime: '03:20', sex: 'Nam' });
    expect(context.core13Context.core13).toHaveLength(13);
    expect(context.core13Context.mainStarsContext.chinhTinh).toHaveLength(14);
    expect(context.core13Context.mainStarsContext.cucContext.cuc).toBeDefined();
  });
});

describe('buildTuViTuanTrietContext — determinism across process timezones', () => {
  it('produces identical tuan/triet under UTC/America/New_York/Asia/Tokyo', () => {
    const originalTz = process.env.TZ;
    try {
      const input = { birthDate: '1990-11-25', birthTime: '14:00', sex: 'Nữ' as const };
      process.env.TZ = 'UTC';
      const a = buildTuViTuanTrietContext(input);
      process.env.TZ = 'America/New_York';
      const b = buildTuViTuanTrietContext(input);
      process.env.TZ = 'Asia/Tokyo';
      const c = buildTuViTuanTrietContext(input);
      expect(a.tuan).toEqual(b.tuan);
      expect(a.triet).toEqual(c.triet);
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });
});
