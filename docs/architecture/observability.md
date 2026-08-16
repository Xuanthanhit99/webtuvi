# Observability (Sprint 12)

Closes the Sprint 12 audit's central observability gap (§32–§36): zero production error tracking,
a scheduler that could fail silently, and no AI feature-level cost visibility. Covers what's now in
place, what Sentry does and does not see, and the scrubbing that makes shipping Sentry safe.

## Scope: error tracking only

Deliberately minimal, per the audit's own framing (§34): Sentry, backend + frontend,
**error-tracking tier only**. No performance tracing (`tracesSampleRate: 0` everywhere it's
configured), no session replay, no profiling. This stack already has Pino structured logging and a
per-request `x-request-id` correlation mechanism (`RequestIdMiddleware`) — Sentry's job here is
narrowly "surface a real error with enough context to act on it," not full distributed tracing.

## Backend (`@sentry/nestjs`)

- `apps/api/src/instrument.ts` — the very first import in `main.ts` (ahead of `reflect-metadata`),
  per Sentry's own NestJS setup requirement. `Sentry.init({ dsn, enabled: !!dsn, tracesSampleRate:
  0, beforeSend: scrubSentryEvent })` — absent `SENTRY_DSN` makes the whole file a safe no-op; API
  boot never depends on Sentry being configured or reachable.
- **No `SentryGlobalFilter`/`APP_FILTER` added.** This codebase already has exactly one global
  exception filter (`HttpExceptionFilter`, registered via `app.useGlobalFilters()` in `main.ts`)
  that normalizes every error into one response envelope and logs via the existing Pino logger.
  Rather than layering a second, competing global filter (a real risk of "duplicate noisy
  reporting" — something Sentry's own docs warn against), `Sentry.captureException()` is called
  directly inside `HttpExceptionFilter.catch()`'s existing `status >= 500` branch — the same branch
  that already logs via `this.logger.error(...)`. This means: only genuine server errors reach
  Sentry, never the expected 4xx control flow (validation failures, not-found, rate-limited,
  budget-exceeded) that already has its own normalized shape. Tagged with the same `requestId`
  already used for Pino log correlation, so a Sentry event and its matching log lines are
  trivially cross-referenced.
- **Scheduler errors** (`NotificationsSchedulerService`) additionally call
  `Sentry.captureException()` at both failure points added in Sprint 12 (per-candidate isolation,
  and the outer `@Cron` entry-point catch) — purely additive visibility. Scheduler correctness
  (the try/catch, the `Logger.error` calls, the dedupe/pagination behavior) does not depend on
  Sentry in any way; this was true before Sentry existed and remains true now.
- Existing Pino logs and request-ID correlation are entirely untouched — Sentry is additive, never
  a replacement.

## Frontend (`@sentry/nextjs`)

- `instrumentation-client.ts` — browser-side init (App Router's current convention, replacing the
  older `sentry.client.config.ts` pattern).
- `sentry.server.config.ts` / `sentry.edge.config.ts` — server/edge runtime init, loaded
  conditionally by `instrumentation.ts`'s `register()` hook; `onRequestError =
  Sentry.captureRequestError` wires Server Component/middleware errors into the same pipeline.
- `next.config.mjs` wrapped with `withSentryConfig` — enables build-time source-map upload
  *if* `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` are set (none exist in this environment);
  its absence never breaks the build, confirmed by a real production build this session.
- `app/global-error.tsx` (Sprint 12's other explicit deliverable, audit §36) — the one missing
  root-level error boundary. Calls `Sentry.captureException(error)` in a `useEffect`, same
  disabled-without-DSN safety as every other Sentry entry point. Mirrors `app/error.tsx`'s existing
  presentation (`ErrorState` component) rather than inventing a new look. Renders its own complete
  `<html>`/`<body>` and imports `styles/globals.css` directly, since it bypasses `app/layout.tsx`
  entirely when the root layout itself throws — deliberately does not use `AuthProvider`/
  `QueryProvider`, since those (or their dependencies) may be what crashed.

## Privacy scrubbing — mandatory prerequisite, not an afterthought

Per the audit's own explicit instruction (§35/Phase 18): **Sentry must not ship before scrubbing
is verified.** `beforeSend` is wired unconditionally in every `Sentry.init()` call, before Sentry
is ever enabled with a real DSN — there is no code path where Sentry is on without it.

Two structurally identical implementations (`apps/api/src/common/sentry/sentry-scrub.util.ts`,
`apps/web/lib/sentry-scrub.ts` — kept as separate small files rather than a shared package, since
`@sentry/nestjs` and `@sentry/nextjs` have slightly different `Event`/`ErrorEvent` shapes and the
duplication cost is low):

- **Allowlist for request data**: `event.request.data` (body), `.cookies`, and `.query_string` are
  always dropped entirely, regardless of content — "do not send raw request bodies unless
  explicitly proven safe" is satisfied literally, since none are ever proven safe here. Headers are
  allowlisted to five known-safe names (`content-type`, `accept`, `accept-language`, `user-agent`,
  `x-request-id`) — everything else, including `Authorization`/`Cookie`/`Set-Cookie`/
  `X-CSRF-Token`, is dropped by construction.
- **Never attaches user email/username/IP** — `event.user.email`/`.username`/`.ip_address` are
  deleted if present (defense-in-depth; this codebase never calls `Sentry.setUser()` with PII
  anywhere). An opaque `user.id` is fine to keep if a future call site sets one.
- **Allowlist for `extra`/`contexts`/breadcrumb `data`** too, not a denylist — Release Closure
  finding, fixed during closure verification: the original implementation used a broad
  sensitive-key-name regex here. A dedicated attack test proved a real bypass — a sentinel value
  placed under an unanticipated, innocuous key name (`details`, `notes`, `misc`) survived
  untouched, since only the *key name* was ever inspected, never the value. Denylists are
  inherently incomplete against a key nobody anticipated. Fixed by switching to a short, curated
  allowlist of genuinely-operational key names (`requestId`, `feature`, `provider`, `model`,
  `orderId`, `userId`, `sourceId`, scheduler counters, provider-call timing/outcome fields, etc.,
  matching exactly what this codebase's own `Sentry.captureException()` call sites and existing
  `ProviderLog`/scheduler logging already treat as safe to log in plaintext) — every other key,
  regardless of what it's called or how deeply nested, is redacted by default, recursively, to a
  bounded depth. This closes the bypass completely rather than attempting to enumerate every
  possible sensitive key name.
- **Never touches `event.message`/`event.exception`** — the actual error text is the entire point
  of error tracking, and this codebase's own exception types don't carry Authorization headers or
  journal content inside their `message` field (mirrors `ProviderLog`'s own long-standing
  "operational metadata only" discipline).
- Tested: 10 backend + 7 frontend unit tests cover every branch above (request stripping, header
  allowlisting, user PII removal, recursive `extra`/`contexts`/breadcrumb redaction, and the
  explicit "top-level error message survives" case).

## What is NOT collected

Per the Sprint 12 brief's explicit list — none of the following are ever sent to Sentry, by the
scrubbing design above: `Authorization`/`Cookie`/`Set-Cookie`/`X-CSRF-Token` headers, API keys,
PayOS signatures, passwords/password confirmations, reset/verification tokens, Journal content,
Memory content, Tarot questions, Numerology birth names/dates, Companion message content, AI
prompts, or AI-generated response content.

## Operational failure flow

```
unhandled error / thrown exception
  → HttpExceptionFilter.catch() (backend) or React error boundary (frontend)
    → normalized response to the client (backend) / ErrorState UI (frontend) — unchanged
    → Logger.error() with requestId (backend, unchanged) / console (frontend dev)
    → Sentry.captureException() — scrubbed, tagged with requestId (backend) — no-op if DSN unset
```

Scheduler-specific flow (`NotificationsSchedulerService`, Sprint 12 Phase 2):

```
candidate throws mid-loop → caught, failed++ → Logger.error (userId, error message — never email/
  content) → Sentry.captureException → loop continues to the next candidate
entire run throws (e.g. eligibility query fails) → caught in the @Cron entry point → Logger.error
  → Sentry.captureException → process stays healthy, next day's scheduled run is unaffected
```

## Verified

- Full backend unit suite: 104 suites / 999 tests (includes scheduler regression tests proving
  isolation, and scrub-utility tests).
- Full frontend unit suite: 72 suites / 354 tests (includes `global-error.tsx` and scrub-utility
  tests).
- Production builds: both API (`nest build`) and Web (`next build`, 48 routes) succeed cleanly with
  Sentry wired in and no `SENTRY_DSN` set — confirming the "never blocks boot/build" requirement
  is real, not just documented.
- **SENTRY RUNTIME: BLOCKED BY ENVIRONMENT** — no `SENTRY_DSN` exists in this session; the
  integration compiles, builds, and is unit-tested, but no real event has been sent to an actual
  Sentry project. Not fabricated as verified.
