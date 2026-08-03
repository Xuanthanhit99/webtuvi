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

export interface ConversationMessageDto {
  id: string;
  role: ConversationMessageRole;
  content: string;
  createdAt: string;
}

export interface ConversationDetailDto {
  conversation: ConversationDto;
  messages: ConversationMessageDto[];
}

export interface SendConversationMessageResultDto {
  userMessage: ConversationMessageDto;
  assistantMessage: ConversationMessageDto | null;
  requiresGeneration: boolean;
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
