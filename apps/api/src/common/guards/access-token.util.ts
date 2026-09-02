import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../../auth/cookie.service';

const BEARER_PREFIX = 'Bearer ';

/**
 * Dual-transport access-token extraction, shared by JwtAuthGuard/OptionalJwtAuthGuard.
 *
 * Cookie first — identical precedence/behavior to before this existed, so any request carrying
 * the web's httpOnly cookie is completely unaffected. Falls back to `Authorization: Bearer
 * <token>` only when no cookie is present, which is the mobile app's only transport (it has no
 * cookie jar shared with the API domain — see apps/mobile/src/lib/auth/session-client.ts). The
 * two are never merged/compared; whichever is present per this precedence wins outright, so there
 * is no ambiguous-credential case to resolve.
 */
export function resolveAccessToken(request: Request): string | undefined {
  const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE];
  if (cookieToken) return cookieToken;

  const header = request.headers?.authorization;
  if (header?.startsWith(BEARER_PREFIX)) {
    const token = header.slice(BEARER_PREFIX.length).trim();
    return token || undefined;
  }
  return undefined;
}

/**
 * Presence-only check (not validity) — used by CsrfGuard, which runs before any route guard and
 * so can't yet know whether a Bearer token is valid. A request that presents this header skips
 * double-submit CSRF (meaningless without a cookie in play); if the token turns out invalid,
 * JwtAuthGuard still 401s it downstream, so skipping CSRF here is never itself an auth bypass.
 */
export function hasBearerAuthorization(request: Request): boolean {
  const header = request.headers?.authorization;
  return typeof header === 'string' && header.startsWith(BEARER_PREFIX);
}
