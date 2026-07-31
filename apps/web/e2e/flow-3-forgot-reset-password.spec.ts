import { test, expect, request } from '@playwright/test';

const MAILPIT_URL = 'http://localhost:8025';

interface MailpitMessageSummary {
  ID: string;
  Subject: string;
  Created: string;
  To: { Address: string }[];
}

async function getLatestResetToken(email: string): Promise<string> {
  const api = await request.newContext();
  const listRes = await api.get(`${MAILPIT_URL}/api/v1/messages`);
  const list = (await listRes.json()) as { messages: MailpitMessageSummary[] };
  const resetMessage = list.messages
    .filter(
      (m) =>
        m.Subject.includes('Reset your BeaconVie password') &&
        m.To.some((recipient) => recipient.Address === email),
    )
    .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime())[0];
  if (!resetMessage) throw new Error(`No password reset email found in Mailpit for ${email}`);

  const msgRes = await api.get(`${MAILPIT_URL}/api/v1/message/${resetMessage.ID}`);
  const msg = (await msgRes.json()) as { Text: string };
  const match = msg.Text.match(/token=([a-f0-9]+)/);
  if (!match?.[1]) throw new Error('No reset token found in email body');
  return match[1];
}

// Flow 3: Forgot password -> Reset password -> Login
// Uses the seeded demo account and reads the reset link from Mailpit (dev mail adapter).

test('forgot password -> reset password -> login', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();

  const token = await getLatestResetToken('demo@beaconvie.local');

  await page.goto(`/reset-password?token=${token}`);
  await page.getByLabel('New password', { exact: true }).fill('Demo1234!New');
  await page.getByLabel('Confirm new password').fill('Demo1234!New');
  await page.getByRole('button', { name: 'Reset password' }).click();

  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!New');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  // Log out first: the access-token cookie is still valid for a few more minutes
  // even though reset-password already revoked the refresh session server-side,
  // so middleware would otherwise keep bouncing an authenticated visit to
  // /login straight back to /dashboard during the restore step below.
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

  // Restore the original password so the seeded account stays usable for reruns.
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();
  const restoreToken = await getLatestResetToken('demo@beaconvie.local');
  await page.goto(`/reset-password?token=${restoreToken}`);
  await page.getByLabel('New password', { exact: true }).fill('Demo1234!');
  await page.getByLabel('Confirm new password').fill('Demo1234!');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});
