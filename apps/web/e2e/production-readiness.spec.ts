import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const publicRoutes = ['/', '/discover', '/discover/tu-vi', '/discover/tarot', '/discover/natal-chart', '/discover/numerology', '/discover/eastern-horoscope'];
const supportingRoutes = ['/about', '/contact', '/privacy', '/terms'];
const indexableRoutes = [...publicRoutes, ...supportingRoutes];
const origin = 'https://tuvitarot.vn';
test.describe.configure({ timeout: 90_000 });

test('crawler receives complete public HTML, unique metadata, canonical URLs and valid schema without JavaScript', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000' });
  const page = await context.newPage();
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const route of indexableRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main')).toHaveCount(1);
    expect((await page.locator('main').innerText()).length).toBeGreaterThan(supportingRoutes.includes(route) ? 100 : 300);
    const title = await page.title();
    expect(titles.has(title)).toBe(false);
    titles.add(title);
    const description = (await page.locator('meta[name="description"]').getAttribute('content'))!;
    expect(descriptions.has(description)).toBe(false);
    descriptions.add(description);
    expect(new URL((await page.locator('link[rel="canonical"]').getAttribute('href'))!).href).toBe(new URL(origin + route).href);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'vi_VN');
    for (const json of await page.locator('script[type="application/ld+json"]').allTextContents()) {
      const schema = JSON.parse(json);
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema.url).toMatch(/^https:\/\/tuvitarot\.vn/);
    }
    expect((await page.locator('a[href="/discover"]').count())).toBeGreaterThan(0);
  }
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(robots).not.toContain('Disallow: /discover');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect((sitemap.match(/<loc>/g) ?? []).length).toBe(indexableRoutes.length);
  for (const route of indexableRoutes) expect(sitemap).toContain(`<loc>${route === '/' ? origin : origin + route}</loc>`);
  for (const privatePath of ['/login', '/register', '/settings', '/reports', '/premium']) expect(sitemap).not.toContain(`<loc>${origin}${privatePath}</loc>`);
  expect(sitemap).not.toContain('<lastmod>');
  await context.close();
});

test('private URLs remain protected, aliases redirect permanently and missing routes return 404', async ({ request }) => {
  for (const route of ['/settings', '/reports', '/premium', '/discover/tarot?item=invalid', '/discover/tarot?item=']) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain('/login?next=');
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  }
  for (const [alias, target] of Object.entries({ '/tarot': '/discover/tarot', '/tu-vi': '/discover/tu-vi', '/ban-do-sao': '/discover/natal-chart', '/than-so-hoc': '/discover/numerology' })) {
    const response = await request.get(alias, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(target);
  }
  for (const route of ['/no-such-production-audit-page', '/discover/does-not-exist', '/menh-vi', '/menh-vi/la-so', '/menh-vi/tarot']) expect((await request.get(route)).status()).toBe(404);
});

test('query state canonicalizes to the landing and auth pages expose noindex', async ({ page }) => {
  await page.goto('/discover/tarot?utm_source=audit');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${origin}/discover/tarot`);
  for (const route of ['/login', '/register']) {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  }
});

for (const width of [390, 1440]) {
  for (const route of indexableRoutes) {
    test(`public UX ${route} at ${width}px remains usable during API failure`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      // Deliberate dependency outage: this test does not claim authenticated backend coverage.
      await page.route('http://localhost:4000/**', (request) => request.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'UNAVAILABLE', message: 'Audit outage' } }) }));
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(accessibility.violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true });
      expect(errors).toEqual([]);
      await page.keyboard.press('Tab');
      await expect(page.locator('.skip-link')).toBeFocused();
    });
  }
}


for (const width of [390, 1440]) {
  test(`authenticated tools remain usable at ${width}px`, async ({ page, context, baseURL }, testInfo) => {
    test.setTimeout(180_000); // Seven authenticated routes, accessibility scans and a saved-result error flow.
    expect(new URL(baseURL!).hostname).toBe('localhost');
    await page.setViewportSize({ width, height: 900 });
    const registered = await context.request.post('http://localhost:4000/auth/register', {
      data: { email: `seo-audit-${width}-${Date.now()}@example.com`, displayName: 'Kiểm tra Mệnh Vi', password: 'AuditOnly!Strong2026', confirmPassword: 'AuditOnly!Strong2026', acceptedTerms: true },
    });
    expect(registered.status()).toBe(201);
    const cookies = await context.cookies('http://localhost:4000');
    const csrf = cookies.find((cookie) => cookie.name === 'beaconvie_csrf_token')!.value;
    const onboarded = await context.request.post('http://localhost:4000/onboarding/skip', { headers: { 'X-CSRF-Token': csrf } });
    expect(onboarded.ok()).toBe(true);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(page.getByRole('button', { name: 'Menu tài khoản' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Bắt đầu miễn phí', exact: true })).toHaveCount(0);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect.soft(accessibility.violations, route).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`${route.replace(/[^a-z0-9]/gi, '_')}.png`), fullPage: true });
    }
    await page.goto('/discover/tarot?item=00000000-0000-4000-8000-000000000001');
    await expect(page.getByText('Chưa thể tải trải bài này.')).toBeVisible();
    await page.getByRole('button', { name: '← Quay lại Tarot' }).click();
    await expect(page).toHaveURL(/\/discover\/tarot$/);
    expect(errors).toEqual([]);
  });
}
