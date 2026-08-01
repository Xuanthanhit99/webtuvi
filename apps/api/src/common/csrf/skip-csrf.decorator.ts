import { SetMetadata } from '@nestjs/common';
import { SKIP_CSRF_KEY } from './csrf.constants';

/**
 * Marks a route as exempt from CsrfGuard. Reserved for endpoints that either
 * have no ambient session cookie yet (register, login) or are themselves
 * protected by a single-use possession token (verify-email) — see
 * docs/security/sprint-2a-security.md for the full per-endpoint rationale.
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
