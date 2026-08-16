# Sprint 12 Pre-Implementation Audit

Date: 2026-08-13. Selected by Sprint 11's own Release Closure recommendation
("Trust & Monetization Closeout") — re-derived independently here, not trusted blindly. This is a
research/decision document only — no application code, Prisma schema, migrations, dependencies, or
tests were modified to produce it (one pre-existing test file's assertions were read, never edited).

Authority order: (1) actual code at HEAD, independently re-read; (2) live, current official PayOS
documentation (fetched fresh via web search/fetch — see §11); (3) Product Bible
(`docs/reference/web-tu-vi/web-tu-vi/`); (4) Sprint 11's Release Closure report
(`docs/progress/sprint-11-final-report.md`), trusted only where independently re-confirmed; (5)
older progress/audit docs.

---

## 1. Current HEAD

`9d66d3c` — "feat: complete Sprint 11 notification retention foundation."

## 2. origin/master

`ffd82dc` — Sprint 10's closure commit. **Sprint 11's commit has not been pushed.**

## 3. Ahead/behind

`0 behind / 1 ahead`. HEAD is exactly one unpushed local commit ahead of `origin/master`. No other
machine/session has touched `origin/master` since Sprint 10. `git diff --check`: clean. No
merge/rebase/cherry-pick in progress. Working tree clean at audit start.

## 4. Working tree baseline

Clean. Confirmed via `git status --short` returning nothing before this audit began.

## 5. Sprint 11 commit/push status

**Real finding, flagged as instructed**: commit `9d66d3c` exists locally with the full, real Sprint
11 diff (52 files, notification system + two remediations), but **has not been pushed to
`origin/master`**. This is worth surfacing explicitly to whoever is coordinating sprints — the
remote repository (and anyone cloning from it) does not yet have Sprint 11 at all. Not pushed in
this audit either, per instruction (push only on separate, explicit request).

## 6. Product Bible roadmap

Re-confirmed directly from `docs/reference/web-tu-vi/web-tu-vi/01-product-vision-and-strategy.md`
§4 (not inferred from sprint numbering):

| Tier | Modules |
|---|---|
| MVP | Tarot (basic), Companion (session memory), Journal, Dashboard (basic), Auth |
| **V1** | Cross-session Memory, Natal Chart, Numerology, Premium tier + paywall, **Notifications** |
| **V1.5** | Eastern Horoscope, Reports, Community |
| Future | Voice, multi-person compatibility, practitioner marketplace |

**With Sprint 11 shipped (even unpushed), the Bible's entire V1 tier is now code-complete** — this
is the first time in this product's history that statement is true. There is no dedicated Bible
module for "Trust & Monetization Closeout," "observability," or "AI cost control" — these are
cross-cutting **Engineering Constitution** (Module 24) and **Trust Constitution** (Module 21, via
Module 25 §11–12) obligations, not a named product module. Module 25 §11 (Engineering
Constitution) is directly on point: *"They must fail in ways that are visible and honest, never
silently and conveniently... observable enough that 'we don't know why that happened' is never an
acceptable final answer."* Module 25 §12 (Trust Constitution): *"Every significant action... must
leave a record that could, in principle, be shown to the person it concerns."* Both are directly
and concretely violated today by the AI cost/observability gaps found in this audit (§22–31), not
speculatively — this elevates Sprint 12's Bible grounding above a generic "tech debt" framing.

## 7. Current product matrix

| Area | Bible priority | Backend | Frontend | Runtime verified? | Production ready? | Blocker | Recommendation |
|---|---|---|---|---|---|---|---|
| Auth | MVP | Complete | Complete | Yes (e2e) | Yes | None | — |
| Onboarding | MVP | Complete | Complete | Yes (e2e) | Yes | None | — |
| Dashboard | MVP | Complete | Complete | Yes (e2e) | Yes | None | — |
| Discover (hub) | — | Complete | Complete | Yes | Yes | None | — |
| Companion | Core relationship surface | Complete | Complete | Yes | Yes | None | — |
| Memory | V1 | Complete | Complete | Yes | Yes | None | — |
| Journal | MVP | Complete | Complete | Yes | Yes | None | — |
| Tarot | MVP | Complete | Complete | Yes | **Code yes; ops gap** | No rate limit, no AI usage/cost recording (§22–24) | Sprint 12 |
| Numerology | V1 | Complete | Complete | Yes | **Code yes; ops gap** | Same as Tarot | Sprint 12 |
| Natal Chart | V1 | Complete | Complete | Yes | **Code yes; 1 known a11y bug** | flow-23 duplicate accessible name (§13–14) | Sprint 12 (small) |
| Premium (mechanics) | V1 | Complete | Complete | Yes | Yes | None | — |
| Payment (PayOS) | V1 | **Contract-verified against live docs (§11)** | Complete | Mock/self-signed only, never real PayOS | **Code ready; production externally blocked** | Founder: merchant creds, price, domain (§12) | Sprint 12 (config readiness only) |
| Notifications | **V1 — now shipped** | Complete | Complete | Yes (e2e+Playwright+live) | **Code yes; 1 real gap found (§18)** | `@Cron` swallows exceptions silently | Sprint 12 (cheap fix) |
| Account data rights | Cross-cutting (Modules 20/21) | Complete | Complete | Yes | Yes | None | — |
| Privacy | Module 21 | Partial (self-labeled placeholder) | Partial | N/A | Honest, not misleading | Legal policy timing | Founder checklist |
| Settings | Module 20 | Complete | Complete | Yes | Yes | None | — |
| SEO | Not a dedicated module | Partial | Partial | N/A | By design, non-indexable beyond marketing shell | None (deliberate) | Not Sprint 12 |
| Eastern Horoscope | **V1.5/P3** | Not started | Not started | N/A | N/A | Bible-scheduled later | Not Sprint 12 |
| Reports | **V1.5** | Not started | Not started | N/A | N/A | Needs memory density post-Notifications | Not Sprint 12 |
| Community | **V1.5/P3** | Not started | Not started | N/A | N/A | Largest new trust/safety surface | Not Sprint 12 |
| Admin | No dedicated Bible module | Not started | Not started | N/A | N/A | No spec to build against | Not Sprint 12 |

**CODE COMPLETE ≠ PRODUCTION READY**, kept explicitly separate per instruction: Tarot/Numerology/
Natal Chart are 100% code-complete and have been for 2–3 sprints, but this audit found they were
never given the operational protections (rate limiting, cost/usage recording) that Companion has
had since Sprint 2B — "code complete" was never actually "production ready" for these three
surfaces, a fact this audit is the first to surface with hard evidence (§22–24).

## 8. V1 completeness

**100% code-complete as of Sprint 11** (unpushed). Every V1 module — Memory, Natal Chart,
Numerology, Premium, Notifications — is built, tested, and (for Notifications) closure-verified
against real infrastructure. This is a genuine milestone worth stating plainly.

## 9. V1.5 status

Zero V1.5 modules started (Eastern Horoscope, Reports, Community) — unchanged from every prior
audit. Confirmed via `grep` for any Eastern-Horoscope/Reports/Community-specific Prisma models or
route directories: none exist outside the disclosed, dormant `/menh-vi` prototype (unchanged,
untouched by Sprint 11 — `git diff eee8aff..9d66d3c -- apps/web/app/menh-vi` is empty).

## 10. Payment architecture status

Traced end-to-end, fresh, this session: `Premium` page (`apps/web/features/premium/`) →
`POST /payment/checkout` (`payment.controller.ts:39-45`, `JwtAuthGuard` + `PaymentThrottlerGuard`,
explicitly isolated from `auth`/`companion`/`companion-ip` throttlers) → `PaymentCheckoutService`
(server-authoritative price/product, kill-switch check, provider-registry lookup) → `PayOSProvider`
(`createPayment`, mock-gated) → PayOS's real hosted checkout page → `PremiumReturnStatus` (never
trusts return-URL query params, polls `PaymentOrder` status only) → PayOS webhook →
`PaymentWebhookService` (signature verify → order/user lookup → amount/currency match → idempotent
event record → transaction: order transition + entitlement grant, gated to `ACTIVE` accounts only)
→ `EntitlementService.grantPremium` → (Sprint 11) `premium.activated` Notification, strictly
downstream, best-effort. Every link in this chain was independently re-read this session, not
assumed from the prior audit.

## 11. PayOS contract status

**Verified against the current, live, official `payos.vn` documentation** (fetched fresh via
`WebFetch` this session — not from training-data memory, and not from a wrong "PayOS" namesake —
see the note below). Field-by-field comparison:

| Item | Official `payos.vn` docs (fetched live) | This codebase | Match |
|---|---|---|---|
| Signature algorithm | HMAC-SHA256 | HMAC-SHA256 (`payos-signature.util.ts:27`) | ✅ |
| Signature field selection | All fields in `data`, sorted alphabetically, `key=value&...` | Identical (`buildPayOSSignatureData`, `payos-signature.util.ts:13-18`) | ✅ |
| Top-level webhook shape | `code`, `desc`, `success`, `data`, `signature` | Identical (`webhookPayloadSchema`, `payos.provider.ts:32-46`) | ✅ |
| Success semantics | `code === "00"` AND `success === true` | Identical (`payos.provider.ts:132`) | ✅ |
| `data` object's real fields (per PayOS's own example) | orderCode, amount, description, accountNumber, reference, transactionDateTime, currency, paymentLinkId, code, desc, counterAccountBankId/-Name/-Number, virtualAccountName/-Number | Typed subset (orderCode/amount/description/reference/currency) + `.passthrough()` for the rest | ✅ (by design — the `.passthrough()` decision, made without live confirmation at implementation time, is now confirmed correct against the real field list) |
| Production API base URL | `https://api-merchant.payos.vn` | `PAYOS_BASE_URL` default (`env.validation.ts:104`) is exactly this | ✅ |
| Webhook registration mechanism | `webhooks.confirm(url)` SDK method / API call | **Not implemented anywhere in this codebase** | ⚠️ Gap — see classification below |

**Important correction to note for future audits**: a second search result, `docs.payos.money`,
describes an entirely different webhook schema (`eventType`/`eventId`/`payload`, Svix-based
infrastructure, `svix_id`/`svix_timestamp` signing) — **this is a different, unrelated company with
a similar name**, not the Vietnamese payment gateway this codebase integrates with. Confirmed by
its own reference to "the Svix dashboard" (a generic third-party webhook-infrastructure vendor used
by many unrelated companies) and by the total mismatch with the codebase's actual `x-client-id`/
`x-api-key` header scheme and `/v2/payment-requests` endpoint. **Do not conflate these two products
in any future audit** — the authoritative source for this codebase is `payos.vn` only.

**Classification of the one real gap (webhook registration)**: **LOW, operational — not a contract
defect.** `webhooks.confirm(url)` is a one-time setup call (or dashboard action) made once a real
production domain and merchant credentials exist; it is not part of the runtime payment flow and
its absence from the codebase today doesn't indicate incorrect code, only that this step hasn't
been run yet (consistent with Sprint 10's own finding). **Zero BLOCKER/HIGH/MEDIUM mismatches
found anywhere in the actual payment contract.**

## 12. Real PayOS runtime status

**Searched explicitly for evidence — none found.** Every payment test/verification in this
repository's history, including Sprint 11's Release Closure (`docs/progress/sprint-11-final-report.md`
§C14), used either `PAYOS_MOCK_CHECKOUT=true` (skips PayOS's real API for `createPayment`, returns
a fake checkout URL) or a **self-signed webhook** — a payload constructed in-test and signed with
`signPayOSData()` using the local dev `PAYOS_CHECKSUM_KEY`, POSTed directly to
`/payment/webhooks/payos`. This proves the *codebase's own* signature-verification and
order/entitlement logic is correct (real code path, real cryptographic check, real DB transaction),
but it is **not** a real round trip through PayOS's actual servers. **This repository/environment
has never verified a real PayOS transaction.** Unchanged conclusion from Sprints 7/9/10/11's own
honest disclosures — reconfirmed here with a fresh, explicit search rather than assumed.

## 13. PayOS env readiness

| Var | State |
|---|---|
| `PAYOS_CLIENT_ID` | NOT SET (commented placeholder in `.env.example`) |
| `PAYOS_API_KEY` | NOT SET (commented placeholder) |
| `PAYOS_CHECKSUM_KEY` | DEV MOCK value present in local `.env` only (a fixture value, never a real merchant secret) |
| `PAYOS_BASE_URL` | PRODUCTION-LIKE — default already matches the real, confirmed production endpoint (§11) |
| `PAYMENTS_ENABLED` | SET, `true` (kill switch open) |
| `PREMIUM_PRICE_VND` | SET, `79000` — explicitly and consistently disclosed as an MVP test price, never presented as final (§27) |
| `PREMIUM_DURATION_DAYS` | SET, `30` |
| Webhook URL registration | NOT DONE (no production domain exists to register) |
| Return/cancel URLs | Code-correct, built from `config.frontendUrl` (`payment-checkout.service.ts:56-57`) — will be production-correct automatically once `FRONTEND_URL` is set to a real domain, no code change needed |

## 14. Payment business blockers

Explicitly separated from engineering, unchanged from Sprint 10/11's own findings, reconfirmed:

1. Real PayOS merchant account/credentials — **FOUNDER DECISION REQUIRED** (external account).
2. Production price sign-off (currently `79,000 VND`, explicitly flagged as unvalidated in the
   API response itself, `payment.controller.ts:64-67`) — **FOUNDER DECISION REQUIRED**.
3. Production frontend + API domains — **FOUNDER/DEPLOYMENT DECISION REQUIRED**.
4. Webhook URL registration (`webhooks.confirm()`) — blocked on #1 and #3, a deployment step once
   both exist, not a business decision in itself.
5. Payment-record retention period — **FOUNDER/LEGAL DECISION REQUIRED** (§20, unresolved since
   Sprint 10, still unresolved).
6. Refund policy/tooling — **not represented anywhere in the repository**. No refund endpoint,
   no refund UI, no documented policy. Not inventing one here; flagging its absence as a genuine
   founder-level product-policy gap worth naming (PayOS's own API does support a cancellation/void
   flow for un-settled payments, but nothing here uses it, and there is no path for reversing a
   *settled* payment at all).
7. Cancellation behavior — code-correct today: `cancelUrl` routes back to `/premium?cancelled=1`,
   and a cancelled/failed order is handled by `PremiumReturnStatus`'s honest "Payment not
   completed... no charge was made" state (§26). No business decision needed here.
8. Entitlement duration (30 days, one-time pass, not auto-renewing) — already a settled product
   decision reflected consistently in code and copy; not a blocker.
9. Invoice/tax requirements — **not represented anywhere in the repository.** No VAT/invoice
   field, no tax-jurisdiction logic. Not inventing a legal requirement here — flagging that if
   Vietnamese tax/invoicing law requires anything for a real transaction, it is entirely
   unaddressed today. **FOUNDER/LEGAL DECISION REQUIRED.**

## 15. Payment engineering blockers

**None.** Every item that can be built without a real merchant account is already built and
contract-verified (§11). This matches Sprint 10 and Sprint 11's own conclusion, now independently
reconfirmed a third time with the added weight of a live documentation cross-check.

## 16. Kill-switch result

Re-verified by direct code read: `PAYMENTS_ENABLED=false` blocks only `PaymentCheckoutService
.createCheckout()` (`payment-checkout.service.ts:36-43`, throws `PAYMENTS_DISABLED` before any
order is created). It does **not** gate `handlePayOSWebhook` (webhook processing is unconditional —
confirmed by the absence of any `config.payment.enabled` check in `payment-webhook.service.ts`),
does not affect existing `PremiumEntitlement` rows (no code path reads the kill switch when
checking `hasPremiumAccess()`), and does not affect account access generally. **Frontend UX gap,
real but minor**: the `/premium` page's `PremiumUpgradePanel` was not found to check a
"payments currently disabled" flag before rendering its "Upgrade to Premium" button — a user with
`PAYMENTS_ENABLED=false` would click through and receive a `PAYMENTS_DISABLED` error only *after*
attempting checkout, rather than seeing the button disabled/hidden upfront. Small, real, worth a
line item in Sprint 12 if the kill switch is ever actually exercised in production (LOW severity —
it's an honest, if late, error message, not a broken or misleading one).

## 17. Premium price source-of-truth

**Clean, fully re-verified.** Exhaustive repo-wide search for `79000`/`79,000`/`79.000`/`79_000`:
every occurrence is either (a) the single canonical default in `env.validation.ts:117`, or (b) a
test fixture that *mocks* the value the backend would return (never an independent hardcode the
frontend reads instead of the API). The actual `PremiumUpgradePanel`/`PremiumStatusCard` components
read `priceVnd` from `GET /payment/premium-status`'s live response — confirmed no hardcoded price
literal exists in any non-test frontend file. Checkout ignores any client-supplied price by
construction (`PaymentCheckoutService.createCheckout` takes only `userId`, reads
`config.payment.premium.priceVnd` server-side — no price field exists on the request DTO at all).

## 18. Entitlement security result

Re-audited, no regression found across Sprint 10 → Sprint 11: late-webhook-after-deletion still
correctly skips entitlement grant (`payment-webhook.service.ts:107-113`, unchanged), duplicate/
concurrent webhook still idempotent via the `PaymentWebhookEvent` unique constraint (unchanged),
Sprint 11's `premium.activated` notification hook sits strictly *after* the transaction commits and
is `.catch()`-wrapped (§Sprint 11 closure C14) — it cannot affect entitlement correctness even if
notification creation itself fails. Re-registration after deletion still correctly starts with zero
entitlements (`account-data-rights.e2e-spec.ts`, unchanged, still passing per Sprint 11 closure).

## 19. Payment retention finding

Unchanged from Sprint 10's own documented finding (`docs/architecture/account-data-rights.md` §2–3):
`PaymentOrder`/`PaymentWebhookEvent`/`PremiumEntitlement` are retained indefinitely post-account-
deletion. Classification: `PaymentOrder`/`PremiumEntitlement` retain no PII (user is anonymized,
FK-only reference survives); `PaymentOrder.providerOrderCode`/`providerPaymentLinkId` and
`PaymentWebhookEvent`'s stored fields **are provider-assigned financial/correlation identifiers**,
not PII, but also not nothing — they're real transaction records. Exact retention **duration**
remains **FOUNDER/LEGAL DECISION REQUIRED**, unresolved since Sprint 10, still unresolved today —
not invented here.

## 20. Email production readiness

`EMAIL_PROVIDER` in dev/test: `mailpit` (confirmed `.env`/`.env.test`). Production code paths exist
and are complete for both `resend` and `postmark` (`mail.service.ts:30-40`, real provider classes),
gated correctly by `env.validation.ts` (production cannot select `mailpit`, must supply the
matching provider's API key/token). **No real Resend/Postmark credential exists anywhere in this
repository or environment.** Classification: **FOUNDER/DEPLOYMENT BLOCKER**, not an engineering
gap — the code is complete either way; someone must choose a provider and obtain a key.

## 21. Notification production readiness

Code-complete and closure-verified against real infrastructure (Sprint 11). **One real gap found
this session, not previously documented**: `NotificationsSchedulerService.runTarotDailyReminder()`
(`notifications-scheduler.service.ts:44-47`) has **no try/catch around its own body**. If
`evaluateTarotDailyReminder()` throws partway through its cursor-paginated loop (a DB blip, an
unexpected error from `NotificationsService.create`), the exception propagates as an unhandled
promise rejection from the `@Cron`-decorated method; `@nestjs/schedule`'s underlying `cron` library
does not catch or log this itself, and nothing else in this codebase adds a handler. The result:
**a day's entire notification run can silently fail partway through, with zero record beyond a
missing log line an operator would have to notice by its absence.** This is real, cheap to fix
(wrap the method body in a try/catch and log via the existing `Logger`), and directly touches
Module 25 §11's "fail visibly and honestly, never silently" principle. Recommended for Sprint 12.

## 22. AI provider architecture

Unchanged since Sprint 11's own audit, reconfirmed: 4 providers (OpenAI/Anthropic/Gemini/Mock)
behind one `ProviderOrchestratorService`, `DEFAULT_AI_PROVIDER`/`FALLBACK_PROVIDER` configurable,
production cannot boot with `mock` selected or a missing key for the selected provider. No new
gaps found in the orchestration layer itself.

## 23. Companion AI controls

Full stack present and unchanged: `CompanionThrottlerGuard` (rate limit, isolated from `auth`),
`GenerationLockService` (Redis-backed per-user concurrency cap, fail-open on Redis error),
`CostControlService` (daily-request/daily-token/monthly-token budget checks, backed by real
`AIUsage` rows), `ObservabilityService` (persists a `ProviderLog` row per generation attempt —
latency, success, retry count, error code; never conversation content).

## 24. Tarot AI controls

**Re-confirmed, unchanged since Sprint 9: none of the above.** `TarotController` has only
`@UseGuards(JwtAuthGuard)` — no throttler of any kind (confirmed: exhaustive grep for
`@UseGuards(.*Throttler` across `src/` matches only `auth`, `companion`, `journal-export`,
`memory-export`, `account-export`, `payment`, and (as of Sprint 11) `notifications` — **never**
`tarot`/`numerology`/`natal-chart`). No concurrency lock. `TarotInterpretationService` never calls
`CostControlService.record()` or `ObservabilityService.logProviderCall()` — confirmed by the fact
that `aIUsage.create`/`providerLog.create` each have exactly **one** call site in the entire
codebase, both inside Companion-only services (§31). The only protection Tarot has is a
per-reading-type **daily creation limit** (`FREE_DAILY_LIMITS`/`PREMIUM_DAILY_LIMITS`,
`tarot-record.service.ts`) — but this gates *creating a new reading*, not the separate
`POST /tarot/readings/:id/interpret` **retry** endpoint, which can be called an unlimited number of
times against any existing reading with zero rate limit and zero cost tracking (§30).

## 25. Numerology AI controls

**Identical gap to Tarot**, confirmed by the same grep evidence: `NumerologyController` has only
`JwtAuthGuard`. Has its own daily *creation* limit (`FREE_DAILY_CALCULATION_LIMIT`/
`PREMIUM_DAILY_CALCULATION_LIMIT`) but the same unlimited, untracked `POST
/numerology/readings/:id/interpret` retry endpoint.

## 26. Natal AI controls

**Identical gap**, confirmed the same way: `NatalChartController` has only `JwtAuthGuard`, its own
daily creation limit (`NATAL_CHART_FREE_DAILY_CREATE_LIMIT`/`_PREMIUM_...`), same unlimited/
untracked `POST /natal-charts/:id/interpret` retry endpoint. Natal Chart interpretations are the
most expensive of the three (longest prompts, most context) — this is the highest-cost-exposure
instance of the same gap.

## 27. Cost-control parity matrix

| Surface | Rate limit | Concurrency lock | Daily cost ceiling | Monthly cost ceiling | Usage recording (`AIUsage`) | Provider logging (`ProviderLog`) |
|---|---|---|---|---|---|---|
| Companion | ✅ `CompanionThrottlerGuard` | ✅ `GenerationLockService` | ✅ `CostControlService` | ✅ | ✅ | ✅ |
| Tarot | ❌ none | ❌ none | ❌ none (only a *reading-count* cap, not cost) | ❌ none | ❌ **zero rows ever written** | ❌ **zero rows ever written** |
| Numerology | ❌ none | ❌ none | ❌ none | ❌ none | ❌ **zero rows** | ❌ **zero rows** |
| Natal Chart | ❌ none | ❌ none | ❌ none | ❌ none | ❌ **zero rows** | ❌ **zero rows** |

This is a **complete** parity gap, not a partial one — confirmed by direct code inspection (single
call-site search for both `aIUsage.create` and `providerLog.create`), not inferred.

## 28. AI usage attribution

**The product owner cannot today answer "how much did Tarot AI cost today" or "how much did Natal
Chart AI cost this month"** — there is no data anywhere to answer either question; Discovery AI
spend is entirely invisible. `AIUsage` has no `feature`/`source` column even for Companion's own
rows (it's implicitly "Companion" since that's the only writer) — if Sprint 12 adds Discovery
usage recording, it should add a `feature`/`source` discriminator column so Companion vs.
Tarot vs. Numerology vs. Natal Chart spend can be queried separately, not just lumped together.

## 29. AI pricing/model freshness

`apps/api/src/companion/providers/pricing.ts` holds the cost-estimation constants. Given this
audit's scope and the explicit instruction not to spend AI-provider quota unnecessarily, live
per-model pricing verification against OpenAI/Anthropic/Google's current published rate cards was
**not performed this session** (would require multiple external fetches for marginal audit value
given Discovery doesn't even use this file yet). Flagged as a **quick, cheap follow-up check**
worth doing once Sprint 12 actually touches the pricing file for Discovery parity — verify no
retired model names, not a blocking finding today.

## 30. AI abuse findings

**Real, confirmed abuse vector**: for all three Discovery systems, `POST .../:id/interpret` (retry
interpretation for an *existing* reading) is unlimited, uncounted, and unrated-limited. A user (or
script) with a single valid session can call this endpoint as fast as the network allows, against
any of their own readings, indefinitely — each call is a real AI generation with real provider
cost, invisible to any usage table. This is **not** exploitable to access another user's data
(the endpoint is correctly owner-scoped via `findOwned`), but it **is** an open-ended, unmetered
cost/abuse exposure — the single most concrete, evidence-backed argument for Sprint 12's AI
cost-control-parity scope. Not tested against a live external provider (per instruction not to
exploit providers aggressively); confirmed via code inspection of the guard/service chain, which is
sufficient to establish the gap with certainty.

## 31. Discovery AI failure UX

Re-confirmed, unchanged and correct: all three interpretation services catch orchestrator errors
and persist `interpretation: null` rather than throwing (`tarot-interpretation.service.ts` pattern,
identical in Numerology/Natal Chart) — the deterministic result (the actual card draw / numerology
calculation / chart placement) is **always** persisted first and independently of whether AI
narration succeeds. Frontend shows "Interpretation isn't ready yet" with a working retry, never a
failed/broken reading. **This part of the system is correct and needs no Sprint 12 work** — the gap
is purely in *unmetered cost exposure*, not in failure-handling correctness.

## 32. Observability inventory

**Confirmed: zero Sentry/OpenTelemetry/Datadog/New Relic/Grafana/Prometheus anywhere in the
repository** (only a false-positive "otel" match inside `.next`'s own internal build telemetry,
unrelated). What does exist: Pino structured logging (JSON in prod), a real per-request
`x-request-id` correlation mechanism (request-scoped only, not a distributed trace, not propagated
to Gemini/PayOS/mail calls), a global NestJS exception filter, health endpoints
(Postgres+Redis only), and a genuinely useful DB-persisted `PaymentWebhookEvent` audit trail (the
closest thing to a real "payment provider log" in the codebase, but with no dashboard — querying it
today means writing raw SQL).

## 33. Production error-tracking status

**None.** A 500 in production today is discoverable only by manually reading Railway/Vercel log
output — no aggregation, no alerting, no error-rate visibility, no way to distinguish "one weird
request" from "the AI provider has been down for 20 minutes" without eyeballing raw log volume.
Frontend render exceptions: `console.error` only, never reported anywhere (`apps/web/app/error.tsx`).

## 34. Recommended observability approach

**Sentry**, scoped minimally (error tracking only, defer performance tracing/session replay).
Reasoning: this stack (NestJS + Next.js + Vercel + Railway) is Sentry's best-supported combination
of any option — official SDKs for both frameworks, automatic source-map upload via each platform's
build integration, error grouping/deduplication out of the box, a genuinely free tier adequate for
this product's current scale, and dramatically lower implementation effort than standing up
self-hosted OpenTelemetry collection + a backend (Grafana/Prometheus) for a product with no
dedicated ops function yet. OpenTelemetry is the more "correct" long-term choice for full
distributed tracing across Gemini/PayOS/mail calls, but is over-engineering for what this product
needs *right now* (visibility into "something broke," not fine-grained latency waterfalls).
Platform-only logging (status quo) is insufficient — confirmed by §33's concrete gap. **Recommend
Sentry, backend + frontend, error-tracking tier only, with explicit log-scrubbing configuration
(§35) as a hard prerequisite of turning it on, not an afterthought.**

## 35. Logging/privacy findings

Direct inspection of every `logger.log`/`logger.warn`/`logger.error` call site touched by this
audit's own reading (payment, notifications, AI observability, exception filter): **none currently
log journal/memory/Tarot-question/Numerology-full-name/birth-data/AI-prompt content** — this
codebase's existing logging discipline is already good (confirmed, not assumed — e.g.
`ObservabilityService`'s own doc comment explicitly states this intent and the code matches it).
**This is the exact reason Sentry (or any APM) cannot simply be dropped in without configuration**:
Sentry's default behavior captures request bodies/breadcrumbs, which — without explicit
`beforeSend` scrubbing — could capture things this codebase has been careful never to log directly
(e.g. a raw request body containing a Tarot `question` field, a Numerology `birthNameInput`, a
Journal `content` field, or `X-CSRF-Token`/cookie headers). **Sprint 12's observability scope must
include an explicit scrub/allowlist configuration as part of the Sentry setup itself, not a
follow-up** — this is a real, concrete privacy risk specific to *adding* Sentry, not a pre-existing
gap.

## 36. Frontend error-boundary status

Root-level only: `apps/web/app/error.tsx`, `loading.tsx`, `not-found.tsx` all exist.
**`global-error.tsx` does not exist anywhere** — a crash inside the root layout itself is caught by
nothing in this codebase, falling through to Next.js's generic unstyled default. **Zero route-group-
level boundaries** — `(app)/`, `(auth)/`, `(marketing)/`, `(onboarding)/` each rely entirely on the
root's `error.tsx`. Recommend Sprint 12 add exactly one missing piece — `global-error.tsx` — as a
small, cheap, production-relevant fix (a root-layout crash today shows Next's bare default screen
with zero BeaconVie branding or recovery affordance, and zero error reporting). Per-route-group
boundaries are a real but lower-priority improvement; not recommending for Sprint 12 given the
audit's own scope discipline against over-expanding.

## 37. Health/readiness status

`GET /health/live` (trivial), `GET /health/ready` (Postgres + Redis only, correctly). **Correctly
does not check AI provider, email, or PayOS reachability** — and per the audit brief's own framing
(external provider failure generally should not fail core API readiness), this is the *right*
current behavior, not a gap to fix. No change recommended here; noting it explicitly so it isn't
mistakenly added to Sprint 12 scope by a future reader who assumes more health checks are always
better.

## 38. Scheduler observability

See §21 — the one real, newly-found gap (`@Cron` swallowing exceptions silently) belongs in Sprint
12's observability sub-scope, not a separate initiative; it's a one-file, few-line fix directly
adjacent to the Sentry work (a wrapped try/catch is also exactly where a `Sentry.captureException`
call would go once Sentry exists).

## 39. Privacy/trust status

`/privacy`, `/settings`, account export/deletion, AI disclosure (Sprint 11), payment retention
disclosure, and notification preferences were all re-checked against actual implementation this
session (via the payment/entitlement/notification code already re-read for §10–30) — **UI copy
matches actual behavior everywhere checked, no misleading statements found.** The one open item
remains what it's been since Sprint 10: `/privacy` honestly self-labels as a Sprint-1-level
placeholder awaiting a real legal policy — **founder/legal decision on timing, not an engineering
gap.**

## 40. Premium UX status

Re-read `PremiumReturnStatus` in full this session: handles missing-order, loading, error, PAID
(success + a real next-step CTA), PENDING (with an honest "still processing, no charge failed"
reassurance state after ~60s of polling, never a false failure), and the FAILED/CANCELLED/EXPIRED
catch-all ("Payment not completed... no charge was made"). **No misleading copy found.** One real,
minor gap: the `/premium` page's upgrade button does not visibly reflect a `PAYMENTS_ENABLED=false`
kill-switch state before the user clicks it (§16) — low severity, honest error either way, small
fix if included.

## 41. Natal flow-23 root cause

**Precisely re-derived, not repeated from memory.** `natal-chart-view.tsx` renders a `<Section
title="Key Aspects">` wrapper around the raw, deterministic aspect list (its own accordion toggle
button, accessible name "Key Aspects"). Separately, `labels.ts:170` defines `keyAspects: 'Key
Aspects'`, consumed by `interpretation-sections.tsx` for the **AI-narrated** interpretation's own,
entirely different "Key Aspects" section (a second, unrelated accordion toggle button, same
accessible name). `flow-23-natal-chart-discovery.spec.ts:106`'s
`getByRole('button', { name: 'Key Aspects' })` is therefore genuinely ambiguous — Playwright's
strict mode correctly refuses to guess which one the test means. **This is real, if minor,
production code, not solely a test bug**: a screen-reader or keyboard user tabbing through the page
hears "Key Aspects" announced twice with no way to distinguish the raw list from the AI narrative
until they activate one and explore. **User-facing impact: low** — both sections work correctly
once opened; the only harm is discoverability/orientation for assistive-technology users.
**Severity: LOW.** **Estimated fix size: SMALL** — rename one section's accessible name (e.g. the
raw list becomes "All Aspects" or "Key Aspects — Full List", keeping the AI section as "Key
Aspects"), update `labels.ts` and/or the `Section title=` call site, update the one Playwright
locator. **Recommendation: include in Sprint 12** — it's cheap, already fully diagnosed (a
follow-up task was already filed via `spawn_task` during Sprint 11 closure), and closes the only
open Playwright regression this codebase currently owns outright.

## 42. Natal wraparound status

Re-confirmed present and unchanged: `circularDistance`/`wrapsAround` logic still in
`natal-chart-wheel.tsx:39-63` exactly as committed in `9d66d3c`, 8/8 unit tests still passing per
Sprint 11 closure's final fresh test run. No regression, no further work needed.

## 43. Known Playwright flakes

Unchanged, confirmed via fresh inspection: `flow-15`/`16`/`17`/`18` (Reflection/Insight/Review) each
carry a `test.describe.configure({ timeout: 180_000 })` — a 6x extension over the 30s default —
as their only flake mitigation, added at original implementation time and never revisited since
(confirmed via `git log`: each file's last commit is its original Sprint 4B/4C/5A/5B completion
commit). `playwright.config.ts`'s global `retries: 0` is unchanged. **None of these four affect any
launch-critical route** — Reflection/Insight/Review are explicitly "frozen" modules (no Bible
module backs them, hidden behind a collapsed Settings card, not in primary navigation). **Recommendation: BACKLOG**, not Sprint 12 — consistent with the audit brief's own instruction not to
automatically pull frozen-module remediation into this sprint, and consistent with every prior
sprint's closure making the identical call.

## 44. Production env matrix

| Category | Vars | Dev | Test | Production required? | Documented? |
|---|---|---|---|---|---|
| Database | `DATABASE_URL` | ✅ | ✅ (separate `beaconvie_test` DB) | Yes, always | Yes, `.env.example` |
| Redis | `REDIS_URL` | ✅ | ✅ (shared instance) | Yes, always | Yes |
| JWT/CSRF | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET` | ✅ dev values | ✅ | Yes, min-length + non-placeholder enforced in prod | Yes |
| Auth cookies | `AUTH_COOKIE_SECURE`, `_DOMAIN`, `_SAME_SITE` | dev-permissive | dev-permissive | `SECURE` must be `true` in prod (enforced) | Yes |
| AI/Gemini/OpenAI/Anthropic | `DEFAULT_AI_PROVIDER`, `FALLBACK_PROVIDER`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_ENABLE_MOCK_PROVIDER` | `gemini`/mock mix | same | Provider key required to match selection; `mock` forbidden in prod (enforced) | Yes |
| Email | `EMAIL_PROVIDER`, `RESEND_API_KEY`, `POSTMARK_SERVER_TOKEN`, `EMAIL_FROM` | `mailpit` | `mailpit` | `mailpit` forbidden in prod; matching key required (enforced) | Yes |
| PayOS/Payments | `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY/BASE_URL/MOCK_CHECKOUT`, `PAYMENTS_ENABLED`, `PREMIUM_PRICE_VND/DURATION_DAYS` | placeholders/mock | placeholders/mock | Real creds + mock=false required in prod (enforced) | Yes |
| Frontend/API URLs | `FRONTEND_URL`, `API_BASE_URL`, `APP_PUBLIC_URL` | localhost | localhost | Real domains required (enforced for `APP_PUBLIC_URL` in prod) | Yes |
| CORS | `CORS_ORIGINS` | localhost | localhost | Required always | Yes |
| Trust proxy | `TRUST_PROXY` | `false` default | — | No hard prod requirement, but **must be set correctly once behind Railway's proxy** (see §45) | Yes, with an explicit spoofing-risk comment in code |
| Notification scheduler | none (fixed `0 9 * * *`, not configurable via env) | n/a | n/a | n/a | Yes, in architecture doc |
| Observability (candidate) | none yet — `SENTRY_DSN` would be new | n/a | n/a | Would become required once adopted | N/A yet |

No secret values printed anywhere in this audit or its production.

## 45. Deployment readiness

**No `Dockerfile`, `vercel.json`, or `railway.json`/`.toml` exists anywhere in this repository.**
`.github/workflows/ci.yml` runs build+test only, no deploy job. `docker-compose.yml` is dev-only
infrastructure (Postgres/Redis/Mailpit), not a production manifest. The README's "Building for
production" section covers only local compile steps, not hosting/topology — Vercel/Railway are not
mentioned anywhere in-repo. **This means the intended production topology exists only as external/
tribal knowledge, not codified anywhere a new engineer could discover it.** This is a real
documentation gap, though not necessarily a *code* blocker — Vercel in particular often needs no
`vercel.json` at all for a standard Next.js app. **Code-level production-awareness is solid**,
independently confirmed: `main.ts` reads `TRUST_PROXY` explicitly rather than trusting-by-default
(with an inline comment about the IP-spoofing risk of getting this wrong), CORS reads from
`CORS_ORIGINS` env rather than a hardcoded localhost, Swagger docs are conditionally disabled in
production. **Recommend Sprint 12 include a short, real deployment-readiness note** (not a full
Dockerfile/CI pipeline — that's a larger, separate initiative) confirming `TRUST_PROXY` is set
correctly for Railway's actual proxy topology once a real deployment exists, since a
misconfigured trust-proxy setting directly undermines the auth rate-limiter's IP-based tracking
(a real security-relevant detail worth getting right explicitly, not by default).

## 46. Security findings

Focused sweep, Sprint 12 candidates only (not a full-codebase re-audit): payment signature
verification — re-confirmed correct and now contract-verified against live docs (§11); webhook
replay — the DB unique-constraint idempotency mechanism is the real protection and is unchanged/
still correct (no timestamp-based replay protection exists, and none is required per PayOS's actual
documented scheme — see §11's correction about the unrelated "docs.payos.money" false lead, which
was the only source suggesting timestamp validation); IDOR — no new surfaces introduced by this
audit; mass assignment — `ValidationPipe({whitelist:true, forbidNonWhitelisted:true})` remains
global and unchanged; AI prompt injection — out of this audit's scope (would require live-provider
testing this audit was instructed not to spend quota on; no code change makes Discovery any more or
less exposed to this than Companion already is); **cost abuse — real, confirmed, this audit's
central finding (§30)**; logging secrets — none found (§35); Sentry PII risk — real, addressed as a
Sprint 12 prerequisite, not a pre-existing gap (§35); notification deep links — already hardened in
Sprint 11, re-confirmed unchanged; account deletion — re-confirmed no regression (§18); stale
sessions — unchanged, no new surface touched.

## 47. P0 blockers

*(prevents real launch/revenue)*

| Issue | Evidence | Owner | Type | Effort | Sprint 12? |
|---|---|---|---|---|---|
| Real PayOS merchant credentials/price/domain | §12, §14 | Founder | Business | N/A (external) | No — parallel founder checklist |

**No engineering P0 exists.** Every code-side payment requirement is complete and now
contract-verified against live documentation (§11).

## 48. P1 findings

*(should fix before public beta)*

| Issue | Evidence | Owner | Type | Effort | Sprint 12? |
|---|---|---|---|---|---|
| Discovery AI cost-control parity (rate limit + usage/provider-log recording) | §22–30 | Engineering | Code | Medium (3 surfaces × similar shape) | **Yes** |
| `@Cron` scheduler silently swallows exceptions | §21, §38 | Engineering | Code | Tiny | **Yes** |
| No production error tracking | §32–35 | Engineering | Code + config | Small–Medium (incl. required log scrubbing) | **Yes** |
| Natal Chart duplicate accessible name (flow-23) | §41 | Engineering | Code | Tiny | **Yes** |
| Missing `global-error.tsx` | §36 | Engineering | Code | Tiny | **Yes** |

## 49. P2 backlog

*(safe backlog, not Sprint 12)*

| Issue | Evidence | Type |
|---|---|---|
| Reflection/Insight/Review Playwright flakes | §43 | Pre-existing, frozen-module, non-launch-critical |
| Route-group-level (non-root) frontend error boundaries | §36 | Real but lower priority than the root gap |
| Refund tooling/policy | §14 | Founder decision first, then engineering |
| Invoice/tax handling | §14 | Founder/legal decision first |
| AI model/pricing freshness check | §29 | Cheap, do alongside Discovery cost-control work, not gating |
| Full deployment manifest (Dockerfile/CI deploy job) | §45 | Larger, separate initiative |

## 50. Founder decision checklist

Only items genuinely supported by this audit's own findings:

- [ ] Real PayOS merchant account + credentials
- [ ] Production Premium price sign-off (currently `79,000 VND`, explicitly disclosed as unvalidated)
- [ ] Production frontend + API domains
- [ ] Payment-record retention period (unresolved since Sprint 10)
- [ ] Production email provider (Resend or Postmark) + real API key
- [ ] Refund policy — none exists today; decide if/how one is needed before real revenue
- [ ] Invoice/tax handling — confirm whether Vietnamese law requires anything this product doesn't yet do
- [ ] Real legal Privacy Policy timing (still a disclosed Sprint-1 placeholder)
- [ ] Whether/when to push the already-complete, unpushed Sprint 11 commit to `origin/master` (§5)

## 51. Sprint 12 option scoring

Weights matched to prior sprints' own framework for consistency: Bible priority 20%, Launch impact
20%, Retention impact 15%, Revenue impact 15%, User-visible value 10%, Engineering effort 10%
(5 = low effort), Risk/dependencies 10% (5 = low risk).

| Option | Bible | Launch | Retention | Revenue | User-visible | Effort | Risk | **Weighted** |
|---|---|---|---|---|---|---|---|---|
| A. Trust & Monetization Closeout | 4 | 5 | 2 | 4 | 2 | 4 | 4 | **3.70** |
| B. Eastern Horoscope | 2 | 2 | 3 | 3 | 4 | 4 | 4 | 2.90 |
| C. Reports | 3 | 2 | 3 | 2 | 3 | 3 | 3 | 2.65 |
| D. Community | 2 | 1 | 3 | 1 | 2 | 1 | 1 | 1.60 |
| E. SEO/Public Acquisition | 2 | 3 | 1 | 2 | 2 | 2 | 3 | 2.15 |
| F. Pure UX polish | 1 | 3 | 2 | 1 | 3 | 4 | 4 | 2.30 |

Option A's Bible-priority/effort/risk scores are now backed by *confirmed* defects (§22–30, §21,
§32–36), not the forward-looking placeholder score Sprint 11's own closure used — if anything, this
independent re-derivation strengthens the case rather than merely repeating it.

## 52. Recommended Sprint 12

# TRUST & MONETIZATION CLOSEOUT

Independently re-derived and confirmed, not assumed from Sprint 11's own suggestion. Scoring is not
manipulated to force this outcome — Eastern Horoscope, Reports, and SEO were all scored on their
actual merits and none approaches Option A once real, confirmed defects (not speculation) are
weighed in.

## 53. Exact Sprint 12 scope

**In scope, each individually justified above:**
1. Discovery AI cost-control parity: rate limiting (mirroring the existing `ThrottlerGuard` +
   `SkipThrottle` pattern already proven for Notifications/Payment/Companion), a shared or
   per-surface concurrency lock for the `:id/interpret` retry endpoints specifically (the confirmed
   unmetered abuse vector, §30), and real `AIUsage`/`ProviderLog` recording for Tarot/Numerology/
   Natal Chart — with a `feature`/`source` discriminator added so spend is queryable per-surface
   (§28), not just lumped with Companion's.
2. Fix the `@Cron` silent-failure gap in `NotificationsSchedulerService` (§21, §38) — small,
   isolated, high-value.
3. Add production error tracking (Sentry, error-tracking tier only, §34) **with explicit log/
   breadcrumb scrubbing configured as part of the same change** (§35) — never ship one without the
   other.
4. Add `global-error.tsx` (§36) — the one missing root-level boundary.
5. Fix the Natal Chart duplicate accessible name (§41) — small, already diagnosed, closes the only
   outstanding Playwright regression this codebase owns outright.
6. Payment production **configuration** readiness: nothing here waits on founder decisions — verify
   `TRUST_PROXY` guidance is explicit for Railway's real topology (§45), confirm the kill-switch UX
   gap (§16) is either fixed (small) or explicitly deferred with reasoning, confirm webhook-
   registration (`webhooks.confirm()`) code path exists and is documented as a one-time deploy-time
   action **if** credentials/domain arrive mid-sprint — but do not block the sprint on them arriving.
7. Email production readiness: purely a documentation/checklist item (§20) — the code is already
   complete for both providers; nothing to build.

## 54. Explicitly out-of-scope items

Eastern Horoscope, Community, Reports (all correctly deferred, §9, §51), Reflection/Insight/Review
Playwright-flake remediation (§43, §49), refund tooling, invoice/tax handling (both founder
decisions first, §49), full deployment manifest/Dockerfile/CI-deploy-job (§45, larger separate
initiative), route-group-level (non-root) frontend error boundaries (§36, real but lower priority),
AI model/pricing staleness deep-audit (§29, do opportunistically alongside item 1, not as its own
workstream), any actual real-money PayOS transaction (external, cannot be fabricated — §39 of the
brief explicitly, and this audit agrees).

## 55. Proposed implementation phases

Derived from this audit's own evidence, not the brief's example structure verbatim:

- **Phase 0** — Baseline recovery, re-verify Sprint 11's still-uncommitted-to-remote state (§5),
  confirm real infra still available.
- **Phase 1** — Natal Chart accessible-name fix + regression test update (smallest, fully
  diagnosed, closes an existing red Playwright test — good first win).
- **Phase 2** — `@Cron` try/catch fix in `NotificationsSchedulerService` + a small regression test
  (exception mid-loop still logs and doesn't crash the process).
- **Phase 3** — AI cost-control architecture: design the shared rate-limit/lock/usage-recording
  shape once, reusable across all three Discovery surfaces (avoid 3 divergent copies) — add the
  `feature`/`source` discriminator to `AIUsage` (additive Prisma migration).
- **Phase 4** — Apply the Phase 3 architecture to Tarot.
- **Phase 5** — Apply to Numerology.
- **Phase 6** — Apply to Natal Chart.
- **Phase 7** — Usage-attribution query/verification (prove the product owner's question from §28
  is now answerable, e.g. via a real DB query demonstration, not necessarily a new UI).
- **Phase 8** — Sentry integration, backend + frontend, WITH scrubbing config as part of this phase,
  not deferred.
- **Phase 9** — `global-error.tsx`.
- **Phase 10** — Payment production configuration readiness checklist items (§53.6) — config/docs
  only, no PayOS runtime change.
- **Phase 11** — Security review of everything touched (especially the new AI rate-limit/lock
  wiring — verify no accidental cross-throttler inheritance, the exact historical `f8fcba1` risk
  class).
- **Phase 12** — Tests: unit (new cost-control/lock services × 3 surfaces), e2e (abuse-scenario
  regression proving the retry endpoint is now bounded), frontend (error boundary render test).
- **Phase 13** — Manual QA + Release Closure (real infra, same discipline as Sprint 11's own
  closure).
- **Phase 14** — Docs/final report.

## 56. Definition of Done

**CODE VERIFIED** (achievable entirely within Sprint 12, no external dependency):
- All three Discovery surfaces have rate limiting, a concurrency lock on the retry endpoint, and
  real `AIUsage`/`ProviderLog` rows recorded per generation attempt.
- The cost-control-parity abuse scenario from §30 is closed and has a regression test proving it.
- `NotificationsSchedulerService` no longer fails silently on an in-loop exception.
- Sentry captures a real test error in both apps with PII-safe scrubbing verified.
- `global-error.tsx` exists and is verified (a forced root-layout throw shows it, not Next's
  default).
- Natal Chart's duplicate accessible name is fixed; flow-23 passes.
- Full regression green (lint/typecheck/unit/e2e/build/Playwright), matching Sprint 11's own
  closure rigor.

**EXTERNAL PRODUCTION VERIFIED** (explicitly separate, correctly may remain BLOCKED at Sprint 12's
end without that being a Sprint 12 failure):
- `PAYOS PRODUCTION`: remains **BLOCKED** unless the founder checklist (§50) is independently
  resolved mid-sprint — Sprint 12 must not fabricate or simulate this as resolved.
- Real production email send via Resend/Postmark: same — blocked on a real credential, not
  fabricated.
- A real Sentry event from actual production traffic: cannot be verified until actually deployed;
  Sprint 12 verifies the *integration* works (a deliberately-triggered test error), not production
  traffic itself.

## 57. Release gates

lint, typecheck, backend unit, frontend unit, backend e2e (including new cost-control specs),
Playwright (flow-20/22/23 regression for Tarot/Numerology/Natal Chart specifically, given they're
the surfaces being touched; full suite for completeness), production build (both apps), Prisma
validate/generate/migrate-status against real dev+test DBs, secret scan, manual responsive QA of
any new UI surface (if usage-attribution gets a UI; if it's query-only, this gate is N/A).

## 58. External verification gates

Real Gemini smoke test: **only if credits/quota allow** — the AI call path itself isn't changing,
only what wraps it, so a mocked-provider test suffices for most of Sprint 12's own correctness;
one real smoke test is still good practice before closure, consistent with prior sprints. Real
PayOS smoke: **not required for Sprint 12** — no real credentials exist, correctly classified as
externally blocked, do not fabricate. Real mail-provider smoke: **not required** unless a real
Resend/Postmark key becomes available mid-sprint (unlikely) — otherwise Mailpit-based verification
(as Sprint 11 already established) is sufficient. Sentry smoke: **required and achievable** — a
free-tier Sentry project can be created and verified within the sprint without any external
business blocker.

## 59. Estimated complexity

Medium. The core pattern (rate-limit guard + concurrency lock + usage recording) is proven exactly
once already (Companion) and needs to be generalized and applied three times, not invented from
scratch — this bounds the risk significantly. Sentry integration is a well-trodden, low-risk
addition for this exact stack. The Natal Chart and `@Cron` fixes are both small and already fully
diagnosed. The main execution risk is scope discipline — resisting the temptation to also "fix"
Reflection/Insight/Review flakiness or expand into a full deployment pipeline, both explicitly
out of scope (§54).

## 60. Files changed by audit

`docs/audit/sprint-12-pre-implementation-audit.md` only (this file).

## 61. Git status after audit

One new untracked file (this document). Nothing staged, nothing committed, nothing pushed.

## 62. Final recommendation

Every code-side payment requirement is complete and now independently contract-verified against
live official documentation with zero mismatches. The one real, confirmed, evidence-backed gap
found this session — Discovery AI systems having no rate limiting, no concurrency protection, and
zero cost/usage visibility, alongside a silently-failing notification scheduler and zero production
error tracking — is exactly what "Trust & Monetization Closeout" should mean, now demonstrated with
concrete defects rather than a forward-looking guess. Sprint 11's own unpushed commit and the
founder-decision checklist (§50) should be handled in parallel, not folded into Sprint 12's
engineering scope.

---

# RECOMMEND SPRINT 12 — TRUST & MONETIZATION CLOSEOUT
