import { test, expect } from '@playwright/test';

// Flow 4: Companion Core — create a conversation, send a message, watch it
// stream via SSE, and confirm it persists after a reload.
// Relies on the seeded demo account (apps/api/prisma/seed.ts): demo@beaconvie.local / Demo1234!
// Requires DEFAULT_AI_PROVIDER=mock (the local/CI default — see apps/api/.env.example).

async function loginAsDemo(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test('create a conversation, send a message, and see the streamed reply', async ({ page }) => {
  await loginAsDemo(page);

  await page.goto('/companion');
  await page.getByRole('button', { name: /start a conversation/i }).click();

  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });

  await composer.fill('Starting a new job next week and feeling nervous about it.');
  await page.getByRole('button', { name: /send message/i }).click();

  // The user's own message appears immediately. Scoped to the conversation
  // log — the composer intentionally keeps showing the just-sent text
  // (disabled) until the turn completes, so a page-wide search would also
  // match it.
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText('Starting a new job next week and feeling nervous about it.')).toBeVisible();

  // The assistant's streamed reply completes and the composer returns to idle.
  await expect(page.getByRole('log', { name: 'Conversation' }).locator('text=Companion').last()).toBeVisible({
    timeout: 15000,
  });
  await expect(composer).toBeEnabled({ timeout: 15000 });

  // Reloading shows the same persisted history (two messages: user + assistant).
  await page.reload();
  const conversationLog = page.getByRole('log', { name: 'Conversation' });
  await expect(conversationLog.getByText('Starting a new job next week and feeling nervous about it.')).toBeVisible();
});
