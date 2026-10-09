import { test, expect, type Page } from '@playwright/test';

// Real browser + real HTTP backend. Requires the local API/database and a clean test account.
// No route interception or mocked auth responses.
test.describe('Tử Vi guest auth return', () => {
  test.setTimeout(120_000);

  async function enterBirthDetails(page: Page) {
    await page.goto('/discover/tu-vi');
    await page.getByLabel(/Ngày sinh dương lịch/i).fill('1984-02-02');
    await page.getByLabel(/Giờ sinh chính xác/i).fill('00:30');
    await page.getByLabel('Nam').check();
    await page.getByRole('button', { name: /Lập lá số của tôi/i }).click();
    await expect(page.getByText('Đăng nhập Mệnh Vi')).toBeVisible();
  }

  async function checkReturn(page: Page) {
    await expect(page).toHaveURL(/\/tu-vi(?:[?#]|$)/);
    await expect(page.getByLabel(/Ngày sinh dương lịch/i)).toHaveValue('1984-02-02');
    await expect(page.getByLabel(/Giờ sinh chính xác/i)).toHaveValue('00:30');
    await expect(page.getByLabel('Nam')).toBeChecked();
    await expect(page.getByText('Đang lập lá số')).toHaveCount(0);
    const stored = await page.evaluate(() => sessionStorage.getItem('menhvi:tu-vi:pending-auth'));
    expect(stored).toBeNull();
  }

  test('guest registration returns from onboarding without submitting calculation', async ({ page }) => {
    const calculationPosts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/tu-vi\/calculate(?:[?#]|$)/.test(new URL(request.url()).pathname)) calculationPosts.push(request.url());
    });
    await enterBirthDetails(page);
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await page.getByLabel('Tên hiển thị').fill('Tu Vi E2E');
    await page.getByLabel('Email').fill(`tuvi-return-${Date.now()}@example.com`);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('Sup3r$ecretPass');
    await page.getByLabel('Xác nhận mật khẩu').fill('Sup3r$ecretPass');
    await page.getByLabel(/Tôi đồng ý với/).check();
    await page.getByRole('button', { name: 'Tạo tài khoản' }).click();
    await expect(page).toHaveURL(/\/onboarding\?next=/);
    await page.getByRole('button', { name: 'Bỏ qua lúc này' }).click();
    await checkReturn(page);
    expect(calculationPosts, 'registration must not auto-submit a chart').toEqual([]);
  });

  test('guest login returns after onboarding when an eligible existing account is provided', async ({ page }) => {
    test.skip(!process.env.TUVI_E2E_LOGIN_EMAIL || !process.env.TUVI_E2E_LOGIN_PASSWORD, 'Set TUVI_E2E_LOGIN_EMAIL and TUVI_E2E_LOGIN_PASSWORD for a test account requiring onboarding.');
    const calculationPosts: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && /\/tu-vi\/calculate(?:[?#]|$)/.test(new URL(request.url()).pathname)) calculationPosts.push(request.url());
    });
    await enterBirthDetails(page);
    await page.getByLabel('Email').fill(process.env.TUVI_E2E_LOGIN_EMAIL!);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.TUVI_E2E_LOGIN_PASSWORD!);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).last().click();
    await expect(page).toHaveURL(/\/onboarding\?next=/);
    await page.getByRole('button', { name: 'Bỏ qua lúc này' }).click();
    await checkReturn(page);
    expect(calculationPosts, 'login must not auto-submit a chart').toEqual([]);
  });
});
