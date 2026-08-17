# Product Metrics

**Status:** Sprint 13 — the first product-metrics definition this repository has had. Defines what each metric means and which analytics event(s) it's computed from; does not set targets. Targets require a founder decision informed by real traffic, which doesn't exist yet — every target below is explicitly `TARGET TBD`, not a placeholder number dressed up as a real one.

---

## Acquisition

| Metric | Definition | Source event(s) | Target |
|---|---|---|---|
| Landing visitors | Count of `landing_view` | `landing_view` | TARGET TBD |
| Signup conversion | `signup_completed` ÷ `landing_view` (same anonymous→authenticated identity, within a session) | `landing_view`, `signup_completed` | TARGET TBD |

## Activation

| Metric | Definition | Source event(s) | Target |
|---|---|---|---|
| Onboarding completion rate | `onboarding_completed` ÷ `onboarding_started` | `onboarding_started`, `onboarding_completed` | TARGET TBD |
| First Discovery completion | Share of new accounts with at least one of `{tarot,numerology,natal}_completed` within N days of `signup_completed` (N chosen once real data exists) | `signup_completed`, `*_completed` | TARGET TBD |

## Engagement

| Metric | Definition | Source event(s) | Target |
|---|---|---|---|
| Discovery sessions per active user | Count of `{tarot,numerology,natal}_started` per user per period | `*_started` | TARGET TBD |
| AI interpretation request rate | `*_interpretation_requested` ÷ `*_completed`, per Discovery system | `*_completed`, `*_interpretation_requested` | TARGET TBD |
| AI interpretation completion rate | `*_interpretation_completed` ÷ `*_interpretation_requested` — the gap between these two is provider failures, exhausted budget, and concurrent-generation rejections (all already logged server-side; see `docs/architecture/discovery-ai-cost-control.md`) | `*_interpretation_requested`, `*_interpretation_completed` | TARGET TBD |

## Retention

| Metric | Definition | Source event(s) | Target |
|---|---|---|---|
| D1 return rate | Share of accounts with any event 24–48h after `signup_completed` | any event, `signup_completed` | TARGET TBD |
| D7 return rate | Same, 7 days out | any event, `signup_completed` | TARGET TBD |
| Notification return rate | Share of `notification_opened` events followed by a same-session Discovery or Companion action | `notification_opened`, downstream events | TARGET TBD |

D1/D7 cohort analysis is a PostHog-native feature (retention charts) once a real project exists — no custom computation needed; see `docs/architecture/product-analytics.md` §"Funnel & retention query capability."

## Monetization

| Metric | Definition | Source event(s) | Target |
|---|---|---|---|
| Premium page view rate | `premium_viewed` ÷ active users in period | `premium_viewed` | TARGET TBD |
| Checkout initiation rate | `checkout_started` ÷ `premium_viewed` | `premium_viewed`, `checkout_started` | TARGET TBD |
| Checkout return rate | `checkout_completed` ÷ `checkout_started` — measures whether buyers make it through PayOS's hosted flow and back, independent of whether the payment itself succeeded | `checkout_started`, `checkout_completed` | TARGET TBD |
| Payment conversion | `payment_success` ÷ `checkout_started` — the authoritative revenue-conversion number; only `payment_success` is server-verified against a real webhook, never inferred from a redirect | `checkout_started`, `payment_success` | TARGET TBD |

## AI Economics

Not sourced from the analytics event stream — this data already exists, server-side only, in the `AIUsage`/`ProviderLog` Prisma models (Sprint 2B/12), attributed per `AIFeature`. Analytics events mark *that* an interpretation was requested/completed, not its cost; cost is a durable accounting fact, not a behavioral signal, so it deliberately doesn't flow through the same pipeline as the rest of this document.

| Metric | Source |
|---|---|
| AI cost per user | `AIUsage`, grouped by `userId` |
| AI cost per feature | `AIUsage`/`ProviderLog`, grouped by `AIFeature` |
| Premium AI cost vs. Free | `AIUsage` joined against `PremiumEntitlement` at time of use |

Surfacing these to an operator is one of the 5 Admin lookups in `docs/product/product-completion-roadmap-v2.md` §3 (P2) — not yet built; the underlying data already is.

---

## What this document deliberately does not do

- Set any target number. Every row above is `TARGET TBD` until real traffic exists to set one against.
- Define a dashboard. See `docs/architecture/product-analytics.md` §"Recommended initial views" for what to build inside the analytics provider's own UI once one is connected — this sprint is instrumentation, not BI-platform development (Sprint 13 brief §41).
- Track anything not already in the `AnalyticsEventName` allowlist (`packages/types/index.ts`) — a metric that needs a new event should be added there first, deliberately, not inferred from data that was never meant to answer it.
