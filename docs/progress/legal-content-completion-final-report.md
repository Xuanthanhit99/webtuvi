# Legal Content Completion — Final Report (2026-08-22)

Response to "Legal Content Completion + Pre-Live Legal Readiness." Closes the known blocker from
`docs/progress/final-product-closure-report.md` §15/§23: the Privacy Notice and Terms of Service
pages carried literal "Sprint 1 placeholder" copy. This is an engineering pass that replaces
placeholder text with real, product-grounded content — **not** a legal approval. No fact was
invented; every claim below is traced to a specific source file, and every fact only a founder or
authorized legal reviewer can supply is left as an explicit, visible placeholder rather than guessed.

---

## 1. Recovered repository state

```
HEAD (start) = 95714fc47064d46db7b7d1d7a03c6230a2040454
origin/master = 1eb91056496538a302c48d284fa78f73082f4929
ahead/behind = 1 / 0
working tree: clean at session start
```

Matches the baseline the task prompt asserted — verified, not trusted. No inherited or unexplained
changes were found.

## 2. Legal surfaces audited

`/privacy`, `/terms`, `/contact`, the registration form's Terms/Privacy consent checkbox
(`register-form.tsx`), Settings' `LegalLinksSection` (Privacy/Terms/Contact links), account
deletion (`account-deletion.service.ts`), account export (`account-export.service.ts`), cookie/
session handling (`env.validation.ts`, auth cookie config), analytics (`analytics.service.ts`,
`AnalyticsEventProperties`), AI/provider usage (`env.validation.ts`, Discovery interpretation
services, Companion), payment (PayOS checkout/webhook/entitlement services), and community/UGC
(none found — no such feature exists in the product).

Global search for `Sprint 1 placeholder / placeholder / TODO / TBD / BeaconVie / Mệnh Vi / coming
soon / draft privacy / draft terms / temporary legal / legal placeholder` across
`apps/web/app|components|features`:

| Finding | Classification |
|---|---|
| `privacy/page.tsx` "plain-language summary for Sprint 1" | Real placeholder — **fixed this pass** |
| `terms/page.tsx` "placeholder summary for Sprint 1" | Real placeholder — **fixed this pass** |
| `contact/page.tsx` `mailto:hello@beaconvie.local` | Real placeholder, non-resolving domain — **not fixed** (needs a real provisioned address, an external/founder action, not an engineering guess — flagged in the decision register, §10) |
| `apps/web/app/menh-vi/layout.tsx` doc-comment "BeaconVie is the sole canonical production brand" | Stale comment inside a 404-only, unreachable archived route; never rendered. Not fixed — cosmetic, non-user-facing, already flagged P3 in the prior closure report |
| 10 "BeaconVie" strings in Memory sub-components | Already-documented, already-deferred (prior remediation pass); not reopened this pass — out of this task's scope (not a legal-surface page) |
| Every other hit | Historical audit/progress docs (`docs/audit/*`, `docs/operations/*`, `docs/progress/*`) correctly describing past state — not rewritten, per instruction not to blindly edit history |

No `TODO`/`TBD`/"coming soon"/"draft privacy"/"draft terms"/"temporary legal"/"legal placeholder"
strings were found on any live legal surface.

## 3. Factual data-practice audit

Derived directly from `account-deletion.service.ts`, `account-export.service.ts`,
`analytics.service.ts`, `sentry-scrub.util.ts`, `env.validation.ts`, and the relevant Prisma models
— not inferred or assumed.

| Data / feature | Collected? | Purpose | Storage | Retention known? | Third party? | User control | Legal copy discloses it? |
|---|---|---|---|---|---|---|---|
| Account identity (email, display name, password hash) | Yes | Auth, identity | Postgres (`User`) | Kept until deletion; then scrubbed/anonymized | No | Export, delete | **Yes — now** (§2, §14) |
| Date/time of birth | Yes (Tử Vi, Natal Chart, Numerology*) | Deterministic chart/reading calculation | Postgres, per-system table | Kept until deletion | No | Export, delete | **Yes — now** (§4) |
| Sex/gender field | Yes (Tử Vi only) | Deterministic Tử Vi direction rule | Postgres (`TuViChart.sex`) | Kept until deletion | No | Export, delete | **Yes — now** (§4) |
| Birth location | Yes (Natal Chart only) | Geocoding to resolve chart coordinates | Postgres; search text also sent to Nominatim | Kept until deletion | **Yes** — OpenStreetMap Nominatim (search text only) | Export, delete | **Yes — now** (§4, §16) |
| Tử Vi chart data | Yes | Core product feature | Postgres (`TuViChart` + history) | Kept until deletion | No (engine is local) | Export, delete, archive/restore | **Yes — now** (§4) |
| Tarot readings | Yes | Core product feature | Postgres (`TarotReading`) | Kept until deletion | No | Export, delete | **Yes — now** (§5) |
| Natal Chart data | Yes | Core product feature | Postgres | Kept until deletion | No | Export, delete | **Yes — now** (§4) |
| Numerology data | Yes | Core product feature | Postgres | Kept until deletion | No | Export, delete | **Yes — now** (§4) |
| Eastern Horoscope data | Yes | Core product feature | Postgres | Kept until deletion | No | Export, delete | **Yes — now** (§4) |
| Journal | Yes | User feature | Postgres | Kept until deletion | No | Export, delete | Yes (general "content you write") |
| Memory | Yes | Companion personalization | Postgres | Kept until deletion; granular per-type consent already exists in-product | No | Export, delete, consent settings | Yes (general) |
| Companion conversations | Yes | Core product feature | Postgres | Kept until deletion | **Yes** — AI provider (content of messages) | Export, delete | **Yes — now** (§6) |
| Reports (Destiny Reports) | Yes | Premium feature | Postgres | Kept until deletion | No (synthesizes already-stored facts) | Export, delete | Yes (general "Discovery readings") |
| Community content | **No** — no such feature exists | — | — | — | — | — | N/A — correctly not claimed |
| Uploaded content | **No** — no file-upload feature exists | — | — | — | — | — | N/A |
| Device/session information | Yes | Auth | HttpOnly cookies (JWT access 15m / refresh 30d) | Expires per token lifetime | No | Logout, session list in Settings | **Yes — now** (§9) |
| IP address | Yes, transiently | Login rate-limiting/abuse prevention | Not persisted as a queryable log (used by the throttler guard) | Short-lived (rate-limit window) | No | N/A (not user-facing data) | **Yes — now** (§9) |
| Analytics | Conditional — only when `POSTHOG_API_KEY` is configured; currently **not configured** | Product usage understanding | PostHog (when enabled) | `OWNER/LEGAL DECISION REQUIRED` — no retention policy set by this codebase; provider-default | **Yes** — PostHog (allowlisted properties only) | None currently surfaced as an opt-out control in-app | **Yes — now** (§7) |
| Sentry/error telemetry | Conditional — only when `SENTRY_DSN` is configured; currently **not configured** | Bug diagnosis | Sentry (when enabled) | `OWNER/LEGAL DECISION REQUIRED` — provider-default, not set by this codebase | **Yes** — Sentry (allowlist-scrubbed) | None (operational, not user content) | **Yes — now** (§8) |
| Email address (for delivery) | Yes | Verification, password reset, notifications | Postgres + sent to email provider | Kept until deletion | **Yes** — Resend or Postmark (not yet selected/configured for production) | Notification preferences in Settings | **Yes — now** (§16) |
| Payment records | Yes | Accounting, entitlement | Postgres (`PaymentOrder`, `PaymentWebhookEvent`, `PremiumEntitlement`) — **explicitly retained after account deletion** | `OWNER/LEGAL DECISION REQUIRED` — no duration set in code | **Yes** — PayOS (checkout only; raw card data never touches this app's servers) | None post-deletion (by design, for accounting integrity) | **Yes — now** (§10, §14, §15) |
| AI provider payloads | Yes | Interpretation generation, Companion replies | Not persisted separately from the app's own DB; sent live to the active provider per request | N/A — provider-side retention is `OWNER/LEGAL DECISION REQUIRED` (depends on which provider's own data-use terms apply) | **Yes** — one of OpenAI/Anthropic/Gemini | Consent gate exists for model-training use (not for inference use, which is required to generate the feature itself) | **Yes — now** (§6) |

\* Numerology also collects the user's **full birth name** (not just date of birth) — now disclosed
in §4.

**No retention duration was invented.** Where the code establishes no explicit policy (payment
records, analytics, Sentry, AI-provider-side retention), the Privacy Notice now says so explicitly
and flags it `OWNER/LEGAL DECISION REQUIRED` rather than asserting a number.

## 4. Third-party processor audit

| Provider | Supported by product (code exists)? | Configured in production? | What it receives |
|---|---|---|---|
| OpenAI / Anthropic / Google (Gemini) | Yes — one selected via `DEFAULT_AI_PROVIDER` | **No** — production credentials not confirmed (`production-activation-checklist.md` §12: dev-tier keys present, prod-tier unconfirmed); `DEFAULT_AI_PROVIDER=mock` is structurally blocked from running when `NODE_ENV=production` | Already-computed Discovery facts (for interpretation) or Companion message content |
| Resend / Postmark (email) | Yes — both supported, selected via `EMAIL_PROVIDER` | **No** — `EMAIL_PROVIDER=mailpit` (local dev) currently; no provider chosen, `production-activation-checklist.md` §16 still `Not selected` | Email address, message content (verification/reset/notification emails) |
| Sentry (error monitoring) | Yes — `enabled: !!SENTRY_DSN` | **No** — `SENTRY_DSN` not set (`production-activation-checklist.md` §19–20: `Not created`/`Not set`) | Scrubbed, allowlisted technical error data only (§sentry-scrub.util.ts) |
| PostHog (analytics) | Yes — `NoopAnalyticsSink` used absent a key | **No** — `POSTHOG_API_KEY` not set (§21–22: `Not created`/`Not set`) | Allowlisted coarse event properties only |
| PayOS (payments) | Yes — full checkout/webhook/entitlement flow implemented | **No** — `PAYOS_MOCK_CHECKOUT=true` currently; production credential authenticity unconfirmed (§11–13: `Unknown if real`/`authenticity unverified`) | Checkout details (handled directly by PayOS, never routed through this app's servers); this app receives back only order status/amount/currency via signed webhook |
| OpenStreetMap Nominatim (geocoding) | Yes — Natal Chart place-of-birth search only | **Yes, already live** — this is a free public service called directly from the backend at request time, not a "configure later" credential; already in active use in any running environment, including this local one | User's typed place-of-birth search text |
| Hosting provider | N/A — not a product feature | **No** — not yet chosen (`founder-production-action-pack.md` "HOSTING" section, all unchecked) | Everything (infrastructure-level, not a specific data type) |

**Production is not configured for AI, email, Sentry, PostHog, or PayOS today** — the Privacy
Notice's §16 states this distinction explicitly (providers "can receive," not "do receive," except
Nominatim which is factually already live in any running deployment of this code).

## 5. Privacy Notice — what changed

Full rewrite of `apps/web/app/(marketing)/privacy/page.tsx`: replaced the 4-paragraph placeholder
with 22 numbered `MvSection`s (reusing the existing `MvSection` component already exported from
`@/components/ui/mv-page` — no new UI component, no page redesign) covering every topic listed in
the task brief §Phase 5. Every fact stated is traceable to a specific source file (§3/§4 above).
Facts not present in the repository (legal entity name, registered address, exact retention
durations for payment/analytics/Sentry data, minimum age, applicable statutory rights, cross-border
transfer mechanism, a real contact address) are rendered as a visibly distinct
`[Owner/Legal to confirm: ...]` placeholder (a small inline component, `OwnerPlaceholder`, styled
with the existing `text-text-tertiary italic` tokens already used elsewhere in this codebase for
caveat text — e.g. Premium's "MVP test price" note) — never silently asserted as fact.

## 6. Terms of Service — what changed

Full rewrite of `apps/web/app/(marketing)/terms/page.tsx`: replaced the 2-paragraph placeholder with
15 numbered sections covering every topic in Phase 6, using the same `MvSection`/`OwnerPlaceholder`
pattern. Preserved the existing not-medical/psychological/financial-advice and crisis-line
disclaimer verbatim in substance (§2). Added the required "no guaranteed prediction"/AI-generated-
content-limitation language (§2–§3) and the Tử Vi/Tarot deterministic-vs-AI distinction (§1, §7 of
the audit). Refund policy, governing law, dispute jurisdiction, tax/invoice handling, and limitation-
of-liability language are explicitly left as `OWNER/LEGAL` placeholders — none were invented, per
the task's explicit stop condition B/C.

**Premium/payment facts stated (§8) are code-verified, not assumed:** one-time purchase, 30-day
grant, no auto-renewal (`entitlement.service.ts` extends from the current furthest `expiresAt`
rather than resetting — confirming a stacking, non-recurring model, not a subscription), processed
via PayOS, exact price shown in-app before payment, current MVP-test-price status disclosed
(matches `premium-upgrade-panel.tsx`'s own `isMvpTestPrice` flag).

## 7. Third-party processor matrix

See §4 above.

## 8. Data-practice matrix

See §3 above.

## 9. Founder/legal decision register

| ID | Question | Why required | Current product behavior | Safe default if any | Blocks launch? | Founder action | Legal review required? |
|---|---|---|---|---|---|---|---|
| LEGAL-01 | What is the legal entity name and registration that operates this service? | Required to identify "who operates the service" in any real privacy notice or terms of service | Not established anywhere in the repo | None — cannot default | **Yes** | Supply legal entity name + registration details | Yes |
| LEGAL-02 | What is the registered/contact business address? | Standard legal-notice requirement in most jurisdictions | Not established | None | **Yes** | Supply address | Yes |
| LEGAL-03 | What is a real, monitored support/contact email address? | Current `hello@beaconvie.local` is a non-resolving placeholder domain | `apps/web/app/(marketing)/contact/page.tsx` | None — cannot fabricate a working mailbox | **Yes** | Provision and confirm a real address | No (operational, not legal, but blocks the Contact page and the Privacy Notice's §22) |
| LEGAL-04 | What retention period applies to payment/accounting records kept after account deletion? | `AccountDeletionService` deliberately retains `PaymentOrder`/`PaymentWebhookEvent`/`PremiumEntitlement` with no duration set in code | Retained indefinitely today (no expiry logic exists) | Common practice is jurisdiction-driven (often 5–10 years for accounting records) — **not assumed here** | **Yes** (for payments specifically) | Decide + document | Yes |
| LEGAL-05 | What retention period applies to analytics/error-monitoring data once those providers are configured? | No retention policy is set by this codebase; would default to the provider's own default | Not yet configured in production at all (§4) | Provider default, once chosen | No (analytics/Sentry are optional, non-launch-blocking per the existing activation checklist) | Decide + document once a provider is selected | Recommended |
| LEGAL-06 | What is the minimum age to use the service, and is any parental-consent handling required? | No age gate exists in registration (`RegisterDto` has no age/DOB field beyond feature-specific birth-date inputs used only for chart calculation, never age-gating) | No minimum age enforced today | None — age-gating is a product decision with real UX impact (a form field, a rejection flow) | **Yes** | Decide the age policy and, if adopted, request the corresponding product change separately | Yes |
| LEGAL-07 | What is the refund policy, if any? | Terms cannot state a refund policy that doesn't exist in a documented decision | No refund logic exists in code; `production-activation-checklist.md` §25 already tracks this as "Undecided, no doc" | None | **Yes** (for payments) | Decide + document | Yes |
| LEGAL-08 | What is the governing law and dispute-resolution jurisdiction? | Standard ToS requirement; incorrect or invented language can be actively harmful/unenforceable | Not established | None — cannot default | **Yes** | Confirm jurisdiction | Yes |
| LEGAL-09 | What is the tax/invoice handling for Premium payments? | `production-activation-checklist.md` §26 already tracks this as "Undecided, no doc" | Not established | None | **Yes** (for payments) | Decide + document | Yes |
| LEGAL-10 | What limitation-of-liability language is appropriate to the operating entity/jurisdiction? | An incorrect clause can be unenforceable; depends on LEGAL-01/LEGAL-08 | Generic "as is" disclaimer only (§11 of Terms) | None | **Yes** | Supply or approve specific language, once LEGAL-01/08 resolved | Yes |
| LEGAL-11 | Which specific statutory data-subject rights (GDPR, Vietnamese data protection law, etc.) apply to users, beyond the self-service export/delete already in-product? | Depends on where users are located and which law applies — an engineering guess here could either overstate or understate real rights | Self-service export/delete already exists and is already disclosed (§13–14 of Privacy Notice) | None | No (self-service rights already work regardless of which named statute applies) | Confirm which regimes apply | Yes |
| LEGAL-12 | What cross-border transfer mechanism or safeguard applies once AI/email/Sentry/analytics providers and hosting are finalized? | Depends on final provider/hosting choices, none of which are made yet | Not applicable yet — nothing is configured in production | None | No (blocks full production readiness, not engineering readiness) | Confirm once providers/hosting are chosen | Yes |

## 10. Cross-surface consistency check

Compared against homepage (`app/page.tsx`), Premium (`premium/page.tsx` +
`premium-upgrade-panel.tsx`), Settings, registration (`register-form.tsx`), the Tử Vi trust section
(`tu-vi-trust-section.tsx`), Tarot, Companion, and Reports. No material contradiction found:

- Deterministic-vs-AI framing in the new Privacy Notice (§6) and Terms (§1, §3) matches the existing
  in-product trust language verbatim in substance ("AI does not calculate... it only narrates").
- Premium's "one-time, 30-day, MVP test price" framing (existing, unchanged) matches the new Terms
  §8 exactly — verified against `entitlement.service.ts` and `premium-upgrade-panel.tsx`, not merely
  copied from memory.
- No page claims a guaranteed prediction; no page claims Community/UGC exists.
- Registration's existing "You need to accept the Terms and Privacy Notice to continue" consent
  checkbox (`RegisterDto.acceptedTerms`, unchanged) still links to both updated pages — no code
  change was needed there, since it already linked by path (`/terms`, `/privacy`), not by content.

No stale product copy was found that needed a "clearly factual and low-risk" fix under this task's
Phase 8 — no page redesign was performed.

## 11. Release readiness classification

| Finding | Priority | Owner |
|---|---|---|
| Privacy/Terms placeholder text | Was P0 (blocking Go/No-Go) | **ENGINEERING — resolved this pass** |
| Real legal entity/address/jurisdiction/refund/tax/retention facts (LEGAL-01 through LEGAL-12) | P0 for full public launch readiness | **FOUNDER + LEGAL — unresolved, explicitly flagged, not resolved by this pass** |
| Real contact address (`hello@beaconvie.local`) | P1 | **FOUNDER** |
| Minimum-age product decision + implementation, if adopted | P1 | **FOUNDER**, then **ENGINEERING** for the resulting product change |
| Stale "BeaconVie" comment in `menh-vi/layout.tsx` | P3 (cosmetic, non-user-facing) | ENGINEERING, not fixed this pass (out of scope — not a legal surface) |
| Analytics/Sentry retention once configured | P2 (non-launch-blocking today; both are optional/unconfigured) | **FOUNDER + LEGAL** |

No item is labeled "complete" merely because a draft now exists — every P0/P1 item above that
requires a fact this repository doesn't contain remains explicitly open.

## 12. Tests

New: `apps/web/app/(marketing)/privacy/page.test.tsx` (6 tests), `apps/web/app/(marketing)/terms/page.test.tsx`
(7 tests) — 13 total, all passing. Assertions deliberately avoid pinning exact prose (which will
keep evolving with founder/legal input) and instead prove structural/factual properties: no
placeholder text remains, no stale brand names appear, the required section headings exist, the
deterministic-vs-AI and no-guaranteed-prediction language is present, Premium is described as
non-recurring, and `OwnerPlaceholder` markers exist rather than invented facts.

Existing `legal-links-section.test.tsx` (Privacy/Terms/Contact hrefs) re-run — still passes
unchanged, since no href changed.

## 13. Regression evidence (this pass, fresh, real exit codes)

| Check | Result |
|---|---|
| Targeted new tests (`privacy/page.test.tsx`, `terms/page.test.tsx`) | 13/13 pass |
| Full frontend unit (`pnpm test:web`) | **100 suites / 519 tests pass** (up from 506 — the 13 new tests) |
| Frontend typecheck | Clean |
| Backend typecheck | Clean (unaffected — no backend file touched) |
| Frontend lint | **Failed once, genuinely** (4 real `react/no-unescaped-entities` errors — raw `'`/`"` characters in the new copy), **fixed, then clean** — see §14 |
| Backend lint | Clean, 0 errors, 24 pre-existing unrelated warnings (unchanged) |
| Web production build (`next build`) | **Compiled successfully (19s)**, typecheck/lint passed inline, **all 53/53 static pages generated**, then failed only at "Collecting build traces" with the identical `EPERM` Windows-symlink signature (same package, `@jridgewell/gen-mapping`) documented in every prior closure report on this machine — confirmed genuinely matching precedent, not assumed. `PREEXISTING_ENVIRONMENT_ARTIFACT`, not a regression |
| `git diff --check` | Clean |

## 14. Bugs found and fixed this pass

**`LINT_DEFECT` (real, self-introduced, caught and fixed before this report was finalized):** the
first draft of both pages used raw `'` and `"` characters inside JSX text in four places instead of
the `&rsquo;`/`&ldquo;`/`&rdquo;` HTML entities the rest of the file (and this codebase's convention)
uses — `react/no-unescaped-entities` genuinely failed `pnpm lint` (4 errors, 0 warnings) on the first
run. Fixed by replacing the four raw characters with their entity equivalents; `pnpm lint` re-run
clean (0 errors) immediately after.

## 15. Files changed

**Modified:** `apps/web/app/(marketing)/privacy/page.tsx`, `apps/web/app/(marketing)/terms/page.tsx`.
**New:** `apps/web/app/(marketing)/privacy/page.test.tsx`, `apps/web/app/(marketing)/terms/page.test.tsx`,
`docs/progress/legal-content-completion-final-report.md` (this file).
No backend file, migration, or production configuration was touched.

## 16. Git diff check

Clean (`git diff --check`, no conflict markers, no line-ending errors beyond this environment's
existing benign CRLF advisories).

## 17. Commit / push / deployment status

**Not committed, not pushed, not deployed** — left as reviewable working-tree state, per this
task's explicit git policy (no `git add .`/`git add -A`, no commit without further instruction).

## 18. Unresolved blockers

Twelve founder/legal decisions (§9, `LEGAL-01`–`LEGAL-12`) remain open — none resolved by this pass,
none invented. The real contact address and minimum-age policy are the two with the most direct
product-surface impact once decided.

## 19. Final verdict

**LEGAL CONTENT ENGINEERING PASS COMPLETE — FOUNDER/LEGAL REVIEW REQUIRED BEFORE PRODUCTION
ACTIVATION**

The engineering-side blocker (literal placeholder text on live legal pages) is closed: both pages
now contain real, product-grounded, factually-verified content covering every topic the task brief
required, with zero invented facts — every gap only a founder or legal reviewer can fill is visibly
marked, not silently assumed. This is **not** a legal approval and must not be represented as one;
twelve concrete decisions (§9) remain genuinely open.

## 20. Exact recommended next action

1. Route this document and the two updated pages to the founder and/or an authorized legal reviewer
   for the twelve `LEGAL-*` decisions in §9 — none of them can be resolved by engineering.
2. Once a real contact address exists (`LEGAL-03`), update `apps/web/app/(marketing)/contact/page.tsx`
   (a one-line, low-risk fix, deliberately not done this pass since the real address doesn't exist
   yet).
3. Do not begin Production Activation until at minimum `LEGAL-01`, `LEGAL-02`, `LEGAL-03`, `LEGAL-04`,
   `LEGAL-07`, `LEGAL-08`, and `LEGAL-09` are resolved — these are the ones this pass's own Go/No-Go
   reasoning (mirroring `production-activation-checklist.md` §13) treats as launch-blocking.
