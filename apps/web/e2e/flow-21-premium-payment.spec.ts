import { createHmac } from 'crypto';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// The API server is a separate origin from the Next.js app under test (Playwright's own
// `baseURL` is the web app, `http://localhost:3000`) — mirrors `NEXT_PUBLIC_API_URL`'s own default
// in apps/web/lib/api-client.ts.
const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// Flow 21: Premium & Payment Foundation (Sprint 7) — the first real monetization loop: free Tarot
// usage -> a real Premium boundary -> the Premium page -> a real backend-owned checkout order ->
// a HMAC-signed webhook (mirroring PayOS's own documented scheme) independently verified by the
// backend -> Premium entitlement granted -> the Tarot boundary lifting for the same account.
//
// Requires PAYOS_MOCK_CHECKOUT=true and a known PAYOS_CHECKSUM_KEY on the running API server (see
// apps/api/.env.example) — this spec signs its own webhook fixture with that same key via
// PAYOS_CHECKSUM_KEY in the Playwright process's own environment, exactly mirroring PayOS's
// documented HMAC-SHA256 scheme (see apps/api/src/payment/providers/payos-signature.util.ts). This
// does NOT verify real PayOS sandbox/production behavior — see
// docs/architecture/payment-foundation.md "Provider runtime verification status" for what remains
// unverified without live credentials.
//
// The mock checkout link (`PAYOS_MOCK_CHECKOUT=true`) is not a real hosted page, so this spec
// doesn't follow the actual external redirect (there is nothing real to land on) — it confirms the
// "Upgrade to Premium" button triggers a real `POST /payment/checkout` call, then drives the rest of
// the loop (webhook, entitlement, Tarot boundary lifting) through the real HTTP surface + real UI,
// exactly as a completed PayOS checkout would leave things.

test.describe.configure({ timeout: 180_000 });

const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY ?? 'dev-only-payos-checksum-key-not-for-production-xxxxx';

function buildSignatureData(data: Record<string, unknown>): string {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key] === null || data[key] === undefined ? '' : String(data[key])}`)
    .join('&');
}

function signWebhookData(data: Record<string, unknown>): string {
  return createHmac('sha256', CHECKSUM_KEY).update(buildSignatureData(data)).digest('hex');
}

async function registerAndOnboard(page: Page): Promise<void> {
  const email = `flow21-premium-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow TwentyOne');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Trying out the Premium flow today.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Making sure the whole loop works end to end.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Draws Single Card via the real UI until the Free daily cap (3/day) is hit. */
async function drawSingleCardToFreeLimit(page: Page): Promise<void> {
  await page.goto('/discover/tarot');
  await expect(page.getByRole('heading', { name: 'Tarot' })).toBeVisible({ timeout: 10000 });
  // Scoped to the Draw section — the account-level "verify your email" banner also carries
  // role=status, and getByRole('status') would otherwise match both (mirrors flow-20's own pattern).
  const drawSection = page.getByRole('region', { name: 'Draw' });
  // Selected once — the reading-type selection persists across "Draw again" resets (it's not part
  // of the reset state), and re-clicking it inside the loop would be ambiguous once a completed
  // reading's own history-list entry also carries a "Single Card" accessible name.
  await drawSection.getByRole('button', { name: /Single Card/ }).click();

  for (let i = 0; i < 3; i++) {
    await drawSection.getByRole('button', { name: 'Draw', exact: true }).click();
    await expect(drawSection.getByRole('status')).not.toBeVisible({ timeout: 10000 });
    await drawSection.getByRole('button', { name: 'Draw again' }).click();
  }
}

test('Free Tarot usage -> Premium boundary -> checkout -> verified webhook -> Premium Tarot access', async ({ page }) => {
  await registerAndOnboard(page);

  // 1. Real free usage, then a real Premium boundary — no card fabricated, no limit invented.
  await drawSingleCardToFreeLimit(page);
  await page.getByRole('region', { name: 'Draw' }).getByRole('button', { name: 'Draw', exact: true }).click();
  const banner = page.getByRole('alert').filter({ hasText: /free single card limit/i });
  await expect(banner).toBeVisible({ timeout: 10000 });
  const upgradeLink = banner.getByRole('link', { name: 'Upgrade to Premium' });
  await expect(upgradeLink).toHaveAttribute('href', '/premium?reason=required');

  // 2. The Premium page — Free state, boundary banner, matrix, and a real checkout attempt.
  await upgradeLink.click();
  await expect(page).toHaveURL(/\/premium\?reason=required/);
  await expect(page.getByText(/That.{1,2}s a Premium feature/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upgrade to Premium' })).toBeVisible();
  await expect(page.getByText('15 / day')).toBeVisible(); // Premium Single Card allowance, from the real matrix

  // The successful mutation does a real `window.location.href` redirect to the mock checkout URL —
  // that's PayOS's own real domain (just a path that doesn't exist there in mock mode), so this
  // stubs the navigation locally rather than depending on outbound network access from the test
  // runner. Everything up to and including this redirect trigger is still exercised for real.
  await page.route('**/mock-checkout/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Mock PayOS checkout</body></html>' }));

  // Reading the checkout response body via a route interception's own `route.fetch()` (rather than
  // `page.waitForResponse(...).json()`) avoids racing the `window.location.href` redirect that
  // fires immediately after — the browser navigation can otherwise tear down the response's
  // execution context before its body is read.
  let checkoutBody: { data: { id: string; checkoutUrl: string | null; amount: number; currency: string } } | null = null;
  await page.route('**/payment/checkout', async (route) => {
    const response = await route.fetch();
    checkoutBody = (await response.json()) as typeof checkoutBody;
    await route.fulfill({ response });
  });

  await page.getByRole('button', { name: 'Upgrade to Premium' }).click();
  await expect.poll(() => checkoutBody, { timeout: 10000 }).not.toBeNull();
  expect(checkoutBody!.data.checkoutUrl).toBeTruthy();
  expect(checkoutBody!.data.currency).toBe('VND');
  const orderId = checkoutBody!.data.id;

  // 3. The backend's own webhook — this test plays the role of PayOS, signing a payload with the
  // same HMAC scheme the real provider documents. This is the ONLY thing that can ever grant
  // Premium; nothing about the client-side redirect above did.
  const orderCode = await fetchProviderOrderCode(page.request, orderId);
  const webhookData = {
    orderCode: Number(orderCode),
    amount: checkoutBody!.data.amount,
    description: 'BeaconVie Premium',
    reference: `FT-E2E-${Date.now()}`,
    currency: checkoutBody!.data.currency,
  };
  const webhookResponse = await page.request.post(`${API_BASE_URL}/payment/webhooks/payos`, {
    data: { code: '00', desc: 'success', success: true, data: webhookData, signature: signWebhookData(webhookData) },
  });
  expect(webhookResponse.ok()).toBe(true);

  // 4. The return page reflects real, backend-confirmed state — never the redirect alone.
  await page.goto(`/premium/return?order=${orderId}`);
  await expect(page.getByText('Premium activated')).toBeVisible({ timeout: 15000 });

  // 5. Premium status is now visible on the Premium page itself, from the real entitlement.
  await page.goto('/premium');
  await expect(page.getByText(/You.{1,2}re Premium/i)).toBeVisible({ timeout: 10000 });

  // 6. The Tarot boundary that blocked draw #4 earlier is now genuinely lifted (Premium's higher
  // ceiling, not a client-side flag) — a 4th Single Card draw the same day succeeds.
  await page.goto('/discover/tarot');
  const finalDrawSection = page.getByRole('region', { name: 'Draw' });
  await finalDrawSection.getByRole('button', { name: /Single Card/ }).click();
  await finalDrawSection.getByRole('button', { name: 'Draw', exact: true }).click();
  await expect(finalDrawSection.getByRole('status')).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('alert').filter({ hasText: /free single card limit/i })).not.toBeVisible();
});

/** Test-only lookup of the PayOS `orderCode` a real PayOS webhook would echo back. The client-facing
 * `PaymentOrderDto` deliberately never exposes `providerOrderCode` (see payment.mappers.ts) — this
 * test instead parses it out of the mock checkout URL (`.../mock-checkout/<orderCode>`), exactly as
 * a real PayOS webhook-signing party already knows its own `orderCode` without needing to ask the
 * merchant for it back. */
async function fetchProviderOrderCode(request: APIRequestContext, orderId: string): Promise<string> {
  const res = await request.get(`${API_BASE_URL}/payment/orders/${orderId}`);
  const body = (await res.json()) as { data: { checkoutUrl: string | null } };
  const match = body.data.checkoutUrl?.match(/mock-checkout\/(\d+)/);
  if (!match) throw new Error(`Could not derive providerOrderCode from checkoutUrl: ${body.data.checkoutUrl}`);
  return match[1]!;
}
