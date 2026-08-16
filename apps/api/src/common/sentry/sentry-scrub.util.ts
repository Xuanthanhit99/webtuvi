import type { ErrorEvent, EventHint } from '@sentry/nestjs';

/**
 * Sprint 12 — mandatory `beforeSend` scrubbing, installed in `instrument.ts` before Sentry is
 * ever enabled (see that file's docstring: "Sentry must NOT ship before scrubbing is verified").
 *
 * Strategy: ALLOWLIST everywhere, not denylist — request headers, and (Release Closure hardening,
 * see below) `extra`/`contexts`/breadcrumb `data` keys too. Request bodies/cookies/query strings
 * are never sent at all, regardless of content — "do not send raw request bodies unless
 * explicitly proven safe" is satisfied literally: none are ever proven safe here. Never touches
 * `event.exception`/`event.message` — the actual error text is the entire point of error tracking
 * and is never itself a carrier of Authorization headers/passwords/journal content in this
 * codebase's own exception types (see docs/security/ai-safety.md "Observability" for the
 * equivalent, longer-standing rule already applied to `ProviderLog`).
 *
 * Release Closure finding (fixed here, not merely noted): an earlier version of this file used a
 * DENYLIST (a broad sensitive-key-name regex) for `extra`/`contexts`/breadcrumb `data`. A
 * dedicated attack test proved this denylist-by-key-name approach has a real bypass: a sensitive
 * value placed under an innocuous, unlisted key name (e.g. `details`, `notes`, `misc`) sailed
 * through untouched, because nothing about the *value* was ever inspected — only the *key* was.
 * Denylists are inherently incomplete against a key name nobody anticipated; this is why request
 * headers already used an allowlist (§ above) and `extra`/`contexts`/breadcrumb data now do too —
 * only a short, curated set of genuinely-operational key names ever survives; every other key,
 * regardless of what it's called, is redacted by default. This closes the bypass completely
 * rather than attempting to enumerate every possible sensitive key name.
 */

const ALLOWED_REQUEST_HEADERS = new Set(['content-type', 'accept', 'accept-language', 'user-agent', 'x-request-id']);

/** The only key names allowed to survive inside `extra`/`contexts`/breadcrumb `data`, at any
 * nesting depth — everything else is redacted regardless of what it's called. Deliberately short
 * and matched to what this codebase's own `Sentry.captureException(...)` call sites actually pass
 * (`requestId`, `scheduler`/`scope` tags) plus the genuinely-operational metadata
 * `ProviderLog`/`AIUsage`/the notification scheduler already treat as safe to log in plaintext
 * (opaque ids, provider/model names, counts, timings, outcome codes) — never free-form product
 * content. Case-insensitive. */
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
    // Never sent, regardless of content — see the strategy note above.
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    event.request.headers = allowlistHeaders(event.request.headers as Record<string, string | undefined> | undefined);
  }

  // Never attach authenticated user email/username by default (Sprint 12 brief: "prefer an
  // opaque internal user ID"). This codebase doesn't call Sentry.setUser() with PII anywhere —
  // this is defense-in-depth in case a future call site does.
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
