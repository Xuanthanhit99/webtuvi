import { buildTuViCalendarContext, type TuViCalendarContext, type BuildTuViCalendarContextOptions } from './tu-vi-calendar-context';
import { getTuViYearCanChi, type TuViYearCanChi } from './tu-vi-can-chi';
import { calculateMenhPalace, calculateThanPalace, isValidThanOffset } from './tu-vi-menh-than';
import { buildPalaceLayout, type PalaceLayout, type EarthlyBranch } from './tu-vi-palace';
import type { TuViBirthInput } from './tu-vi-canonical-input';

/**
 * Sprint 18B.2 — the Tử Vi foundation layer's orchestration entry point (Phase 2 of 12).
 *
 * Assembles: 18B.1's calendar context, year Can Chi, Mệnh, Thân, and the full 12-palace role
 * layout. Computes NOTHING beyond those facts. Pure function: no DB access, no I/O, no AI call, no
 * randomness.
 *
 * Explicitly OUT OF SCOPE for this file and this sprint (Sprint 18B.2): Cục, Tử Vi anchor, 14
 * Chính Tinh, Tuần, Triệt, Tứ Hóa, CORE_13 auxiliary stars, AI interpretation. See
 * `docs/progress/sprint-18b2-canchi-palaces-menh-than-final-report.md` for the explicit
 * no-leakage audit.
 */

export interface TuViFoundationContext {
  readonly calendarContext: TuViCalendarContext;
  readonly yearCanChi: TuViYearCanChi;
  readonly menhPosition: EarthlyBranch;
  readonly thanPosition: EarthlyBranch;
  readonly palaceLayout: PalaceLayout;
  readonly rulesetVersion: string;
}

export type BuildTuViFoundationContextOptions = BuildTuViCalendarContextOptions;

export function buildTuViFoundationContext(input: TuViBirthInput, options: BuildTuViFoundationContextOptions = {}): TuViFoundationContext {
  const calendarContext = buildTuViCalendarContext(input, options);

  const yearCanChi = getTuViYearCanChi(calendarContext.lunarDate.lunarYear);

  const menhThanInput = { lunarMonth: calendarContext.lunarDate.lunarMonth, hourBranch: calendarContext.hourBranch };
  const menhPosition = calculateMenhPalace(menhThanInput);
  const thanPosition = calculateThanPalace(menhThanInput);

  // TUVI-MT-03 hard invariant — a violation here is a code defect, not a possible valid outcome
  // for any real input; fail loudly rather than persist/propagate a silently-wrong chart.
  if (!isValidThanOffset(menhPosition, thanPosition)) {
    throw new Error(
      `Computed Thân position (${thanPosition}) is not a valid offset from Mệnh (${menhPosition}) — this indicates a defect in calculateMenhPalace/calculateThanPalace, not a possible real outcome.`,
    );
  }

  const palaceLayout = buildPalaceLayout(menhPosition);

  return Object.freeze({
    calendarContext,
    yearCanChi,
    menhPosition,
    thanPosition,
    palaceLayout,
    rulesetVersion: calendarContext.rulesetVersion,
  });
}
