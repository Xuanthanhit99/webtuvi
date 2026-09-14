import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:4000';
const MAILPIT_URL = process.env.PLAYWRIGHT_MAILPIT_URL ?? 'http://localhost:8025';

// Real backend, cookies, database and local SMTP sink. Never route-mock auth.
// One-time email links should not be persisted in traces or screenshots.
test.use({ trace: 'off' });

async function emailLink(request: APIRequestContext, email: string, route: string): Promise<string> {
  let found = '';
  await expect.poll(async () => {
    const response = await request.get(`${MAILPIT_URL}/api/v1/messages`);
    expect(response.ok()).toBeTruthy();
    const { messages } = await response.json() as { messages: { ID: string; To: { Address: string }[] }[] };
    for (const message of messages.filter((item) => item.To.some((recipient) => recipient.Address === email))) {
      const detail = await (await request.get(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json() as { Text: string };
      const links = detail.Text.match(/https?:\/\/[^\s<>]+/g) ?? [];
      found = links.find((link) => new URL(link).pathname === route) ?? '';
      if (found) break;
    }
    return Boolean(found);
  }, { timeout: 20_000, message: 'Expected local SMTP delivery for the QA account' }).toBe(true);
  return found;
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login?next=%2Fsettings');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.locator('#account').getByText(email, { exact: true })).toBeVisible();
}

test('real account lifecycle, email recovery, session boundaries and deletion', async ({ page, context, browser, request }) => {
  test.setTimeout(240_000);
  const email = `account-qa-${Date.now()}@example.test`;
  const password = 'Account-QA-2026!';
  const changedPassword = 'Account-QA-changed-2026!';
  const resetPassword = 'Account-QA-reset-2026!';

  await page.goto('/settings?from=account-qa');
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByRole('link', { name: 'Tạo tài khoản', exact: true }).click();
  await page.getByLabel('Tên hiển thị', { exact: true }).fill('Account QA');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\?next=/);
  await expect(page.getByLabel('Câu trả lời của bạn')).toBeVisible();

  const verificationPage = await context.newPage();
  await verificationPage.goto(await emailLink(request, email, '/verify-email'));
  await expect(verificationPage.getByText('Đã xác minh email', { exact: true })).toBeVisible();
  await verificationPage.close();
  await page.reload();
  await page.getByLabel('Câu trả lời của bạn').fill('Tôi đang bắt đầu một công việc mới.');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await expect(page.getByText(/điều khó nhất trong chuyện này/)).toBeVisible();
  await page.getByLabel('Câu trả lời của bạn').fill('Tôi muốn hiểu rõ điều mình cần chuẩn bị.');
  await page.getByRole('button', { name: 'Gửi', exact: true }).click();
  await page.getByRole('button', { name: 'Chưa lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Để sau', exact: true }).click();
  await page.getByRole('button', { name: 'Bắt đầu khám phá', exact: true }).click();
  await expect(page).toHaveURL(/\/settings\?from=account-qa$/);
  await expect(page.locator('#account').getByText('Đã xác minh', { exact: true })).toBeVisible();
  await expect(page.locator('#account').getByText('Miễn phí', { exact: true })).toBeVisible();

  // Expired/missing access cookie with valid refresh must restore the session and intent.
  await context.clearCookies({ name: 'beaconvie_access_token' });
  await page.reload();
  await expect(page).toHaveURL(/\/settings\?from=account-qa$/);
  await expect(page.locator('#account').getByText(email, { exact: true })).toBeVisible();

  const reminder = page.getByLabel(/Nhận nhắc nhở trong ứng dụng/);
  const previousReminder = await reminder.isChecked();
  await reminder.setChecked(!previousReminder);
  await expect.poll(async () => (await (await page.request.get(`${API_URL}/notifications/preferences`)).json()).data.reminderInApp).toBe(!previousReminder);
  await page.reload();
  await expect(page.getByLabel(/Nhận nhắc nhở trong ứng dụng/)).toBeChecked({ checked: !previousReminder });

  const otherContext = await browser.newContext({ userAgent: 'Mozilla/5.0 Firefox/130.0' });
  try {
    expect((await otherContext.request.post(`${API_URL}/auth/login`, { data: { email, password } })).ok()).toBeTruthy();
    await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill(password);
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill(changedPassword);
    await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill(changedPassword);
    await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
    await expect(page.getByText('Đã đổi mật khẩu và đăng xuất các thiết bị khác.', { exact: true })).toBeVisible();
    expect((await otherContext.request.get(`${API_URL}/auth/me`)).status()).toBe(401);
    expect((await page.request.get(`${API_URL}/auth/me`)).status()).toBe(200);

    expect((await otherContext.request.post(`${API_URL}/auth/login`, { data: { email, password: changedPassword } })).ok()).toBeTruthy();
    await page.reload();
    const sessions = (await (await page.request.get(`${API_URL}/auth/sessions`)).json()).data as { current: boolean; userAgentSummary: string }[];
    const other = sessions.find((session) => !session.current)!;
    expect(other).toBeDefined();
    await page.getByRole('button', { name: `Đăng xuất ${other.userAgentSummary}`, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect.poll(async () => (await otherContext.request.get(`${API_URL}/auth/me`)).status()).toBe(401);
  } finally { await otherContext.close(); }

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất dữ liệu tài khoản', exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(JSON.parse(Buffer.concat(chunks).toString()).account.email).toBe(email);

  await page.evaluate(() => localStorage.setItem('beaconvie:journal-draft:account-qa', 'private QA draft'));
  await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
  await page.getByRole('menuitem', { name: /Đăng xuất/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await page.evaluate(() => localStorage.getItem('beaconvie:journal-draft:account-qa'))).toBeNull();
  await expect(page.getByText(email, { exact: true })).toHaveCount(0);

  await page.goto('/forgot-password');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Gửi liên kết đặt lại', exact: true }).click();
  await expect(page.getByText('Kiểm tra hộp thư', { exact: true })).toBeVisible();
  await page.goto(await emailLink(request, email, '/reset-password'));
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill(resetPassword);
  await page.getByLabel('Xác nhận mật khẩu mới', { exact: true }).fill(resetPassword);
  await page.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, email, resetPassword);

  await page.getByRole('button', { name: 'Đăng xuất tất cả', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đăng xuất mọi thiết bị', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get(`${API_URL}/auth/me`)).status()).toBe(401);
  await login(page, email, resetPassword);
  await page.getByRole('button', { name: 'Xóa tài khoản', exact: true }).click();
  await page.getByLabel('Xác nhận mật khẩu của bạn', { exact: true }).fill(resetPassword);
  await page.getByRole('button', { name: 'Xóa tài khoản vĩnh viễn', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get(`${API_URL}/auth/me`)).status()).toBe(401);
  expect((await page.request.post(`${API_URL}/auth/login`, { data: { email, password: resetPassword } })).status()).toBe(401);
});
