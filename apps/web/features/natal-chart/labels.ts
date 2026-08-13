import type {
  NatalAspectTypeValue,
  NatalChartHistoryActionValue,
  NatalChartPlanetValue,
  NatalChartStatusValue,
  NatalZodiacSignValue,
} from '@beaconvie/types';
import type { BadgeVariant } from '@/components/ui/badge';
import type { NatalChartInterpretationSectionKey } from './natal-chart.types';

/** Plain, fixed labels only — never AI wording. See docs/architecture/natal-chart-discovery.md. */
export const PLANET_LABELS: Record<NatalChartPlanetValue, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
};

export const PLANET_GLYPHS: Record<NatalChartPlanetValue, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
};

/** Sun -> Pluto, the fixed classical display order — matches backend `NatalPlacement.order`. */
export const PLANET_ORDER: NatalChartPlanetValue[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

export const SIGN_LABELS: Record<NatalZodiacSignValue, string> = {
  aries: 'Aries',
  taurus: 'Taurus',
  gemini: 'Gemini',
  cancer: 'Cancer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  scorpio: 'Scorpio',
  sagittarius: 'Sagittarius',
  capricorn: 'Capricorn',
  aquarius: 'Aquarius',
  pisces: 'Pisces',
};

export const SIGN_GLYPHS: Record<NatalZodiacSignValue, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

/** Aries -> Pisces, zodiac order — used for the wheel's fixed 12-sign ring. */
export const SIGN_ORDER: NatalZodiacSignValue[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

export const ASPECT_TYPE_LABELS: Record<NatalAspectTypeValue, string> = {
  conjunction: 'Conjunction',
  opposition: 'Opposition',
  trine: 'Trine',
  square: 'Square',
  sextile: 'Sextile',
};

/** Harmonious vs. tense framing only for the wheel's aspect-line color — never implies a
 * "good/bad" judgment in any user-facing copy (Module 13 §11: no manipulation, no anxiety
 * framing). */
export const ASPECT_TYPE_LINE_STYLE: Record<NatalAspectTypeValue, 'harmonious' | 'tense' | 'neutral'> = {
  conjunction: 'neutral',
  trine: 'harmonious',
  sextile: 'harmonious',
  square: 'tense',
  opposition: 'tense',
};

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function houseLabel(n: number): string {
  return `${ordinal(n)} house`;
}

export const CHART_STATUS_LABELS: Record<NatalChartStatusValue, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
};

export const CHART_STATUS_BADGE_VARIANT: Record<NatalChartStatusValue, BadgeVariant> = {
  ACTIVE: 'new',
  ARCHIVED: 'neutral',
  DELETED: 'neutral',
};

export const HISTORY_ACTION_LABELS: Record<NatalChartHistoryActionValue, string> = {
  CREATED: 'Chart calculated',
  VIEWED: 'Viewed',
  INTERPRETED: 'AI interpretation generated',
  ARCHIVED: 'Archived',
  RESTORED: 'Restored',
  DELETED: 'Deleted',
};

/** Overview -> ... -> Key Aspects, the progressive-disclosure order (Product Bible Module 13 §4),
 * matching the backend's fixed section keys exactly. */
export const INTERPRETATION_SECTION_ORDER: NatalChartInterpretationSectionKey[] = [
  'overview',
  'corePersonality',
  'emotionalWorld',
  'communication',
  'loveAndRelationships',
  'motivation',
  'careerDirection',
  'strengths',
  'challenges',
  'keyAspects',
];

export const INTERPRETATION_SECTION_LABELS: Record<NatalChartInterpretationSectionKey, string> = {
  overview: 'Overview',
  corePersonality: 'Core Personality',
  emotionalWorld: 'Emotional World',
  communication: 'Communication',
  loveAndRelationships: 'Love & Relationships',
  motivation: 'Motivation',
  careerDirection: 'Career & Direction',
  strengths: 'Strengths',
  challenges: 'Challenges',
  keyAspects: 'Key Aspects',
};
