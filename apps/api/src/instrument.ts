// Sprint 12 — must be the very first import in main.ts, ahead of every other module (including
// `reflect-metadata`), per Sentry's own NestJS setup requirement: the SDK patches Node's runtime
// before anything else can grab a reference to the unpatched version.
//
// Sentry must NOT ship before scrubbing is verified (Sprint 12 brief, Phase 18) — `beforeSend`
// below is wired unconditionally, before `Sentry.init()` is ever called with a real DSN, so there
// is no code path where Sentry is enabled without it. See `sentry-scrub.util.ts` for the actual
// scrubbing logic and its own tests.
//
// Error-tracking tier only: no `tracesSampleRate` above 0 (no performance tracing), no profiling,
// no session replay integration added. `enabled: !!dsn` means an absent `SENTRY_DSN` makes this
// entire file a safe no-op — API boot is never blocked by Sentry being unavailable/misconfigured.
import * as Sentry from '@sentry/nestjs';
import { scrubSentryEvent } from './common/sentry/sentry-scrub.util';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0,
  beforeSend: scrubSentryEvent,
});
