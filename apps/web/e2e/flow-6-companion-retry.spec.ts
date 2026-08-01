import { test, expect } from '@playwright/test';

// Flow 6: Companion Core — retry after a failed stream.
// Forces the first stream attempt to fail via network interception (simulating
// "all providers unavailable"), then removes the interception so Retry hits
// the real server (mock provider) and succeeds.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!

test('retry after a stream failure succeeds against the real server', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  await page.goto('/companion');
  await page.getByRole('button', { name: /start a conversation/i }).click();

  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });

  await page.route('**/messages/stream*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'event: stream_error\ndata: {"message":"All AI providers are currently unavailable. Please try again shortly."}\n\n',
    });
  });

  await composer.fill('Hello there');
  await page.getByRole('button', { name: /send message/i }).click();

  await expect(page.getByText(/all ai providers are currently unavailable/i)).toBeVisible({ timeout: 10000 });
  const retryButton = page.getByRole('button', { name: /retry/i });
  await expect(retryButton).toBeVisible();

  // Remove the interception so the retried request reaches the real server.
  await page.unroute('**/messages/stream*');
  await retryButton.click();

  await expect(composer).toBeEnabled({ timeout: 15000 });
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText('Companion').last()).toBeVisible();
});
