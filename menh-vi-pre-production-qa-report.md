# MENH VI PRE-PRODUCTION QA REPORT

Date: 2026-08-23
Scope: whole `D:\webtuvi` product surface before deploy
Branch/HEAD: `master` at `418b925`
Commit: none created
Reset/revert: none performed

## Conclusion

**READY_WITH_ENVIRONMENT_BLOCKERS**

No confirmed P0/P1 application regression was found in the Mệnh Vi/Tử Vi Tarot code paths covered here. The deploy gate is blocked by environment/deployment verification items, not by a confirmed product-code defect:

- `ENVIRONMENT_PACKAGING_BLOCKER`: Windows blocks Next standalone traced-file symlink creation after successful compile, type/lint build checks, page-data collection, and static generation `53/53`.
- `EXTERNAL_RUNTIME_BLOCKER`: live Nominatim geocoding returned `503 Service Unavailable` twice during Natal Chart e2e live-network verification.
- `PRODUCTION_ENV_OWNER_ACTION`: this workstation has local/dev env values and redacted local secrets; real production env, provider quotas, DNS/TLS, reverse proxy, and deployment host were not available in this QA pass.

## Recovery State

`git status` showed the existing uncommitted Tarot worktree from the locked Tarot artwork pass:

- Modified Tarot files: `apps/web/features/tarot/artwork.ts`, related Tarot component/tests.
- Canonical Tarot WebP assets present as untracked files.
- Many old raw PNG candidate assets marked deleted and multiple Tarot backup/report artifacts untracked.
- New report from this pass: `menh-vi-pre-production-qa-report.md`.

No Tarot artwork regeneration, broad refactor, commit, reset, or revert was performed.

## Architecture And Environment

- Monorepo: `apps/web` Next.js 15 App Router, `apps/api` NestJS 10, Prisma/PostgreSQL, Redis, Mailpit, shared packages under `packages/`.
- Runtime infra: Docker Compose provides Postgres `5433`, Redis `6380`, Mailpit `1025/8025`.
- API modules loaded at startup: Auth, Users, Memory, Companion, Journal, Reflection, Insight, Review, Goal, Payment, Tarot, Numerology, Geocoding, Natal Chart, Notifications, Analytics, Reports, Eastern Horoscope, Tử Vi, Admin.
- Web routes include public marketing/legal/auth pages plus authenticated app surfaces under `/discover/*`, `/premium`, `/settings`, `/journal`, etc.
- `/menh-vi/*` is archived: known legacy redirects exist for canonical routes; remaining prototype routes are rewritten to not-found.

## Environment And Secret Safety

Checked env files by key names/classification only; no secret values printed.

- API production validation exists for required URL/DB/Redis/JWT/CSRF/cookie/email/AI/PayOS fields.
- Production boot rejects insecure cookie config, placeholder JWT/CSRF secrets, Mailpit email provider, mock AI provider, mock PayOS checkout, missing production email provider key, missing `APP_PUBLIC_URL`, and missing PayOS credentials.
- Local `.env` is development/local oriented: localhost URLs, local DB/Redis, local cookie domain, configured AI/payment credentials redacted.
- Web `.env` points to localhost app/API for this workstation.

Owner action: provision and verify real production env without placeholder/local values; do not deploy with localhost URLs, Mailpit, mock providers, or non-secure cookies.

## Database, Redis, Startup

- Docker services were initially stopped; started successfully.
- Postgres/Redis/Mailpit health: healthy.
- `prisma migrate status`: PASS, 26 migrations, database schema up to date.
- `prisma validate`: PASS.
- `prisma migrate deploy`: PASS, no pending migrations.
- `prisma db seed`: PASS, Tarot deck seeded/confirmed `78 cards`, demo user already exists.
- Compiled API runtime startup: PASS; `/health/live` 200, `/health/ready` 200.

## Module Matrix

| Module | Status | Evidence |
| --- | --- | --- |
| Auth/session/cookies/CSRF/rate limit | PASS | Unit/e2e auth PASS; CSRF tests reject missing token; production env validation enforces secure cookie. |
| Database migrations/schema | PASS | Prisma status/validate/deploy PASS. |
| Redis/cache/throttling | PASS | Redis healthy; throttler isolation tests PASS; app startup with Redis PASS. |
| Tarot | PASS | Locked report remains `READY_FOR_PRODUCTION`; targeted API/web PASS; e2e rerun PASS 10/10; no artwork changes. |
| Tử Vi | PASS | Targeted unit PASS; API e2e PASS in grouped run; web targeted PASS. |
| Numerology | PASS | Targeted unit/web PASS; API e2e PASS. |
| Natal Chart | PARTIAL | Core API e2e 18/19 PASS; only live Nominatim verification 503 external blocker. |
| Eastern Horoscope | PASS | Targeted unit PASS; API e2e PASS. |
| Reports | PASS | Targeted unit PASS; API e2e PASS. |
| Premium/Payment | PASS with provider caveat | Unit/e2e payment PASS using configured test/mock checkout path; live PayOS sandbox/production checkout not verified here. |
| Community | NOT_IMPLEMENTED/PUBLIC_ONLY | Public `/community` route returns 200; no backend community product found. |
| Profile/Settings | PASS | Unit tests PASS; protected route redirects when logged out. |
| Admin | PARTIAL | Unit coverage PASS and routes guarded; live admin operator account not available for runtime UI verification. |
| Archived `/menh-vi/*` prototype | PASS | Route guard and smoke confirm canonical protected routes redirect to login; direct prototype is intentionally archived. |

## Bugs Fixed

None in this pass. No high-confidence P0/P1 application-code bug was found that justified touching production code.

## Remaining Issues

### P0

None confirmed.

### P1

None confirmed.

### P2

- Windows standalone packaging: `next build` fails during traced-file symlink copy with `EPERM` after compile/static generation. This blocks packaging on this workstation, not application compile.
- Live Nominatim dependency returned 503 in Natal Chart e2e. Core geocoding failure state behaved correctly; live external availability remains unverified.
- Full Jest parallel runs can timeout/EPERM under Windows load. Rerunning the same failing files/full suites with `--runInBand` passed, so this is test-environment reliability risk.

### P3

- Frontend tests print React outdated JSX transform warnings.
- Some jsdom tests log expected navigation/query warnings while still passing.
- Logged-out route smoke records expected 401 console entries from authenticated API probes and aborted analytics posts during navigation.

## Responsive And Runtime Smoke

Local runtime used:

- API: compiled `node dist/src/main.js`
- Web: `next start` served `http://localhost:3000`; Next warned that `output: standalone` expects `node .next/standalone/server.js`, but standalone packaging is blocked by Windows EPERM.

Viewport smoke widths: `375`, `390`, `430`, `768`, `1024`, `1280`, `1440`.

Results:

- Public pages `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`, `/community`: HTTP 200 at all tested widths.
- Authenticated routes `/discover`, `/discover/tarot`, `/discover/numerology`, `/discover/natal-chart`, `/discover/tu-vi`, `/premium`, `/settings`, `/journal`: redirected to `/login` when logged out.
- UI horizontal overflow: none on the tested HTML routes.
- `/robots.txt`: 200.
- `/sitemap.xml`: 200; XML document showed horizontal overflow at 375/390 in browser measurement, not treated as UI layout defect.
- Runtime API checks: `/health/live` 200, `/health/ready` 200, protected `/tarot/deck` 401 when unauthenticated.

No authenticated browser smoke was claimed beyond e2e/API/web test evidence because local `.env` uses real provider configuration and I avoided triggering live AI generation unnecessarily.

## Accessibility

- Component-level accessibility coverage passed in web unit tests, including route guard/nav/form/dialog/button-oriented tests.
- Tử Vi e2e suite includes axe checks in source; API-level e2e for Tử Vi passed in this run.
- Full live browser axe pass across authenticated product pages was not claimed in this pass because authenticated runtime smoke was intentionally limited.

## SEO

- `robots.ts` and `sitemap.ts` unit tests PASS.
- Runtime `/robots.txt` and `/sitemap.xml` return 200.
- Sitemap includes only public/indexable routes; authenticated app/discovery routes are excluded by design.
- Canonical/OpenGraph helpers covered by `lib/seo.test.ts` PASS.

## Security Sanity

- Global CSRF guard protects mutating routes unless explicitly skipped for appropriate unauthenticated/webhook/analytics cases.
- JWT guard reads active user status/role live from DB; deleted/suspended users are rejected on subsequent requests.
- Admin routes use JWT + AdminGuard + admin throttler; UI hiding is not the security boundary.
- Discovery/payment generation endpoints use named throttlers and cost-control patterns.
- IDOR/cross-user isolation: Tarot e2e PASS; Natal Chart e2e core IDOR tests PASS; Payment e2e PASS; Tử Vi e2e PASS in grouped run.
- Sensitive logging: boot logs provider names only, not keys; env inspection in this QA redacted values.

## Test And Build Evidence

- Targeted API unit: PASS, 63 suites / 864 tests for auth/payment/discovery/reports.
- Targeted web unit: PASS, 26 suites / 168 tests for Tarot/Numerology/Natal Chart/Tử Vi/Premium/SEO/route guard.
- Typecheck: PASS.
- Lint: PASS with 24 existing unrelated `insight` warnings, 0 errors.
- Full API unit parallel: initially failed 4 timeout tests under load; rerun targeted PASS.
- Full API unit `--runInBand`: PASS, 151 suites / 1629 tests.
- Full web unit parallel: initially failed 6 timeout/text assertions under load; rerun failed files PASS.
- Full web unit `--runInBand`: PASS, 103 suites / 543 tests.
- API e2e grouped: PASS for auth/payment/numerology/Tử Vi/eastern-horoscope/reports; Tarot initial cache EPERM, rerun PASS; Natal Chart 18/19 PASS with live Nominatim 503.
- Production build: API build PASS; Next compile PASS; build-time type/lint PASS; static generation `53/53` PASS; standalone trace-copy FAIL with Windows symlink `EPERM`.

## Owner Actions Before Deploy

1. Run the production build/package step in the real deploy environment, Linux container, or Windows environment with symlink permission/developer mode; confirm standalone artifact copies successfully.
2. Provision production env values and verify with `NODE_ENV=production`: secure cookies, real domain URLs, real DB/Redis, email provider, AI provider, PayOS credentials, PayOS mock disabled.
3. Decide geocoding production strategy: verify Nominatim availability/quota/User-Agent from deployment network or move to a hosted/self-hosted geocoder.
4. Run live PayOS sandbox/production checkout and webhook verification with real provider credentials.
5. Run authenticated browser smoke on deployed domain: register/login/onboarding/discover/Tarot/Numerology/Natal Chart/Tử Vi/Premium/settings at the required viewports, plus console/network/hydration checks.

