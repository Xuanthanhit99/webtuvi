# Founder Production Action Pack

**Purpose:** the exact, concrete list of things only you (or a role you delegate — legal counsel, a
hosting/ops contact) can provide. Nothing here is engineering-actionable — every item below is
blocked on a real-world decision, account, or credential that doesn't exist in this repository.
Companion document: `docs/operations/production-activation-checklist.md` (the engineering-side
execution plan this pack feeds into).

No secret values are printed anywhere in this document, or should ever be pasted into chat/a
document like this — hand credentials directly into the deployment environment when the time comes,
not through this pack.

---

## DOMAIN

**Locked by founder decision** (Domain + Brand Production Lock, see
`docs/progress/domain-brand-production-lock-final-report.md`) — no longer open items:

- [x] **Final frontend domain** — `tuvitarot.vn`.
- [x] **Final API domain** — `api.tuvitarot.vn`.

Still needed:

- [ ] **DNS access** — either direct access to the DNS provider for `tuvitarot.vn`, or a named
  contact who can add records on request. See `docs/operations/production-activation-checklist.md`
  §9 for the exact records needed (`tuvitarot.vn`, `www.tuvitarot.vn`, `api.tuvitarot.vn`).

**Why engineering needs this first:** almost everything else on this list (webhook registration,
CORS, cookies, TLS, email sender verification) is blocked on these two domains existing and
resolving.

---

## HOSTING

- [ ] **Hosting provider chosen** — where `apps/api` and `apps/web` will actually run (a specific
  provider, not "we'll figure it out later" — `TRUST_PROXY`'s correct value depends entirely on
  this choice and cannot be set correctly without it).
- [ ] **Managed Postgres provisioned** (or access to provision it) on that provider.
- [ ] **Managed Redis provisioned** (or access to provision it) on that provider.
- [ ] **Backup offering confirmed** — most managed database providers include automated backups;
  confirm it's enabled for whichever one is chosen.

---

## PAYOS

- [ ] **Merchant/account created** — a real PayOS business account exists (not a sandbox/test
  account, unless the plan is to launch payments in a sandboxed/soft-launch mode intentionally).
- [ ] **Production client ID / API credential available** — from the PayOS merchant dashboard.
- [ ] **Checksum/signature secret available** — from the same dashboard (this is what verifies
  webhook authenticity — treat it with the same care as a password).
- [ ] **Production price approved** — the exact VND amount for Premium (current code default is
  79,000 VND; confirm this is still the intended price or provide the real one).
- [ ] **Production return/cancel URLs approved** — where a buyer lands after completing or
  abandoning checkout (these are frontend routes on the real domain, confirmed once the domain
  exists).
- [ ] **Explicit authorization for one real (or PayOS-sandbox) test transaction** before payments
  go fully live — engineering will not initiate any real financial transaction without this.

---

## EMAIL

- [ ] **Provider selected** — `Resend` or `Postmark` (the two the codebase already supports; a
  different provider would require new code, out of scope for activation).
- [ ] **Account created** with the chosen provider.
- [ ] **Sending domain verified** — the provider will require adding DNS records (SPF/DKIM) to the
  domain above; needs DNS access (see DOMAIN section).
- [ ] **Production sender address approved** — the exact "From" address users will see (e.g.
  `hello@tuvitarot.vn`).
- [ ] **Credential available** — the provider's API key/server token, once the account exists.

---

## SENTRY (error monitoring — recommended, not launch-blocking)

- [ ] **Project created** at sentry.io (or self-hosted, if preferred).
- [ ] **Frontend and backend DSNs available** — Sentry gives you these once a project exists; a DSN
  is not a secret in the traditional sense (it's write-only), but still needs to come from a real
  project.

**Why this matters even though it's not a hard launch blocker:** without it, a production incident
is invisible except through manual log inspection — no error is ever proactively surfaced.

---

## POSTHOG (product analytics — not launch-blocking)

- [ ] **Project created** at posthog.com (or self-hosted).
- [ ] **Project key / host available** — PostHog gives you these once a project exists.

---

## LEGAL

- [ ] **Approved Privacy Policy** — the current live page is explicitly labeled a "Sprint 1
  placeholder." A short, accurate factual brief for whoever drafts the real one: Tử Vi Tarot collects
  conversation/journal/Discovery data (Tarot, Numerology, Natal Chart, Eastern Horoscope, birth
  date/time/location where applicable), uses AI providers (OpenAI/Anthropic/Gemini, selectable) to
  generate interpretations, offers account export and full account deletion (which removes all
  personal content but retains anonymized payment records for accounting), and will use PayOS for
  payment processing and (once activated) Sentry for error monitoring and PostHog for anonymous
  product analytics. Two known factual gaps in the current placeholder copy for the drafter to
  fold in: it doesn't yet mention Eastern Horoscope or Personal Destiny Report data specifically
  (both are covered by deletion already, the copy just hasn't caught up), and it doesn't mention
  analytics tracking exists at all.
- [ ] **Approved Terms of Service** — same "Sprint 1 placeholder" status. Current placeholder's
  core claims (not medical/psychological/financial advice, crisis-line disclaimer, good-faith-use
  clause) were independently re-checked this pass and are still factually accurate — the real draft
  can build on them rather than starting from nothing.
- [ ] **Refund policy decision** — no policy exists anywhere yet, and no code currently implements
  or assumes one. A decision here doesn't require new engineering work to prepare for; it does
  block launch of paid features responsibly.
- [ ] **Tax/invoice policy decision** — same status as refund policy: no document, no code
  assumption, needs a real decision.
- [ ] **Payment-record retention period** — the *mechanism* is already built correctly (deleting an
  account keeps payment/entitlement records for accounting but scrubs all personal-identity fields
  from them) — what's missing is the specific retention *duration* policy to confirm that mechanism
  against.

---

## SUMMARY — WHAT BLOCKS WHAT

Domain/brand are now locked (`tuvitarot.vn` / Tử Vi Tarot). If you can only act on one thing first:
**the hosting provider decision**. It's the single remaining item that unblocks the largest number
of everything else on this list (DNS pointing, webhook registration, CORS, cookies, TLS, email
sender verification, `TRUST_PROXY`'s correct value).

If you can act on things in parallel: legal (Privacy/Terms/refund/tax) and the three external
accounts (PayOS, email provider, Sentry/PostHog) don't depend on each other or on the domain
decision — any of them can start immediately, independently.

**Nothing on this list requires new engineering work to prepare for.** Every corresponding
engineering step (setting the resulting env vars, running migrations, verifying the smoke suite) is
already documented in `docs/operations/production-activation-checklist.md` and ready to execute the
moment each item above is resolved.
