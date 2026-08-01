# BeaconVie — Sprint 2A Final Report

Release closure verification completed 2026-08-01, starting from
`ff7716944ff030ef1c593cf8df7b1b5cf6fc825e` (Sprint 1 final commit). This is
the authoritative Sprint 2A record; `docs/progress/sprint-2a-progress.md`
holds the running build log, and `docs/security/sprint-2a-security.md` holds
the detailed security/threat-model record referenced throughout.

**Closure re-verification pass** (same day, second session): re-ran git
diff/status, re-attempted the full Playwright suite once more, fixed one real
gap found in the CI Playwright job (missing demo-account seed step — see
§10), and ran a targeted security re-audit of the eight Sprint 2A feature
areas (§11). No code was changed as a result of the security re-audit
itself, per that review's own scope ("report findings, don't redesign") —
the findings are recorded for a deliberate follow-up decision.

## 1. Sprint 2A scope

Production hardening of the account/auth/operations layer built in Sprint 1:
CSRF protection, email verification, Redis-backed distributed rate limiting,
a production email provider abstraction, session/device management, account
security (change password + session revocation policy), CI hardening, and
security/operational documentation. No LLM Companion, Memory Engine,
Journal, Discovery, or Community work — none of that was touched. Sprint 1's
existing flows (registration, login, onboarding, dashboard) were not
redesigned; only the additive hardening described below was made.

## 2. Files changed

**Backend — new files** (24):
`common/csrf/{csrf.constants,csrf.service,csrf.guard,csrf.module,skip-csrf.decorator}.ts`,
`common/throttler/redis-throttler-storage.service.ts`,
`common/guards/login-throttler.guard.ts`,
`common/utils/{hash-token.util,user-agent.util}.ts`,
`auth/email-verification.service.ts`,
`auth/dto/{change-password,verify-email,resend-verification}.dto.ts`,
`mail/providers/{mail-provider.interface,mailpit-mail.provider,resend-mail.provider,postmark-mail.provider}.ts`,
`mail/templates/verify-email.template.ts`,
`test/account-security.e2e-spec.ts`, `test/jest-e2e.global-setup.js`,
`prisma/migrations/20260731232649_sprint2a_hardening/`.

**Backend — modified**: `app.module.ts`, `main.ts`, `config/{configuration,env.validation}.ts`,
`auth/{auth.controller,auth.module,auth.service,cookie.service}.ts`,
`common/decorators/current-user.decorator.ts`, `common/guards/jwt-auth.guard.ts`,
`common/filters/http-exception.filter.ts`, `mail/mail.service.ts`,
`users/users.service.ts`, `activities/activities.service.ts`,
`prisma/schema.prisma`, `test/{auth,onboarding,dashboard}.e2e-spec.ts`,
`test/utils/test-app.ts`, `test/jest-e2e.json`, `.env.example`, `.env.test.example`.

**Frontend — new files** (9):
`app/(auth)/verify-email/page.tsx`, `app/(auth)/verify-email/pending/page.tsx`,
`features/auth/components/{verify-email-status,resend-verification-form}.tsx`
(+ their `.test.tsx`), `features/settings/components/{sessions-panel,change-password-form}.tsx`
(+ their `.test.tsx`), `components/layout/verify-email-banner.tsx`.

**Frontend — modified**: `lib/api-client.ts`, `features/auth/api/auth-api.ts`,
`features/auth/schemas/auth-schemas.ts`, `components/layout/app-shell.tsx`,
`app/(app)/settings/page.tsx`, `lib/route-guard.test.ts`, `jest.setup.ts`.

**Shared**: `packages/types/index.ts` (added `SessionDto`, `UserDto.emailVerifiedAt`,
extended `DashboardActivityItemDto`).

**Infra/docs**: `.github/workflows/ci.yml`, `docs/progress/sprint-2a-progress.md`
(new), `docs/security/sprint-2a-security.md` (new), this file (new).

**Deleted files**: none.

## 3. Migrations

One migration: `20260731232649_sprint2a_hardening`. Additive only — no
column drops, no data loss:
- `ActivityType` enum gains `EMAIL_VERIFIED`, `PASSWORD_CHANGED`,
  `SESSION_REVOKED`, `LOGOUT_ALL`.
- New table `email_verification_tokens` (hash-only, expiring, single-use —
  same shape as Sprint 1's `password_reset_tokens`).

Applied to both the local dev and test databases; `prisma migrate status`
confirms both are up to date with no drift.

## 4. Environment variables

**Renamed** (brief explicitly specifies the new names): `MAIL_PROVIDER` →
`EMAIL_PROVIDER`, `MAIL_FROM` → `EMAIL_FROM`.

**New, required**:
- `CSRF_SECRET` — HMAC key for the CSRF double-submit token (32+ chars,
  same fail-fast-if-placeholder rule in production as the JWT secrets).

**New, required in production / optional in dev** (defaults to `mailpit` /
falls back to `FRONTEND_URL`):
- `EMAIL_PROVIDER` (`mailpit` | `resend` | `postmark`) — production may not
  select `mailpit`.
- `APP_PUBLIC_URL` — fixed base URL for links inside emails; required in
  production, falls back to `FRONTEND_URL` in dev/test.

**New, conditionally required**:
- `RESEND_API_KEY` — required iff `EMAIL_PROVIDER=resend`.
- `POSTMARK_SERVER_TOKEN` — required iff `EMAIL_PROVIDER=postmark`.

**New, optional (sensible defaults)**:
- `EMAIL_VERIFICATION_EXPIRES_IN` (default `24h`)
- `EMAIL_VERIFICATION_RESEND_COOLDOWN` (default `60s`)
- `RATE_LIMIT_REDIS_PREFIX` (default `beaconvie:throttle`)
- `TRUST_PROXY` (default `false`)
- `SESSION_MAX_ACTIVE` (unset = unlimited)

All of the above are documented with rationale comments in
`apps/api/.env.example`/`.env.test.example`, validated by
`apps/api/src/config/env.validation.ts` (Zod schema + production fail-fast
checks), and mirrored in `.github/workflows/ci.yml`'s job-level `env:` block.
No new variable has a working default value that would silently weaken
security if left unset in production — each either has no default (fails
validation) or defaults to the safe/disabled option.

## 5. API endpoints

New:
```
GET    /auth/csrf-token
POST   /auth/verify-email
POST   /auth/resend-verification
POST   /auth/change-password
GET    /auth/sessions
DELETE /auth/sessions/:id
POST   /auth/logout-all
```
Unchanged from Sprint 1: `register/login/refresh/logout/me/forgot-password/
reset-password`, plus all `onboarding/companion/dashboard/users` endpoints —
no request/response shape changes, only the new CSRF/rate-limit guard
behavior layered on top (see security doc for exactly which routes require a
CSRF token).

## 6. Frontend routes

New: `/verify-email`, `/verify-email/pending`. Both pass through
`route-guard.ts` unconditionally regardless of auth state (verified by a new
test case) — no redirect loop possible. Settings (`/settings`) gained a
Sessions section and a Change Password form; the app shell gained a
non-blocking, dismiss-by-verifying (not dismiss-by-click) email banner.

## 7. Tests

- Backend: 16 unit tests (unchanged from Sprint 1) + **36 e2e tests**
  (17 pre-existing across `auth/onboarding/dashboard`, updated for CSRF, +
  19 new in `account-security.e2e-spec.ts` covering CSRF missing/invalid/
  valid/public-request cases, email verification valid/expired/invalid/
  enumeration-safe/cooldown/already-verified, session list/multi-device/
  ownership/current-session-revoke/logout-all, and change-password
  wrong-current/success-with-session-revocation).
- Frontend: 37 tests across 9 suites (19 pre-existing + 18 new: verify-email
  status states, resend-verification cooldown, change-password form,
  sessions panel list/empty/error/revoke/logout-all, route-guard passthrough
  for the two new routes).

## 8. Commands executed (this closure session)

```
git status / git diff --check / git diff --stat
docker ps (containers already running and healthy from the prior session)
Full Playwright suite attempted once more — see §10
Re-read source for CSRF, email verification, rate limiter, sessions, password
  change, logout-all, cookie/CORS config for the security re-audit — see §11
git add . / review staged files / git commit (no push)
```
Commands executed in the prior implementation session (still valid, not
re-run here since nothing they cover changed): `pnpm install --frozen-lockfile`,
`prisma migrate dev`/`migrate deploy`/`validate`/`migrate status` (both DBs),
lint/typecheck/unit/e2e/build for both `apps/api` and `apps/web`, secret scan.

## 9. Exact PASS/FAIL results

| Check | Result |
|---|---|
| `apps/api` lint | **PASS** |
| `apps/api` typecheck | **PASS** |
| `apps/api` unit tests | **PASS** (16/16) |
| `apps/api` e2e tests | **PASS** (36/36, 4 suites) |
| `apps/api` production build | **PASS** |
| `prisma validate` | **PASS** |
| `prisma migrate status` (dev + test) | **PASS**, no drift |
| `apps/web` lint | **PASS** |
| `apps/web` typecheck | **PASS** |
| `apps/web` unit tests | **PASS** (37/37, 9 suites) |
| `apps/web` production build | **PASS** (20 routes) |
| Playwright (3 required flows) | **RUNTIME UNVERIFIED LOCALLY** — attempted twice (implementation session + this closure pass), both times a reproducible `JavaScript heap out of memory` crash in the Playwright/Chromium process itself, not the app under test (see §10). Backend logic each flow exercises was independently verified via curl + direct DB checks and the full API e2e suite. **Not claimed as passing.** |
| Secret scan | **PASS** — no leaked credentials outside gitignored `.env`/`.env.test` |
| `git diff --check` | **PASS** — no whitespace errors, no merge conflict markers |
| `git status` | 56 changed paths, **0 deleted files**, all new files are intentional Sprint 2A additions (§2) |

## 10. Environment limitations disclosed

This sandbox VM has 8GB RAM and was frequently under 1GB free during both
verification sessions, which caused several real infrastructure failures
unrelated to Sprint 2A's code (native-binding memory-allocation errors, one
instance of silent argon2 hash corruption caught and re-verified,
intermittent container port-forwarding drops recovered via container
restart, and two separate Playwright/Chromium `heap out of memory` crashes —
one per verification session, both reproducible, both with under 700MB free
physical memory at the time). Full detail, what was tried, and what was
reverted is in `docs/progress/sprint-2a-progress.md`'s environment note.
Nothing here reflects a defect in the Sprint 2A implementation — every check
that could run to a clean, reproducible result did, and passed twice.

**Playwright is explicitly not claimed as passing.** Its runtime status is
**unverified locally** — both attempts failed on VM resource exhaustion
before any test assertion ran or failed on its own merits. This closure pass
found and fixed a real gap in the CI path that would otherwise have made a
CI run fail for an unrelated reason: the "Run Playwright e2e" job never ran
`prisma:seed`, but two of the three required flows (`flow-2-login-existing-user`,
`flow-3-forgot-reset-password`) log in as the seeded `demo@beaconvie.local`
account. Added a `Seed demo account` step to `.github/workflows/ci.yml`
immediately before the Playwright step. This was caught by reasoning through
the flow specs against the workflow file, not by a green CI run (this
sandbox has no way to trigger/observe GitHub Actions) — **recommend watching
the first real CI run closely** in case anything else about the hosted
runner's environment differs from what these flows assume.

One residual host-machine change from troubleshooting: none — a WSL2 memory
cap (`.wslconfig`) was tried during the implementation session and explicitly
reverted after it made Postgres less stable, not more. The system is in its
original configuration.

## 11. Security re-audit (this closure session — Sprint 2A features only)

Scope: CSRF, email verification, Redis rate limiter, sessions, password
change, logout-all, cookies, CORS. Method: re-read the current source (not
the design description) for each area, looking specifically for regression,
missing validation, accidental exposure, race conditions, and authorization
bugs. No code was changed for any of these — reported only, per this pass's
explicit scope.

| # | Severity | Area | Finding |
|---|---|---|---|
| 1 | Low | Password change | `AuthService.changePassword` excludes the caller's own session from revocation via `id: { not: currentSessionId }` — but only when `currentSessionId` is truthy. If it's `undefined` (only possible for an access token issued before Sprint 2A's `sid` claim existed), the exclusion clause disappears entirely and **every** session is revoked, including the caller's — contradicting the documented "keeps the calling session" behavior. Self-healing within one access-token lifetime (≤15 min) since every token issued by this code already carries `sid`; only matters if this exact JWT scheme were ever upgraded-in-place onto an existing user base with live pre-Sprint-2A tokens, which hasn't happened here. `apps/api/src/auth/auth.service.ts:233-257`. |
| 2 | Low | Sessions | Same root cause as #1: `listSessions`/`revokeSession` compare against `currentSessionId`; if undefined, no session ever reports `current: true`, and revoking a user's actual current session doesn't trigger the cookie-clear branch in the controller. Cosmetic only, same self-healing window. `apps/api/src/auth/auth.service.ts:262-285`. |
| 3 | Low | Email verification | `verify()` is a read-then-write (`findUnique` for `usedAt`, then a separate `$transaction` to set it) with no row lock — two concurrent requests carrying the *same* valid token could both pass the not-yet-used check before either commits, both succeed, and both log a duplicate `EMAIL_VERIFIED` `ActivityEvent`. Not a security bypass (both callers already possess the one valid token — no cross-account exposure), just a duplicate log entry. Identical pattern to Sprint 1's `resetPassword`, so not a new class of issue introduced this sprint. `apps/api/src/auth/email-verification.service.ts:61-85`. |
| 4 | Low | Email verification | `resend()`'s cooldown check has the same read-then-act shape: two near-simultaneous resend calls (e.g. a double-click) can both read the same "latest token" state and both pass the cooldown check, sending two emails within one cooldown window. Self-inflicted only — can't be used to spam a *different* account beyond what one legitimate click already permits. `apps/api/src/auth/email-verification.service.ts:37-53`. |
| 5 | Informational | CSRF / rate limiting | `GET /auth/csrf-token` and every other endpoint not explicitly decorated with `@UseGuards(AuthThrottlerGuard)`/`@Throttle(...)` has **no rate limiting at all**. The `default` throttler entry registered in `ThrottlerModule` (`app.module.ts`) is dead configuration — nothing applies it as a global guard, only `CsrfGuard` is registered via `APP_GUARD`. This is a pre-existing Sprint 1 characteristic, not a Sprint 2A regression, but Sprint 2A's new `GET /auth/csrf-token` and `GET /auth/sessions` inherit it. Low practical risk (cheap, read-only, and `/auth/sessions` is already auth-gated), but worth a conscious decision rather than leaving it implicit. |
| 6 | Informational | Sessions / logout-all | Revoking a session (`DELETE /auth/sessions/:id`) or `POST /auth/logout-all` only revokes the underlying `UserSession` row — it does not invalidate that browser's *access-token* cookie, because `JwtAuthGuard` verifies access tokens purely by signature+expiry and never checks `UserSession.revokedAt`. So a revoked device's access token remains usable for authenticated calls for up to its remaining lifetime (≤15 min by default) after being "signed out"; only the *refresh* path is immediately and provably cut off. Inherited from Sprint 1's stateless-access-token design (already implicitly acknowledged by a comment in `e2e/flow-3-forgot-reset-password.spec.ts`), not a Sprint 2A regression, but worth stating explicitly since it bears directly on how "immediate" the new session-management UI's revoke action actually is. |

No missing input validation, no accidental data exposure, and no
authorization bypass were found — specifically checked and confirmed clean:
`passwordHash`/`refreshTokenHash`/`emailVerificationToken.tokenHash` are
never serialized to any response (grepped, and covered by an explicit e2e
assertion for the sessions list); `DELETE /auth/sessions/:id` correctly
returns `404 SESSION_NOT_FOUND` (not `403`) for a session belonging to
another user, so ownership can't be probed; CORS remains an explicit,
env-driven allowlist with no wildcard; cookie flags (`httpOnly`, `secure`,
`sameSite`, `domain`) are all env-driven with no hardcoded insecure default,
and the CSRF cookie's HMAC signature check uses `timingSafeEqual`.

None of the six findings above block this closure — all are Low or
Informational, none are exploitable across accounts, and #1–#4 are either
self-healing or pre-existing patterns. They're recorded here as a deliberate
backlog rather than fixed inline, per this review's scope.

## 12. Known limitations / residual risks

See `docs/security/sprint-2a-security.md` §8 for the full list with
rationale. Summary: no account-lockout escalation beyond flat per-endpoint
limits, refresh token remains a signed JWT (not opaque), no device/IP
anomaly detection, `lastUsedAt` has up to one access-token-lifetime of lag
by design, login's `ACCOUNT_NOT_FOUND`/`WRONG_PASSWORD` distinction is
unchanged from Sprint 1, rate limiter fails open on Redis outage (deliberate
availability trade-off), no WAF/DDoS layer (infrastructure concern). None of
these are regressions — they're either carried over from Sprint 1's
documented residual risks or new, deliberate trade-offs explained in the
security doc.

**Not claimed**: this is not an exhaustive security audit, and Sprint 2A
does not make BeaconVie unconditionally "production-ready" — it closes the
specific gaps listed in the Sprint 2A brief's 8 hardening areas. The
production checklist in the security doc (§9 there) lists what still needs
to happen at actual deploy time (real secrets, real email provider
credentials, `TRUST_PROXY`/`CORS_ORIGINS` set for the real topology, etc.).

## 13. Exact next step

1. Run the Playwright suite once in a properly-resourced environment — the
   CI job now includes the seed step it was missing (§10); watch its first
   real run closely rather than assuming it will be clean.
2. Push the branch / open a PR for review — this session commits the
   Sprint 2A changes locally but does not push, per instructions.
3. Decide on the six security re-audit findings in §11 — none block release,
   but #1/#2 (the undefined-`sessionId` edge case) is the one worth an actual
   follow-up fix before this JWT scheme is ever upgraded onto a live user
   base with pre-existing tokens.
4. Before any production deploy, work through the checklist in
   `docs/security/sprint-2a-security.md` §9.
5. Sprint 2B (or wherever this heads next): the residual risks in §12 above
   are the natural backlog — particularly account-lockout escalation and
   device/IP anomaly detection if abuse is observed.
