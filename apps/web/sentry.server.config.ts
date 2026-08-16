// Sprint 12 — server-runtime Sentry init (imported conditionally by instrumentation.ts). Same
// error-tracking-only, safely-disabled-without-DSN, scrubbed-unconditionally design as
// instrumentation-client.ts — see that file's comment for the full reasoning.
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
