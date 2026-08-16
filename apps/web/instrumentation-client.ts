// Sprint 12 — browser-side Sentry init. Error-tracking tier only: no performance tracing
// (`tracesSampleRate: 0`), no session replay integration added, no profiling. Safely disabled
// when `NEXT_PUBLIC_SENTRY_DSN` is unset — the production build must not depend on Sentry being
// configured. `beforeSend` scrubbing (sentry-scrub.ts) is wired unconditionally, before Sentry is
// ever enabled with a real DSN — see that file's docstring and its own tests.
import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from '@/lib/sentry-scrub';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: process.env.NODE_ENV ?? 'development',
  tracesSampleRate: 0,
  beforeSend: scrubSentryEvent,
});

// Required export for the SDK's router instrumentation hook to resolve, even with tracing
// disabled (tracesSampleRate: 0 above) — a no-op in that case, but its absence otherwise produces
// a build-time warning.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
