import { execSync } from 'child_process';
import path from 'path';
import { test, expect, type Page } from '@playwright/test';

// Flow 29: Admin Operator Tooling (Interim Sprint, while Vietnamese Tử Vi Sprint 18 remains
// BLOCKED_BY_DOMAIN_REFERENCE — see docs/audit/sprint-18-pre-implementation-audit.md). Verifies the
// real operator surface end to end: an ADMIN can reach Operator Tools and run all five read-only
// lookups against real fixture data, and — critically — a normal USER is denied both at the UI
// (no Operator Tools content ever renders) and at the API itself (a real 403 from /admin/*, not
// just a hidden link). See docs/audit/admin-operator-tooling-pre-implementation-audit.md §22/§23
// for the full test/attack plan this flow is drawn from.
//
// ADMIN provisioning: there is no API for this by design (no `POST /admin/promote-me` — see the
// audit §13). This flow uses the one real mechanism that exists — the `admin:promote` CLI script
// (apps/api/prisma/promote-admin.ts), shelled out from Node here exactly as an operator would run
// it against a real database — not a shortcut around AdminGuard, the same mechanism under test.

test.describe.configure({ timeout: 180_000 });

const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_DIR = path.resolve(__dirname, '../../api');

/** Promotes via the already-generated Prisma Client directly (plain `node`, no `ts-node`/TS
 * compilation) — functionally identical to running `pnpm admin:promote` (same Prisma update, same
 * real DB write an operator's CLI run would make), just lighter-weight to spawn mid-test. See
 * apps/api/prisma/promote-admin.ts for the canonical, documented CLI version of this exact update. */
function promoteToAdmin(email: string): void {
  const script = `const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.update({where:{email:${JSON.stringify(email)}},data:{role:'ADMIN'}}).then(()=>p.$disconnect()).catch((e)=>{console.error(e);process.exit(1)});`;
  execSync(`node -e "${script.replace(/"/g, '\\"')}"`, { cwd: API_DIR, stdio: 'pipe' });
}

async function registerAndOnboard(page: Page, label: string): Promise<{ email: string }> {
  const email = `flow29-${label}-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Display name').fill(`Flow TwentyNine ${label}`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Sup3r$ecretPass');
  await page.getByLabel('Confirm password').fill('Sup3r$ecretPass');
  await page.getByLabel(/agree to the/).check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page).toHaveURL(/\/onboarding/);
  const replyInput = page.getByLabel('Your reply');
  await replyInput.fill('Just here to look around today.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText(/hardest part/i)).toBeVisible({ timeout: 10000 });
  await replyInput.fill('Nothing in particular, just getting set up.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByRole('button', { name: 'Yes, remember this' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Yes, remember this' }).click();

  await expect(page.getByRole('button', { name: 'Maybe later' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Maybe later' }).click();

  await expect(page.getByRole('button', { name: 'Go to Dashboard' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Go to Dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  return { email };
}

test('ADMIN can reach Operator Tools and run all five read-only lookups against real data', async ({ page }) => {
  // A second, target user for the lookup fixtures — created directly over the API, not through the
  // UI, matching flow-27's own "direct API calls for setup, not the system under test" precedent.
  const targetEmail = `flow29-target-${Date.now()}@example.com`;
  await page.request.post(`${API_BASE_URL}/auth/register`, {
    data: { email: targetEmail, displayName: 'Flow TwentyNine Target', password: 'Sup3r$ecretPass', confirmPassword: 'Sup3r$ecretPass', acceptedTerms: true },
  });

  const { email: adminEmail } = await registerAndOnboard(page, 'admin');
  promoteToAdmin(adminEmail);

  // The promotion took effect in the DB; re-navigating triggers a fresh /auth/me read (middleware +
  // AuthProvider), which is exactly the "live, next request" guarantee under test.
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: 'Operator Tools' })).toBeVisible({ timeout: 10000 });
  await page.getByRole('link', { name: 'Operator Tools' }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('heading', { name: 'Operator Tools' })).toBeVisible();

  // 1. User lookup
  await page.getByLabel('Email or user id').fill(targetEmail);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText(targetEmail)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('USER', { exact: true }).first()).toBeVisible();

  // 2. Entitlement lookup (real, empty — target user never purchased Premium)
  await expect(page.getByText('No entitlement history')).toBeVisible({ timeout: 10000 });

  // 3. Payment lookup (real, empty)
  await expect(page.getByText('No orders on record')).toBeVisible({ timeout: 10000 });

  // 4. Notification health (aggregate, always loaded)
  await expect(page.getByText('Scheduler-run telemetry: not collected')).toBeVisible({ timeout: 10000 });

  // 5. AI spend (aggregate, always loaded, defaults to "today")
  await expect(page.getByText('Estimated cost')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Requests')).toBeVisible();
});

test('a normal USER cannot reach Operator Tools — denied at the UI, and denied by the API itself, not just a hidden link', async ({ page }) => {
  await registerAndOnboard(page, 'plain-user');

  await expect(page.getByRole('link', { name: 'Operator Tools' })).not.toBeVisible();

  // Direct navigation — a curious authenticated non-admin must not see a "no permission" page that
  // confirms the feature exists, and must not see any Operator Tools content.
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Operator Tools' })).not.toBeVisible();
  await expect(page.getByText('Operator Tools')).not.toBeVisible();

  // The actual security boundary: a real API call, sharing this page's session cookies, must be
  // rejected by AdminGuard — this is not inferred from the UI being hidden.
  const response = await page.request.get(`${API_BASE_URL}/admin/notifications/health`);
  expect(response.status()).toBe(403);
  const body = await response.json();
  expect(body.error.code).toBe('ADMIN_REQUIRED');
});
