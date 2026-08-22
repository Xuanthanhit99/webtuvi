import type { EarthlyBranchValue, TuViChartDto, TuViDignityValue, TuViPalaceRoleValue, TuViTransformationDto } from '@beaconvie/types';

/** The 12 Earthly Branches in their fixed ring order (Tý=0 … Hợi=11) — mirrors the engine's own
 * `EARTHLY_BRANCHES` constant. Re-declared here (not imported from the backend) since the frontend
 * has no dependency on API-internal engine code — this is a plain, non-calculating re-listing of a
 * fixed, published table, exactly like every other label/order constant in this feature. */
const EARTHLY_BRANCHES: EarthlyBranchValue[] = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export interface PalaceCellMainStar {
  star: string;
  dignity: TuViDignityValue;
}

export interface PalaceCell {
  branch: EarthlyBranchValue;
  role: TuViPalaceRoleValue;
  isMenh: boolean;
  isThan: boolean;
  mainStars: PalaceCellMainStar[];
  auxiliaryStars: string[];
  hasTuan: boolean;
  hasTriet: boolean;
  /** The full Tứ Hóa assignment(s) landing in this palace, each still carrying its own
   * `targetStar` — never flattened to a bare transformation name, so a renderer can attach a tag
   * to the exact star it belongs to rather than every star in the palace. */
  transformations: TuViTransformationDto[];
}

/**
 * Purely reshapes an already-calculated, already-persisted `TuViChartDto` into a per-palace view —
 * no calculation happens here (mirrors the backend's own `buildPalaceProjection`, which this
 * function is a read-only, client-side re-derivation of from data the API already returned).
 */
export function buildPalaceCells(chart: TuViChartDto): PalaceCell[] {
  return EARTHLY_BRANCHES.map((branch) => ({
    branch,
    role: chart.palaces.layout[branch],
    isMenh: branch === chart.palaces.menh,
    isThan: branch === chart.palaces.than,
    mainStars: chart.mainStars.filter((s) => s.position === branch).map((s) => ({ star: s.star, dignity: s.dignity })),
    auxiliaryStars: chart.auxiliaryStars.filter((s) => s.position === branch).map((s) => s.star),
    hasTuan: branch === chart.tuan.first || branch === chart.tuan.second,
    hasTriet: branch === chart.triet.first || branch === chart.triet.second,
    transformations: chart.transformations.filter((t) => t.position === branch),
  }));
}

/** The traditional 4×4 grid position for each branch (row/col, 1-indexed) — the standard Vietnamese
 * Tử Vi lá số layout, 12 palaces around the border with a blank 2×2 center reserved for chart
 * summary info. Purely a display convention, not a calculation. */
export const PALACE_GRID_POSITION: Record<EarthlyBranchValue, { row: number; col: number }> = {
  'Tỵ': { row: 1, col: 1 },
  'Ngọ': { row: 1, col: 2 },
  'Mùi': { row: 1, col: 3 },
  'Thân': { row: 1, col: 4 },
  'Thìn': { row: 2, col: 1 },
  'Dậu': { row: 2, col: 4 },
  'Mão': { row: 3, col: 1 },
  'Tuất': { row: 3, col: 4 },
  'Dần': { row: 4, col: 1 },
  'Sửu': { row: 4, col: 2 },
  'Tý': { row: 4, col: 3 },
  'Hợi': { row: 4, col: 4 },
};

/** Reading order for the narrow-viewport stacked list: clockwise starting from Mệnh. */
export function orderFromMenh(cells: PalaceCell[]): PalaceCell[] {
  const menhIndex = cells.findIndex((c) => c.isMenh);
  if (menhIndex === -1) return cells;
  return [...cells.slice(menhIndex), ...cells.slice(0, menhIndex)];
}
