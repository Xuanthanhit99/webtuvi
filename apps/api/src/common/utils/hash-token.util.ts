import { createHash } from 'crypto';

/** Used for every possession token stored at rest (refresh, password reset, email verification) — never store the raw value. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
