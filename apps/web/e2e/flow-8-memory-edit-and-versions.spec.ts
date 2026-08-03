import { test, expect } from '@playwright/test';

// Flow 8: Memory Foundation — rename a memory and confirm the version
// history reflects the change (content itself is never directly editable —
// only the title, per the Product Bible's "delete, don't rewrite" rule).
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!

async function loginAsDemo(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function rememberSomething(page: import('@playwright/test').Page, phrase: string) {
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
}

test('renaming a memory updates its title and adds a version history entry', async ({ page }) => {
  await loginAsDemo(page);
  const phrase = `Learning to paint watercolors ${Date.now()}`;
  await rememberSomething(page, phrase);

  await page.goto('/memory');
  await page.getByText(phrase).first().click();
  await expect(page.getByLabel('Memory detail')).toBeVisible();

  await page.getByRole('button', { name: /rename memory/i }).click();
  const titleInput = page.getByLabel('Memory title');
  await titleInput.fill('Watercolor painting hobby');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByText('Watercolor painting hobby')).toBeVisible();

  await page.getByRole('button', { name: /show version history/i }).click();
  await expect(page.getByText(/v2/)).toBeVisible();
});
