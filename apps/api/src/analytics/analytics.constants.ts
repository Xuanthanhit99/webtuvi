import type { ClientAnalyticsEventName, ServerAnalyticsEventName } from '@beaconvie/types';

/**
 * Runtime mirror of the `ClientAnalyticsEventName`/`ServerAnalyticsEventName` unions in
 * `packages/types` — TypeScript unions don't exist at runtime, so the DTO (which needs an actual
 * array for `@IsIn`) needs its own copy. Keep these two lists in sync with `packages/types/index.ts`
 * by hand; `analytics.constants.spec.ts` cross-checks the counts so a drift is at least caught.
 */
export const CLIENT_ANALYTICS_EVENT_NAMES: ClientAnalyticsEventName[] = [
  'landing_view',
  'home_viewed',
  'home_feature_clicked',
  'home_tuvi_clicked',
  'home_tarot_clicked',
  'home_astrology_clicked',
  'home_numerology_clicked',
  'guest_tarot_started',
  'guest_tarot_preview_completed',
  'guest_numerology_started',
  'guest_numerology_preview_completed',
  'guest_tuvi_started',
  'auth_gate_viewed',
  'auth_gate_signup_clicked',
  'auth_gate_login_clicked',
  'home_article_clicked',
  'home_community_clicked',
  'home_premium_clicked',
  'home_app_clicked',
  'signup_started',
  'onboarding_started',
  'dashboard_viewed',
  'discover_viewed',
  'tarot_started',
  'tarot_interpretation_requested',
  'numerology_started',
  'numerology_interpretation_requested',
  'natal_started',
  'natal_interpretation_requested',
  'notification_opened',
  'premium_viewed',
  'checkout_completed',
  'report_viewed',
  'report_generation_started',
  'report_upgrade_clicked',
  'eastern_horoscope_started',
  'tu_vi_started',
];

export const SERVER_ANALYTICS_EVENT_NAMES: ServerAnalyticsEventName[] = [
  'signup_completed',
  'onboarding_completed',
  'tarot_completed',
  'tarot_interpretation_completed',
  'numerology_completed',
  'numerology_interpretation_completed',
  'natal_completed',
  'natal_interpretation_completed',
  'checkout_started',
  'payment_success',
  'report_generation_completed',
  'report_generation_failed',
  'eastern_horoscope_completed',
  'tu_vi_completed',
];

export const ANALYTICS_FEATURES = [
  'auth',
  'onboarding',
  'dashboard',
  'home',
  'discover',
  'tarot',
  'numerology',
  'natal_chart',
  'notifications',
  'premium',
  'reports',
  'eastern_horoscope',
  'tu_vi',
] as const;

export const ANALYTICS_RESULT_STATUSES = ['success', 'failure'] as const;
export const ANALYTICS_PREMIUM_STATUSES = ['free', 'premium'] as const;
export const ANALYTICS_SPREAD_TYPES = ['daily_draw', 'single_card', 'three_card'] as const;
export const ANALYTICS_NOTIFICATION_CATEGORIES = ['SECURITY', 'PREMIUM', 'DISCOVERY'] as const;

/** A batch POST is one page's worth of near-simultaneous events, never a bulk-import mechanism —
 * capped low enough that even a buggy client retry-looping this endpoint can't turn it into a
 * meaningful amplification vector. */
export const MAX_EVENTS_PER_BATCH = 20;

/** Route pathnames are accepted as analytics context but must never leak query strings (some of
 * which could carry state, e.g. `/premium?reason=...`) — enforced by truncating at the first `?`
 * or `#` before anything is stored or forwarded, and by a hard length cap against pathological
 * input. */
export const MAX_ROUTE_LENGTH = 200;
export const MAX_SOURCE_LENGTH = 100;
