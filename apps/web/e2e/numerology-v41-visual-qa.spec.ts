import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth)).toBeLessThanOrEqual(1);
}

async function expectInteractive(control: Locator): Promise<void> {
  await expect(control).toBeVisible();
  await expect(control).toBeEnabled();
  await control.scrollIntoViewIfNeeded();
  expect(await control.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  }), 'Control center must not be covered by navigation or overlays').toBe(true);
  await control.click({ trial: true });
}

async function expectMobileBottomClearance(page: Page, bottomInset: number): Promise<void> {
  const nav = page.getByRole('navigation', { name: 'Điều hướng chính', exact: true }).filter({ visible: true });
  await expect(nav).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // Diagnostic-only: preserve the strict bottom clearance assertions and report
  // actual browser geometry before the existing poll can fail.
  const geometry = await page.evaluate(() => {
    const scroller = document.scrollingElement;
    const nav = [...document.querySelectorAll('nav')].find(el => el.getAttribute('aria-label') === 'Điều hướng chính');
    const rect = nav?.getBoundingClientRect();
    return {
      scrollingElement: scroller?.tagName,
      documentHeight: document.documentElement.scrollHeight,
      scrollHeight: scroller?.scrollHeight,
      clientHeight: scroller?.clientHeight,
      scrollTop: scroller?.scrollTop,
      scrollY,
      viewportHeight: innerHeight,
      navTop: rect?.top,
      navBottom: rect?.bottom,
      navHeight: rect?.height,
      mainBottom: document.querySelector('#main-content > div')?.getBoundingClientRect().bottom,
    };
  });
  console.log('[numerology-390-scroll-diagnostic]', JSON.stringify(geometry));
  await expect.poll(() => page.evaluate(() => {
    const scroller = document.scrollingElement;
    if (!scroller) return Number.POSITIVE_INFINITY;
    return Math.abs(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop);
  }), 'Scrolling element must reach the actual document bottom').toBeLessThanOrEqual(1);
  const navBox = await nav.boundingBox();
  expect(navBox).not.toBeNull();
  const contentBox = await page.locator('#main-content > div').boundingBox();
  expect(contentBox).not.toBeNull();
  expect(contentBox!.y + contentBox!.height, 'Last content must clear the fixed bottom navigation').toBeLessThanOrEqual(navBox!.y - 1);
  expect(navBox!.y + navBox!.height).toBeCloseTo(page.viewportSize()!.height, 0);
  expect(await nav.evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom))).toBe(bottomInset);
  const mainPadding = await page.locator('#main-content').evaluate((element) => parseFloat(getComputedStyle(element).paddingBottom));
  expect(mainPadding, 'Main reserves navigation height including the safe area').toBeGreaterThan(navBox!.height);
  for (const link of await nav.getByRole('link').all()) {
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height - bottomInset);
    await expectInteractive(link);
  }
  await expectNoHorizontalOverflow(page);
}

async function captureState(page: Page, testInfo: TestInfo, state: 'entry' | 'result', width: number): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await expectConsentBannerHidden(page);
  await expectNoHorizontalOverflow(page);
  if (width === 390) {
    // Exercise real CSS env() resolution without modifying application styles.
    const cdp = await page.context().newCDPSession(page);
    try {
      for (const bottom of [0, 34]) {
        await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { bottom } });
        await expectMobileBottomClearance(page, bottom);
        await page.screenshot({ path: testInfo.outputPath(`numerology-v41-${state}-${width}-bottom-inset-${bottom}.png`), fullPage: false });
      }
    } finally {
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: {} });
      await cdp.detach();
    }
  }
  // Entry starts at the page top; Result starts at the revealed reading, not the form intro.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  if (width === 390 && state === 'result') {
    await page.locator('header').filter({ has: page.getByText('Hồ sơ số học', { exact: true }) })
      .evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(page.getByRole('heading', { name: 'Đường đời 22' })).toBeInViewport();
  }
  const path = testInfo.outputPath(`numerology-v41-${state}-${width}.png`);
  await page.screenshot({ path, fullPage: width === 1536, animations: 'disabled' });
  await testInfo.attach(`numerology-v41-${state}-${width}`, { path, contentType: 'image/png' });
}

async function expectConsentBannerHidden(page: import('@playwright/test').Page): Promise<void> {
  expect(await page.evaluate(() => window.localStorage.getItem('menhvi_google_consent_v1'))).toBe('granted');
  await expect(page.getByRole('complementary', { name: 'Quyền riêng tư và đo lường' })).toBeHidden({ timeout: 15_000 });
}

test.describe.configure({ timeout: 180_000 });

async function registerAndSkipOnboarding(page: Page, width: number): Promise<void> {
  const registered = await page.context().request.post('http://localhost:4000/auth/register', {
    data: {
      email: `numerology-v41-visual-${width}-${Date.now()}@example.com`,
      displayName: 'Numerology V4.1 Visual QA',
      password: 'AuditOnly!Strong2026',
      confirmPassword: 'AuditOnly!Strong2026',
      acceptedTerms: true,
    },
  });
  expect(registered.status()).toBe(201);
  const cookies = await page.context().cookies('http://localhost:4000');
  const csrf = cookies.find((cookie) => cookie.name === 'beaconvie_csrf_token')?.value;
  expect(csrf).toBeTruthy();
  const onboarded = await page.context().request.post('http://localhost:4000/onboarding/skip', {
    headers: { 'X-CSRF-Token': csrf! },
  });
  expect(onboarded.ok()).toBe(true);
}

for (const width of [390, 1536]) {
  test(`Thần số học V4.1 entry and result at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await registerAndSkipOnboarding(page, width);

    await page.addInitScript(() => window.localStorage.setItem('menhvi_google_consent_v1', 'granted'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Menu tài khoản' })).toBeVisible({ timeout: 15_000 });

    await page.goto('/discover/numerology', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Những con số kể câu chuyện riêng của bạn' })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#numerology-name')).toBeVisible();
    await expect(page.locator('#numerology-name')).toBeEditable();
    await expect(page.locator('#numerology-birthdate')).toBeEditable();
    await expect(page.getByText('Đang tải kết quả của bạn...')).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText('Chưa có hồ sơ', { exact: true })).toBeVisible();
    await captureState(page, testInfo, 'entry', width);

    await page.locator('#numerology-name').fill('Nguyen Van A');
    await page.locator('#numerology-birthdate').fill('1995-08-17');
    const submit = page.getByRole('button', { name: /khám phá hồ sơ số học/i });
    await expectInteractive(submit);
    await submit.click();

    await expect(page.getByRole('heading', { name: 'Đường đời 22' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Nhân cách', { exact: true })).toBeVisible();
    await expect(page.getByText('Năm cá nhân', { exact: true })).toBeVisible();

    const lifePath = page.locator('[data-numerology-value="LIFE_PATH"]');
    await expectInteractive(lifePath.getByRole('button'));
    await lifePath.getByRole('button', { name: /vì sao là số 22/i }).click();
    await expect(lifePath.getByText(/Tổng: 8 \+ 8 \+ 6 = 22/)).toBeVisible();

    const personalYear = page.locator('[data-numerology-value="PERSONAL_YEAR"]');
    await expectInteractive(personalYear.getByRole('button'));
    await personalYear.getByRole('button', { name: /vì sao là số/i }).click();
    await expect(personalYear.locator('ol')).toBeVisible();

    const history = page.getByRole('list', { name: 'Lịch sử hồ sơ số học' });
    await expect(history.getByRole('button')).toHaveCount(1);
    await captureState(page, testInfo, 'result', width);
    await expectInteractive(history.getByRole('button'));
    await history.getByRole('button').click();
    await expect(page).toHaveURL(/\?item=/);
    await expect(page.getByRole('heading', { name: 'Đường đời 22' })).toBeVisible();
    const back = page.getByRole('button', { name: '← Quay lại Thần số học' });
    await expectInteractive(back);
    await back.click();
    await expect(page.locator('#numerology-name')).toBeEditable();
  });
}
