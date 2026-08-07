# BeaconVie — Sprint 1

An AI Companion that remembers you. This repository contains Sprint 1 of BeaconVie:
Landing, Authentication, a conversational Onboarding, and a Dashboard, built on a
real NestJS + PostgreSQL + Redis backend and a Next.js App Router frontend.

See `docs/architecture/sprint-1-decisions.md` for the product/architecture
decisions behind this build (where it follows `docs/reference` vs. the Sprint 1
brief, and why), and `docs/security/sprint-1-security.md` for the security audit.

## Stack

- **apps/web** — Next.js 15 (App Router), TypeScript strict, Tailwind CSS, React
  Hook Form + Zod, TanStack Query, Zustand.
- **apps/api** — NestJS 10, TypeScript strict, Prisma + PostgreSQL, Redis,
  Argon2, class-validator, Swagger.
- **packages/** — shared `types` (DTOs shared between web/api), `config` (design
  tokens), `eslint-config`.
- PostgreSQL, Redis, and Mailpit (dev email capture) run via Docker Compose.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate` if you don't
  have it)
- Docker (for Postgres/Redis/Mailpit)

## Getting started (local dev, ~10–15 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (Postgres, Redis, Mailpit)
docker compose up -d

# 3. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Generate real JWT secrets (32+ chars each) and paste into apps/api/.env:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# (repeat for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET — use two different values)

# 4. Run database migrations
pnpm --filter @beaconvie/api prisma:generate
pnpm --filter @beaconvie/api prisma:migrate

# 5. (Optional) seed a demo account — demo@beaconvie.local / Demo1234!
pnpm --filter @beaconvie/api prisma:seed

# 6. Run the apps (in two terminals)
pnpm dev:api    # http://localhost:4000  (Swagger docs at /docs)
pnpm dev:web    # http://localhost:3000
```

Mailpit's web UI (to read password-reset emails in dev) is at
http://localhost:8025.

> **Note on ports**: Postgres and Redis are mapped to host ports **5433** and
> **6380** (not the defaults 5432/6379) so they don't collide with any other
> Postgres/Redis you may already have running locally. See `docker-compose.yml`.

## Running tests

```bash
# Backend unit tests (pure functions, DTO validation — no DB required)
pnpm --filter @beaconvie/api test

# Backend integration/e2e tests (hits a real Postgres + Redis)
cp apps/api/.env.test.example apps/api/.env.test
docker exec beaconvie-postgres psql -U beaconvie -d beaconvie -c "CREATE DATABASE beaconvie_test;"
DATABASE_URL=postgresql://beaconvie:beaconvie_dev_password@localhost:5433/beaconvie_test?schema=public \
  pnpm --filter @beaconvie/api exec prisma migrate deploy
pnpm --filter @beaconvie/api test:e2e

# Frontend component tests
pnpm --filter @beaconvie/web test

# Playwright end-to-end (needs both apps running — see below)
pnpm --filter @beaconvie/web exec playwright install chromium
pnpm --filter @beaconvie/web build && pnpm --filter @beaconvie/web start &
pnpm --filter @beaconvie/api build && node apps/api/dist/src/main.js &
pnpm --filter @beaconvie/web test:e2e
```

Playwright runs against a **production build** (`next build && next start`), not
`next dev` — Next's dev-mode lazy per-route compilation is slow enough on first
visit to make dev-mode e2e runs flaky.

The auth rate limiter (5 requests/15 min per IP by default) applies to Playwright
runs too. If you re-run the e2e suite repeatedly within the same 15-minute window
and see failures on the forgot-password flow, that's the rate limiter working as
intended — wait a few minutes, or raise `AUTH_RATE_LIMIT_MAX` in `apps/api/.env`
for local iteration.

## Building for production

```bash
pnpm build          # builds both apps
pnpm build:api
pnpm build:web
```

## Project structure

```
apps/
  web/            Next.js frontend
    app/          App Router routes, grouped by (marketing)/(auth)/(onboarding)/(app)
    components/   Shared UI (components/ui) and layout (components/layout)
    features/     Feature-scoped API clients, hooks, components, schemas
    lib/          API client, route-guard logic, utilities
    providers/    React Query + Auth context providers
    e2e/          Playwright specs
  api/            NestJS backend
    src/
      auth/       Register/login/refresh/logout/forgot-reset password
      onboarding/ Conversational onboarding state machine
      companion/  Minimal rule-based post-onboarding chat
      dashboard/  Aggregation endpoint + decision engine
      memory/     Memory Foundation (Sprint 3A) — consent, candidates, CRUD,
                  versioning, audit, timeline, export; see
                  docs/architecture/memory-engine.md. MemoryNote (Sprint 1) is
                  kept read-only for the Dashboard's legacy fallback only.
      journal/    Journal Foundation (Sprint 4A) — a first-class, user-authored
                  writing space: CRUD, lifecycle (draft/published/archived/
                  soft-deleted), draft autosave, revisions, timeline, search,
                  export; see docs/architecture/journal-foundation.md. No
                  AI-generated content, no embeddings/semantic search.
      reflection/ Reflection Foundation (Sprint 4B) — a deterministic rule
                  engine that turns Journal/Memory/Activity/Companion data
                  into Reflection Candidates: grouping, scoring, timeline,
                  feed; see docs/architecture/reflection-foundation.md. No
                  AI-generated reflections, no reports, no embeddings.
      insight/    Insight Preparation (Sprint 4C) turns Reflection Candidates
                  into deterministic Insight Candidates (relationships,
                  clustering, priority, evidence) — see
                  docs/architecture/insight-preparation.md. Insight Experience
                  (Sprint 5A, presentation/) renders those candidates into the
                  user-facing /insights dashboard (cards, timeline, evidence
                  view, filters, pin/archive) — no new insight generation, no
                  AI; see docs/architecture/insight-experience.md.
      review/     Weekly & Monthly Reviews (Sprint 5B) deterministically
                  aggregate existing Insight/Reflection Candidates (plus real
                  Journal/Memory/Activity/Companion counts for statistics)
                  over a WEEK/MONTH/CUSTOM window into a persisted Review
                  document (overview, sections, evidence, statistics, export)
                  — generates no new Insight/Reflection Candidates, no AI; see
                  docs/architecture/review-engine.md.
      goal/       Goal System & Progress Engine (Sprint 5C) — first-class,
                  deterministic learning/life goals: CRUD, milestones, and a
                  progress engine that computes completion from real
                  Journal/Memory/Reflection/Insight/Review evidence matched by
                  tag/category equality — no AI, no coaching, no
                  recommendations, no semantic search; see
                  docs/architecture/goal-system.md.
      tarot/      Tarot Discovery Foundation (Sprint 6) — the first real Discovery
                  feature: a real, curated 78-card deck, a deterministic seeded
                  draw engine (Daily Draw/Single Card/Three Card Spread), a
                  persisted TarotReading (never recomputed), and AI
                  interpretation that only ever narrates an already-drawn
                  result — never chooses or changes cards; see
                  docs/architecture/tarot-discovery.md.
      users/      Profile + preferences
      common/     Guards, filters, interceptors, shared utils
    prisma/       Schema, migrations, dev seed
    test/         e2e/integration tests (supertest against a real test DB)
packages/
  types/          Shared DTOs between web and api
  config/         Design tokens (source of truth: docs/reference Module 4 §16)
  eslint-config/  Shared flat ESLint config
docs/
  architecture/   Sprint 1 decisions & deviations from docs/reference
  security/       Security audit
  reference/      Product Bible, Design Guide, Figma spec (source documents)
```

## What's real vs. simplified

Authentication, onboarding persistence, and the dashboard all run against a real
database — nothing here is mocked. As of Sprint 2B (Companion Core), the
Companion is backed by a real, configurable AI provider (OpenAI/Anthropic/
Gemini, selected via `DEFAULT_AI_PROVIDER`) with rate limiting, per-user
concurrency limits, and budget controls — see
`docs/architecture/companion-core.md`. A Mock provider exists for local
development only and is structurally blocked from running in production
(`NODE_ENV=production`) by `env.validation.ts`. As of Sprint 3A (Memory
Foundation), Memory has its own consent engine, candidate lifecycle, CRUD,
versioning, audit trail, timeline, and export — deliberately **not** yet Memory
*intelligence* (no embeddings, vector search, RAG, or automatic extraction); see
`docs/architecture/memory-engine.md`. As of Sprint 4B (Reflection Foundation),
`/reflections` shows deterministic Reflection Candidates — patterns a fixed
rule engine finds across Journal, Memory, Activity, and Companion data, each
citing its real sources and a documented, weighted score — deliberately
**not** AI-generated reflections, summaries, coaching, or reports; see
`docs/architecture/reflection-foundation.md`. As of Sprint 4C (Insight
Preparation), deterministic relationships/clustering/priority are computed
over Reflection Candidates into Insight Candidates — see
`docs/architecture/insight-preparation.md`. As of Sprint 5A (Insight
Experience), `/insights` renders those Insight Candidates into a dashboard
(Top/Recent/Timeline/Pinned/Archived, an Evidence View that deep-links back to
the real Journal/Memory/Reflection records behind each insight, and priority/
category/date/status/source filters) — still no AI, no new insights generated,
every field traces back to structured data a prior sprint already produced;
see `docs/architecture/insight-experience.md`. As of Sprint 5B (Weekly &
Monthly Reviews), `/reviews` aggregates existing Insight/Reflection Candidates
into deterministic Weekly/Monthly/Custom review documents — see
`docs/architecture/review-engine.md`. As of Sprint 5C (Goal System & Progress
Engine), `/goals` introduces first-class, deterministic learning/life goals
whose progress is computed from real Journal/Memory/Reflection/Insight/Review
evidence matched by tag/category equality — still no AI, no coaching, no
recommendations, no semantic search; see
`docs/architecture/goal-system.md`. As of Sprint 6 (Tarot Discovery
Foundation), `/discover/tarot` is the product's first real Discovery feature:
a real, curated 78-card deck; a deterministic, seeded draw engine (Daily
Draw/Single Card/Three Card Spread, reproducible and duplicate-free); a
persisted `TarotReading` that's computed once and never recomputed; and AI
interpretation that only ever narrates an already-drawn, already-persisted
result — it never chooses, changes, or invents a card. A short, read-only
reference to the caller's latest reading is surfaced to the Companion; see
`docs/architecture/tarot-discovery.md`.

Two things remain deliberately simplified (and disclosed, not hidden):

- **Google/Apple login buttons are visible but disabled** ("Coming soon") — no
  OAuth credentials are configured for this environment, and requirements
  explicitly forbid faking a successful social login.
- Of Discovery's four systems, only **Tarot** is real. Natal Chart, Eastern
  Horoscope, and Numerology remain out of scope, as do Reports and Community.
  Their nav entries and/or landing mentions exist, but route to structured
  "Coming soon" pages — never a dead link or a page that pretends to be a
  working feature. Tarot cards have no illustrated artwork yet — a
  typographic/symbolic card face is used instead (see
  `docs/architecture/tarot-discovery.md` "No card artwork").
