import type { NumerologyReadingStatusValue, NumerologyValueTypeValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/architecture/numerology-discovery.md. */
export const VALUE_TYPE_LABELS: Record<NumerologyValueTypeValue, string> = {
  LIFE_PATH: 'Life Path',
  EXPRESSION: 'Expression',
  SOUL_URGE: 'Soul Urge',
  PERSONALITY: 'Personality',
  BIRTHDAY: 'Birthday',
  PERSONAL_YEAR: 'Personal Year',
};

export const VALUE_TYPE_DESCRIPTIONS: Record<NumerologyValueTypeValue, string> = {
  LIFE_PATH: 'The broadest, most central number — the overall direction and lessons of your life.',
  EXPRESSION: 'Your natural talents and abilities, drawn from your full birth name.',
  SOUL_URGE: 'What you genuinely want beneath the surface, drawn from the vowels in your name.',
  PERSONALITY: 'The impression you tend to make on others at first, drawn from the consonants in your name.',
  BIRTHDAY: 'A smaller, specific talent that supports your broader Life Path.',
  PERSONAL_YEAR: 'The theme of the current calendar year for you.',
};

/** Overview -> Life Path -> Expression -> Soul Urge -> Personality -> Birthday -> Personal Year —
 * the progressive-disclosure order (Product Bible Module 15 §4), matching backend `order`. */
export const VALUE_TYPE_ORDER: NumerologyValueTypeValue[] = ['LIFE_PATH', 'EXPRESSION', 'SOUL_URGE', 'PERSONALITY', 'BIRTHDAY', 'PERSONAL_YEAR'];

export const READING_STATUS_LABELS: Record<NumerologyReadingStatusValue, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
};

export const READING_STATUS_BADGE_VARIANT: Record<NumerologyReadingStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};
