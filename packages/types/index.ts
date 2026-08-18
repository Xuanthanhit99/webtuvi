// Shared types between apps/web and apps/api. Keep in sync with backend DTOs.

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
}

export interface SessionDto {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
  userAgentSummary: string;
}

export type OnboardingStage =
  | 'welcome'
  | 'meet_companion'
  | 'conversation'
  | 'reflection'
  | 'discovery_choice'
  | 'activation'
  | 'success';

export type OnboardingDiscoveryChoice = 'accepted' | 'skipped' | null;

export interface OnboardingMessageDto {
  id: string;
  role: 'companion' | 'user';
  content: string;
  createdAt: string;
}

export interface OnboardingStateDto {
  stage: OnboardingStage;
  messages: OnboardingMessageDto[];
  discoveryChoice: OnboardingDiscoveryChoice;
  completedAt: string | null;
}

export type MemorySource = 'onboarding' | 'companion';

export interface MemoryNoteDto {
  id: string;
  content: string;
  source: MemorySource;
  createdAt: string;
}

export interface CompanionMessageDto {
  id: string;
  role: 'companion' | 'user';
  content: string;
  createdAt: string;
}

export interface DashboardHeroDto {
  greeting: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface DashboardCompanionPanelDto {
  previewMessages: CompanionMessageDto[];
  suggestionChip: string | null;
}

export interface DashboardMemoryHighlightDto {
  content: string;
  createdAt: string;
}

export interface DashboardDiscoverySuggestionDto {
  title: string;
  description: string;
  href: string;
  comingSoon: boolean;
}

export interface DashboardActivityItemDto {
  type:
    | 'account_created'
    | 'onboarding_completed'
    | 'preference_updated'
    | 'memory_created'
    | 'email_verified'
    | 'password_changed'
    | 'session_revoked'
    | 'logout_all';
  label: string;
  createdAt: string;
}

export interface DashboardViewModelDto {
  hero: DashboardHeroDto;
  companionPanel: DashboardCompanionPanelDto;
  memoryHighlight: DashboardMemoryHighlightDto | null;
  discoverySuggestion: DashboardDiscoverySuggestionDto | null;
  recentActivity: DashboardActivityItemDto[];
}

export type MemoryPreferenceValue = 'ASK_BEFORE_SAVING' | 'SAVE_SELECTED_ONLY' | 'DO_NOT_SAVE_YET';
export type ReflectionFrequencyValue = 'DAILY' | 'FEW_TIMES_A_WEEK' | 'WEEKLY' | 'NOT_SURE_YET';

export interface UserPreferenceDto {
  memoryPreference: MemoryPreferenceValue;
  reflectionFrequency: ReflectionFrequencyValue;
  checkInTime: string | null;
}

// --- Companion Core (Sprint 2B) — real AI conversation layer. Distinct from
// CompanionMessageDto above, which stays as the Dashboard preview's legacy
// shape (role 'companion'|'user') for backward compatibility. ---

export type ConversationStatus = 'active' | 'archived';

export interface ConversationDto {
  id: string;
  title: string | null;
  status: ConversationStatus;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ConversationMessageRole = 'system' | 'user' | 'assistant';

// --- Companion + Memory Integration (Sprint 3C). "No hidden retrieval" — every memory the
// Companion actually used carries these fields; see docs/architecture/companion-memory-integration.md. ---

export interface MemoryReferenceDto {
  memoryId: string;
  title: string;
  type: MemoryTypeValue;
  reason: string;
  retrievalType: RetrievalTypeValue;
  importance: { score: number; explanations: string[] };
  retrievalTimestamp: string;
  sourceConversationId: string | null;
  createdAt: string;
}

export interface MemorySkipReferenceDto {
  memoryId: string;
  title: string;
  type: MemoryTypeValue;
  reason: SkipReasonValue;
}

export interface MemoryExplanationDto {
  headline: string;
  reason: string;
  source: string;
  date: string;
  consent: string;
  importance: { score: number; explanations: string[] };
}

export interface MemorySkipExplanationDto {
  headline: string;
  reason: string;
}

/** The ephemeral, this-turn-only view returned by the SSE `done` event — `skipped` is never
 * persisted, so it is only ever available right after the generation that produced it. */
export interface CompanionMemoryUsageDto {
  used: (MemoryReferenceDto & { explanation: MemoryExplanationDto })[];
  skipped: (MemorySkipReferenceDto & { explanation: MemorySkipExplanationDto })[];
}

export interface ConversationMessageDto {
  id: string;
  role: ConversationMessageRole;
  content: string;
  createdAt: string;
  /** Persisted, structural-only — present on reload for any message that used memory, `null`
   * otherwise (including every message from before this sprint). */
  memoryUsed: MemoryReferenceDto[] | null;
}

export interface ConversationDetailDto {
  conversation: ConversationDto;
  messages: ConversationMessageDto[];
}

export interface MemorySuggestionDto {
  type: MemoryTypeValue;
  title: string;
  summary: string;
  reason: string;
}

export type ForgetIntentKindValue = 'FORGET_RECENT' | 'NEVER_REMEMBER_TYPE' | 'DELETE_ABOUT';

export interface ForgetCandidateDto {
  memoryId: string;
  title: string;
  summary: string;
  type: MemoryTypeValue;
}

export interface ForgetSuggestionDto {
  kind: ForgetIntentKindValue;
  message: string;
  candidates: ForgetCandidateDto[];
  type: MemoryTypeValue | null;
}

export interface SendConversationMessageResultDto {
  userMessage: ConversationMessageDto;
  assistantMessage: ConversationMessageDto | null;
  requiresGeneration: boolean;
  memorySuggestion: MemorySuggestionDto | null;
  forgetSuggestion: ForgetSuggestionDto | null;
  /** Sprint 4A, Phase 8 — see JournalSuggestionDto below. */
  journalSuggestion: JournalSuggestionDto | null;
}

// --- Memory Foundation (Sprint 3A). Structural trust layer only — no
// embeddings/RAG/semantic search/intelligence here. Distinct from the legacy
// MemoryNoteDto above (Sprint 1's Dashboard highlight source, unchanged). ---

export type MemoryTypeValue =
  | 'IDENTITY'
  | 'PREFERENCE'
  | 'GOAL'
  | 'RELATIONSHIP'
  | 'HABIT'
  | 'ROUTINE'
  | 'ACHIEVEMENT'
  | 'CHALLENGE'
  | 'EMOTION'
  | 'IMPORTANT_EVENT'
  | 'DECISION'
  | 'INTEREST'
  | 'WORK'
  | 'STUDY'
  | 'PET'
  | 'LOCATION_PREFERENCE'
  | 'HEALTH'
  | 'CUSTOM';

export type MemoryStatusValue = 'CANDIDATE' | 'PENDING_CONSENT' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED' | 'EXPIRED' | 'DELETED';

export type MemoryConsentModeValue = 'ASK_EVERY_TIME' | 'ALLOW_SELECTED' | 'ALLOW_TYPE' | 'DENY_TYPE' | 'DISABLED';

export type MemoryVisibilityValue = 'PRIVATE' | 'COMPANION_ALLOWED';

export type MemorySourceTypeValue = 'ONBOARDING' | 'COMPANION' | 'USER_EXPLICIT' | 'MIGRATED_LEGACY' | 'SYSTEM_TEST';

export type MemoryCandidateStatusValue = 'CANDIDATE' | 'PENDING_CONSENT' | 'ACCEPTED' | 'REJECTED';

export interface MemoryDto {
  id: string;
  type: MemoryTypeValue;
  title: string;
  summary: string;
  structuredPayload: Record<string, unknown> | null;
  status: MemoryStatusValue;
  consentState: MemoryConsentModeValue;
  visibility: MemoryVisibilityValue;
  sourceType: MemorySourceTypeValue;
  sourceConversationId: string | null;
  sourceMessageId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  /** Sprint 3B — deterministic 0-100 score; always render alongside importanceExplanations,
   * never as a bare number (Product Bible "always explain"). */
  importanceScore: number;
  importanceExplanations: string[];
  pinned: boolean;
}

export interface MemoryTimelineItemDto extends MemoryDto {
  group: 'today' | 'this_week' | 'earlier';
  sourceAvailable: boolean;
  whyThisMemory: string;
  consentExplanation: string;
}

export interface MemoryListResultDto {
  items: MemoryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MemoryTimelineResultDto {
  items: MemoryTimelineItemDto[];
  nextCursor: string | null;
}

export interface MemoryVersionDto {
  version: number;
  title: string;
  summary: string;
  visibility: MemoryVisibilityValue;
  changeReason: string;
  createdAt: string;
}

export interface MemoryAuditEntryDto {
  id: string;
  memoryId: string | null;
  action: string;
  actorType: string;
  createdAt: string;
}

export interface MemoryCandidateDto {
  id: string;
  proposedType: MemoryTypeValue;
  proposedTitle: string;
  proposedSummary: string;
  sourceConversationId: string | null;
  sourceMessageId: string | null;
  reason: string | null;
  status: MemoryCandidateStatusValue;
  resultingMemoryId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface MemoryConsentSummaryDto {
  globalMode: MemoryConsentModeValue;
  typeOverrides: { type: MemoryTypeValue; mode: MemoryConsentModeValue }[];
}

export interface MemoryExportResultDto {
  exportedAt: string;
  memories: MemoryDto[];
  versions: { memoryId: string; version: number; title: string; summary: string; visibility: string; changeReason: string; createdAt: string }[];
  consent: MemoryConsentSummaryDto;
  activityHistory: { memoryId: string | null; action: string; createdAt: string }[];
}

// ---------------------------------------------------------------------------
// Sprint 10 — Account Data Rights (export/deletion). See
// docs/architecture/account-data-rights.md. `AccountExportResultDto`'s section shapes are
// deliberately loose (`Record<string, unknown>`/`unknown[]`) — the frontend only ever offers this
// as a downloadable JSON file, it never renders individual fields, so a tight per-field type here
// would be maintenance overhead with no real consumer.
// ---------------------------------------------------------------------------

export interface AccountExportResultDto {
  exportVersion: number;
  generatedAt: string;
  account: { id: string; email: string; displayName: string; createdAt: string; emailVerifiedAt: string | null };
  preferences: unknown;
  onboarding: unknown;
  companion: { onboardingMessages: unknown[]; conversations: unknown[] };
  memory: { memories: unknown[]; versions: unknown[]; consent: unknown; activityHistory: unknown[]; legacyNotes: unknown[] };
  journal: unknown[];
  reflections: unknown[];
  insights: unknown[];
  reviews: unknown[];
  goals: unknown[];
  discoveries: { tarot: unknown[]; numerology: unknown[]; natalChart: unknown[] };
  premium: { entitlements: unknown[]; paymentOrders: unknown[] };
  /** Sprint 11 — content fields only, no delivery/operational metadata. */
  notifications: { items: unknown[]; preferences: unknown };
  activity: unknown[];
}

export interface AccountExportJobDto {
  jobId: string;
  status: 'completed';
  result: AccountExportResultDto;
}

export interface MemoryExportJobDto {
  jobId: string;
  status: 'completed';
  result: MemoryExportResultDto;
}

// --- Memory Intelligence (Sprint 3B). Deterministic decision layer on top of Memory
// Foundation — importance scoring, duplicate/conflict detection, merge suggestions, retrieval
// policy, ranking, context budgeting. Still no embeddings/RAG/semantic search/LLM decisions —
// see docs/architecture/memory-intelligence.md. ---

export type MemoryDuplicateMatchTypeValue = 'EXACT' | 'NORMALIZED' | 'STRUCTURED' | 'TYPE_SPECIFIC';

export type MemoryDuplicateStatusValue = 'PENDING' | 'DISMISSED' | 'MERGED';

export type MemoryConflictStatusValue = 'CONFLICT' | 'SUPERSEDED';

export type MemoryMergeSuggestionStatusValue = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface MemoryDuplicatePairDto {
  id: string;
  memoryAId: string;
  memoryBId: string;
  matchType: MemoryDuplicateMatchTypeValue;
  similarity: number;
  reason: string;
  status: MemoryDuplicateStatusValue;
  detectedAt: string;
}

export interface MemoryConflictDto {
  id: string;
  memoryAId: string;
  memoryBId: string;
  status: MemoryConflictStatusValue;
  reason: string;
  detectedAt: string;
}

export interface MergeSuggestionDto {
  id: string;
  primaryMemoryId: string;
  primaryTitle: string;
  duplicateMemoryId: string;
  duplicateTitle: string;
  confidence: number;
  reason: string;
  status: MemoryMergeSuggestionStatusValue;
  createdAt: string;
}

/** How a memory came to be included — a plain, inspectable fact (Sprint 3C). */
export type RetrievalTypeValue = 'PINNED' | 'CONTEXT_MATCH' | 'IMPORTANCE_RANKED';

export type SkipReasonValue = 'consent_denied' | 'over_budget' | 'limit_reached';

export interface RecommendedMemoryDto {
  id: string;
  type: MemoryTypeValue;
  title: string;
  summary: string;
  pinned: boolean;
  importanceScore: number;
  /** Plain-language reasons behind the score — always shown alongside it, never the raw
   * number alone (Product Bible "always explain," applied to Sprint 3B's scoring). */
  importanceExplanations: string[];
  whyRecommended: string;
  /** Sprint 3C (Companion integration) — "no hidden retrieval": every reference carries these. */
  retrievalType: RetrievalTypeValue;
  retrievalTimestamp: string;
  sourceConversationId: string | null;
  createdAt: string;
}

export interface SkippedMemoryDto {
  id: string;
  type: MemoryTypeValue;
  title: string;
  reason: SkipReasonValue;
}

export interface ContextBudgetDto {
  totalWindowTokens: number;
  reservedOutputTokens: number;
  systemPromptTokens: number;
  conversationTokens: number;
  userInputTokens: number;
  memoryTokens: number;
}

export interface RetrievalResultDto {
  items: RecommendedMemoryDto[];
  /** Sprint 3C explainability (Phase 8) — found but not surfaced, and why. */
  skipped: SkippedMemoryDto[];
  candidateCount: number;
  budget: ContextBudgetDto;
  tokenUsed: number;
}

// --- Journal Foundation (Sprint 4A). A first-class, user-authored writing space — no
// AI-generated content, no automatic summarization, no mood analytics, no embeddings/semantic
// search anywhere here. See docs/architecture/journal-foundation.md. ---

export type JournalStateValue = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
export type JournalVisibilityValue = 'PRIVATE' | 'SHARED';
export type JournalMoodValue = 'GREAT' | 'GOOD' | 'OKAY' | 'LOW' | 'DIFFICULT';
export type JournalSourceTypeValue = 'USER' | 'COMPANION_SUGGESTED';

export interface JournalEntryDto {
  id: string;
  title: string;
  content: string;
  state: JournalStateValue;
  visibility: JournalVisibilityValue;
  mood: JournalMoodValue | null;
  tags: string[];
  pinned: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  version: number;
  sourceType: JournalSourceTypeValue;
  sourceConversationId: string | null;
  sourceMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface JournalRevisionDto {
  version: number;
  title: string;
  content: string;
  mood: JournalMoodValue | null;
  tags: string[];
  changeReason: string;
  createdAt: string;
}

export interface ListJournalResultDto {
  items: JournalEntryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JournalTimelineItemDto extends JournalEntryDto {
  groupKey: string;
  groupLabel: string;
}

export interface JournalTimelineResultDto {
  items: JournalTimelineItemDto[];
  nextCursor: string | null;
}

export interface JournalAutosaveResultDto {
  entry: JournalEntryDto;
  savedAt: string;
}

export interface JournalMarkdownExportDto {
  filename: string;
  content: string;
}

export interface JournalAccountExportResultDto {
  exportedAt: string;
  entries: JournalEntryDto[];
}

export interface JournalAccountExportJobDto {
  jobId: string;
  status: 'completed';
  result: JournalAccountExportResultDto;
}

/** Sprint 4A, Phase 8 — Companion "This might be worth saving as a journal entry" suggestion.
 * Never contains generated content: `excerpt` is a truncated slice of the user's own real
 * message, nothing synthesized. */
export interface JournalSuggestionDto {
  excerpt: string;
  reason: string;
}

// --- Reflection Foundation (Sprint 4B). Deterministic Reflection Candidates built from existing
// user-owned data (Journal, Memory, Activity, Companion). No AI-generated reflections, no
// summaries/coaching, no reports, no mood/habit prediction, no embeddings/semantic search
// anywhere here. See docs/architecture/reflection-foundation.md. ---

export type ReflectionCategoryValue = 'GOAL' | 'TOPIC' | 'JOURNAL' | 'WELLBEING' | 'ALIGNMENT' | 'MISMATCH' | 'INACTIVITY';

export type ReflectionTriggerValue =
  | 'REPEATED_TOPIC'
  | 'REPEATED_GOAL'
  | 'LONG_INACTIVITY'
  | 'GOAL_REGRESSION'
  | 'POSITIVE_STREAK'
  | 'NEGATIVE_STREAK'
  | 'REPEATED_JOURNAL_THEME'
  | 'MEMORY_JOURNAL_ALIGNMENT'
  | 'GOAL_ACTIVITY_MISMATCH';

export type ReflectionStateValue = 'NEW' | 'READY' | 'DISMISSED' | 'ARCHIVED' | 'EXPIRED';
export type ReflectionWindowValue = 'DAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
export type ReflectionVisibilityValue = 'PRIVATE' | 'COMPANION_VISIBLE';
export type ReflectionSourceTypeValue = 'JOURNAL' | 'MEMORY' | 'ACTIVITY' | 'COMPANION';
export type ReflectionSortValue = 'score' | 'recency' | 'category';
export type ReflectionTimelineBucketValue = 'today' | 'this_week' | 'last_week' | 'last_month' | 'earlier';

export interface ReflectionSourceDto {
  sourceType: ReflectionSourceTypeValue;
  sourceId: string;
  sourceTimestamp: string;
}

export interface ReflectionCandidateDto {
  id: string;
  category: ReflectionCategoryValue;
  trigger: ReflectionTriggerValue;
  state: ReflectionStateValue;
  window: ReflectionWindowValue;
  windowStart: string;
  windowEnd: string;
  reason: string;
  score: number;
  scoreExplanation: string[];
  groupKey: string;
  visibility: ReflectionVisibilityValue;
  pinned: boolean;
  sources: ReflectionSourceDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  expiredAt: string | null;
}

export interface ListReflectionsResultDto {
  items: ReflectionCandidateDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReflectionTimelineItemDto extends ReflectionCandidateDto {
  bucket: ReflectionTimelineBucketValue;
}

export interface ReflectionTimelineResultDto {
  items: ReflectionTimelineItemDto[];
}

export interface ReflectionGroupDto {
  groupKey: string;
  category: ReflectionCategoryValue;
  trigger: ReflectionTriggerValue;
  count: number;
  averageScore: number;
  topScore: number;
  latest: ReflectionCandidateDto;
}

export interface ReflectionStatisticsDto {
  total: number;
  byState: Record<ReflectionStateValue, number>;
  byCategory: Partial<Record<ReflectionCategoryValue, number>>;
  byTrigger: Partial<Record<ReflectionTriggerValue, number>>;
  dismissalRate: number;
  archiveRate: number;
}

/** Sprint 4B, Phase 10 — Companion's one read-only Reflection surface: whether a READY,
 * Companion-visible candidate currently exists. Never the candidate's content. */
export interface ReflectionHintDto {
  available: boolean;
  reflectionId: string | null;
  category: ReflectionCategoryValue | null;
}

// --- Insight Preparation Engine (Sprint 4C). Prepares deterministic Insight Candidates from
// existing Reflection Candidates — structured evidence for a future Sprint 5, never a user-facing
// insight itself. No LLM-generated insights, no AI summaries/coaching, no reports, no
// recommendations, no embeddings/semantic search anywhere here. See
// docs/architecture/insight-preparation.md. ---

export type InsightCategoryValue = 'GOAL' | 'TOPIC' | 'JOURNAL' | 'WELLBEING' | 'ALIGNMENT' | 'MISMATCH' | 'INACTIVITY';
export type InsightStatusValue = 'NOT_READY' | 'READY' | 'INSUFFICIENT_EVIDENCE' | 'ARCHIVED';
export type InsightWindowValue = 'DAY' | 'WEEK' | 'MONTH' | 'CUSTOM';
export type InsightRelationshipTypeValue = 'SUPPORTS' | 'CONTRADICTS' | 'CONTINUES' | 'REPEATS' | 'IMPROVES' | 'REGRESSES' | 'STAGNATES';

export interface InsightEvidenceDto {
  reflectionCandidateId: string;
  contribution: string;
  reflectionCategory: ReflectionCategoryValue;
  reflectionTrigger: ReflectionTriggerValue;
  reflectionScore: number;
  reflectionState: ReflectionStateValue;
}

export interface InsightRelationshipDto {
  id: string;
  reflectionAId: string;
  reflectionBId: string;
  type: InsightRelationshipTypeValue;
  reason: string;
}

export interface InsightCandidateDto {
  id: string;
  category: InsightCategoryValue;
  status: InsightStatusValue;
  window: InsightWindowValue;
  windowStart: string;
  windowEnd: string;
  ruleExplanation: string;
  priority: number;
  priorityExplanation: string[];
  evidence: InsightEvidenceDto[];
  relationships: InsightRelationshipDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ListInsightsResultDto {
  items: InsightCandidateDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InsightStatisticsDto {
  total: number;
  byStatus: Record<InsightStatusValue, number>;
  byCategory: Partial<Record<InsightCategoryValue, number>>;
  averagePriority: number;
  readyCount: number;
}

// --- Insight Experience (Sprint 5A). Presentation layer over existing InsightCandidate rows —
// no new insight generation, no AI summaries/coaching/reports. See
// docs/architecture/insight-experience.md. ---

export type InsightPriorityTierValue = 'LOW' | 'MEDIUM' | 'HIGH';

export interface InsightPriorityBadgeDto {
  tier: InsightPriorityTierValue;
  label: string;
  priority: number;
}

export interface InsightReasonDto {
  headline: string;
  whyItMatters: string[];
  evidenceSummary: string;
}

export interface InsightCategoryPresentationDto {
  value: InsightCategoryValue;
  label: string;
}

export interface InsightStatusPresentationDto {
  value: InsightStatusValue;
  label: string;
}

export interface InsightCardDto {
  id: string;
  category: InsightCategoryPresentationDto;
  status: InsightStatusPresentationDto;
  window: InsightWindowValue;
  windowStart: string;
  windowEnd: string;
  reason: InsightReasonDto;
  priorityBadge: InsightPriorityBadgeDto;
  evidenceCount: number;
  relationshipCount: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ListInsightCardsResultDto {
  items: InsightCardDto[];
  total: number;
  page: number;
  pageSize: number;
}

export type InsightTimelineRangeValue = 'today' | 'week' | 'month' | 'custom';
export type InsightTimelineGroupByValue = 'category' | 'priority' | 'topic';

export interface InsightTimelineCardDto extends InsightCardDto {
  day: string;
}

export interface InsightTimelineGroupDto {
  key: string;
  label: string;
  items: InsightTimelineCardDto[];
}

export interface InsightTimelineResultDto {
  range: InsightTimelineRangeValue;
  from: string;
  to: string;
  groupBy: InsightTimelineGroupByValue;
  groups: InsightTimelineGroupDto[];
}

export interface InsightEvidenceSourceItemDto {
  sourceType: ReflectionSourceTypeValue;
  sourceTypeLabel: string;
  sourceId: string;
  sourceTimestamp: string;
  href: string | null;
  available: boolean;
}

export interface InsightEvidenceCardDto {
  reflectionCandidateId: string;
  reflectionCategory: ReflectionCategoryValue;
  reflectionScore: number;
  reflectionState: ReflectionStateValue;
  contribution: string;
  href: string;
  sources: InsightEvidenceSourceItemDto[];
}

// --- Weekly & Monthly Reviews (Sprint 5B). Deterministically aggregates existing
// InsightCandidate/ReflectionCandidate rows (plus real Journal/Memory/Activity/Companion counts
// for statistics) over a time window. Generates no new InsightCandidate/ReflectionCandidate rows.
// No LLM, no coaching, no recommendations, no generated advice. See
// docs/architecture/review-engine.md. ---

export type ReviewWindowValue = 'WEEK' | 'MONTH' | 'CUSTOM';
export type ReviewStateValue = 'NOT_READY' | 'READY' | 'ARCHIVED';
export type ReviewSectionTypeValue = 'HIGHLIGHTS' | 'CHANGES' | 'ACHIEVEMENTS' | 'CHALLENGES';
export type ReviewEvidenceSourceTypeValue = 'INSIGHT' | 'REFLECTION' | 'JOURNAL' | 'MEMORY';

export interface ReviewStatisticsDto {
  journalCount: number;
  memoryCreatedCount: number;
  reflectionCount: number;
  insightCount: number;
  activityCount: number;
  /** Disclosed substitution for "Study streak" — see docs/architecture/review-engine.md. */
  journalingStreakDays: number;
  /** Disclosed substitution for "Completed sessions" — see docs/architecture/review-engine.md. */
  companionConversationCount: number;
}

export interface ReviewEvidenceDto {
  sourceType: ReviewEvidenceSourceTypeValue;
  sourceId: string;
  category: string;
  priority: number;
  sourceTimestamp: string;
  contribution: string;
  href: string;
}

export interface ReviewSectionDto {
  type: ReviewSectionTypeValue;
  title: string;
  summary: string;
  evidence: ReviewEvidenceDto[];
}

export interface ReviewSummaryDto {
  id: string;
  window: ReviewWindowValue;
  windowStart: string;
  windowEnd: string;
  state: ReviewStateValue;
  overview: string;
  statistics: ReviewStatisticsDto;
  sections: ReviewSectionDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ListReviewsResultDto {
  items: ReviewSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReviewMarkdownExportDto {
  filename: string;
  content: string;
}

// --- Goal System & Progress Engine (Sprint 5C). First-class, deterministic learning/life goals:
// CRUD, milestones, a deterministic progress engine, and real evidence citing Memory/Journal/
// Reflection/Insight/Review rows. No LLM, no coaching, no recommendations, no embeddings, no
// semantic search. See docs/architecture/goal-system.md. ---

export type GoalCategoryValue = 'LEARNING' | 'CAREER' | 'HEALTH' | 'HABIT' | 'RELATIONSHIP' | 'FINANCIAL' | 'CREATIVE' | 'PERSONAL' | 'OTHER';
export type GoalTypeValue = 'MILESTONE_BASED' | 'METRIC_BASED' | 'BINARY';
export type GoalDifficultyValue = 'EASY' | 'MEDIUM' | 'HARD';
export type GoalStatusValue = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' | 'ARCHIVED' | 'DELETED';
export type GoalVisibilityValue = 'PRIVATE' | 'COMPANION_VISIBLE';
export type GoalMilestoneTypeValue = 'AUTOMATIC' | 'MANUAL';
export type GoalMilestoneStatusValue = 'PENDING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
export type GoalTrendValue = 'NEW' | 'IMPROVING' | 'STABLE' | 'DECLINING';
export type GoalEvidenceSourceTypeValue = 'JOURNAL' | 'MEMORY' | 'REFLECTION' | 'INSIGHT' | 'REVIEW' | 'ACTIVITY';
export type GoalHistoryActionValue =
  | 'CREATED'
  | 'UPDATED'
  | 'PAUSED'
  | 'RESUMED'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'ARCHIVED'
  | 'RESTORED'
  | 'DELETED'
  | 'MILESTONE_COMPLETED'
  | 'MILESTONE_FAILED';
export type GoalRelationshipTypeValue = 'PARENT_CHILD' | 'RELATED';

export interface GoalEvidenceDto {
  sourceType: GoalEvidenceSourceTypeValue;
  sourceId: string;
  sourceTimestamp: string;
  contribution: string;
  href: string;
}

export interface GoalProgressFactorsDto {
  formula: 'MILESTONE_BASED' | 'METRIC_BASED' | 'BINARY';
  evidenceCount: number;
  milestonesTotal: number;
  milestonesCompleted: number;
  targetValue: number | null;
  currentValue: number | null;
}

export interface GoalProgressDto {
  completionPercent: number;
  milestoneCompletionPercent: number;
  trend: GoalTrendValue;
  factors: GoalProgressFactorsDto;
  previousCompletionPercent: number | null;
  computedAt: string;
  evidence: GoalEvidenceDto[];
}

export interface GoalMilestoneDto {
  id: string;
  title: string;
  description: string;
  type: GoalMilestoneTypeValue;
  status: GoalMilestoneStatusValue;
  order: number;
  targetCount: number | null;
  dueDate: string | null;
  completedAt: string | null;
  failedAt: string | null;
}

export interface GoalHistoryDto {
  id: string;
  action: GoalHistoryActionValue;
  detail: string;
  createdAt: string;
}

export interface GoalRelationshipDto {
  id: string;
  type: GoalRelationshipTypeValue;
  goalId: string;
  goalTitle: string;
  direction: 'A' | 'B';
}

export interface GoalSummaryDto {
  id: string;
  title: string;
  description: string;
  category: GoalCategoryValue;
  type: GoalTypeValue;
  difficulty: GoalDifficultyValue;
  status: GoalStatusValue;
  visibility: GoalVisibilityValue;
  linkedTag: string;
  targetValue: number | null;
  targetUnit: string | null;
  targetDate: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  progress: GoalProgressDto | null;
  milestones: GoalMilestoneDto[];
}

export interface ListGoalsResultDto {
  items: GoalSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Tarot Discovery Foundation (Sprint 6). The Product Bible's first real Discovery system
// (Module 12) — a deterministic, seeded 78-card draw engine with real traditional card meanings,
// plus a narrow AI interpretation layer that only ever narrates an already-real, already-drawn
// result. No AI-chosen or AI-generated cards. See docs/architecture/tarot-discovery.md. ---

export type TarotArcanaValue = 'MAJOR' | 'MINOR';
export type TarotSuitValue = 'WANDS' | 'CUPS' | 'SWORDS' | 'PENTACLES';
export type TarotReadingTypeValue = 'DAILY_DRAW' | 'SINGLE_CARD' | 'THREE_CARD';
export type TarotReadingStatusValue = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type TarotReadingVisibilityValue = 'PRIVATE' | 'COMPANION_VISIBLE';
export type TarotReadingHistoryActionValue = 'CREATED' | 'VIEWED' | 'INTERPRETED' | 'ARCHIVED' | 'RESTORED' | 'DELETED';

export interface TarotCardDto {
  id: string;
  slug: string;
  name: string;
  arcana: TarotArcanaValue;
  suit: TarotSuitValue | null;
  number: number;
  uprightKeywords: string[];
  uprightMeaning: string;
  reversedKeywords: string[];
  reversedMeaning: string;
  element: string | null;
  astrological: string | null;
  categories: string[];
  imageSlug: string;
}

export interface TarotReadingCardDto {
  position: number;
  positionLabel: string | null;
  isReversed: boolean;
  card: TarotCardDto;
}

export interface TarotReadingDto {
  id: string;
  type: TarotReadingTypeValue;
  status: TarotReadingStatusValue;
  visibility: TarotReadingVisibilityValue;
  spreadSlug: string;
  spreadName: string;
  question: string | null;
  interpretation: string | null;
  cards: TarotReadingCardDto[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface TarotReadingHistoryDto {
  id: string;
  action: TarotReadingHistoryActionValue;
  detail: string;
  createdAt: string;
}

export interface ListReadingsResultDto {
  items: TarotReadingDto[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Premium & Payment Foundation (Sprint 7). One paid product (PREMIUM_30D, a 30-day pass, not
// an auto-renewing subscription), one provider (PayOS). Premium access is always backend-decided —
// these DTOs are read-only projections of server state; the client never sends a price, product,
// or success flag that the backend trusts. See docs/architecture/premium-entitlements.md and
// docs/architecture/payment-foundation.md. ---

export type PaymentOrderStatusValue = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
export type PaymentProductValue = 'PREMIUM_30D';
export type PremiumEntitlementStatusValue = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'NONE';

export interface PaymentOrderDto {
  id: string;
  status: PaymentOrderStatusValue;
  product: PaymentProductValue;
  amount: number;
  currency: string;
  checkoutUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface PremiumStatusDto {
  isPremium: boolean;
  status: PremiumEntitlementStatusValue;
  expiresAt: string | null;
  /** The current 30-day Premium pass price, so the price shown before checkout always matches
   * what checkout actually charges — never hardcode this in the frontend. */
  priceVnd: number;
  currency: string;
  /** True until Product has signed off on a validated production price — see
   * docs/architecture/premium-entitlements.md. The frontend must disclose this when true. */
  isMvpTestPrice: boolean;
  /** Sprint 12 — mirrors the backend `PAYMENTS_ENABLED` kill switch (PaymentCheckoutService
   * already rejects checkout with `PAYMENTS_DISABLED` when false; this field lets the frontend
   * show that honestly *before* the user clicks "Upgrade", not just as an error after the fact).
   * Backend remains authoritative — this is a display hint only, never itself a security
   * boundary. See docs/progress/payos-production-readiness.md "Payment kill switch". */
  paymentsEnabled: boolean;
}

// --- Numerology Discovery Foundation (Sprint 8). The Product Bible's second real Discovery
// system (Module 15) — a deterministic, versioned, standard-Pythagorean numerology engine, plus a
// narrow AI interpretation layer that only ever narrates an already-real, already-calculated
// result. No AI-calculated or AI-invented core numbers. See
// docs/architecture/numerology-discovery.md. ---

export type NumerologyReadingStatusValue = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type NumerologyReadingVisibilityValue = 'PRIVATE' | 'COMPANION_VISIBLE';
export type NumerologyReadingHistoryActionValue = 'CREATED' | 'VIEWED' | 'INTERPRETED' | 'ARCHIVED' | 'RESTORED' | 'DELETED';
export type NumerologyValueTypeValue = 'LIFE_PATH' | 'EXPRESSION' | 'SOUL_URGE' | 'PERSONALITY' | 'BIRTHDAY' | 'PERSONAL_YEAR';

export interface NumerologyReductionStepDto {
  from: number;
  digits: number[];
  to: number;
}

export interface NumerologyReductionResultDto {
  value: number;
  isMasterNumber: boolean;
  steps: NumerologyReductionStepDto[];
}

export interface NumerologyDateComponentReductionDto {
  component: 'MONTH' | 'DAY' | 'YEAR';
  input: number;
  reduction: NumerologyReductionResultDto;
}

/** `breakdown` shape for LIFE_PATH and PERSONAL_YEAR. */
export interface NumerologyDateBasedBreakdownDto {
  normalizedDate: string;
  components: NumerologyDateComponentReductionDto[];
  total: number;
  finalReduction: NumerologyReductionResultDto;
}

/** `breakdown` shape for EXPRESSION, SOUL_URGE, PERSONALITY. */
export interface NumerologyNameBasedBreakdownDto {
  normalizedName: string;
  letters: { char: string; value: number }[];
  sum: number;
  reduction: NumerologyReductionResultDto;
}

/** `breakdown` shape for BIRTHDAY. */
export type NumerologyBirthdayBreakdownDto = NumerologyDateComponentReductionDto;

export interface NumerologyValueDto {
  type: NumerologyValueTypeValue;
  value: number;
  isMasterNumber: boolean;
  breakdown: NumerologyDateBasedBreakdownDto | NumerologyNameBasedBreakdownDto | NumerologyBirthdayBreakdownDto;
  /** Only set for PERSONAL_YEAR. */
  appliesToYear: number | null;
  order: number;
}

export interface NumerologyReadingDto {
  id: string;
  status: NumerologyReadingStatusValue;
  visibility: NumerologyReadingVisibilityValue;
  birthNameInput: string;
  normalizedBirthName: string;
  /** `YYYY-MM-DD`. */
  birthDate: string;
  calculationVersion: string;
  normalizationVersion: string;
  interpretation: string | null;
  values: NumerologyValueDto[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface NumerologyReadingHistoryDto {
  id: string;
  action: NumerologyReadingHistoryActionValue;
  detail: string;
  createdAt: string;
}

export interface ListNumerologyReadingsResultDto {
  items: NumerologyReadingDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NumerologyMeaningDto {
  type: NumerologyValueTypeValue;
  value: number;
  isMasterNumber: boolean;
  title: string;
  framing: string;
  meaning: string;
}

// --- Eastern Horoscope Discovery Foundation (Sprint 17). The Product Bible's Chinese Zodiac /
// Five Elements Discovery module (Module 14) — deterministic, versioned lunisolar-calendar +
// Stem/Branch/Element engine, plus a narrow AI interpretation layer that only ever narrates an
// already-real, already-calculated result. Independent of, and never conflated with, Vietnamese
// Tử Vi Đẩu Số (a separate, later track). Domain rules locked in
// docs/domain/eastern-horoscope-rules.md (Sprint 17 Domain Decision Closure):
// EASTERN_HOROSCOPE_YEAR_BOUNDARY = LUNAR_NEW_YEAR, EASTERN_HOROSCOPE_ELEMENT_SYSTEM =
// HEAVENLY_STEM_ELEMENT. ---

export type EasternHoroscopeProfileStatusValue = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type EasternHoroscopeProfileHistoryActionValue = 'CREATED' | 'VIEWED' | 'INTERPRETED' | 'ARCHIVED' | 'RESTORED' | 'DELETED';
export type HeavenlyStemValue = 'Giáp' | 'Ất' | 'Bính' | 'Đinh' | 'Mậu' | 'Kỷ' | 'Canh' | 'Tân' | 'Nhâm' | 'Quý';
export type EarthlyBranchValue = 'Tý' | 'Sửu' | 'Dần' | 'Mão' | 'Thìn' | 'Tỵ' | 'Ngọ' | 'Mùi' | 'Thân' | 'Dậu' | 'Tuất' | 'Hợi';
export type FiveElementValue = 'Mộc' | 'Hỏa' | 'Thổ' | 'Kim' | 'Thủy';
export type YinYangValue = 'Dương' | 'Âm';
export type YearEnergyRelationshipValue = 'GENERATES' | 'IS_GENERATED_BY' | 'CONTROLS' | 'IS_CONTROLLED_BY' | 'SAME';

export interface EasternHoroscopeYearEnergyDto {
  calendarYear: number;
  yearStem: HeavenlyStemValue;
  yearBranch: EarthlyBranchValue;
  yearElement: FiveElementValue;
  yearYinYang: YinYangValue;
  yearZodiacAnimal: { vi: string; en: string };
  relationship: YearEnergyRelationshipValue;
}

export interface EasternHoroscopeProfileDto {
  id: string;
  status: EasternHoroscopeProfileStatusValue;
  /** `YYYY-MM-DD`. */
  birthDate: string;
  engineVersion: string;
  calendarVersion: string;
  rulesetVersion: string;
  stem: HeavenlyStemValue;
  branch: EarthlyBranchValue;
  element: FiveElementValue;
  yinYang: YinYangValue;
  zodiacAnimal: { vi: string; en: string };
  /** Recomputed fresh on every read — never persisted, since it changes every calendar year. */
  yearEnergy: EasternHoroscopeYearEnergyDto;
  interpretation: string | null;
  interpretationYear: number | null;
  /** True once the current calendar year has moved past `interpretationYear` — the UI should offer
   * regeneration rather than silently show a stale interpretation as current. */
  interpretationStale: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface EasternHoroscopeProfileHistoryDto {
  id: string;
  action: EasternHoroscopeProfileHistoryActionValue;
  detail: string;
  createdAt: string;
}

export interface ListEasternHoroscopeProfilesResultDto {
  items: EasternHoroscopeProfileDto[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Natal Chart Discovery Foundation (Sprint 9). The Product Bible's third real Discovery
// system (Module 13) — a deterministic, ephemeris-based birth chart, persisted once, explored
// through a chart wheel and progressive-disclosure sections, narrated (never calculated) by AI.
// See docs/architecture/natal-chart-discovery.md. ---

export type NatalChartStatusValue = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type NatalChartVisibilityValue = 'PRIVATE' | 'COMPANION_VISIBLE';
export type NatalChartHistoryActionValue = 'CREATED' | 'VIEWED' | 'INTERPRETED' | 'ARCHIVED' | 'RESTORED' | 'DELETED';

export type NatalChartPlanetValue = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';
export type NatalChartPointValue = NatalChartPlanetValue | 'ascendant' | 'midheaven';
export type NatalZodiacSignValue =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';
export type NatalAspectTypeValue = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export interface NatalPlacementDto {
  body: NatalChartPlanetValue;
  /** Absolute ecliptic longitude, 0-360°. */
  longitude: number;
  sign: NatalZodiacSignValue;
  degreeInSign: number;
  /** 1-12, null when `housesAvailable` is false. */
  house: number | null;
  retrograde: boolean;
  /** Fixed traditional meaning, composed from planet+sign(+house) — never AI-generated. */
  meaning: string;
}

export interface NatalHouseDto {
  number: number;
  cuspLongitude: number;
  sign: NatalZodiacSignValue;
}

export interface NatalAspectDto {
  pointA: NatalChartPointValue;
  pointB: NatalChartPointValue;
  type: NatalAspectTypeValue;
  orb: number;
  angle: number;
  /** Fixed traditional meaning — never AI-generated. */
  meaning: string;
}

export interface NatalAngleDto {
  longitude: number;
  sign: NatalZodiacSignValue;
  degreeInSign: number;
  /** Fixed traditional meaning — never AI-generated. */
  meaning: string;
}

/** The ten fixed, independently-renderable interpretation sections (Phase 11). */
export interface NatalChartInterpretationSectionsDto {
  overview: string;
  corePersonality: string;
  emotionalWorld: string;
  communication: string;
  loveAndRelationships: string;
  motivation: string;
  careerDirection: string;
  strengths: string;
  challenges: string;
  keyAspects: string;
}

export interface NatalChartDto {
  id: string;
  status: NatalChartStatusValue;
  visibility: NatalChartVisibilityValue;
  /** `YYYY-MM-DD`. */
  birthDate: string;
  /** `HH:mm`, null when birth time is unknown. */
  birthTime: string | null;
  birthTimeKnown: boolean;
  birthPlaceLabel: string;
  timezone: string;
  zodiacMode: string;
  houseSystem: string;
  /** False when birth time is unknown, or at an extreme/polar birth latitude — houses/Ascendant/
   * Midheaven are then omitted entirely, never fabricated. */
  housesAvailable: boolean;
  calculationVersion: string;
  engineVersion: string;
  ascendant: NatalAngleDto | null;
  midheaven: NatalAngleDto | null;
  placements: NatalPlacementDto[];
  houses: NatalHouseDto[];
  aspects: NatalAspectDto[];
  /** Structured, AI-narrated sections — null until generated. */
  interpretation: NatalChartInterpretationSectionsDto | null;
  interpretedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface NatalChartHistoryDto {
  id: string;
  action: NatalChartHistoryActionValue;
  detail: string;
  createdAt: string;
}

export interface ListNatalChartsResultDto {
  items: NatalChartDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** A geocoding search result candidate — `token` is opaque and short-lived; chart creation sends
 * it back instead of raw coordinates (the server always re-resolves them itself). */
export interface GeocodingSearchResultDto {
  token: string;
  label: string;
}

// --- Personal Destiny Report (Sprint 16). Required sources: Natal Chart + Numerology. Optional:
// Tarot, Memory. See docs/product/personal-destiny-report-decisions.md — the authoritative,
// founder-locked scope this frontend implements against.

export interface ReportReadinessDto {
  ready: boolean;
  natalChart: { available: boolean; sourceId: string | null };
  numerology: { available: boolean; sourceId: string | null };
  tarot: { available: boolean; count: number };
  memory: { available: boolean };
}

export interface ReportNarrativeSectionDto {
  narrative: string;
  evidenceRefs: string[];
}

export interface ReportTitledSectionDto extends ReportNarrativeSectionDto {
  title: string;
}

/** The validated, schema-conforming AI synthesis — kept strictly separate from
 * `ReportDto['sourceSnapshot']` (calculated facts) at every layer, including here. */
export interface ReportStructuredResultDto {
  overview: string;
  coreIdentity: ReportNarrativeSectionDto;
  strengths: ReportTitledSectionDto[];
  growthAreas: ReportTitledSectionDto[];
  relationships: ReportNarrativeSectionDto;
  careerDirection: ReportNarrativeSectionDto;
  /** Null when no Tarot context was used for this report — never invented from nothing. */
  currentThemes: ReportNarrativeSectionDto | null;
  /** Null when no Memory context was used for this report — never invented from nothing. */
  personalizedReflection: ReportNarrativeSectionDto | null;
  sourceHighlights: { source: string; fact: string }[];
  methodology: string;
}

export interface ReportNatalChartSnapshotDto {
  sourceId: string;
  calculationVersion: string;
  engineVersion: string;
  ascendant: { sign: string; degreeInSign: number } | null;
  midheaven: { sign: string; degreeInSign: number } | null;
  placements: { body: string; sign: string; degreeInSign: number; house: number | null; retrograde: boolean; meaning: string }[];
  aspects: { pointA: string; pointB: string; type: string; meaning: string }[];
}

export interface ReportNumerologySnapshotDto {
  sourceId: string;
  calculationVersion: string;
  values: { type: string; value: number; isMasterNumber: boolean; meaning: string }[];
}

export interface ReportTarotSnapshotDto {
  sourceId: string;
  drawnAt: string;
  type: string;
  cards: { name: string; isReversed: boolean; positionLabel: string | null }[];
}

export interface ReportMemorySnapshotDto {
  title: string;
  summary: string;
}

/** The canonical, immutable calculated-facts snapshot a report was generated from (locked decision
 * #9 — captured once, never mutated). Rendered as the report's "Calculated Facts" section, always
 * visually distinguished from `ReportStructuredResultDto` (AI narrative). */
export interface ReportSourceSnapshotDto {
  natalChart: ReportNatalChartSnapshotDto;
  numerology: ReportNumerologySnapshotDto;
  tarot: ReportTarotSnapshotDto[] | null;
  memory: ReportMemorySnapshotDto[] | null;
}

export type DestinyReportStatusValue = 'GENERATING' | 'READY' | 'FAILED';
export type DestinyReportFailureReasonValue = 'PROVIDER_UNAVAILABLE' | 'BUDGET_EXCEEDED' | 'VALIDATION_FAILED' | 'SAFETY_REFUSED' | 'INTERNAL_ERROR';

export interface ReportSummaryDto {
  id: string;
  status: DestinyReportStatusValue;
  createdAt: string;
  completedAt: string | null;
}

export interface ReportDto extends ReportSummaryDto {
  reportSchemaVersion: string;
  reportTemplateVersion: string;
  aiPromptVersion: string;
  sourceSnapshot: ReportSourceSnapshotDto;
  result: ReportStructuredResultDto | null;
  aiProvider: string | null;
  aiModel: string | null;
  failureReason: DestinyReportFailureReasonValue | null;
}

export interface ListReportsResultDto {
  items: ReportSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Notification & Retention Foundation (Sprint 11). Product Bible Module 19, V1 tier — see
// docs/audit/sprint-11-pre-implementation-audit.md and docs/architecture/notification-retention.md.
// Deterministic, silence-by-default: no AI decides whether/when to notify. No push channel. ---

export type NotificationCategoryValue = 'SECURITY' | 'PREMIUM' | 'DISCOVERY';
export type NotificationClassValue = 'TRANSACTIONAL' | 'PRODUCT' | 'REMINDER';

export interface NotificationDto {
  id: string;
  category: NotificationCategoryValue;
  class: NotificationClassValue;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  read: boolean;
  createdAt: string;
}

export interface ListNotificationsResultDto {
  items: NotificationDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NotificationPreferencesDto {
  reminderInApp: boolean;
  reminderEmail: boolean;
}

export interface ApiErrorShape {
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta: Record<string, never>;
  requestId: string;
}

export interface ApiSuccessShape<T> {
  data: T;
  meta: Record<string, unknown>;
  requestId: string;
}

// --- Product Analytics (Sprint 13). Product Completion Roadmap V2 §3 (P0 — "Product analytics
// instrumentation"). See docs/architecture/product-analytics.md for the full architecture and
// privacy rationale. The event/property lists here are the single source of truth on both sides
// of the HTTP boundary — the backend DTO (`apps/api/src/analytics/dto`) enforces them at runtime
// via `class-validator`'s `whitelist: true, forbidNonWhitelisted: true` global pipe, so any event
// name or property outside these lists is rejected outright, not silently dropped. ---

/** Events a client is allowed to submit directly — none of these represent an authoritative
 * business outcome (a signup, a payment, a persisted reading) on their own; they mark user intent
 * or a page/view being reached. */
export type ClientAnalyticsEventName =
  | 'landing_view'
  | 'signup_started'
  | 'onboarding_started'
  | 'dashboard_viewed'
  | 'discover_viewed'
  | 'tarot_started'
  | 'tarot_interpretation_requested'
  | 'numerology_started'
  | 'numerology_interpretation_requested'
  | 'natal_started'
  | 'natal_interpretation_requested'
  | 'notification_opened'
  | 'premium_viewed'
  | 'checkout_completed'
  /** Sprint 16 — Personal Destiny Report. `report_generation_started` fires when the user clicks
   * Generate/Regenerate, mirroring `tarot_started`'s "client marks intent, server confirms the
   * resulting fact" split — see `report_generation_completed`/`report_generation_failed` below and
   * docs/product/personal-destiny-report-decisions.md. */
  | 'report_viewed'
  | 'report_generation_started'
  | 'report_upgrade_clicked'
  /** Sprint 17 — Eastern Horoscope. Fires on the Calculate button click, mirroring
   * `tarot_started`/`numerology_started` exactly. Deliberately no separate
   * `interpret_requested` event — the audit
   * (docs/audit/sprint-17-pre-implementation-audit.md §31) found no funnel question this would
   * answer beyond what `eastern_horoscope_completed` already covers. */
  | 'eastern_horoscope_started';

/** Events only the backend may emit, in-process, at the exact point the underlying fact becomes
 * true (a row was persisted, a webhook flipped an order to PAID). A client can never cause one of
 * these to fire directly — the public `/analytics/events` endpoint's DTO cannot express them. */
export type ServerAnalyticsEventName =
  | 'signup_completed'
  | 'onboarding_completed'
  | 'tarot_completed'
  | 'tarot_interpretation_completed'
  | 'numerology_completed'
  | 'numerology_interpretation_completed'
  | 'natal_completed'
  | 'natal_interpretation_completed'
  | 'checkout_started'
  | 'payment_success'
  /** Sprint 16 — fired in-process at the exact moment a `DestinyReport` row transitions to
   * READY/FAILED, matching `tarot_completed`'s pattern. Unlike the Discovery systems, Reports also
   * has a `_failed` server event — no Discovery generation currently emits one, but Reports'
   * heavier synthesis/higher stakes (docs/architecture/personal-destiny-report.md §30) makes
   * failure-rate visibility worth this small, deliberate contract extension. */
  | 'report_generation_completed'
  | 'report_generation_failed'
  /** Sprint 17 — fired in-process once a new `EasternHoroscopeProfile` row is persisted, matching
   * `numerology_completed`'s pattern. */
  | 'eastern_horoscope_completed';

export type AnalyticsEventName = ClientAnalyticsEventName | ServerAnalyticsEventName;

export type AnalyticsFeature =
  | 'auth'
  | 'onboarding'
  | 'dashboard'
  | 'discover'
  | 'tarot'
  | 'numerology'
  | 'natal_chart'
  | 'notifications'
  | 'premium'
  | 'reports'
  | 'eastern_horoscope';

/** Deliberately flat and small. No free-text field exists anywhere in this shape — every property
 * is either a bounded enum or a route pathname (query string stripped server-side). This is the
 * complete list of dimensions analytics is allowed to know about; nothing else (name, email, birth
 * data, journal/memory/companion content, tarot questions, calculated numbers or chart placements)
 * has a place to go. See docs/architecture/product-analytics.md §"Privacy model". */
export interface AnalyticsEventProperties {
  feature?: AnalyticsFeature;
  /** Pathname only (e.g. `/discover/tarot`) — no query string, no hash, no origin. */
  route?: string;
  resultStatus?: 'success' | 'failure';
  /** Free-text-shaped but bounded: where the user came from within the product, e.g.
   * `'dashboard_card' | 'nav' | 'notification'` — never referrer/UTM/marketing data. */
  source?: string;
  premiumStatus?: 'free' | 'premium';
  notificationCategory?: NotificationCategoryValue;
  spreadType?: 'daily_draw' | 'single_card' | 'three_card';
}

export interface AnalyticsEventInput {
  event: ClientAnalyticsEventName;
  /** Client-generated v4 UUID, persisted in a first-party cookie/localStorage — never derived from
   * anything identifying (no email/IP/fingerprint). See docs/architecture/product-analytics.md
   * §"Identity model". */
  anonymousId: string;
  properties?: AnalyticsEventProperties;
  /** ISO 8601, client clock — advisory only; the server's own receipt time is authoritative for
   * ordering. */
  clientTimestamp?: string;
}

export interface TrackAnalyticsEventsRequestDto {
  events: AnalyticsEventInput[];
}
