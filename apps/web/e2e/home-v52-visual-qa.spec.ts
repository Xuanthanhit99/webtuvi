import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1536]) {
  test(`Home V5.2 authenticated visual QA at ${width}px`, async ({ page, context, baseURL }, testInfo) => {
    test.setTimeout(120_000);
    expect(new URL(baseURL!).hostname).toBe('localhost');
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const registered = await context.request.post('http://localhost:4000/auth/register', { data: { email: `home-v52-${width}-${Date.now()}@example.com`, displayName: 'Kiểm tra Mệnh Vi', password: 'AuditOnly!Strong2026', confirmPassword: 'AuditOnly!Strong2026', acceptedTerms: true } });
    expect(registered.status()).toBe(201);
    const cookies = await context.cookies('http://localhost:4000');
    const csrf = cookies.find((cookie) => cookie.name === 'beaconvie_csrf_token')!.value;
    expect((await context.request.post('http://localhost:4000/onboarding/skip', { headers: { 'X-CSRF-Token': csrf } })).ok()).toBe(true);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const consent = page.getByRole('button', { name: /^Đồng ý/i });
    if (await consent.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await consent.click({ force: true, timeout: 5_000 });
      await expect(consent).toBeHidden({ timeout: 5_000 });
    }
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByRole('heading', { level: 1, name: /điều gì đang ở trong tâm trí bạn/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dòng chảy hôm nay' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tiếp tục hành trình' })).toBeVisible();
    for (const label of ['Tình yêu', 'Công việc', 'Bản thân', 'Quyết định', 'Tương lai']) {
      const button = page.getByRole('button', { name: new RegExp(label, 'i') });
      await expect(button).toBeVisible();
      expect((await button.boundingBox())?.height ?? 0, `${label} touch target`).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: /Công việc/i }).click();
    await expect(page.getByRole('link', { name: /Xem vận trình/i }).filter({ hasText: 'Xem vận trình' })).toHaveAttribute('href', '/discover/tu-vi');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`home-v52-${width}.png`),
      fullPage: true,
      // Playwright tiles a full-page capture while fixed elements remain viewport-fixed, which
      // makes the phone nav appear over a middle section in the stitched evidence. Production
      // behavior is verified above; neutralize only that fixed positioning for the visual artifact.
      style: width === 390 ? 'nav[aria-label="Điều hướng chính"] { position: absolute !important; }' : undefined,
    });
  });
}
