import { APP_ROUTES, isPublicDiscoveryRoute } from './route-guard';

const INTERNAL_ORIGIN = 'https://internal.invalid';

/** Validate before URL normalization, including encoded authority/control characters.
 * Auth endpoints and arbitrary non-app destinations are not return destinations. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  let decoded = value;
  try {
    for (let depth = 0; depth < 8; depth++) {
      if (/[\\\s]/u.test(decoded) || Array.from(decoded).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) || !decoded.startsWith('/') || decoded.startsWith('//')) return '/';
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      if (depth === 7) return '/';
      decoded = next;
    }
    const url = new URL(value, INTERNAL_ORIGIN);
    const normalized = new URL(decoded, INTERNAL_ORIGIN);
    const isAppPath = (path: string) => path === '/' || isPublicDiscoveryRoute(path) || APP_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
    if (url.origin !== INTERNAL_ORIGIN || normalized.origin !== INTERNAL_ORIGIN || !isAppPath(url.pathname) || !isAppPath(normalized.pathname)) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

export function authReturnUrl(route: '/login' | '/onboarding', destination: unknown): string {
  const next = safeNextPath(destination);
  return next === '/' ? route : `${route}?next=${encodeURIComponent(next)}`;
}
