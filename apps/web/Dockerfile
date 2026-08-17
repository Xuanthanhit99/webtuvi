# Sprint 13 — companion to apps/api/Dockerfile; see docs/operations/production-deployment-runbook.md.
# Build from the repo root:
#
#   docker build -f apps/web/Dockerfile -t beaconvie-web .
#
# Relies on `output: 'standalone'` in next.config.mjs (Sprint 13) — Next.js traces the actual
# runtime dependency graph and copies only what's used into `.next/standalone`, which is what
# makes a slim final image possible without a second production-only pnpm install.
#
# NEXT_PUBLIC_* values are baked in at build time (Next.js inlines them into the client bundle) —
# they must be passed as build args, not just runtime env vars. See the runbook's "Frontend build
# args" section for the full list and why a wrong one here means a full rebuild, not a redeploy.
#
# Base image is `node:22-slim`, not `:20-slim` — see apps/api/Dockerfile's matching comment: Release
# Closure found pnpm@11.18.0 fails under corepack on Node 20.20.2 with ERR_UNKNOWN_BUILTIN_MODULE;
# 22 satisfies this repo's `engines.node: >=20` and is what this whole session actually verified.

FROM node:22-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
# tsconfig.base.json: apps/web/tsconfig.json `extends` this root file — see apps/api/Dockerfile's
# matching comment for why its absence here is a real, easy-to-miss defect (Release Closure).
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/types ./packages/types
# packages/eslint-config source (not just its package.json, already copied in `deps`): without it,
# `next build`'s own lint step fails to resolve `@beaconvie/eslint-config` from
# apps/web/eslint.config.mjs (`Cannot find package ... imported from eslint.config.mjs`) — found
# during Release Closure. Next.js treats a broken lint step as non-fatal (the build still
# completes), which is exactly why this is easy to miss: the image builds and runs fine, it just
# silently skips linting during the Docker build the whole time.
COPY packages/eslint-config ./packages/eslint-config
COPY apps/web ./apps/web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_ANALYTICS_ENABLED
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED

RUN pnpm --filter @beaconvie/web build

FROM node:22-slim AS runtime
RUN groupadd --system beaconvie && useradd --system --gid beaconvie beaconvie
WORKDIR /app

ENV NODE_ENV=production PORT=3000

COPY --from=build /repo/apps/web/public ./public
COPY --from=build --chown=beaconvie:beaconvie /repo/apps/web/.next/standalone ./
COPY --from=build --chown=beaconvie:beaconvie /repo/apps/web/.next/static ./apps/web/.next/static

USER beaconvie
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
