import { expect, test } from '@playwright/test';

const pages = [
  { path: '/kien-thuc/tu-vi/cung/menh', heading: 'Cung Mệnh trong Tử Vi', type: 'palace' },
  { path: '/kien-thuc/tu-vi/cung/tat-ach', heading: 'Cung Tật Ách trong Tử Vi', type: 'palace' },
  { path: '/kien-thuc/tu-vi/sao/tu-vi', heading: 'Sao Tử Vi trong Tử Vi', type: 'star' },
  { path: '/kien-thuc/tu-vi/sao/hoa-tinh', heading: 'Sao Hỏa Tinh trong Tử Vi', type: 'star' },
] as const;

for (const width of [390, 1440] as const) {
  test.describe(`Tử Vi SEO render QA ${width}px`, () => {
    test.use({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });

    for (const page of pages) {
      test(`${page.path} renders canonical structured content without overflow`, async ({ page: browserPage }) => {
        await browserPage.goto(page.path);
        await expect(browserPage.getByRole('heading', { level: 1, name: page.heading })).toBeVisible();
        await expect(browserPage.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(page.path.replaceAll('/', '\\/') + '$'));
        await expect(browserPage.locator('meta[name="robots"]')).toHaveAttribute('content', /index/i);

        const jsonLd = await browserPage.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
          nodes.map((node) => JSON.parse(node.textContent ?? '{}')),
        );
        expect(jsonLd.some((item) => item['@type'] === 'Article' && item.mainEntityOfPage?.endsWith(page.path))).toBe(true);
        expect(jsonLd.some((item) => item['@type'] === 'BreadcrumbList' && item.itemListElement?.length === 3)).toBe(true);

        const overflow = await browserPage.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        await expect(browserPage.getByRole('link', { name: 'Lập lá số Tử Vi' })).toHaveAttribute('href', '/discover/tu-vi');

        if (width === 390) {
          await browserPage.screenshot({ path: `tu-vi-seo-${page.type}-mobile-390.png`, fullPage: true });
        }
      });
    }
  });
}
