import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [390, 1536]) {
  test(`Discover V4.1 visual QA at ${width}px`, async ({ page, baseURL }, testInfo) => {
    test.setTimeout(90_000);
    expect(new URL(baseURL!).hostname).toBe('localhost');
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/discover', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    await expect(page.getByRole('heading', { level: 1, name: 'Điều gì đang khiến bạn bận lòng?' })).toBeVisible();
    for (const label of ['Tình yêu', 'Công việc', 'Bản thân', 'Quyết định', 'Tương lai']) {
      const button = page.getByRole('button', { name: label });
      await expect(button).toBeVisible();
      expect((await button.boundingBox())?.height ?? 0, `${label} touch target`).toBeGreaterThanOrEqual(44);
    }

    await expect(page.getByText('Mệnh Vi gợi ý bắt đầu từ')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tarot' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bắt đầu với Tarot/i })).toHaveAttribute('href', '/discover/tarot');
    await expect(page.getByText('Bạn cũng có thể thử')).toBeVisible();
    await expect(page.getByText('Vì sao gợi ý này phù hợp?')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ngũ Hành Phương Đông' })).toBeVisible();

    await page.getByRole('button', { name: 'Công việc' }).click();
    await expect(page.getByRole('heading', { name: 'Tử Vi Lá Số' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bắt đầu với Tử Vi Lá Số/i })).toHaveAttribute('href', '/discover/tu-vi');
    await page.getByRole('button', { name: 'Tình yêu' }).click();
    await expect(page.getByRole('heading', { name: 'Tarot' })).toBeVisible();

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
      path: testInfo.outputPath(`discover-v41-${width}.png`),
      fullPage: true,
      // Full-page capture stitches viewport tiles while fixed elements stay fixed. Production
      // positioning and AppShell clearance are asserted above; neutralize only the nav's fixed
      // positioning in the evidence so the mobile artifact cannot show a false mid-page overlay.
      style: width === 390 ? 'nav[aria-label="Điều hướng chính"] { position: absolute !important; }' : undefined,
    });
  });
}
