# Sprint 13 — the first deployment manifest this repository has had (see
# docs/operations/production-deployment-runbook.md). Multi-stage pnpm-workspace build: install once
# with full workspace context (needed for the `@beaconvie/types` workspace dependency and pnpm's
# symlinked node_modules layout), build, then copy only the compiled output + a production-only
# node_modules into a slim runtime image. Build from the repo root:
#
#   docker build -f apps/api/Dockerfile -t beaconvie-api .
#
# Prisma migrations are NOT run by this image on boot — see the runbook's "Database migrations"
# section for why that's a deliberate, separate deployment step, not baked into the container
# entrypoint.
#
# Base image is `node:22-slim`, not `:20-slim` — Release Closure found `pnpm@11.18.0` (this repo's
# pinned packageManager) fails with `ERR_UNKNOWN_BUILTIN_MODULE` under corepack on Node 20.20.2
# (the `node:20-slim` tag at closure time). Root `package.json`'s `engines.node` only requires
# `>=20`, and this whole dev session (Node v22.17.0) already proves 22 works correctly with this
# exact pnpm version — 22 satisfies the engines constraint and is the version actually verified.

FROM node:22-slim AS base
# openssl: Prisma's query engine binary is a native addon linked against libssl, which
# `node:22-slim` doesn't ship by default — Release Closure found `prisma generate` silently
# *warns* and guesses a version without it ("Prisma failed to detect the libssl/openssl version...
# Defaulting to openssl-1.1.x"), then the wrong-guessed engine binary fails to `dlopen` at runtime
# with `libssl.so.1.1: cannot open shared object file` — a hard crash on container boot, not
# caught by `prisma generate` succeeding at build time. Installed here (in `base`) so both the
# `build` stage (accurate version detection) and any stage deriving from `base` have it; `runtime`
# is a separate `FROM node:22-slim` below and needs its own install for the same reason.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

# --- deps: install once with the full workspace manifest set, so pnpm can resolve
# `@beaconvie/types: workspace:*` correctly. Copying only package.json files first (not source)
# keeps this layer cacheable across source-only changes. ---
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
RUN pnpm install --frozen-lockfile

# --- build: compile the API and generate the Prisma client against the real schema. ---
FROM deps AS build
# tsconfig.base.json: apps/api/tsconfig.json `extends` this root file — Release Closure found its
# absence here doesn't fail loudly (tsc silently falls back to weaker default compiler options
# instead of erroring on the missing extends target) and surfaces as unrelated-looking type errors
# deep in application code instead, which is what made this easy to miss originally.
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/types ./packages/types
COPY apps/api ./apps/api
RUN pnpm --filter @beaconvie/api prisma:generate
RUN pnpm --filter @beaconvie/api build

# --- prod-deps: a second, production-only install (no devDependencies) for the runtime image,
# kept in its own stage so it never picks up anything from the `build` stage's dev tooling. ---
FROM base AS prod-deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/types/package.json ./packages/types/package.json
RUN pnpm install --frozen-lockfile --prod --filter @beaconvie/api...

# --- runtime: the actual production image. Non-root user, no build tooling, no source, no
# devDependencies. ---
FROM node:22-slim AS runtime
# See the matching comment on the `base` stage above — the actual query engine load happens here,
# at runtime, which is where this was originally caught (a container that builds successfully but
# crashes immediately on boot).
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/* \
  && corepack enable && groupadd --system beaconvie && useradd --system --gid beaconvie beaconvie
WORKDIR /repo

ENV NODE_ENV=production
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /repo/packages/types ./packages/types
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/node_modules/.pnpm ./node_modules/.pnpm

USER beaconvie
WORKDIR /repo/apps/api
EXPOSE 4000

# Liveness/readiness — see health.controller.ts (GET /health/live, /health/ready). The runbook's
# "Health checks" section documents which one a load balancer vs. an orchestrator's own restart
# policy should point at, and why they're intentionally different questions.
CMD ["node", "dist/src/main.js"]
