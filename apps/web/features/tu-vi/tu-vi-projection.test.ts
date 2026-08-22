import type { TuViChartDto } from '@beaconvie/types';
import { buildPalaceCells, orderFromMenh, PALACE_GRID_POSITION } from './tu-vi-projection';

// Synthetic fixture for UI/reshaping tests only — not a golden vector. Real domain accuracy is
// covered by the engine's own extensive test suite (apps/api/src/tu-vi/engine/**.spec.ts); this
// file only tests that the frontend reshapes an already-real `TuViChartDto` correctly, matching
// the backend's own `buildPalaceProjection` (apps/api/src/tu-vi/engine/tu-vi-chart.ts).
const chart: TuViChartDto = {
  id: 'c1',
  status: 'ACTIVE',
  birthDate: '1984-02-02',
  birthTime: '00:30',
  sex: 'Nam',
  versions: {
    engineVersion: 'tuvi-engine-v1',
    calendarVersion: 'v1',
    rulesetVersion: 'VDTTL_1956_V1',
    mainStarVersion: 'tuvi-main-stars-v1',
    auxiliaryVersion: 'core-13-v1',
    tuanTrietVersion: 'tuvi-tuan-triet-v1',
    tuHoaVersion: 'tuvi-tu-hoa-v1',
    dignityVersion: 'tuvi-dignity-v1',
    cycleVersion: 'tuvi-cycle-v1',
  },
  lunarDate: { lunarYear: 1984, lunarMonth: 1, lunarDay: 1, isLeapMonth: false },
  hourBranch: 'Tý',
  canChi: { year: { stem: 'Giáp', branch: 'Tý' } },
  palaces: {
    menh: 'Dần',
    than: 'Dần',
    layout: {
      'Dần': 'Mệnh',
      'Mão': 'Phụ Mẫu',
      'Thìn': 'Phúc Đức',
      'Tỵ': 'Điền Trạch',
      'Ngọ': 'Quan Lộc',
      'Mùi': 'Nô Bộc',
      'Thân': 'Thiên Di',
      'Dậu': 'Tật Ách',
      'Tuất': 'Tài Bạch',
      'Hợi': 'Tử Tức',
      'Tý': 'Phu Thê',
      'Sửu': 'Huynh Đệ',
    },
  },
  cuc: 'Hỏa Lục Cục',
  mainStars: [
    { star: 'Tử Vi', position: 'Dần', dignity: 'Miếu địa' },
    { star: 'Thiên Phủ', position: 'Dần', dignity: 'Miếu địa' },
    { star: 'Thái Dương', position: 'Ngọ', dignity: 'Miếu địa' },
  ],
  auxiliaryStars: [
    { star: 'Lộc Tồn', position: 'Dần' },
    { star: 'Văn Xương', position: 'Tuất' },
  ],
  tuan: { first: 'Tuất', second: 'Hợi' },
  triet: { first: 'Thân', second: 'Dậu' },
  transformations: [
    { transformation: 'Hóa Lộc', targetStar: 'Tử Vi', position: 'Dần' },
    { transformation: 'Hóa Quyền', targetStar: 'Thái Dương', position: 'Ngọ' },
    { transformation: 'Hóa Khoa', targetStar: 'Văn Xương', position: 'Tuất' },
    { transformation: 'Hóa Kỵ', targetStar: 'Lộc Tồn', position: 'Dần' },
  ],
  daiVan: [],
  tieuHanStart: null,
  currentDaiVan: null,
  currentTieuHan: null,
  nearbyTieuHan: [],
  interpretation: null,
  interpretedAt: null,
  createdAt: '2026-08-21T00:00:00.000Z',
  updatedAt: '2026-08-21T00:00:00.000Z',
  archivedAt: null,
};

describe('buildPalaceCells', () => {
  it('produces exactly 12 cells, one per Earthly Branch, each with its role from palaces.layout', () => {
    const cells = buildPalaceCells(chart);
    expect(cells).toHaveLength(12);
    const dan = cells.find((c) => c.branch === 'Dần')!;
    expect(dan.role).toBe('Mệnh');
    expect(dan.isMenh).toBe(true);
    expect(dan.isThan).toBe(true);
  });

  it('groups stars, Tuần/Triệt, and Tứ Hóa onto the correct palace by position, never by star identity alone', () => {
    const cells = buildPalaceCells(chart);
    const dan = cells.find((c) => c.branch === 'Dần')!;
    expect(dan.mainStars).toEqual([
      { star: 'Tử Vi', dignity: 'Miếu địa' },
      { star: 'Thiên Phủ', dignity: 'Miếu địa' },
    ]);
    expect(dan.auxiliaryStars).toEqual(['Lộc Tồn']);
    expect(dan.transformations.map((t) => t.transformation)).toEqual(['Hóa Lộc', 'Hóa Kỵ']);
    // Each transformation still carries its own real target star — never flattened to a bare
    // name, so a star-level renderer can tell which specific star it belongs to.
    expect(dan.transformations.map((t) => t.targetStar)).toEqual(['Tử Vi', 'Lộc Tồn']);

    const tuat = cells.find((c) => c.branch === 'Tuất')!;
    expect(tuat.hasTuan).toBe(true);
    expect(tuat.hasTriet).toBe(false);

    const than = cells.find((c) => c.branch === 'Thân')!;
    expect(than.hasTriet).toBe(true);
    expect(than.mainStars).toEqual([]);
  });

  it('a palace with no stars, Tuần, Triệt, or Tứ Hóa has empty arrays and false flags, never undefined', () => {
    const cells = buildPalaceCells(chart);
    const suu = cells.find((c) => c.branch === 'Sửu')!;
    expect(suu.mainStars).toEqual([]);
    expect(suu.auxiliaryStars).toEqual([]);
    expect(suu.transformations).toEqual([]);
    expect(suu.hasTuan).toBe(false);
    expect(suu.hasTriet).toBe(false);
  });
});

describe('orderFromMenh', () => {
  it('rotates the 12 cells so Mệnh is first, preserving the original forward (thuận) order', () => {
    const cells = buildPalaceCells(chart);
    const ordered = orderFromMenh(cells);
    expect(ordered[0]!.role).toBe('Mệnh');
    expect(ordered.map((c) => c.branch)).toHaveLength(12);
    expect(new Set(ordered.map((c) => c.branch)).size).toBe(12);
    // Forward order preserved: the palace right after Mệnh in the rotated list is Mệnh's own
    // immediate successor in the fixed branch ring (Dần -> Mão), matching the engine's own
    // "thuận = increasing index" convention.
    expect(ordered[1]!.branch).toBe('Mão');
  });
});

describe('PALACE_GRID_POSITION', () => {
  it('assigns exactly the 12 branches to unique cells in a 4x4 grid, with rows and columns in 1-4', () => {
    const positions = Object.values(PALACE_GRID_POSITION);
    expect(positions).toHaveLength(12);
    const keys = new Set(positions.map((p) => `${p.row},${p.col}`));
    expect(keys.size).toBe(12);
    for (const p of positions) {
      expect(p.row).toBeGreaterThanOrEqual(1);
      expect(p.row).toBeLessThanOrEqual(4);
      expect(p.col).toBeGreaterThanOrEqual(1);
      expect(p.col).toBeLessThanOrEqual(4);
    }
  });

  it('leaves the center 2x2 (rows/cols 2-3) free for the chart summary cell', () => {
    const centerOccupied = Object.values(PALACE_GRID_POSITION).some((p) => (p.row === 2 || p.row === 3) && (p.col === 2 || p.col === 3));
    expect(centerOccupied).toBe(false);
  });
});
