import { calculateDaiVan } from './tu-vi-dai-van';

describe('calculateDaiVan', () => {
  it('Dương nam, Hỏa Lục Cục: 6@Mệnh, 16@Phụ Mẫu, 26@Phúc Đức (VDTTL-1956 p.20 worked example)', () => {
    const cycles = calculateDaiVan({ menhPosition: 'Dần', cuc: 'Hỏa Lục Cục', sex: 'Nam', yearStem: 'Giáp' });
    expect(cycles[0]).toMatchObject({ ageStart: 6, ageEnd: 15, role: 'Mệnh', position: 'Dần' });
    expect(cycles[1]).toMatchObject({ ageStart: 16, ageEnd: 25, role: 'Phụ Mẫu', position: 'Mão' });
    expect(cycles[2]).toMatchObject({ ageStart: 26, ageEnd: 35, role: 'Phúc Đức', position: 'Thìn' });
  });

  it('Dương nam, Mộc Tam Cục: 3rd decade is 23–32 tuổi (cross-checked from the p.21 Lưu Đại Hạn worked example)', () => {
    const cycles = calculateDaiVan({ menhPosition: 'Tý', cuc: 'Mộc Tam Cục', sex: 'Nam', yearStem: 'Giáp' });
    expect(cycles[2]).toMatchObject({ ageStart: 23, ageEnd: 32 });
  });

  it('Âm nam, Kim Tứ Cục: 4th decade is 34–43 tuổi (cross-checked from the p.22 Lưu Đại Hạn worked example)', () => {
    const cycles = calculateDaiVan({ menhPosition: 'Tý', cuc: 'Kim Tứ Cục', sex: 'Nam', yearStem: 'Ất' });
    expect(cycles[3]).toMatchObject({ ageStart: 34, ageEnd: 43 });
  });

  it('nghịch direction (âm nam / dương nữ) walks PALACE_ROLES_FROM_MENH backward', () => {
    // Ất is Âm; Nam + Âm-year => nghịch.
    const cycles = calculateDaiVan({ menhPosition: 'Dần', cuc: 'Hỏa Lục Cục', sex: 'Nam', yearStem: 'Ất' });
    expect(cycles[0]).toMatchObject({ ageStart: 6, ageEnd: 15, role: 'Mệnh', position: 'Dần' });
    expect(cycles[1]).toMatchObject({ ageStart: 16, ageEnd: 25, role: 'Huynh Đệ', position: 'Sửu' });
    expect(cycles[2]).toMatchObject({ ageStart: 26, ageEnd: 35, role: 'Phu Thê', position: 'Tý' });
  });

  it('all 4 sex × year-polarity combinations resolve to the documented direction', () => {
    // Dương nam / Âm nữ => thuận (index 1 lands at the +1 offset palace, i.e. Phụ Mẫu-equivalent).
    const duongNam = calculateDaiVan({ menhPosition: 'Tý', cuc: 'Thổ Ngũ Cục', sex: 'Nam', yearStem: 'Giáp' });
    const amNu = calculateDaiVan({ menhPosition: 'Tý', cuc: 'Thổ Ngũ Cục', sex: 'Nữ', yearStem: 'Ất' });
    expect(duongNam[1]!.role).toBe('Phụ Mẫu');
    expect(amNu[1]!.role).toBe('Phụ Mẫu');

    // Âm nam / Dương nữ => nghịch (index 1 lands at the -1 offset palace, i.e. Huynh Đệ).
    const amNam = calculateDaiVan({ menhPosition: 'Tý', cuc: 'Thổ Ngũ Cục', sex: 'Nam', yearStem: 'Ất' });
    const duongNu = calculateDaiVan({ menhPosition: 'Tý', cuc: 'Thổ Ngũ Cục', sex: 'Nữ', yearStem: 'Giáp' });
    expect(amNam[1]!.role).toBe('Huynh Đệ');
    expect(duongNu[1]!.role).toBe('Huynh Đệ');
  });

  it('produces exactly 12 cycles, contiguous with no gap or overlap, one per palace role, starting at the given Cục number', () => {
    const cycles = calculateDaiVan({ menhPosition: 'Ngọ', cuc: 'Kim Tứ Cục', sex: 'Nữ', yearStem: 'Canh' });
    expect(cycles).toHaveLength(12);
    expect(cycles[0]!.ageStart).toBe(4);
    expect(new Set(cycles.map((c) => c.role)).size).toBe(12);
    expect(new Set(cycles.map((c) => c.position)).size).toBe(12);
    for (let i = 1; i < cycles.length; i++) {
      expect(cycles[i]!.ageStart).toBe(cycles[i - 1]!.ageEnd + 1);
    }
  });

  it('wraps the 12-palace ring correctly at the boundary (index 11 back near Mệnh)', () => {
    const cycles = calculateDaiVan({ menhPosition: 'Dần', cuc: 'Hỏa Lục Cục', sex: 'Nam', yearStem: 'Giáp' });
    expect(cycles[11]).toMatchObject({ role: 'Huynh Đệ', position: 'Sửu', ageStart: 116, ageEnd: 125 });
  });
});
