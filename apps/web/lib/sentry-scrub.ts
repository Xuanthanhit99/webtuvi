import type { ErrorEvent, EventHint } from '@sentry/nextjs';

/**
 * Sprint 12 — mandatory `beforeSend` scrubbing for both the browser and server/edge Sentry
 * configs (see instrumentation-client.ts / sentry.server.config.ts / sentry.edge.config.ts).
 * Mirrors apps/api/src/common/sentry/sentry-scrub.util.ts's strategy exactly — same reasoning.
 * Kept as a separate, self-contained copy rather than a shared package: the two Sentry SDKs
 * (`@sentry/nestjs` vs `@sentry/nextjs`) have slightly different `Event`/`ErrorEvent` shapes, and
 * this file is small enough that duplicating it is cheaper and safer than introducing a new
 * cross-package type dependency for one function.
 *
 * Release Closure finding (fixed here, not merely noted — mirrors the identical backend fix): the
 * original version used a DENYLIST (sensitive-key-name regex) for `extra`/`contexts`/breadcrumb
 * `data`. A dedicated attack test proved a real bypass — a sensitive value under an unanticipated,
 * innocuous key name (`details`, `notes`, `misc`) sailed through untouched, since only the key
 * name was ever inspected. Switched to an ALLOWLIST (same short, curated safe-key list as the
 * backend) — every unrecognized key is redacted by default, regardless of what it's called.
 */

const ALLOWED_REQUEST_HEADERS = new Set(['content-type', 'accept', 'accept-language', 'user-agent', 'x-request-id']);

/** The only key names allowed to survive inside `extra`/`contexts`/breadcrumb `data`, at any
 * nesting depth — everything else is redacted regardless of what it's called. Case-insensitive.
 * Mirrors the backend's identical allowlist exactly. */
const ALLOWED_METADATA_KEYS = new Set([
  'requestid',
  'scheduler',
  'scope',
  'feature',
  'provider',
  'model',
  'count',
  'evaluated',
  'created',
  'emailed',
  'failed',
  'reason',
  'code',
  'errorcode',
  'status',
  'success',
  'latencyms',
  'retrycount',
  'streamdurationms',
  'orderid',
  'userid',
  'sourceid',
  'conversationid',
]);

const MAX_SCRUB_DEPTH = 6;

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > MAX_SCRUB_DEPTH) return '[Truncated]';
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      result[key] = ALLOWED_METADATA_KEYS.has(key.toLowerCase()) ? scrubValue(entryValue, depth + 1) : '[Redacted]';
    }
    return result;
  }
  return value;
}

function allowlistHeaders(headers: Record<string, string | undefined> | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined && ALLOWED_REQUEST_HEADERS.has(key.toLowerCase())) {
      result[key] = value;
    }
  }
  return result;
}

export function scrubSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    event.request.headers = allowlistHeaders(event.request.headers as Record<string, string | undefined> | undefined);
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }

  if (event.extra) {
    event.extra = scrubValue(event.extra, 0) as typeof event.extra;
  }

  if (event.contexts) {
    for (const key of Object.keys(event.contexts)) {
      event.contexts[key] = scrubValue(event.contexts[key], 0) as (typeof event.contexts)[string];
    }
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => ({
      ...breadcrumb,
      data: breadcrumb.data ? (scrubValue(breadcrumb.data, 0) as typeof breadcrumb.data) : breadcrumb.data,
    }));
  }

  return event;
}
