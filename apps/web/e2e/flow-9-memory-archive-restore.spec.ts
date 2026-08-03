import { test, expect } from '@playwright/test';

// Flow 9: Memory Foundation — archive a memory (hidden from the default
// Timeline, still recoverable) and restore it.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!

async function loginAsDemo(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test('archiving a memory hides it from the default timeline; restoring brings it back', async ({ page }) => {
  await loginAsDemo(page);
  const phrase = `Training for a half marathon ${Date.now()}`;

  await page.goto('/companion');
  await page.getByRole('button', { name: /start a conversation/i }).click();
  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });
  await composer.fill(phrase);
  await page.getByRole('button', { name: /send message/i }).click();
  // Scoped to the conversation log — the composer intentionally keeps
  // showing the just-sent text (disabled) until the turn completes, so a
  // page-wide search would also match it.
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText(phrase)).toBeVisible();
  await page.getByRole('button', { name: /remember this/i }).first().click();
  await page.getByRole('button', { name: /^remember this$/i }).last().click();
  // Wait for the dialog to actually close — it does so only once the
  // propose+accept mutation settles. Navigating away any earlier would cancel
  // the in-flight request before the memory is actually created.
  await expect(page.getByRole('heading', { name: /remember this\?/i })).not.toBeVisible();

  await page.goto('/memory');
  await page.getByText(phrase).first().click();
  await expect(page.getByLabel('Memory detail')).toBeVisible();

  await page.getByRole('button', { name: /^archive$/i }).click();
  await expect(page.getByRole('button', { name: /restore/i })).toBeVisible();

  // Back on the timeline, it's gone from the default (non-archived) view.
  await page.getByRole('button', { name: /close/i }).click();
  await expect(page.getByText(phrase)).not.toBeVisible();

  // Restore it from the detail view again (re-open via the archived filter).
  await page.getByRole('button', { name: /show archived/i }).click();
  await page.getByText(phrase).first().click();
  await page.getByRole('button', { name: /restore/i }).click();
  await expect(page.getByRole('button', { name: /^archive$/i })).toBeVisible();
});
