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
