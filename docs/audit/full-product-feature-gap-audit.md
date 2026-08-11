# Full Product / Feature / UI / AI Gap Audit — web-tu-vi (BeaconVie)

**Audit date**: 2026-08-11. **Audit type**: read-only. No application code, tests, schema, or config
were modified as part of this audit (the only writes are this document and its two companions).
**Method**: 5 parallel research agents (Product Bible, Frontend/Navigation, Backend, AI/Companion/
Memory/Journal, Tarot/Numerology/Premium/Auth/Frozen-modules) plus direct first-hand verification —
reading source files myself, and driving a real Chromium browser against the actual running
production-mode stack starting from `/` with no typed URLs, then directly probing candidate orphan
routes. All findings below are evidence-based (file:line citations or direct runtime observation),
not inferred from sprint reports.

**Companion documents**: none required beyond this file — the AI runtime finding (the single most
severe finding) is folded into §10 below rather than split into a separate file, since it is load-bearing
for nearly every other section.

---

## Executive Verdict

The backend is substantially more complete than the product feels. Tarot, Numerology, Premium/
Payment, Auth, Memory, Journal, and even Reflection/Insight/Review/Goal (66 frontend files, not in
the Product Bible at all) are real, tested, working code. The gap is almost entirely in **wiring,
labeling, and runtime configuration** — not missing backend capability:

1. **The single most severe finding**: `apps/api/.env` never sets `DEFAULT_AI_PROVIDER`. It silently
   defaults to `'mock'`. A real, non-placeholder `OPENAI_API_KEY` is present in the same file and is
   never used. **Every AI-generated reply in Companion chat, and every AI interpretation in Tarot
   and Numerology, is currently produced by the deterministic Mock provider, not a real LLM**, in
   the environment this was audited against. This alone plausibly explains most of "AI functionality
   is not clearly visible" — because right now, distinctly AI-like behavior mostly isn't happening.
2. Even where real AI *is* configured, the word **"AI" appears nowhere in the Companion chat UI**,
   and Tarot/Numerology AI interpretation text renders as an unlabeled plain paragraph, visually
   identical to deterministic content. The only UI copy that mentions "AI" does so to say what it
   *doesn't* do (doesn't choose cards/numbers) — never to label what it *does* generate.
3. The Dashboard — the first screen after login — routes every possible state to `/companion` and
   nowhere else. Its own "Suggested for you" Discovery card and its "Memory" card are both visually
   present but **not clickable** (missing `<Link>` wrapping, confirmed in source). Its "reflection
   report" card is static placeholder text unconditionally shown to every brand-new user, referencing
   a frozen module that has no Product Bible module at all.
4. Settings has become the de facto secondary navigation for five real features (Memory, Reflection,
   Insight, Review, Goal) that have zero presence in the primary 5-item nav or on the Dashboard — and
   Reflection/Insight/Review/Goal get more marketing-style descriptive copy in Settings than Premium
   does.
5. One confirmed true orphan route (`/insights/internal` — zero in-app path anywhere) and six routes
   (`/memory`, `/goals`, `/insights`, `/reflections`, `/reviews`, `/premium`) reachable only through
   Settings, several of which are also **missing from the middleware's authenticated-route allowlist**
   (a distinct, separately-worth-flagging fact from discoverability).
6. Pricing is never shown anywhere in-app before checkout redirects the user off-site to PayOS.
7. Landing-page marketing copy is, as of this session, honest and accurate (Sprint 8's own closure
   fixed the stale claims) — except the AI Companion showcase section's own static disclaimer still
   says **"Preview only — the full Companion experience is being built for a coming release,"** even
   though Companion has been fully functional for many sprints.

None of this requires new Discovery engines (Natal Chart, Eastern Horoscope). It requires making the
real, working product visible and honestly configured.

---

## 2. Git / Repository State

```
HEAD: 75a2831 "feat: complete Sprint 8 numerology discovery"
Branch: master, 1 commit ahead of origin/master (not pushed)
Working tree: clean (git status --short empty)
git diff --check: clean
```

Sprint 8 is fully committed. No PayOS-readiness work remains uncommitted (it was committed at
`1946b45`, before Sprint 8). No partial UX remediation exists in the working tree — the gaps
described in this report are all in the last-committed, currently-deployed code, not in-progress
work.

---

## 3. Product Bible Feature Count

The Product Bible (`docs/reference/web-tu-vi/web-tu-vi/`, 25 numbered modules + v1.1 addendum) names
**16 product-tree modules** (Module 3): Landing, Authentication, Dashboard, AI Companion, Memory,
Journal, Tarot, Natal Chart, Eastern Horoscope, Numerology, Reports, Premium, Community,
Notifications, Settings, Admin.

| Classification | Count | Modules |
|---|---|---|
| Fully usable (backend + frontend + reachable) | 8 | Landing, Authentication, Dashboard, AI Companion, Memory, Journal, Tarot, Numerology, Settings *(9 if Settings counted separately — see note)* |
| Partially usable (real, but hidden/weakly wired) | — | Premium (real, but no in-app pricing, no Dashboard presence), AI Companion (real, but unlabeled as AI, and currently mock-only at runtime) |
| Missing entirely (zero code) | 5 | Natal Chart, Eastern Horoscope, Reports, Community, Notifications |
| Missing entirely, no Bible module exists (implemented anyway) | 4 | Reflection, Insight, Review, Goal — **not in the Product Bible's 16-module tree at all**, confirmed by exhaustive read of Modules 1–25; real, tested, 66 frontend files, reachable only via Settings |
| Referenced but never given its own module doc | 1 | Admin — mentioned in Modules 2/3/4/20/21 but no dedicated Module 20.5-or-similar exists; zero code |

Note: counting Settings and Dashboard as "fully usable" is generous — both have real content but
Settings has become an unintended second-tier nav for 5 real features, and Dashboard's own two
Discovery/Memory cards are unclickable. See §6, §16, §18.

---

## 4. Frontend Route Count

**30** `page.tsx` files under `apps/web/app/`. Full inventory:

| Route | Purpose | Auth (middleware) | Linked from primary nav/Dashboard/Settings? |
|---|---|---|---|
| `/` | Marketing landing | Public | — |
| `/about`, `/contact`, `/privacy`, `/terms` | Static marketing pages | Public | Footer |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verify-email/pending` | Auth flows | Public | Marketing header / email links |
| `/onboarding` | First-session chat | Guarded | Auto-redirect post-register |
| `/dashboard` | Home | **In middleware allowlist** | Primary nav |
| `/companion` | AI chat | **In middleware allowlist** | Primary nav, Dashboard hero CTA (always) |
| `/journal`, `/journal/new`, `/journal/archive`, `/journal/[id]` | Journal | **In middleware allowlist** (base only — verify subpaths) | Primary nav |
| `/discover`, `/discover/tarot`, `/discover/numerology` | Discovery hub + 2 live systems | **In middleware allowlist** | Primary nav |
| `/settings` | Account/everything-else hub | **In middleware allowlist** | Primary nav |
| `/memory` | Memory timeline | **NOT in middleware allowlist** | Settings card only |
| `/goals` | Goal dashboard (frozen) | **NOT in middleware allowlist** | Settings card only |
| `/reflections` | Reflection home (frozen) | **NOT in middleware allowlist** | Settings card only |
| `/insights` | Insight dashboard (frozen) | **NOT in middleware allowlist** | Settings card only |
| `/insights/internal` | Internal insight-prep view (frozen) | **NOT in middleware allowlist** | **Nothing — confirmed orphan** |
| `/reviews`, `/reviews/[param]` | Review dashboard (frozen) | **NOT in middleware allowlist** | Settings card only (list); self-linked (detail) |
| `/premium`, `/premium/return` | Upgrade + payment return | **NOT in middleware allowlist** | Settings `PremiumStatusCard`; limit banners deep in Tarot/Numerology; `/return` is a legitimate external-redirect target, not a discoverability gap |

**Middleware/route-guard fact** (`apps/web/lib/route-guard.ts`, `apps/web/middleware.ts:38-49`): `APP_ROUTES`
only lists `/`, `/login`, `/register`, `/onboarding`, `/dashboard`, `/companion`, `/journal`,
`/discover`, `/settings`. Six real, authenticated-feature routes (`/memory`, `/goals`, `/reflections`,
`/insights` incl. `/internal`, `/reviews`, `/premium` incl. `/return`) are **not covered by
server-side middleware auth redirect**, and there is no client-side redirect fallback either
(confirmed: `auth-provider.tsx` only exposes `user: null`, never redirects). Whether this is
exploitable depends on whether the underlying API calls on those pages independently enforce auth
(they do — `JwtAuthGuard` on every backend route) — so a logged-out visitor would see an empty/
erroring page shell rather than real data, not a privacy breach, but it is a real gap between the
route-guard's own stated intent and its actual coverage.

---

## 5. Orphan Route Count

**1 confirmed true orphan**: `/insights/internal` — zero `<Link>`, zero `router.push`, zero card
anywhere in the app points here (only the page's own self-referential query-string update, and a
Playwright test that `page.goto()`s it directly).

**6 "Settings-only" routes** (not orphans, but reachable through exactly one path, never from
primary nav or Dashboard): `/memory`, `/goals`, `/reflections`, `/insights`, `/reviews`, `/premium`.

**1 legitimate redirect-target, not a discoverability bug**: `/premium/return`.

---

## 6. Backend-Only Feature Count

**4 confirmed** endpoints with zero frontend caller anywhere in `apps/web/`:
- `PATCH /goals/:id/milestones/:milestoneId` (generic milestone edit — no UI for it)
- `POST /goals/:id/milestones/:milestoneId/archive` (no UI for it)
- `POST /payment/webhooks/payos` (by design — external provider callback)
- `GET /health/live`, `GET /health/ready` (by design — infra probes)

**Plus 2 confirmed dead frontend API functions** (defined, never called): `tarotApi.readingHistory`
and `numerologyApi.readingHistory` — both features' own reading-lifecycle audit trail (`GET
/tarot|numerology/readings/:id/history`) has a working backend endpoint and a working frontend
client function, and is simply never invoked by any component. A real, already-built feature with
zero UI entry point.

Everything else — auth, companion, dashboard, insight, journal, memory, numerology, onboarding,
reflection, review, tarot, users, payment's user-facing routes — is fully wired end-to-end.

---

## 7. Implemented-But-Hidden Feature Count

**14** distinct findings — see §24 for the ranked list with root causes.

---

## 8. Missing Feature Count

**5** Product Bible modules with zero code (Natal Chart, Eastern Horoscope, Reports, Community,
Notifications) + **1** referenced-but-undefined module (Admin) — see §25.

---

## 9. Navigation Verdict

**Weak.** The primary nav (`apps/web/components/layout/nav-items.ts:14-26`) is exactly 5 items —
Dashboard, Companion, Journal, Discover, Settings — matching the Product Bible's "four destinations
plus Settings" rule (Module 3) in spirit. But Settings has silently absorbed secondary-nav duty for
5 real, substantial features (Memory, Reflection, Insight, Review, Goal) that the Bible's own
"two-tap-maximum" rule (Module 3 §15) would suggest deserve better placement, or an explicit,
disclosed decision to keep them lower-priority — the current state reads as unintentional
accumulation, not a decision. Premium is one tap further than it needs to be (Settings, not
Dashboard). Discover → Tarot/Numerology is correctly exactly 2 taps, matching the Bible.

## 10. Dashboard Verdict — ⚠️ Structurally still Companion/Memory/Reflection-centered

Direct read of `apps/web/features/dashboard/components/dashboard-view.tsx` (full file) and
`apps/api/src/dashboard/dashboard.service.ts`:

- **Hero CTA always routes to `/companion`** in all three branches (`dashboard.service.ts:76-93`) —
  never to Discover, Tarot, or Numerology, regardless of user state.
- **"Suggested for you" (Discovery) card is not clickable.** The backend returns `href: '/discover'`
  (`dashboard.service.ts:115`, itself a Sprint-8-closure fix that corrected the copy), but
  `dashboard-view.tsx:99-108` renders only `title`/`description` as plain `<p>` tags — the `href`
  field is dropped, never wrapped in a `<Link>`. **This is the Dashboard's only mention of Tarot/
  Numerology, and it doesn't work as a link at all.**
- **"Memory" card has no link either** (`dashboard-view.tsx:83-97`) — shows the latest memory or an
  empty state, purely as static text.
- **"Your first reflection report" card is unconditional, static, unlinked placeholder copy**
  (`dashboard-view.tsx:110-115`) — not backed by any real data from `dashboard.service.ts`, shown to
  every single new user, referencing a module (Reflection/Review) that has no Product Bible module
  at all.
- Insight, Goal, and Premium are not mentioned on the Dashboard in any form.

Verdict: the Dashboard's actual content structure (visually confirmed via screenshot, code-confirmed
via direct read) still centers Companion, with dead Discovery/Memory links and a permanent nod to
frozen Reflection — the pre-Discovery-pivot design, not updated to reflect Sprint 6–8's actual
product direction even though the underlying data model (`discoverySuggestion.href`) was already
fixed to point at the right place.

## 11. Discover Verdict — ✅ Correct and healthy

Screenshot-verified and code-confirmed: `/discover` correctly shows Tarot and Numerology as live
(no "Coming soon" badge, working "Try Tarot"/"Try Numerology" buttons linking to their real routes)
and Natal Chart/Eastern Horoscope correctly, honestly badged "Coming soon" with no link. This is the
one surface in the entire audit with no gap found.

## 12. Tarot Verdict

Backend-complete and frontend-complete for every core capability (draw, reveal, meanings,
interpretation, retry, history, detail, archive/restore/delete, loading/error states — see the full
matrix delivered by research; condensed in §23). Three specific gaps: (a) the reading-history audit
trail endpoint has no UI, (b) there is no "Continue in Companion" CTA from a reading despite a real,
working Companion bridge on the backend, (c) Premium daily-limit information is shown only reactively
(after the user hits the wall), never proactively.

## 13. Numerology Verdict

Same shape as Tarot, plus: no proactive disclosure of which characters are allowed in the name field
(user only learns by triggering a validation error), and the Numerology dashboard intro text doesn't
even mention Companion (Tarot's does, even without a working link).

## 14. AI Architecture Verdict

Architecturally sound and consistent with Module 23's "one shared intelligence system" principle —
one orchestrator, one provider registry, one safety layer, reused identically by Companion, Tarot
interpretation, and Numerology interpretation. The problem is entirely in runtime configuration and
UI presentation, not architecture. See §15 for the explicit runtime status.

## 15. ACTUAL AI RUNTIME STATUS

# **MOCK AI ACTIVE**

`apps/api/.env` does not set `DEFAULT_AI_PROVIDER` at all. Per `apps/api/src/config/env.validation.ts:54-68`,
this zod-defaults to `'mock'`. `FALLBACK_PROVIDER` is also unset (`undefined`, no fallback in the
chain). Since `NODE_ENV=development` in this file, the Mock provider registers regardless. The
provider-orchestrator's chain (`provider-orchestrator.service.ts:50-57`) is therefore `['mock']`
only. **`OPENAI_API_KEY` is present in the same `.env` file with a real, non-placeholder-looking
value, and the OpenAI provider registers successfully — but is never selected**, because nothing in
the chain names it. Every Companion reply, every Tarot interpretation, and every Numerology
interpretation currently generated in this environment comes from the deterministic Mock provider.

This is not "mixed" and not "no provider" — a provider genuinely runs and returns genuinely
generated-looking text (the Mock provider is a real, working fallback-safe implementation, not an
error state) — but it is not an LLM. Fixing this specific environment requires exactly one change:
setting `DEFAULT_AI_PROVIDER=openai` (or `anthropic`, if that key is later added) in `apps/api/.env`.
Separately, `apps/api/.env.test` **does** explicitly set `DEFAULT_AI_PROVIDER=mock` — that one is
intentional and correct for automated tests; the dev/`.env` one is the unintentional gap.

## 16. Companion Verdict

Technically excellent — real SSE streaming, cancel, retry, offline/rate-limit/safety-refusal states,
full Memory integration (remember/forget suggestions, "why I remembered," memory-used transparency).
**The word "AI" does not appear anywhere in the Companion UI component tree** (grep-confirmed, zero
matches). The persona is presented purely as "Companion," with no visual/textual AI indicator beyond
the behavioral fact that it streams and can fail like a networked AI service would. Combined with
§15, a user in the current environment is having a conversation with a scripted mock and has no way
to know that, or that it's supposed to be different.

## 17. Memory Verdict

Comprehensive and mostly well-wired: timeline, archive/restore/delete, importance scoring with "why"
explanations, conflict/duplicate detection, merge suggestions, consent settings, export, and full
Companion-side remember/forget suggestion UI are all real. One gap: **Pin has no user-facing
toggle** — it's a read-only display attribute only. Memory itself is not in the primary nav (only
reachable via Settings or Companion's "Remember this" flow), which is notable because Memory is the
one feature most explicitly designed to explain *what the AI knows* — currently the least
discoverable AI-transparency surface in the product.

## 18. Journal Verdict

Fully built and correctly positioned — one of the 5 primary nav items. Create, autosave, local-backup
recovery, timeline, search, archive, revision history, and account-wide export are all real and
wired. Zero AI involvement in Journal's own data (100% user-authored, matching the Bible's "AI is
restrained/mostly silent in Journal" rule) — the only AI touchpoint is a Companion-side suggestion
card offering to copy a chat message into a new Journal draft.

## 19. Frozen-Module Visibility Verdict

Reflection, Insight, Review, Goal: 66 frontend files total, real and tested, zero presence in
primary nav or Dashboard, reachable only via one Settings card each. Screenshot-confirmed: in
Settings, these four modules receive full marketing-style descriptive copy ("First-class learning
and life goals with deterministic progress, milestones, and evidence...") — more prose than the
Premium/Upgrade section directly above them. A new user reading Settings top-to-bottom would
reasonably conclude these are core, actively-promoted features, not de-prioritized/frozen ones —
directly contradicting the Discovery-first direction and, since these four modules have no Product
Bible entry at all, actively working against the founder's own stated vision.

## 20. Premium / Payment Verdict

Real, working, and reasonably well-designed at the mechanics level (entitlement ledger, PayOS
checkout redirect, webhook-verified polling return flow with distinct states, `PAYMENTS_ENABLED=false`
handled with a dedicated user-facing message). Gaps: **no price is ever shown in-app** — the user only
sees the amount after being redirected to PayOS's own hosted page; no MVP-test-price disclosure
anywhere in the frontend; `PAYMENTS_DISABLED` and `PROVIDER_UNAVAILABLE` show identical generic
copy; Premium status is shown in Settings and on `/premium` but **not on the Dashboard**; Free-tier
usage limits (Tarot/Numerology) are shown only reactively, never proactively.

## 21. Auth / Account / Settings Verdict

Auth mechanics are comprehensive and well-wired (register, login, logout, verify/resend, forgot/
reset/change password, session list, per-session revoke, sign-out-everywhere all have real UI and
real backend). Three real gaps: **no profile-edit endpoint exists at all** (display name/email are
permanently read-only in Settings — no backend route, not just missing UI); **no account-wide data
export** (only a Memory-scoped export exists, despite the Product Bible's Module 21 promising an
"Export Center"); **no account-deletion endpoint exists** — Settings' own copy honestly says
"Notifications, theme, and account deletion are coming soon," which is at least honestly disclosed
rather than silently broken.

## 22. Community Status

**NOT STARTED.** Zero backend module folder, zero frontend route folder, zero Prisma model. Matches
both the roadmap doc and current-state doc's prior findings exactly — nothing has changed here.

## 23. Notifications Status

**NOT STARTED.** Same as Community — zero code anywhere. Settings' own copy discloses this honestly
("coming soon").

## 24. Admin Status

**NOT STARTED**, and structurally notable: the Product Bible references Admin substantively in
Modules 2, 3, 4, 20, 21 (as the permission-tier ceiling, the internal trust/safety tooling, etc.) but
**never gives Admin its own numbered experience module** — Module 20 and Module 21 both literally end
with "Next module in sequence: Admin," and no such module exists in the 25-file sequence. This is a
gap in the spec itself, not just the implementation.

## 25. SEO / Public-Site Verdict

Landing-page copy is currently **accurate** (confirmed post-Sprint-8: every "Coming soon" claim is
correctly labeled, root metadata no longer contains the stale "tarot, astrology, or numerology"
phrasing a prior audit flagged). One real, currently-live inaccuracy found: the AI Companion preview
section's static disclaimer ("Preview only — the full Companion experience is being built for a
coming release," `apps/web/components/marketing/companion-preview.tsx:24`) is false — Companion has
been fully functional for multiple sprints. Separately, `/discover`, `/discover/tarot`, and
`/discover/numerology` are excluded from both `sitemap.ts` and `robots.ts` (by design — "nothing
behind the login wall should ever be crawled," matching Tarot's own precedent) — meaning there is no
public, unauthenticated, search-indexable surface for either Discovery system, which limits organic
discovery even though the features themselves work once a user has registered.

## 26. Mobile Verdict

No confirmed overflow/breakage found in code (Tarot/Numerology/nav component trees consistently use
`flex-wrap` and responsive Tailwind prefixes; no fixed-px-width tables, no `overflow-x`/
`whitespace-nowrap` misuse found via grep). One structural note, not a bug: the "tablet" breakpoint
(768–1279px) currently gets the same bottom-tab mobile navigation as phones — `tablet:` prefixes
exist in the codebase but are not used to give tablets their own layout in the nav components. Native
`<dialog>` modals have no dedicated mobile/bottom-sheet treatment, though `max-width` sizing means
they shouldn't overflow. Recommend a real-device/browser visual pass before calling this fully clean.

---

## 27. Top 10 Implemented-But-Hidden Features

| # | Feature | Where code exists | Why user doesn't see it | What's missing |
|---|---|---|---|---|
| 1 | Real AI (OpenAI) | `apps/api/src/companion/providers/openai.provider.ts`, key present in `.env` | `DEFAULT_AI_PROVIDER` unset, defaults to `mock` | One env var: `DEFAULT_AI_PROVIDER=openai` |
| 2 | Discovery Suggestion card link | `dashboard.service.ts:115` (`href: '/discover'`) | `dashboard-view.tsx:99-108` never renders it as a `<Link>` | Wrap the card in `<Link href={data.discoverySuggestion.href}>` |
| 3 | Memory (as a feature) | Full `apps/web/features/memory/` (timeline, conflicts, duplicates, merge, consent, export) | Not in primary nav; Dashboard's Memory card isn't a link either | A real navigation entry point |
| 4 | Tarot/Numerology reading history audit trail | `GET /tarot|numerology/readings/:id/history`, `tarotApi.readingHistory`/`numerologyApi.readingHistory` | Frontend function defined, never called by any component | Wire it into the reading-detail view |
| 5 | Companion bridge from a Tarot/Numerology reading | Real, working backend context injection (`context-builder.service.ts`) | No "Continue in Companion" button anywhere in either feature's UI | One CTA per reading |
| 6 | Reflection/Insight/Review/Goal (66 files) | Full `apps/web/features/{reflection,insight,review,goal}/` | Zero primary-nav/Dashboard presence; Settings-only | A deliberate decision — either integrate or explicitly deprioritize in copy |
| 7 | Premium pricing | `PREMIUM_PRICE_VND` config, real checkout flow | Never rendered anywhere in `apps/web/app/(app)/premium/` before the PayOS redirect | Show the price (and MVP-test-price disclosure) on the Premium page itself |
| 8 | Premium status on Dashboard | `EntitlementService`, `PremiumStatusCard` already exists in Settings | Not rendered on Dashboard at all | Reuse `PremiumStatusCard` on the Dashboard |
| 9 | Memory Pin | `pinned` boolean field, `ImportanceBadge` display | No user-facing toggle exists anywhere | A pin/unpin action + backend endpoint |
| 10 | AI-generated interpretation (as distinct from deterministic content) | Tarot/Numerology `interpretation` field, real generated text once §1 is fixed | Rendered as a bare, unlabeled `<p>`, same style as everything else | A visible "AI interpretation" label/badge |

## 28. Top 10 Missing/Unfinished Features

| # | Feature | Classification |
|---|---|---|
| 1 | Natal Chart | MISSING CODE — by design, future sprint |
| 2 | Eastern Horoscope | MISSING CODE — by design, future sprint |
| 3 | Reports | MISSING CODE — despite the Bible calling it "the strongest proof point of the business thesis" |
| 4 | Community | MISSING CODE — by design, deferred to V1.5 |
| 5 | Notifications | MISSING CODE — by design, deferred |
| 6 | Admin | MISSING CODE + MISSING SPEC (no dedicated Bible module exists) |
| 7 | Profile edit (display name/email) | MISSING BACKEND — no endpoint at all |
| 8 | Account-wide data export | MISSING BACKEND — only Memory-scoped export exists |
| 9 | Account deletion | MISSING BACKEND — honestly disclosed as "coming soon" in Settings |
| 10 | Goal milestone edit/archive UI | MISSING FRONTEND — backend endpoints exist, no UI |

---

## 29. P0 — Core Experience Broken

1. **Real AI is not active in the runtime this was audited against** (`DEFAULT_AI_PROVIDER` unset →
   mock). This is the single highest-impact finding — it affects Companion, Tarot, and Numerology
   simultaneously, and is the most direct explanation available for the founder's report.
2. **Dashboard's Discovery and Memory cards are not clickable** — the one card that should be the
   Discovery-first entry point on the very first screen a user sees is dead UI.

## 30. P1 — Core Experience Weak

3. AI-generated content is never visually/textually labeled as AI anywhere in the product (once #1
   is fixed, this becomes the next-most-important gap).
4. Dashboard hero CTA never varies away from Companion — no path from Dashboard to Tarot/Numerology.
5. Memory, Reflection, Insight, Review, Goal are all Settings-only, with no primary-nav or Dashboard
   presence; Reflection/Insight/Review/Goal (no Bible module) get more prominent copy in Settings
   than Premium.
6. No pricing shown anywhere pre-checkout for Premium.
7. `/insights/internal` is a true orphan route.
8. Tarot/Numerology → Companion bridge has no UI entry point despite working backend support.
9. Landing page's Companion preview section falsely claims Companion is "being built for a coming
   release."

## 31. P2 — Important, Not Launch-Critical

10. Tarot/Numerology reading-history audit trail has no UI.
11. No proactive (pre-limit) display of Tarot/Numerology Free usage caps.
12. No proactive disclosure of Numerology's allowed name characters.
13. Memory Pin has no toggle UI.
14. `PAYMENTS_DISABLED` vs `PROVIDER_UNAVAILABLE` show identical generic copy.
15. Premium status not shown on Dashboard.
16. Middleware route-guard allowlist gap for `/memory`, `/goals`, `/reflections`, `/insights`,
    `/reviews`, `/premium`.
17. No profile-edit, account-wide export, or account-deletion endpoints (though the last is honestly
    disclosed).
18. Goal milestone edit/archive endpoints have no UI.
19. Tablet breakpoint gets phone-style bottom nav rather than its own layout.

## 32. P3 / Future Features (by design, not gaps)

Natal Chart, Eastern Horoscope, Reports, Community, Notifications, Admin — all explicitly out of
scope for the current roadmap phase per `docs/audit/web-tu-vi-remediation-roadmap.md`, and honestly
labeled as such everywhere they're mentioned in the UI.

---

## 33. Recommended Remediation Sequence

Derived from the evidence above — fix the current product's visibility and configuration before
building more Discovery engines:

**Remediation A — AI Runtime (do this first, it's a one-line config change with the largest impact)**
Set `DEFAULT_AI_PROVIDER=openai` (and optionally `FALLBACK_PROVIDER`) in `apps/api/.env`; verify real
provider calls in Companion/Tarot/Numerology; confirm cost/budget guards (`AI_DAILY_TOKEN_LIMIT` etc.)
are sanely configured for real usage, not mock-calibrated values.

**Remediation B — Dashboard + Navigation**
Wire the Discovery-suggestion and Memory cards as real links; vary the hero CTA to sometimes point at
Discover when appropriate; decide, deliberately, where Memory/Reflection/Insight/Review/Goal belong
in the IA (promote, or explicitly deprioritize with quieter Settings copy) rather than leaving it as
unintentional accumulation; fix `/insights/internal`'s orphan status; extend the middleware
`APP_ROUTES` allowlist to cover the six currently-uncovered routes.

**Remediation C — AI Visibility**
Add an explicit "AI interpretation" (or similar) label/style distinct from deterministic content in
Tarot/Numerology; consider a light "Companion is AI-powered" affordance somewhere in the Companion UI
without turning it into a disclaimer-heavy experience — the Product Bible's own "no artificial-
intimacy language, no mascot" rules can coexist with basic honesty about what's generating replies.

**Remediation D — Tarot/Numerology UX polish**
Wire the reading-history audit trail into the detail view; add a "Continue in Companion" CTA; show
usage-cap status proactively, not just reactively; disclose Numerology's name-character rules before
the user hits an error.

**Remediation E — Premium UX**
Show the actual price (with MVP-test-price disclosure) before checkout; add a Premium-status
indicator to the Dashboard; distinguish `PAYMENTS_DISABLED` from `PROVIDER_UNAVAILABLE` in copy.

**Remediation F — Account/Settings gaps**
Fix the landing page's stale Companion-preview disclaimer (small, high-value, zero risk); decide
whether profile-edit, account-wide export, and account deletion are near-term commitments or should
be removed from the Bible's promises for this phase.

**Then, and only then, Sprint 9** (Natal Chart) or further Discovery expansion — the roadmap's own
sequencing already places it after the current core is proven, and this audit's findings reinforce
that the current core isn't yet fully visible to real users.

## 34. Should Sprint 9 Start Now?

# **DO NOT START SPRINT 9**

Not because Sprint 8's own work is deficient (Numerology itself audits clean — see §12/§23), but
because the product-wide gaps found here (mock-only AI, dead Dashboard links, buried real features,
no AI labeling) are P0/P1-severity, affect every existing Discovery system equally, and would only
compound if a third Discovery engine is added on top of a product whose current two aren't yet fully
visible or running on real AI. Fix visibility and AI runtime first; Natal Chart doesn't fix either
problem.

## 35. Files Created by This Audit

- `docs/audit/full-product-feature-gap-audit.md` (this file)

No other files were created. The optional companion documents (`full-product-route-map.md`,
`ai-runtime-gap-audit.md`) were not created as separate files — their content is folded into §4/§5
(routes) and §15 (AI runtime) of this document, since splitting them would have duplicated most of
the same evidence without adding clarity.

## 36. Working Tree Status

Clean. `git status --short` returns nothing beyond this new, untracked audit file. No application
code, tests, schema, or config were modified. Nothing was committed as part of this audit.

---

# FINAL VERDICT

# **MAJOR UX/WIRING REMEDIATION REQUIRED**

The backend and even most of the frontend genuinely exist and work — this is not a "major product
gap" in the sense of missing engineering. But the AI runtime is silently running on a mock provider
in the audited environment, the Dashboard's own Discovery/Memory links are dead code, and five real
features have no path into primary navigation. These are wiring and configuration problems layered
on top of substantial, real, working product — exactly the class of gap this audit was commissioned
to find, and exactly what the founder described experiencing.
