import { buildTuViFoundationContext, type TuViFoundationContext, type BuildTuViFoundationContextOptions } from './tu-vi-foundation-context';
import { calculateCuc, type TuViCucId } from './tu-vi-cuc';
import type { TuViBirthInput } from './tu-vi-canonical-input';

/**
 * Sprint 18B.3 — Ngũ Hành Cục orchestration entry point (Phase 3 of 12).
 *
 * A new, separate context type rather than extending `TuViFoundationContext` — Cục is a distinct
 * downstream fact computed FROM the foundation context (year Can + Mệnh position), not itself part
 * of what "foundation" (18B.2) means. Keeping the two contexts separate preserves the phase
 * boundary cleanly: nothing about `TuViFoundationContext`'s already-tested shape or meaning changes.
 *
 * Explicitly OUT OF SCOPE for this file and this sprint (Sprint 18B.3): Tử Vi anchor (including any
 * Kim Tứ Cục day-21/24 handling — that is 18B.4's own convention lock, not this one), 14 Chính Tinh,
 * CORE_13 auxiliary stars, Tuần, Triệt, Tứ Hóa, AI interpretation.
 */

export interface TuViCucContext {
  readonly foundationContext: TuViFoundationContext;
  readonly cuc: TuViCucId;
  readonly rulesetVersion: string;
}

export type BuildTuViCucContextOptions = BuildTuViFoundationContextOptions;

export function buildTuViCucContext(input: TuViBirthInput, options: BuildTuViCucContextOptions = {}): TuViCucContext {
  const foundationContext = buildTuViFoundationContext(input, options);

  const cuc = calculateCuc({
    yearStem: foundationContext.yearCanChi.stem,
    menhPosition: foundationContext.menhPosition,
  });

  return Object.freeze({
    foundationContext,
    cuc,
    rulesetVersion: foundationContext.rulesetVersion,
  });
}
