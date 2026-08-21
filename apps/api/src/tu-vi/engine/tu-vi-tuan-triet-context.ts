import { buildTuViCore13Context, type TuViCore13Context, type BuildTuViCore13ContextOptions } from './tu-vi-core13-context';
import { calculateTuan, calculateTriet, type PalacePair } from './tu-vi-tuan-triet';
import type { TuViBirthInput } from './tu-vi-canonical-input';

/** Sprint 18B.6 — Tuần + Triệt orchestration entry point (Phase 6 of 12).
 * Explicitly OUT OF SCOPE: Tứ Hóa, chart composition, persistence/API, AI interpretation. */

export interface TuViTuanTrietContext {
  readonly core13Context: TuViCore13Context;
  readonly tuan: PalacePair;
  readonly triet: PalacePair;
  readonly rulesetVersion: string;
}

export type BuildTuViTuanTrietContextOptions = BuildTuViCore13ContextOptions;

export function buildTuViTuanTrietContext(input: TuViBirthInput, options: BuildTuViTuanTrietContextOptions = {}): TuViTuanTrietContext {
  const core13Context = buildTuViCore13Context(input, options);
  const { yearCanChi } = core13Context.mainStarsContext.cucContext.foundationContext;

  const tuan = calculateTuan(yearCanChi.stem, yearCanChi.branch);
  const triet = calculateTriet(yearCanChi.stem);

  return Object.freeze({
    core13Context,
    tuan,
    triet,
    rulesetVersion: core13Context.rulesetVersion,
  });
}
