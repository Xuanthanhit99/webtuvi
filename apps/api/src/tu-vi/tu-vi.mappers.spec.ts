import type { TuViChart as TuViChartRow } from '@prisma/client';
import { toTuViChartDto } from './tu-vi.mappers';
import { calculateDaiVan } from './engine/tu-vi-dai-van';
import { calculateTieuHanStart } from './engine/tu-vi-tieu-han';

function baseRow(overrides: Partial<TuViChartRow> = {}): TuViChartRow {
  return {
    id: 'c1',
    userId: 'u1',
    status: 'ACTIVE',
    birthDate: new Date('1990-02-15T00:00:00.000Z'),
    birthTime: '10:00',
    sex: 'Nam',
    engineVersion: 'tuvi-engine-v1',
    calendarVersion: 'tuvi-calendar-hnd-v1',
    rulesetVersion: 'vdttl-1956-v1',
    mainStarVersion: 'tuvi-main-stars-v1',
    auxiliaryVersion: 'core-13-v1',
    tuanTrietVersion: 'tuvi-tuan-triet-v1',
    tuHoaVersion: 'tuvi-tu-hoa-v1',
    dignityVersion: 'tuvi-dignity-v1',
    cycleVersion: 'tuvi-cycle-v1',
    // 1990 -> Canh (Dương) year, per the standard sexagenary cycle.
    lunarYear: 1990,
    lunarMonth: 1,
    lunarDay: 1,
    isLeapMonth: false,
    hourBranch: 'Tý',
    yearStem: 'Canh',
    yearBranch: 'Ngọ',
    menhPosition: 'Dần',
    thanPosition: 'Dần',
    cuc: 'Hỏa Lục Cục',
    palaceLayout: {} as unknown as TuViChartRow['palaceLayout'],
    mainStars: [] as unknown as TuViChartRow['mainStars'],
    auxiliaryStars: [] as unknown as TuViChartRow['auxiliaryStars'],
    tuan: {} as unknown as TuViChartRow['tuan'],
    triet: {} as unknown as TuViChartRow['triet'],
    transformations: [] as unknown as TuViChartRow['transformations'],
    daiVan: [] as unknown as TuViChartRow['daiVan'],
    tieuHanStart: {} as unknown as TuViChartRow['tieuHanStart'],
    interpretation: null,
    aiProvider: null,
    aiModel: null,
    promptVersion: null,
    interpretedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    archivedAt: null,
    deletedAt: null,
    ...overrides,
  } as TuViChartRow;
}

describe('toTuViChartDto — current-cycle resolution', () => {
  // Canh is Dương; Nam + Dương year => thuận (dương nam).
  const daiVan = calculateDaiVan({ menhPosition: 'Dần', cuc: 'Hỏa Lục Cục', sex: 'Nam', yearStem: 'Canh' });
  const tieuHanStart = calculateTieuHanStart({ yearBranch: 'Ngọ', sex: 'Nam' });

  it('resolves currentDaiVan/currentTieuHan using the injected "now", never real wall-clock time', () => {
    const row = baseRow({ daiVan: daiVan as unknown as TuViChartRow['daiVan'], tieuHanStart: tieuHanStart as unknown as TuViChartRow['tieuHanStart'] });
    // Born lunar year 1990, "now" = lunar year 2013 (2013-02-15 is safely after Tết 2013) => tuổi 24.
    const dto = toTuViChartDto(row, new Date('2013-02-15T00:00:00.000Z'));

    expect(dto.currentDaiVan).not.toBeNull();
    expect(dto.currentDaiVan!.ageStart).toBeLessThanOrEqual(24);
    expect(dto.currentDaiVan!.ageEnd).toBeGreaterThanOrEqual(24);
    expect(dto.currentTieuHan).toEqual({ tuoi: 24, lunarYear: 2013, palace: expect.any(String) });
  });

  it('a different "now" resolves a different current cycle for the same persisted chart', () => {
    const row = baseRow({ daiVan: daiVan as unknown as TuViChartRow['daiVan'], tieuHanStart: tieuHanStart as unknown as TuViChartRow['tieuHanStart'] });
    const early = toTuViChartDto(row, new Date('1998-06-01T00:00:00.000Z')); // tuổi ~9, before Hỏa Lục Cục's first cycle (starts at 6)... actually 9 is within 6-15
    const later = toTuViChartDto(row, new Date('2050-06-01T00:00:00.000Z'));
    expect(early.currentDaiVan?.index).not.toBe(later.currentDaiVan?.index);
  });

  it('returns null for both when daiVan is empty and tieuHanStart has no startPalace (pre-feature chart, never crashes)', () => {
    const row = baseRow(); // defaults: daiVan=[], tieuHanStart={}
    const dto = toTuViChartDto(row, new Date('2020-01-01T00:00:00.000Z'));
    expect(dto.currentDaiVan).toBeNull();
    expect(dto.currentTieuHan).toBeNull();
    expect(dto.daiVan).toEqual([]);
    expect(dto.tieuHanStart).toBeNull();
  });

  it('returns null for currentDaiVan when the current tuổi is younger than the first cycle', () => {
    const row = baseRow({ daiVan: daiVan as unknown as TuViChartRow['daiVan'] });
    // Born 1990, now 1994 lunar => tuổi 5, Hỏa Lục Cục's first cycle starts at 6.
    const dto = toTuViChartDto(row, new Date('1994-06-01T00:00:00.000Z'));
    expect(dto.currentDaiVan).toBeNull();
  });

  it('returns null for currentTieuHan when the current tuổi is under 13', () => {
    const row = baseRow({ tieuHanStart: tieuHanStart as unknown as TuViChartRow['tieuHanStart'] });
    const dto = toTuViChartDto(row, new Date('1998-06-01T00:00:00.000Z')); // tuổi ~9
    expect(dto.currentTieuHan).toBeNull();
  });

  it('nearbyTieuHan is a real ±2-year window computed server-side, matching currentTieuHan at its center', () => {
    const row = baseRow({ daiVan: daiVan as unknown as TuViChartRow['daiVan'], tieuHanStart: tieuHanStart as unknown as TuViChartRow['tieuHanStart'] });
    const dto = toTuViChartDto(row, new Date('2013-02-15T00:00:00.000Z')); // tuổi 24
    expect(dto.nearbyTieuHan).toHaveLength(5);
    expect(dto.nearbyTieuHan.map((e) => e.tuoi)).toEqual([22, 23, 24, 25, 26]);
    expect(dto.nearbyTieuHan.find((e) => e.tuoi === 24)).toEqual(dto.currentTieuHan);
  });

  it('nearbyTieuHan is empty for a pre-feature chart', () => {
    const row = baseRow();
    const dto = toTuViChartDto(row, new Date('2020-01-01T00:00:00.000Z'));
    expect(dto.nearbyTieuHan).toEqual([]);
  });

  it('threads cycleVersion through the DTO versions bundle', () => {
    const row = baseRow();
    const dto = toTuViChartDto(row, new Date('2020-01-01T00:00:00.000Z'));
    expect(dto.versions.cycleVersion).toBe('tuvi-cycle-v1');
  });
});

describe('toTuViChartDto — dignity healing for pre-dignity-feature charts (found via real DB inspection during Time Cycles QA)', () => {
  it('a mainStars entry persisted before Miếu/Vượng/Đắc/Hãm shipped (no `dignity` key at all) is healed with the real, correctly-looked-up dignity — never left undefined, never fabricated', () => {
    const row = baseRow({
      mainStars: [{ star: 'Tử Vi', position: 'Dậu' }] as unknown as TuViChartRow['mainStars'], // real shape observed in the dev DB — no `dignity` key
    });
    const dto = toTuViChartDto(row, new Date('2020-01-01T00:00:00.000Z'));
    expect(dto.mainStars).toEqual([{ star: 'Tử Vi', position: 'Dậu', dignity: 'Bình hòa' }]);
  });

  it('a mainStars entry that already has a real persisted dignity is passed through unchanged, never recomputed', () => {
    const row = baseRow({
      mainStars: [{ star: 'Tử Vi', position: 'Dậu', dignity: 'Bình hòa' }] as unknown as TuViChartRow['mainStars'],
    });
    const dto = toTuViChartDto(row, new Date('2020-01-01T00:00:00.000Z'));
    expect(dto.mainStars).toEqual([{ star: 'Tử Vi', position: 'Dậu', dignity: 'Bình hòa' }]);
  });

  it('heals every star in a mixed-shape array independently', () => {
    const row = baseRow({
      mainStars: [
        { star: 'Tử Vi', position: 'Dậu' },
        { star: 'Liêm Trinh', position: 'Sửu', dignity: 'Đắc địa' },
      ] as unknown as TuViChartRow['mainStars'],
    });
    const dto = toTuViChartDto(row, new Date('2020-01-01T00:00:00.000Z'));
    expect(dto.mainStars).toEqual([
      { star: 'Tử Vi', position: 'Dậu', dignity: 'Bình hòa' },
      { star: 'Liêm Trinh', position: 'Sửu', dignity: 'Đắc địa' },
    ]);
  });
});
