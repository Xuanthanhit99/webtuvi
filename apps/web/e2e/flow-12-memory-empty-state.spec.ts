import { test, expect } from '@playwright/test';

// Flow 12: Memory Foundation — a brand-new user (registered fresh in this
// test, not the shared seeded demo account) sees an honest empty state on
// /memory. Onboarding's own Reflection step writes to the legacy MemoryNote
// table only, so a freshly onboarded user's Sprint 3A Memory timeline is
// genuinely, verifiably empty — no fabricated "starter" memories.

test('a brand-new user sees an honest empty state on the Memory page', async ({ page }) => {
  const email = `flow12-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow Twelve');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Just getting started here.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Not sure yet.');
  await page.getByRole('button', { name: 'Send' }).click();

  // The Reflection step's explicit memory-consent prompt comes first —
  // decline it, so this user's Memory timeline stays genuinely empty.
  await expect(page.getByRole('button', { name: 'Not yet' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Not yet' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();
  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto('/memory');
  await expect(page.getByText('No memories yet.')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/when you ask beaconvie to remember something/i)).toBeVisible();
});
