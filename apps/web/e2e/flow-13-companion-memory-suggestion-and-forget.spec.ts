import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Flow 13: Companion + Memory Integration (Sprint 3C) — the release-closure browser flow:
// Conversation -> Memory suggestion appears -> Remember -> Memory is accepted -> a later
// conversation retrieves it -> "Why I remembered" is visible -> the source/View link works ->
// Forget -> confirm deletion -> a later conversation no longer retrieves it. Also covers Not
// now, Never remember this type, consent disabled, ambiguous forget, and that
// MemorySuggestionCard/ForgetSuggestionCard/MemoryUsedSection are real rendered components, not
// placeholders.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!
// Requires DEFAULT_AI_PROVIDER=mock (the local/CI default).

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function setGlobalConsent(page: Page, mode: 'ASK_EVERY_TIME' | 'ALLOW_TYPE' | 'DISABLED') {
  await page.goto('/memory');
  await page.getByRole('button', { name: 'Memory settings' }).click();
  await page.getByLabel(/when beaconvie could remember something/i).selectOption(mode);
  await expect(page.getByText(/memory setting updated/i)).toBeVisible();
}

/** Starts a fresh conversation and returns its composer plus the resulting URL (`?c=<id>`) —
 * the sidebar lists conversations only as "Untitled conversation Xm ago," never by content, so
 * reopening a specific one later requires the saved URL, not a text-based sidebar lookup. */
async function startNewConversation(page: Page): Promise<{ composer: Locator; url: string }> {
  await page.goto('/companion');
  const startButton = page.getByRole('button', { name: /start a conversation/i });
  if (await startButton.isVisible().catch(() => false)) {
    await startButton.click();
  } else {
    await page.getByRole('button', { name: /new conversation/i }).click();
  }
  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\?c=/);
  return { composer, url: page.url() };
}

/** Deletes a memory by a phrase that appears in its (untruncated) summary, via the standalone
 * Memory page — keeps the shared demo account from accumulating test-only memories across runs. */
async function deleteMemoryByPhrase(page: Page, phrase: string) {
  await page.goto('/memory');
  await page.getByText(phrase, { exact: false }).first().click();
  await expect(page.getByLabel('Memory detail')).toBeVisible();
  await page.getByRole('button', { name: /^delete$/i }).click();
  await page.getByRole('dialog').getByRole('button', { name: /^delete$/i }).click();
  await expect(page.getByText(/memory permanently deleted/i)).toBeVisible();
}

async function sendAndWaitForReply(page: Page, composer: Locator, content: string) {
  await composer.fill(content);
  await page.getByRole('button', { name: /send message/i }).click();
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText(content)).toBeVisible();
  // Assistant reply completes and the composer returns to idle.
  await expect(page.getByRole('log', { name: 'Conversation' }).locator('text=Companion').last()).toBeVisible({ timeout: 15000 });
  await expect(composer).toBeEnabled({ timeout: 15000 });
}

async function rememberFromSuggestion(page: Page) {
  const suggestionCard = page.getByLabel('Memory suggestion');
  await expect(suggestionCard).toBeVisible({ timeout: 10000 });
  await suggestionCard.getByRole('button', { name: 'Remember', exact: true }).click();
  await expect(page.getByText(/^remembered\.$/i)).toBeVisible({ timeout: 10000 });
}

test.describe('Companion + Memory Integration (Sprint 3C)', () => {
  test('suggestion -> remember -> later retrieval -> why I remembered -> view -> forget -> no later retrieval', async ({ page }) => {
    await loginAsDemo(page);
    await setGlobalConsent(page, 'ALLOW_TYPE');

    // `marker` embeds the timestamp inside one atomic, space-free token (not "marathon <ts>")
    // so it can never collide with another flow's own real fixture words that happen to share
    // a topic — e.g. flow-9 permanently leaves "Training for a half marathon" memories in this
    // same shared demo account, which would otherwise also match a plain "marathon" context
    // filter. Kept short (well under the suggestion detector's 60-char title cap, including the
    // "My goal is to " prefix) so the full unique phrase always survives into the memory's
    // title, not just its (untruncated) summary.
    const marker = `zq${Date.now()}`;
    const uniqueGoal = `finish the ${marker} challenge`;
    const { composer: composerA } = await startNewConversation(page);
    await composerA.fill(`My goal is to ${uniqueGoal}.`);
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(uniqueGoal, { exact: false })).toBeVisible();

    // Accessibility + Product Polish (2026-08-19): Companion surface scan, with a real user
    // message rendered (exercises the "Remember this" accessible-name-disambiguation fix — see
    // remember-this-button.tsx — at its real, populated state, not an empty conversation).
    const companionScan = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();
    expect(companionScan.violations, JSON.stringify(companionScan.violations, null, 2)).toEqual([]);

    // A real MemorySuggestionCard, not a placeholder — badge + all five real actions.
    const suggestionCardA = page.getByLabel('Memory suggestion');
    await expect(suggestionCardA).toBeVisible({ timeout: 10000 });
    await expect(suggestionCardA.getByText(/this sounds worth remembering/i)).toBeVisible();
    await expect(suggestionCardA.getByRole('button', { name: 'Remember', exact: true })).toBeVisible();
    await expect(suggestionCardA.getByRole('button', { name: 'Not now' })).toBeVisible();
    await expect(suggestionCardA.getByRole('button', { name: /never remember this type/i })).toBeVisible();
    await rememberFromSuggestion(page);
    await expect(suggestionCardA).not.toBeVisible();

    // Later conversation: memory is retrieved, and MemoryUsedSection (a real component, not a
    // placeholder) renders it. This section is built from *persisted* data (message.memoryUsed),
    // so — unlike the suggestion/forget cards — it survives navigating away and back.
    //
    // The message below deliberately shares `marker` with the memory just created: this demo
    // account is a long-lived, shared fixture that other Playwright flows (7/8/9) also remember
    // GOAL-type memories into without ever deleting them, so a generic message would fall back
    // to importance/recency ranking across everything in the account and could easily not
    // surface this specific one within the 5-memory-per-turn cap. Sharing the unique token
    // instead triggers `MemoryRetrievalService`'s context-match filter, which narrows the
    // candidate set to only this memory — deterministic regardless of how much unrelated
    // fixture data has accumulated in the account. See memory-retrieval.service.ts's
    // `filterByContext` and docs/architecture/memory-intelligence.md "Retrieval algorithm."
    const { composer: composerB, url: conversationBUrl } = await startNewConversation(page);
    await sendAndWaitForReply(page, composerB, `How's the ${marker} challenge going?`);

    const memoryUsedToggle = page.getByRole('button', { name: /show memory used/i });
    await expect(memoryUsedToggle).toBeVisible({ timeout: 10000 });
    await memoryUsedToggle.click();

    const memoryCard = page.getByLabel('Memory card').filter({ hasText: uniqueGoal });
    await expect(memoryCard).toBeVisible();

    // "Why I remembered" is visible and is a real explanation, never "I always remember." The
    // toggle button is a *sibling* of MemoryCard within MemoryUsedItem, not nested inside it
    // (see memory-used-section.tsx), so it's looked up at the page level, not scoped to
    // `memoryCard`.
    await page.getByRole('button', { name: /why i remembered this/i }).first().click();
    const explanationText = page.locator('p').filter({ hasText: /i remembered this because/i });
    await expect(explanationText).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/i always remember/i)).not.toBeVisible();

    // The source/View link works — navigates to the real Memory detail for this exact memory.
    await memoryCard.getByRole('button', { name: 'View' }).click();
    await expect(page).toHaveURL(/\/memory\?item=/);
    await expect(page.getByLabel('Memory detail')).toBeVisible();
    await expect(page.getByLabel('Memory detail').getByText(uniqueGoal, { exact: false }).first()).toBeVisible();

    // Forget it from the same Memory Card UI Companion renders (Phase 6), with an explicit,
    // understandable confirmation step — reopen the exact conversation that showed it.
    await page.goto(conversationBUrl);
    const memoryUsedToggle2 = page.getByRole('button', { name: /show memory used/i });
    await expect(memoryUsedToggle2).toBeVisible({ timeout: 10000 });
    await memoryUsedToggle2.click();
    const memoryCard2 = page.getByLabel('Memory card').filter({ hasText: uniqueGoal });
    await expect(memoryCard2).toBeVisible();
    await memoryCard2.getByRole('button', { name: 'Forget' }).click();
    await expect(page.getByRole('heading', { name: /forget this memory\?/i })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Forget' }).click();
    await expect(page.getByText(/memory permanently deleted/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /forget this memory\?/i })).not.toBeVisible();

    // A later conversation no longer retrieves it.
    const { composer: composerC } = await startNewConversation(page);
    await sendAndWaitForReply(page, composerC, 'Just checking in, nothing specific today.');
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(uniqueGoal, { exact: false })).not.toBeVisible();

    await setGlobalConsent(page, 'ASK_EVERY_TIME');
  });

  test('Not now dismisses a suggestion without creating a memory; Never remember this type stops future suggestions of that type', async ({ page }) => {
    await loginAsDemo(page);
    await setGlobalConsent(page, 'ASK_EVERY_TIME');

    const notNowPhrase = `I really like trying new espresso blends ${Date.now()}`;
    const { composer } = await startNewConversation(page);
    await composer.fill(notNowPhrase);
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(notNowPhrase, { exact: false })).toBeVisible();

    const suggestionCard = page.getByLabel('Memory suggestion');
    await expect(suggestionCard).toBeVisible({ timeout: 10000 });
    await suggestionCard.getByRole('button', { name: 'Not now' }).click();
    await expect(suggestionCard).not.toBeVisible();

    // Nothing was created — the phrase never appears in the Memory timeline.
    await page.goto('/memory');
    await expect(page.getByText(notNowPhrase, { exact: false })).not.toBeVisible();

    // Never remember this type — future PREFERENCE suggestions stop appearing.
    const neverPhrase = `I love hiking on weekends ${Date.now()}`;
    const { composer: composer2 } = await startNewConversation(page);
    await composer2.fill(neverPhrase);
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(neverPhrase, { exact: false })).toBeVisible();
    const suggestionCard2 = page.getByLabel('Memory suggestion');
    await expect(suggestionCard2).toBeVisible({ timeout: 10000 });
    await suggestionCard2.getByRole('button', { name: /never remember this type/i }).click();
    await expect(suggestionCard2).not.toBeVisible();

    const laterPreferencePhrase = `I really enjoy quiet mornings ${Date.now()}`;
    const { composer: composer3 } = await startNewConversation(page);
    await composer3.fill(laterPreferencePhrase);
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(laterPreferencePhrase, { exact: false })).toBeVisible();
    await expect(page.getByLabel('Memory suggestion')).not.toBeVisible({ timeout: 5000 });

    // Restore PREFERENCE to the default so no other flow run is affected — targeted by the
    // Dropdown's real element id (`type-consent-PREFERENCE`, set by ConsentSettings), not a
    // fragile text/DOM-structure lookup that can silently no-op and leave DENY_TYPE stuck.
    await page.goto('/memory');
    await page.getByRole('button', { name: 'Memory settings' }).click();
    await expect(page.locator('#type-consent-PREFERENCE')).toBeVisible({ timeout: 10000 });
    await page.locator('#type-consent-PREFERENCE').selectOption('ASK_EVERY_TIME');
    await expect(page.getByText(/memory setting updated/i)).toBeVisible();
  });

  test('a detected forget-intent renders a real ForgetSuggestionCard, and confirming deletes it', async ({ page }) => {
    await loginAsDemo(page);
    await setGlobalConsent(page, 'ALLOW_TYPE');

    const phrase = `Trying to read one book a month this year ${Date.now()}`;
    const { composer } = await startNewConversation(page);
    await composer.fill(`My goal is to ${phrase}.`);
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(phrase, { exact: false })).toBeVisible();
    await rememberFromSuggestion(page);

    const composer2 = page.getByLabel(/message your companion/i);
    await composer2.fill('Actually, forget that.');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText('Actually, forget that.')).toBeVisible();

    const forgetCard = page.getByLabel('Forget suggestion');
    await expect(forgetCard).toBeVisible({ timeout: 10000 });
    await expect(forgetCard.getByRole('button', { name: /yes, forget/i })).toBeVisible();
    await expect(forgetCard.getByRole('button', { name: 'Cancel' })).toBeVisible();

    await forgetCard.getByRole('button', { name: /yes, forget/i }).click();
    await expect(page.getByText(/^forgotten\.$/i)).toBeVisible({ timeout: 10000 });

    await page.goto('/memory');
    await expect(page.getByText(phrase, { exact: false })).not.toBeVisible();

    await setGlobalConsent(page, 'ASK_EVERY_TIME');
  });

  test('consent disabled prevents retrieval of a previously-accepted memory in a later conversation', async ({ page }) => {
    await loginAsDemo(page);
    await setGlobalConsent(page, 'ALLOW_TYPE');

    const phrase = `Learning to play the piano this year ${Date.now()}`;
    const { composer } = await startNewConversation(page);
    await composer.fill(`My goal is to start ${phrase}.`);
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(phrase, { exact: false })).toBeVisible();
    await rememberFromSuggestion(page);

    await setGlobalConsent(page, 'DISABLED');

    const { composer: composer2 } = await startNewConversation(page);
    await sendAndWaitForReply(page, composer2, 'Nothing much new today.');
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(phrase, { exact: false })).not.toBeVisible();

    await setGlobalConsent(page, 'ASK_EVERY_TIME');
    await deleteMemoryByPhrase(page, phrase);
  });

  test('an ambiguous "delete everything about X" match shows every candidate and Cancel deletes nothing', async ({ page }) => {
    await loginAsDemo(page);
    await setGlobalConsent(page, 'ALLOW_TYPE');
    const topic = `kayaking trips ${Date.now()}`;

    for (const phrase of [`My goal is to plan more ${topic} this summer.`, `I really like ${topic} on weekends.`]) {
      const { composer } = await startNewConversation(page);
      await composer.fill(phrase);
      await page.getByRole('button', { name: /send message/i }).click();
      await expect(page.getByRole('log', { name: 'Conversation' }).getByText(topic, { exact: false })).toBeVisible();
      await rememberFromSuggestion(page);
    }

    const { composer: composer2 } = await startNewConversation(page);
    await composer2.fill(`Delete everything about ${topic}.`);
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('log', { name: 'Conversation' }).getByText(`Delete everything about ${topic}.`)).toBeVisible();

    const forgetCard = page.getByLabel('Forget suggestion');
    await expect(forgetCard).toBeVisible({ timeout: 10000 });
    await expect(forgetCard.getByRole('listitem')).toHaveCount(2);

    // Cancel — the card closes and nothing is deleted, even though it listed real candidates.
    await forgetCard.getByRole('button', { name: 'Cancel' }).click();
    await expect(forgetCard).not.toBeVisible();

    await page.goto('/memory');
    await expect(page.getByText(topic, { exact: false }).first()).toBeVisible();

    // Clean up both test memories (both share `topic` in their summary) so repeated runs of
    // this suite don't accumulate test-only memories in the shared demo account.
    await deleteMemoryByPhrase(page, topic);
    await deleteMemoryByPhrase(page, topic);

    await setGlobalConsent(page, 'ASK_EVERY_TIME');
  });
});
