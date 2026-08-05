import { test, expect, type Page } from '@playwright/test';

// Flow 16: Insight Preparation Engine (Sprint 4C) — Journal patterns -> two related Reflection
// Candidates -> an Insight Candidate citing both as evidence with a SUPPORTS relationship ->
// Archive. Relies on the seeded demo account: demo@beaconvie.local / Demo1234!
//
// Two REPEATED_JOURNAL_THEME reflections (same category JOURNAL, different tags, created close
// together in time) deterministically classify as SUPPORTS — see insight-relationship.util.ts.
//
// The shared demo account accumulates real history across every sprint's own Playwright specs, so
// more than one JOURNAL-category SUPPORTS cluster can legitimately exist at once. Rather than
// guessing which list card is "the right one" from generic list text, this test looks up the
// exact candidate id via the API (searching evidence contribution text for this run's own unique
// tags) and navigates straight to it — the same "find the real thing by its real, unique marker"
// discipline the rest of this suite's Playwright specs already use for Journal/Memory content.

test.describe.configure({ timeout: 180_000 });

async function loginAsDemo(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@beaconvie.local');
  await page.getByLabel('Password', { exact: true }).fill('Demo1234!');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

interface InsightEvidenceApi {
  contribution: string;
}
interface InsightCandidateApi {
  id: string;
  evidence: InsightEvidenceApi[];
}

async function findCandidateIdByEvidenceMarker(page: Page, marker: string): Promise<string> {
  const res = await page.request.get('http://localhost:4000/insight-candidates?pageSize=100');
  if (!res.ok()) {
    const text = await res.text().catch(() => '<unreadable>');
    throw new Error(`GET /insight-candidates failed: ${res.status()} ${text}`);
  }
  const body = await res.json();
  const items = body.data.items as InsightCandidateApi[];
  const match = items.find((c) => c.evidence.some((e) => e.contribution.includes(marker)));
  if (!match) throw new Error(`No insight candidate found citing evidence containing "${marker}". Candidates: ${JSON.stringify(items)}`);
  return match.id;
}

test('two related journal patterns produce an Insight Candidate with real evidence and a SUPPORTS relationship, then archive removes it from the default view', async ({ page, context }) => {
  await loginAsDemo(page);

  // Bootstrap CSRF for the direct API calls below (the browser context already carries the
  // session cookie from login; the CSRF cookie is set by any GET the app itself makes).
  await page.goto('/journal');
  const csrfCookie = (await context.cookies()).find((c) => c.name === 'beaconvie_csrf_token');
  expect(csrfCookie).toBeDefined();

  const tagA = `insight-a-${Date.now()}`;
  const tagB = `insight-b-${Date.now()}`;

  async function createTaggedJournal(title: string, tag: string) {
    const created = await page.request.post('http://localhost:4000/journal', {
      data: { title, content: `Notes about ${tag} for the insight preparation flow test.`, tags: [tag] },
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfCookie!.value },
    });
    expect(created.ok()).toBe(true);
    const body = await created.json();
    const id = body.data.id as string;
    const published = await page.request.post(`http://localhost:4000/journal/${id}/publish`, {
      headers: { 'X-CSRF-Token': csrfCookie!.value },
    });
    expect(published.ok()).toBe(true);
    return id;
  }

  for (let i = 0; i < 3; i += 1) await createTaggedJournal(`Insight A ${i} ${tagA}`, tagA);
  for (let i = 0; i < 3; i += 1) await createTaggedJournal(`Insight B ${i} ${tagB}`, tagB);

  // Visiting /reflections first ensures both REPEATED_JOURNAL_THEME candidates exist before
  // Insight Preparation reads them (Insight Preparation also regenerates Reflection itself, but
  // this makes the causal order explicit and matches how a real user would arrive here).
  await page.goto('/reflections');
  await expect(page.getByText(new RegExp(`tagged 3 journal entries "${tagA}"`, 'i'))).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(new RegExp(`tagged 3 journal entries "${tagB}"`, 'i'))).toBeVisible({ timeout: 10000 });

  // Trigger Insight generation (any read endpoint does) before looking the candidate up by id.
  await page.goto('/insights/internal');
  await page.waitForTimeout(500);
  const candidateId = await findCandidateIdByEvidenceMarker(page, tagA);

  await page.goto(`/insights/internal?item=${candidateId}`);
  await expect(page.getByText(/connected by SUPPORTS/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(new RegExp(`tagged 3 journal entries "${tagA}"`, 'i'))).toBeVisible();
  await expect(page.getByText(new RegExp(`tagged 3 journal entries "${tagB}"`, 'i'))).toBeVisible();
  await expect(page.getByText('Supports').first()).toBeVisible();

  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText('Archived.', { exact: true })).toBeVisible({ timeout: 10000 });

  // The archived candidate no longer resolves via the default (unfiltered-by-ARCHIVED) list —
  // the same way Reflection's own Feed excludes resolved candidates.
  const listRes = await page.request.get('http://localhost:4000/insight-candidates?pageSize=100');
  const listBody = await listRes.json();
  const stillListed = (listBody.data.items as InsightCandidateApi[]).some((c) => c.id === candidateId);
  expect(stillListed).toBe(false);
});
