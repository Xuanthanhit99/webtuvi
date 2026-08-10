import { createHmac, timingSafeEqual } from 'crypto';

/**
 * PayOS's documented HMAC-SHA256 signing scheme, used for both outgoing "create payment link"
 * requests and verifying incoming webhook deliveries: build a `key=value` string per field, sorted
 * alphabetically by key, joined with `&`, then HMAC-SHA256 (hex) against the merchant's checksum
 * key. Kept as pure functions (no network, no Nest DI) so the signing/verification logic itself is
 * exercised directly by unit tests, independent of whether a real PayOS credential is available —
 * see docs/architecture/payment-foundation.md "Webhook verification" for the full contract and its
 * verification status (locally verified against constructed fixtures; PayOS runtime UNVERIFIED, no
 * sandbox credentials available in this environment).
 */
export function buildPayOSSignatureData(data: Record<string, unknown>): string {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${stringifyPayOSValue(data[key])}`)
    .join('&');
}

function stringifyPayOSValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function signPayOSData(data: Record<string, unknown>, checksumKey: string): string {
  return createHmac('sha256', checksumKey).update(buildPayOSSignatureData(data)).digest('hex');
}

/** Constant-time comparison — a naive `===` on signatures is a timing side-channel. */
export function verifyPayOSSignature(data: Record<string, unknown>, signature: string, checksumKey: string): boolean {
  const expected = signPayOSData(data, checksumKey);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

/** A positive integer PayOS accepts as `orderCode`, unique per checkout attempt. Millisecond
 * timestamp (safely below Number.MAX_SAFE_INTEGER for the foreseeable future) with a random
 * two-digit suffix to avoid same-millisecond collisions under concurrent checkouts; the DB's own
 * unique constraint on `PaymentOrder.providerOrderCode` is the actual collision guarantee. */
export function generateOrderCode(): number {
  return Date.now() * 100 + Math.floor(Math.random() * 100);
}
