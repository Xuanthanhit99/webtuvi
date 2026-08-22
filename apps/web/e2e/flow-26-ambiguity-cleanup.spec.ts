import { test, expect } from '@playwright/test';

// Flow 26: Sprint 14 (Ambiguity Cleanup) — verifies the locked production brand (Tử Vi Tarot, per
// docs/progress/domain-brand-production-lock-final-report.md) is the sole coherent product shell:
// no public Mệnh Vi shell, frozen modules absent from primary UX, and Discover naming matches
// docs/product/vietnamese-tu-vi-product-definition.md §1 without implying Eastern Horoscope is
// Tử Vi. See docs/product/product-completion-roadmap-v2.md Sprint 14.

async function registerAndOnboard(page: import('@playwright/test').Page, label: string): Promise<void> {
  const email = `flow26-${label}-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow TwentySix');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Checking product coherence today.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Making sure there is only one product shell.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('production landing shows Tử Vi Tarot, not a competing brand', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Tử Vi Tarot/);
  await expect(page.getByText('Mệnh Vi')).toHaveCount(0);
  await expect(page.getByText('BeaconVie')).toHaveCount(0);
});

test('/menh-vi and its sub-routes are archived (404), not a public shell', async ({ page }) => {
  const notFoundHeading = /page not found/i;

  await page.goto('/menh-vi');
  await expect(page.getByRole('heading', { name: notFoundHeading })).toBeVisible();

  await page.goto('/menh-vi/la-so');
  await expect(page.getByRole('heading', { name: notFoundHeading })).toBeVisible();

  await page.goto('/menh-vi/tarot');
  await expect(page.getByRole('heading', { name: notFoundHeading })).toBeVisible();
});

test('Settings hides frozen Reflection/Insight/Review/Goal modules; Discover names systems honestly', async ({ page }) => {
  await registerAndOnboard(page, 'settings');

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  for (const label of ['Reflections', 'Insights', 'Reviews', 'Goals']) {
    await expect(page.getByRole('link', { name: label, exact: true })).toHaveCount(0);
  }

  // Frozen modules stay implemented and reachable by direct URL — unlisted, not deleted.
  await page.goto('/goals');
  await expect(page).not.toHaveURL(/\/login/);

  await page.goto('/discover');
  await expect(page.getByText('Bản Đồ Sao', { exact: true })).toBeVisible();
  await expect(page.getByText('Thần Số Học', { exact: true })).toBeVisible();
  await expect(page.getByText('Ngũ Hành Phương Đông', { exact: true })).toBeVisible();
  // No card is titled/branded "Tử Vi" — that name is reserved for the future, not-yet-built
  // module and must never appear as an active Discover card. The Eastern Horoscope card is
  // allowed (expected) to *mention* "Tử Vi" in its own disclaimer prose, precisely to state that
  // distinction explicitly — so assert the absence of a Tử Vi card, not the absence of the word.
  await expect(page.getByText('Tử Vi', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Tử Vi Lá Số', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/not vietnamese tử vi lá số/i)).toBeVisible();
});
