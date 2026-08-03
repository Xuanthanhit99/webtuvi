import { test, expect } from '@playwright/test';

// Flow 10: Memory Foundation — delete a memory and confirm it can no longer
// be retrieved anywhere in the product.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!

async function loginAsDemo(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test('deleting a memory removes it permanently, everywhere', async ({ page }) => {
  await loginAsDemo(page);
  const phrase = `A weekend trip to the coast ${Date.now()}`;

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

  await page.getByRole('button', { name: /^delete$/i }).click();
  await expect(page.getByText(/permanently deletes it/i)).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: /^delete$/i }).click();

  // Wait for the confirmation toast — it fires once the delete mutation
  // succeeds, before the client-side navigation back to the timeline
  // necessarily finishes.
  await expect(page.getByText(/memory permanently deleted/i)).toBeVisible();
  // The toast can briefly precede the detail view's own unmount (router
  // navigation is asynchronous) — wait for it to actually close before
  // checking the phrase is gone, or a stale "Memory detail" region can still
  // resolve the same text for a moment.
  await expect(page.getByLabel('Memory detail')).not.toBeVisible();

  // Back to the timeline — gone.
  await expect(page.getByText(phrase)).not.toBeVisible();

  // A reload/refetch confirms it's genuinely gone, not just optimistically hidden.
  await page.reload();
  await expect(page.getByText(phrase)).not.toBeVisible();
});
