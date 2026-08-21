import { buildTuViTuHoaContext, type BuildTuViTuHoaContextOptions } from './tu-vi-tu-hoa-context';
import { EARTHLY_BRANCHES, PALACE_ROLES_FROM_MENH, type EarthlyBranch, type PalaceLayout, type PalaceRole } from './tu-vi-palace';
import { TU_VI_CHINH_TINH_IDS, type ChinhTinhId, type ChinhTinhPlacement } from './tu-vi-chinh-tinh';
import { TU_VI_CORE13_STAR_IDS, type Core13StarId, type Core13Placement } from './tu-vi-core13';
import { TU_VI_CUC_IDS, type TuViCucId } from './tu-vi-cuc';
import { TU_HOA_TRANSFORMATIONS, type TuHoaPositionAnnotation, type TuHoaTransformation } from './tu-vi-tu-hoa';
import type { PalacePair } from './tu-vi-tuan-triet';
import type { HeavenlyStem } from './tu-vi-can-chi';
import type { TuViBirthInput, TuViSex } from './tu-vi-canonical-input';

/**
 * Sprint 18B.8 — the complete deterministic Tử Vi chart composer (Phase 8 of 12).
 *
 * Composes every already-verified layer (18B.1–18B.7) into one immutable, flat, self-describing
 * `TuViChart`. Adds NOTHING new to any calculation — every field here is copied or reshaped from
 * an already-computed, already-tested upstream context. Explicitly OUT OF SCOPE for this file and
 * this sprint: persistence/API, AI interpretation.
 */

export const TUVI_ENGINE_VERSION = 'tuvi-engine-v1';
export const TUVI_MAIN_STAR_VERSION = 'tuvi-main-stars-v1';
export const TUVI_AUXILIARY_VERSION = 'core-13-v1'; // matches canonical-ruleset-v1.md §8's TUVI_AUXILIARY_SCOPE_VERSION
export const TUVI_TUAN_TRIET_VERSION = 'tuvi-tuan-triet-v1';
export const TUVI_TU_HOA_VERSION = 'tuvi-tu-hoa-v1';

export interface TuViVersionBundle {
  readonly rulesetVersion: string;
  readonly calendarVersion: string;
  readonly engineVersion: string;
  readonly mainStarVersion: string;
  readonly auxiliaryVersion: string;
  readonly tuanTrietVersion: string;
  readonly tuHoaVersion: string;
}

export interface TuViChart {
  readonly input: { readonly birthDate: string; readonly birthTime: string; readonly sex: TuViSex };
  readonly calendar: {
    readonly solarDate: { readonly year: number; readonly month: number; readonly day: number };
    readonly lunarDate: { readonly lunarYear: number; readonly lunarMonth: number; readonly lunarDay: number; readonly isLeapMonth: boolean };
    readonly hourBranch: EarthlyBranch;
    readonly effectiveTuViDate: { readonly year: number; readonly month: number; readonly day: number };
    readonly timezoneOffsetHours: number;
  };
  readonly canChi: { readonly year: { readonly stem: HeavenlyStem; readonly branch: EarthlyBranch } };
  readonly palaces: { readonly menh: EarthlyBranch; readonly than: EarthlyBranch; readonly layout: PalaceLayout };
  readonly cuc: TuViCucId;
  readonly mainStars: ReadonlyArray<ChinhTinhPlacement>;
  readonly auxiliaryStars: ReadonlyArray<Core13Placement>;
  readonly tuan: PalacePair;
  readonly triet: PalacePair;
  readonly transformations: ReadonlyArray<TuHoaPositionAnnotation>;
  readonly versions: TuViVersionBundle;
}

export type BuildTuViChartOptions = BuildTuViTuHoaContextOptions;

export function buildTuViChart(input: TuViBirthInput, options: BuildTuViChartOptions = {}): TuViChart {
  const tuHoaContext = buildTuViTuHoaContext(input, options);
  const { tuanTrietContext } = tuHoaContext;
  const { core13Context } = tuanTrietContext;
  const { mainStarsContext } = core13Context;
  const { cucContext } = mainStarsContext;
  const { foundationContext } = cucContext;
  const { calendarContext } = foundationContext;

  if (!calendarContext.sex) {
    throw new Error('buildTuViChart requires TuViBirthInput.sex (needed by CORE_13\'s Hỏa Tinh/Linh Tinh) — this should already have thrown earlier in the chain if missing; defensive guard only.');
  }

  return Object.freeze({
    input: Object.freeze({ birthDate: input.birthDate, birthTime: input.birthTime, sex: calendarContext.sex }),
    calendar: Object.freeze({
      solarDate: calendarContext.solarDate,
      lunarDate: calendarContext.lunarDate,
      hourBranch: calendarContext.hourBranch,
      effectiveTuViDate: calendarContext.effectiveTuViDate,
      timezoneOffsetHours: calendarContext.timezoneOffsetHours,
    }),
    canChi: Object.freeze({ year: Object.freeze({ stem: foundationContext.yearCanChi.stem, branch: foundationContext.yearCanChi.branch }) }),
    palaces: Object.freeze({ menh: foundationContext.menhPosition, than: foundationContext.thanPosition, layout: foundationContext.palaceLayout }),
    cuc: cucContext.cuc,
    mainStars: mainStarsContext.chinhTinh,
    auxiliaryStars: core13Context.core13,
    tuan: tuanTrietContext.tuan,
    triet: tuanTrietContext.triet,
    transformations: tuHoaContext.tuHoa,
    versions: Object.freeze({
      rulesetVersion: tuHoaContext.rulesetVersion,
      calendarVersion: calendarContext.calendarVersion,
      engineVersion: TUVI_ENGINE_VERSION,
      mainStarVersion: TUVI_MAIN_STAR_VERSION,
      auxiliaryVersion: TUVI_AUXILIARY_VERSION,
      tuanTrietVersion: TUVI_TUAN_TRIET_VERSION,
      tuHoaVersion: TUVI_TU_HOA_VERSION,
    }),
  });
}

// ---------------------------------------------------------------------------------------------
// Palace-centric projection (for UI consumption) — a DERIVED, read-only view. The chart above
// remains the sole source of truth; this function only reshapes it, never recomputes anything.
// ---------------------------------------------------------------------------------------------

export interface PalaceProjectionEntry {
  readonly branch: EarthlyBranch;
  readonly role: PalaceRole;
  readonly isMenh: boolean;
  readonly isThan: boolean;
  readonly mainStars: ReadonlyArray<ChinhTinhId>;
  readonly auxiliaryStars: ReadonlyArray<Core13StarId>;
  readonly hasTuan: boolean;
  readonly hasTriet: boolean;
  readonly transformations: ReadonlyArray<TuHoaTransformation>;
}

export type PalaceProjection = ReadonlyArray<PalaceProjectionEntry>;

export function buildPalaceProjection(chart: TuViChart): PalaceProjection {
  return Object.freeze(
    EARTHLY_BRANCHES.map((branch) =>
      Object.freeze({
        branch,
        role: chart.palaces.layout[branch],
        isMenh: branch === chart.palaces.menh,
        isThan: branch === chart.palaces.than,
        mainStars: Object.freeze(chart.mainStars.filter((p) => p.position === branch).map((p) => p.star)),
        auxiliaryStars: Object.freeze(chart.auxiliaryStars.filter((p) => p.position === branch).map((p) => p.star)),
        hasTuan: branch === chart.tuan.first || branch === chart.tuan.second,
        hasTriet: branch === chart.triet.first || branch === chart.triet.second,
        transformations: Object.freeze(chart.transformations.filter((t) => t.position === branch).map((t) => t.transformation)),
      }),
    ),
  );
}

// ---------------------------------------------------------------------------------------------
// Invariant suite — throws on the first violation found; callers may use this as a hard assertion
// before persisting/returning a chart. See tu-vi-chart.spec.ts for the invariant-by-invariant tests.
// ---------------------------------------------------------------------------------------------

export function validateTuViChart(chart: TuViChart): void {
  if (Object.keys(chart.palaces.layout).length !== 12) {
    throw new Error(`validateTuViChart: palace layout must have exactly 12 entries, got ${Object.keys(chart.palaces.layout).length}`);
  }
  if (new Set(Object.values(chart.palaces.layout)).size !== 12) {
    throw new Error('validateTuViChart: palace layout must have 12 unique roles');
  }
  if (!TU_VI_CUC_IDS.includes(chart.cuc)) {
    throw new Error(`validateTuViChart: invalid Cục "${chart.cuc}"`);
  }
  if (chart.mainStars.length !== 14 || new Set(chart.mainStars.map((s) => s.star)).size !== 14) {
    throw new Error(`validateTuViChart: must have exactly 14 unique main-star IDs, got ${chart.mainStars.length} (${new Set(chart.mainStars.map((s) => s.star)).size} unique)`);
  }
  if (!chart.mainStars.every((s) => (TU_VI_CHINH_TINH_IDS as readonly string[]).includes(s.star))) {
    throw new Error('validateTuViChart: a main star ID is not a member of TU_VI_CHINH_TINH_IDS');
  }
  if (chart.auxiliaryStars.length !== 13 || new Set(chart.auxiliaryStars.map((s) => s.star)).size !== 13) {
    throw new Error(`validateTuViChart: must have exactly 13 unique CORE_13 star IDs, got ${chart.auxiliaryStars.length} (${new Set(chart.auxiliaryStars.map((s) => s.star)).size} unique)`);
  }
  if (!chart.auxiliaryStars.every((s) => (TU_VI_CORE13_STAR_IDS as readonly string[]).includes(s.star))) {
    throw new Error('validateTuViChart: an auxiliary star ID is not a member of TU_VI_CORE13_STAR_IDS');
  }
  if (chart.tuan.first === chart.tuan.second) {
    throw new Error('validateTuViChart: Tuần must occupy 2 distinct palaces');
  }
  if (chart.triet.first === chart.triet.second) {
    throw new Error('validateTuViChart: Triệt must occupy 2 distinct palaces');
  }
  if (chart.transformations.length !== 4 || new Set(chart.transformations.map((t) => t.transformation)).size !== 4) {
    throw new Error(`validateTuViChart: must have exactly 4 unique Tứ Hóa transformations, got ${chart.transformations.length}`);
  }
  if (!chart.transformations.every((t) => (TU_HOA_TRANSFORMATIONS as readonly string[]).includes(t.transformation))) {
    throw new Error('validateTuViChart: a Tứ Hóa transformation is not one of the 4 canonical values');
  }
  const allPositions = [chart.palaces.menh, chart.palaces.than, chart.tuan.first, chart.tuan.second, chart.triet.first, chart.triet.second, ...chart.mainStars.map((s) => s.position), ...chart.auxiliaryStars.map((s) => s.position), ...chart.transformations.map((t) => t.position)];
  if (!allPositions.every((p) => (EARTHLY_BRANCHES as readonly string[]).includes(p))) {
    throw new Error('validateTuViChart: at least one position is not a valid EarthlyBranch');
  }
  const { versions } = chart;
  if (!versions.rulesetVersion || !versions.calendarVersion || !versions.engineVersion || !versions.mainStarVersion || !versions.auxiliaryVersion || !versions.tuanTrietVersion || !versions.tuHoaVersion) {
    throw new Error('validateTuViChart: version bundle is incomplete');
  }
}

export { PALACE_ROLES_FROM_MENH };
