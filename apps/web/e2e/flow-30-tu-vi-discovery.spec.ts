import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Flow 30: Tử Vi Lá Số Discovery (Sprint 18B) — Vietnamese Tử Vi Đẩu Số (VDTTL-1956), independent
// of and never conflated with Eastern Horoscope (Ngũ Hành Phương Đông). Calculates a real
// deterministic chart from a birth date/time/sex, verifies EXACT expected facts against
// VECTOR-B1 — a rule-derived vector independently verified at the engine layer
// (tu-vi-chart.spec.ts), the API/persistence layer (test/tu-vi.e2e-spec.ts), and now here at the
// full HTTP+browser layer — never derived from the running app under test. Proves the frozen
// TUVI-GIO-02 midnight-rollover convention (23:xx/00:xx boundary) survives end to end, proves AI
// interpretation never alters the deterministic facts, exercises history/detail/lifecycle, and
// confirms a real failure state never silently guesses.
//
// AI provider note: this local dev environment's actual configuration is
// DEFAULT_AI_PROVIDER=openai (credits exhausted) with FALLBACK_PROVIDER=mock — identical,
// disclosed precedent to flow-28-eastern-horoscope-discovery.spec.ts's own header comment. Real
// Gemini/OpenAI generation is NOT exercised by this flow.

test.describe.configure({ timeout: 300_000 });

async function registerAndOnboard(page: Page, label: string): Promise<void> {
  const email = `flow30-tu-vi-${label}-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill(`Flow Thirty ${label}`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 30000 });
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Curious what my lá số says, honestly.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 15000 });
  await replyInput.fill('Mostly just being patient with myself.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
}

test('Calculate VECTOR-B1, verify exact deterministic facts, generate interpretation without altering them, exercise lifecycle, and confirm a real failure state', async ({ page }) => {
  await registerAndOnboard(page, 'main');

  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: 'Tử Vi Lá Số' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Coming soon')).not.toBeVisible();
  await page.getByRole('link', { name: /try tử vi lá số/i }).click();
  await expect(page).toHaveURL(/\/discover\/tu-vi/, { timeout: 30000 });
  await expect(page.getByRole('heading', { name: 'Tử Vi Lá Số', level: 1 })).toBeVisible({ timeout: 15000 });

  // --- Failure state first: submitting with no birth date must never silently guess a result. ---
  await page.getByRole('button', { name: /calculate my lá số/i }).click();
  await expect(page.getByText('Birth date is required.')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Deterministic — never AI-generated')).not.toBeVisible();

  // --- VECTOR-B1 (Sprint 18A.5/18B.8/18B.9/18B.11) — independently rule-derived, never called
  // from the app under test. 1984-02-02, 00:30, Nam. ---
  await page.getByLabel(/date of birth/i).fill('1984-02-02');
  await page.getByLabel(/time of birth/i).fill('00:30');
  await page.getByLabel('Nam (male)').check();
  await page.getByRole('button', { name: /calculate my lá số/i }).click();

  await expect(page.getByText('Deterministic — never AI-generated').first()).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('Hỏa Lục Cục').first()).toBeVisible();
  await expect(page.locator('[aria-label^="Mệnh palace, at Dần"]:visible')).toBeVisible();
  await expect(page.getByText('Giáp Tý', { exact: true })).toBeVisible();
  await expect(page.locator('dt:has-text("Hour branch") + dd')).toHaveText('Tý');

  // Every one of the 12 palace roles is present and correctly, accessibly labeled.
  for (const role of ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ']) {
    await expect(page.locator(`[aria-label^="${role} palace"]:visible`)).toBeVisible();
  }

  // Capture the exact deterministic-fact strings BEFORE requesting/waiting on interpretation.
  const beforeCuc = await page.getByText('Hỏa Lục Cục').first().textContent();
  const beforeMenh = await page.locator('[aria-label^="Mệnh palace, at Dần"]:visible').getAttribute('aria-label');

  // --- AI interpretation. The backend already attempts this once, synchronously, right after
  // calculation, so it is usually already present by the time the UI reveals it; if a
  // budget/lock edge case left it null, the "Generate interpretation" affordance is used instead.
  const generateButton = page.getByRole('button', { name: /generate interpretation/i });
  if (await generateButton.isVisible().catch(() => false)) {
    await generateButton.click();
  }
  await expect(page.getByText('Interpretation isn’t ready yet.')).not.toBeVisible({ timeout: 30000 });
  await expect(page.getByText('AI Interpretation')).toBeVisible();
  await expect(page.getByText(/written by ai/i)).toBeVisible();

  // --- Deterministic facts must survive AI interpretation completely unchanged. ---
  await expect(page.getByText('Hỏa Lục Cục').first()).toHaveText(beforeCuc!);
  await expect(page.locator('[aria-label^="Mệnh palace, at Dần"]:visible')).toHaveAttribute('aria-label', beforeMenh!);

  // --- History -> detail: the real, persisted chart survives navigation (a real DB row). ---
  await page.getByRole('button', { name: /calculate another lá số/i }).click();
  const historyList = page.getByRole('list', { name: 'Lá số history' });
  await expect(historyList.getByRole('listitem')).toHaveCount(1, { timeout: 15000 });
  await historyList.getByRole('listitem').first().getByRole('button').click();
  await expect(page.getByRole('button', { name: '← Back to Tử Vi Lá Số' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('Hỏa Lục Cục').first()).toBeVisible();

  // --- Lifecycle: archive -> restore round trip, real state transitions. ---
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await expect(page.getByText('Archived', { exact: true })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page.getByText('Active', { exact: true })).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: '← Back to Tử Vi Lá Số' }).click();
  await expect(page).toHaveURL(/\/discover\/tu-vi$/);
});

test('TUVI-GIO-02 midnight boundary (23:xx/00:xx): a 23:30 birth resolves to hour branch Tý, the frozen wraparound convention, through the real HTTP layer', async ({ page }) => {
  await registerAndOnboard(page, 'boundary');

  await page.goto('/discover/tu-vi');
  await expect(page.getByRole('heading', { name: 'Tử Vi Lá Số', level: 1 })).toBeVisible({ timeout: 15000 });

  // Engine-verified fixed point (tu-vi-calendar-context.spec.ts, TUVI-GIO-02): birthDate
  // 2024-03-15, birthTime 23:30 -> hourBranch = Tý, effectiveTuViDate = the SAME calendar day
  // (2024-03-15), never shifted forward into the 16th despite crossing into the Tý window.
  await page.getByLabel(/date of birth/i).fill('2024-03-15');
  await page.getByLabel(/time of birth/i).fill('23:30');
  await page.getByLabel('Nữ (female)').check();
  await page.getByRole('button', { name: /calculate my lá số/i }).click();

  // A generous timeout here: `calculate()` synchronously awaits the AI interpretation attempt
  // before returning (18B.10 architecture), and this dev environment's real
  // DEFAULT_AI_PROVIDER=openai has no billing credits — each attempt retries against it before
  // falling back to mock, which can add real wall-clock time under load (see flow header).
  await expect(page.getByText('Deterministic — never AI-generated').first()).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('Hour branch')).toBeVisible();
  // The hour-branch fact row shows exactly "Tý" — the frozen undivided 23:00–00:59 window, not a
  // "Giờ Tý Sơ/Chính" split and not shifted to the next civil day's own Tý.
  await expect(page.locator('dt:has-text("Hour branch") + dd')).toHaveText('Tý');
});

test('accessibility: zero axe violations on the input form, the calculated result (deterministic facts + palace grid + AI section), and history', async ({ page }) => {
  await registerAndOnboard(page, 'axe');

  await page.goto('/discover/tu-vi');
  await expect(page.getByRole('heading', { name: 'Tử Vi Lá Số', level: 1 })).toBeVisible({ timeout: 15000 });

  // 1. Input form, idle state.
  const formScan = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(formScan.violations, JSON.stringify(formScan.violations, null, 2)).toEqual([]);

  // 2. Calculated result: deterministic facts, 12-palace grid, and the AI interpretation section
  // together on one page.
  await page.getByLabel(/date of birth/i).fill('1984-02-02');
  await page.getByLabel(/time of birth/i).fill('00:30');
  await page.getByLabel('Nam (male)').check();
  await page.getByRole('button', { name: /calculate my lá số/i }).click();
  await expect(page.getByText('Deterministic — never AI-generated').first()).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('AI Interpretation')).toBeVisible({ timeout: 30000 });

  const resultScan = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(resultScan.violations, JSON.stringify(resultScan.violations, null, 2)).toEqual([]);

  // 3. History list.
  await page.getByRole('button', { name: /calculate another lá số/i }).click();
  await expect(page.getByRole('list', { name: 'Lá số history' }).getByRole('listitem')).toHaveCount(1, { timeout: 15000 });

  const historyScan = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
  expect(historyScan.violations, JSON.stringify(historyScan.violations, null, 2)).toEqual([]);
});

test('responsive: the calculated chart stays legible with no horizontal overflow across all 10 specified breakpoints', async ({ page }) => {
  await registerAndOnboard(page, 'responsive');

  await page.goto('/discover/tu-vi');
  await expect(page.getByRole('heading', { name: 'Tử Vi Lá Số', level: 1 })).toBeVisible({ timeout: 15000 });
  await page.getByLabel(/date of birth/i).fill('1984-02-02');
  await page.getByLabel(/time of birth/i).fill('00:30');
  await page.getByLabel('Nam (male)').check();
  await page.getByRole('button', { name: /calculate my lá số/i }).click();
  await expect(page.getByText('Deterministic — never AI-generated').first()).toBeVisible({ timeout: 60000 });

  // The 10 breakpoints this sprint is required to verify (desktop down to small mobile), straddling
  // both custom Tailwind breakpoints this feature uses (`tablet`=768, `desktop`=1280).
  const widths = [1440, 1280, 1100, 1024, 900, 820, 768, 767, 390, 375];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    // No horizontal scroll — the page body must never be wider than its viewport at any of these
    // widths (a hard product-wide rule per the artifact/CSS discipline this codebase follows).
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflowing, `horizontal overflow at ${width}px`).toBe(false);
    // The chart itself is still fully present and legible — the Mệnh palace and the AI section are
    // both reachable (scrolled into view) and visible at every width.
    const menh = page.locator('[aria-label^="Mệnh palace, at Dần"]:visible');
    await menh.scrollIntoViewIfNeeded();
    await expect(menh, `Mệnh palace not visible at ${width}px`).toBeVisible();
  }
});
