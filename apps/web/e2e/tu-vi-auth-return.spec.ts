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
  const csrfBody = await csrfResponse.json() as { data: { csrfToken: string } };
  const headers = { 'x-csrf-token': csrfBody.data.csrfToken };

  let response = await api.get('/onboarding');
  expect(response.ok(), 'new account onboarding state must load').toBeTruthy();
  response = await api.post('/onboarding/message', { data: { content: 'I want to explore my birth chart.' }, headers });
  expect(response.ok(), `first onboarding message must succeed (HTTP ${response.status()}; ${await response.text()})`).toBeTruthy();
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
  expect(body.data?.completedAt, 'completed account must have completedAt').toBeTruthy();
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

  const banner = page.getByRole('complementary', {
    name: /Quyền riêng tư và đo lường/,
  });

  if (await banner.isVisible().catch(() => false)) {
    await banner.getByRole('button', { name: 'Từ chối' }).click();
    await expect(banner).toHaveCount(0);
  }

  const answer = page.getByRole('textbox', {
    name: 'Câu trả lời của bạn',
  });
  const send = page.getByRole('button', {
    name: 'Gửi',
    exact: true,
  });

  await expect(page.getByText(/Gần đây bạn đang nghĩ về điều gì/i)).toBeVisible();
  await answer.fill('Tôi muốn khám phá lá số Tử Vi.');
  await expect(send).toBeEnabled();
  await send.click();

  await expect(page.getByText(/Với bạn, điều khó nhất/i)).toBeVisible();
  await answer.fill('Tôi muốn hiểu rõ hơn về bản thân.');
  await expect(send).toBeEnabled();
  await send.click();

  await expect(page.getByText(/Bạn có muốn lưu điều này thành ký ức/i)).toBeVisible();
  const memory = page.getByRole('button', {
    name: 'Chưa lưu',
    exact: true,
  });
  await expect(memory).toBeEnabled();
  await memory.click();

  await expect(page.getByText(/Bạn muốn khám phá Tarot/i)).toBeVisible();
  const discovery = page.getByRole('button', {
    name: 'Để sau',
    exact: true,
  });
  await expect(discovery).toBeEnabled();
  await discovery.click();

  const finish = page.getByRole('button', {
    name: 'Bắt đầu khám phá',
    exact: true,
  });
  await expect(finish).toBeEnabled();
  await finish.click();
}

async function expectBirthDetailsRestored(page: Page) {
  await expect(page).toHaveURL(/\/discover\/tu-vi(?:[?#]|$)/);
  await expect(page.getByLabel(/Ngày sinh dương lịch/i)).toHaveValue('1984-02-02');
  await expect(page.getByLabel(/Giờ sinh chính xác/i)).toHaveValue('00:30');
  await expect(page.getByLabel('Nam')).toBeChecked();
  await expect(page.getByText('Đang lập lá số')).toHaveCount(0);
  await expect.poll(
    () => page.evaluate(() => sessionStorage.getItem('menhvi:tu-vi:pending-auth')),
    { message: 'Temporary birth draft must be consumed after authentication', timeout: 10_000 },
  ).toBeNull();
}

async function createCompletedQaAccount(): Promise<QaAccount> {
  const api = await request.newContext({ baseURL: apiBase, extraHTTPHeaders: { 'user-agent': 'pr39-playwright-qa' } });
  try {
    const account = await createAccount(api, 'completed');
    await completeOnboardingViaApi(api);
    return account;
  } finally {
    await api.dispose();
  }
}

async function createIncompleteQaAccount(): Promise<QaAccount> {
  const api = await request.newContext({ baseURL: apiBase, extraHTTPHeaders: { 'user-agent': 'pr39-playwright-qa' } });
  try {
    return await createAccount(api, 'incomplete');
  } finally {
    await api.dispose();
  }
}

test.describe('PR39 Tử Vi auth return — isolated CI accounts', () => {
  test.setTimeout(120_000);

  test('existing account with completed onboarding returns to Tử Vi without auto-calculation', async ({ page }) => {
    const calculationPosts: string[] = [];
    page.on('request', req => {
      if (req.method() === 'POST' && /\/tu-vi\/calculate(?:[?#]|$)/.test(new URL(req.url()).pathname)) calculationPosts.push(req.url());
    });
    const completedAccount = await createCompletedQaAccount();
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
    const incompleteAccount = await createIncompleteQaAccount();
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
