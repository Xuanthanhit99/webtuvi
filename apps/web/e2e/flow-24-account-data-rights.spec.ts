import { test, expect, type Page } from '@playwright/test';

// Flow 24: Account Data Rights (Sprint 10 — Launch Hardening). Verifies the real "Export my
// data" / "Delete my account" controls in Settings against real production builds: a fresh,
// isolated user (never a shared demo account, since this test is genuinely destructive),
// downloading a real export, then deleting the account and confirming the session truly ends —
// not just a UI state change. Does not touch real Gemini (mock provider only).

test.describe.configure({ timeout: 180_000 });

async function registerAndOnboard(page: Page, email: string): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow TwentyFour');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Just checking things out today.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Mostly just being patient with myself.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('Settings -> export my data -> delete my account -> session truly ends -> protected pages inaccessible', async ({ page }) => {
  const email = `flow24-data-rights-${Date.now()}@example.com`;
  await registerAndOnboard(page, email);

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });

  // --- Export ---
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export my data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^beaconvie-account-export-\d{4}-\d{2}-\d{2}\.json$/);

  // --- Delete: opening the dialog shows a real, destructive confirmation, not a bare confirm ---
  await page.getByRole('button', { name: 'Delete account' }).click();
  await expect(page.getByRole('heading', { name: /delete your account/i })).toBeVisible();
  const confirmButton = page.getByRole('button', { name: /permanently delete my account/i });
  await expect(confirmButton).toBeDisabled();

  // Wrong password is rejected, account remains usable.
  await page.getByLabel(/confirm your password/i).fill('WrongPassword1!');
  await confirmButton.click();
  await expect(page.getByText(/password doesn.t match/i)).toBeVisible({ timeout: 10000 });

  // Correct password actually deletes.
  await page.getByLabel(/confirm your password/i).fill('Sup3r$ecretPass');
  await confirmButton.click();

  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

  // The session truly ended — a protected page redirects to login, not just the one that
  // triggered the deletion, and the original credentials no longer work.
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);

  // The original email was scrubbed on deletion (docs/architecture/account-data-rights.md §1) —
  // it no longer matches any account at all, not merely a wrong password.
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText(/can.t find an account/i)).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\/login/);
});
