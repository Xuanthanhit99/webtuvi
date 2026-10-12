import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { request } from '@playwright/test';

const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000';
const password = 'Pr39-QA!Pass-2026';
type QaAccount = { email: string; password: string };

async function createAccount(api: APIRequestContext, label: string): Promise<QaAccount> {
  const account = {
    email: `pr39-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password,
  };
  const response = await api.post('/auth/register', {
    data: {
      email: account.email,
      displayName: `PR39 ${label}`,
      password,
      confirmPassword: password,
      acceptedTerms: true,
    },
  });
  expect(response.status(), 'QA account registration must succeed against the isolated CI API').toBe(201);
  return account;
}

async function completeOnboardingViaApi(api: APIRequestContext) {
  const csrfResponse = await api.get('/auth/csrf-token');
  expect(csrfResponse.ok(), 'CSRF token endpoint must be available').toBeTruthy();
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
  const headers = { 'x-csrf-token': csrfToken };

  let response = await api.get('/onboarding');
  expect(response.ok(), 'new account onboarding state must load').toBeTruthy();
  response = await api.post('/onboarding/message', { data: { content: 'I want to explore my birth chart.' }, headers });
  expect(response.ok(), 'first onboarding message must succeed').toBeTruthy();
  response = await api.post('/onboarding/message', { data: { content: 'I am ready to continue.' }, headers });
  expect(response.ok(), 'second onboarding message must succeed').toBeTruthy();
  response = await api.post('/onboarding/memory/consent', { data: { accepted: false }, headers });
  expect(response.ok(), 'declining memory consent must allow onboarding to continue').toBeTruthy();
  response = await api.post('/onboarding/discovery/select', { data: { choice: 'skipped' }, headers });
  expect(response.ok(), 'discovery choice must succeed').toBeTruthy();
  response = await api.post('/onboarding/complete', { data: {}, headers });
  expect(response.ok(), 'onboarding completion must succeed').toBeTruthy();

  const state = await api.get('/onboarding');
  expect(state.ok()).toBeTruthy();
  const body = await state.json();
  expect(body.completedAt, 'completed account must have completedAt').toBeTruthy();
}

async function enterBirthDetails(page: Page) {
  await page.goto('/discover/tu-vi');
  await page.getByLabel(/Ngày sinh dương lịch/i).fill('1984-02-02');
  await page.getByLabel(/Giờ sinh chính xác/i).fill('00:30');
  await page.getByLabel('Nam').check();
  await page.getByRole('button', { name: /Lập lá số của tôi/i }).click();
  await expect(page.getByText('Đăng nhập Mệnh Vi')).toBeVisible();
}

async function login(page: Page, account: QaAccount) {
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).last().click();
}

async function completeOnboardingInUi(page: Page) {
  await expect(page).toHaveURL(/\/onboarding\?next=/);
  for (let step = 0; step < 12; step++) {
    const finish = page.getByRole('button', { name: 'Bắt đầu khám phá' });
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      return;
    }
    const memory = page.getByRole('button', { name: 'Chưa lưu' });
    const discovery = page.getByRole('button', { name: 'Để sau' });
    const reply = page.getByLabel('Câu trả lời của bạn');
    if (await memory.isVisible().catch(() => false)) await memory.click();
    else if (await discovery.isVisible().catch(() => false)) await discovery.click();
    else if (await reply.isVisible().catch(() => false)) {
      await reply.fill('Tôi muốn khám phá lá số Tử Vi.');
      await page.getByRole('button', { name: 'Gửi', exact: true }).click();
    } else {
      await expect.poll(async () => (await finish.isVisible()) || (await memory.isVisible()) || (await discovery.isVisible()) || (await reply.isVisible()), { timeout: 10_000 }).toBeTruthy();
    }
  }
  await expect(page.getByRole('button', { name: 'Bắt đầu khám phá' })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu khám phá' }).click();
}

async function expectBirthDetailsRestored(page: Page) {
  await expect(page).toHaveURL(/\/discover\/tu-vi(?:[?#]|$)/);
  await expect(page.getByLabel(/Ngày sinh dương lịch/i)).toHaveValue('1984-02-02');
  await expect(page.getByLabel(/Giờ sinh chính xác/i)).toHaveValue('00:30');
  await expect(page.getByLabel('Nam')).toBeChecked();
  await expect(page.getByText('Đang lập lá số')).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('menhvi:tu-vi:pending-auth'))).toBeNull();
}

test.describe('PR39 Tử Vi auth return — isolated CI accounts', () => {
  test.setTimeout(120_000);
  let completedAccount: QaAccount;
  let incompleteAccount: QaAccount;

  test.beforeAll(async () => {
    const api = await request.newContext({ baseURL: apiBase, extraHTTPHeaders: { 'user-agent': 'pr39-playwright-qa' } });
    try {
      completedAccount = await createAccount(api, 'completed');
      await completeOnboardingViaApi(api);
      // The API context above owns the completed account session; create a second independent
      // account in a fresh context so its onboarding remains untouched.
      const secondApi = await request.newContext({ baseURL: apiBase, extraHTTPHeaders: { 'user-agent': 'pr39-playwright-qa' } });
      try {
        incompleteAccount = await createAccount(secondApi, 'incomplete');
      } finally {
        await secondApi.dispose();
      }
    } finally {
      await api.dispose();
    }
  });

  test('existing account with completed onboarding returns to Tử Vi without auto-calculation', async ({ page }) => {
    const calculationPosts: string[] = [];
    page.on('request', req => {
      if (req.method() === 'POST' && /\/tu-vi\/calculate(?:[?#]|$)/.test(new URL(req.url()).pathname)) calculationPosts.push(req.url());
    });
    await enterBirthDetails(page);
    await login(page, completedAccount);
    await expectBirthDetailsRestored(page);
    expect(calculationPosts, 'login must not automatically submit a chart').toEqual([]);
  });

  test('existing account with incomplete onboarding can finish and return to Tử Vi', async ({ page }) => {
    const calculationPosts: string[] = [];
    page.on('request', req => {
      if (req.method() === 'POST' && /\/tu-vi\/calculate(?:[?#]|$)/.test(new URL(req.url()).pathname)) calculationPosts.push(req.url());
    });
    await enterBirthDetails(page);
    await login(page, incompleteAccount);
    await completeOnboardingInUi(page);
    await expectBirthDetailsRestored(page);
    expect(calculationPosts, 'onboarding return must not automatically submit a chart').toEqual([]);
  });

  test('Mobile 390 supports switching auth modal from login to registration', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterBirthDetails(page);
    const modalTitle = page.getByText('Đăng nhập Mệnh Vi');
    await expect(modalTitle).toBeVisible();
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
    await expect(page.getByLabel('Tên hiển thị')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tạo tài khoản' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tạo tài khoản' })).toBeInViewport();
  });
});
