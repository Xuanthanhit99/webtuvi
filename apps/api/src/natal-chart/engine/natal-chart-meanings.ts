import type { NatalChartPlanetKey } from './natal-chart-constants';
import type { NatalAspectTypeKey, NatalZodiacSignKey } from './natal-chart-calculator.service';

/**
 * Phase 18 — the deterministic, fixed-reference "Symbol Interpretation Engine" (Product Bible
 * Module 13 §18). Traditional astrological meanings, grounded in standard/public-domain Western
 * astrology concepts (mirrors `numerology-meanings.ts`/`TarotCard`'s own original-but-
 * traditionally-grounded meaning text precedent). Never AI-generated, never AI-editable.
 *
 * Composed, not exhaustively hand-authored (see docs/architecture/natal-chart-discovery.md):
 * planet (10) + sign (12) + house (12) + aspect-type (5) meanings are combined at render time
 * into a placement's traditional meaning, mirroring how real astrology reference texts compose
 * meaning from these same building blocks. Editable in the future only through an Admin
 * content-curation process (Module 23 §10) — no such process exists yet, so this is a static,
 * versioned in-code table for Sprint 9, same as Numerology's/Tarot's own meanings tables.
 */
export const NATAL_CHART_MEANINGS_VERSION = 'natal-chart-meanings-v1';

export interface NatalMeaningEntry {
  title: string;
  meaning: string;
}

const PLANET_MEANINGS: Record<NatalChartPlanetKey, NatalMeaningEntry> = {
  sun: { title: 'Sun', meaning: 'core identity, vitality, and the self you are consciously growing into' },
  moon: { title: 'Moon', meaning: 'emotional nature, instinctive reactions, and what makes you feel safe' },
  mercury: { title: 'Mercury', meaning: 'communication, thinking style, and how you process and share information' },
  venus: { title: 'Venus', meaning: 'attraction, values, and what you find beautiful or worth pursuing' },
  mars: { title: 'Mars', meaning: 'drive, assertiveness, and how you take action or stand up for yourself' },
  jupiter: { title: 'Jupiter', meaning: 'growth, optimism, and where you tend to expand or seek meaning' },
  saturn: { title: 'Saturn', meaning: 'structure, responsibility, and where discipline meets long-term reward' },
  uranus: { title: 'Uranus', meaning: 'originality, disruption, and where you resist convention' },
  neptune: { title: 'Neptune', meaning: 'imagination, idealism, and where boundaries tend to soften' },
  pluto: { title: 'Pluto', meaning: 'transformation, intensity, and where deep change tends to happen' },
};

const SIGN_MEANINGS: Record<NatalZodiacSignKey, NatalMeaningEntry> = {
  aries: { title: 'Aries', meaning: 'direct, initiating, quick to act' },
  taurus: { title: 'Taurus', meaning: 'steady, grounded, valuing comfort and consistency' },
  gemini: { title: 'Gemini', meaning: 'curious, adaptable, drawn to variety and conversation' },
  cancer: { title: 'Cancer', meaning: 'protective, attuned to feeling, oriented toward home and belonging' },
  leo: { title: 'Leo', meaning: 'expressive, warm, drawn to being genuinely seen' },
  virgo: { title: 'Virgo', meaning: 'attentive, practical, oriented toward refinement and usefulness' },
  libra: { title: 'Libra', meaning: 'relational, balance-seeking, attuned to fairness and harmony' },
  scorpio: { title: 'Scorpio', meaning: 'intense, probing, drawn beneath the surface of things' },
  sagittarius: { title: 'Sagittarius', meaning: 'exploratory, optimistic, oriented toward the bigger picture' },
  capricorn: { title: 'Capricorn', meaning: 'ambitious, disciplined, oriented toward long-term achievement' },
  aquarius: { title: 'Aquarius', meaning: 'independent, idea-driven, drawn to the unconventional' },
  pisces: { title: 'Pisces', meaning: 'imaginative, empathic, attuned to the intangible' },
};

const HOUSE_MEANINGS: Record<number, NatalMeaningEntry> = {
  1: { title: 'the 1st house', meaning: 'self, first impressions, how you meet the world' },
  2: { title: 'the 2nd house', meaning: 'money, possessions, and personal sense of value' },
  3: { title: 'the 3rd house', meaning: 'communication, learning, and everyday connections' },
  4: { title: 'the 4th house', meaning: 'home, family, and your sense of roots' },
  5: { title: 'the 5th house', meaning: 'creativity, romance, and self-expression' },
  6: { title: 'the 6th house', meaning: 'daily routine, health, and practical service' },
  7: { title: 'the 7th house', meaning: 'partnership, close relationships, and one-to-one connection' },
  8: { title: 'the 8th house', meaning: 'shared resources, intimacy, and transformation' },
  9: { title: 'the 9th house', meaning: 'belief, higher learning, and long-distance or philosophical horizons' },
  10: { title: 'the 10th house', meaning: 'career, public life, and reputation' },
  11: { title: 'the 11th house', meaning: 'community, friendship, and hopes for the future' },
  12: { title: 'the 12th house', meaning: 'the inner world, rest, and what stays private' },
};

const ASPECT_MEANINGS: Record<NatalAspectTypeKey, NatalMeaningEntry> = {
  conjunction: { title: 'Conjunction', meaning: 'these two energies are fused together, acting as one blended force' },
  opposition: { title: 'Opposition', meaning: 'these two energies pull in different directions, asking for balance between them' },
  trine: { title: 'Trine', meaning: 'these two energies flow easily together, a natural, supportive ease' },
  square: { title: 'Square', meaning: 'these two energies create productive friction, a tension that often drives growth' },
  sextile: { title: 'Sextile', meaning: 'these two energies offer a supportive opportunity, available when drawn on' },
};

const ANGLE_LABELS: Record<'ascendant' | 'midheaven', string> = {
  ascendant: 'Ascendant (Rising Sign)',
  midheaven: 'Midheaven',
};

const ORDINAL_SUFFIXES: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };

function ordinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (ORDINAL_SUFFIXES[n % 10] ?? 'th');
  return `${n}${suffix}`;
}

export function planetMeaning(body: NatalChartPlanetKey): NatalMeaningEntry {
  return PLANET_MEANINGS[body];
}

export function signMeaning(sign: NatalZodiacSignKey): NatalMeaningEntry {
  return SIGN_MEANINGS[sign];
}

export function houseMeaning(houseNumber: number): NatalMeaningEntry {
  const entry = HOUSE_MEANINGS[houseNumber];
  if (!entry) throw new Error(`No fixed meaning for house number ${houseNumber} — expected 1-12.`);
  return entry;
}

export function aspectTypeMeaning(type: NatalAspectTypeKey): NatalMeaningEntry {
  return ASPECT_MEANINGS[type];
}

/** Composes a placement's traditional meaning from its fixed planet/sign/house building blocks —
 * e.g. "Mercury (communication, thinking style, and how you process and share information) in
 * Gemini (curious, adaptable, drawn to variety and conversation) — the 3rd house (communication,
 * learning, and everyday connections)". `house` is omitted from the composition entirely when
 * null (houses unavailable), never a fabricated placeholder. */
export function composePlacementMeaning(body: NatalChartPlanetKey, sign: NatalZodiacSignKey, house: number | null): string {
  const planet = planetMeaning(body);
  const signEntry = signMeaning(sign);
  const base = `${planet.title} (${planet.meaning}) in ${signEntry.title} (${signEntry.meaning})`;
  if (house === null) return base;
  const houseEntry = houseMeaning(house);
  return `${base} — ${houseEntry.title} (${houseEntry.meaning})`;
}

export function composeAngleMeaning(angle: 'ascendant' | 'midheaven', sign: NatalZodiacSignKey): string {
  const signEntry = signMeaning(sign);
  return `${ANGLE_LABELS[angle]} in ${signEntry.title} (${signEntry.meaning})`;
}

const POINT_LABELS: Record<string, string> = {
  ...Object.fromEntries(Object.entries(PLANET_MEANINGS).map(([key, value]) => [key, value.title])),
  ascendant: ANGLE_LABELS.ascendant,
  midheaven: ANGLE_LABELS.midheaven,
};

export function pointLabel(point: string): string {
  return POINT_LABELS[point] ?? point;
}

export function composeAspectMeaning(pointA: string, pointB: string, type: NatalAspectTypeKey): string {
  const aspect = aspectTypeMeaning(type);
  return `${pointLabel(pointA)} ${aspect.title} ${pointLabel(pointB)} — ${aspect.meaning}`;
}

export { ordinal as houseOrdinal };
