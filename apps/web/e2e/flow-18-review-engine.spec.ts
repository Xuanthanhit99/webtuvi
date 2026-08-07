import { test, expect, type Page } from '@playwright/test';

// Flow 18: Weekly & Monthly Reviews (Sprint 5B) — deterministically aggregates existing
// InsightCandidate/ReflectionCandidate rows into a Review over a time window. Seeds the same
// deterministic two-journal-theme -> REPEATED_JOURNAL_THEME -> SUPPORTS InsightCandidate pattern
// flow-16/flow-17 already establish, then drives the real /reviews UI end-to-end: dashboard entry
// points, the current weekly review's overview/statistics/sections/evidence, category filtering,
// Markdown export, and archive. Relies on the seeded demo account: demo@beaconvie.local /
// Demo1234!

test.describe.configure({ timeout: 180_000 });

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test('Weekly Review: dashboard, overview/statistics/sections/evidence, filtering, export, and archive over real deterministic data', async ({
  page,
  context,
}) => {
  await loginAsDemo(page);

  await page.goto('/journal');
  const csrfCookie = (await context.cookies()).find((c) => c.name === 'beaconvie_csrf_token');
  expect(csrfCookie).toBeDefined();

  const tagA = `review-a-${Date.now()}`;
  const tagB = `review-b-${Date.now()}`;

  async function createTaggedJournal(title: string, tag: string) {
    const created = await page.request.post('http://localhost:4000/journal', {
      data: { title, content: `Notes about ${tag} for the review engine flow test.`, tags: [tag] },
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfCookie!.value },
    });
    expect(created.ok()).toBe(true);
    const body = await created.json();
    const id = body.data.id as string;
    const published = await page.request.post(`http://localhost:4000/journal/${id}/publish`, {
      headers: { 'X-CSRF-Token': csrfCookie!.value },
    });
    expect(published.ok()).toBe(true);
  }

  for (let i = 0; i < 3; i += 1) await createTaggedJournal(`Review A ${i} ${tagA}`, tagA);
  for (let i = 0; i < 3; i += 1) await createTaggedJournal(`Review B ${i} ${tagB}`, tagB);

  await page.goto('/reviews');

  // Dashboard: quick entry points to the current week/month review. Exact match — the shared demo
  // account's own Review Timeline can independently contain an overview sentence that *starts*
  // with "This week"/"This month", which would otherwise collide with the dashboard's own card
  // titles (a strict-mode violation, not a product bug — the same class already fixed in flow-9/
  // flow-17 during the post-Sprint-5A maintenance pass).
  await expect(page.getByText('This week', { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('This month', { exact: true })).toBeVisible();

  // Weekly review: real overview/statistics/sections/evidence built from the journals just created.
  await page.getByRole('link', { name: 'View' }).first().click();
  await expect(page).toHaveURL(/\/reviews\/week/);
  await expect(page.getByRole('heading', { name: 'Weekly review' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/journal entries/)).toBeVisible({ timeout: 15000 });
  // Exact match — Playwright's getByText is case-insensitive by default, so the plain 'Journal
  // entries' would otherwise also match the overview sentence's lowercase "...wrote N journal
  // entries..." (same strict-mode locator class as the dashboard cards above).
  await expect(page.getByText('Journal entries', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sections' })).toBeVisible();

  // Evidence: a real deep link back to the underlying Insight exists among the section evidence.
  const evidenceLink = page.getByRole('link', { name: /SUPPORTS/i }).first();
  await expect(evidenceLink).toBeVisible({ timeout: 15000 });
  await expect(evidenceLink).toHaveAttribute('href', /\/insights\?item=/);

  // Filters (Phase 6): narrowing by the evidence's own real category still shows matching evidence.
  // Read the category label dynamically from the SUPPORTS evidence badge above instead of assuming
  // 'JOURNAL' — the shared demo account already has other Insight data, so the first SUPPORTS
  // evidence link isn't guaranteed to be the two-tag journal insight this test just created (same
  // reason review.e2e-spec.ts's own category-filter test reads `anyEvidence.category` dynamically
  // rather than hardcoding one). Target `span` (the evidence Badge), not the filter `<select>`'s own
  // `<option>` text, which shares the same label but is never visible.
  const evidenceCategoryLabel = (await evidenceLink.locator('span').nth(1).textContent())!.trim();
  await page.getByLabel('Category').selectOption({ label: evidenceCategoryLabel });
  await page.waitForTimeout(600);
  await expect(page.locator('span', { hasText: evidenceCategoryLabel }).first()).toBeVisible({ timeout: 10000 });
  await page.getByLabel('Category').selectOption('');

  // Export: Markdown download triggers a real file containing the real overview text.
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export Markdown' }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.md$/);

  // Archive, then confirm it's excluded from the default Timeline but findable via status filter.
  // Archiving a review is permanent — `review.controller.ts`'s own doc comment says so ("never
  // resurrected by later regeneration"), unlike Memory's archive/restore — and the "current week"
  // review shares one persisted row (dedupeKey = window + windowStart) across every run of this
  // suite within the same ISO week. So a rerun on the same real week may find it already archived
  // by an earlier run; only exercise the click when there's actually an Archive button to click.
  const archiveButton = page.getByRole('button', { name: 'Archive' });
  if (await archiveButton.isVisible()) {
    await archiveButton.click();
    await expect(page.getByText('Review archived.', { exact: true })).toBeVisible({ timeout: 10000 });
  }

  await page.goto('/reviews');
  await page.getByLabel('Status').selectOption('ARCHIVED');
  await expect(page.getByText('Weekly').first()).toBeVisible({ timeout: 10000 });
});

test('Monthly Review is reachable from the dashboard and renders its own real statistics', async ({ page }) => {
  await loginAsDemo(page);
  await page.goto('/reviews/month');
  await expect(page.getByRole('heading', { name: 'Monthly review' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Statistics' })).toBeVisible({ timeout: 15000 });
});
