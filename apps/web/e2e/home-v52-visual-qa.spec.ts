import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function expectConsentBannerHidden(page: import('@playwright/test').Page): Promise<void> {
  expect(await page.evaluate(() => window.localStorage.getItem('menhvi_google_consent_v1'))).toBe('granted');
  await expect(page.getByRole('complementary', { name: 'Quyền riêng tư và đo lường' })).toBeHidden({ timeout: 15_000 });
}

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
    await page.addInitScript(() => window.localStorage.setItem('menhvi_google_consent_v1', 'granted'));
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1, name: /Khám phá bản thân,.*hiểu rõ hành trình của bạn/i })).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => window.localStorage.getItem('menhvi_google_consent_v1'))).toBe('granted');
    await expect(page.getByRole('complementary', { name: 'Quyền riêng tư và đo lường' })).toBeHidden();
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByRole('heading', { level: 1, name: /Khám phá bản thân,.*hiểu rõ hành trình của bạn/i })).toBeVisible();
    await expect(page.getByText('Dòng chảy hôm nay', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Điều đang diễn ra với bạn' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Hành trình khám phá' })).toBeVisible();

    const systemRoutes = [
      { name: /Tử Vi Đẩu Số/i, href: '/discover/tu-vi' },
      { name: /Tarot/i, href: '/discover/tarot' },
      { name: /Bản đồ sao/i, href: '/discover/natal-chart' },
      { name: /Thần số học/i, href: '/discover/numerology' },
    ];
    for (const system of systemRoutes) {
      const links = page.getByRole('link', { name: system.name });
      await expect(links.first()).toBeVisible();
      const hrefs = await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')));
      expect(hrefs).toContain(system.href);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
    await expectConsentBannerHidden(page);
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
