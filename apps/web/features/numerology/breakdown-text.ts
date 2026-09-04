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
    lines.push(`${reduction.value} là số đặc biệt nên được giữ nguyên, không rút gọn thêm.`);
  } else if (lines.length === 0) {
    lines.push(`${reduction.value} đã là số có một chữ số nên không cần rút gọn.`);
  }
  return lines;
}

function isDateBased(breakdown: unknown): breakdown is NumerologyDateBasedBreakdownDto {
  return typeof breakdown === 'object' && breakdown !== null && 'components' in breakdown;
}

function isNameBased(breakdown: unknown): breakdown is NumerologyNameBasedBreakdownDto {
  return typeof breakdown === 'object' && breakdown !== null && 'letters' in breakdown;
}

const COMPONENT_LABELS: Record<string, string> = { MONTH: 'Tháng', DAY: 'Ngày', YEAR: 'Năm' };

export function breakdownSteps(entry: NumerologyValueDto): string[] {
  const breakdown = entry.breakdown;

  if (isDateBased(breakdown)) {
    const lines: string[] = [];
    for (const component of breakdown.components) {
      lines.push(`${COMPONENT_LABELS[component.component] ?? component.component} (${component.input}): ${reductionStepsText(component.reduction).join(' → ')}`);
    }
    const values = breakdown.components.map((c) => c.reduction.value).join(' + ');
    lines.push(`Tổng: ${values} = ${breakdown.total}`);
    lines.push(`Rút gọn cuối: ${reductionStepsText(breakdown.finalReduction).join(' → ')}`);
    return lines;
  }

  if (isNameBased(breakdown)) {
    const lines: string[] = [];
    lines.push(`Các chữ cái được dùng (từ "${breakdown.normalizedName}"): ${breakdown.letters.map((l) => `${l.char}=${l.value}`).join(', ') || 'không có'}`);
    lines.push(`Tổng: ${breakdown.letters.map((l) => l.value).join(' + ') || '0'} = ${breakdown.sum}`);
    lines.push(`Rút gọn cuối: ${reductionStepsText(breakdown.reduction).join(' → ')}`);
    return lines;
  }

  // BIRTHDAY — a single date-component reduction, no totals to sum.
  const birthday = breakdown as NumerologyBirthdayBreakdownDto;
  return [`Ngày (${birthday.input}): ${reductionStepsText(birthday.reduction).join(' → ')}`];
}
