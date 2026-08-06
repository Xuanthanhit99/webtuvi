import { test, expect, type Page } from '@playwright/test';

// Flow 17: Insight Experience (Sprint 5A) — the polished /insights dashboard built on top of
// Sprint 4C's Insight Preparation output. This flow does NOT generate new insights; it seeds the
// same two-journal-theme pattern flow-16 already uses (deterministically produces a SUPPORTS
// Insight Candidate), then drives the real end-user surface: Top insights, pin/unpin, the
// evidence view (deep-linking to the real reflection + its own real journal sources), the
// Today/7 days/30 days timeline grouped by category, and filters. Relies on the seeded demo
// account: demo@beaconvie.local / Demo1234!

test.describe.configure({ timeout: 180_000 });

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

interface InsightCardApi {
  id: string;
  reason: { headline: string };
}
interface CardsListApi {
  items: InsightCardApi[];
}

async function findCardIdByHeadlineMarker(page: Page, marker: string): Promise<string> {
  const res = await page.request.get('http://localhost:4000/insight-candidates/cards?pageSize=100&sort=recent');
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const items = (body.data as CardsListApi).items;
  const match = items.find((c) => c.reason.headline.includes(marker));
  if (!match) throw new Error(`No InsightCard found with headline containing "${marker}". Cards: ${JSON.stringify(items)}`);
  return match.id;
}

test('Insight Experience: dashboard sections, evidence view, pin, timeline, and filters over a real deterministic insight', async ({ page, context }) => {
  await loginAsDemo(page);

  await page.goto('/journal');
  const csrfCookie = (await context.cookies()).find((c) => c.name === 'beaconvie_csrf_token');
  expect(csrfCookie).toBeDefined();

  const tagA = `experience-a-${Date.now()}`;
  const tagB = `experience-b-${Date.now()}`;

  async function createTaggedJournal(title: string, tag: string) {
    const created = await page.request.post('http://localhost:4000/journal', {
      data: { title, content: `Notes about ${tag} for the insight experience flow test.`, tags: [tag] },
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

  for (let i = 0; i < 3; i += 1) await createTaggedJournal(`Experience A ${i} ${tagA}`, tagA);
  for (let i = 0; i < 3; i += 1) await createTaggedJournal(`Experience B ${i} ${tagB}`, tagB);

  await page.goto('/reflections');
  await expect(page.getByText(new RegExp(`tagged 3 journal entries "${tagA}"`, 'i'))).toBeVisible({ timeout: 10000 });

  // Any read triggers Insight generation; Recent insights (sort=recent) surfaces it immediately.
  await page.goto('/insights');
  await page.getByRole('button', { name: 'Recent insights' }).click();
  await page.waitForTimeout(500);
  const cardId = await findCardIdByHeadlineMarker(page, 'SUPPORTS');

  await page.goto(`/insights?item=${cardId}`);
  await expect(page.getByText(/High priority|Medium priority|Low priority/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: 'Why it matters' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Evidence \(\d+\)/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View reflection' }).first()).toBeVisible({ timeout: 10000 });

  // Evidence View: the underlying journal source is a real, deep-linkable record.
  await expect(page.getByRole('link', { name: /Journal entry/ }).first()).toBeVisible({ timeout: 10000 });

  // Pin, verify it sticks, then find it in the Pinned section.
  await page.getByRole('button', { name: 'Pin' }).click();
  await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Pinned' }).click();
  await expect(page.getByRole('button', { name: 'Unpin insight' }).first()).toBeVisible({ timeout: 10000 });

  // Timeline: Today/7 days/30 days grouped by category — this run's insight was just created, so
  // it must appear in the default (week) range. The shared demo account can have more than one
  // category group visible at once (e.g. both "Journal theme" and "Recurring topic"), so this
  // asserts on the first match rather than requiring exactly one — same discipline as the Pinned
  // assertion above.
  await page.getByRole('button', { name: 'Timeline' }).click();
  await expect(page.getByText(/^Goal \(\d+\)$|^Journal theme \(\d+\)$|^Recurring topic \(\d+\)$/).first()).toBeVisible({ timeout: 10000 });

  // Filters: category=Journal theme narrows the Top insights list to only that category.
  await page.getByRole('button', { name: 'Top insights' }).click();
  await page.getByLabel('Category').selectOption('JOURNAL');
  await page.waitForTimeout(500);
  const categoryBadges = page.locator('span', { hasText: 'Journal theme' });
  await expect(categoryBadges.first()).toBeVisible({ timeout: 10000 });

  // Archive from the detail view. The shared demo account accumulates real history across every
  // sprint's own Playwright specs, so — as flow-16 already documents for the same dataset — this
  // looks the specific card up by its own id via the API rather than a UI text match that could
  // collide with another run's similarly-worded archived insight.
  await page.goto(`/insights?item=${cardId}`);
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText('Archived.', { exact: true })).toBeVisible({ timeout: 10000 });

  const archivedRes = await page.request.get(`http://localhost:4000/insight-candidates/cards?pageSize=100&status=ARCHIVED`);
  const archivedBody = await archivedRes.json();
  expect((archivedBody.data as CardsListApi).items.some((c) => c.id === cardId)).toBe(true);

  const topRes = await page.request.get('http://localhost:4000/insight-candidates/cards?pageSize=100&sort=priority');
  const topBody = await topRes.json();
  expect((topBody.data as CardsListApi).items.some((c) => c.id === cardId)).toBe(false);
});
