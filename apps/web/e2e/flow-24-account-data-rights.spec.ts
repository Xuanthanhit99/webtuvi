import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

  // Accessibility + Product Polish (2026-08-19): tablet icon-rail nav (Sidebar) targeted axe scan.
  // Dashboard is already loaded at this point (registerAndOnboard's last assertion); resizing here
  // reuses that navigation rather than a second page load. Reset to the default viewport
  // immediately after so the rest of this flow's own assertions are unaffected.
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  const tabletNavScan = await new AxeBuilder({ page }).include('nav[aria-label="Main navigation"]').analyze();
  expect(tabletNavScan.violations, JSON.stringify(tabletNavScan.violations, null, 2)).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 10000 });

  // Accessibility + Product Polish (2026-08-19): Settings loading-state accessibility fix +
  // general page structure. `disable(['color-contrast'])`: axe's static contrast check
  // flags dynamic/gradient/image backgrounds it can't reliably resolve — this pass's actual
  // contrast work is independently verified with real computed ratios (see the final report),
  // not by relying on axe's contrast heuristic; every other rule stays enabled.
  const settingsScan = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(settingsScan.violations, JSON.stringify(settingsScan.violations, null, 2)).toEqual([]);

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

  // Accessibility + Product Polish (2026-08-19): Dialog id-collision fix (unique useId()
  // labelledby/describedby) — scanned with the dialog open and populated, its real stable state.
  const dialogScan = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(dialogScan.violations, JSON.stringify(dialogScan.violations, null, 2)).toEqual([]);

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
