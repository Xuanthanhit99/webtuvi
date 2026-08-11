import type {
  NumerologyBirthdayBreakdownDto,
  NumerologyDateBasedBreakdownDto,
  NumerologyNameBasedBreakdownDto,
  NumerologyReductionResultDto,
  NumerologyValueDto,
} from '@beaconvie/types';

/** Phase 13 — Calculation Transparency UX. Turns the real, structured breakdown JSON the backend
 * persisted into plain-language step lines — never AI-generated, never internal code jargon (field
 * names, enum values). Every line here is a direct, deterministic rendering of real numbers. */

function reductionStepsText(reduction: NumerologyReductionResultDto): string[] {
  const lines = reduction.steps.map((step) => `${step.from} → ${step.digits.join(' + ')} = ${step.to}`);
  if (reduction.isMasterNumber) {
    lines.push(`${reduction.value} is a Master Number, so it's kept as-is instead of being reduced further.`);
  } else if (lines.length === 0) {
    lines.push(`${reduction.value} is already a single digit — no reduction needed.`);
  }
  return lines;
}

function isDateBased(breakdown: unknown): breakdown is NumerologyDateBasedBreakdownDto {
  return typeof breakdown === 'object' && breakdown !== null && 'components' in breakdown;
}

function isNameBased(breakdown: unknown): breakdown is NumerologyNameBasedBreakdownDto {
  return typeof breakdown === 'object' && breakdown !== null && 'letters' in breakdown;
}

const COMPONENT_LABELS: Record<string, string> = { MONTH: 'Month', DAY: 'Day', YEAR: 'Year' };

export function breakdownSteps(entry: NumerologyValueDto): string[] {
  const breakdown = entry.breakdown;

  if (isDateBased(breakdown)) {
    const lines: string[] = [];
    for (const component of breakdown.components) {
      lines.push(`${COMPONENT_LABELS[component.component] ?? component.component} (${component.input}): ${reductionStepsText(component.reduction).join(' → ')}`);
    }
    const values = breakdown.components.map((c) => c.reduction.value).join(' + ');
    lines.push(`Total: ${values} = ${breakdown.total}`);
    lines.push(`Final reduction: ${reductionStepsText(breakdown.finalReduction).join(' → ')}`);
    return lines;
  }

  if (isNameBased(breakdown)) {
    const lines: string[] = [];
    lines.push(`Letters used (from "${breakdown.normalizedName}"): ${breakdown.letters.map((l) => `${l.char}=${l.value}`).join(', ') || 'none'}`);
    lines.push(`Sum: ${breakdown.letters.map((l) => l.value).join(' + ') || '0'} = ${breakdown.sum}`);
    lines.push(`Final reduction: ${reductionStepsText(breakdown.reduction).join(' → ')}`);
    return lines;
  }

  // BIRTHDAY — a single date-component reduction, no totals to sum.
  const birthday = breakdown as NumerologyBirthdayBreakdownDto;
  return [`Day (${birthday.input}): ${reductionStepsText(birthday.reduction).join(' → ')}`];
}
