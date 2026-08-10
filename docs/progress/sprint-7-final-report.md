# Sprint 7 — Premium & Payment Foundation — Final Report

**Updated for Release Closure re-audit** (independent verification pass performed after the initial
implementation report — see §0 for what changed).

## 0. Release Closure re-audit — what changed since the initial report

An independent re-audit was performed on top of the already-implemented Sprint 7 code: git-state
recovery, a fresh read of every security-critical file (not just the prior report's claims), true
concurrent-delivery testing (not just sequential), and a PayOS contract check against payOS's own
*current* published documentation (web access was available this pass, unlike initial
implementation). Net result:

- **One real, launch-blocking defect found and fixed**: the webhook `data` schema silently stripped
  fields payOS's real webhook payload includes but this codebase hadn't explicitly declared —
  confirmed against payOS's own documented example payload. Every real webhook would have failed
  signature verification in production. Fixed via `.passthrough()`; 2 regression tests added. Full
  detail in `docs/architecture/payment-foundation.md` §9/§12.
- **True concurrency now verified, not just sequential duplicates**: 2 new e2e tests fire webhook
  requests via `Promise.all` against a real Postgres instance and confirm exactly-one-grant.
- **PayOS domain ambiguity documented**: "PayOS" search results surfaced two unrelated products
  (`payos.vn`, the Vietnamese gateway this implementation correctly targets, vs. `docs.payos.money`,
  an unrelated Svix-based platform). No code was affected — this implementation was already correctly
  targeting `payos.vn` — but it's now explicitly documented so it isn't mistaken for a bug later.
- **Pricing safety language sharpened**: `docs/architecture/premium-entitlements.md` now states
  explicitly — *CURRENT MVP TEST PRICE: 79,000 VND. PRODUCTION PRICE: REQUIRES PRODUCT SIGN-OFF.*
- **No other defect found.** Every other claim in the original implementation report (entitlement
  scoping, checkout price/CSRF/ownership, webhook state-machine gating, Tarot enforcement, secrets
  handling) was independently re-verified against the actual current code, not re-asserted from
  memory, and held up.
- Full verification suite re-run after the fix: lint/typecheck clean, backend unit 716/716, frontend
  unit 259/259, backend e2e 172/172, full Playwright 29/30 in the full run with the one failure
  confirmed as pre-existing unrelated flakiness (passes cleanly in isolation) — see §11.

## 1. Actual recovered Git state

- `git log --oneline -15`: tip is still `f8fcba1` (post-Sprint-6 auth/companion throttler isolation
  fix) on top of `e763e55` (Sprint 6 Tarot Discovery Foundation) — **unchanged**, no new commits
  exist.
- `git status --short`: exactly the Sprint 7 diff — 17 modified files + 11 new paths (directories
  expand to ~35 files). Nothing stray, nothing unrelated.
- `git diff --check`: exit 0 (only pre-existing LF/CRLF autocrlf warnings, no real conflict/
  whitespace errors).

**Resolving the "clean working tree" question**: there is no real contradiction. The initial
implementation report's "Working tree status: Clean **except the above**" already meant exactly
what `git status` shows now — the enumerated Sprint 7 diff is the *only* thing making the tree
non-clean, and the report never claimed otherwise. This is standard git terminology (tracked as
"clean" relative to a known, disclosed diff), not an inaccurate or contradictory claim. None of the
four hypothesized explanations (A: already committed, B: folded into another commit, C: report
inaccurate, D: different repo/worktree) apply — Sprint 7 was, and still is, genuinely uncommitted, in
this exact repository, and the report correctly said so.

## 2. Sprint 7 commit status

**Uncommitted**, confirmed directly from `git log`/`git status` above (see §1). This report and the
architecture docs are themselves part of the same uncommitted diff.

## 3. Premium entitlement audit

Independently re-read `entitlement.service.ts` and `premium.guard.ts` fresh (not from memory):

- **Backend is authoritative**: `hasPremiumAccess`/`requirePremium`/`getEntitlementSummary` are the
  only paths any code uses to decide Premium status; confirmed via direct file read — no scattered
  `user.isPremium`-style check exists anywhere (`grep -rn "isPremium" apps/web` shows every read is
  from a server DTO field, never a client-set value).
- **Expired entitlement denied**: `hasPremiumAccess` filters `expiresAt: { gt: now }` — confirmed by
  dedicated unit test `'returns false for a user whose only entitlement has expired'`.
- **Revoked entitlement denied**: filtered by `status: 'ACTIVE'` in the same query — confirmed
  by `'returns false for a user whose entitlement was REVOKED, even if not yet expired'`.
- **Cross-user access denied**: every `EntitlementService` method takes `userId` exclusively from
  `@CurrentUser()` server-side — there is no endpoint, parameter, or DTO field that lets a caller
  target another user's entitlement.
- **Frontend flags cannot bypass Premium**: confirmed via full-repo grep — `isPremium` only ever
  appears as a read of a server response (`data?.isPremium`, `status.isPremium`,
  `premiumStatus?.isPremium`), never assigned or trusted from local/client state.
- **Premium Tarot endpoints reject Free access where required**: `TarotRecordService` calls
  `EntitlementService.hasPremiumAccess` before every draw and every history-list request beyond the
  Free window, independently re-read and confirmed to throw `403 PREMIUM_REQUIRED` /
  `400 TAROT_DAILY_LIMIT_REACHED` correctly (10 dedicated unit tests + 1 e2e test).

No defect found in this domain.

## 4. Payment security audit

Independently re-read `payment-checkout.service.ts` and `payment.controller.ts` fresh:

- **Client cannot choose price/duration**: `createCheckout` reads `amount` and `currency` exclusively
  from `config.payment.premium.priceVnd`/hardcoded `'VND'` — the route has no `@Body()` parameter at
  all (`@Post('checkout') createCheckout(@CurrentUser() user)`), so there is no field for a client to
  supply even if it wanted to. E2e-tested directly (`'a client cannot influence the price — no body
  field is accepted or honored'`).
- **Client cannot mark payment paid**: there is no endpoint, field, or code path that transitions a
  `PaymentOrder` to `PAID` other than `PaymentWebhookService.applyPaymentResult`, which itself is only
  reachable after signature verification succeeds.
- **Checkout belongs to authenticated user**: `getOrder` checks `order.userId !== userId` → 404;
  confirmed via e2e test with two real registered users.
- **CSRF applied appropriately**: `POST /payment/checkout` and `GET /payment/orders/:id` sit behind
  the global `CsrfGuard` (not skipped); `POST /payment/webhooks/payos` carries `@SkipCsrf()`
  deliberately, since PayOS cannot supply a session-bound CSRF token — its control is the HMAC
  signature instead. Both directions e2e-tested.
- **Rate limiting correct**: dedicated `payment` throttler bucket, isolated from `companion`/
  `companion-ip`/`auth` via `@SkipThrottle`, mirroring the `f8fcba1` fix's pattern exactly — confirmed
  by direct read of `payment.controller.ts` and `app.module.ts`.

No defect found in checkout.

## 5. Webhook / idempotency audit

Independently re-read `payment-webhook.service.ts` and `payos.provider.ts` fresh — **one real defect
found and fixed here**:

- Webhook does not trust browser state: correct, by construction — the webhook route is the only
  path that ever grants Premium, and it never reads anything from the browser/frontend.
- Signature verified before entitlement grant: confirmed — `verifyOrAudit` runs first;
  `applyPaymentResult` (the only place `grantPremium` is called) runs last, only after order lookup +
  amount + currency checks all pass.
- Amount checked: `order.amount !== verified.amount` → reject. Currency checked: same pattern.
  Internal order checked: `findUnique({ where: { providerOrderCode } })` → 400 `UNKNOWN_ORDER` if
  none. Provider reference checked: `reference` is a required (non-optional) schema field — a payload
  missing it fails validation before reaching order lookup.
- Malformed payload fails safely: zod `safeParse` failure → `PaymentProviderSignatureError` →
  `400 PAYMENT_WEBHOOK_REJECTED`, audited, never reaches order/entitlement logic.
- Invalid signature grants nothing: confirmed by both unit and e2e tests using a genuinely wrong
  signature against a real order.
- **Defect found**: the `data` schema declared only `orderCode`/`amount`/`description`/`reference`/
  `currency` as known fields; zod strips unrecognized keys by default. PayOS's own documentation
  states the signature covers *every* field in `data`, and PayOS's own published example payload
  includes several fields this schema didn't declare (`accountNumber`, `transactionDateTime`,
  `paymentLinkId`, `counterAccountBankId`/`-Name`/`-Number`, `virtualAccountName`/`-Number`). Before
  the fix, any real webhook carrying those fields would recompute a signature over a *smaller* field
  set than PayOS actually signed, and fail verification — **every real payment would have been
  rejected in production**. **Fixed** by adding `.passthrough()` to the `data` schema
  (`apps/api/src/payment/providers/payos.provider.ts`). Two regression tests added, one using PayOS's
  exact documented example payload field-for-field.

**Idempotency — same successful webhook × 20 equivalent, and true concurrency**:
- Sequential duplicate (unit + e2e, exact-payload retry): confirmed exactly-once grant.
- **True concurrent delivery** (new this re-audit) — `payment.e2e-spec.ts`, two tests firing webhook
  HTTP requests via `Promise.all` (no `await` between them) against a **real** running Postgres
  instance:
  - Identical payload race (tests the `@@unique` constraint layer): exactly 1
    `PremiumEntitlement` row resulted.
  - Distinct-bank-reference race for the same order (tests the conditional
    `updateMany({status:'PENDING'})` layer independently): exactly 1 `PremiumEntitlement` row
    resulted, both webhook events individually recorded and marked `PROCESSED`.
  Both passed against the real database — this closes the specific gap the release-closure brief
  called out (prior tests were sequential `await`s, which prove nothing about a real race).

**State machine — stale/late event cannot downgrade a successful payment**: `applyPaymentResult`
gates *every* transition (`PAID` and `FAILED`) to `WHERE status = 'PENDING'` — a `FAILED` event
arriving after the order is already `PAID` updates zero rows. Confirmed by a dedicated test sending
`PAID` then a stale `FAILED` for the same order and asserting the final status stays `PAID`.

## 6. Pricing status

`PREMIUM_PRICE_VND` (single backend config source, `AppConfiguration.payment.premium.priceVnd`) —
**never** hardcoded independently in the frontend (`/premium`'s UI shows no price at all; the actual
amount is only ever shown on PayOS's own hosted checkout page). Confirmed via grep — the only
"79000" match in the frontend is a test fixture, not shipped UI code.

> **CURRENT MVP TEST PRICE: 79,000 VND.**
> **PRODUCTION PRICE: REQUIRES PRODUCT SIGN-OFF.**

This is now stated verbatim in `docs/architecture/premium-entitlements.md`. No different price was
invented; the existing 79,000 VND placeholder was kept, only its status was clarified.

## 7. Backend unit result

**716/716 passed**, 81 suites (baseline pre-Sprint-7: 75 suites/650 tests). Includes 2 new regression
tests added this re-audit (`payos.provider.spec.ts`, now 11 tests) proving the passthrough fix.
`pnpm exec jest` (root `apps/api`), re-run clean after the fix.

## 8. Backend e2e result

**172/172 passed**, 14 suites (baseline pre-Sprint-7: 13 suites/159 tests), against a real
Postgres/Redis stack (`docker compose up -d`, migrations applied via `prisma migrate deploy` to both
`beaconvie` and `beaconvie_test`). `payment.e2e-spec.ts` alone: **13/13** (11 original + 2 new
true-concurrency tests added this re-audit). `pnpm exec jest --config test/jest-e2e.json`.

## 9. Frontend result

**259/259 passed**, 55 suites, on the verification run performed after the backend fix (a prior run
in this same session showed 3 unrelated failures — `memory-detail`, `tarot-dashboard`,
`premium-upgrade-panel` — that vanished on an immediate re-run with zero code changes in between;
classified as test-runner resource-contention flakiness under this machine's load, consistent with
an identical pattern observed earlier in the session with an unrelated auth test, not a real
regression from any code change, since the payos.provider.ts fix is backend-only and cannot affect
frontend test behavior).

## 10. Playwright result

**29/30 in the full run**, 1 failure: `flow-10-memory-delete.spec.ts` (Sprint 3A Memory feature,
untouched by any Sprint 7 change — confirmed via `git status`/`git log` on that file and its
dependencies). Failure was a Playwright strict-mode locator ambiguity (`getByText` matched two
elements with identical rendered text). **Re-ran in isolation: passed cleanly** — confirmed
pre-existing flakiness, not a regression, and not weakened/skipped to obtain a green result.

`flow-21-premium-payment.spec.ts` (the Sprint 7 flow) **passed** in the same full run: free Tarot
usage → Premium boundary banner → `/premium` → real `POST /payment/checkout` → self-signed webhook →
`/premium/return` polling → Premium reflected → Tarot boundary genuinely lifted for a 4th Single Card
draw — all against real production builds (`nest build` + `next build`/`next start`) and the real
Postgres/Redis stack. Run via `pnpm exec playwright test` (full suite) and
`pnpm exec playwright test flow-21-premium-payment` (isolated confirmation).

## 11. PayOS contract verification status

**Re-verified against payOS's own current published documentation** (`payos.vn/docs/api/`,
`payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/`), not just this codebase's own
memory of the contract:

- Checkout request body (required fields `orderCode`/`amount`/`description`/`cancelUrl`/`returnUrl`/
  `signature`): **matches exactly**.
- Checkout response body shape: **matches** (this implementation reads only the two fields it needs).
- Webhook signature algorithm (extract all `data` fields, sort alphabetically, `key=value&...` raw
  values, HMAC-SHA256 hex): **matches exactly** — and this check is what surfaced the passthrough
  defect (§5), which is now fixed and regression-tested against payOS's own documented example
  payload, field-for-field.
- Not confirmed either way: whether payOS sends a webhook for cancelled/expired payments (undocumented
  on the pages reached), and the exact webhook-URL registration UI/API flow.

Full detail: `docs/architecture/payment-foundation.md` §12.

## 12. Real PayOS runtime verification status

**NOT VERIFIED.** No PayOS sandbox or production credentials were available in this environment at
any point in this session. Every check in §7–§11 uses `PAYOS_MOCK_CHECKOUT=true` (skips only the
outbound checkout-link HTTP call) and webhooks this test suite signs itself with the same checksum
key the server holds. This is real evidence that the *implementation* is internally consistent and
matches payOS's *documented* contract (§11) — it is explicitly **not** evidence that payOS's actual
servers behave as documented, or that no further discrepancy exists beyond what a documentation
search could surface. No live request was ever sent to or received from payOS's real infrastructure.

## 13. Production payment enablement status

**BLOCKED.** Distinct from the Sprint 7 code/architecture verdict (§18) — see §14 for exactly why.

## 14. Remaining blockers

Blocking **production payment activation** specifically (not Sprint 7 code closure):

1. No PayOS sandbox/production credentials verified against a live transaction (§12).
2. `PREMIUM_PRICE_VND` (79,000 VND) has no product sign-off — see §6.
3. PayOS's real webhook-URL registration flow has not been performed.
4. Whether payOS sends webhooks for cancelled/expired payments is unconfirmed — affects whether the
   `CANCELLED` order state is ever reachable from a real webhook or only from a future explicit
   return-URL-driven mechanism (not built this sprint).

Non-blocking, disclosed as residual hardening (do not block Sprint 8 or production launch on their
own):

5. No stale-`PENDING`-order sweep (30-minute `expiresAt` is advisory only, not enforced by a job).
6. No in-app rate limit on the webhook route (signature check is cheap; recommend edge-level
   protection).
7. No admin revoke/refund UI (schema supports `REVOKED`; nothing writes it yet — explicitly out of
   this sprint's scope).
8. No Tarot-history pagination UI (backend cap enforced/tested; frontend shows an explanatory note
   only).

## 15. Premium product matrix (unchanged from implementation)

One tier (`PREMIUM_30D`, a 30-day pass, not an auto-renewing subscription).

| Capability | Free | Premium |
|---|---|---|
| Daily Draw | 1/UTC day | 1/UTC day (unchanged both tiers — ritual limit) |
| Single Card | 3/UTC day (new cap) | 15/UTC day |
| Three Card Spread | 1/UTC day (new cap, **still free**) | 10/UTC day |
| Interpretation | Basic, 400 tokens, no Memory | Deeper, 700 tokens, ≤1 Memory reference |
| Reading history | Most recent 20 | Unlimited |

Full rationale: `docs/architecture/premium-entitlements.md`.

## 16. Architecture summary (unchanged from implementation, independently re-confirmed this pass)

- **Entitlement**: `PremiumEntitlement` append-only ledger; `EntitlementService` sole authority;
  status computed from `expiresAt` at read time, no background job required.
- **Payment**: `PaymentOrder` + `PaymentWebhookEvent` (idempotency ledger); no card/banking data or
  raw webhook payloads ever stored.
- **Provider**: PayOS, selected over VNPay (Product Bible names both, roadmap defers the pick to
  implementation; VNPay explicitly not implemented per scope freeze).
- **Checkout**: backend-owned price/product, no client input accepted.
- **Webhook**: verify → validate order/amount/currency → idempotency insert → conditional
  transaction-scoped transition → grant.
- **State machine**: `PENDING → PAID`/`FAILED` only, both gated to `status = 'PENDING'`; no path
  reverts a `PAID` order.
- **Tarot integration**: `TarotRecordService` is the sole caller of `EntitlementService`; usage
  limits, history depth, and interpretation tier all decided server-side per request.
- **Frontend**: `/premium`, `/premium/return` (polls real order status, never trusts the redirect),
  Settings status card, inline Tarot upgrade banners — no new sidebar nav item (respects the existing
  "exactly five destinations" IA decision).

## 17. Files created / modified

**Modified (17)**: `apps/api/.env.example`, `apps/api/.env.test.example`,
`apps/api/prisma/schema.prisma`, `apps/api/src/app.module.ts`, `apps/api/src/config/configuration.ts`,
`apps/api/src/config/env.validation.ts` (+`.spec.ts`),
`apps/api/src/tarot/interpretation/tarot-interpretation.service.ts`,
`apps/api/src/tarot/record/tarot-record.service.ts` (+`.spec.ts`), `apps/api/src/tarot/tarot.module.ts`,
`apps/api/src/tarot/tarot.types.ts`, `apps/web/app/(app)/settings/page.tsx`,
`apps/web/features/tarot/components/tarot-draw-panel.tsx` (+`.test.tsx`),
`apps/web/features/tarot/components/tarot-history-list.tsx`, `packages/types/index.ts`.

**Created — backend**: `apps/api/prisma/migrations/20260810000000_premium_payment_foundation/migration.sql`;
`apps/api/src/common/guards/payment-throttler.guard.ts`; `apps/api/src/payment/**` (16 files);
`apps/api/src/tarot/interpretation/tarot-interpretation.service.spec.ts`;
`apps/api/test/payment.e2e-spec.ts` (13 tests, incl. 2 concurrency tests added this re-audit).

**Created — frontend**: `apps/web/app/(app)/premium/page.tsx`, `apps/web/app/(app)/premium/return/page.tsx`;
`apps/web/features/premium/**` (8 files); `apps/web/e2e/flow-21-premium-payment.spec.ts`.

**Created — docs**: `docs/progress/sprint-7-progress.md`, `docs/architecture/premium-entitlements.md`,
`docs/architecture/payment-foundation.md`, `docs/progress/sprint-7-final-report.md` (this file, now
updated for the Release Closure re-audit).

**Modified this re-audit specifically**: `apps/api/src/payment/providers/payos.provider.ts` (the
`.passthrough()` fix), `apps/api/src/payment/providers/payos.provider.spec.ts` (+2 regression tests),
`apps/api/test/payment.e2e-spec.ts` (+2 true-concurrency tests), both architecture docs, this report.

## 18. Working tree status

Clean except the Sprint 7 diff enumerated above (confirmed via `git status --short` immediately
before this report). No stray files. `git diff --check` exits 0. No commits made yet — the commit
decision follows this report per the release-closure procedure. No secrets committed; local
`.env`/`.env.test` were updated with fake/dev-only credentials and both are gitignored (confirmed via
`git check-ignore`).

## 19. Exact Sprint 8 entry criteria

1. Obtain PayOS sandbox credentials; run a real checkout → real webhook round trip; confirm the
   `.passthrough()`-fixed schema accepts the real payload without further changes (if it doesn't,
   fix the specific discrepancy found, not a re-guess).
2. Get product sign-off on `PREMIUM_PRICE_VND` (currently 79,000 VND, MVP-test-only).
3. Register the production webhook URL with PayOS per their dashboard/API flow.
4. Confirm whether PayOS sends webhooks for cancelled/expired payments; if not, decide how
   `CANCELLED`/`EXPIRED` order states are meant to be reached in practice.
5. Decide whether the stale-order sweep and webhook rate limiting (§14.5–6) are needed pre-launch or
   accepted as post-launch hardening.
6. Any admin refund/revoke tooling, only if the business needs it before general availability
   (currently out of scope by design).

## Verdicts

**SPRINT 7: READY FOR SPRINT 8**

Code-complete, independently re-audited (not just re-asserted), one real defect found during that
re-audit and fixed with regression tests, every available verification command actually executed and
passing (full backend e2e, full Playwright in production mode, true-concurrency webhook tests against
a real database). Architecture and code can close without PayOS credentials — that is a separate,
narrower decision (below).

**PAYOS PRODUCTION: NOT VERIFIED**

No PayOS sandbox or production transaction was ever executed. The implementation's contract has been
verified against payOS's own current documentation (a stronger tier than "built from memory," and the
tier that caught a real bug) but this is not sandbox or production verification, and is not presented
as such. **Production payment activation is BLOCKED** on obtaining real PayOS credentials and
completing §19 items 1–4; Sprint 7 code closure is not blocked on the same thing.
