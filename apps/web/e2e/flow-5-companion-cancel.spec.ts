import { test, expect } from '@playwright/test';

// Flow 5: Companion Core — cancel an in-flight streamed reply.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!

test('cancel a streaming reply mid-generation', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  await page.goto('/companion');
  await page.getByRole('button', { name: /start a conversation/i }).click();

  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });
  await composer.fill('Tell me about your day.');
  await page.getByRole('button', { name: /send message/i }).click();

  // The mock provider streams word-by-word with a short delay per word, so
  // there's a real window to click Cancel mid-stream.
  const cancelButton = page.getByRole('button', { name: /cancel/i });
  await expect(cancelButton).toBeVisible({ timeout: 5000 });
  await cancelButton.click();

  await expect(page.getByText(/you cancelled that reply/i)).toBeVisible();

  // The composer is usable again immediately — no dangling "streaming" state.
  await expect(composer).toBeEnabled();

  // The cancelled turn is persisted (not silently dropped) so the next
  // message starts from a clean, coherent state rather than a stuck pending reply.
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await composer.fill('Are you still there?');
  await page.getByRole('button', { name: /send message/i }).click();
  // Scoped to the conversation log — the composer intentionally keeps
  // showing the just-sent text (disabled) until the turn completes, so a
  // page-wide search would also match it.
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText('Are you still there?')).toBeVisible();
});
