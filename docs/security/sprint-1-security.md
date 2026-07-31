# Sprint 1 — Security Review

Scope: authentication, session management, onboarding, dashboard. Audited against
the checklist in the Sprint 1 brief §12.

## Implemented

| Area | Implementation |
|---|---|
| **Password hashing** | Argon2id (`argon2` package defaults) for `User.passwordHash`. Never logged, never returned in any API response (DTOs are hand-mapped, never `return user` directly). |
| **Enumeration attack** | `POST /auth/forgot-password` returns an identical `200` + message regardless of whether the email exists (`AuthService.forgotPassword` short-circuits silently for unknown emails). `POST /auth/login` does distinguish "account not found" vs "wrong password" per docs/reference Module 6 §11's explicit UX requirement — this is a deliberate, documented trade-off (see below), not an oversight. |
| **Brute force / rate limiting** | `@nestjs/throttler` guards `register`, `login`, `forgot-password`, `reset-password` with a configurable window (`AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_MS`, default 5 requests / 15 minutes per IP). Verified via `test/auth.e2e-spec.ts`'s rate-limit test and manual smoke testing (confirmed `429` after the limit). |
| **Refresh token rotation** | Every `/auth/refresh` call issues a new refresh token and revokes the old `UserSession` row. Reuse of an already-rotated token revokes the entire session family (`familyId`) — the standard "rotation + reuse detection" pattern. Verified in `test/auth.e2e-spec.ts`. |
| **Token storage** | Refresh tokens are **never** stored in plaintext — only a SHA-256 hash (`UserSession.refreshTokenHash`, unique-indexed). Password reset tokens are stored the same way (`PasswordResetToken.tokenHash`). |
| **Cookie flags** | Centralized in `CookieService` (single source of truth, per requirement). `httpOnly: true` always; `secure` from `AUTH_COOKIE_SECURE` (must be `true` in production — enforced by `env.validation.ts`'s fail-fast check); `sameSite` from `AUTH_COOKIE_SAME_SITE`; `domain` from `AUTH_COOKIE_DOMAIN` (never hard-coded). Refresh cookie is additionally scoped to `path: /auth` to limit its exposure to auth endpoints only. |
| **CORS** | Allowlist from `CORS_ORIGINS` env var (comma-separated), `credentials: true`. No wildcard origin. |
| **CSRF** | Mitigated primarily via `SameSite=Lax` on both auth cookies (blocks cross-site POST from a third-party page) plus the CORS allowlist (a cross-origin `fetch` with `credentials: 'include'` is blocked unless the origin is allow-listed). No separate CSRF token is implemented in Sprint 1 — see "Residual risk" below. |
| **XSS** | React's default escaping + no `dangerouslySetInnerHTML` anywhere in the codebase. `helmet()` sets standard security headers (`X-Content-Type-Options`, etc.) on the API. Auth tokens are httpOnly (not reachable via `document.cookie` from injected JS), which meaningfully limits the blast radius of any XSS that does occur. |
| **SQL injection** | All database access goes through Prisma's parameterized query builder — no raw string-interpolated SQL anywhere (`prisma.$queryRaw` is used exactly once, for the health check, with a static query and no interpolated input). |
| **Mass assignment** | Every write endpoint uses an explicit `class-validator` DTO with `whitelist: true, forbidNonWhitelisted: true` on the global `ValidationPipe` — unknown/extra fields in a request body are rejected, not silently accepted. |
| **Excessive data exposure** | Every response is hand-mapped to a DTO (`UsersService.toDto`, etc.) — Prisma entities (which contain `passwordHash`, `refreshTokenHash`) are never returned directly from a controller. |
| **Error information leakage** | `HttpExceptionFilter` normalizes every error into `{ error: { code, message } }`; stack traces are logged server-side only (via the structured logger) and never included in the HTTP response, in any environment. |
| **Reset-password token storage** | Hash-only (see above), single-use (`usedAt` checked and set atomically), and every existing session is revoked on a successful reset (a compromised-password scenario shouldn't leave old sessions valid). |
| **Reset-password expiration** | `PASSWORD_RESET_EXPIRES_IN` (default 1h) enforced server-side; an expired or already-used token returns the same generic "This link has expired." error. |
| **Session revocation** | `POST /auth/logout` revokes exactly the calling session (`revokedAt` set on that `UserSession` row) — verified by testing that a subsequent `/auth/refresh` with the same (now-revoked) cookie fails. |
| **Environment secret validation** | `env.validation.ts` fails fast on boot (throws before the app starts) if any required var is missing/malformed, and specifically refuses to boot in `NODE_ENV=production` with `AUTH_COOKIE_SECURE=false` or a still-default placeholder JWT secret. |

## Residual risks / known gaps (before production)

1. **No dedicated CSRF token.** SameSite=Lax + CORS allowlist is a reasonable
   baseline for Sprint 1, but a defense-in-depth CSRF token (double-submit cookie
   or synchronizer token) should be added before handling anything more sensitive
   than the current auth/onboarding/dashboard surface, per docs/reference Module 6
   §10's "CSRF token on state-changing requests as defense in depth."
2. **Login error specificity** (`ACCOUNT_NOT_FOUND` vs `WRONG_PASSWORD`) is an
   intentional email-enumeration trade-off matching docs/reference Module 6 §11's
   explicit UX requirement, not an oversight — but it is a real enumeration vector
   at the login endpoint specifically (forgot-password is enumeration-safe).
   Revisit if abuse is observed; rate limiting is the current mitigating control.
3. **No device/IP anomaly detection** ("new device" email, impossible-travel
   detection) — out of Sprint 1 scope per the brief.
4. **No account lockout escalation** beyond the flat rate limit — a determined
   attacker distributed across many IPs isn't slowed further. Acceptable for
   Sprint 1; revisit with a per-account (not just per-IP) counter before
   production.
5. **Refresh token is a signed JWT, not a fully opaque random token.** It's still
   validated against a server-side hash on every use (so revocation works
   correctly), but a stolen-but-not-yet-used refresh JWT's claims (`sub`,
   `familyId`) are readable without the secret. No sensitive data is in the
   payload, so this is low severity, but an opaque random token is marginally
   safer and worth considering pre-production.
6. **Email verification is not implemented** (see `docs/architecture/sprint-1-decisions.md`)
   — `emailVerifiedAt` exists in the schema but nothing sets it. Cross-device
   memory persistence / Premium-purchase gating that docs/reference ties to email
   verification doesn't exist yet in Sprint 1 anyway, so this has no functional
   impact yet, but must be built before those features ship.
7. **No WAF / DDoS-layer protection** — expected to be handled at the
   infrastructure/deployment layer (reverse proxy, cloud provider), not
   application code, and is out of scope for a Sprint 1 review.

## Explicitly out of scope for this review

Companion/Memory content itself carries no elevated security risk in Sprint 1
since it's rule-based templated copy (no prompt injection surface, no external AI
API calls, no embeddings/vector store) — see `docs/architecture/sprint-1-decisions.md`
for why. Re-review this section when real LLM integration is added.
