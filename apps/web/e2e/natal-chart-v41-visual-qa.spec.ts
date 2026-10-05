import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });

async function registerAndSkipOnboarding(page: Page, width: number): Promise<void> {
  const registered = await page.context().request.post('http://localhost:4000/auth/register', {
    data: {
      email: `natal-v41-visual-${width}-${Date.now()}@example.com`,
      displayName: 'Natal V4.1 Visual QA',
      password: 'AuditOnly!Strong2026',
      confirmPassword: 'AuditOnly!Strong2026',
      acceptedTerms: true,
    },
  });
  expect(registered.status()).toBe(201);
  const cookies = await page.context().cookies('http://localhost:4000');
  const csrf = cookies.find((cookie) => cookie.name === 'beaconvie_csrf_token')?.value;
  expect(csrf).toBeTruthy();
  const onboarded = await page.context().request.post('http://localhost:4000/onboarding/skip', {
    headers: { 'X-CSRF-Token': csrf! },
  });
  expect(onboarded.ok()).toBe(true);
}

for (const width of [390, 1536]) {
  test(`Bản đồ sao V4.1 result state at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await registerAndSkipOnboarding(page, width);

    // Bootstrap the authenticated web session before entering the tool directly. This mirrors
    // production-readiness: prove the browser sees the API-issued auth cookies, then wait for
    // the actual Natal form rather than letting locator.fill() absorb the whole test timeout.
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Menu tài khoản' })).toBeVisible({ timeout: 15_000 });

    await page.goto('/discover/natal-chart', { waitUntil: 'domcontentloaded' });
    const dateOfBirth = page.locator('#natal-chart-birthdate');
    await expect(dateOfBirth).toBeVisible({ timeout: 15_000 });
    await expect(dateOfBirth).toBeEditable();
    await dateOfBirth.fill('2000-06-15');
    await page.locator('#natal-chart-birthtime').fill('14:30');
    await page.locator('#natal-chart-place').fill('Ha Noi');
    await page.getByRole('button', { name: 'Tìm kiếm' }).click();

    const candidates = page.locator('ul[aria-label="Địa điểm phù hợp"] button');
    await expect(candidates.first()).toBeVisible({ timeout: 15_000 });
    await candidates.first().click();
    await expect(page.getByRole('button', { name: 'Đổi' })).toBeVisible();

    await page.getByRole('button', { name: 'Lập bản đồ sao' }).click();

    const bigThree = page.getByRole('group', { name: 'Big Three' });
    await expect(bigThree).toBeVisible({ timeout: 15_000 });
    await expect(bigThree.getByText('Song Tử', { exact: true })).toBeVisible();
    await expect(bigThree.getByText('Nhân Mã', { exact: true })).toBeVisible();
    await expect(bigThree.getByText('Thiên Bình', { exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: /natal chart wheel/i })).toBeVisible();
    await expect(page.locator('#natal-chart-section-planets')).toBeVisible();

    await page.getByRole('button', { name: 'Major Aspects' }).click();
    await expect(page.locator('#natal-chart-section-major-aspects').getByRole('listitem').first()).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`natal-chart-v41-result-${width}.png`),
      fullPage: true,
    });
  });
}
