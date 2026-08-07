import { test, expect, type Page } from '@playwright/test';

// Flow 19: Goal System & Progress Engine (Sprint 5C) — creates a real goal via the UI, tags real
// journal entries with its linkedTag (the same deterministic evidence-matching mechanism the
// backend uses — never AI/semantic matching), and confirms progress/evidence/milestones update
// from that real data, then exercises the pause/resume/archive lifecycle. Relies on the seeded
// demo account: demo@beaconvie.local / Demo1234!

test.describe.configure({ timeout: 180_000 });

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test('Goal creation, real deterministic progress/evidence, milestones, and lifecycle', async ({ page, context }) => {
  await loginAsDemo(page);

  const tag = `goal-flow-${Date.now()}`;

  await page.goto('/goals');
  await expect(page.getByRole('heading', { name: 'Goals', exact: true })).toBeVisible({ timeout: 10000 });

  // Create a METRIC_BASED goal via the real form. Scoped to the dialog — the underlying dashboard's
  // own "Category"/"Type"-labeled filter selects stay mounted behind the overlay, so an unscoped
  // getByLabel would hit Playwright's strict-mode collision (same class already fixed in flow-18).
  // The Title field is targeted by id, not getByLabel — the Companion-visibility checkbox's own
  // label text contains the substring "title" ("mentions its title naturally..."), which collides
  // with a substring getByLabel('Title'); the required-field asterisk markup also makes an
  // exact-match getByLabel unreliable across environments. Same "target by id" pattern already used
  // for #milestone-title below.
  await page.getByRole('button', { name: 'Create goal' }).click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.locator('#goal-title').fill(`Learn Spanish ${tag}`);
  await dialog.getByLabel('Category').selectOption('LEARNING');
  await dialog.getByLabel('Type').selectOption('METRIC_BASED');
  await dialog.getByLabel('Linked tag').fill(tag);
  await dialog.getByLabel('Target value').fill('2');
  await dialog.getByLabel('Target unit').fill('entries');
  await dialog.getByRole('button', { name: 'Create goal' }).click();

  // Creating navigates straight into the new goal's detail view.
  await expect(page.getByRole('heading', { name: `Learn Spanish ${tag}` })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('0%').first()).toBeVisible();
  await expect(page.getByText('No evidence gathered yet.')).toBeVisible();

  const goalUrl = page.url();

  // Seed two real, published, tagged journal entries via the same real API the app uses —
  // mirrors flow-18's own seeding pattern.
  const csrfCookie = (await context.cookies()).find((c) => c.name === 'beaconvie_csrf_token');
  expect(csrfCookie).toBeDefined();
  for (let i = 0; i < 2; i += 1) {
    const created = await page.request.post('http://localhost:4000/journal', {
      data: { title: `Spanish practice ${i} ${tag}`, content: `Notes about ${tag} for the goal system flow test.`, tags: [tag] },
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfCookie!.value },
    });
    expect(created.ok()).toBe(true);
    const body = await created.json();
    const published = await page.request.post(`http://localhost:4000/journal/${body.data.id}/publish`, {
      headers: { 'X-CSRF-Token': csrfCookie!.value },
    });
    expect(published.ok()).toBe(true);
  }

  // Reloading the goal detail recomputes progress from the real evidence just created.
  await page.goto(goalUrl);
  await expect(page.getByText('100%').first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Journal entry tagged/).first()).toBeVisible();
  await expect(page.getByText('Evidence gathered: 2')).toBeVisible();

  // Milestones: add a manual milestone and complete it explicitly — never automatically. Scoped to
  // the milestone's own list item — the goal-level "Complete" action (for the whole goal) shares
  // the exact same label as the milestone-level one, another instance of the same strict-mode
  // collision class fixed above.
  await page.getByRole('button', { name: 'Add milestone' }).click();
  await page.locator('#milestone-title').fill('Reviewed by a tutor');
  await page.getByRole('button', { name: 'Add milestone', exact: true }).click();
  const milestoneItem = page.getByRole('listitem').filter({ hasText: 'Reviewed by a tutor' });
  await expect(milestoneItem).toBeVisible({ timeout: 10000 });
  await milestoneItem.getByRole('button', { name: 'Complete' }).click();
  await expect(milestoneItem.getByText('Completed')).toBeVisible({ timeout: 10000 });

  // History: real lifecycle events, not fabricated.
  await expect(page.getByText(/created\./i)).toBeVisible();

  // Lifecycle: pause -> resume -> archive.
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByRole('button', { name: 'Restore' })).toBeVisible({ timeout: 10000 });

  // Back on the dashboard, an archived goal is excluded from the default (non-archived) list.
  await page.goto('/goals');
  await expect(page.getByText(`Learn Spanish ${tag}`)).not.toBeVisible();
  await page.getByLabel('Status').selectOption('ARCHIVED');
  await expect(page.getByText(`Learn Spanish ${tag}`)).toBeVisible({ timeout: 10000 });
});
