# Production Activation Checklist

**Status:** Execution plan derived from `docs/audit/product-complete-production-readiness-audit.md`
(verdict: `PRODUCT COMPLETE BLOCKED BY TỬ VI DOMAIN TRACK — CURRENT PRODUCT OTHERWISE LAUNCH-READY`).
This document does not repeat that audit — it converts its findings into ordered, owned, executable
steps. Companion document: `docs/operations/founder-production-action-pack.md` (the founder-facing
subset, phrased as concrete asks, no vague items).

**Scope discipline:** no feature implementation here. The one authorized code change this pass made
— payment-webhook-rejection Sentry visibility — is recorded in §10 with its own evidence, not
folded into the general checklist noise.

**Note (2026-08-22):** the "Tử Vi domain track" half of the verdict above is now stale — see §14's
superseding update. The engine shipped; this document's actual checklist content (payment/DNS/email/
Sentry/legal) is unaffected and still governs.

---

## 1. Production Activation Board

One row per real, distinct item. `Current status` re-verified from source this pass, not copied
from memory.

| # | Item | Owner | Current status | Exact action | Dependency | Evidence required | Blocks launch? | Blocks Product Complete? |
|---|---|---|---|---|---|---|---|---|
| 1 | Production frontend domain | FOUNDER | **LOCKED: `tuvitarot.vn`** (Domain + Brand Production Lock, see `docs/progress/domain-brand-production-lock-final-report.md`) | Point DNS at hosting once a provider is chosen | Hosting provider choice | DNS resolves | Yes | No |
| 2 | Production API domain | FOUNDER | **LOCKED: `api.tuvitarot.vn`** | Point DNS at hosting once a provider is chosen | Hosting provider choice | DNS resolves | Yes | No |
| 3 | DNS | OPS | Not started | Configure A/CNAME records for both domains | #1, #2 | `dig`/`nslookup` resolves correctly | Yes | No |
| 4 | TLS | OPS | Not started | Provision certs (most hosts: automatic via Let's Encrypt/managed cert) | #1, #2 | HTTPS serves without warning | Yes | No |
| 5 | CORS | ENGINEERING | Code complete, config pending | Set `CORS_ORIGINS` to real frontend origin | #1 | `enableCors` origin matches; cross-origin request from real frontend succeeds | Yes | No |
| 6 | Cookie domain | ENGINEERING | Code complete, config pending | Set `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SECURE=true`, confirm `AUTH_COOKIE_SAME_SITE` | #1, #2 (same registrable domain or explicit cross-subdomain design) | Login sets cookie visible in browser devtools with `Secure`/correct `Domain` | Yes | No |
| 7 | `TRUST_PROXY` | ENGINEERING (sets value) / FOUNDER (confirms topology) | Code correct, value unconfirmed | Set to the real hop count/boolean for the chosen host's proxy chain | #1, #2, hosting choice | Manual confirmation against provider's own docs; IP-based rate limiting behaves correctly under a real request through the real proxy | Yes | No |
| 8 | Production DB | OPS | Not provisioned | Provision managed Postgres | Hosting choice | Connection succeeds | Yes | No |
| 9 | Production Redis | OPS | Not provisioned | Provision managed Redis | Hosting choice | Connection succeeds | Yes | No |
| 10 | Migrations | ENGINEERING | Ready, not run in prod | `DATABASE_URL=<prod> pnpm --filter @beaconvie/api prisma:migrate` (once, before traffic — see runbook §4) | #8 | Migration log, `prisma migrate status` clean | Yes | No |
| 11 | PayOS account | FOUNDER/EXTERNAL | Unknown if real | Confirm merchant account is live (not sandbox-shaped) | — | Merchant dashboard access | Yes (for payments) | No |
| 12 | PayOS credentials | FOUNDER/EXTERNAL | Present locally, authenticity unverified | Confirm `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` are real production values | #11 | One real (or PayOS-sandbox) checkout round-trips | Yes (for payments) | No |
| 13 | Production price | FOUNDER | Not signed off | Confirm `PREMIUM_PRICE_VND` value is approved | — | Written sign-off | Yes (for payments) | No |
| 14 | Webhook URL | ENGINEERING | Known, unregistered | `{API_BASE_URL}/payment/webhooks/payos` | #2 live over HTTPS | — | Yes (for payments) | No |
| 15 | Webhook registration | FOUNDER (has PayOS account access) | Not done | Register #14 in PayOS dashboard, after #2 is live | #2, #11 | PayOS dashboard confirms registration | Yes (for payments) | No |
| 16 | Email provider | FOUNDER/EXTERNAL | Not selected | Choose `resend` or `postmark`, create account | — | Account exists | Yes | No |
| 17 | Sender/domain verification | FOUNDER/EXTERNAL | Not done | Verify sending domain with chosen provider (SPF/DKIM records) | #16, DNS access | Provider confirms domain verified | Yes | No |
| 18 | Email credential | ENGINEERING (sets) / EXTERNAL (provides) | Not set | Set `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN`, `EMAIL_FROM`, `EMAIL_PROVIDER` | #16, #17 | Test email delivered | Yes | No |
| 19 | Sentry project | FOUNDER/EXTERNAL | Not created | Create Sentry project (backend + frontend, or one project two DSNs) | — | Project exists | No (recommended) | No |
| 20 | Sentry DSNs | ENGINEERING (sets) | Not set | Set `SENTRY_DSN` (backend), `NEXT_PUBLIC_SENTRY_DSN` (frontend build arg) | #19 | One real captured, scrubbed event | No (recommended) | No |
| 21 | PostHog project | FOUNDER/EXTERNAL | Not created | Create PostHog project | — | Project exists | No | No |
| 22 | PostHog key | ENGINEERING (sets) | Not set | Set `POSTHOG_API_KEY`, confirm `POSTHOG_HOST` | #21 | One real allowlisted-only event received | No | No |
| 23 | Privacy Policy | LEGAL | Sprint-1 placeholder | Draft + publish real policy | — | Live page, no "Sprint 1" disclaimer | Yes | Yes (roadmap §7) |
| 24 | Terms | LEGAL | Sprint-1 placeholder | Draft + publish real terms | — | Live page, no "placeholder" disclaimer | Yes | Yes (roadmap §7) |
| 25 | Refund policy | LEGAL/FOUNDER | Undecided, no doc | Decide + document | — | Written policy | Yes (for payments) | No |
| 26 | Tax/invoice policy | LEGAL/FOUNDER | Undecided, no doc | Decide + document | — | Written policy | Yes (for payments) | No |
| 27 | Payment-record retention | LEGAL/FOUNDER | Mechanism done, duration undecided | Confirm retention duration; mechanism (`AccountDeletionService`) already correct | — | Written policy matching existing code behavior | No | No |
| 28 | Backups | OPS | Undocumented | Confirm hosting provider's backup offering, enable it, document owner | #8 (DB choice) | Provider dashboard shows active backups | Yes | No |
| 29 | Production smoke | ENGINEERING | Ready to execute | Run §13 suite below once deployed | #1–10 | Checklist below, all pass | Yes | No |
| 30 | Payment smoke | FOUNDER (authorizes) + ENGINEERING (executes) | Blocked | Run §14 (payment) after real credentials + explicit authorization | #11–15 | Order transitions PENDING→PAID, entitlement granted | Yes (for payments) | No |
| 31 | Analytics smoke | ENGINEERING | Blocked on #22 | Confirm one real event in PostHog UI | #22 | Screenshot/UI confirmation | No | No |
| 32 | Error-reporting smoke | ENGINEERING | Blocked on #20 | Trigger one deliberate test error, confirm scrubbing | #20 | Captured event reviewed, no PII/secrets | No (recommended) | No |

---

## 2. Exact production environment variable matrix

Read directly from `apps/api/src/config/env.validation.ts` and `apps/web/.env.example` — no
invented names. Values masked; presence/status only.

### Backend deployment (`apps/api`)

| ENV name | Purpose | Required in prod? | Owner | Current presence | Safe to boot without? | What breaks if absent |
|---|---|---|---|---|---|---|
| `DATABASE_URL` | Postgres connection | Yes | OPS | SET (dev only) | No — boot fails (zod `.min(1)`) | Process won't start |
| `REDIS_URL` | Redis connection | Yes | OPS | SET (dev only) | No — boot fails | Process won't start |
| `API_BASE_URL` | This API's own public URL | Yes | ENGINEERING/OPS | SET to `localhost` | No — must be a valid URL | Malformed links, broken webhook URL construction |
| `FRONTEND_URL` | Frontend's public URL (CORS/redirects) | Yes | ENGINEERING/OPS | SET to `localhost` | No | CORS misconfigured |
| `APP_PUBLIC_URL` | Fixed base URL for email links | **Yes in production** (explicit boot check) | ENGINEERING/OPS | Optional in schema, not confirmed set | No in production — boot throws | Email links broken/boot failure |
| `CORS_ORIGINS` | Allowed cross-origin caller | Yes | ENGINEERING/OPS | SET to `localhost` | No — boot fails (`.min(1)`) | Process won't start |
| `TRUST_PROXY` | Express proxy-trust depth | Yes (has safe default `'false'`) | ENGINEERING/FOUNDER | NOT_SET (uses default) | Yes, but rate-limiting IP attribution may be wrong behind a real proxy | Over- or under-restrictive rate limiting |
| `JWT_ACCESS_SECRET` | Access token signing | Yes | ENGINEERING | SET (dev value; boot rejects any value starting `replace-with`) | No | Process won't start / auth broken |
| `JWT_REFRESH_SECRET` | Refresh token signing | Yes | ENGINEERING | SET (dev value) | No | Process won't start |
| `CSRF_SECRET` | CSRF token signing | Yes | ENGINEERING | SET (dev value) | No | Process won't start |
| `AUTH_COOKIE_DOMAIN` | Auth cookie domain scope | Yes | ENGINEERING/OPS | SET to `localhost` | No — boot fails (`.min(1)`) | Process won't start |
| `AUTH_COOKIE_SECURE` | `Secure` cookie flag | Yes, **must be `true` in prod** (explicit boot check) | ENGINEERING/OPS | SET to `false` (correct for local dev) | No in production — boot throws | Session cookie sent over plain HTTP if misconfigured |
| `AUTH_COOKIE_SAME_SITE` | `SameSite` cookie attribute | Optional (defaults `lax`) | ENGINEERING | NOT_SET (default) | Yes | — |
| `EMAIL_PROVIDER` | `mailpit` / `resend` / `postmark` | Yes, **cannot be `mailpit` in prod** (explicit boot check) | ENGINEERING/EXTERNAL | SET to `mailpit` | No in production — boot throws | No real email ever sends |
| `EMAIL_FROM` | Sender address | Yes | ENGINEERING/EXTERNAL | SET (dev value) | No — boot fails | — |
| `RESEND_API_KEY` | Resend credential | Required if `EMAIL_PROVIDER=resend` | EXTERNAL | NOT_SET | Depends on provider choice | Boot throws if provider selected without it |
| `POSTMARK_SERVER_TOKEN` | Postmark credential | Required if `EMAIL_PROVIDER=postmark` | EXTERNAL | NOT_SET | Depends on provider choice | Boot throws if provider selected without it |
| `DEFAULT_AI_PROVIDER` | Companion/Discovery AI provider | Yes, **cannot be `mock` in prod** (explicit boot check) | ENGINEERING | SET to `openai` (real) | No in production if `mock` — boot throws | — |
| `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` | AI provider credential(s) | Required for whichever provider(s) selected | ENGINEERING/EXTERNAL | Dev-tier keys present; prod-tier unconfirmed | No — boot throws if selected provider lacks its key | — |
| `AI_ENABLE_MOCK_PROVIDER` | Mock-provider opt-in | Optional, **must be `false`/unset in prod** (explicit boot check) | ENGINEERING | NOT_SET (default `false`) | Yes | Boot throws if `true` in production |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` | PayOS credentials | Yes in production (explicit boot check) | EXTERNAL | SET (authenticity unconfirmed, §7 of the readiness audit) | No in production if any missing — boot throws | — |
| `PAYOS_MOCK_CHECKOUT` | Mock checkout responses | Optional, **must be `false` in prod** (explicit boot check) | ENGINEERING | SET to `true` (correct for local dev) | No in production if `true` — boot throws | — |
| `PAYMENTS_ENABLED` | Payment kill switch | Optional (defaults `true`) | ENGINEERING/FOUNDER | NOT_SET (default `true`) | Yes | Checkout creation proceeds normally |
| `PREMIUM_PRICE_VND` | Premium price | Optional (defaults `79_000`) | FOUNDER | NOT_SET (default) | Yes, but wrong price if not confirmed | Charges the default, not the sign-off price |
| `SENTRY_DSN` | Backend error tracking | No (optional) | EXTERNAL | NOT_SET | Yes — Sentry fully disabled, no boot impact | No production error visibility |
| `POSTHOG_API_KEY` | Analytics | No (optional) | EXTERNAL | NOT_SET | Yes — analytics fully disabled, no boot impact | No production funnel visibility |
| `POSTHOG_HOST` | Analytics endpoint | No (defaults to PostHog US cloud) | ENGINEERING | NOT_SET (default) | Yes | — |
| `ANALYTICS_ENABLED` | Analytics kill switch | No (defaults `true`) | ENGINEERING/OPS | NOT_SET | Yes | — |

### Frontend deployment (`apps/web`, build-time args, not runtime env)

| ENV name | Purpose | Required in prod? | Owner | Current presence | Safe to boot without? | What breaks if absent |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | API's public URL, baked into client bundle | Yes | ENGINEERING/OPS | SET to `localhost` in `.env.example` | No — every API call breaks | Frontend can't reach backend |
| `NEXT_PUBLIC_APP_URL` | This frontend's own public URL, used for `metadataBase`/canonical | Yes | ENGINEERING/OPS | SET to `localhost` | No — build succeeds but canonical/OG URLs wrong | Broken SEO metadata, wrong share URLs |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend error tracking | No (optional) | EXTERNAL | NOT_SET (commented in `.env.example`) | Yes | No production frontend error visibility |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Sentry build-time source-map upload | No (optional) | EXTERNAL | NOT_SET | Yes | Stack traces less readable in Sentry, not a functional break |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Client-side analytics kill switch | No (defaults enabled) | ENGINEERING | SET to `true` in `.env.example` | Yes | — |

**Rebuild required, not just redeploy**: every `NEXT_PUBLIC_*` value above is inlined into the
client bundle at `next build` time (Next.js's own behavior) — changing one after the fact requires
a fresh image build, confirmed in `production-deployment-runbook.md` §2.

---

## 3. Domain activation procedure (exact order)

Commands drawn from the actual repo — `production-deployment-runbook.md` §1–6, re-confirmed this
pass, not invented.

1. **Deploy backend** — build `apps/api/Dockerfile` from the repo root:
   `docker build -f apps/api/Dockerfile -t beaconvie-api .` (build-and-run verified in Sprint 13
   Release Closure).
2. **Provision DB/Redis** — managed Postgres + Redis from the chosen hosting provider; obtain
   connection strings.
3. **Run migrations** — once, before the new image receives traffic:
   `DATABASE_URL=<production-url> pnpm --filter @beaconvie/api prisma:migrate` (= `prisma migrate
   deploy` under the hood; safe against a database other processes may also be connected to; never
   run as a container-startup hook — see runbook §4 for why).
4. **Configure backend domain** — point the API's subdomain at the deployed container/service; set
   `API_BASE_URL` to the real HTTPS URL.
5. **Configure frontend domain** — point the frontend's domain at the deployed service; set
   `NEXT_PUBLIC_APP_URL`/`APP_PUBLIC_URL` to the real HTTPS URL.
6. **Configure CORS** — set `CORS_ORIGINS` to the real frontend origin (exact scheme+host, not a
   wildcard — `credentials: true` in `main.ts`'s `enableCors` call makes a wildcard origin unsafe).
7. **Configure cookie domain** — set `AUTH_COOKIE_DOMAIN` to the real registrable domain,
   `AUTH_COOKIE_SECURE=true` (boot fails in production without this), confirm
   `AUTH_COOKIE_SAME_SITE` matches the actual frontend/API domain relationship (same-site `lax` if
   API and frontend share a registrable domain; `none` + `Secure` if they're genuinely
   cross-site).
8. **Configure frontend API URL** — set `NEXT_PUBLIC_API_URL` to the real API domain, rebuild the
   frontend image (build-time, not runtime).
9. **Configure `TRUST_PROXY`** — set to the real value for the chosen host's proxy chain (single
   reverse proxy = `'true'` or `1`; CDN + load balancer = `2`; direct exposure = `'false'`) — do not
   guess; confirm against the provider's own documented topology first.
10. **Verify health/readiness** — `GET {API_BASE_URL}/health/live` → 200; `GET {API_BASE_URL}
    /health/ready` → 200 with `{"status":"ok","checks":{"database":"ok","redis":"ok"}}`.
11. **Verify auth** — register a throwaway account through the real frontend; confirm a session
    cookie is set with `Secure`/correct `Domain` (browser devtools, not assumed).
12. **Verify CSRF** — confirm a mutating request without the `X-CSRF-Token` header is rejected, and
    one with the real double-submit token succeeds (matches the existing `CsrfService`/guard
    already covered by this repo's own test suite — re-exercise live once deployed, not merely
    trust the unit tests).
13. **Verify logout/session refresh** — log out, confirm the session cookie is cleared; let an
    access token approach expiry (or force one), confirm the refresh flow silently re-issues a new
    one without the user being logged out.

---

## 4. Email activation procedure

Traced from `env.validation.ts` and the runbook. Steps once real credentials exist:

1. Set `EMAIL_PROVIDER` to `resend` or `postmark`, `EMAIL_FROM` to the approved sender address,
   and the matching credential (`RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN`).
2. Redeploy the API (runtime env, no rebuild needed — unlike the frontend's `NEXT_PUBLIC_*` values).
3. Confirm boot succeeds (env validation would throw immediately if the provider/credential pairing
   is wrong).

**Smoke tests:**

| Test | Expected result | Pass evidence |
|---|---|---|
| Registration verification email | Real email arrives at a real inbox within a few minutes | Inbox screenshot/confirmation |
| Resend verification | Second email arrives, respects `EMAIL_VERIFICATION_RESEND_COOLDOWN` | Timing + arrival confirmed |
| Password reset | Real email arrives, link uses `APP_PUBLIC_URL`, works, respects `PASSWORD_RESET_EXPIRES_IN` | Reset completes end-to-end |
| Normal delivery | No delay/queueing issue under one real send | Delivery timestamp reasonable |
| Invalid recipient / provider failure | Failure is logged (best-effort by design, per architecture docs — never blocks the triggering request), no crash | Log line reviewed |
| No sensitive content in logs | Email body/token never appears in plain application logs | Log review |

---

## 5. Sentry activation procedure

Traced from `instrument.ts` (`enabled: !!dsn`) and `sentry-scrub.util.ts` (allowlist-based
`beforeSend`, already independently verified in this session's Admin Operator Tooling audit).

1. Create a Sentry project (or two, one per app).
2. Set `SENTRY_DSN` (backend, runtime env) and `NEXT_PUBLIC_SENTRY_DSN` (frontend, **build arg** —
   requires a rebuild) plus `SENTRY_ORG`/`SENTRY_PROJECT` if source-map upload is wanted.
3. Deploy/rebuild both apps.
4. **Backend test exception**: trigger any unhandled error (e.g., a deliberately malformed request
   to a route with no input validation, or a temporary debug endpoint removed immediately after) —
   confirm it reaches the global `http-exception.filter.ts` and appears in Sentry.
5. **Frontend test exception**: trigger a client-side error in a non-production-critical path,
   confirm it appears in Sentry with the correct environment/release tag.
6. **Privacy sentinel**: before trusting the pipeline, send one deliberate test event carrying a
   sentinel value in a field the scrubber should redact (e.g., an `extra` key not on
   `ALLOWED_METADATA_KEYS`) — confirm the captured event in the Sentry UI shows `[Redacted]`, not
   the sentinel. **Do not send real user PII to test this** — use a synthetic sentinel string only.
7. **Scheduler/error capture**: confirm `notifications-scheduler.service.ts`'s existing
   `Sentry.captureException` calls (tagged `scheduler`) appear correctly tagged in the Sentry UI on
   the next real or forced scheduler run.
8. **Payment webhook capture** (new this pass, §10 below): trigger one deliberately rejected
   webhook (e.g., replay an old signed payload after rotating the checksum key in a non-production
   environment) and confirm it appears in Sentry tagged `payment: webhook`, with only `orderId`/
   `reason` in `extra` — no raw payload, no checksum, no checkout URL.
9. **Release/environment verification**: confirm the captured events carry the correct `release`
   and `environment` tags (Sentry SDK defaults; not customized further in this codebase — verify
   they're populated, not blank).

---

## 6. PostHog activation procedure

Traced from `lib/analytics.ts` (frontend) and `AnalyticsModule`'s sink factory (backend, `NoopAnalyticsSink`
absent a key). Client events never hold a third-party key directly — they always post to this
app's own `/analytics/events` endpoint first, which alone decides whether to forward.

1. Create a PostHog project, obtain the project key.
2. Set `POSTHOG_API_KEY` (backend runtime env), confirm `POSTHOG_HOST` matches the project's region.
3. Deploy.
4. **Minimal production smoke**, in the funnel order the roadmap's own analytics architecture is
   designed around: `landing_view` → `signup_started` → `onboarding_started` → `dashboard_viewed` →
   `discover_viewed` (or a Discovery-system-specific `*_started` event) → `checkout_started` (do
   **not** complete a real checkout for this smoke alone — see §14, payment smoke is separately
   authorized).
5. **Verify provider receives only allowlisted properties**: check the PostHog UI's raw event
   payload for one captured event — confirm properties are limited to the bounded set in
   `AnalyticsEventProperties` (`feature`, `route` [pathname only], `resultStatus`, `source`,
   `premiumStatus`, `notificationCategory`, `spreadType`) — no free-text field, no birth data, no
   message content. **Do not send private test content** to verify this — the existing
   `whitelist:true, forbidNonWhitelisted:true` DTO on the backend already structurally prevents
   anything else from ever arriving; confirming the received event's shape is enough.

---

## 7. PayOS activation procedure (prepared, not executed)

**No real financial transaction is executed by this document.** Procedure prepared for when
explicit founder authorization exists.

1. Configure `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` with confirmed real production
   values (§7 of the readiness audit — authenticity must be confirmed by the founder/whoever holds
   the PayOS account, not inferred by engineering).
2. Confirm `PREMIUM_PRICE_VND` matches the approved price (§13 of the board above).
3. Set `PAYOS_MOCK_CHECKOUT=false` (already enforced by boot validation in production) and
   `PAYMENTS_ENABLED=true`.
4. Register the webhook URL (`{API_BASE_URL}/payment/webhooks/payos`) in the PayOS dashboard, only
   after the API domain is live over HTTPS.
5. **Verify signature path**: confirm `PaymentProviderRegistryService.get('payos').verifyWebhook()`
   rejects a payload signed with the wrong checksum key (can be tested against a
   non-production/sandbox environment without real money).
6. **Create checkout** (real or PayOS-sandbox, per whatever the founder authorizes): confirm a
   `PaymentOrder` row is created in `PENDING` status with the correct amount/currency.
7. **Successful payment**: complete the checkout via PayOS's real or sandbox flow.
8. **Webhook**: confirm the webhook arrives and is verified (signature valid, order found, amount/
   currency match).
9. **Entitlement**: confirm the order transitions `PENDING`→`PAID` and a `PremiumEntitlement` row is
   granted for the paying user (already proven correct by direct code read + the existing test
   suite this pass ran fresh, §17).
10. **Duplicate webhook**: manually replay the identical webhook payload (or wait for PayOS's own
    retry behavior) — confirm it's a safe no-op (`payment.webhook.duplicate` log line, no second
    entitlement grant) — already proven by the existing idempotency test suite, re-confirm live.
11. **Page refresh**: reload the checkout-return page after the webhook has landed — confirm the UI
    reflects the real, current order status (not a stale client-side assumption).
12. **Account history/admin lookup**: use the Admin Operator Tooling's payment lookup (already
    closed and verified in this session's prior work) to confirm the real order/entitlement appear
    correctly for the paying user.

**Rollback**: `PAYMENTS_ENABLED=false` — verified by direct code read
(`payment-webhook.service.ts`'s own doc comment, `PaymentCheckoutService`) that this flag is
checked at checkout **creation** time only; already-created orders continue to receive and process
webhooks normally (a payment in flight when the switch flips must not be orphaned). Confirmed this
correctly removes/disables purchase entry points: the checkout-creation code path is gated by this
flag (not independently re-read line-by-line this pass beyond the webhook service's own doc
comment referencing it — recommend a direct read of `PaymentCheckoutService` before relying on this
in a real incident, since this pass's evidence for the *creation-side* gate is the webhook service's
comment about it, not a first-hand read of the checkout service itself).

---

## 8. Backup/recovery operational checklist

Turned from the readiness audit's finding (no backup documentation exists) into an operational
checklist, not new infrastructure:

| Item | Status | Action |
|---|---|---|
| Backup owner | Undecided | Founder/Ops names an owner once hosting is chosen |
| Backup mechanism | Undecided | Most managed Postgres providers (RDS, Neon, Supabase, Railway, etc.) offer automated backups — confirm the chosen provider's offering, enable it |
| Retention | Undecided | Provider-dependent default (commonly 7–30 days) — confirm matches the payment-record retention decision (§27 above); do not let the two silently mismatch |
| Restore test | Never performed | Perform at least once before launch — restore to a scratch environment, confirm data integrity |
| Migration rollback strategy | Documented (`production-deployment-runbook.md` §13) | Re-read before any rollback: API/frontend images are stateless and safe to roll back independently; a migration that dropped/renamed a column is not safe to roll back past without confirming data compatibility first |
| Recovery evidence | None yet | Document the restore test's result once performed |

**Not built this pass**: no custom backup infrastructure — the hosting provider's own offering is
the right mechanism once chosen, per this task's explicit instruction not to build backup infra the
repo doesn't already own.

---

## 9. Go-live smoke suite

Execution order. Payment is excluded until explicit financial-test authorization (§7 above).

| # | Action | Expected result | Pass evidence | Rollback if failed |
|---|---|---|---|---|
| 1 | `GET /health/live` | 200 | HTTP response | Investigate process, do not proceed |
| 2 | `GET /health/ready` | 200, `{database:"ok", redis:"ok"}` | HTTP response body | Check DB/Redis connectivity, do not proceed |
| 3 | Load landing page | Renders, correct title/canonical | Visual + `view-source` check | Investigate build/deploy |
| 4 | Register | Real account created, redirected to onboarding | DB row exists | Investigate auth/validation |
| 5 | Email verification | Real email arrives, link verifies | Inbox + DB `emailVerifiedAt` set | Investigate email provider (§4) |
| 6 | Login | Session cookie set correctly (`Secure`, correct domain) | Devtools cookie inspection | Investigate cookie config (§6/§7 of domain plan) |
| 7 | Onboarding | Completes, reaches dashboard | UI + DB `onboardingCompletedAt` set | Investigate onboarding flow |
| 8 | Dashboard | Loads, no error | Visual | Investigate |
| 9 | Tarot | Real deterministic draw completes | UI shows card, DB row persists | Investigate discovery engine |
| 10 | Numerology | Real calculation completes | UI + DB row | Investigate |
| 11 | Natal Chart | Real chart calculates (needs geocoding — confirm Nominatim reachable from prod) | UI + DB row | Investigate geocoding connectivity |
| 12 | Eastern Horoscope | Real calculation completes | UI + DB row | Investigate |
| 13 | Personal Destiny Report | Generates (requires Natal Chart + Numerology already done) | UI shows `READY` status | Investigate report generation pipeline |
| 14 | Companion | Real AI response returns | UI shows a real, non-mock response | Investigate `DEFAULT_AI_PROVIDER` config |
| 15 | Notifications | At least one real notification renders (e.g., from Tarot draw) | UI notification center | Investigate |
| 16 | Account export | Downloads a real data export | File contains real user data | Investigate export service |
| 17 | Admin lookup | Real user lookup via Admin Operator Tools succeeds (already closed/verified — re-confirm live) | UI shows real data | Investigate |
| 18 | Analytics | One real event reaches PostHog (§6) | PostHog UI | Investigate key config |
| 19 | Sentry | One real captured, scrubbed event (§5) | Sentry UI | Investigate DSN config |

---

## 10. Payment-Sentry gap — verification and remediation

**Independently re-verified from source this pass** (not assumed from the prior audit): read
`apps/api/src/payment/webhook/payment-webhook.service.ts` in full. Confirmed **TRUE** — every
rejection path (`audit()`, the single choke point signature failures/unknown-order/amount-mismatch/
currency-mismatch all flow through) previously called only `this.logger.warn(...)` and wrote a
best-effort `PaymentWebhookEvent` DB row — zero `Sentry.captureException`/`captureMessage` calls
anywhere in the file.

**Fix implemented** — the smallest safe change: one `Sentry.captureMessage` call added inside the
existing shared `audit()` method (no new call sites needed, since every rejection already funnels
through it):

```ts
Sentry.captureMessage('payment.webhook.rejected', {
  level: 'warning',
  tags: { payment: 'webhook', reason: errorCategory },
  extra: { orderId: orderId ?? undefined },
});
```

Wrapped in its own `try/catch` (stricter than the notification scheduler's existing equivalent
call, which doesn't wrap) specifically so a Sentry-side failure can never mask the caller's own
`BadRequestException` or block the (also try/caught) DB audit-row write.

**Requirements verified:**
- Captures only actual webhook-processing failures (the `audit()` method's existing 6 rejection
  categories: `PROVIDER_UNAVAILABLE`, `INVALID_SIGNATURE`, `MALFORMED_PAYLOAD`, `UNKNOWN_ORDER`,
  `AMOUNT_MISMATCH`, `CURRENCY_MISMATCH`) — nothing on the happy path.
- Existing HTTP/idempotency behavior unchanged — the diff is additive-only inside `audit()`; no
  control-flow, return-value, or transaction change anywhere else in the file.
- Never sends the raw webhook body, the PayOS checksum/signature, a checkout URL, or user PII —
  only `orderId` (an opaque identifier, already on `sentry-scrub.util.ts`'s `ALLOWED_METADATA_KEYS`
  allowlist) and `errorCategory` (one of 6 fixed category strings, also allowlisted as `reason`).
  The free-text `detail` parameter is deliberately **not** sent, even though currently safe, to
  avoid future drift risk.
- Uses the existing Sentry abstraction (`import * as Sentry from '@sentry/nestjs'`, same pattern as
  `notifications-scheduler.service.ts`).
- A Sentry failure never breaks webhook processing — proven by a dedicated test that makes
  `Sentry.captureMessage` throw and asserts the DB audit row is still written and the caller still
  receives its `BadRequestException`.

**Tests added** (`payment-webhook.service.spec.ts`, new `describe` block "Sentry visibility on
rejection", 7 new test cases): invalid-signature/unknown-order/amount-mismatch rejections each
report to Sentry with the correct tag/extra shape; a dedicated adversarial test injects a fake
checksum/checkout-URL/email into the raw webhook payload and asserts none of it appears anywhere in
the serialized Sentry call, and that the call's own shape is exactly `{level, tags, extra}` with
`extra` containing only `orderId`; a happy-path test confirms zero Sentry calls on success; two
failure-isolation tests confirm a throwing `Sentry.captureMessage` doesn't break the current
delivery's own processing or a subsequent, unrelated delivery. **Test run status: see §17 below.**

---

## 11. Privacy Policy factual-drift finding (for legal/founder review, no legal language invented)

| Current claim | Actual product behavior | Required legal update |
|---|---|---|
| "Deleting your account immediately removes your Companion conversations, Memory, Journal entries, and Discovery readings (Tarot, Numerology, Natal Chart)" | `AccountDeletionService` (verified by direct code read) also deletes `DestinyReport` (Sprint 16, Personal Destiny Report) and `EasternHoroscopeProfile` (Sprint 17) rows — the code is more protective than the copy claims, not less | Add "Eastern Horoscope readings" and "Personal Destiny Reports" to the illustrative list |
| No mention of analytics tracking anywhere in the notice | Sprint 13 added a localStorage-based anonymous analytics identifier (not a cookie — the existing "we don't set marketing or tracking cookies" claim is technically still accurate) | Disclose that anonymous, non-cookie analytics tracking exists, even though it isn't a "cookie" — omission risk, not a false-statement risk |
| No mention of Sentry/error-monitoring | Sentry integration exists in code (currently inactive, no DSN) | Once activated (§5), disclose that error monitoring exists and that the notice's own scrubbing/privacy claims apply to it too |
| No mention of the payment processor by name | PayOS is the real, only payment processor | Name PayOS explicitly once real credentials/policy are finalized (§25–27) |

**Not fixed this pass** — writing replacement legal-adjacent copy without founder/legal review would
risk looking more authoritative than the page's own honest "Sprint 1 placeholder" framing warrants.
Handed to legal/founder as concrete before/after facts, not vague "review this page."

## 12. Terms factual-drift finding

**None found.** The Terms page's two substantive sentences (not-medical-advice/crisis-line
disclaimer; good-faith-use clause) remain accurate against current product behavior — nothing in
this session's audit or this pass's own re-check found drift here.

---

## 13. Go / No-Go gate

**Hard NO-GO conditions** (any one of these blocks activation):

- `/health/live` or `/health/ready` fails.
- Auth/session flow fails (register, login, refresh, or logout doesn't work correctly).
- Insecure cookie or CORS behavior observed (missing `Secure`, wrong `SameSite`, or a permissive
  CORS origin with `credentials: true`).
- Migrations not current (`prisma migrate status` shows pending migrations against the production
  DB).
- Email unusable (no real provider connected, or the smoke test in §4 fails).
- Legal docs absent (Privacy Policy/Terms still show "Sprint 1 placeholder").
- Payments enabled without verified real PayOS config (§7's items 1–3 not all confirmed).
- Payment signature verification or idempotency fails under test (already proven correct by the
  existing + newly-added test suite — a NO-GO would mean a *regression* was introduced, not the
  current known-good state).
- Sensitive data observed in a real Sentry or PostHog event during the smoke tests (§5/§6).
- Any unresolved Blocker/Critical/High from any of this session's audits.

---

## 14. Sprint 18 / Tử Vi

Confirmed unchanged and untouched by this pass: `BLOCKED_BY_DOMAIN_REFERENCE`. No file under any
Tử Vi-related path (school decision, giờ Tý, Mệnh/Thân, Cục, Tử Vi anchor, 14 chính tinh, phụ tinh,
Tuần/Triệt, Tứ Hóa, golden vectors) was read or modified — confirmed via `git diff --stat` showing
only `apps/api/src/payment/webhook/payment-webhook.service.ts`, its spec file, and this pass's two
new docs. Current-product activation, once complete, does **not** constitute or imply Product
Complete — that remains gated on the Tử Vi track independently, per the roadmap's own §7.

**STATUS SUPERSEDED — 2026-08-22:** the `BLOCKED_BY_DOMAIN_REFERENCE` line above (and the §-line-4
verdict at the top of this document, `PRODUCT COMPLETE BLOCKED BY TỬ VI DOMAIN TRACK`) predate the
Tử Vi engine actually shipping. The school decision (DECISION-01 → `VDTTL_1956`) and auxiliary-star
scope decision (DECISION-08 → `CORE_13`) were founder-resolved in Sprint 18A, and the full
deterministic engine, persistence, AI interpretation, and frontend (Sprint 18B.1–18B.12) shipped and
closed — verified this pass against current `HEAD = origin/master = c3760dc` (working tree clean),
freshly-run: 338/338 engine unit tests, 1546/1546 backend unit, 342/342 backend e2e, 479/479 frontend
unit, lint/typecheck/both builds clean, and the full Playwright golden-vector/accessibility/
responsive suite passing. Full evidence: `docs/progress/sprint-18b-final-report.md`,
`docs/progress/sprint-18b12-runtime-qa-final-report.md`, and
`docs/product/product-completion-roadmap-v2.md` §12.

**This does not flip the Go/No-Go gate (§13) or close Product Complete** — every other item on the
Activation Board (§1: payment, DNS/TLS, production DB/Redis, email, Sentry, legal docs) remains
exactly as tracked, all business/ops-owned externals, none touched by the Tử Vi engine landing.
What changes is narrower: Tử Vi is no longer the reason Product Complete is blocked on the
*engineering* side. Two Tử Vi-specific gaps remain genuinely open and are not part of this
activation checklist's scope (tracked in the roadmap doc instead): Đại Hạn/Tiểu Hạn/Lưu Niên (vận
cycles, DECISION-12, `UNSOURCED`) and Miếu/Vượng/Đắc/Hãm (star brightness, DECISION-11, open founder
scope call) — both deliberately deferred, not implemented from memory.
