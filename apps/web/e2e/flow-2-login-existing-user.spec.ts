import { test, expect } from '@playwright/test';

// Flow 2: Login existing user -> Dashboard
// Relies on the seeded demo account (apps/api/prisma/seed.ts): demo@beaconvie.local / Demo1234!

test('login existing user -> dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Demo');
});
