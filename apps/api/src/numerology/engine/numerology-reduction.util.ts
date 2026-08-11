/**
 * Phase 3/4 — the one, centrally-shared digit-reduction rule every core number goes through.
 * Product Bible Module 15 §17/§18: Master Numbers 11, 22, and 33 are never collapsed into their
 * reduced single-digit equivalents — this must be a single reusable utility, not scattered
 * `if (value === 11 || ...)` checks across unrelated services (Sprint 8 brief, Phase 4).
 *
 * Convention decision (documented, applied consistently — no Product Bible text spells out the
 * digit-summing loop itself): repeatedly sum the decimal digits of the current value until it is
 * either a single digit (1-9) or a Master Number (11/22/33), at which point reduction stops. This
 * applies uniformly at every stage of every calculation (name-letter sums, date-component sums,
 * and final totals) — one rule, everywhere.
 */

export const MASTER_NUMBERS = [11, 22, 33] as const;
export type MasterNumber = (typeof MASTER_NUMBERS)[number];

export function isMasterNumber(value: number): value is MasterNumber {
  return (MASTER_NUMBERS as readonly number[]).includes(value);
}

export interface ReductionStep {
  /** The value entering this reduction step. */
  from: number;
  /** The decimal digits of `from`, in order. */
  digits: number[];
  /** The sum of `digits` — becomes `from` for the next step, or the final value if reduction stops. */
  to: number;
}

export interface ReductionResult {
  /** The final, fully-reduced value: a single digit (1-9) or a preserved Master Number. */
  value: number;
  isMasterNumber: boolean;
  /** Every intermediate digit-summing step, in order — the "why is my number X" transparency
   * trail (Sprint 8 brief, Phase 13). Empty when `value` required no reduction at all. */
  steps: ReductionStep[];
}

export function digitsOf(value: number): number[] {
  return Math.abs(Math.trunc(value))
    .toString(10)
    .split('')
    .map((d) => Number(d));
}

/** Reduces a non-negative integer to a single digit or a preserved Master Number, recording every
 * intermediate step. Pure function — no I/O, no randomness, always the same output for the same
 * input (Sprint 8 brief Phase 3: "reproducible from the same normalized input"). */
export function reduceToCoreNumber(input: number): ReductionResult {
  if (!Number.isInteger(input) || input < 0) {
    throw new Error(`reduceToCoreNumber: input must be a non-negative integer, got ${input}.`);
  }

  const steps: ReductionStep[] = [];
  let current = input;

  while (current > 9 && !isMasterNumber(current)) {
    const digits = digitsOf(current);
    const to = digits.reduce((sum, d) => sum + d, 0);
    steps.push({ from: current, digits, to });
    current = to;
  }

  return { value: current, isMasterNumber: isMasterNumber(current), steps };
}
