import { test, expect, type Page } from '@playwright/test';

// Flow 15: Reflection Foundation (Sprint 4B) — Journal -> ReflectionCandidate -> Feed -> Dismiss
// -> Archive -> Timeline, plus Phase 11 privacy (a deleted source invalidates its candidate).
// Relies on the seeded demo account: demo@beaconvie.local / Demo1234!
//
// REPEATED_JOURNAL_THEME is used to deterministically trigger a candidate: three PUBLISHED
// journal entries sharing one unique tag always fires it (see reflection-rules.ts), unlike
// text-similarity rules whose exact firing depends on tokenization details.

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function createTaggedJournalEntry(page: Page, title: string, tag: string) {
  await page.goto('/journal');
  await page.getByRole('button', { name: 'New entry' }).click();
  await expect(page).toHaveURL(/\/journal\/[^/]+$/, { timeout: 10000 });

  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Entry content').fill(`Notes tagged ${tag} for the reflection foundation flow test.`);
  await page.getByLabel('Tags, comma separated').fill(tag);
  await page.getByLabel('Title').click(); // blur the tags field so onBlur commits it

  await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Publish' }).click();
  await expect(page.getByText('Published.', { exact: true })).toBeVisible({ timeout: 10000 });

  return page.url();
}

async function deleteJournalEntry(page: Page, url: string) {
  await page.goto(url);
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Moved to Recently deleted.')).toBeVisible({ timeout: 10000 });
}

// This spec creates 6-9 journal entries across two tests plus multiple fresh-route navigations
// (/journal/[id], /reflections) — generous per-test timeouts, matching this suite's own pattern
// for multi-step flows, and accounting for on-demand dev-server route compilation on first hit.
test.describe('Reflection Foundation (Sprint 4B)', () => {
  test.describe.configure({ timeout: 180_000 });

  test('journal pattern -> candidate in feed -> dismiss -> archive -> timeline shows resolution', async ({ page }) => {
    const marker = Date.now();
    const dismissTag = `flow15-dismiss-${marker}`;
    const archiveTag = `flow15-archive-${marker}`;
    const journalUrls: string[] = [];

    await loginAsDemo(page);

    for (let i = 0; i < 3; i += 1) {
      journalUrls.push(await createTaggedJournalEntry(page, `Dismiss source ${i} ${marker}`, dismissTag));
    }
    for (let i = 0; i < 3; i += 1) {
      journalUrls.push(await createTaggedJournalEntry(page, `Archive source ${i} ${marker}`, archiveTag));
    }

    // --- Feed: the deterministic rule fired a real candidate citing the 3 tagged entries. ---
    await page.goto('/reflections');
    const dismissReason = page.getByText(new RegExp(`tagged 3 journal entries "${dismissTag}"`, 'i'));
    await expect(dismissReason).toBeVisible({ timeout: 10000 });

    await dismissReason.click();
    await page.waitForURL(/\?item=/); // wait for the SPA transition off the feed list before asserting on detail-only content
    // exact: true — otherwise this substring-matches inside the "Repeated journal theme" trigger badge too.
    await expect(page.getByText('Journal theme', { exact: true })).toBeVisible();
    await expect(page.getByText('Repeated journal theme')).toBeVisible();
    // Every cited source is real evidence, linking back to the actual journal entries.
    await expect(page.getByRole('link', { name: /journal entry/i })).toHaveCount(3);

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByText('Dismissed.', { exact: true })).toBeVisible({ timeout: 10000 });

    // Back on the feed, the dismissed candidate is gone — never resurrected.
    await expect(page.getByText(new RegExp(`tagged 3 journal entries "${dismissTag}"`, 'i'))).toHaveCount(0);

    // --- Archive the second candidate. ---
    const archiveReason = page.getByText(new RegExp(`tagged 3 journal entries "${archiveTag}"`, 'i'));
    await expect(archiveReason).toBeVisible({ timeout: 10000 });
    await archiveReason.click();
    await page.waitForURL(/\?item=/);
    await page.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText('Archived.', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(new RegExp(`tagged 3 journal entries "${archiveTag}"`, 'i'))).toHaveCount(0);

    // --- Timeline: both resolved candidates are still visible there (never hidden by default,
    // only excluded from the active Feed) — open each and confirm its resolved state. ---
    await page.getByRole('button', { name: 'Timeline' }).click();
    await dismissReason.click();
    await page.waitForURL(/\?item=/);
    await expect(page.getByText('You dismissed this reflection.')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Back' }).click();
    await page.waitForURL((url) => !url.search.includes('item='));

    await page.getByRole('button', { name: 'Timeline' }).click();
    await archiveReason.click();
    await page.waitForURL(/\?item=/);
    await expect(page.getByText('You archived this reflection.')).toBeVisible({ timeout: 10000 });

    // Clean up the 6 journal entries so the shared demo account stays tidy for future runs.
    for (const url of journalUrls) {
      await deleteJournalEntry(page, url);
    }
  });

  test('deleting a source journal entry invalidates its still-active candidate (Phase 11 privacy)', async ({ page }) => {
    const tag = `flow15-expire-${Date.now()}`;
    const journalUrls: string[] = [];

    await loginAsDemo(page);
    for (let i = 0; i < 3; i += 1) {
      journalUrls.push(await createTaggedJournalEntry(page, `Expire source ${i} ${tag}`, tag));
    }

    await page.goto('/reflections');
    const reason = page.getByText(new RegExp(`tagged 3 journal entries "${tag}"`, 'i'));
    await expect(reason).toBeVisible({ timeout: 10000 });
    await reason.click();
    await expect(page).toHaveURL(/\?item=/);
    const reflectionUrl = page.url();

    // Delete just one of the three cited journal entries.
    await deleteJournalEntry(page, journalUrls[0]!);

    // Revisiting the reflection re-validates against current data and finds an invalid source.
    await page.goto(reflectionUrl);
    await expect(page.getByText("One of the entries behind this reflection was deleted, so it's no longer valid.")).toBeVisible({
      timeout: 10000,
    });

    // It no longer appears in the active Feed.
    await page.goto('/reflections');
    await expect(reason).toHaveCount(0);

    // Clean up the remaining entries.
    await deleteJournalEntry(page, journalUrls[1]!);
    await deleteJournalEntry(page, journalUrls[2]!);
  });
});
