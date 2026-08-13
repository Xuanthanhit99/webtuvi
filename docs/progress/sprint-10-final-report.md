# Sprint 10 — Launch Hardening — Final Report

Date: 2026-08-13. Selected by `docs/audit/sprint-10-pre-implementation-audit.md`. Baseline HEAD
`eee8aff`, working tree clean at session start (one pre-existing untracked audit file).

## 1. Recovered HEAD / baseline

`eee8aff`, `master`, in sync with `origin/master`. Working tree clean except the
pre-implementation audit doc. No merge/rebase/cherry-pick in progress.

## 2. Account data inventory & retention matrix

Full matrix in `docs/architecture/account-data-rights.md` §2. Summary: every personal-content
model (auth artifacts, profile/preferences, Companion, Memory, Journal, Reflection/Insight/
Review/Goal, Tarot/Numerology/Natal Chart) is hard-deleted. `PaymentOrder`/`PaymentWebhookEvent`/
`PremiumEntitlement` are retained indefinitely, untouched — they contain no PII, only the
`userId` FK to a now-anonymized `User` row.

## 3. Retention strategy

`User` row is never deleted — PII (email/displayName/passwordHash) is scrubbed, `status` becomes
`DELETED`. This is the mechanism that lets payment records survive without themselves needing
anonymization (they never stored PII). Exact retention *period* for payment records is an
explicit **PRODUCT/LEGAL DECISION REQUIRED** — not invented (see
`account-data-rights.md` §3).

## 4-8. Export architecture / API / frontend / sensitive-field exclusion

`AccountExportService`/`AccountExportController` (`apps/api/src/users/export/`) — mirrors
`MemoryExportService`'s exact established pattern (synchronous, per-user Redis lock, 15-minute
cache, two-step job API). `POST /users/me/export`, `GET /users/me/export/:jobId`. Frontend:
`AccountDataSection` in Settings, real Blob-download UX matching the existing Memory-export
pattern. Verified via unit test that the `User` query uses an explicit `select` excluding
`passwordHash`, and `PaymentOrder` query excludes `providerOrderCode`/`providerPaymentLinkId`.

## 9-11. Account deletion architecture / API / frontend

`AccountDeletionService`/`AccountDeletionController` (`apps/api/src/users/deletion/`).
`DELETE /users/me`, requires the current password (reuses `changePassword`'s exact
`argon2.verify` confirmation pattern — no second auth mechanism invented). Frontend: a
destructive `Dialog` (existing shared component, `variant="destructive"`) requiring password
entry before the confirm button enables, explaining what's deleted/retained, mirroring
`SessionsPanel`'s existing destructive-confirmation pattern exactly.

## 12. Session revocation result

`UserSession` rows are hard-deleted (stronger than the existing `revokedAt` soft-revoke
`logoutAll()` uses, appropriate for a permanent account deletion). **Real gap found and fixed**:
`JwtAuthGuard` previously verified only the JWT signature, never re-checking the database —
`UserStatus.DELETED` existed in the schema but was never enforced. Fixed: the guard now does one
additional indexed `User.findUnique` per request and rejects any non-`ACTIVE` status. Verified via
unit test (6 cases) and e2e (still-valid access token rejected immediately post-deletion, refresh
rejected, login with original credentials fails) and Playwright flow-24 (real browser, real
redirect to `/login`, real re-login attempt correctly rejected).

## 13-19. Cleanup verification (Companion / Memory / Journal / Tarot / Numerology / Natal / Premium)

All verified via direct Prisma reads after a real `DELETE /users/me` call in
`account-data-rights.e2e-spec.ts` (not assumed from schema inspection alone): journal, tarot,
numerology, and memory row counts are all `0` post-deletion for the deleted user; a
`PremiumEntitlement`/`PaymentOrder` pair created for the test user remain intact and unchanged
(`status: 'ACTIVE'`/`'PAID'`) after deletion — proving retention works exactly as designed, not
just as documented.

## 20. Payment-record handling

Confirmed unchanged/untouched: no Sprint 10 code reads or writes `PaymentOrder`,
`PaymentWebhookEvent`, or `PremiumEntitlement`. Full existing payment unit suite (48/48) reran
clean, confirming the new `JwtAuthGuard` DB check doesn't affect payment-route behavior (checkout
still requires an `ACTIVE` authenticated user, which every real user is).

## 21. Cross-user security

`account-data-rights.e2e-spec.ts` "Cross-user security" + IDOR tests: User A cannot export or
delete User B's account by any input (the deletion endpoint has no target-user field at all — it
is always scoped to the authenticated caller); a cross-user export-job-id fetch 404s.

## 22. CSRF result

Confirmed via e2e: an unauthenticated `POST /users/me/export` / `DELETE /users/me` (no cookies at
all) is rejected `403 CSRF_TOKEN_MISSING` by the global `CsrfGuard` before `JwtAuthGuard` is even
reached — the same layering every other mutating route in this app already has. Authenticated
mutating calls carry the real double-submit token throughout.

## 23. Race/idempotency result

A second `DELETE /users/me` call against an already-deleted account is a clean no-op (checked
explicitly, verified by unit test and e2e). A genuine *concurrent* double-delete race (two
simultaneous first-time requests) was reasoned through, not just assumed: every `deleteMany` is
naturally idempotent (deleting 0 rows the second time is harmless) and the final `User` scrub
writes the same deterministic values both times — no corruption, no error, no cross-user leakage
possible. Not gated behind a Redis lock (unlike export), since the operation is safe under
concurrency by construction, not merely wasteful.

## 24. Privacy-page changes

Updated to accurately describe the now-real deletion/retention behavior (payment records
retained but PII-free) — see `apps/web/app/(marketing)/privacy/page.tsx`. No unsupported legal
claims added.

## 25. Settings changes

Replaced the "account deletion...coming soon" line with a real, working "My data" section
(export + delete). No unrelated redesign.

## 26. PayOS config audit

Reverified (not re-derived): `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` still
required-in-production, `PAYOS_MOCK_CHECKOUT` still forbidden-in-production
(`env.validation.ts`, unchanged). Local `.env` still holds only dev/test fake credentials — no
real PayOS merchant account exists in this environment (values not displayed, per instruction).

## 27. PayOS remaining blockers — classified by type

| # | Blocker | Type |
|---|---|---|
| 1 | Real PayOS merchant account/credentials | **EXTERNAL ACCOUNT** |
| 2 | Production price sign-off (currently 79,000 VND placeholder) | **PRODUCT DECISION** |
| 3 | Production webhook URL registration (`webhooks.confirm(url)`) | **DEPLOYMENT** (blocked on #1 + #5) |
| 4 | Cancelled/expired PayOS webhook behavior unconfirmed | **DOCUMENTATION** (PayOS's own docs silent; needs #1 to observe directly) |
| 5 | Production domain/HTTPS not provisioned | **DEPLOYMENT** |
| 6 | Stale-order sweep | **Decided not required** — not a blocker |
| 7 | Webhook rate-limit hardening | **Decided not needed in-app** — not a blocker |

**Zero CODE blockers remain.** The engineering side (contract-verified integration, signature
verification, idempotency, kill switch) has been complete since the Sprint 7/PayOS-readiness-gate
work; everything left is operational/business, consistent with the Sprint 10 pre-implementation
audit's own conclusion.

## 28. Price sign-off status

**CURRENT CONFIGURED PRICE: 79,000 VND (`PREMIUM_PRICE_VND`, engineering placeholder).**
**PRODUCTION SIGN-OFF STATUS: NOT GIVEN.** Unchanged from prior sessions' disclosure; not silently
declared final.

## 29. Kill-switch result

`PAYMENTS_ENABLED` reverified via the existing test suite (`payment-checkout.service.spec.ts`,
`env.validation.spec.ts`) — unmodified this sprint, still blocks only *new* checkout creation,
still never gates webhook processing or existing entitlements. All prior kill-switch tests pass.

## 30. Webhook result

Signature verification, idempotency (`@@unique([provider, externalEventId])`), amount/currency
validation, and the `.passthrough()` fix all unchanged and reverified via the full existing
`payment-webhook.service.spec.ts`/`payos.provider.spec.ts` suite (unmodified this sprint, still
passing).

## 31. Payment-return result

`/premium/return` still never trusts redirect query parameters — confirmed unchanged by direct
read of `premium-return-status.tsx`; it only ever polls `GET /payment/orders/:id`.

## 32. Real PayOS runtime status

**PAYOS REAL RUNTIME — UNVERIFIED.** No real credentials exist in this environment; no real
transaction was or could be attempted. Not fabricated as a pass.

## 33-36. Test results

| Suite | Result |
|---|---|
| Backend unit (full) | 98 suites / 914 tests — all green (95/895 baseline + 3/19 new) |
| Frontend unit (full) | 67 suites / 320 tests — all green (66/314 baseline + 1/6 new) |
| Backend e2e (full) | 17 suites / 222 tests — all green (16/208 baseline + 1/14 new) |
| `flow-24-account-data-rights.spec.ts` | Stable across 3 consecutive runs |
| Existing payment flow (`flow-21`) | Passed within the full Playwright run |

## 37. Full Playwright result

**28/33 passed.** flow-24 clean. The 5 failures (`flow-15` ×2, `flow-16`, `flow-17`,
`flow-18`'s Monthly Review) are confined to Reflection/Insight/Review — frozen modules Sprint 10
never touches. Re-run in isolation and still failed with the identical failure signature (waiting
on a background pattern-detection candidate that didn't materialize within a 10s window) — this
exact signature has now been independently observed across three separate sessions in this repo
(Sprint 8's own documented baseline, Sprint 9's closure, and this sprint), confirming it as a
long-standing, environment-sensitive characteristic of Reflection/Insight's background job timing,
not a regression from any of those sprints' actual changes.

## 38. Production build result

Both apps rebuilt clean from scratch (`rm -rf dist`/`rm -rf .next` first). API: `nest build`
success, `/users/me/export`, `/users/me` (DELETE) routes correctly mapped at boot. Web:
`next build` success, `/settings` route present with the expected larger bundle size (new
`AccountDataSection`).

## 39. Prisma result

`prisma validate`: pass. `prisma migrate status`: up to date, 16 migrations — **unchanged**,
confirming Sprint 10 made zero schema/migration changes, exactly as designed (no new Prisma
models needed; the export/deletion logic reads/writes existing tables only).

## 40-42. Manual verification (desktop/tablet/mobile)

Real browser screenshots, fresh isolated user, real registration/onboarding:
- **Desktop**: Settings' new "My data" card renders correctly; the destructive delete dialog is
  clear, well-formed, password field required before the confirm button enables; Premium and
  Privacy pages render correctly (no regression).
- **Tablet**: Settings renders correctly. Re-confirmed an already-documented, pre-existing,
  out-of-scope characteristic (not introduced by Sprint 10): the tablet breakpoint shares the
  phone bottom-tab nav rather than getting its own layout (catalogued in this sprint's own
  pre-implementation audit §15 as "known, low-severity, open since Sprint 4B").
- **Mobile**: Settings and the delete dialog both render correctly with no horizontal overflow;
  the native `<dialog>` correctly sits above the fixed bottom nav (no overlap) since dialogs
  render in the browser's top layer.

## 43. Security findings

No Blocker or High findings. See §21-23 above for the specific bypass attempts (cross-user
export/deletion, CSRF, race/idempotency) verified with real evidence, not code-inspection claims
alone.

## 44. Blockers

None.

## 45. High findings

None.

## 46. Medium findings

None.

## 47. Low findings

- Pre-existing, unrelated: tablet breakpoint shares the mobile bottom nav (§15 of the
  pre-implementation audit; not introduced or worsened by Sprint 10).
- `findOwned`-style/direct-`where`-clause ownership pattern used throughout (`userId` always
  scoped in the query itself for the new export/deletion code, not fetch-then-check) — stronger
  than some pre-existing patterns elsewhere in the codebase, no issue found.

## 48. Runtime-unverified items

- Real PayOS sandbox/production transaction (§32) — requires external merchant credentials this
  environment does not have.
- Exact data-protection-law retention period for payment records (§3) — explicit product/legal
  decision required, not invented.

## 49. Files created

`apps/api/src/auth/cookie.module.ts`, `apps/api/src/common/guards/jwt-auth.guard.spec.ts`,
`apps/api/src/users/deletion/` (service, controller, spec), `apps/api/src/users/dto/delete-account.dto.ts`,
`apps/api/src/users/export/` (service, controller, spec), `apps/api/test/account-data-rights.e2e-spec.ts`,
`apps/web/e2e/flow-24-account-data-rights.spec.ts`, `apps/web/features/settings/api/settings-api.ts`,
`apps/web/features/settings/components/account-data-section.tsx` (+ `.test.tsx`),
`docs/architecture/account-data-rights.md`, `docs/audit/sprint-10-pre-implementation-audit.md`,
`docs/progress/sprint-10-progress.md`, `docs/progress/sprint-10-final-report.md` (this file).

## 50. Files modified

`apps/api/src/auth/auth.module.ts` (CookieModule extraction — wiring only, no behavior change to
`CookieService` itself), `apps/api/src/common/guards/jwt-auth.guard.ts` (the DB status-check
fix), `apps/api/src/users/users.module.ts` (wiring for the two new controllers/services),
`apps/web/app/(app)/settings/page.tsx`, `apps/web/app/(marketing)/privacy/page.tsx`,
`packages/types/index.ts` (new `AccountExportResultDto`/`AccountExportJobDto`).

## 51. Files by classification

**SPRINT 10**: all files in §49/§50. **PRE-EXISTING**: none touched beyond the minimal wiring
above. **UNRELATED**: none. **GENERATED**: none (no Prisma client regen committed, no build
artifacts). **MACHINE-LOCAL**: none staged (`.env`/`.env.test` untouched, not in diff).

## 52. `git diff --check` result

Clean (exit 0) — only pre-existing LF/CRLF line-ending warnings, no conflict markers, no trailing
whitespace errors.

## 53. Working tree status

18 changed paths (6 modified, 12 new). Nothing staged, nothing committed.

## 54. Commit status

Not committed. Not pushed. Per instruction, Release Closure will decide the final commit.

## 55. Payment production verdict

**PAYOS INTEGRATION: CONTRACT VERIFIED** (unchanged, reverified). **PAYMENT PRODUCTION: BLOCKED**
— externally, not by any code gap (§27).

## 56. Sprint 10 verdict

# READY FOR SPRINT 10 RELEASE CLOSURE

All code-side launch hardening is complete: real, tested account export and deletion (backend
unit/e2e/frontend/Playwright all green), the auth-enforcement gap found during this sprint's own
work is fixed and verified, payment/premium logic is confirmed unaffected (48/48 existing tests),
full regression is green (98/914 backend unit, 67/320 frontend unit, 17/222 backend e2e, 28/33
Playwright with only pre-existing frozen-module failures), Prisma shows zero drift, and the one
remaining production blocker (PayOS real credentials/price/domain) is explicitly and honestly
documented as externally blocked, not fabricated as resolved.

## 57. Recommended Release Closure actions (superseded by the Release Closure section below)

See "RELEASE CLOSURE" below — this is the actual closure pass, performed independently of the
claims above, not a repeat of them.

---

# RELEASE CLOSURE (Independent Re-Verification)

Performed independently, without trusting the implementation report above at face value. Baseline
reconfirmed: HEAD `eee8aff` (= `origin/master`, 0 ahead/0 behind) at the start of closure, nothing
staged, no merge/rebase in progress. This section records what closure actually found — including
two genuine defects the implementation report above did not catch.

## C1. Independent reconstruction

Read every changed/new file directly (not just the report's description of them): the export
service, the deletion service and its transaction, `JwtAuthGuard`, `auth.service.ts`'s
refresh/forgot-password/reset-password paths, the webhook/entitlement services, and rebuilt the
full Prisma model inventory from `schema.prisma` (57 models) independently rather than trusting
§2's table.

## C2. Defect 1 — export omitted `MemoryNote` (found & fixed)

`docs/architecture/account-data-rights.md` §2 always classified `MemoryNote` (the deprecated but
still actively-written Sprint 1 "Memory Highlight" table — confirmed live via a real row in the dev
DB and a live call site in `MemoryService.createNote()`) as "Export? Yes", but
`AccountExportService.assemble()` never actually queried it. A real user's export would have
silently omitted this real personal content. **Fixed**: added as `memory.legacyNotes`
(`id`/`content`/`source`/`createdAt` only). Deletion was already correct — `memoryNote.deleteMany`
was already present in the transaction; only export had the gap. Covered by new assertions in
`account-export.service.spec.ts` and `account-data-rights.e2e-spec.ts`. See
`docs/architecture/account-data-rights.md` §7 for the full writeup.

## C3. Defect 2 — late webhook could mint a Premium entitlement for a deleted account (found & fixed)

Reproduced directly against the real HTTP surface: register → checkout → **delete account** → a
real, validly-signed `PAID` PayOS webhook for that order arrives afterward.
`PaymentWebhookService.applyPaymentResult()` correctly (and desirably) still transitioned the order
`PENDING` → `PAID` — the payment genuinely happened, so the accounting record must reflect that
regardless of what the buyer did with their account afterward — but it was unconditionally calling
`EntitlementService.grantPremium()` for the order's `userId` with no account-status check,
creating a brand-new `status: ACTIVE` `PremiumEntitlement` row against a scrubbed, `DELETED` user.

Under the current design this granted no actual access at the time of discovery — `JwtAuthGuard`
already refuses to authenticate any `DELETED` user regardless of entitlement state, and entitlement
lookups are by `userId` not email, so a later re-registration with the freed original email could
not have inherited it either (separately confirmed — see C5). It was nonetheless a genuine defect,
not a "safe retained accounting state": a dormant `ACTIVE` entitlement silently materializing
against a deleted identity is confusing for reporting/reconciliation, and would become a real, live
access-restoration bug the moment any future admin "undelete"/support-restore flow exists.

**Fixed**: `applyPaymentResult()` now checks `User.status` inside the same transaction before
calling `grantPremium()` — the order still transitions to `PAID` unconditionally (accounting stays
accurate); the entitlement grant is skipped (logged as
`payment.entitlement.skipped_inactive_account`) unless the account is still `ACTIVE`. Covered by 2
new unit tests (`payment-webhook.service.spec.ts`) and 1 new e2e reproduction using a real
`signPayOSData`-signed payload (`account-data-rights.e2e-spec.ts`). Full detail in
`docs/architecture/account-data-rights.md` §7.

## C4. Export cache isolation

Verified directly (not just by code inspection): User A's export is never returned to User B —
cache key is `account:export:{userId}:{jobId}`, so a different `userId` can never collide; a
cross-user fetch-by-jobId 404s (`account-data-rights.e2e-spec.ts`, pre-existing test, reverified
green). A deleted account cannot retrieve its own cached export either, since `JwtAuthGuard` already
rejects the request before the export controller is reached — the stale access token from before
deletion is refused at the guard layer, not at the export layer, which is the correct place for it.

## C5. Re-registration after deletion — explicitly tested, not left ambiguous

New e2e coverage: registering with the same original email after deletion succeeds and creates a
structurally unrelated new `User` row (new UUID) — the old row's email was already scrubbed to the
`.invalid` address, so there is no collision. A fresh registration with the freed email starts with
zero `PremiumEntitlement` rows and `isPremium: false` — **no entitlement inheritance by email**,
confirmed directly via `GET /payment/premium-status` on the new account, not inferred.

## C6. Old login / forgot-password / email-verification-resend after deletion

- **Old login**: fails (`401`) — reverified in the full-cascade e2e test; the credentials no longer
  resolve to any user (original email scrubbed).
- **Forgot-password**: `forgotPassword(email)` looks up by the *original* email, which no longer
  matches any user post-deletion, so it silently no-ops (`if (!user) return`) — identical,
  enumeration-safe behavior to any other unknown email, not a special case. Any `PasswordResetToken`
  that existed *before* deletion is hard-deleted by the deletion transaction itself, so even a
  pre-deletion reset link is dead afterward (`resetPassword` looks the token up and finds nothing →
  `RESET_TOKEN_EXPIRED`).
- **Email-verification-resend**: same reasoning — `EmailVerificationToken` rows are hard-deleted by
  the deletion transaction, and the resend endpoint is by-email and never reveals existence either
  way.

No path allows a deleted account to become recoverable.

## C7. Stale access token / stale refresh token / multi-session revocation

- **Access token**: reverified — a still-unexpired pre-deletion access token is rejected
  immediately on the very next request (`JwtAuthGuard`'s DB status check), tested against
  `/auth/me`.
- **Refresh token**: reverified — `AuthService.refresh()` looks up the session by
  `refreshTokenHash`; since the deletion transaction hard-deletes every `UserSession` row for the
  user, the lookup returns nothing and refresh is rejected (`401`), independent of the guard fix.
- **Multi-session**: **new test added**. Logged in from two independent sessions (two separate
  login calls, two separate access-token cookies), deleted the account from session A, and
  confirmed session B's still-unexpired access token is also immediately rejected — because
  deletion hard-deletes *every* `UserSession` row for the `userId`, not only the session that
  initiated the request. Not merely inferred from reading the code; reproduced with two real,
  independent sessions.

## C8. Per-module cleanup — reverified against real DB state

Companion (messages + conversations + AIUsage), Memory (all 10 Sprint-3A tables + the newly-fixed
legacy `MemoryNote`), Journal, Reflection/Insight/Review/Goal, Tarot/Numerology/Natal Chart: all
confirmed via direct Prisma count queries after a real HTTP `DELETE /users/me` call — not assumed
from the transaction's source code alone. All reach `0` for the deleted user.

## C9. AI usage / provider-log retention

`AIUsage` (has `userId`) is hard-deleted by the transaction — reconfirmed present at
`account-deletion.service.ts` line 58. `ProviderLog` has **no `userId` column at all** (schema
comment: "deliberately excludes conversation content, PII, and any request/response body") — not
user-linked by design, correctly out of scope for both deletion and export. No retained log
contains prompts, birth data, or user text tied to an identifiable user after deletion.

## C10. Premium entitlement / payment record retention — safety re-verified

- A Premium user who deletes their account loses access **immediately** — `JwtAuthGuard` blocks
  the `DELETED` status regardless of any retained `PremiumEntitlement` row; entitlement state was
  never part of the auth decision to begin with.
- Retained `PremiumEntitlement`/`PaymentOrder` rows cannot resurrect the account (no login path
  reads them) and cannot transfer to a re-registered account (entitlement lookups are strictly by
  `userId`, and a re-registration always gets a new `userId` — see C5).
- The one real gap in this area (late webhook minting a *fresh* entitlement post-deletion) is C3,
  now fixed.

## C11. JwtAuthGuard global regression

Reverified via the existing 6-case unit spec (`jwt-auth.guard.spec.ts`: no-cookie, invalid-signature,
ACTIVE-passes, DELETED-rejected, SUSPENDED-rejected, nonexistent-user-rejected) plus the full backend
unit/e2e suites (which exercise the guard on every protected route in the app — Companion, Tarot,
Numerology, Natal Chart, Premium/payment, `/users/me` — all still green). No regression for `ACTIVE`
users found anywhere in 916 backend unit + 226 backend e2e tests.

## C12. JwtAuthGuard performance

One additional indexed `User.findUnique({ where: { id }, select: { status: true } })` per
authenticated request — a primary-key point lookup. This mirrors the existing, already-accepted
`EntitlementService.hasPremiumAccess()` "compute at read time, no cache" precedent at the same
scale. Guards run once per request lifecycle in NestJS (not per SSE chunk), so long-lived Companion
streaming connections pay this cost once at connection open, not repeatedly. Not a regression
concern at this scale; no caching was added, matching the existing precedent rather than diverging
from it.

## C13. Quality gates — fresh, independent runs

| Gate | Result |
|---|---|
| `pnpm typecheck` | Clean (both apps) |
| `pnpm lint` | 0 errors (both apps); only pre-existing warnings, all in unrelated `insight` test files |
| Backend unit | **98/98 suites, 916/916 tests** (914 baseline + 2 new webhook-fix regression tests) |
| Frontend unit | **67/67 suites, 320/320 tests** (one contention-driven false-failure batch on first run, fully clean on isolated re-run — see C14) |
| Backend e2e | **17/17 suites, 226/226 tests** (222 baseline + 4 new: re-registration ×2, late webhook, multi-session) |
| `prisma validate` | Valid |
| `prisma migrate status` | Up to date, 16 migrations, no drift |
| `prisma generate` | EPERM while the production API process held the query-engine DLL (Windows file-lock, not a schema issue) — succeeded cleanly (5.35s) once that process was stopped; re-validated after |
| API production build | Fresh, clean |
| Web production build | Fresh, clean; `/settings` and `/privacy` build correctly; no `/menh-vi` expansion |
| `git diff --check` | Clean (only pre-existing CRLF warnings) |
| Secret scan (tracked diff + all new files) | No matches; no `.env` in diff; `Sup3r$ecretPass` confirmed as the same shared test fixture already used identically across 24 test files |

## C14. flow-24 stability — investigated, not dismissed

First 3-run batch: 2 passed (39.5s, 21.1s), 1 failed at the post-delete redirect assertion
(`toHaveURL(/\/login/)` timed out at 10s while the delete confirmation dialog was still visible).
This is my own Sprint 10 test, so it was root-caused, not waved off. Re-run 3 more times in
isolation immediately after: all 3 passed, at 10.8s, 23.1s, and 21.5s — a 4x variance in run time
for functionally identical runs is itself the evidence. The failure coincided with the same machine
concurrently finishing a full backend e2e run, a frontend unit re-run, and a `prisma generate`
attempt; the clean isolated reruns immediately after (10.8s — the fastest of all 6 runs) directly
support resource contention, not a code defect. Classified **D — environment/resource contention**.
The account-deletion transaction and redirect logic themselves are correct (confirmed by the Jest
e2e suite's own dedicated deletion test, which passed reliably in all 18/18 runs across the whole
closure session). The 10-second assertion timeout was **not** loosened to paper over this.

## C15. Full Playwright — production mode, fresh run

**28/33 passed.** `flow-24` (Sprint 10) and `flow-21` (payment/Premium regression) both passed in
this full run. `flow-23` (Natal Chart, Sprint 9) passed — no cross-sprint regression. The 5 failures
are the identical, previously-documented Reflection/Insight/Review signature
(`flow-15` ×2, `flow-16`, `flow-17`, `flow-18` Monthly Review — same locators, same timeouts,
"tagged 3 journal entries"/"Statistics" heading not appearing in time). This is now the third
independent reproduction of this exact signature across this session (Sprint 9 closure, Sprint 10
implementation, and this Sprint 10 closure), and Sprint 10's diff never touches Reflection, Insight,
Review, or Goal code. Classified **C — pre-existing defect** (background pattern-detection job
timing sensitivity in those frozen modules), confirmed unrelated to Sprint 10.

## C16. Manual verification — desktop / tablet / mobile

Real production-build browser screenshots (fresh users, real registration/onboarding) at 1440×900,
834×1112, and 390×844: Settings' "My data" section, the destructive delete confirmation dialog,
Privacy, and Discover all render correctly at all three sizes, no horizontal overflow, no broken
layout, no `/menh-vi` expansion, no Eastern-Horoscope work (still correctly shown as "Coming soon").
Tablet reconfirms the already-catalogued, pre-existing (Sprint 4B-era) cosmetic issue of the tablet
breakpoint sharing the mobile bottom-tab nav — not introduced or worsened by Sprint 10.

## C17. Security closure — explicit classification

**BLOCKER: none. HIGH: none.**

**MEDIUM (found during closure, both fixed — none remain open):**
- Late webhook could mint a dormant Premium entitlement for a deleted account (C3) — fixed.
- Account export silently omitted a real personal-content table (C2) — fixed.

**LOW:**
- Tablet shares the mobile bottom-tab nav layout (pre-existing, Sprint 4B, cosmetic only).

**INFORMATIONAL:**
- Payment/premium retention *period* is an explicit, undecided product/legal question (documented
  in `account-data-rights.md` §3, not fabricated).
- `AIUsage` (internal cost telemetry) is hard-deleted rather than retained — a deliberate choice,
  documented, not an oversight.

IDOR, CSRF, mass-assignment, stale-access-token, stale-refresh-token, multi-session, export-cache
leakage, cross-user export, cross-user deletion, late-webhook, entitlement-resurrection,
re-registration-collision, PII-retention, and AI/provider-log retention were all explicitly tested
with real reproductions, not solely code review. No unresolved BLOCKER or HIGH remains.

## C18. Payment regression / PayOS readiness

`flow-21` (Playwright) and the full `payment.e2e-spec.ts` (part of the 226/226 backend e2e run)
both green. Kill switch, webhook signature verification, idempotency, and amount/currency
validation all unchanged and reverified. PayOS status unchanged from the implementation report:
**CONTRACT VERIFIED**, production still **BLOCKED** externally (no real merchant credentials, no
price sign-off, no production domain/webhook registration) — not a code gap.

## C19. Bugs discovered during closure

1. Export omitted `MemoryNote` (C2) — **fixed**.
2. Late webhook could mint an entitlement for a deleted account (C3) — **fixed**.

No other defects found. Both are minimal, root-caused, tested, and documented — no unrelated
refactors, no Sprint 11 work, no scope expansion.

## C20. Runtime-unverified items (unchanged from the implementation report)

- Real PayOS sandbox/production transaction — no real merchant credentials in this environment.
- Exact legal retention period for payment records — explicit product/legal decision, not invented.

## C21. Commit gate

See working tree / commit status in the chat response's final numbered output (this document is
not re-narrated here to avoid drift between the two).

## PAYOS VERDICT

**PAYOS PRODUCTION BLOCKED** (externally — no code-side gap).

## SPRINT 10 VERDICT

# READY FOR SPRINT 11

Every closure gate is green, both genuine defects found during independent re-verification were
fixed and tested (not merely noted), no Blocker/High security finding remains open, and the one
remaining blocker (PayOS real-world production readiness) is a business/external dependency,
correctly and honestly still marked blocked rather than fabricated as resolved.
