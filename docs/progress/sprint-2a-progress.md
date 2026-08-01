# Sprint 2A — Production Hardening — Progress Log

Started from `ff7716944ff030ef1c593cf8df7b1b5cf6fc825e` (Sprint 1 final commit).
Working tree was clean at start; HEAD confirmed. This is a running build log —
`docs/progress/sprint-2a-final-report.md` will be the authoritative closure
record once done, same relationship Sprint 1 had between its progress log and
final report.

## Phase 0 — Audit

### Residual risks carried over from Sprint 1 (from `docs/security/sprint-1-security.md`
and `docs/progress/sprint-1-final-report.md` §15/16/18), and how Sprint 2A addresses each

| # | Sprint 1 residual risk | Sprint 2A disposition |
|---|---|---|
| 1 | No dedicated CSRF token (SameSite=Lax + CORS allowlist only) | **In scope.** Double-submit cookie CSRF token, applied to authenticated mutations. |
| 2 | Login error specificity (`ACCOUNT_NOT_FOUND` vs `WRONG_PASSWORD`) is an intentional enumeration trade-off | **Not touched** — explicit product decision from Sprint 1, not a hardening bug. Left as-is; only the *rate limiting* around login changes (IP+email composite key). |
| 3 | No device/IP anomaly detection | **Out of scope** for 2A (not listed in the 8 hardening areas). |
| 4 | No account lockout escalation beyond flat per-IP limit | **Partially addressed**: login rate limiting becomes IP+normalized-email composite (distributed credential stuffing against one account is now throttled per-account, not just per-IP), still no exponential backoff/escalation — that remains a future-sprint item. |
| 5 | Refresh token is a signed JWT, not fully opaque | **Not touched** — no requirement to change this in the 2A brief; still validated against a server-side hash on every use. |
| 6 | Email verification not implemented | **In scope.** Full flow added; verification is non-blocking (no redirect-loop gate), matching the "no vòng lặp redirect" constraint. |
| 7 | No WAF/DDoS-layer protection | **Out of scope** — infrastructure-layer concern, unchanged. |
| 8 (final report §18) | Rate limiting in-memory only, doesn't survive multi-instance/restart | **In scope.** Redis-backed via a custom `ThrottlerStorage` implementation (Lua script, atomic across instances). |
| 9 (final report §18) | No production email provider, Mailpit-only | **In scope.** `MailProvider` interface + Resend/Postmark adapters, selected by `EMAIL_PROVIDER`. |
| 10 (final report §16) | No session/device management UI | **In scope.** List/revoke/logout-all endpoints + Settings UI. |

### Explicitly out of scope for Sprint 2A (per the brief)

LLM Companion, Memory Engine, Journal, Discovery, Community — untouched. 2FA is
not built, but schema/API choices avoid blocking it later (see security doc).
No changes to Sprint 1 UX, API contracts, or already-shipped auth flows beyond
what hardening strictly requires (e.g. `MAIL_PROVIDER`/`MAIL_FROM` env vars are
renamed to `EMAIL_PROVIDER`/`EMAIL_FROM` because the brief explicitly names
those variables — documented as a deliberate, contained rename, not scope
creep).

## Build log

### Backend implementation (complete)

- **CSRF**: `common/csrf/{csrf.service,csrf.guard,csrf.module,skip-csrf.decorator,csrf.constants}.ts`.
  Double-submit cookie (`beaconvie_csrf_token`, non-httpOnly, HMAC-signed with
  `CSRF_SECRET`). Global `APP_GUARD`, skips safe methods + routes decorated
  `@SkipCsrf()` (register/login/refresh/forgot-password/reset-password/verify-email/resend-verification —
  all pre-session or possession-token-protected flows). `GET /auth/csrf-token`
  issues a token; register/login/refresh/logout/revokeSession(current)/logoutAll
  all rotate it via `CookieService.setCsrfCookie`.
- **Redis rate limiting**: `common/throttler/redis-throttler-storage.service.ts`
  — custom `ThrottlerStorage` using one atomic Lua script (INCR + block-marker)
  against the existing `RedisService` client, namespaced by `RATE_LIMIT_REDIS_PREFIX`.
  Fail-open on Redis errors (logged, rate-limited). `common/guards/login-throttler.guard.ts`
  keys login by `${ip}:${normalizedEmail}`. `TRUST_PROXY` wired in `main.ts`.
- **Email provider abstraction**: `mail/providers/{mail-provider.interface,mailpit-mail.provider,resend-mail.provider,postmark-mail.provider}.ts`,
  selected by `EMAIL_PROVIDER` in `mail.service.ts`. `env.validation.ts` fails
  fast if production selects `mailpit`, or if resend/postmark is selected
  without its credential.
- **Email verification**: `auth/email-verification.service.ts` +
  `EmailVerificationToken` Prisma model (hash-only, expiring, single-use) +
  `verify-email.template.ts`. `POST /auth/verify-email`, `POST /auth/resend-verification`
  (enumeration-safe, cooldown via `EMAIL_VERIFICATION_RESEND_COOLDOWN`).
  Non-blocking: no route guard changes, `UserDto.emailVerifiedAt` exposed for
  an optional frontend banner.
- **Sessions**: access tokens now carry a `sid` claim (`AuthService.issueTokens`
  creates the `UserSession` row before signing the access token). `GET /auth/sessions`,
  `DELETE /auth/sessions/:id`, `POST /auth/logout-all`. `SESSION_MAX_ACTIVE`
  evicts the oldest active session on new login if set.
- **Account security**: `POST /auth/change-password` (current-password required,
  revokes every *other* session, keeps the caller's). Password reset keeps
  Sprint 1's "revoke all" policy (no session exists at that point in the flow
  anyway). New `ActivityType` values: `EMAIL_VERIFIED`, `PASSWORD_CHANGED`,
  `SESSION_REVOKED`, `LOGOUT_ALL`.
- **Migration**: `20260731232649_sprint2a_hardening` — additive only (new enum
  values, new table). Applied to both the dev and test databases.
- **Env renames**: `MAIL_PROVIDER`→`EMAIL_PROVIDER`, `MAIL_FROM`→`EMAIL_FROM`
  (brief explicitly names the new vars). New: `CSRF_SECRET`, `APP_PUBLIC_URL`,
  `EMAIL_VERIFICATION_EXPIRES_IN`, `EMAIL_VERIFICATION_RESEND_COOLDOWN`,
  `RATE_LIMIT_REDIS_PREFIX`, `TRUST_PROXY`, `SESSION_MAX_ACTIVE`,
  `RESEND_API_KEY`, `POSTMARK_SERVER_TOKEN`.

### Frontend implementation (complete)

- **CSRF wiring**: `lib/api-client.ts` reads the CSRF cookie fresh from
  `document.cookie` on every mutating request (never caches it — the server
  rotates it on login/register/refresh/logout), bootstraps one via
  `GET /auth/csrf-token` if absent, and retries once on `CSRF_TOKEN_MISSING`/
  `CSRF_TOKEN_INVALID`.
- **Email verification**: `/verify-email` (reads `?token=`, calls the API,
  renders loading/success/expired/invalid/network-error states — never a
  toast-only outcome) and `/verify-email/pending` (resend form with a
  client-side cooldown countdown). Neither route is gated by route-guard.ts
  (confirmed by a new test case) — no redirect loop regardless of auth state.
  Non-blocking dashboard banner (`components/layout/verify-email-banner.tsx`)
  shown only while `!user.emailVerifiedAt`, with an inline resend action.
- **Settings**: `SessionsPanel` (list with current-device label, per-item
  revoke with a confirmation dialog, "Sign out all" with its own confirmation
  dialog, loading/error/empty states) and `ChangePasswordForm`, both added to
  `app/(app)/settings/page.tsx`.
- Added `authApi.{verifyEmail,resendVerification,changePassword,sessions,
  revokeSession,logoutAll}` and `api.delete()` to the client.

### Verification results (final)

All of the following were run to green in this sandbox (Docker Desktop GUI
killed to free RAM; engine/containers kept running via WSL2 — see environment
note):

| Check | Result |
|---|---|
| `apps/api` lint | **PASS** |
| `apps/api` `tsc --noEmit` | **PASS** |
| `apps/api` unit tests | **PASS** (16/16) |
| `apps/api` e2e tests | **PASS** (36/36 — `auth`, `onboarding`, `dashboard`, new `account-security` specs) |
| `apps/api` `nest build` | **PASS** |
| `prisma validate` | **PASS** |
| `prisma migrate status` (dev + test DB) | **PASS** — up to date, no drift |
| `apps/web` lint | **PASS** |
| `apps/web` `tsc --noEmit` | **PASS** |
| `apps/web` unit tests | **PASS** (37/37, 9 suites) |
| `apps/web` `next build` | **PASS** (20 static routes incl. the 2 new verify-email routes) |
| Playwright e2e (3 required flows) | **NOT COMPLETED** — see environment note |

New/changed test infrastructure along the way:
- `test/utils/test-app.ts`: added `csrfHeaders()` helper; every authenticated
  mutation call across `auth/onboarding/dashboard.e2e-spec.ts` now sends
  `X-CSRF-Token` + the CSRF cookie (these predate CSRF and needed updating).
- `test/jest-e2e.global-setup.js`: flushes `RATE_LIMIT_REDIS_PREFIX:*` keys
  once before the suite — the Redis-backed limiter (correctly) persists
  across process restarts now, unlike Sprint 1's in-memory storage, so
  repeated local runs would otherwise self-throttle.
- `AUTH_RATE_LIMIT_MAX` raised to `200` in `.env.test`/`.env.test.example`/CI
  (was `20`) — the new `account-security.e2e-spec.ts` file alone issues
  ~18 register calls; combined with the other three spec files (~35 register
  calls total against one shared, endpoint-scoped Redis bucket) that exceeded
  the old ceiling. The rate-limit test itself now derives its loop count from
  `AUTH_RATE_LIMIT_MAX` instead of a hard-coded number, so it stays correct
  regardless of the configured value.
- `apps/web/jest.setup.ts`: two jsdom-environment polyfills added
  (`HTMLDialogElement.showModal/close`, `crypto.randomUUID`) — both pre-existing
  jsdom gaps that Sprint 1's tests never happened to exercise (no prior test
  opened a `<dialog>` or triggered a toast); the new `SessionsPanel` tests are
  the first to do both.
- `HttpExceptionFilter`: added a duck-typed fallback branch for exceptions
  that fail `instanceof Error` (logs the real message/stack instead of an
  opaque "{}") — this is what surfaced the environment issue below; kept as a
  permanent, real observability improvement.

### Environment note (this sandbox specifically — read before trusting a future "it doesn't work" report here)

This VM is severely memory-constrained (8GB RAM; free physical memory
fluctuated between ~400MB and ~1.5GB throughout this session; Windows
"Memory Compression" exceeded 1GB at times). This produced several **real,
reproducible infrastructure failures unrelated to Sprint 2A's code**:

1. `argon2`'s native addon rejected with `Memory allocation error` under
   pressure — confirmed harmless-to-code via the `HttpExceptionFilter` fix
   above, which revealed the real message (previously logged as an opaque
   `{}` because the native error object fails `instanceof Error`).
2. **One instance of silent hash corruption**: a `prisma db seed` run
   completed without error but produced a password hash that didn't verify
   against the intended plaintext password (confirmed via a direct
   `argon2.verify` check) — re-running the seed under more free memory
   produced a correct hash. This is a property of running a memory-hard KDF
   on a system with insufficient free RAM, not a code defect; flagged here
   because it's a more serious failure mode than a clean exception.
3. Postgres and Redis containers were intermittently unreachable from Node
   (`ECONNRESET` / "can't reach database server") while remaining reachable
   via `docker exec` and from PowerShell's `Test-NetConnection` — consistent
   with the Windows↔WSL2 port-forwarding relay (`wslrelay.exe`) degrading
   under memory pressure combined with the volume of reconnect attempts this
   session generated. Restarting the affected container (`docker compose
   restart <service>`) reliably fixed this each time.
4. The Playwright test runner (Chromium + 2 Node servers + Playwright's own
   process, concurrently) hit a hard V8 `JavaScript heap out of memory` crash.

Mitigations applied: killed the Docker Desktop GUI (frees ~300MB; the engine
keeps running via WSL2 regardless). A WSL2 memory cap
(`C:\Users\Admin\.wslconfig`, `memory=1.5GB`) was tried and **reverted** —
it was too aggressive and caused Postgres itself to be OOM-killed inside the
VM, which was worse. No lasting system changes remain from this
troubleshooting.

**Net effect**: every check that could be run to a clean, reproducible
result was — and all of them pass (table above). Playwright is the one
piece not completed in this sandbox; the CI workflow (`ci.yml`) now runs it
in GitHub Actions' full-sized runners, where this class of failure is not
expected. This is reported honestly rather than assumed, per the sprint's
explicit "chỉ xác nhận phần đã kiểm chứng" instruction — see the final report
for the precise scope of what "verified" means here.
