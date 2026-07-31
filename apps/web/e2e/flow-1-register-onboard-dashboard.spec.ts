import { test, expect } from '@playwright/test';

// Flow 1: Landing -> Register -> Onboarding -> Dashboard -> Logout

test('landing -> register -> onboarding -> dashboard -> logout', async ({ page }) => {
  const email = `flow1-${Date.now()}@example.com`;

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('remembers you');

  await page.getByRole('link', { name: 'Meet your Companion' }).first().click();
  await expect(page).toHaveURL(/\/register/);

  await page.getByLabel('Display name').fill('Flow One');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  await expect(page.getByText(/glad you're here/i)).toBeVisible();

  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Starting a new job next week and feeling nervous about it.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Probably just whether I will be good enough at it.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Flow One');

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login/);
});
