// Sprint 12 — edge-runtime Sentry init (middleware, edge routes). Same error-tracking-only,
// safely-disabled-without-DSN, scrubbed-unconditionally design as instrumentation-client.ts.
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
