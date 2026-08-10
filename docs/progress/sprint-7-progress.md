# Sprint 7 — Premium & Payment Foundation — Progress Log

Status: IN PROGRESS (baseline audit complete, implementation starting)

## Phase 0 — Repository + product audit

### Working tree

`git status --short` → clean. `git log --oneline -15` → last commit `f8fcba1 fix: isolate auth from companion rate limits`, on top of `e763e55 feat: complete Sprint 6 tarot discovery foundation`. `git diff --check` → no whitespace issues (nothing staged).

### Product Bible findings (docs/reference/web-tu-vi/, docs/audit/*)

- Payment provider: every Product Bible mention pairs `PayOS/VNPay` without picking one — `02-business-model-and-product-ecosystem.md:32`, `17-premium-experience.md:288`. The remediation roadmap makes the actual call explicit: `web-tu-vi-remediation-roadmap.md:105` — "**One** payment provider (Module 17 names PayOS/VNPay — pick one for MVP, defer the other)." This sprint picks **PayOS** (see Phase 4 decision below).
- Free/Premium matrix per the Bible (`17-premium-experience.md:57,81,134-136`): Tarot itself was never meant to be gated; the Bible's Premium value is Memory retrieval depth. **This sprint's brief explicitly overrides that** — Phase 8 of the sprint instructions says not to make Memory depth the primary Premium value and to use the actual Tarot implementation instead, while also forbidding silent removal of already-free Three Card Spread. The product matrix below (Phase 1/8 decision) reconciles this: Tarot stays fully available to Free users; Premium raises usage ceilings, unlocks full history, and adds memory-personalized/deeper interpretation as a secondary (not primary) perk.
- No pricing figures exist anywhere in the Bible or audits (deliberately deferred pending cost modeling, `02-business-model...md:237,243`). This sprint introduces a concrete price as a documented business-assumption placeholder (see Phase 4/5).
- No `Payment`/`Subscription`/`Premium`/`Entitlement`/`Billing`/`Order`/`Checkout`/`Webhook` code exists anywhere in `apps/api/src`, `apps/web`, or `packages/types` — confirmed by full-repo grep. The only related artifact is a scope-disclaimer comment at `apps/api/prisma/schema.prisma:1603` ("...NOT Natal Chart/Eastern Horoscope/Numerology/Premium — those remain out of scope"). Sprint 7 is greenfield for this domain.
- `.env.test` vs `.env.test.example` gap flagged in `post-sprint-6-test-infrastructure.md`: checked locally — `apps/api/.env.test` already contains `AI_RATE_LIMIT_MAX=200` / `AI_RATE_LIMIT_WINDOW_MS=60000` / `AI_RATE_LIMIT_IP_MAX=500`, matching `.env.test.example`. **No fix needed**; the gap must have been closed since that doc was written.

### Existing architecture (apps/api)

- **User model** (`schema.prisma:24-64`): cuid ids, `status: UserStatus` enum, no payment/subscription relation yet. Schema conventions: `String @id @default(cuid())`, `SCREAMING_SNAKE_CASE` enum values, `createdAt`/`updatedAt @updatedAt`, `@@map("snake_case")`, doc-comments above every model/enum.
- **Auth**: JWT access cookie + rotating refresh-session (`JwtAuthGuard`, `@CurrentUser()` → `AuthenticatedUser`). CSRF: global `CsrfGuard` (double-submit cookie `beaconvie_csrf_token` / header `x-csrf-token`, HMAC-verified), opt out per-route with `@SkipCsrf()`.
- **Rate limiting**: `@nestjs/throttler` + Redis storage, named buckets registered centrally in `app.module.ts`. Every named throttler applies to every guarded route by default unless explicitly skipped — this is exactly the defect `f8fcba1` fixed for `auth` vs `companion` buckets. Sprint 7 adds a new `payment` bucket and must skip `companion`/`companion-ip` on payment routes (and skip `payment` on unrelated routes) using the same `@SkipThrottle(...)` pattern.
- **Env validation**: single `zod` schema in `config/env.validation.ts`, parsed fail-fast at boot via `validateEnv()`, exposed through `registerAs('app', ...)` in `configuration.ts`. New payment env vars follow the same three-step pattern (schema entry → production-required check → `appConfig` namespace).
- **Provider abstraction precedent**: Companion's `AIProvider` interface + one file per provider (`openai.provider.ts`, `anthropic.provider.ts`, ...) + `ProviderRegistryService` (constructs a provider only if its env key is present) + a single orchestrator as sole caller. Sprint 7's `PaymentProvider` interface follows this exact shape for PayOS.

### Existing Tarot implementation (apps/api/src/tarot, apps/web/features/tarot)

- One `TarotReadingType` enum (`DAILY_DRAW | SINGLE_CARD | THREE_CARD`) behind a single `POST /tarot/draw`, mapped to a spread slug. Only `DAILY_DRAW` has a usage limit today (1/UTC day, status-agnostic). `SINGLE_CARD`/`THREE_CARD` are currently **unlimited**.
- AI interpretation reuses Companion's `ProviderOrchestratorService`/`SafetyService` — one fixed prompt, `maxTokens: 400`, at most one Memory reference, best-effort (never blocks the draw, failures leave `interpretation: null`).
- History: paginated `GET /tarot/readings` (`DEFAULT_PAGE_SIZE=20`, `MAX_PAGE_SIZE=100`), no existing cap on total depth.
- Ownership: `findOwned()` — identical 404 for not-found vs. not-owned.
- Frontend: `/discover/tarot` route, no `isPremium`/tier state anywhere in `features/tarot`. Repo-wide "Premium" grep hits only marketing copy in `pricing-section.tsx`.

## Phase 1 — Premium MVP product decision

Two states only: **FREE** and **PREMIUM**, backed by a real `PremiumEntitlement` row, never a bare `user.isPremium` flag. One product: **`PREMIUM_30D`** — a 30-day, time-boxed Premium pass (not an auto-renewing subscription; PayOS's hosted checkout is a one-time payment-link product, so a recurring billing engine is not "strictly necessary" per the sprint brief and is deliberately not built). Repeat purchases stack: a new purchase while already Premium extends `expiresAt` from the current expiry rather than from "now."

Price: **79,000 VND** for 30 days, set via `PREMIUM_PRICE_VND` (default 79000) — the Product Bible has no figure, so this is a placeholder business assumption, not a validated price point; flagged as a residual risk in the final report. Backend-authoritative: the frontend never sends a price.

## Phase 2/8 — Free vs Premium Tarot matrix (see docs/architecture/premium-entitlements.md for the authoritative version)

| Capability | Free | Premium |
|---|---|---|
| Daily Draw | 1/UTC day (unchanged) | 1/UTC day (unchanged — the "no re-draw" reflective premise applies to both tiers) |
| Single Card | 3/UTC day (new cap — previously unlimited) | 15/UTC day |
| Three Card Spread | 1/UTC day (new cap — previously unlimited; **still fully available to Free**, not removed) | 10/UTC day |
| Interpretation | Basic prompt, 400 max tokens, no Memory reference | Richer prompt, 700 max tokens, at-most-one Memory reference (existing rule) |
| Reading history | Most recent 20 readings only (page 1, pageSize ≤ 20) | Unlimited (existing pagination) |

Documented product change: Single Card and Three Card Spread were unlimited in Sprint 6; this sprint gives them the same kind of reasonable daily cap Daily Draw already had, rather than leaving them uncapped forever. Three Card Spread is not removed from Free — this satisfies the sprint brief's explicit "do not silently destroy already-working free functionality" constraint while still giving Premium genuine value (higher ceilings + full history + richer interpretation), matching the target model in Phase 8 of the sprint brief.

## Phase 4 — Payment provider decision: PayOS

Selected **PayOS** over VNPay for this MVP:

- Modern REST API (`api-merchant.payos.vn/v2/payment-requests`) with a JSON request/response contract and HMAC-SHA256 signed requests/webhooks — straightforward server-side verification matching Phase 6's requirements exactly.
- Officially supports a dedicated webhook with the same HMAC-SHA256 checksum-key signing scheme used for checkout creation, satisfying "documented signature-verification requirements" and idempotent processing.
- VNPay's integration is bank-gateway-oriented (query-string checksum over many bank-specific parameters, no first-class hosted checkout link) — more integration surface for the same MVP outcome.
- Aimed at Vietnam SME/startup MVPs, matching this product's Vietnam MVP positioning.

No sandbox/production PayOS credentials are available in this environment — provider runtime integration is **UNVERIFIED** (contract/signature behavior is verified locally against constructed fixtures mirroring PayOS's documented HMAC scheme; see the final report for the precise verification tier).

## Environment note

Docker Desktop was unavailable at the start of this session (`docker version` → "Docker Desktop is unable to start"), so implementation proceeded with the hand-authored migration validated only via `prisma validate`/`prisma generate` (schema/source-only, no live DB). Docker Desktop recovered partway through the session; once it did, `docker compose up -d` was run and every DB-dependent verification step was performed for real and none were left as an assumed pass — see `docs/progress/sprint-7-final-report.md` for the exact commands and results (migration applied via `prisma migrate deploy` against both the dev and test databases, full backend e2e suite, full Playwright suite against real production builds).
