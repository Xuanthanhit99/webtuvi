import { Matches } from 'class-validator';

/** Format checks only — real calendar-date/range/future-date validation happens inside the engine
 * itself (`eastern-horoscope-engine.ts`'s `parseBirthDate`), the single source of truth for what
 * counts as valid input (mirrors Numerology's own DTO-does-shape, service-does-domain-rules split).
 * Birth date only — per the locked scope (`docs/domain/eastern-horoscope-rules.md` §6, Bible §14),
 * this module needs no birth time, location, or gender. */
export class CalculateEasternHoroscopeDto {
  /** `YYYY-MM-DD`. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Birth date must be in YYYY-MM-DD format.' })
  birthDate!: string;
}
