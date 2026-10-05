import { test, expect } from '@playwright/test';

for (const width of [390, 1536]) {
  test(`Tu Vi result visual QA at ${width}px`, async ({ page, context }, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const qaPassword = ['AuditOnly', 'Strong2026'].join('!');
    const registered = await context.request.post('http://localhost:4000/auth/register', {
      data: { email: `tuvi-visual-${width}-${Date.now()}@example.com`, displayName: 'Tu Vi Visual QA', password: qaPassword, confirmPassword: qaPassword, acceptedTerms: true },
    });
    expect(registered.status()).toBe(201);
    const cookies = await context.cookies('http://localhost:4000');
    const csrf = cookies.find((cookie) => cookie.name === 'beaconvie_csrf_token')?.value;
    expect(csrf).toBeTruthy();
    expect((await context.request.post('http://localhost:4000/onboarding/skip', { headers: { 'X-CSRF-Token': csrf! } })).ok()).toBe(true);
    await page.goto('/discover/tu-vi');
    await page.addInitScript(() => window.localStorage.setItem('menhvi_google_consent_v1', 'granted'));
    await page.locator('#tu-vi-birthdate').fill('1984-02-02');
    await page.locator('#tu-vi-birthtime').fill('00:30');
    await page.locator('#tu-vi-sex-Nam').check();
    await page.getByRole('button', { name: 'Lập lá số của tôi' }).click();
    await expect(page.getByText('Lá số đã an', { exact: true })).toBeVisible({ timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`tu-vi-result-${width}.png`), fullPage: true });
    if (width === 390) {
      const palace = page.getByRole('button', { name: /^Cung / }).last();
      await palace.scrollIntoViewIfNeeded();
      await palace.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Đóng chi tiết cung' })).toBeFocused();
      await page.screenshot({ path: testInfo.outputPath('tu-vi-palace-mobile-390.png'), fullPage: true });
    }
  });
}
