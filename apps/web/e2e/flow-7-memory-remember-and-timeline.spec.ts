import { test, expect } from '@playwright/test';

// Flow 7: Memory Foundation — open Memory (empty state), remember something
// from a real Companion conversation, and see it appear in the Timeline and
// its Detail view.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!
// Requires DEFAULT_AI_PROVIDER=mock (the local/CI default).

async function loginAsDemo(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test('remember something from a conversation and see it in the Memory timeline', async ({ page }) => {
  await loginAsDemo(page);

  // A brand-new conversation has nothing to remember yet from it, but the
  // Memory page itself may already have entries from other flows in this
  // suite — this flow only asserts that a *newly remembered* item shows up,
  // not that the timeline starts empty.
  await page.goto('/companion');
  await page.getByRole('button', { name: /start a conversation/i }).click();
  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });

  const uniquePhrase = `Starting a brand new job at Acme ${Date.now()}`;
  await composer.fill(uniquePhrase);
  await page.getByRole('button', { name: /send message/i }).click();
  // Scoped to the conversation log — the composer intentionally keeps
  // showing the just-sent text (disabled) until the turn completes, so a
  // page-wide search would also match it.
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText(uniquePhrase)).toBeVisible();

  // Remember this exact message.
  await page.getByRole('button', { name: /remember this/i }).first().click();
  await expect(page.getByRole('heading', { name: /remember this\?/i })).toBeVisible();
  await page.getByRole('button', { name: /^remember this$/i }).last().click();
  // Wait for the dialog to actually close — it does so only once the
  // propose+accept mutation settles. Navigating away any earlier would cancel
  // the in-flight request before the memory is actually created.
  await expect(page.getByRole('heading', { name: /remember this\?/i })).not.toBeVisible();

  // Now go to Memory and confirm it shows up in the Timeline. Title defaults
  // to the same text as the summary, so the card renders the phrase twice.
  await page.goto('/memory');
  await expect(page.getByText(uniquePhrase).first()).toBeVisible({ timeout: 10000 });

  // Open its detail view.
  await page.getByText(uniquePhrase).first().click();
  await expect(page.getByLabel('Memory detail')).toBeVisible();
  await expect(page.getByText(uniquePhrase).first()).toBeVisible();
});
