import { buildTuViTuanTrietContext, type TuViTuanTrietContext, type BuildTuViTuanTrietContextOptions } from './tu-vi-tuan-triet-context';
import { calculateTuHoa, annotateTuHoaPositions, type TuHoaPositionAnnotation } from './tu-vi-tu-hoa';
import type { TuViBirthInput } from './tu-vi-canonical-input';

/** Sprint 18B.7 — Tứ Hóa orchestration entry point (Phase 7 of 12).
 * Explicitly OUT OF SCOPE: chart composition, persistence/API, AI interpretation. */

export interface TuViTuHoaContext {
  readonly tuanTrietContext: TuViTuanTrietContext;
  readonly tuHoa: ReadonlyArray<TuHoaPositionAnnotation>;
  readonly rulesetVersion: string;
}

export type BuildTuViTuHoaContextOptions = BuildTuViTuanTrietContextOptions;

export function buildTuViTuHoaContext(input: TuViBirthInput, options: BuildTuViTuHoaContextOptions = {}): TuViTuHoaContext {
  const tuanTrietContext = buildTuViTuanTrietContext(input, options);
  const { mainStarsContext } = tuanTrietContext.core13Context;
  const { yearCanChi } = mainStarsContext.cucContext.foundationContext;

  const tuHoaAssignments = calculateTuHoa(yearCanChi.stem);
  const tuHoa = annotateTuHoaPositions(tuHoaAssignments, mainStarsContext.chinhTinh, tuanTrietContext.core13Context.core13);

  return Object.freeze({
    tuanTrietContext,
    tuHoa,
    rulesetVersion: tuanTrietContext.rulesetVersion,
  });
}
