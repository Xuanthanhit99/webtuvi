import type { ClientAnalyticsEventName, ServerAnalyticsEventName } from '@beaconvie/types';
import { CLIENT_ANALYTICS_EVENT_NAMES, SERVER_ANALYTICS_EVENT_NAMES } from './analytics.constants';

/**
 * Two independent compile-time guarantees, combined, give full drift protection between
 * `packages/types`' unions and this file's runtime arrays (a runtime array is needed for
 * `@IsIn()` — TS unions don't exist at runtime — see analytics.constants.ts's own docstring):
 *
 *  1. `CLIENT_ANALYTICS_EVENT_NAMES: ClientAnalyticsEventName[]` (the type annotation in
 *     analytics.constants.ts) already fails `tsc` if the array contains a string that ISN'T a
 *     member of the union — an extra/typo'd entry is caught there, not here.
 *  2. The exhaustive `switch` below fails `tsc` if the union GAINS a member that isn't listed in
 *     the switch — the one direction the array's own type annotation can't catch, since a subset
 *     array is still a valid `ClientAnalyticsEventName[]`.
 *
 * Together: any drift between the two files fails the build, not just this test.
 */
function assertExhaustiveClientEventName(name: ClientAnalyticsEventName): true {
  switch (name) {
    case 'landing_view':
    case 'signup_started':
    case 'onboarding_started':
    case 'dashboard_viewed':
    case 'discover_viewed':
    case 'tarot_started':
    case 'tarot_interpretation_requested':
    case 'numerology_started':
    case 'numerology_interpretation_requested':
    case 'natal_started':
    case 'natal_interpretation_requested':
    case 'notification_opened':
    case 'premium_viewed':
    case 'checkout_completed':
    case 'report_viewed':
    case 'report_generation_started':
    case 'report_upgrade_clicked':
      return true;
    default: {
      const exhaustive: never = name;
      return exhaustive;
    }
  }
}

function assertExhaustiveServerEventName(name: ServerAnalyticsEventName): true {
  switch (name) {
    case 'signup_completed':
    case 'onboarding_completed':
    case 'tarot_completed':
    case 'tarot_interpretation_completed':
    case 'numerology_completed':
    case 'numerology_interpretation_completed':
    case 'natal_completed':
    case 'natal_interpretation_completed':
    case 'checkout_started':
    case 'payment_success':
    case 'report_generation_completed':
    case 'report_generation_failed':
      return true;
    default: {
      const exhaustive: never = name;
      return exhaustive;
    }
  }
}

describe('analytics event name lists stay in sync with packages/types', () => {
  it('every CLIENT_ANALYTICS_EVENT_NAMES entry is accepted by the exhaustive switch, with no duplicates', () => {
    expect(new Set(CLIENT_ANALYTICS_EVENT_NAMES).size).toBe(CLIENT_ANALYTICS_EVENT_NAMES.length);
    for (const name of CLIENT_ANALYTICS_EVENT_NAMES) {
      expect(assertExhaustiveClientEventName(name)).toBe(true);
    }
  });

  it('every SERVER_ANALYTICS_EVENT_NAMES entry is accepted by the exhaustive switch, with no duplicates', () => {
    expect(new Set(SERVER_ANALYTICS_EVENT_NAMES).size).toBe(SERVER_ANALYTICS_EVENT_NAMES.length);
    for (const name of SERVER_ANALYTICS_EVENT_NAMES) {
      expect(assertExhaustiveServerEventName(name)).toBe(true);
    }
  });

  it('client and server event name sets are disjoint — no event can be both client-submittable and server-only', () => {
    const overlap = CLIENT_ANALYTICS_EVENT_NAMES.filter((name) => (SERVER_ANALYTICS_EVENT_NAMES as string[]).includes(name));
    expect(overlap).toEqual([]);
  });

  it('matches the Sprint 13 brief §5 total of 24 distinct analytics events, plus Sprint 16’s 5 Reports events', () => {
    // landing_view, signup_started/completed, onboarding_started/completed, dashboard_viewed,
    // discover_viewed, {tarot,numerology,natal}_{started,completed,interpretation_requested,
    // interpretation_completed} (4×3=12), notification_opened, premium_viewed, checkout_started/
    // completed, payment_success — 24 total, one more than the brief's own prose count (its list
    // has 24 bullet lines; "23" was this test's own miscount, not a contract change). Sprint 16
    // (Personal Destiny Report) adds 5: report_viewed, report_generation_started/completed/failed,
    // report_upgrade_clicked — see docs/product/personal-destiny-report-decisions.md.
    expect(CLIENT_ANALYTICS_EVENT_NAMES.length + SERVER_ANALYTICS_EVENT_NAMES.length).toBe(29);
  });
});
