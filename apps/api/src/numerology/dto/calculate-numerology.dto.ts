import { Matches, MaxLength, MinLength } from 'class-validator';
import { NUMEROLOGY_NAME_PATTERN } from '../engine/numerology-name.util';

/** Format/length checks only — real calendar-date and letter-transliteration validation happens
 * inside the engine itself (`numerology-date.util.ts`/`numerology-name.util.ts`), which is the
 * single source of truth for what counts as valid input (mirrors Tarot's own DTO-does-shape,
 * service-does-domain-rules split). */
export class CalculateNumerologyDto {
  /** Exactly as typed — never trimmed/altered here; `normalizeName()` handles that downstream and
   * the reading persists both forms (Sprint 8 brief, Phase 2: never silently alter without showing
   * the normalized calculation input). */
  @MinLength(1)
  @MaxLength(200)
  @Matches(NUMEROLOGY_NAME_PATTERN, {
    message: 'Full birth name can only contain letters, spaces, hyphens, apostrophes, and periods.',
  })
  fullBirthName!: string;

  /** `YYYY-MM-DD` — real calendar-date/future/too-old checks happen in `numerology-date.util.ts`. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Birth date must be in YYYY-MM-DD format.' })
  birthDate!: string;
}
