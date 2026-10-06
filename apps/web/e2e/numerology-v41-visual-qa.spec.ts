import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ timeout: 180_000 });

async function registerAndSkipOnboarding(page: Page, width: number): Promise<void> {
  const registered = await page.context().request.post('http://localhost:4000/auth/register', {
    data: {
      email: `numerology-v41-visual-${width}-${Date.now()}@example.com`,
      displayName: 'Numerology V4.1 Visual QA',
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
  test(`Thần số học V4.1 entry and result at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await registerAndSkipOnboarding(page, width);

    await page.addInitScript(() => window.localStorage.setItem('menhvi_google_consent_v1', 'granted'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Menu tài khoản' })).toBeVisible({ timeout: 15_000 });

    await page.goto('/discover/numerology', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Những con số kể câu chuyện riêng của bạn' })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#numerology-name')).toBeVisible();
    await expect(page.locator('#numerology-name')).toBeEditable();
    await expect(page.locator('#numerology-birthdate')).toBeEditable();
    await expect(page.getByText('Đang tải kết quả của bạn...')).toBeHidden({ timeout: 15_000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`numerology-v41-entry-${width}.png`), fullPage: true });

    await page.locator('#numerology-name').fill('Nguyen Van A');
    await page.locator('#numerology-birthdate').fill('1995-08-17');
    await page.getByRole('button', { name: /khám phá hồ sơ số học/i }).click();

    await expect(page.getByRole('heading', { name: 'Đường đời 22' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Nhân cách', { exact: true })).toBeVisible();
    await expect(page.getByText('Năm cá nhân', { exact: true })).toBeVisible();

    const lifePath = page.locator('[data-numerology-value="LIFE_PATH"]');
    await lifePath.getByRole('button', { name: /vì sao là số 22/i }).click();
    await expect(lifePath.getByText(/Tổng: 8 \+ 8 \+ 6 = 22/)).toBeVisible();

    const personalYear = page.locator('[data-numerology-value="PERSONAL_YEAR"]');
    await personalYear.getByRole('button', { name: /vì sao là số/i }).click();
    await expect(personalYear.locator('ol')).toBeVisible();

    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`numerology-v41-result-${width}.png`), fullPage: true });
  });
}
