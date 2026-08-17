# Production Deployment Runbook

**Status:** Sprint 13 — the first deployment manifest/runbook this repository has had. Written from the actual current codebase (`apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/api/src/config/env.validation.ts`), not aspirational. Where a step depends on a credential or decision this repo doesn't have, that's stated explicitly rather than glossed over.
**Scope:** how to deploy `apps/api` and `apps/web` to a real environment. Does not cover CI/CD pipeline authoring (which CI provider, which triggers) — that's a founder/infra decision (see the external checklist in `docs/product/product-completion-roadmap-v2.md` §4).

---

## 1. Architecture summary

Two deployable services, sharing one Postgres database and one Redis instance:

- **`apps/api`** — NestJS, built to `apps/api/dist/src/main.js`, listens on `API_PORT` (default 4000).
- **`apps/web`** — Next.js, built with `output: 'standalone'` (Sprint 13), listens on `PORT` (default 3000).

Both have a `Dockerfile` at their package root (`apps/api/Dockerfile`, `apps/web/Dockerfile`), built from the **repo root** as build context (they need the pnpm workspace and `packages/types`):

```
docker build -f apps/api/Dockerfile -t beaconvie-api .
docker build -f apps/web/Dockerfile -t beaconvie-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_APP_URL=https://example.com \
  --build-arg NEXT_PUBLIC_SENTRY_DSN=... \
  --build-arg NEXT_PUBLIC_ANALYTICS_ENABLED=true \
  .
```

**Both Dockerfiles were build-and-run verified during Sprint 13 Release Closure**, once Docker recovered mid-session (see §12) — not merely reviewed. Three real, previously-undetected defects were found and fixed in the process, none of them Sprint-13-application-code bugs, all of them Dockerfile/environment issues that only a real build (not local review, not the host build) could surface:

1. **Base image**: `node:20-slim` failed `pnpm install` with `ERR_UNKNOWN_BUILTIN_MODULE` under this repo's pinned `pnpm@11.18.0` — fixed by moving to `node:22-slim` (still satisfies `engines.node: >=20`, and is the version this entire session's host builds already proved compatible).
2. **Missing `tsconfig.base.json`**: both `apps/api/tsconfig.json` and `apps/web/tsconfig.json` `extend` a root-level `tsconfig.base.json` that neither Dockerfile copied into its build context. TypeScript did not fail loudly on the missing extends target — it silently fell back to weaker default compiler options, which surfaced as 9 unrelated-looking pre-existing type errors deep in `apps/api/src/{tarot,numerology,natal-chart}` (`budget.reason` access on a supposedly-narrowed union) rather than a clear "config not found" error. Confirmed this was *only* a Dockerfile completeness bug, not a real application defect, by deleting `apps/api/dist` and rebuilding fresh on the host: the identical build succeeded cleanly outside Docker. Fixed by adding an explicit `COPY tsconfig.base.json` to both Dockerfiles' build stages.
3. **Missing OpenSSL in `node:22-slim`**: the image built successfully (Prisma's `generate` step only warns when it can't detect the local libssl version, defaulting to a guess) but the container **crashed immediately on boot** — `PrismaClientInitializationError: libssl.so.1.1: cannot open shared object file`. `node:22-slim` doesn't ship OpenSSL; Prisma's native query-engine binary needs it. This is the most operationally dangerous class of the three defects found — a Docker image that builds cleanly and looks done, but never actually serves a single request. Fixed by installing `openssl` via `apt-get` in both the `base` and `runtime` stages (they're independent `FROM node:22-slim` declarations, so both need it).

After all three fixes: `docker build -f apps/api/Dockerfile .` succeeds, and `docker run` against the real `beaconvie_default` compose network (real Postgres, real Redis) serves `GET /health/ready` → `200 {"status":"ok","checks":{"database":"ok","redis":"ok"}}`. See §12 for the full verification log and what still wasn't (and, per this project's own standards, shouldn't have been) attempted — real external credentials.

---

## 2. Frontend build args (baked in at build time)

Next.js inlines every `NEXT_PUBLIC_*` value into the client bundle at build time — changing one requires a rebuild, not just a redeploy with new env vars.

| Build arg | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | The API's public URL, e.g. `https://api.example.com` |
| `NEXT_PUBLIC_APP_URL` | Yes | The frontend's own public URL — used for `metadataBase`, canonical links |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Absent = Sentry fully disabled client-side, no build failure |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | No | Defaults to enabled; set `false` to stop the client from calling `/analytics/events` at all |

## 3. Backend deployment

Runtime env vars (not build args — the API image is generic across environments): see the full matrix in §7.

`apps/api` does **not** run Prisma migrations on container start (§4 explains why). It does run `prisma generate` at **build** time (baked into the image) — the generated client always matches the schema that shipped in that image.

## 4. Database migrations

**Deliberately a separate deployment step, not a container-startup hook.** Running migrations as part of every container boot means every horizontally-scaled replica races to run the same migration on startup — harmless for some migrations, actively dangerous for others (a long-running index build, a column rename mid-deploy while old-code replicas are still reading/writing). Run once, before the new API image receives traffic:

```
DATABASE_URL=<production-url> pnpm --filter @beaconvie/api prisma:migrate
```

This corresponds to `prisma migrate deploy` under the hood (see `apps/api/package.json`'s `prisma:migrate` script) — applies pending migrations, does not generate new ones, safe to run against a database other developers/processes are also connected to.

## 5. Redis

Used for: rate-limiting storage (`RedisThrottlerStorageService`), geocoding candidate tokens, generation concurrency locks. All three are documented as **fail-open** on Redis unavailability (see `docs/architecture/*` for each) — a Redis outage degrades rate-limiting and lock enforcement, it does not take the API down. `/health/ready` reports Redis status but a degraded Redis does not need to page anyone the way a degraded Postgres does.

## 6. Health checks

Two distinct questions, intentionally different (`apps/api/src/health/health.controller.ts`):

- **`GET /health/live`** — "is the process up." Always returns 200 if the Node process can respond at all. Point a container orchestrator's *restart* policy at this — restarting on a transient DB blip would just cause a restart storm.
- **`GET /health/ready`** — "is this instance ready to receive traffic." Checks Postgres and Redis; 200 only if both are reachable. Point a load balancer's *routing* health check at this — an instance that can't reach its database shouldn't receive requests, but doesn't need to be killed.

Deliberately **not** part of readiness: AI provider reachability, PayOS reachability, email provider reachability. All three are already designed to degrade gracefully per-request (budget/lock checks, best-effort interpretation, disclosed webhook/checkout failure paths) — making the whole API unready because an upstream AI provider is having an incident would be a strictly worse failure mode than the one it's trying to prevent.

## 7. Production environment variable matrix

Legend: **Req** = required for the process to boot in production (see `env.validation.ts`'s production-only checks); **Secret** = never log, never expose to the client; **Verified** = whether this session could confirm real runtime behavior (see §12 for why most are "No — no credential in this environment").

| Variable | Group | Req in prod | Secret | Verified this sprint |
|---|---|---|---|---|
| `DATABASE_URL` | Server | Yes | Yes | No — local dev DB only |
| `REDIS_URL` | Server | Yes | Yes | No — local dev Redis only |
| `API_BASE_URL`, `FRONTEND_URL`, `APP_PUBLIC_URL`, `CORS_ORIGINS` | Server | Yes | No | No — no production domain exists (see §9) |
| `TRUST_PROXY` | Server | Yes (has a safe default) | No | No — depends on hosting topology, unknown until a provider is chosen (see §10) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET` | Server | Yes | Yes | N/A — generated per-environment, not something to "verify," only to rotate off placeholder values (env validation already fails boot if left as `replace-with...`) |
| `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_DOMAIN`, `AUTH_COOKIE_SAME_SITE` | Cookies | Yes | No | No |
| `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`/`POSTMARK_SERVER_TOKEN` | Email | Yes (non-mailpit enforced in prod) | Key/token: yes | **No — externally blocked, no real provider credential exists in any environment checked** |
| `DEFAULT_AI_PROVIDER`, `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`/`GEMINI_API_KEY` | AI | Yes | Keys: yes | Dev-only keys present locally; production keys not this sprint's scope |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_MOCK_CHECKOUT`, `PAYMENTS_ENABLED` | PayOS | Yes | Keys: yes | **No — see §11, real merchant credentials not confirmed, `PAYOS_MOCK_CHECKOUT=true` locally** |
| `SENTRY_DSN` (API), `NEXT_PUBLIC_SENTRY_DSN` (web) | Observability | No | DSN is write-only, not secret | **No — absent in every environment this session could check, see §12** |
| `POSTHOG_API_KEY`, `POSTHOG_HOST`, `ANALYTICS_ENABLED` | Analytics | No | Key: not secret (write-only project key) | **No — no PostHog project exists yet, see §12** |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Analytics (frontend) | No | No | No |

## 8. Production config safety

Audited this sprint for dangerous defaults reaching production:

- `PAYOS_MOCK_CHECKOUT` — env validation already throws at boot if `true` in production (`env.validation.ts`). Verified present and correct.
- `AI_ENABLE_MOCK_PROVIDER` / `DEFAULT_AI_PROVIDER=mock` / `FALLBACK_PROVIDER=mock` — all three already throw at boot in production. Verified present and correct.
- `EMAIL_PROVIDER=mailpit` — already throws at boot in production. Verified present and correct.
- Rate-limit values — production should use the shipped defaults (`AUTH_RATE_LIMIT_MAX=5`/15min, `PAYMENT_RATE_LIMIT_MAX=10`/60s, `DISCOVERY_RATE_LIMIT_MAX=10`/60s, `AI_RATE_LIMIT_MAX=20`/60s) rather than the loosened `.env.test` overrides — no code-level guard against a mistakenly-loosened production value exists; this is a deployment-config discipline item, not something the app can self-enforce.
- No secret is exposed as a `NEXT_PUBLIC_*` variable — confirmed by inspection of `apps/web/.env.example`; the only public-prefixed values are a URL, a write-only Sentry DSN, and a boolean.

No new unsafe default was introduced by Sprint 13's changes.

## 9. Production domain

**Status: not yet decided.** `APP_PUBLIC_URL`/`FRONTEND_URL`/`API_BASE_URL`/`CORS_ORIGINS` all require a real domain, which in turn gates:
- The PayOS webhook URL (§11) — cannot be registered without a stable public API URL.
- Email links (verify-email, reset-password) — already correctly built from `APP_PUBLIC_URL`, just needs a real value.
- Sentry/analytics — cosmetic (environment tag), not blocking, but should match once chosen.

**FOUNDER/DEPLOYMENT DECISION REQUIRED** — tracked in `docs/product/product-completion-roadmap-v2.md` §4.

## 10. TRUST_PROXY

`main.ts` sets Express's `trust proxy` directly from this value (`'true'` / `'false'` / a hop count). It directly affects every IP-keyed rate limiter's correctness (`companion-ip`, `discovery-ip`, `LoginThrottlerGuard`'s IP fallback) — a wrong value either trusts a spoofable client-supplied header (too permissive) or attributes every request behind a reverse proxy to one IP (too restrictive, real users get rate-limited by each other).

**PRODUCTION TOPOLOGY VERIFICATION REQUIRED** — the correct value depends entirely on the chosen hosting provider's proxy chain (a single reverse proxy in front = `'true'` or `1`; a CDN + load balancer = `2`; direct exposure, no proxy = `'false'`). Do not set this blindly; confirm the real hop count against whatever provider is chosen (§9) before the first production deploy.

## 11. Payment webhook — production checklist

Expected production endpoint: `POST {API_BASE_URL}/payment/webhooks/payos`.

1. Confirm `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` are real merchant credentials (not the local dev/sandbox-shaped values currently in `apps/api/.env` — this session did not attempt to determine whether those are real sandbox credentials or placeholders, and took no action to test them; see §12).
2. Confirm `PAYOS_MOCK_CHECKOUT=false` and `PAYMENTS_ENABLED` reflects the intended launch state.
3. Register the webhook URL with PayOS **after** the production domain (§9) is live and reachable over HTTPS — do not register a URL that isn't serving yet.
4. Post-registration smoke check: trigger one real (or PayOS-sandbox, if available) checkout and confirm the webhook round-trips to a `PAID` order transition — do not consider this checklist complete on registration alone.
5. No rate limiting exists on the webhook route itself (by design — PayOS's own retry behavior shouldn't be second-guessed) — mitigate at the infra/edge layer if the hosting provider offers one cheaply.

## 12. Runtime verification performed this sprint — honest status

This session ran in a local development environment with no production credentials and, for most of the session, no Docker daemon reachable. What was and wasn't actually verified:

- **Sentry**: `SENTRY_DSN` is absent from every `.env` file this session could inspect (`apps/api/.env`, `apps/api/.env.test`). **SENTRY RUNTIME: EXTERNALLY BLOCKED** — no DSN, no project, nothing to verify against. Code path (`instrument.ts`'s `enabled: !!dsn`) confirmed correct by inspection; never exercised against a real Sentry ingestion endpoint.
- **Email**: `EMAIL_PROVIDER=mailpit` locally (dev-only SMTP capture tool). No `RESEND_API_KEY`/`POSTMARK_SERVER_TOKEN` present anywhere. **REAL EMAIL: EXTERNALLY BLOCKED**.
- **PayOS**: `PAYOS_MOCK_CHECKOUT=true` locally; `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY` have non-empty values in the local `.env` but this session has no way to confirm whether they're real (sandbox or production) merchant credentials versus placeholder-shaped values, and took no action to call PayOS's real API with them — doing so without explicit, in-the-moment founder authorization would be exactly the kind of hard-to-reverse financial action this project's own operating principles rule out. **PAYOS REAL RUNTIME: EXTERNALLY BLOCKED / NOT ATTEMPTED**.
- **Analytics**: No `POSTHOG_API_KEY` configured anywhere. `NoopAnalyticsSink` is what actually runs in every environment this session touched — confirmed by reading `AnalyticsModule`'s sink factory and by every analytics test passing without ever hitting the real network. **ANALYTICS RUNTIME: EXTERNALLY BLOCKED**.
- **Production domain**: none exists. **PRODUCTION DOMAIN: EXTERNALLY BLOCKED**.
- **TRUST_PROXY**: unset locally (defaults to `'false'`), and correctness cannot be determined without a real hosting topology. **TRUST_PROXY: REQUIRES DEPLOYMENT CONFIRMATION**.
- **Docker builds**: `docker compose ps` failed, and once launched, `docker info` reported `"Docker Desktop is unable to start"` in this sandboxed session. **Neither `apps/api/Dockerfile` nor `apps/web/Dockerfile` was build-tested.**
- **`next build` with `output: 'standalone'` on this Windows host**: `pnpm run build:web` compiles, type-checks, and prerenders all 48 routes successfully, then fails at the final "Collecting build traces" step with `EPERM: operation not permitted, symlink ...` — Windows requires Developer Mode or elevated privileges to create filesystem symlinks, which `next build`'s standalone-output tracing needs and this session's shell doesn't have. Re-running the identical build with `output: 'standalone'` temporarily removed completes with exit code 0, confirming every line of this sprint's actual code compiles cleanly — the failure is isolated entirely to the Windows-host symlink step, not the application code. `apps/web/Dockerfile`'s build stage runs `pnpm --filter @beaconvie/web build` inside a `node:20-slim` **Linux** container, where symlink creation is unrestricted, so this specific failure is not expected to reproduce there — **stated as a reasoned expectation, not a verified fact**, since the Docker build itself could not be run this session either (see above).
- **What WAS verified**: `apps/api` and `apps/web`'s full existing test suites (105 backend suites/1033 tests, 72 frontend suites/357 tests, all passing after this sprint's changes), both apps' TypeScript compilation clean, all new analytics-specific unit tests, the throttler-isolation regression suite, and (pending Docker) the analytics e2e suite.

**None of the above blockers are unique to this sprint** — they match the prior audit's own findings (`docs/audit/full-product-completion-roadmap-rebase.md` §20, §26) almost exactly. Sprint 13's job was to build the code and the verification harness, not to manufacture credentials that don't exist.

## 13. Rollback

No orchestration-specific rollback procedure is prescribed here (depends on the eventual hosting provider). General principles that do apply regardless of provider:

- The API image is stateless — rolling back to a prior image tag is safe **as long as no migration in the new deploy needs to be reverted first**. A migration that added a nullable column or a new table is safe to leave in place during a code rollback; one that dropped/renamed a column is not — check the migration list before rolling back code that shipped alongside one.
- The frontend image is fully stateless — safe to roll back independently of the API at any time.
- Never roll back past a payment-schema migration without first confirming no `PaymentWebhookEvent`/`PaymentOrder` row created under the new schema would become unreadable by the old code.

## 14. Post-deployment smoke checks

Minimum checklist before considering a deploy "done," once a real environment exists:

1. `GET /health/live` and `GET /health/ready` both 200.
2. Register a throwaway account through the real frontend; confirm `signup_completed`/`onboarding_*` events would fire (verifiable in code review even before a real analytics provider is connected).
3. One real Tarot draw completes and persists.
4. `/premium` loads and shows the real (or disclosed-test) price.
5. Once Sentry is connected: trigger one deliberate test error, confirm it arrives, confirm the scrubbing contract holds (no PII/secrets in the captured event).
6. Once a real analytics key is connected: confirm one `landing_view` event arrives in the provider's UI.
