# Product Analytics (Sprint 13)

Status: Implemented (instrumentation + code path); runtime unverified against a real provider — see §9. Selected by `docs/product/product-completion-roadmap-v2.md` §3 (P0 — the audit trail's own finding that zero funnel visibility existed anywhere in this product prior to this sprint). This document is the design record every `Analytics*` file points back to.

## 1. Why this exists, and what it deliberately is not

The prior audit found the product had never been able to answer its own funnel questions — does Onboarding convert, does Premium's pitch land, where do users actually drop off — except by reading code. This module closes that gap, narrowly. It is not a BI platform, not a session-replay/heatmap tool, not a marketing-attribution system, and captures no free-text content of any kind. Every design choice below traces back to the same deterministic-first, privacy-first discipline the rest of this codebase already holds Discovery/Companion/Memory to.

## 2. Architecture

```
Client-observed intent                     Server-observed fact
(landing_view, *_started,                  (signup_completed, *_completed,
 *_interpretation_requested,                *_interpretation_completed,
 notification_opened,                       checkout_started, payment_success)
 premium_viewed, checkout_completed)
            |                                          |
   POST /analytics/events                    in-process call, same request
   (OptionalJwtAuthGuard,                    that already persisted the
    strict DTO allowlist)                    underlying fact
            \                                          /
             \                                        /
                     AnalyticsService.capture()
                (allowlist re-applied, distinctId
                 resolved, timestamp stamped,
                 never throws to the caller)
                              |
                        AnalyticsSink
                    /                  \
          NoopAnalyticsSink      PostHogHttpSink
        (no key configured,      (POSTHOG_API_KEY set,
         ANALYTICS_ENABLED=false, ANALYTICS_ENABLED=true,
         or NODE_ENV=test)        NODE_ENV≠test)
```

Two independent event sources converge on one `AnalyticsService`, which is the single place the privacy allowlist and failure-isolation guarantees live — neither the controller nor any calling service reimplements either.

## 3. Client vs. server event ownership

`ClientAnalyticsEventName` and `ServerAnalyticsEventName` (`packages/types/index.ts`) are disjoint unions, not a convention a caller has to remember to follow — the public `/analytics/events` DTO's `@IsIn()` is scoped to the client union only, so a client **cannot** express a server-only event name; the request is rejected (400) before it reaches any service logic. See `apps/api/src/analytics/analytics.constants.spec.ts` for the compile-time exhaustiveness check that keeps both lists in sync with the shared type.

The split follows one rule: an event fires client-side when it marks *intent* (a page reached, a button pressed, an attempt begun), and server-side when it marks a *fact already persisted* (a row created, an order transitioned, a webhook resolved). `checkout_completed` vs. `payment_success` is the clearest instance of this: the former fires client-side on arrival at `/premium/return` regardless of outcome (the buyer completed PayOS's hosted flow and came back); the latter fires exclusively from `PaymentWebhookService`, inside the same idempotent `PENDING→PAID` transition the payment system already uses for its own correctness — never inferred from a redirect query parameter, per the explicit "never fabricate payment_success" requirement this module was built against.

## 4. Privacy model

`AnalyticsEventProperties` (`packages/types/index.ts`) is a closed, flat shape: `feature`, `route` (pathname only), `resultStatus`, `source`, `premiumStatus`, `notificationCategory`, `spreadType`. Every field is a bounded enum or a sanitized pathname — there is no free-text field anywhere in the contract for a birth date, an email, a Tarot question, a calculated number, or any Companion/Journal/Memory content to end up in by accident.

Two independent enforcement layers, not one:

1. **The DTO** (`apps/api/src/analytics/dto/track-analytics-events.dto.ts`) — the global `ValidationPipe`'s `whitelist: true, forbidNonWhitelisted: true` (`main.ts`) rejects the entire request with 400 if any property outside the allowlist is present. This is the boundary a malicious or buggy client hits.
2. **`AnalyticsService.sanitizeProperties`** — re-strips `route` down to a bare pathname (query string and hash removed, length-capped) even for server-originated events, which never pass through the DTO at all. This is defense in depth for the one field shape-valid enough to accidentally carry incidental state (e.g. `/premium?token=...`).

## 5. Identity model

`distinctId = userId ?? anonymousId`. The anonymous id is a v4 UUID generated client-side and persisted in `localStorage` (`bv_anon_id`) — never derived from IP, email, or any device fingerprint. Once a session is authenticated, `OptionalJwtAuthGuard` resolves the real user id server-side from the session cookie and `AnalyticsService` prefers it; the client never sends its own notion of "who I am" beyond the anonymous id.

**Known, disclosed simplification**: anonymous→authenticated identity *stitching* (merging a visitor's pre-signup anonymous events with their post-signup identified ones, e.g. via PostHog's `$alias`) is not implemented this sprint — building it would mean a second cross-referencing mechanism for a v1 that doesn't need it yet (the funnel metrics in `docs/product/product-metrics.md` that most benefit from stitching — landing→signup conversion — can be approximated from the same-session anonymous id without it). Revisit if/when a real provider project shows this materially undercounts a metric that matters.

**Multi-user-same-browser isolation (verified during Sprint 13 Release Closure §21):** while a session is authenticated, `distinctId` is always the real `userId` — the anonymous id is present in every client request but is structurally ignored server-side whenever an authenticated identity exists (`userId ?? anonymousId` — `userId` always wins). This means User A's authenticated activity can never be attributed to User B's identity, regardless of what happens to the anonymous id. What *isn't* free by construction: the anonymous id itself is browser-scoped, not session-scoped, so without an explicit reset, every signed-out visit on a shared browser — including a different real person's pre-login browsing — would bucket under the same anonymous identity as whatever came before. `resetAnonymousId()` (`lib/analytics.ts`) closes this: called from the logout handler (`components/layout/app-header.tsx`), it clears `bv_anon_id` from `localStorage` so the next signed-out visitor on that browser starts a fresh anonymous identity rather than inheriting the previous account-holder's.

## 5a. Account deletion (verified during Sprint 13 Release Closure §22)

**A deleted account cannot send future authenticated analytics as its old identity — confirmed structurally, not merely assumed.** `AccountDeletionService` sets `User.status = 'DELETED'`; `OptionalJwtAuthGuard` (the guard `AnalyticsController` uses) mirrors `JwtAuthGuard`'s own `status !== 'ACTIVE'` check and — critically — never populates `request.user` in that case, so a replayed pre-deletion JWT falls back to `distinctId = anonymousId`, never the deleted user's id. This holds even though `OptionalJwtAuthGuard` never *throws* the way `JwtAuthGuard` does — it degrades to anonymous instead, which is the correct behavior for an endpoint that must also serve signed-out visitors.

**What is not yet decided — `PRODUCT/LEGAL POLICY REQUIRED`:** BeaconVie itself stores zero analytics event data (no local `AnalyticsEvent` table — every event is forwarded live to the sink with no local persistence), so account deletion has nothing to purge on BeaconVie's own side. But once a real PostHog project is connected, PostHog will hold historical events keyed by that user's (now-deleted) `userId` as `distinct_id`, subject to PostHog's own retention settings, until/unless explicitly purged via PostHog's own deletion API. Neither the current account-deletion flow (`docs/architecture/account-data-rights.md`) nor the Privacy Policy (still a Sprint-1 placeholder) currently promises or performs this purge. This is a founder/legal decision — whether analytics deletion is promised at all, and if so, whether `AccountDeletionService` should call PostHog's deletion API as an added step — not something this sprint should resolve by inventing a policy. Tracked in `docs/product/product-completion-roadmap-v2.md` §4.

## 6. Consent

No separate analytics consent flow exists — this event stream carries no personal content (§4), so it sits alongside the kind of first-party, non-advertising, product-improvement telemetry the Product Bible's own privacy stance (Module 21) doesn't treat as requiring the same explicit-opt-in ceremony as, say, AI-training use of Memory content. `NEXT_PUBLIC_ANALYTICS_ENABLED=false` and `ANALYTICS_ENABLED=false` (backend) both exist as hard kill switches. **LEGAL/FOUNDER DECISION still required** before public launch: whether the real Privacy Policy (currently a Sprint-1 placeholder, see the completion roadmap) needs to name PostHog specifically as a sub-processor once a real project is connected — a `docs/product/product-completion-roadmap-v2.md` §4 checklist item, not resolved by this sprint's code.

## 7. Why not the SDK

`PostHogHttpSink` talks to PostHog's `/i/v0/e` HTTP ingestion endpoint directly with a single `fetch` call, rather than depending on `posthog-node`/`posthog-js`. (Verified against PostHog's current official API docs during Sprint 13 Release Closure — the implementation-time draft had used the older `/capture/` path, which current docs no longer mention; fixed.) The SDKs are built around autocapture (every click, every page load, automatically) and session-recording hooks — both would need to be found and explicitly disabled to hold the allowlist in §4, versus this file, which can only ever send the exact shape `AnalyticsService` already built. Fewer dependencies, smaller attack surface, no risk of a future SDK version quietly changing its default capture behavior out from under this module's privacy guarantee.

## 8. Failure isolation

Two layers, matching the sprint brief's "analytics must never fail the operation it's describing" requirement literally:

1. `PostHogHttpSink.capture` — network errors and non-2xx responses are caught, logged at `warn` (event name + status only, never `properties`), and swallowed.
2. `AnalyticsService.capture` — a second try/catch one layer up, so even a sink implementation that forgot its own error handling still can't propagate into a caller like `AuthService.register` or `PaymentWebhookService.handlePayOSWebhook`.

Every server-side call site uses `void this.analyticsService.trackServerEvent(...)` — fire-and-forget, never awaited into the critical path of signup/checkout/payment/interpretation. The frontend's `trackEvent` is the same shape: never awaited by any caller, `.catch()` swallows delivery failure.

## 9. Runtime status

**No real analytics runtime has been exercised this sprint.** `POSTHOG_API_KEY` is absent from every environment this session could inspect; `AnalyticsModule`'s sink factory resolves to `NoopAnalyticsSink` in that condition (and unconditionally under `NODE_ENV=test`, so the test suite never makes a real network call regardless of what's configured). What has been verified: the full HTTP contract via `apps/api/test/analytics.e2e-spec.ts` (allowlist enforcement, client/server event-name separation, batch cap, anonymous + authenticated access), and every unit-level guarantee in `analytics.service.spec.ts`/`posthog-http.sink.spec.ts`/`analytics.constants.spec.ts`. See `docs/operations/production-deployment-runbook.md` §12 for the full, honest runtime-verification status across every external integration touched this sprint, not analytics alone.

## 10. Funnel & retention query capability

Every metric in `docs/product/product-metrics.md` is answerable directly from PostHog's own UI once a real project exists — standard event-sequence funnels for the conversion metrics, native retention charts (D1/D7 cohort-by-first-event) for the return-rate metrics. No custom aggregation service was built for this, deliberately (Sprint 13 brief §41: "this sprint is instrumentation, not BI-platform development").

### Recommended initial views (to configure inside PostHog once connected, not built here)

- Funnel: `landing_view → signup_completed → onboarding_completed → {tarot,numerology,natal}_completed`
- Funnel: `premium_viewed → checkout_started → checkout_completed → payment_success`
- Funnel, per Discovery system: `*_completed → *_interpretation_requested → *_interpretation_completed`
- Retention: D1/D7 anchored on `signup_completed`, any subsequent event as the return signal
