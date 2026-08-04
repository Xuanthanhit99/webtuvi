import { test, expect, type Page } from '@playwright/test';

// Flow 14: Journal Foundation (Sprint 4A) — create, edit, refresh, recover draft, archive,
// restore, delete, export, search. Relies on the seeded demo account: demo@beaconvie.local /
// Demo1234!

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('Journal Foundation (Sprint 4A)', () => {
  test('create -> edit (autosave) -> publish -> archive -> restore -> delete -> restore', async ({ page }) => {
    await loginAsDemo(page);

    await page.goto('/journal');
    await page.getByRole('button', { name: 'New entry' }).click();
    await expect(page).toHaveURL(/\/journal\/[^/]+$/, { timeout: 10000 });

    const marker = `flow14-${Date.now()}`;
    const title = page.getByLabel('Title');
    const content = page.getByLabel('Entry content');
    await title.fill(`Entry ${marker}`);
    await content.fill(`This is the body of ${marker}.`);

    // Autosave status eventually settles on "Saved" — the real, server-persisted draft save.
    await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible({ timeout: 10000 });

    // Word/character counts are live and derived from real content, not placeholders.
    await expect(page.getByText(/\d+ words? · \d+ characters? · \d+ min read/)).toBeVisible();

    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText('Published.', { exact: true })).toBeVisible({ timeout: 10000 });

    // Archive, then restore.
    await page.getByRole('button', { name: 'Archive' }).click();
    // exact: true — otherwise this also (correctly) matches the substring "archived." inside the
    // unrelated "This entry is archived. Restore it to keep editing." status paragraph that can
    // render in the same instant during the archive->navigate-away transition.
    await expect(page.getByText('Archived.', { exact: true })).toBeVisible({ timeout: 10000 });

    await page.goto('/journal/archive');
    await expect(page.getByText(`Entry ${marker}`)).toBeVisible({ timeout: 10000 });
    await page.getByText(`Entry ${marker}`).click();
    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(page.getByText('Restored.', { exact: true })).toBeVisible({ timeout: 10000 });

    // Delete (soft) — then recover from "Recently deleted."
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Delete this entry?' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Moved to Recently deleted.')).toBeVisible({ timeout: 10000 });

    await page.goto('/journal/archive');
    await page.getByRole('button', { name: 'Recently deleted' }).click();
    await expect(page.getByText(`Entry ${marker}`)).toBeVisible({ timeout: 10000 });
    await page.getByText(`Entry ${marker}`).click();
    await expect(page.getByText('This entry is in Recently deleted.')).toBeVisible();
    await page.getByRole('button', { name: 'Restore' }).click();
    await expect(page.getByText('Restored.', { exact: true })).toBeVisible({ timeout: 10000 });

    // Clean up: back to a normal state and soft-delete it for good so it doesn't linger in the
    // shared demo account's timeline for future runs.
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Moved to Recently deleted.')).toBeVisible({ timeout: 10000 });
  });

  test('refresh recovers unsaved draft text via the local backup', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/journal');
    await page.getByRole('button', { name: 'New entry' }).click();
    await expect(page).toHaveURL(/\/journal\/[^/]+$/, { timeout: 10000 });
    const url = page.url();

    const marker = `flow14-recover-${Date.now()}`;
    await page.getByLabel('Title').fill(`Recovery test ${marker}`);
    await page.getByLabel('Entry content').fill(`Unsaved text ${marker} that should survive a refresh.`);

    // Refresh immediately — before the debounce would have committed a server-side autosave —
    // so recovery must come from the client-side local backup, not the server's own last save.
    await page.reload();

    await expect(page.getByText(/found unsaved changes/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Recover' }).click();
    await expect(page.getByLabel('Entry content')).toHaveValue(new RegExp(marker));

    // Clean up.
    await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible({ timeout: 10000 });
    await page.goto(url);
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Moved to Recently deleted.')).toBeVisible({ timeout: 10000 });
  });

  test('export downloads a real Markdown file for an entry the user owns', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/journal');
    await page.getByRole('button', { name: 'New entry' }).click();
    await expect(page).toHaveURL(/\/journal\/[^/]+$/, { timeout: 10000 });

    const marker = `flow14-export-${Date.now()}`;
    await page.getByLabel('Title').fill(`Export test ${marker}`);
    await page.getByLabel('Entry content').fill(`Content to export ${marker}.`);
    await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export .md' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.md$/);

    // Clean up.
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Moved to Recently deleted.')).toBeVisible({ timeout: 10000 });
  });

  test('deterministic search finds an entry by title/content', async ({ page }) => {
    await loginAsDemo(page);
    await page.goto('/journal');
    await page.getByRole('button', { name: 'New entry' }).click();
    await expect(page).toHaveURL(/\/journal\/[^/]+$/, { timeout: 10000 });

    const marker = `flow14-search-${Date.now()}`;
    await page.getByLabel('Title').fill(`Searchable ${marker}`);
    await page.getByLabel('Entry content').fill('Some content.');
    await expect(page.getByRole('status').filter({ hasText: /saved/i })).toBeVisible({ timeout: 10000 });
    const entryUrl = page.url();

    await page.goto('/journal');
    await page.getByPlaceholder('Search title and content…').fill(marker);
    await expect(page.getByText(`Searchable ${marker}`)).toBeVisible({ timeout: 10000 });

    // Clean up.
    await page.goto(entryUrl);
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Moved to Recently deleted.')).toBeVisible({ timeout: 10000 });
  });
});
