/**
 * Centralized calculation configuration for the Natal Chart engine — Phase 5's versioning
 * requirement: zodiac mode, house system, and orb rules live in exactly one place, never
 * scattered through calculator/record/interpretation code. See
 * docs/architecture/natal-chart-discovery.md for the product reasoning behind each choice.
 */

/** `calculationVersion` persisted on every `NatalChart` row. Bump only when the calculation
 * *rules* (house system, zodiac mode, orb table, timezone-correction table) change in a way that
 * would produce a different chart for the same input — never for unrelated refactors. */
export const NATAL_CHART_CALCULATION_VERSION = 'natal-chart-circular-horoscope-v1';

/** `engineVersion` — the pinned `circular-natal-horoscope-js` version actually used, independent
 * of `NATAL_CHART_CALCULATION_VERSION` (Phase 5: engine and rule versions are tracked
 * separately). Keep in sync with the dependency version in package.json. */
export const NATAL_CHART_ENGINE_VERSION = '1.1.0';

/** Tropical zodiac — the Western-astrology default, distinct from the unrelated future "Eastern
 * Horoscope" module. Sidereal is supported by the underlying library but not exposed this
 * sprint. */
export const NATAL_CHART_ZODIAC_MODE = 'tropical' as const;

/** Placidus — Module 13 §17's own example house system and the de facto Western-astrology
 * default. Mathematically undefined at extreme/polar latitudes; see
 * `NATAL_CHART_HOUSE_UNAVAILABLE_LATITUDE_THRESHOLD` below and
 * `natal-chart-calculator.service.ts` for the `housesAvailable: false` degrade path. */
export const NATAL_CHART_HOUSE_SYSTEM = 'placidus' as const;

/** `circular-natal-horoscope-js@1.1.0` does not itself raise a detectable error or produce
 * NaN/Infinity at extreme latitudes (verified during this sprint's engine spike — probed up to
 * and including the exact pole across a full day's worth of times, all returned finite numbers).
 * Placidus is nonetheless a well-documented mathematical/astronomical non-starter beyond the
 * polar circles, where the diurnal arc some house cusps depend on never crosses the local
 * horizon for part of the year — real astrology software commonly disables/warns on Placidus at
 * this same boundary. Since the library gives no failure signal to detect, this threshold is
 * applied explicitly and disclosed here, rather than fabricated house data at latitudes where
 * Placidus is not astronomically meaningful. */
export const NATAL_CHART_HOUSE_UNAVAILABLE_LATITUDE_THRESHOLD = 66.5;

/** Major aspects only (Sprint 9 brief Phase 6). Minor aspects (quincunx, semi-square, etc.) are
 * not computed this sprint. */
export const NATAL_CHART_ASPECT_TYPES = ['major'] as const;

/** Orb degrees per aspect type — the library's own documented defaults, copied here once so this
 * file is the single source of truth an implementer can audit without reading library internals.
 * Never overridden per-request. */
export const NATAL_CHART_ASPECT_ORBS: Record<'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile', number> = {
  conjunction: 8,
  opposition: 8,
  trine: 8,
  square: 7,
  sextile: 6,
};

/** The ten classical planets this sprint computes, in fixed classical display order (Sun ->
 * Pluto) — a real, fixed ordering, never client-supplied. Lunar nodes and Lilith are out of
 * scope this sprint (not in the brief's "at minimum" list). */
export const NATAL_CHART_PLANETS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const;
export type NatalChartPlanetKey = (typeof NATAL_CHART_PLANETS)[number];

/** Every point aspects are computed between — the 10 planets above plus the Ascendant/Midheaven
 * angles. Passed to the library as an explicit list (not its generic `'bodies'`/`'angles'`
 * category shorthands), which would otherwise silently pull in Chiron/Sirius — out of scope this
 * sprint and not part of any documented product decision. */
export const NATAL_CHART_ASPECT_POINTS = [...NATAL_CHART_PLANETS, 'ascendant', 'midheaven'] as const;
export type NatalChartAspectPointKey = (typeof NATAL_CHART_ASPECT_POINTS)[number];

/** Free accounts can browse only their most recent 20 charts — mirrors Numerology/Tarot's own
 * `FREE_HISTORY_LIMIT` exactly. */
export const NATAL_CHART_FREE_HISTORY_LIMIT = 20;

/** Anti-abuse/cost-control only, NOT a content gate (Product Bible Module 2 §8: all Discovery
 * content, including the full calculated chart, is free for every account). This ceiling bounds
 * AI-interpretation cost on chart creation/recalculation specifically — repeated *viewing* of an
 * already-calculated chart is never rate-limited (Module 13 §1/§12's explicit depth-over-frequency
 * retention model), mirroring Numerology's own daily-create-ceiling shape but scoped to the one
 * event that actually costs money. */
export const NATAL_CHART_FREE_DAILY_CREATE_LIMIT = 5;
export const NATAL_CHART_PREMIUM_DAILY_CREATE_LIMIT = 15;

/** Bounds how many aspects are ever sent to the AI interpretation prompt — the tightest-orb
 * (most exact) aspects are the most astrologically significant ones, and this keeps the prompt
 * bounded regardless of how many major aspects a given chart happens to produce (Phase 12's
 * "never an unbounded dump" discipline, applied here to chart facts rather than Memory). */
export const NATAL_CHART_INTERPRETATION_MAX_ASPECTS = 8;

/** Interpretation token budget by tier — larger than Numerology's (400/700) since this sprint's
 * interpretation covers ten independently-renderable sections (Phase 11), not one blended
 * narration. */
export const NATAL_CHART_INTERPRETATION_MAX_TOKENS: Record<'FREE' | 'PREMIUM', number> = {
  FREE: 900,
  PREMIUM: 1600,
};
