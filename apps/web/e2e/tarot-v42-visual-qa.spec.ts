import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1536]) {
  test(`Tarot V4.2 visual QA at ${width}px`, async ({ page, context, baseURL }, testInfo) => {
    test.setTimeout(90_000);
    expect(new URL(baseURL!).hostname).toBe('localhost');
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const qaPassword = ['AuditOnly', 'Strong2026'].join('!');
    const registered = await context.request.post('http://localhost:4000/auth/register', {
      data: {
        email: `tarot-v42-${width}-${Date.now()}@example.com`,
        displayName: 'Tarot V4.2 Visual QA',
        password: qaPassword,
        confirmPassword: qaPassword,
        acceptedTerms: true,
      },
    });
    expect(registered.status()).toBe(201);
    const cookies = await context.cookies('http://localhost:4000');
    const csrf = cookies.find((cookie) => cookie.name === 'beaconvie_csrf_token')?.value;
    expect(csrf).toBeTruthy();
    expect((await context.request.post('http://localhost:4000/onboarding/skip', {
      headers: { 'X-CSRF-Token': csrf! },
    })).ok()).toBe(true);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/discover/tarot', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByRole('heading', { level: 1, name: 'Tarot' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Điều gì bạn muốn soi chiếu?' })).toBeVisible();
    for (const label of ['Tổng quan', 'Tình cảm', 'Sự nghiệp', 'Tài chính', 'Bản thân', 'Quyết định']) {
      const intent = page.getByRole('button', { name: new RegExp(`^${label}`) });
      await expect(intent).toBeVisible();
      expect((await intent.boundingBox())?.height ?? 0, `${label} touch target`).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByLabel('Câu hỏi của bạn (không bắt buộc)')).toBeVisible();
    await page.getByLabel('Câu hỏi của bạn (không bắt buộc)').fill('Điều gì tôi cần nhìn rõ lúc này?');

    await page.getByRole('button', { name: 'Tiếp tục chọn trải bài' }).click();
    await expect(page.getByRole('heading', { name: 'Chọn kiểu trải bài' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Lá bài hôm nay/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Một lá soi chiếu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ba lá theo dòng thời gian/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tập trung và xáo bài' })).toBeVisible();
    const cardBacks = page.locator('img[src*="/assets/tarot/card-back.webp"]');
    expect(await cardBacks.count(), 'spread uses the production Tarot card back').toBeGreaterThanOrEqual(3);

    await page.getByRole('button', { name: 'Quay lại' }).click();
    await expect(page.getByRole('heading', { name: 'Điều gì bạn muốn soi chiếu?' })).toBeVisible();
    await expect(page.getByLabel('Câu hỏi của bạn (không bắt buộc)')).toHaveValue('Điều gì tôi cần nhìn rõ lúc này?');

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) {
      const nav = page.locator('nav[aria-label="Điều hướng chính"].fixed');
      await expect(nav).toBeVisible();
      const navBox = await nav.boundingBox();
      expect(navBox).not.toBeNull();
      expect(Math.abs((navBox!.y + navBox!.height) - 900), 'production nav stays pinned to viewport bottom').toBeLessThanOrEqual(2);
      const main = page.locator('#main-content');
      const paddingBottom = await main.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom));
      expect(paddingBottom, 'AppShell reserves bottom-nav clearance').toBeGreaterThanOrEqual(navBox!.height + 39);
    }
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);

    await page.screenshot({
      path: testInfo.outputPath(`tarot-v42-${width}.png`),
      fullPage: true,
      style: width === 390 ? 'nav[aria-label="Điều hướng chính"] { position: absolute !important; }' : undefined,
    });
  });
}
