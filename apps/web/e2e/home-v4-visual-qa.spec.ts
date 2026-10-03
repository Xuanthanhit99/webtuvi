import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1536]) {
  test(`Home V4.1 authenticated visual QA at ${width}px`, async ({ page, context, baseURL }, testInfo) => {
    test.setTimeout(120_000);
    expect(new URL(baseURL!).hostname).toBe('localhost');
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const registered = await context.request.post('http://localhost:4000/auth/register', {
      data: {
        email: `home-v4-visual-${width}-${Date.now()}@example.com`,
        displayName: 'Kiểm tra Mệnh Vi',
        password: 'AuditOnly!Strong2026',
        confirmPassword: 'AuditOnly!Strong2026',
        acceptedTerms: true,
      },
    });
    expect(registered.status()).toBe(201);
    const cookies = await context.cookies('http://localhost:4000');
    const csrf = cookies.find((cookie) => cookie.name === 'beaconvie_csrf_token')!.value;
    const onboarded = await context.request.post('http://localhost:4000/onboarding/skip', {
      headers: { 'X-CSRF-Token': csrf },
    });
    expect(onboarded.ok()).toBe(true);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByRole('heading', { name: 'Điều gì đang khiến bạn bận lòng?' })).toBeVisible();
    const intents = page.getByRole('button').filter({ has: page.locator('[aria-hidden="true"]') });
    for (const label of ['Tình yêu', 'Công việc', 'Một quyết định', 'Tương lai', 'Hiểu bản thân', 'Chỉ muốn xem hôm nay']) {
      const button = page.getByRole('button', { name: new RegExp(label, 'i') });
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box?.height ?? 0, `${label} touch target`).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole('button', { name: /Tình yêu/i })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: /Hiểu bản thân/i }).click();
    await expect(page.getByRole('button', { name: /Hiểu bản thân/i })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('link', { name: 'Dựng Bản đồ sao' })).toHaveAttribute('href', '/discover/natal-chart');

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);

    await page.screenshot({
      path: testInfo.outputPath(`home-v4-${width}.png`),
      fullPage: true,
    });
  });
}
