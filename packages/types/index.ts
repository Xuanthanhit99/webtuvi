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
