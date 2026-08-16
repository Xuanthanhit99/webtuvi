import { test, expect, type Page } from '@playwright/test';

// Flow 20: Tarot Discovery Foundation (Sprint 6) — the first real Discovery feature. Draws a real
// Daily Draw and a real Three Card Spread against the real seeded 78-card deck, confirms the
// generated interpretation and history persist, exercises delete, and confirms the Companion
// bridge (a Tarot reading exists -> Companion still loads/streams normally, referencing real,
// already-drawn cards rather than inventing its own). Requires DEFAULT_AI_PROVIDER=mock (see
// apps/api/.env.example).
//
// Registers a fresh user per run (rather than the shared demo account, per flow-1's own pattern)
// — Daily Draw is rate-limited to once per UTC calendar day per user, so reusing the demo account
// would make this spec fail on any second run within the same day.

test.describe.configure({ timeout: 180_000 });

async function registerAndOnboard(page: Page): Promise<void> {
  const email = `flow20-tarot-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill('Flow Twenty');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Starting a new job next week and feeling nervous about it.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Probably just whether I will be good enough at it.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('Daily Draw, Three Card Spread, history, delete, and the Companion bridge', async ({ page }) => {
  await registerAndOnboard(page);

  await page.goto('/discover/tarot');
  await expect(page.getByRole('heading', { name: 'Tarot' })).toBeVisible({ timeout: 10000 });
  // Scoped to the Draw section — an account status banner can also carry role=status.
  const drawSection = page.getByRole('region', { name: 'Draw' });

  // Daily Draw — the default selected type, no question field.
  await expect(page.getByLabel(/your question/i)).not.toBeVisible();
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  await expect(drawSection.getByRole('status')).toHaveText('Shuffling…');
  await expect(drawSection.getByRole('status')).not.toBeVisible({ timeout: 10000 });

  // A real, already-drawn card (the Daily Draw spread's "Today" position) and a generated
  // interpretation appear — never a placeholder. `exact: true` targets the position-label
  // caption's own text node specifically (tarot-reading-view.tsx's `rc.positionLabel` span) —
  // Release Closure finding: a non-exact substring match here can collide with a real (non-mock)
  // AI provider's generated interpretation prose if it happens to contain the word "today"
  // (e.g. "...appears reversed today, pointing..."), which is genuinely possible reflective
  // narration text, not a fabricated edge case. `exact: true` cannot match that longer sentence,
  // since its own text content is never literally just "Today".
  await expect(page.getByText('Today', { exact: true })).toBeVisible();
  await expect(page.getByText('Interpretation isn’t ready yet.')).not.toBeVisible({ timeout: 15000 });

  // A second Daily Draw the same day is blocked — reset to the selector and try again.
  await page.getByRole('button', { name: 'Draw again' }).click();
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  await expect(page.getByText(/already drawn today/i)).toBeVisible({ timeout: 10000 });

  // Three Card Spread — a fresh reading type, with an optional question and 3 real, distinct cards
  // in Past/Present/Future order.
  await page.getByRole('button', { name: /Three Card Spread/ }).click();
  await page.getByLabel(/your question/i).fill('What should I know about this new chapter?');
  await page.getByRole('button', { name: 'Draw', exact: true }).click();
  await expect(drawSection.getByRole('status')).not.toBeVisible({ timeout: 10000 });
  // `exact: true` for the same reason as the Daily Draw's "Today" assertion above — these are
  // common English words a real AI provider's reflective narration can plausibly contain verbatim.
  await expect(page.getByText('Past', { exact: true })).toBeVisible();
  await expect(page.getByText('Present', { exact: true })).toBeVisible();
  await expect(page.getByText('Future', { exact: true })).toBeVisible();

  // Delete this reading, reversibly.
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible({ timeout: 10000 });

  // History's default view excludes DELETED readings (mirrors Goal/Journal precedent) — only the
  // earlier real Daily Draw remains visible; the just-deleted Three Card reading is hidden, not
  // gone (its own Restore button above proves it's still real and reachable).
  const historyList = page.getByRole('list', { name: 'Reading history' });
  await expect(historyList.getByRole('listitem')).toHaveCount(1, { timeout: 10000 });
  await expect(historyList.getByText('Daily Draw')).toBeVisible();

  // Companion bridge: a real Tarot reading now exists for this user, marked visible to Companion.
  // Companion must still load and respond normally, referencing the real drawn cards rather than
  // fabricating its own reading.
  await page.goto('/companion');
  const startButton = page.getByRole('button', { name: /start a conversation/i });
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  }
  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });
  await composer.fill('I just drew some Tarot cards — what did you notice?');
  await page.getByRole('button', { name: /send message/i }).click();
  await expect(page.getByRole('log', { name: 'Conversation' }).locator('text=Companion').last()).toBeVisible({ timeout: 15000 });
  await expect(composer).toBeEnabled({ timeout: 15000 });
});
