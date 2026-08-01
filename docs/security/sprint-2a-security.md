# Sprint 2A — Production Hardening — Security Review

Scope: CSRF protection, Redis-backed rate limiting, production email provider
abstraction, email verification, session/device management, account security.
Builds on `docs/security/sprint-1-security.md`, which remains the record for
everything already reviewed there (password hashing, refresh-token rotation,
cookie flags, CORS, mass-assignment, etc.) — this document only covers what's
new or changed in Sprint 2A.

## 1. CSRF protection

### Threat model

Cookie-based auth (both access and refresh tokens in httpOnly cookies, per
Sprint 1) means the browser automatically attaches credentials to any
same-origin-cookie request, including one triggered by a malicious third-party
page. `SameSite=Lax` (Sprint 1's baseline) blocks cross-site **POST**
requests initiated by a script or auto-submitting form, but does not block:
- Cross-site requests that a browser's SameSite=Lax exception still allows
  (top-level GET navigations — not relevant for state changes, but a defense-
  in-depth token removes any reliance on browsers implementing this correctly).
- Any future weakening of the SameSite policy (e.g. if `AUTH_COOKIE_SAME_SITE`
  is ever set to `none` for a legitimate cross-origin embed use case).

CSRF only matters where an **ambient credential** (the session cookie) grants
authority a third party could ride on. Endpoints with no session yet
(register, login) or that are themselves gated by a possession token
(reset-password, verify-email, resend-verification) don't have that ambient
authority, so a forged cross-site request to them can't do anything the
attacker couldn't already do directly — CSRF protection there would be
friction with no matching threat.

### Implementation

Double-submit cookie: `beaconvie_csrf_token` (readable, `Secure`/`SameSite`-
flagged the same as the auth cookies, HMAC-signed with `CSRF_SECRET`).
`CsrfGuard` is a global `APP_GUARD` that rejects any `POST/PUT/PATCH/DELETE`
request unless `X-CSRF-Token` exactly matches the cookie and the cookie's
signature verifies. `GET /auth/csrf-token` issues one; the frontend
(`lib/api-client.ts`) reads it fresh from `document.cookie` on every mutating
request (never caches it — the server rotates it on every
register/login/refresh/logout/session-revoke) and retries once on a
`CSRF_TOKEN_MISSING`/`CSRF_TOKEN_INVALID` 403.

**Skips CSRF** (`@SkipCsrf()`): `register`, `login`, `refresh`,
`forgot-password`, `reset-password`, `verify-email`, `resend-verification` —
all either pre-session or possession-token-protected, per the threat model
above.

**Requires CSRF**: `logout`, `logout-all`, `change-password`, session
revoke, preferences update, all onboarding/companion mutation endpoints — any
authenticated state change. `refresh` is a deliberate exception even though
it *is* cookie-driven: it's called automatically by the frontend on a silent
401 retry with no user interaction and no guaranteed fresh CSRF token in hand
yet; the impact of a forged refresh call is low (it only rotates the caller's
own tokens, gated by `SameSite=Lax` for the POST itself), so the UX cost of
protecting it outweighs the marginal security gain. `logout`, by contrast,
**is** protected — logout-CSRF (forcing a user out mid-session) is a real
(if low-severity) nuisance vector, and the frontend always has a fresh token
by the time a user can click a logout button.

### Verified behavior

- Missing token → `403 CSRF_TOKEN_MISSING`.
- Wrong/forged token → `403 CSRF_TOKEN_INVALID`.
- Valid token → request proceeds.
- Public unauthenticated request (register) → succeeds with no token at all.
- `GET` requests never require a token (safe methods are exempt by spec).

All verified in `apps/api/test/account-security.e2e-spec.ts` (`describe('CSRF
(e2e)')`) plus a targeted case in `auth.e2e-spec.ts` for `/auth/logout`.

### Limits

- The signature only proves the cookie was minted by this server; it is not
  bound to a specific user session. Double-submit's actual security property
  (an attacker's page cannot read or set a cookie for our origin, so it
  cannot produce a header matching the victim's cookie) still holds
  regardless.
- Swagger's `X-CSRF-Token` header is documented as an `apiKey` scheme for
  discoverability; it isn't a real authentication scheme.

## 2. Redis-backed rate limiting

### Design

`RedisThrottlerStorageService` implements `@nestjs/throttler`'s
`ThrottlerStorage` interface with one atomic Lua script (`INCR` + a separate
block-marker key, mirroring the built-in in-memory implementation's
semantics exactly) against the existing `RedisService` connection — chosen
over a new third-party package since the interface is a single method and
ioredis is already a project dependency. Keys are namespaced under
`RATE_LIMIT_REDIS_PREFIX` (default `beaconvie:throttle`).

### Fail-open, by design

If Redis is unreachable, `increment()` catches the error, logs a rate-limited
warning, and returns an unlimited/not-blocked record — **requests are allowed
through**, not rejected. This is a deliberate availability-over-strictness
trade-off: an API that hard-fails all traffic (including login) because its
rate limiter's backing store hiccuped is a worse outcome than temporarily
reduced brute-force protection. Argon2's hashing cost, CORS, CSRF, and
per-account lockout-independent design still apply during any such window.
This is an explicit choice, not an oversight — flagged here for anyone
revisiting it.

### Login: IP + normalized email

`LoginThrottlerGuard` overrides the tracker to key on `${ip}:${email}`
instead of IP alone. This means: credential-stuffing one account from many
IPs is still throttled per-account; a shared corporate/NAT IP hitting many
different accounts doesn't lock out every user behind that IP. Register,
forgot-password, reset-password, verify-email, and resend-verification stay
IP-only — forgot-password/reset-password deliberately so (per-email keying
there would itself be a minor DoS vector against a specific victim's ability
to reset their own password), and register/verify because there's no
"account" to key against yet or the token itself is already the gate.

### Trust proxy

`TRUST_PROXY` (env, default `false`) controls Express's `trust proxy`
setting. Left disabled by default: trusting `X-Forwarded-For`
unconditionally without a known proxy topology lets a client spoof its own
IP and bypass IP-based limiting entirely. Only enable behind a verified
single reverse proxy (set to `true`) or a known hop count (a number).

### Verified behavior

Multi-process correctness is inherent to the Lua-script design (atomic
increment against a shared Redis, not per-process memory) — this is the
mechanism, not something separately mocked in a unit test. `AuthThrottlerGuard`
/ `LoginThrottlerGuard` behavior (429 after the configured max, friendly
message, no leaked exception detail) is covered by the pre-existing
`auth.e2e-spec.ts` rate-limit test, now parameterized against
`AUTH_RATE_LIMIT_MAX` instead of a hard-coded loop count so it stays correct
regardless of the configured test-environment ceiling.

## 3. Email provider abstraction

`MailProvider` interface + `MailpitMailProvider` (dev SMTP),
`ResendMailProvider`, `PostmarkMailProvider` (both plain `fetch` against
their REST APIs — no SDK dependency), selected by `EMAIL_PROVIDER`.
`env.validation.ts` fails fast at boot: production cannot select `mailpit`;
`resend`/`postmark` each require their credential (`RESEND_API_KEY` /
`POSTMARK_SERVER_TOKEN`) whenever selected, in any environment. `MailService`
never logs email body/HTML (which contains the verification/reset token URL)
— only the failure itself, and only the provider's own error response text
(not request content) is included in a thrown error message.

Every email link (`verify-email`, `reset-password`) is built from
`APP_PUBLIC_URL` — a fixed, explicitly-configured base URL, separate from
`FRONTEND_URL` — specifically so a link's destination can never be widened by
an unrelated `FRONTEND_URL` change (e.g. adding a marketing subdomain). This
is the "chống open redirect bằng base URL cố định" requirement: there is no
user-controlled or request-derived input in link construction anywhere in
this path.

## 4. Email verification

- `EmailVerificationToken`: hash-only (SHA-256, same as password-reset and
  refresh tokens), expiring (`EMAIL_VERIFICATION_EXPIRES_IN`, default 24h),
  single-use (`usedAt`).
- **Unlike** password-reset's deliberately-collapsed error code, verification
  distinguishes `VERIFICATION_TOKEN_EXPIRED` from `VERIFICATION_TOKEN_INVALID`
  — the token itself is already a secret only its recipient holds (delivered
  by email), so telling them which case applies leaks nothing about any other
  account. This is different from password-reset's oracle concern (there,
  the *email address* itself is the sensitive input being probed) — no
  equivalent risk exists here.
- `resend-verification` **is** enumeration-safe the same way forgot-password
  is: identical generic response whether the email doesn't exist, is already
  verified, or is under cooldown. Verified: `apps/api/test/account-security.e2e-spec.ts`.
- Cooldown (`EMAIL_VERIFICATION_RESEND_COOLDOWN`, default 60s) is enforced
  server-side by checking the most recent token's `createdAt`; the frontend's
  60s countdown is purely cosmetic and doesn't need to match exactly.
- **Non-blocking, by product decision**: there is no route guard, redirect,
  or feature gate tied to `emailVerifiedAt`. Every Sprint 1 flow (onboarding,
  dashboard, companion) works identically whether or not the email is
  verified. The dashboard shows a dismissible-by-navigation (not
  dismissible-by-click — it simply stops rendering once verified) banner
  with a resend action; that's the entire UX surface. This was a deliberate
  choice to satisfy "Không chặn người dùng bằng vòng lặp redirect" — a harder
  gate was considered and rejected as out of scope for what Sprint 2A asked
  for (hardening, not a new product requirement to gate features behind
  verification).

## 5. Session / device management

- Access tokens now carry a `sid` claim (the `UserSession.id`), set by
  restructuring `issueTokens` to create the session row *before* signing the
  access token. Tokens issued before this change (pre-Sprint-2A) have no
  `sid`; those users transparently regain one on their next login or
  refresh — no forced logout, no migration needed.
- `GET /auth/sessions`: active (non-revoked, non-expired) sessions for the
  caller only, each with `id`, `createdAt`, `lastUsedAt`, `current`, and a
  best-effort `userAgentSummary` (a small local regex heuristic — "Chrome on
  Windows" — not a full UA-parsing library, since it's display-only and never
  used for a security decision).
- **No IP address is stored or displayed.** Sprint 1 never collected client
  IPs; adding IP logging purely for a "device list" feature, without a
  clear consent/retention story, was judged not worth the privacy cost for
  what Sprint 2A asked for. This is a deliberate privacy-first scope
  decision, not an oversight — revisit if a future sprint has a concrete need
  (e.g. anomaly detection) that justifies it.
- `lastUsedAt` is updated on `/auth/refresh` (roughly every access-token
  lifetime, 15m by default) — not on every single authenticated request,
  to avoid a database write on every API call. This means "last active" is
  an approximation with up to one access-token-lifetime of lag, not exact.
- **Ownership**: `DELETE /auth/sessions/:id` checks `session.userId ===
  currentUser.id`; any other session ID (including a real one belonging to
  another user) returns `404 SESSION_NOT_FOUND` — deliberately not `403`, so
  a caller can't distinguish "not yours" from "doesn't exist" (a minor
  enumeration hardening). Verified in `account-security.e2e-spec.ts`.
- **Revoking the current session** clears the caller's cookies immediately
  (rather than leaving them holding a technically-still-valid access token
  until it naturally expires) — the more intuitive behavior for "sign out
  this device" clicked on the device itself.
- **`logout-all`** revokes *every* session including the caller's — an
  unambiguous "sign out everywhere" distinct from single-device `/auth/logout`.
  This was a required either/or decision (§8 of the brief); this is the
  documented choice.
- `SESSION_MAX_ACTIVE` (optional): if set, the oldest active session is
  evicted on a new login/refresh once the cap is reached, before the new
  session is created.

## 6. Account security

- `POST /auth/change-password` requires the current password (defense
  against a hijacked-but-still-open browser tab acting on stored session
  cookies alone). Revokes every **other** session; keeps the calling one —
  the user is actively, intentionally using it. Records `PASSWORD_CHANGED`.
- Password **reset** (forgot-password flow) keeps Sprint 1's existing
  "revoke all sessions" policy unchanged — there is no "current session" to
  preserve at that point (the browser completing a reset never held a
  session cookie for this account in the first place).
- New `ActivityEvent` types: `EMAIL_VERIFIED`, `PASSWORD_CHANGED`,
  `SESSION_REVOKED`, `LOGOUT_ALL`. Per the existing Sprint 1 constraint,
  `ActivityEvent.metadata` is never populated with anything sensitive for
  these — the type + timestamp is the entire record.
- **2FA readiness**: not built this sprint (explicitly out of scope), but
  nothing added here blocks it — `UserSession`/access-token `sid` design
  supports a future "pending 2FA" intermediate session state without a
  schema change to the parts already shipped; `User` has room for a
  `twoFactorSecret`/`twoFactorEnabledAt` pair to be added additively later.

## 7. Environment / secrets

All new required production secrets (`CSRF_SECRET`, provider credentials)
follow the same fail-fast pattern as Sprint 1's JWT secrets: `env.validation.ts`
refuses to boot in `NODE_ENV=production` with a placeholder or missing value.
No new secret has a hard-coded default anywhere. `.env`/`.env.test` (with
real, dev-only values) are gitignored, never committed; `.env.example`/
`.env.test.example` (tracked) contain only placeholders or `test-only-*`
values.

## 8. Residual risks / known gaps going into production

1. **No account-lockout escalation** beyond the flat, per-endpoint rate
   limit — carried over from Sprint 1, only partially mitigated by login's
   IP+email keying. Still no exponential backoff or CAPTCHA-style escalation.
2. **Refresh token remains a signed JWT**, not a fully opaque token — carried
   over from Sprint 1, not in this sprint's scope.
3. **No device/IP anomaly detection** ("new device" email, impossible-travel)
   — explicitly out of scope for Sprint 2A.
4. **`lastUsedAt` has up to one access-token-lifetime of lag** (see §5) — an
   intentional trade-off, not a bug, but worth knowing before relying on it
   for anything more than a rough "last seen" label.
5. **Login error specificity** (`ACCOUNT_NOT_FOUND` vs `WRONG_PASSWORD`) is
   unchanged from Sprint 1 — still an explicit, documented product trade-off,
   not touched this sprint.
6. **Rate limiter fail-open** (§2) — an explicit availability choice; a
   sustained Redis outage during an active credential-stuffing attempt would
   leave only Argon2's hashing cost and per-account application logic as
   defense, not the rate limiter.
7. **No WAF/DDoS-layer protection** — infrastructure-layer concern, out of
   scope, unchanged from Sprint 1.

## 9. Production checklist (before real deployment)

- [ ] Generate real, unique `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
      `CSRF_SECRET` (32+ random bytes each, never reused across environments).
- [ ] Set `AUTH_COOKIE_SECURE=true`, `NODE_ENV=production`.
- [ ] Set `EMAIL_PROVIDER=resend` or `postmark` with a real credential
      (`mailpit` is refused at boot in production).
- [ ] Set `APP_PUBLIC_URL` to the real production frontend origin.
- [ ] Set `TRUST_PROXY` correctly for the actual deployment topology (only
      `true`/a specific hop count if there genuinely is exactly one trusted
      reverse proxy in front of the API).
- [ ] Confirm `CORS_ORIGINS` is the exact production frontend origin(s), no
      wildcard.
- [ ] Confirm Redis is a managed/persistent instance (rate limiting and, in
      a future sprint, any session-adjacent caching depend on it being
      reachable — see fail-open note above for what happens if it isn't).
- [ ] Run a fresh `prisma migrate deploy` (not `migrate dev`) against the
      production database.
- [ ] Re-run the secret scan against the exact commit being deployed.
