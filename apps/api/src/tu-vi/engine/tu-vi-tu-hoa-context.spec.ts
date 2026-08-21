import { buildTuViTuHoaContext } from './tu-vi-tu-hoa-context';

describe('buildTuViTuHoaContext — full orchestration', () => {
  it('assembles tuanTrietContext, tuHoa (4 annotated entries), and rulesetVersion', () => {
    // 2024-02-10 → Giáp Thìn year → Tứ Hóa(Giáp) = Liêm Trinh/Phá Quân/Vũ Khúc/Thái Dương.
    const context = buildTuViTuHoaContext({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' });
    expect(context.tuHoa).toHaveLength(4);
    expect(context.tuHoa.map((a) => a.targetStar)).toEqual(['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương']);
    expect(context.rulesetVersion).toBe('vdttl-1956-v1');
  });

  it('every annotated Tứ Hóa entry has a real palace position, matching the star\'s own placement elsewhere in the same chart', () => {
    const context = buildTuViTuHoaContext({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' });
    const { chinhTinh } = context.tuanTrietContext.core13Context.mainStarsContext;
    const { core13 } = context.tuanTrietContext.core13Context;
    for (const { targetStar, position } of context.tuHoa) {
      const independentLookup = chinhTinh.find((p) => p.star === targetStar) ?? core13.find((p) => p.star === targetStar);
      expect(independentLookup?.position).toBe(position);
    }
  });

  it('the returned context is frozen', () => {
    const context = buildTuViTuHoaContext({ birthDate: '2024-02-10', birthTime: '10:30', sex: 'Nam' });
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('full chain integrity: tuan/triet/core13/mainStars/cục/foundation contexts all present', () => {
    const context = buildTuViTuHoaContext({ birthDate: '1990-11-25', birthTime: '14:00', sex: 'Nữ' });
    expect(context.tuanTrietContext.triet).toEqual({ first: 'Mùi', second: 'Ngọ' }); // Canh year, locked convention
    expect(context.tuanTrietContext.core13Context.core13).toHaveLength(13);
  });
});

describe('buildTuViTuHoaContext — determinism across process timezones', () => {
  it('produces identical tuHoa under UTC/America/New_York/Asia/Tokyo', () => {
    const originalTz = process.env.TZ;
    try {
      const input = { birthDate: '1990-06-15', birthTime: '03:20', sex: 'Nam' as const };
      process.env.TZ = 'UTC';
      const a = buildTuViTuHoaContext(input);
      process.env.TZ = 'America/New_York';
      const b = buildTuViTuHoaContext(input);
      process.env.TZ = 'Asia/Tokyo';
      const c = buildTuViTuHoaContext(input);
      expect(a.tuHoa).toEqual(b.tuHoa);
      expect(a.tuHoa).toEqual(c.tuHoa);
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });
});
