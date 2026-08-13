import { createHmac } from 'crypto';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// Flow 25: Notification & Retention Foundation (Sprint 11) — the product's only unshipped V1
// Product Bible module. See docs/audit/sprint-11-pre-implementation-audit.md and
// docs/architecture/notification-retention.md.
//
// Notification *creation* has no client-facing trigger endpoint by design (deterministic,
// internal-only — see notifications.module.ts). This spec does not invent a test-only backdoor to
// work around that; instead it drives the one notification type this codebase's own established
// e2e mechanism can already reach for real: `premium.activated`, created via the exact same real
// checkout -> HMAC-signed webhook loop `flow-21-premium-payment.spec.ts` already uses (requires
// `PAYOS_MOCK_CHECKOUT=true` + a known `PAYOS_CHECKSUM_KEY` on the running API server). The Daily
// Tarot reminder (scheduler-only, `@Cron`-driven) is covered instead by
// `notifications-scheduler.service.spec.ts`'s real dedupe/preference-gating unit coverage — a
// Playwright spec cannot fire an in-process NestJS cron job without a backdoor this sprint
// deliberately does not add (see the brief's own "no marketing automation platform" boundary).
//
// Requires: PAYOS_MOCK_CHECKOUT=true, a known PAYOS_CHECKSUM_KEY. Does not depend on real Gemini.
// Does not send real external email — the reminder-email preference toggle is verified as a
// persisted setting only, never by asserting on an actual sent email (no Mailpit assertion needed
// here since `premium.activated` is in-app only in Sprint 11, see payment-webhook.service.ts).

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY ?? 'dev-only-payos-checksum-key-not-for-production-xxxxx';

test.describe.configure({ timeout: 180_000 });

function buildSignatureData(data: Record<string, unknown>): string {
  return Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key] === null || data[key] === undefined ? '' : String(data[key])}`)
    .join('&');
}

function signWebhookData(data: Record<string, unknown>): string {
  return createHmac('sha256', CHECKSUM_KEY).update(buildSignatureData(data)).digest('hex');
}

async function registerAndOnboard(page: Page, label: string): Promise<void> {
  const email = `flow25-${label}-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow TwentyFive');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Checking out notifications today.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Making sure notifications work end to end.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/** Real checkout -> real signed webhook -> real `premium.activated` Notification, exactly
 * mirroring flow-21's own established mechanism (see this file's header comment). */
async function completeRealPremiumCheckout(page: Page): Promise<void> {
  await page.goto('/premium');
  await page.route('**/mock-checkout/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Mock PayOS checkout</body></html>' }));

  let checkoutBody: { data: { id: string; checkoutUrl: string | null; amount: number; currency: string } } | null = null;
  await page.route('**/payment/checkout', async (route) => {
    const response = await route.fetch();
    checkoutBody = (await response.json()) as typeof checkoutBody;
    await route.fulfill({ response });
  });

  await page.getByRole('button', { name: 'Upgrade to Premium' }).click();
  await expect.poll(() => checkoutBody, { timeout: 10000 }).not.toBeNull();
  const orderId = checkoutBody!.data.id;

  const orderCode = await fetchProviderOrderCode(page.request, orderId);
  const webhookData = {
    orderCode: Number(orderCode),
    amount: checkoutBody!.data.amount,
    description: 'BeaconVie Premium',
    reference: `FT-E2E-FLOW25-${Date.now()}`,
    currency: checkoutBody!.data.currency,
  };
  const webhookResponse = await page.request.post(`${API_BASE_URL}/payment/webhooks/payos`, {
    data: { code: '00', desc: 'success', success: true, data: webhookData, signature: signWebhookData(webhookData) },
  });
  expect(webhookResponse.ok()).toBe(true);
}

async function fetchProviderOrderCode(request: APIRequestContext, orderId: string): Promise<string> {
  const res = await request.get(`${API_BASE_URL}/payment/orders/${orderId}`);
  const body = (await res.json()) as { data: { checkoutUrl: string | null } };
  const match = body.data.checkoutUrl?.match(/mock-checkout\/(\d+)/);
  if (!match) throw new Error(`Could not derive providerOrderCode from checkoutUrl: ${body.data.checkoutUrl}`);
  return match[1]!;
}

test('a real premium.activated notification appears in the Notification Center, updates the unread badge, marks read, and deep-links correctly', async ({ page }) => {
  await registerAndOnboard(page, 'notif');

  // No unread notifications yet for a brand-new account.
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /Notifications, \d+ unread/ })).not.toBeVisible();

  await completeRealPremiumCheckout(page);

  // The badge reflects a real, backend-created notification — poll since delivery is async
  // relative to the webhook HTTP response returning.
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: 'Notifications, 1 unread' }).click();
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  const notificationRow = page.getByRole('button').filter({ hasText: 'Premium is active' });
  await expect(notificationRow).toBeVisible({ timeout: 10000 });
  // Scoped to the row itself — the bare page also has an unrelated "Premium" heading from the
  // dashboard's PremiumStatusCard underneath the dialog overlay, which a page-wide locator matches too.
  await expect(notificationRow.getByText('Premium', { exact: true })).toBeVisible(); // category badge

  // Clicking it marks it read and follows the real deep link (`/settings`).
  await notificationRow.click();
  await expect(page).toHaveURL(/\/settings/);

  // The badge is now clear — the notification was really marked read, not just visually dismissed.
  await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /unread/ })).not.toBeVisible();
});

test('notification preferences persist across reload and the email toggle is disabled while reminders are off', async ({ page }) => {
  await registerAndOnboard(page, 'prefs');

  await page.goto('/settings');
  const inAppCheckbox = page.getByLabel(/show reminders in notifications/i);
  const emailCheckbox = page.getByLabel(/also email me reminders/i);

  await expect(inAppCheckbox).toBeChecked(); // schema default
  await expect(emailCheckbox).not.toBeChecked();
  await expect(emailCheckbox).toBeEnabled();

  await inAppCheckbox.uncheck();
  await expect(page.getByText(/preference updated/i)).toBeVisible({ timeout: 10000 });
  await expect(emailCheckbox).toBeDisabled();

  // Real persistence — reload and confirm it's not just local component state.
  await page.reload();
  await expect(page.getByLabel(/show reminders in notifications/i)).not.toBeChecked({ timeout: 10000 });
  await expect(page.getByLabel(/also email me reminders/i)).toBeDisabled();

  // Account/payment notices are described as always-on, with no toggle to turn them off.
  await expect(page.getByText(/account and premium payment notices/i)).toBeVisible();
});
