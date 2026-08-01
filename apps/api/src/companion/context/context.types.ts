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
  currentTimeIso: string;
  currentTimeLabel: string;
}
