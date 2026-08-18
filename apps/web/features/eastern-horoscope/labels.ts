import type { EasternHoroscopeProfileStatusValue, YearEnergyRelationshipValue } from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';

/** Plain-language labels only — never AI wording. See docs/reference/web-tu-vi/web-tu-vi/14-eastern-horoscope-experience.md. */
export const PROFILE_STATUS_LABELS: Record<EasternHoroscopeProfileStatusValue, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
};

export const PROFILE_STATUS_BADGE_VARIANT: Record<EasternHoroscopeProfileStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

/** Thematic, non-predictive framing only — this product hard-rejects luck-scoring/fortune-telling
 * copy (Bible Module 14 §11). */
export const YEAR_ENERGY_RELATIONSHIP_LABELS: Record<YearEnergyRelationshipValue, string> = {
  GENERATES: 'This year’s element nurtures your own — a season that may support steady growth.',
  IS_GENERATED_BY: 'Your own element feeds this year’s — a season that may ask more of your own reserves.',
  CONTROLS: 'This year’s element restrains your own — a season that may invite patience.',
  IS_CONTROLLED_BY: 'Your own element restrains this year’s — a season where your own steadiness may stand out.',
  SAME: 'This year shares your own element — a season of familiar rhythm.',
};

export const ELEMENT_LABELS_EN: Record<string, string> = {
  Mộc: 'Wood',
  Hỏa: 'Fire',
  Thổ: 'Earth',
  Kim: 'Metal',
  Thủy: 'Water',
};

export const YIN_YANG_LABELS_EN: Record<string, string> = {
  Dương: 'Yang',
  Âm: 'Yin',
};
