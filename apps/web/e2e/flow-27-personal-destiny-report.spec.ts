import { createHmac } from 'crypto';
import { test, expect, type Page } from '@playwright/test';

// Flow 27: Personal Destiny Report (Sprint 16) — register/onboard -> create Numerology + Natal
// Chart (via direct API calls, matching account-data-rights.e2e-spec.ts's own "real API calls for
// setup, not the system under test" precedent — Reports is the system under test here, not
// Numerology/Natal Chart's own UI, which flow-22/flow-23 already cover) -> readiness -> Premium
// gate -> real checkout+webhook (mirrors flow-21 exactly) -> generate -> structured sections ->
// Calculated Facts -> AI disclosure -> history -> regenerate -> Companion bridge.
//
// Requires DEFAULT_AI_PROVIDER=gemini with a real GEMINI_API_KEY on the running API server for the
// READY-report assertions below to be reachable — MockProvider's generic canned replies can never
// satisfy this feature's strict structured-JSON schema (see reports.e2e-spec.ts's own documented
// precedent, mirroring natal-chart.e2e-spec.ts's identical finding for its own interpretation
// pipeline). Also requires PAYOS_MOCK_CHECKOUT=true and a known PAYOS_CHECKSUM_KEY (same as
// flow-21). Does not depend on Vietnamese Tử Vi, Eastern Horoscope, Tarot, or Memory.

test.describe.configure({ timeout: 180_000 });

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
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

async function registerAndOnboard(page: Page, label: string): Promise<void> {
  const email = `flow27-${label}-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow TwentySeven');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Trying out the Personal Destiny Report today.');
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

/** `page.request` shares the browser context's cookie jar, but not the app's own CSRF-header
 * logic — a direct mutating call needs the same `X-CSRF-Token` header value the real UI's fetch
 * client already attaches automatically (mirrors the backend e2e suite's own `csrfHeaders()`
 * helper, apps/api/test/utils/test-app.ts). */
async function csrfHeader(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find((c) => c.name === 'beaconvie_csrf_token');
  if (!csrfCookie) throw new Error('No beaconvie_csrf_token cookie found — was the user registered/logged in first?');
  return { 'X-CSRF-Token': csrfCookie.value };
}

/** Setup only (not the system under test — flow-22 covers Numerology's own UI/API in depth). */
async function createNumerologyViaApi(page: Page): Promise<void> {
  const res = await page.request.post(`${API_BASE_URL}/numerology/calculate`, {
    data: { fullBirthName: 'Jane Doe', birthDate: '1990-05-15' },
    headers: await csrfHeader(page),
  });
  expect(res.ok()).toBe(true);
}

/** Setup only (not the system under test — flow-23 covers Natal Chart's own UI/geocoding search in
 * depth). `page.request` shares the browser context's cookie jar automatically, so these calls are
 * authenticated exactly like a real UI action would be — no manual cookie plumbing needed. Uses the
 * real geocoding search (a single well-known query, no mock needed here since this is setup, not
 * the system under test — mirrors account-data-rights.e2e-spec.ts's own "real API calls for setup"
 * precedent). */
async function createNatalChartViaApi(page: Page): Promise<void> {
  const searchRes = await page.request.get(`${API_BASE_URL}/geocoding/search?q=Hanoi`);
  expect(searchRes.ok()).toBe(true);
  const candidates = (await searchRes.json()).data as { token: string; label: string }[];
  expect(candidates.length).toBeGreaterThan(0);

  const res = await page.request.post(`${API_BASE_URL}/natal-charts`, {
    data: { birthDate: '2000-06-15', birthTime: '14:30', locationToken: candidates[0]!.token },
    headers: await csrfHeader(page),
  });
  expect(res.ok()).toBe(true);
}

async function grantPremium(page: Page): Promise<void> {
  await page.route('**/mock-checkout/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Mock PayOS checkout</body></html>' }));

  let checkoutBody: { data: { id: string; checkoutUrl: string | null; amount: number; currency: string } } | null = null;
  await page.route('**/payment/checkout', async (route) => {
    const response = await route.fetch();
    checkoutBody = (await response.json()) as typeof checkoutBody;
    await route.fulfill({ response });
  });

  await page.goto('/premium');
  await page.getByRole('button', { name: 'Upgrade to Premium' }).click();
  await expect.poll(() => checkoutBody, { timeout: 10000 }).not.toBeNull();
  const orderId = checkoutBody!.data.id;

  const orderRes = await page.request.get(`${API_BASE_URL}/payment/orders/${orderId}`);
  const orderBody = (await orderRes.json()) as { data: { checkoutUrl: string | null } };
  const match = orderBody.data.checkoutUrl?.match(/mock-checkout\/(\d+)/);
  if (!match) throw new Error(`Could not derive providerOrderCode from checkoutUrl: ${orderBody.data.checkoutUrl}`);
  const orderCode = match[1]!;

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

  await page.goto(`/premium/return?order=${orderId}`);
  await expect(page.getByText('Premium activated')).toBeVisible({ timeout: 15000 });
}

test('readiness, Premium gate, generation, structured report, history, regeneration, and the Companion bridge', async ({ page }) => {
  await registerAndOnboard(page, 'main');

  // 1. Readiness — honest, no-partial-report state before either required source exists.
  await page.goto('/reports');
  await expect(page.getByRole('heading', { name: 'Personal Destiny Report' })).toBeVisible();
  await expect(page.getByText('Calculate your Natal Chart')).toBeVisible();
  await expect(page.getByText('Calculate your Numerology')).toBeVisible();
  await expect(page.getByRole('button', { name: /upgrade to generate/i })).toBeDisabled();

  // 2. Create both required sources (setup, not the system under test).
  await createNumerologyViaApi(page);
  await createNatalChartViaApi(page);

  await page.reload();
  await expect(page.getByText('Calculate your Natal Chart')).not.toBeVisible();
  await expect(page.getByText('Calculate your Numerology')).not.toBeVisible();

  // 3. Free + ready: Premium gate, not a silently-failing Generate button. The underlying
  // Natal/Numerology results themselves remain free either way (locked decision).
  await expect(page.getByText(/Personal Destiny Report is a Premium feature/i)).toBeVisible();
  const upgradeButton = page.getByRole('button', { name: /upgrade to generate/i });
  await expect(upgradeButton).toBeEnabled();
  await upgradeButton.click();
  await expect(page).toHaveURL(/\/premium/);

  // 4. Real checkout + webhook (mirrors flow-21 exactly) — the only thing that can grant Premium.
  await grantPremium(page);

  // 5. Generate — real synthesis against the real configured AI provider.
  await page.goto('/reports');
  await expect(page.getByRole('button', { name: 'Generate my report' })).toBeEnabled({ timeout: 10000 });
  await page.getByRole('button', { name: 'Generate my report' }).click();

  // Generation is synchronous (locked architecture decision) — the whole request/response cycle
  // blocks until the report is READY/FAILED, so there is no separate "GENERATING" detail view to
  // land on first; the Generate button's own loading spinner (aria-busy) is the only in-flight
  // affordance until the app navigates straight to the finished result.
  await expect(page.getByRole('button', { name: 'Generate my report' })).toHaveAttribute('aria-busy', 'true');

  // 6. The real, structured report — Overview, Core Identity, Strengths, Calculated Facts,
  // Methodology — all populated from real evidence, never a placeholder. Generation is
  // synchronous per the locked architecture, so this resolves within one request/response cycle;
  // a generous timeout here tolerates real provider latency without masking a genuine hang.
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'Core Identity' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Strengths' })).toBeVisible();

  // 7. Calculated Facts is explicitly, visibly labeled deterministic — never conflated with the AI
  // narrative sections above it.
  const calculatedFacts = page.locator('#calculated-facts');
  await expect(calculatedFacts.getByText('Deterministic — never AI-generated')).toBeVisible();
  await expect(calculatedFacts).toBeVisible();

  // 8. AI disclosure / methodology section is present.
  await expect(page.getByRole('heading', { name: 'Methodology & AI Disclosure' })).toBeVisible();

  // 9. Companion bridge — read-only navigation, never a mutation control.
  const companionLink = page.getByRole('link', { name: /ask companion about this report/i });
  await expect(companionLink).toHaveAttribute('href', '/companion');

  // 10. History — the just-generated report appears; back out to confirm the list view.
  await page.getByRole('button', { name: '← Back to Reports' }).click();
  await expect(page.getByRole('list', { name: 'Report history' }).getByText('Ready')).toBeVisible({ timeout: 10000 });

  // 11. Regeneration creates a new report; the original is preserved, not overwritten. Verified
  // against real, freshly-fetched backend state (via a page reload, not a one-shot in-memory
  // React Query cache read, which is a UI-caching-timing concern separate from the actual
  // create-new-version-never-overwrite guarantee this step exists to prove).
  const listBefore = await page.request.get(`${API_BASE_URL}/reports`);
  const idsBefore = ((await listBefore.json()) as { data: { items: { id: string }[] } }).data.items.map((r) => r.id);

  await page.getByRole('list', { name: 'Report history' }).getByRole('button').first().click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 10000 });

  const regenerateResponsePromise = page.waitForResponse((res) => res.url().includes('/regenerate') && res.request().method() === 'POST');
  await page.getByRole('button', { name: 'Generate a new version' }).click();
  await regenerateResponsePromise;

  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({ timeout: 30_000 });

  const listAfter = await page.request.get(`${API_BASE_URL}/reports`);
  const idsAfter = ((await listAfter.json()) as { data: { items: { id: string }[] } }).data.items.map((r) => r.id);
  expect(idsAfter.length).toBe(idsBefore.length + 1);
  expect(idsAfter).toEqual(expect.arrayContaining(idsBefore)); // the original report(s) are still there, untouched

  // The list view, once freshly loaded, reflects this real state too.
  await page.getByRole('button', { name: '← Back to Reports' }).click();
  await page.reload();
  await expect(page.getByRole('list', { name: 'Report history' }).getByRole('listitem')).toHaveCount(idsAfter.length, { timeout: 10000 });
});
