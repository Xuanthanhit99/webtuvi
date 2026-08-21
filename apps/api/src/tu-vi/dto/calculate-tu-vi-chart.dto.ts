import { IsIn, Matches } from 'class-validator';

/** Format checks only — real calendar-date/range/future-date/hour validation happens inside the
 * engine itself (`tu-vi-canonical-input.ts`'s `parseTuViBirthInput`), the single source of truth
 * for what counts as valid input (mirrors Eastern Horoscope's own DTO-does-shape,
 * service-does-domain-rules split). Birth time and sex ARE required here, unlike Eastern
 * Horoscope's date-only DTO — Tử Vi's calculation genuinely depends on both (Giờ Tý/hour-branch
 * rules; CORE_13's Hỏa Tinh/Linh Tinh sex-dependent direction). */
export class CalculateTuViChartDto {
  /** `YYYY-MM-DD`. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Birth date must be in YYYY-MM-DD format.' })
  birthDate!: string;

  /** `HH:mm`, 24-hour. */
  @Matches(/^\d{2}:\d{2}$/, { message: 'Birth time must be in HH:mm (24-hour) format.' })
  birthTime!: string;

  /** `'Nam'` (male) or `'Nữ'` (female) — VDTTL-1956's own binary categories. */
  @IsIn(['Nam', 'Nữ'], { message: 'Sex must be "Nam" or "Nữ".' })
  sex!: 'Nam' | 'Nữ';
}
