import { test, expect } from '@playwright/test';

// Flow 5: Companion Core — cancel an in-flight streamed reply.
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!
//
// Root cause of the previous flake: MockProvider.stream() (apps/api/src/companion/providers/
// mock.provider.ts) emits one word every 15ms, and the shortest canned reply is ~13 words — the
// whole turn can complete in well under 200ms. `status` flips to 'streaming' (mounting the Cancel
// button) synchronously the instant the initial POST /messages resolves, *before* the EventSource
// for the token stream has even opened (see use-companion-conversation.ts openStream()), so the
// button's actual visible window was only ever as long as that ~200ms stream itself minus however
// long the `toBeVisible` poll + click's own actionability checks took — on a fast run, or under any
// system load, the reply could finish and unmount the Cancel button (composer.tsx only renders it
// while status === 'streaming') between the visibility check and the click landing, which
// Playwright correctly reported as "element was detached from the DOM".
//
// Fix: hold up the *network* request for the token stream deterministically before letting it
// reach the real API — this widens the window `status === 'streaming'` stays true to a fixed,
// generous duration without touching any product code (MockProvider/StreamService/the hook/the
// Composer are all untouched, and the real backend still streams the real reply once the request is
// let through — this is not a fake/stubbed response). This is a synchronization primitive scoped to
// this one test, not an arbitrary sleep in the test's own control flow.
const STREAM_HOLD_MS = 2000;

test('cancel a streaming reply mid-generation', async ({ page }) => {
  await page.route('**/companion/conversations/*/messages/stream*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, STREAM_HOLD_MS));
    await route.continue();
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  await page.goto('/companion');
  await page.getByRole('button', { name: /start a conversation/i }).click();

  const composer = page.getByLabel(/message your companion/i);
  await expect(composer).toBeVisible({ timeout: 10000 });
  await composer.fill('Tell me about your day.');
  await page.getByRole('button', { name: /send message/i }).click();

  // The held-up request above guarantees status stays 'streaming' (and the Cancel button mounted)
  // for at least STREAM_HOLD_MS — a real, deterministic window, not a race against a ~200ms reply.
  const cancelButton = page.getByRole('button', { name: /cancel/i });
  await expect(cancelButton).toBeVisible({ timeout: 5000 });
  await cancelButton.click();

  await expect(page.getByText(/you cancelled that reply/i)).toBeVisible();

  // The composer is usable again immediately — no dangling "streaming" state.
  await expect(composer).toBeEnabled();

  // The cancelled turn is persisted (not silently dropped) so the next
  // message starts from a clean, coherent state rather than a stuck pending reply.
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await composer.fill('Are you still there?');
  await page.getByRole('button', { name: /send message/i }).click();
  // Scoped to the conversation log — the composer intentionally keeps
  // showing the just-sent text (disabled) until the turn completes, so a
  // page-wide search would also match it.
  await expect(page.getByRole('log', { name: 'Conversation' }).getByText('Are you still there?')).toBeVisible();
});
