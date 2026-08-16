// Sprint 12 — Next.js's own instrumentation hook (distinct from Sentry's instrumentation-client.ts).
// Loads the right Sentry config for the current server runtime, and wires onRequestError so
// Server Component/middleware errors reach Sentry the same way client-side errors do.
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
