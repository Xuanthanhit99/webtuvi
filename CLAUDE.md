# CLAUDE.md

## Project overview

BeaconVie is a monorepo for an AI companion product (currently in active sprint development, past
Sprint 1) with:

- Next.js 15 App Router frontend in apps/web
- NestJS backend in apps/api
- Shared packages in packages/*

The project is a real full-stack app with PostgreSQL, Redis, Prisma, and Docker-based local infrastructure.

Shipped Discovery systems: Tarot, Numerology, Natal Chart (displayed as "Bản Đồ Sao" in the
Discover hub). Eastern Horoscope (Ngũ Hành Phương Đông) is spec'd but not yet built. Vietnamese Tử
Vi Lá Số is a separate, founder-greenlit future module — see
`docs/product/vietnamese-tu-vi-product-definition.md` and
`docs/product/product-completion-roadmap-v2.md`; it has no code, route, or engine yet and must
never be confused with Eastern Horoscope or Natal Chart.

`/menh-vi/*` is an archived internal design prototype (returns 404 as of Sprint 14) — not a
product surface. Its components under `apps/web/features/menh-vi` are preserved for reuse but
unreachable publicly. Reflection, Insight, Review, and Goal are frozen modules: fully implemented,
code and data intact, but hidden from primary navigation/Settings since Sprint 14 (direct routes
remain reachable, unlisted).

## Key commands

- Install dependencies: pnpm install
- Start infrastructure: docker compose up -d
- Run API: pnpm dev:api
- Run web app: pnpm dev:web
- Build everything: pnpm build
- Run backend tests: pnpm test:api
- Run frontend tests: pnpm test:web
- Run lint: pnpm lint
- Run typecheck: pnpm typecheck

## Environment setup

Before running the app locally:

1. Copy env files:
   - apps/api/.env.example -> apps/api/.env
   - apps/web/.env.example -> apps/web/.env
2. Generate secure JWT secrets for the API env file.
3. Ensure Docker is running for Postgres, Redis, and Mailpit.
4. Run Prisma generation/migration as needed.

## Architecture notes

- Backend logic lives under apps/api/src with feature folders such as auth, onboarding, companion, dashboard, memory, users, and common.
- Frontend routes and page-level code live under apps/web/app, while reusable UI lives under apps/web/components and feature-specific modules under apps/web/features.
- Shared DTOs and types should be added or updated in packages/types when they are used across web and API.
- Prisma schema changes belong in apps/api/prisma/schema.prisma and should be followed by the appropriate migration.

## Coding conventions

- Prefer existing project patterns over introducing new abstractions.
- Keep feature code colocated with its related files where possible.
- Follow TypeScript strictness and existing NestJS/Next.js conventions.
- Avoid introducing mock behavior when a real implementation is available.
- Preserve existing product scope and constraints; don't build out-of-scope modules ahead of their scheduled sprint (see the roadmap docs above).

## Product constraints

- The Companion is LLM-based (OpenAI/Anthropic/Gemini, selected via `DEFAULT_AI_PROVIDER`), not rule-based — real since Sprint 2B. A Mock provider exists for local dev only and is blocked from running when `NODE_ENV=production`.
- Discovery systems (Tarot, Numerology, Natal Chart) are deterministic-first: the underlying calculation is fixed/curated code, never AI-generated; only the narrated interpretation on top is AI-generated. The same discipline applies to any future Discovery system (Eastern Horoscope, Tử Vi).
- Social login buttons may be present but should remain disabled unless the feature is actually implemented.
- Do not pretend features are complete when they are intentionally out of scope for the current sprint.

## Working expectations

- Make changes that are aligned with the existing architecture.
- Prefer small, targeted edits over broad rewrites.
- When changing behavior, update or add relevant tests where appropriate.
- Keep dependencies and generated artifacts consistent with the repo’s current setup.
