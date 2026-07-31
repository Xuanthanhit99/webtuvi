# Sprint 1 Progress

Last updated: 2026-07-31 (same session, continuous build — not a resumed session
yet, but kept up to date per the user's request so a future resume can pick up
from here without re-deriving state).

## Current phase

Phase 10 (Verification) — core product complete and passing lint/typecheck/tests/
build; finishing frontend a11y/responsive pass and the final completion report.

## Completed

- **Phase 1 (Foundation)**: pnpm workspace (`apps/*`, `packages/*`), shared
  `tsconfig.base.json`, shared flat ESLint config (`packages/eslint-config`),
  Prettier, `docker-compose.yml` (Postgres on host 5433, Redis on 6380, Mailpit),
  `.env.example` for both apps, env validation with fail-fast + production checks
  (`apps/api/src/config/env.validation.ts`).
- **Phase 2 (Backend foundation)**: NestJS bootstrap (`main.ts`), Prisma schema +
  first migration (`20260731041947_init`), health/readiness endpoints
  (`/health/live`, `/health/ready` — checks Postgres + Redis), structured pino
  logging, request-ID middleware, global exception filter (consistent
  `{data,error,meta,requestId}` envelope), global `ValidationPipe`, Swagger at
  `/docs`, CORS allowlist from env, centralized cookie config (`CookieService`).
- **Phase 3 (Auth backend)**: register, login, refresh (rotation + reuse-family
  revocation), logout (session revoke), `/auth/me`, forgot-password
  (enumeration-safe), reset-password (hash-only, single-use, expiring), Argon2
  hashing, rate limiting on the 4 sensitive endpoints with a friendly error
  message. 17 e2e tests + 6 unit tests, all passing against a real test DB.
- **Phase 4 (Frontend foundation)**: Next.js 15 App Router, Product Bible design
  tokens in Tailwind, Playfair Display + Be Vietnam Pro + IBM Plex Mono (Vietnamese
  subset — Fraunces/Karla don't ship one, see `docs/architecture/sprint-1-decisions.md`),
  full `components/ui` set (Button, IconButton, Input, PasswordInput, Checkbox,
  Label, FormField, Card, Badge, Divider, Alert, Toast, Dialog, Dropdown, Avatar,
  Skeleton, Progress, EmptyState, ErrorState, Logo), `AppShell`/`Sidebar`/
  `MobileNavigation`, cookie-based API client with silent-refresh-on-401, Query
  provider, Auth provider, middleware-based route protection
  (`lib/route-guard.ts`, unit tested).
- **Phase 5 (Landing)**: full page, copy verbatim from `05-landing-experience.md`
  where the doc gives exact text (see `content/landing-copy.ts` header comment for
  what's verbatim vs. necessarily original), SEO metadata, constellation SVG
  motif respecting `prefers-reduced-motion`, responsive, `/about` `/privacy`
  `/terms` `/contact` stub pages so every footer link resolves.
- **Phase 6 (Auth UI)**: `/login /register /forgot-password /reset-password`,
  RHF+Zod validation mirroring backend rules exactly, real API integration
  (no mocks), OAuth buttons visibly present but disabled, loading/error states,
  component tests (19 passing).
- **Phase 7 (Onboarding)**: conversational chat UI, deterministic Companion
  copy, explicit memory-consent step (Yes/No before any MemoryNote is written),
  Discovery offer (accept routes to a "coming soon" acknowledgement, decline is
  equally valid), draft persistence via `OnboardingProgress` + `CompanionMessage`
  (refresh-safe — verified by e2e test), always-available Skip.
- **Phase 8 (Dashboard)**: `GET /dashboard` aggregation endpoint, greeting +
  Companion panel + Memory highlight + Discovery suggestion (static
  "coming soon") + real Recent Activity, loading/empty/error states, e2e-tested
  for both a brand-new user and a completed-onboarding user.
- **Phase 9 (Settings minimum)**: account info (read-only), memory-preference
  control (functional, backed by `UserPreference` — the one privacy-critical
  control worth shipping now), placeholder note for the rest.
- Companion (`/companion`): minimal rule-based chat, reachable from Dashboard's
  "Continue the conversation" CTA and the nav.
- Journal / Discover: structured "Coming soon" pages (real routes, real CTAs
  back to Dashboard, never blank/dead).

## Verification run so far (see report for full command list)

- `pnpm typecheck` (root) — PASS
- `pnpm lint` (root) — PASS
- `pnpm --filter @beaconvie/api test` — PASS (6/6)
- `pnpm --filter @beaconvie/api test:e2e` — PASS (17/17, real Postgres/Redis)
- `pnpm --filter @beaconvie/web test` — PASS (19/19)
- `pnpm --filter @beaconvie/web exec playwright test` — PASS (3/3 flows)
- `pnpm build` (root) — in progress as of this note; see final report for result
- `prisma validate` / `prisma migrate status` — PASS, schema valid, DB in sync

## Known blockers

None currently blocking. Docker Desktop needed to be started manually at the
start of this session (daemon wasn't running) — already resolved.

## Pending / deferred (documented, not silently skipped)

- No email verification flow (schema-ready, not built — see
  `docs/architecture/sprint-1-decisions.md`).
- No dedicated CSRF token (SameSite+CORS only) — see
  `docs/security/sprint-1-security.md` residual risks.
- Frontend a11y pass (contrast, focus order, screen-reader spot-check) and
  explicit responsive verification at 390/768/1280/1440px — not yet
  systematically re-verified after the latest UI changes; last thing before the
  final report.

## Next exact action

Finish the accessibility/responsive verification pass, then write the final
completion report (structure specified in the Sprint 1 brief §24).
