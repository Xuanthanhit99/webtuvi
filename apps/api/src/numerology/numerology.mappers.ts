import type { NumerologyReading, NumerologyReadingHistory, NumerologyValue } from '@prisma/client';
import type { NumerologyValueType } from './engine/numerology-engine';

export interface NumerologyValueDto {
  type: NumerologyValueType;
  value: number;
  isMasterNumber: boolean;
  /** Structured reduction/letter-sum steps — see `numerology-engine.ts`'s breakdown shapes. Passed
   * through as-is from the stored JSON; never re-derived or altered here. */
  breakdown: unknown;
  /** Only set for PERSONAL_YEAR. */
  appliesToYear: number | null;
  order: number;
}

export interface NumerologyReadingDto {
  id: string;
  status: NumerologyReading['status'];
  visibility: NumerologyReading['visibility'];
  birthNameInput: string;
  normalizedBirthName: string;
  /** `YYYY-MM-DD`. */
  birthDate: string;
  calculationVersion: string;
  normalizationVersion: string;
  interpretation: string | null;
  values: NumerologyValueDto[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface NumerologyReadingHistoryDto {
  id: string;
  action: NumerologyReadingHistory['action'];
  detail: string;
  createdAt: string;
}

function toNumerologyValueDto(value: NumerologyValue): NumerologyValueDto {
  return {
    type: value.type as NumerologyValueType,
    value: value.value,
    isMasterNumber: value.isMasterNumber,
    breakdown: value.breakdown,
    appliesToYear: value.appliesToYear,
    order: value.order,
  };
}

export function toNumerologyReadingDto(reading: NumerologyReading & { values: NumerologyValue[] }): NumerologyReadingDto {
  return {
    id: reading.id,
    status: reading.status,
    visibility: reading.visibility,
    birthNameInput: reading.birthNameInput,
    normalizedBirthName: reading.normalizedBirthName,
    birthDate: reading.birthDate.toISOString().slice(0, 10),
    calculationVersion: reading.calculationVersion,
    normalizationVersion: reading.normalizationVersion,
    interpretation: reading.interpretation,
    values: [...reading.values].sort((a, b) => a.order - b.order).map(toNumerologyValueDto),
    createdAt: reading.createdAt.toISOString(),
    updatedAt: reading.updatedAt.toISOString(),
    archivedAt: reading.archivedAt?.toISOString() ?? null,
  };
}

export function toNumerologyReadingHistoryDto(entry: NumerologyReadingHistory): NumerologyReadingHistoryDto {
  return { id: entry.id, action: entry.action, detail: entry.detail, createdAt: entry.createdAt.toISOString() };
}
