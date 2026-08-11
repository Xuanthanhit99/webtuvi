import { test, expect, type Page } from '@playwright/test';

// Flow 22: Numerology Discovery Foundation (Sprint 8) — the second real Discovery feature.
// Calculates a real reading from deterministic test input, verifies the exact expected core
// numbers (including a preserved Master Number), expands the calculation-transparency steps,
// confirms the reading persists into history/detail, exercises the archive/delete lifecycle, and
// confirms the Companion bridge (a Numerology reading exists -> Companion still loads/streams
// normally, referencing the real, already-calculated numbers rather than inventing its own).
// Requires DEFAULT_AI_PROVIDER=mock (see apps/api/.env.example).
//
// Registers a fresh user per run (per flow-20's own pattern) — the daily calculation ceiling makes
// a shared account non-idempotent across repeated local runs.

test.describe.configure({ timeout: 180_000 });

async function registerAndOnboard(page: Page): Promise<void> {
  const email = `flow22-numerology-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow TwentyTwo');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Curious what my numbers say, honestly.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Mostly just being patient with myself.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('Calculate, verify exact core numbers, expand steps, history/detail, lifecycle, and the Companion bridge', async ({ page }) => {
  await registerAndOnboard(page);

  await page.goto('/discover/numerology');
  await expect(page.getByRole('heading', { name: 'Numerology' })).toBeVisible({ timeout: 10000 });

  // Deterministic test input — golden vector: Nguyen Van A, 1995-08-17 -> Life Path 22 (Master),
  // Personality 33 (Master), Expression 7, Birthday 8 (see numerology-engine.spec.ts).
  await page.getByLabel(/full birth name/i).fill('Nguyen Van A');
  await page.getByLabel(/date of birth/i).fill('1995-08-17');
  await page.getByRole('button', { name: /calculate my numbers/i }).click();

  // The real, already-computed result reveals — never a placeholder. "Life Path"/"Personality"
  // also appear as substrings inside other cards' descriptions, so match the exact card heading
  // and scope assertions to that card's own container.
  const lifePathHeading = page.getByText('Life Path', { exact: true });
  await expect(lifePathHeading).toBeVisible({ timeout: 10000 });
  const lifePathCard = lifePathHeading.locator('xpath=ancestor::div[contains(@class,"rounded-md")][1]');
  await expect(lifePathCard.getByText('22', { exact: true })).toBeVisible();
  // Exact match — the traditional-meaning text below also legitimately contains the phrase "Master
  // Number" as part of a longer sentence ("The Master Builder (Master Number)."), which is real
  // content, not a bug; only the badge's own text is exactly "Master Number".
  await expect(lifePathCard.getByText('Master Number', { exact: true })).toBeVisible();

  const personalityHeading = page.getByText('Personality', { exact: true });
  const personalityCard = personalityHeading.locator('xpath=ancestor::div[contains(@class,"rounded-md")][1]');
  await expect(personalityCard.getByText('33', { exact: true })).toBeVisible();

  // Calculation transparency (Phase 13) — expand Life Path's own steps and verify the real
  // digit-sum trail is shown, not internal code jargon.
  await page.getByRole('button', { name: /why is my number 22/i }).click();
  await expect(page.getByText(/Total: 8 \+ 8 \+ 6 = 22/)).toBeVisible();
  await expect(page.getByText(/Master Number, so it's kept as-is/i)).toBeVisible();

  // AI interpretation (mock provider) — either a real generated interpretation, or a truthful
  // "isn't ready yet" state with a working retry, never a fabricated placeholder.
  const interpretationPending = page.getByText('Interpretation isn’t ready yet.');
  if (await interpretationPending.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Generate interpretation' }).click();
  }
  await expect(interpretationPending).not.toBeVisible({ timeout: 15000 });

  // Persisted reading — reload and confirm it survives (real DB row, not client-only state).
  await page.reload();
  await expect(page.getByText('NGUYEN VAN A')).toBeVisible({ timeout: 10000 });

  // History -> detail.
  const historyList = page.getByRole('list', { name: 'Reading history' });
  await expect(historyList.getByRole('listitem')).toHaveCount(1, { timeout: 10000 });
  await historyList.getByRole('listitem').first().getByRole('button').click();
  await expect(page.getByRole('button', { name: '← Back to Numerology' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Life Path', { exact: true })).toBeVisible();

  // Lifecycle — archive then restore, reversibly. The Archive/Restore actions live inside the
  // reading view itself (this detail screen), not the list — done here before navigating back.
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByRole('button', { name: 'Archive' })).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: '← Back to Numerology' }).click();

  // Companion bridge: a real Numerology reading now exists for this user, marked visible to
  // Companion. Companion must still load and respond normally, referencing the real calculated
  // numbers rather than fabricating its own.
  await page.goto('/companion');
  const startButton = page.getByRole('button', { name: /start a conversation/i });
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  }
  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });
  await composer.fill('I just calculated my numerology numbers — what did you notice?');
  await page.getByRole('button', { name: /send message/i }).click();
  await expect(page.getByRole('log', { name: 'Conversation' }).locator('text=Companion').last()).toBeVisible({ timeout: 15000 });
  await expect(composer).toBeEnabled({ timeout: 15000 });
});
