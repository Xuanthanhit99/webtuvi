import { buildTuViMainStarsContext, type TuViMainStarsContext, type BuildTuViMainStarsContextOptions } from './tu-vi-main-stars-context';
import { calculateCore13Stars, Core13InputError, type Core13Placement } from './tu-vi-core13';
import type { TuViBirthInput } from './tu-vi-canonical-input';

/**
 * Sprint 18B.5 — CORE_13 auxiliary stars orchestration entry point (Phase 5 of 12).
 *
 * Explicitly OUT OF SCOPE for this file and this sprint: Tuần, Triệt, Tứ Hóa, chart composition,
 * persistence/API, AI interpretation. No deferred (non-CORE_13) auxiliary star is implemented
 * anywhere in this sprint's code — see the dependency audit in
 * `docs/progress/sprint-18b5-core13-final-report.md`.
 */

export interface TuViCore13Context {
  readonly mainStarsContext: TuViMainStarsContext;
  readonly core13: ReadonlyArray<Core13Placement>;
  readonly rulesetVersion: string;
}

export type BuildTuViCore13ContextOptions = BuildTuViMainStarsContextOptions;

export function buildTuViCore13Context(input: TuViBirthInput, options: BuildTuViCore13ContextOptions = {}): TuViCore13Context {
  const mainStarsContext = buildTuViMainStarsContext(input, options);
  const { foundationContext } = mainStarsContext.cucContext;
  const { calendarContext } = foundationContext;

  if (!calendarContext.sex) {
    throw new Core13InputError('buildTuViCore13Context requires TuViBirthInput.sex — Hỏa Tinh/Linh Tinh cannot be placed without it.', 'TUVI_CORE13_SEX_REQUIRED');
  }

  const core13 = calculateCore13Stars({
    yearStem: foundationContext.yearCanChi.stem,
    yearChi: foundationContext.yearCanChi.branch,
    lunarMonth: calendarContext.lunarDate.lunarMonth,
    hourBranch: calendarContext.hourBranch,
    sex: calendarContext.sex,
  });

  return Object.freeze({
    mainStarsContext,
    core13,
    rulesetVersion: mainStarsContext.rulesetVersion,
  });
}
