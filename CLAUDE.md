# CLAUDE.md

## Project overview

BeaconVie is a monorepo for a Sprint 1 AI companion product with:

- Next.js 15 App Router frontend in apps/web
- NestJS backend in apps/api
- Shared packages in packages/*

The project is a real full-stack app with PostgreSQL, Redis, Prisma, and Docker-based local infrastructure.

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
- Preserve the Sprint 1 scope and product constraints.

## Product constraints

- The companion is rule-based, not an LLM, for Sprint 1.
- Social login buttons may be present but should remain disabled unless the feature is actually implemented.
- Do not pretend features are complete when they are intentionally out of scope for Sprint 1.

## Working expectations

- Make changes that are aligned with the existing architecture.
- Prefer small, targeted edits over broad rewrites.
- When changing behavior, update or add relevant tests where appropriate.
- Keep dependencies and generated artifacts consistent with the repo’s current setup.
