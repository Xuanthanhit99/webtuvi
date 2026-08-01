/** Non-httpOnly by design — the frontend must be able to read it and echo it
 * back in the X-CSRF-Token header (double-submit cookie pattern). It carries
 * no authentication authority on its own: it is only ever checked for
 * equality against the header, plus an HMAC signature check against
 * CSRF_SECRET so a value can't be forged by e.g. a sibling-subdomain cookie
 * write. See docs/security/sprint-2a-security.md for the full threat model. */
export const CSRF_TOKEN_COOKIE = 'beaconvie_csrf_token';
export const CSRF_HEADER = 'x-csrf-token';
export const SKIP_CSRF_KEY = 'skipCsrf';
