import { z } from 'zod';

/**
 * Sprint 16 — Personal Destiny Report. Canonical, immutable snapshot of source facts captured at
 * generation time (locked decision #9, docs/product/personal-destiny-report-decisions.md). Natal
 * Chart and Numerology are required (locked decision #2/#4); Tarot and Memory are optional
 * enrichment, bounded per locked decisions #5/#6. This is the *only* shape persisted into
 * `DestinyReport.sourceSnapshot` — never arbitrary UI prose, never a full raw record dump.
 */
export interface ReportNatalChartSnapshot {
  sourceId: string;
  calculationVersion: string;
  engineVersion: string;
  ascendant: { sign: string; degreeInSign: number } | null;
  midheaven: { sign: string; degreeInSign: number } | null;
  placements: { body: string; sign: string; degreeInSign: number; house: number | null; retrograde: boolean; meaning: string }[];
  aspects: { pointA: string; pointB: string; type: string; meaning: string }[];
}

export interface ReportNumerologySnapshot {
  sourceId: string;
  calculationVersion: string;
  values: { type: string; value: number; isMasterNumber: boolean; meaning: string }[];
}

/** Bounded — locked decision #5: recent context only, never the full reading history. */
export interface ReportTarotSnapshot {
  sourceId: string;
  drawnAt: string;
  type: string;
  cards: { name: string; isReversed: boolean; positionLabel: string | null }[];
}

/** Bounded — locked decision #6: personalization only, never treated as a calculated fact. */
export interface ReportMemorySnapshot {
  title: string;
  summary: string;
}

export interface ReportSourceSnapshot {
  natalChart: ReportNatalChartSnapshot;
  numerology: ReportNumerologySnapshot;
  /** Present only when Tarot history existed and was included — never an empty-array placeholder
   * pretending enrichment was attempted (locked decision #5). */
  tarot: ReportTarotSnapshot[] | null;
  memory: ReportMemorySnapshot[] | null;
}

/**
 * The validated, schema-conforming AI synthesis (locked decision #13). `evidenceRefs` on every
 * narrative field are free-text pointers back into `ReportSourceSnapshot` (e.g. "numerology:LIFE_PATH",
 * "natalChart:placement:SUN") — enforced structurally by the zod schema below, verified against the
 * actual snapshot by `assertGrounded()` before a report may ever reach `READY` (locked decision #5
 * of the architecture doc — an automated, release-blocking grounding check, not optional QA).
 */
const NarrativeSectionSchema = z.object({
  narrative: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).min(1),
});

const TitledSectionSchema = NarrativeSectionSchema.extend({
  title: z.string().min(1),
});

export const ReportStructuredResultSchema = z.object({
  overview: z.string().min(1),
  coreIdentity: NarrativeSectionSchema,
  strengths: z.array(TitledSectionSchema).min(1).max(6),
  growthAreas: z.array(TitledSectionSchema).min(1).max(6),
  relationships: NarrativeSectionSchema,
  careerDirection: NarrativeSectionSchema,
  currentThemes: NarrativeSectionSchema.nullable(),
  personalizedReflection: NarrativeSectionSchema.nullable(),
  sourceHighlights: z.array(z.object({ source: z.string().min(1), fact: z.string().min(1) })).min(1),
  methodology: z.string().min(1),
});

export type ReportStructuredResult = z.infer<typeof ReportStructuredResultSchema>;

export interface ReportReadinessDto {
  ready: boolean;
  natalChart: { available: boolean; sourceId: string | null };
  numerology: { available: boolean; sourceId: string | null };
  tarot: { available: boolean; count: number };
  memory: { available: boolean };
}

/** Bumped when `ReportSourceSnapshot`'s shape changes. */
export const REPORT_SCHEMA_VERSION = 'destiny-report-schema-v1';
/** Bumped when the locked section list (personal-destiny-report-decisions.md "Final report
 * structure") changes. */
export const REPORT_TEMPLATE_VERSION = 'destiny-report-template-v1';
/** Bumped when the system/user prompt instructions change materially. */
export const AI_PROMPT_VERSION = 'destiny-report-prompt-v1';
