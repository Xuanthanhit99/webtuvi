import { test, expect } from '@playwright/test';

// Flow 11: Memory Foundation — disabling memory entirely blocks accepting a
// new candidate. Runs last among the memory flows (highest flow number) and
// restores the setting at the end so it doesn't affect any other test run
// against the same seeded demo account.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!

async function loginAsDemo(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test('disabling memory blocks accepting a new candidate; re-enabling restores it', async ({ page }) => {
  await loginAsDemo(page);

  await page.goto('/memory');
  await page.getByRole('button', { name: 'Memory settings' }).click();
  await page.getByLabel(/when beaconvie could remember something/i).selectOption('DISABLED');
  await expect(page.getByText(/memory setting updated/i)).toBeVisible();

  const phrase = `A note that should not be remembered ${Date.now()}`;
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
  await expect(page.getByText(/waiting in settings/i)).toBeVisible();

  // It shows up as pending, not accepted. Scope to this candidate's own list
  // item — the card renders the phrase twice (title + description), and a
  // demo account accumulating multiple pending candidates over time would
  // otherwise make both the phrase and the "blocked" badge ambiguous page-wide.
  await page.goto('/memory');
  await page.getByRole('button', { name: 'Pending' }).click();
  const candidateItem = page.getByRole('listitem').filter({ hasText: phrase });
  await expect(candidateItem).toBeVisible();
  await expect(candidateItem.getByText(/blocked by your memory settings/i)).toBeVisible();

  // Restore the setting so this run doesn't affect any later test.
  await page.getByRole('button', { name: 'Memory settings' }).click();
  await page.getByLabel(/when beaconvie could remember something/i).selectOption('ASK_EVERY_TIME');
});
