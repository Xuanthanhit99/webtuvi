import { buildTuViCucContext, type TuViCucContext, type BuildTuViCucContextOptions } from './tu-vi-cuc-context';
import { calculateChinhTinh, type ChinhTinhPlacement } from './tu-vi-chinh-tinh';
import type { TuViBirthInput } from './tu-vi-canonical-input';

/**
 * Sprint 18B.4 — Tử Vi anchor + 14 Chính Tinh orchestration entry point (Phase 4 of 12).
 *
 * Explicitly OUT OF SCOPE for this file and this sprint: CORE_13 auxiliary stars, Tuần, Triệt,
 * Tứ Hóa, AI interpretation.
 */

export interface TuViMainStarsContext {
  readonly cucContext: TuViCucContext;
  readonly chinhTinh: ReadonlyArray<ChinhTinhPlacement>;
  readonly rulesetVersion: string;
}

export type BuildTuViMainStarsContextOptions = BuildTuViCucContextOptions;

export function buildTuViMainStarsContext(input: TuViBirthInput, options: BuildTuViMainStarsContextOptions = {}): TuViMainStarsContext {
  const cucContext = buildTuViCucContext(input, options);

  const chinhTinh = calculateChinhTinh({
    cuc: cucContext.cuc,
    lunarDay: cucContext.foundationContext.calendarContext.lunarDate.lunarDay,
  });

  return Object.freeze({
    cucContext,
    chinhTinh,
    rulesetVersion: cucContext.rulesetVersion,
  });
}
