# Sprint 13 — Production Verification & Analytics Foundation — Progress Log

**Baseline:** HEAD = origin/master = `eb0c313`, clean except two prior-task documentation files already sitting uncommitted (`docs/audit/full-product-completion-roadmap-rebase.md`, `docs/product/vietnamese-tu-vi-product-definition.md`, `docs/product/product-completion-roadmap-v2.md`) — confirmed present, not re-created, not modified by this sprint.

## What this sprint delivered

1. **Product analytics foundation** — a full first-party ingestion pipeline (`apps/api/src/analytics/*`), a typed 24-event contract shared between frontend and backend (`packages/types/index.ts`), a PostHog HTTP sink (no SDK dependency, by design — see `docs/architecture/product-analytics.md`), and client-side instrumentation across the full funnel (landing → signup → onboarding → dashboard → discover → each Discovery system → notifications → premium → checkout).
2. **Auth/payment/companion/export throttler bleed-through** — reproduced and fixed the known Sprint 12 backlog Low item (`auth.controller.ts` missing `payment` in its skip list), **plus discovered and fixed three previously-unknown instances of the identical bug class** (`companion/conversation.controller.ts`, `journal-export.controller.ts`, `memory-export.controller.ts`, `account-export.controller.ts` — all missing `payment`). Added a permanent regression suite (`throttler-isolation.spec.ts`, 17 tests) covering every named-throttler route in the codebase.
3. **Deployment manifest** — `apps/api/Dockerfile`, `apps/web/Dockerfile` (using Next.js `output: 'standalone'`, added this sprint), `.dockerignore`, and `docs/operations/production-deployment-runbook.md` (architecture, migrations, health-check semantics, env matrix, rollback, honest runtime-verification status).
4. **Documentation** — `docs/architecture/product-analytics.md`, `docs/product/product-metrics.md`.

## What this sprint did NOT do (explicitly out of scope, per the brief)

- No Vietnamese Tử Vi work.
- No Eastern Horoscope work.
- No Reports work.
- No Community work.
- No `/menh-vi` changes.
- No Sprint 14 work (frozen-module/`/menh-vi` disposition, CLAUDE.md correction).

## Environment constraints encountered (see final report §32–36 for full detail)

- No production credentials exist for Sentry, a real email provider, PostHog, or a confirmed-real PayOS merchant account in this environment — none of these could be runtime-verified, consistent with every prior audit's findings.
- Docker Desktop could not be started in this sandboxed session (`docker info` → `"Docker Desktop is unable to start"`) — neither new Dockerfile was build-tested, and the real-Postgres/Redis e2e suite (including the new `analytics.e2e-spec.ts`) could not be executed live this session.
- `pnpm install` and `prisma generate` were run fresh this session (neither had been run in this checkout before) — this resolved a set of pre-existing, unrelated TypeScript errors (missing `@nestjs/schedule`/`@sentry/nestjs` type declarations, a stale Prisma client missing the `Notification` models) that were not caused by this sprint's changes.

See `docs/progress/sprint-13-final-report.md` for the complete, itemized final report.
