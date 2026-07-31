# BeaconVie — Sprint 1 Final Report

Release closure verification completed 2026-07-31. This is the authoritative
Sprint 1 record; `docs/progress/sprint-1-progress.md` holds the running build
log that led here, and `docs/architecture/sprint-1-decisions.md` /
`docs/security/sprint-1-security.md` hold the detailed decision/security records
referenced throughout.

## 1. Sprint 1 scope

Landing, Authentication (register/login/forgot-reset password), a conversational
Onboarding, and a Dashboard — on a real NestJS + PostgreSQL + Redis backend and a
Next.js App Router frontend. No Sprint 2 features (full LLM Companion, Memory
embeddings, Journal, Discovery systems, Reports, Community) were built; where
those surfaces are referenced in nav/landing copy, they route to real, structured
"Coming soon" pages, never a dead link or a faked feature.

## 2. Architecture

pnpm monorepo: `apps/web` (Next.js 15 App Router, TS strict, Tailwind, React Hook
Form + Zod, TanStack Query) + `apps/api` (NestJS 10, TS strict, Prisma,
PostgreSQL, Redis, Argon2, class-validator, Swagger) + `packages/{types,config,
eslint-config}`. Docker Compose runs Postgres (host `:5433`), Redis (`:6380`),
Mailpit (`:8025`) — non-default host ports chosen to avoid colliding with other
local services. Full rationale for every deliberate deviation from
`docs/reference` is in `docs/architecture/sprint-1-decisions.md`.

## 3. Routes (apps/web)

`/`, `/login`, `/register`, `/forgot-password`, `/reset-password`,
`/onboarding`, `/dashboard`, `/companion`, `/journal`, `/discover`, `/settings`,
`/about`, `/privacy`, `/terms`, `/contact`.

## 4. API endpoints (apps/api)

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
GET  /users/me/preferences
PATCH /users/me/preferences
GET  /onboarding
POST /onboarding/message
POST /onboarding/memory/consent
POST /onboarding/discovery/select
POST /onboarding/complete
POST /onboarding/skip
GET  /companion/messages
POST /companion/messages
GET  /dashboard
GET  /health/live
GET  /health/ready
```
Swagger UI at `/docs` (non-production only).

## 5. Database models

`User`, `UserSession` (refresh-token hash + family, for rotation/reuse
detection), `PasswordResetToken` (hash-only, single-use, expiring),
`UserProfile`, `UserPreference` (memory + reflection preferences),
`OnboardingProgress`, `CompanionMessage` (shared onboarding + companion
transcript, tagged by context), `MemoryNote`, `ActivityEvent`. One migration
(`20260731041947_init`), schema valid, migrations in sync with the dev database.

## 6. Authentication behavior

Argon2 password hashing. Both access (15m) and refresh (30d) JWTs are stored in
httpOnly, `Secure`-flagged-in-production, `SameSite=Lax` cookies (never
localStorage) — cookie flags are centralized in one `CookieService`, driven
entirely by env vars (`AUTH_COOKIE_DOMAIN/SECURE/SAME_SITE`), never hard-coded.
Refresh tokens rotate on every use; reuse of an already-rotated token revokes
the entire session family. Logout revokes exactly the calling session.
Forgot-password never reveals whether an email exists (verified: identical
response body for existing vs. non-existent email). Reset tokens are hashed
(SHA-256) before storage, single-use, and expire (`PASSWORD_RESET_EXPIRES_IN`,
default 1h). `register`, `login`, `forgot-password`, `reset-password` are rate
limited (default 5 requests/15min/IP) via a custom `AuthThrottlerGuard` that
returns a plain-language message instead of leaking the underlying exception
name. CORS is an explicit allowlist from `CORS_ORIGINS`, `credentials: true`,
never a wildcard.

## 7. Onboarding behavior

Continuous Companion-chat UI (no step-wizard, no progress bar). Companion
replies are deterministic/templated (no LLM — see decisions doc for why),
modeled on `docs/reference` Module 7 §6's example script. **Explicit memory
consent**: the Companion asks before saving anything; declining still lets
onboarding complete, and no `MemoryNote` is written. Discovery offer
(accept/decline) is optional and non-blocking. Skip is always available from
any stage and finalizes onboarding immediately (chosen specifically so a
skipped user is never redirect-looped back to `/onboarding`). All state persists
after every turn — refreshing mid-conversation resumes exactly where it left
off (verified by e2e test).

## 8. Dashboard behavior

`GET /dashboard` server-resolves one Hero greeting (time-of-day + most recent
memory, or an honest "just getting to know each other" state for a new user) +
Companion panel preview + Memory highlight (or absent, never a fake
placeholder) + a static Discovery "coming soon" card + real `ActivityEvent`-backed
Recent Activity. Verified via e2e test for both a brand-new user and a
completed-onboarding user with a real memory note.

## 9. Security controls

Full audit table in `docs/security/sprint-1-security.md`. This pass additionally
re-verified, directly against source:
- `CookieService` (`apps/api/src/auth/cookie.service.ts`): `httpOnly` always
  `true`; `secure`/`sameSite`/`domain` all read from env, zero hard-coded
  values; refresh cookie scoped to `path: /auth`.
- `env.validation.ts`: fails fast in `NODE_ENV=production` if
  `AUTH_COOKIE_SECURE` is not `true`, or if either JWT secret is still the
  placeholder value.
- No response anywhere returns a raw Prisma entity — grepped
  `apps/api/src` for `passwordHash`/`refreshTokenHash`/`tokenHash` and for
  `...user`/`return user;` entity-spread patterns; the only hits are inside
  `auth.service.ts` where they're created/queried, never serialized to a
  response DTO, and zero hits in `apps/web`.
- Secret scan (this session): searched the full working tree (excluding
  `node_modules`) for private-key headers, AWS/Slack/OpenAI-style key
  patterns, and the two actual generated JWT secret values used in this local
  `.env` — no matches outside the gitignored `.env`/`.env.test` files. The
  only password/secret-shaped literals in tracked source are disclosed test
  fixtures (`Sup3r$ecretPass` in e2e specs, `Demo1234!` in `prisma/seed.ts` —
  the documented seeded demo account) and `.env.example`/`.env.test.example`
  placeholders.

**Not claimed**: this is not an exhaustive security audit. It confirms what
was specifically checked; residual risks (no dedicated CSRF token, no email
verification, per-IP-only rate limiting) are listed in
`docs/security/sprint-1-security.md` and repeated below.

## 10. Accessibility

Semantic HTML, skip-to-content link, visible labels (never placeholder-only),
`aria-describedby` on field errors, visible focus rings, native `<dialog>` for
real focus-trapping, 44px touch targets, `prefers-reduced-motion` respected,
conditional dashboard panels absent from the DOM (not empty placeholders).

## 11. Responsive behavior

Verified via Playwright screenshots at 390/768/1280px for landing, login, and
register — single-column mobile, 2-column auth layout on desktop, no overflow.

## 12. Tests

- Backend: 16 unit tests (pure functions, DTO validation) + 17 e2e tests
  (supertest against a real Postgres/Redis test instance) — auth, onboarding,
  dashboard.
- Frontend: 19 component tests (form validation, error rendering, loading
  states, empty states) + route-guard unit tests, across 5 suites.
- Playwright: all 3 required flows, run against a from-scratch production
  build in this closure session.

## 13. Commands executed (this closure session, in order)

```
git status --short / diff --check / ls-files / check-ignore (multiple paths)
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm --filter @beaconvie/api test
pnpm --filter @beaconvie/api test:e2e
pnpm --filter @beaconvie/web test
prisma validate
prisma migrate status
rm -rf apps/api/dist apps/web/.next && pnpm build   (full clean rebuild)
node dist/src/main.js & pnpm start &                (API :4000, web :3000)
pnpm exec playwright test                           (3 required flows)
git add -A / diff --cached --stat / diff --cached --check
```

## 14. Exact PASS/FAIL results

| Command | Result | Notes |
|---|---|---|
| `pnpm install --frozen-lockfile` | **PASS** | lockfile consistent, no changes needed |
| `pnpm lint` (root, both packages) | **PASS** | 0 errors, 0 warnings |
| `pnpm typecheck` (root, both packages) | **PASS** | 0 errors |
| `pnpm --filter api test` | **PASS** | 16/16, 3 suites |
| `pnpm --filter api test:e2e` | **PASS** | 17/17, 3 suites, real Postgres/Redis |
| `pnpm --filter web test` | **PASS** | 19/19, 5 suites |
| `pnpm build` (clean, both apps) | **PASS** | API + Next.js, 18 static routes generated |
| `prisma validate` | **PASS** | schema valid |
| `prisma migrate status` | **PASS** | database schema up to date |
| Playwright — Flow 1 (Landing→Register→Onboarding→Dashboard→Logout) | **PASS** | 7.4s |
| Playwright — Flow 2 (Login existing user→Dashboard) | **PASS** | 2.3s |
| Playwright — Flow 3 (Forgot→Reset→Login) | **PASS** | 7.1s |

All commands passed on this run with no config changes made to hide a failure.
Earlier in the build session (not this closure pass) several real bugs were
found and fixed through normal iteration (documented in full conversation
history) — e.g. a Jest hook timeout too low for cold NestJS boot, a duplicate
role decorator misuse, an ESLint plugin-scoping error, and a couple of
ambiguous test locator/regex collisions against permanent UI hint text. None
were papered over; each was root-caused and fixed in source.

## 15. Known limitations

No email verification flow (schema-ready via `User.emailVerifiedAt`, not
wired up). No dedicated CSRF token beyond SameSite+CORS. Companion/Memory are
rule-based templated copy, not a real LLM. OAuth buttons are visibly present
but disabled (no provider credentials configured). Rate limiting is per-IP
only, in-memory (not Redis-backed), so it resets on API process restart and
doesn't survive horizontal scaling as-is.

## 16. Deferred to Sprint 2

Real LLM-backed Companion and Memory/embedding pipeline, Journal, Discovery
systems (Tarot/Natal Chart/Eastern Horoscope/Numerology), Reports, Community,
email verification, real OAuth wiring, a dedicated CSRF token, light theme,
Redis-backed distributed rate limiting.

## 17. Local run instructions

See `README.md` for the full walkthrough. Summary:
```
pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env   # then fill in generated JWT secrets
cp apps/web/.env.example apps/web/.env
pnpm --filter @beaconvie/api prisma:generate
pnpm --filter @beaconvie/api prisma:migrate
pnpm --filter @beaconvie/api prisma:seed   # optional demo account
pnpm dev:api
pnpm dev:web
```
README verified against actual `package.json` scripts, Docker service names,
port numbers, env file names, and test commands during this closure pass — no
discrepancies found.

## 18. Production-readiness gaps

Before any production deployment: implement the CSRF token noted above, add
email verification, move rate-limit storage to Redis (multi-instance
correctness), rotate/generate real production JWT secrets and set
`AUTH_COOKIE_SECURE=true` (already enforced fail-fast by `env.validation.ts`),
configure a real mail provider (Mailpit is dev-only), review and likely
tighten the login endpoint's account-existence-revealing error messages
(currently intentional per docs/reference's UX requirement — revisit if abuse
is observed), and replace the rule-based Companion with real Sprint 2 AI work
before making any "the Companion remembers you" claim to real users.
