import type { AnalyticsEventProperties, ClientAnalyticsEventName } from '@beaconvie/types';

const ANON_ID_KEY = 'bv_anon_id';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Local dev/off switch only — see docs/architecture/product-analytics.md §"Config". There is no
 * "on with a key" state to check here: unlike a client-side SDK, this app never holds a
 * third-party analytics key in the browser at all — every event goes to BeaconVie's own backend
 * first, which alone decides whether (and where) it's forwarded. Absent or anything other than the
 * literal string `'false'` means enabled. */
function isEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'false';
}

/** A v4 UUID, persisted in `localStorage`, never derived from anything identifying (no email, no
 * IP, no fingerprinting). Returns `null` (never throws) when storage is unavailable — private
 * browsing, a locked-down browser policy, or SSR — in which case the caller simply skips sending
 * the event rather than crashing a page over telemetry. */
function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = window.localStorage.getItem(ANON_ID_KEY);
    if (existing) return existing;
    const generated = crypto.randomUUID();
    window.localStorage.setItem(ANON_ID_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}

/**
 * Sprint 13 Release Closure §21 — called from the logout handler. While a session is active,
 * `distinctId` is always the real `userId` (`AnalyticsService.trackClientEvents`/`trackServerEvent`
 * — the anonymous id is sent alongside every request but ignored server-side whenever an
 * authenticated identity is present), so User A's authenticated activity can never be attributed
 * to User B, with or without this reset. What this closes is narrower but real: without it, the
 * *pre-login* anonymous id persists in `localStorage` indefinitely, so a shared browser (or the
 * same person across two different accounts) would bucket every future signed-out visit under the
 * same anonymous identity as whatever came before. Resetting it on logout starts a clean anonymous
 * identity for whoever uses the browser next.
 */
export function resetAnonymousId(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ANON_ID_KEY);
  } catch {
    // Storage unavailable — nothing to reset.
  }
}

/**
 * Fire-and-forget by design (Sprint 13 brief §20): never awaited by callers, never throws, never
 * surfaces an error to the user, never retried on failure. A dropped analytics event is an
 * acceptable, invisible loss — a blocked or slowed-down page interaction because of one would not
 * be. See `AnalyticsService` (backend) for the server-side half of this same guarantee.
 *
 * Deliberately a raw `fetch`, not the shared `api` client (`lib/api-client.ts`): that client
 * always ensures a CSRF token before a mutating request, bootstrapping one with an extra
 * `/auth/csrf-token` round-trip if none exists yet — worthwhile for a real mutation, wasted
 * latency for `/analytics/events`, which the backend deliberately marks `@SkipCsrf()` (see
 * `AnalyticsController`'s own docstring for why: nothing here can move money or change account
 * state, the class of risk CSRF protection exists for). Also skips the 401→refresh-retry
 * machinery for the same reason — this endpoint never requires auth in the first place.
 */
export function trackEvent(event: ClientAnalyticsEventName, properties?: AnalyticsEventProperties): void {
  // The whole body is wrapped in try/catch, not just a `.catch()` on the fetch promise: a
  // synchronous throw (e.g. `fetch` not existing as a global at all — a real gap this closes,
  // caught by a test environment where it isn't polyfilled) would otherwise propagate straight
  // into the caller's click handler, which is exactly the "analytics broke a real interaction"
  // failure this function exists to make impossible. See analytics.test.ts's coverage of this.
  try {
    if (!isEnabled()) return;
    const anonymousId = getAnonymousId();
    if (!anonymousId) return;

    void fetch(`${API_URL}/analytics/events`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [{ event, anonymousId, properties, clientTimestamp: new Date().toISOString() }] }),
    }).catch(() => {
      // Intentionally swallowed — see docstring.
    });
  } catch {
    // Intentionally swallowed — see docstring.
  }
}
