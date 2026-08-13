/**
 * Everything the Prompt Builder needs about "who is this and what's going on
 * right now" — explicitly NOT a Memory Engine: no embeddings, no semantic
 * retrieval, just direct reads of profile/preference/activity/recent-conversation
 * rows already in Postgres.
 */
export interface ConversationContext {
  displayName: string;
  timezone: string | null;
  locale: string | null;
  pronouns: string | null;
  onboardingCompleted: boolean;
  memoryPreference: string;
  reflectionFrequency: string;
  /** Human-readable labels of the user's most recent activity (e.g. "Onboarding completed") — no raw event metadata. */
  recentActivityLabels: string[];
  /** Short excerpts from the user's other recent conversations, oldest-first, for continuity across threads. */
  recentConversationSummaries: { title: string | null; lastMessageExcerpt: string; updatedAt: string }[];
  /** Titles of the user's own ACTIVE, COMPANION_VISIBLE goals (Sprint 5C, Phase 7) — real,
   * already-stored strings, never rewritten/summarized. Read-only: Companion never creates,
   * updates, or scores a Goal, and this is never a coaching suggestion. */
  activeGoalTitles: string[];
  /** The user's most recent ACTIVE, COMPANION_VISIBLE Tarot reading (Sprint 6, Phase 7) — real
   * card names/orientations and the real AI interpretation already generated for it, never
   * re-interpreted here. Read-only: Companion never draws, re-draws, or edits a reading. Null
   * when no such reading exists. */
  latestTarotReading: { cardNames: string[]; interpretation: string | null; createdAt: string } | null;
  /** The user's most recent ACTIVE, COMPANION_VISIBLE Numerology reading (Sprint 8, Phase 9) —
   * real, already-calculated core numbers and the real AI interpretation already generated for
   * it, never recalculated here. Read-only: Companion never calculates, recalculates, or edits a
   * reading. Null when no such reading exists. */
  latestNumerologyReading: {
    values: { type: string; value: number; isMasterNumber: boolean }[];
    interpretation: string | null;
    createdAt: string;
  } | null;
  /** The user's most recent ACTIVE, COMPANION_VISIBLE Natal Chart (Sprint 9, Phase 13) — the
   * real, already-calculated Big Three (Sun/Moon/Ascendant) and, if generated, just the
   * `overview` section of the real AI interpretation (never the full structured object — bounded,
   * same "at most one relevant summary" discipline as everything else in this context). Read-only:
   * Companion never calculates, recalculates, or edits a chart. Null when no such chart exists, or
   * when the chart's Ascendant is unavailable (unknown birth time / extreme latitude). */
  latestNatalChart: {
    sun: string;
    moon: string;
    ascendant: string | null;
    interpretationOverview: string | null;
    createdAt: string;
  } | null;
  currentTimeIso: string;
  currentTimeLabel: string;
}
