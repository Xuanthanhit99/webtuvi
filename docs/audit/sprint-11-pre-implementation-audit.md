# Sprint 11 Pre-Implementation Audit

Date: 2026-08-13. HEAD at audit time: `ffd82dc` ("feat: complete Sprint 10 launch hardening"),
`master`, in sync with `origin/master` (0 ahead / 0 behind), working tree clean, no merge/rebase in
progress, `git diff --check` clean. This is a research/decision document only — no application
code, Prisma schema, or migrations were touched to produce it.

Authority order used throughout: (1) actual code at HEAD (independently re-verified via direct
reads and two read-only research passes, not copied from prior audits), (2) Prisma schema +
applied migrations, (3) Product Bible (`docs/reference/web-tu-vi/web-tu-vi/`), (4) Sprint 10's own
pre-implementation audit and final report (`docs/audit/sprint-10-pre-implementation-audit.md`,
`docs/progress/sprint-10-final-report.md`) — trusted only where this audit's own independent
checks confirmed them unchanged, (5) older progress docs.

---

## 1. Current HEAD

`ffd82dc` — "feat: complete Sprint 10 launch hardening." Commit body confirms: account data
export/deletion, a `JwtAuthGuard` DB status-check gap fix, and two genuine defects found and fixed
during Sprint 10's own release closure (an account-export omission of legacy `MemoryNote` rows, and
a late-webhook path that could mint a Premium entitlement for an already-deleted account).

## 2. `origin/master`

`ffd82dc` — identical to local HEAD.

## 3. Ahead/behind

`0	0`. Fully in sync.

## 4. Working tree baseline

Clean at audit start. `git diff --check` clean (no conflict markers, no trailing-whitespace
errors). `git show --stat ffd82dc` confirms the sprint's actual footprint: 26 files, 2,911
insertions / 20 deletions, entirely scoped to `apps/api/src/auth/`, `apps/api/src/common/guards/`,
`apps/api/src/payment/webhook/`, `apps/api/src/users/{deletion,export}/`,
`apps/web/app/(app)/settings/`, `apps/web/app/(marketing)/privacy/`,
`apps/web/features/settings/`, `packages/types/index.ts`, plus the Sprint 10 docs themselves. This
confirms Sprint 10 touched **none** of: AI provider code, SEO/routing, mobile nav, natal chart
rendering, Discovery-system code, Notifications, Community, or `/menh-vi` — every finding from the
Sprint 10 audit in those areas either still applies unchanged or was independently re-verified
fresh in this audit (not assumed).

## 5. Product Bible roadmap summary

25 numbered modules + a v1.1 constitutional addendum under `docs/reference/web-tu-vi/web-tu-vi/`.
Module 1 (`01-product-vision-and-strategy.md`, Section 4, "Feature Prioritization") is the
authoritative tier list, confirmed directly (not inferred):

| Tier | Modules |
|---|---|
| **MVP** | Tarot (daily pull + spread), Companion (session memory only), Journal (freeform), Dashboard (basic), Auth |
| **V1** | Long-term cross-session Memory, Natal Chart, Numerology, Premium tier + paywall, **Notifications (memory-triggered, not generic pushes)** |
| **V1.5** | Eastern Horoscope, Reports, Community (opt-in, anonymized, explicitly not a social feed) |
| **Future** | Voice mode, multi-person compatibility, practitioner marketplace |
| **Moonshot** | Predictive life-pattern modeling (explicitly gated behind mature V1 memory infrastructure) |
| **Out of scope, explicitly** | Literal fortune-telling claims, public social feed/follower mechanics, non-consensual compatibility scoring |

Module 16's Engineering Notes priority table (P0–P3) is consistent with this: P0 = Memory graph +
Companion session chat; P1 = Tarot/Journal + cross-session Memory; P2 = Natal Chart/Numerology +
Premium; P3 = "Eastern Horoscope, Community, Reports — expansion, not core-loop validation."
Notifications is not in the P0–P3 table (that table predates it slightly in structure) but Module 1
Section 4 places it unambiguously in **V1**, the same tier as Natal Chart, Numerology, and Premium —
**above** Eastern Horoscope, Reports, and Community, all V1.5. This is a direct textual finding,
not an inference: **every other V1 item has already shipped (Sprints 6–10). Notifications is the
only V1-tier module with zero code.** Once Notifications ships, the Bible's entire V1 tier is
complete and every remaining Discovery/Community candidate is V1.5.

Module 2 confirms Notifications' ecosystem role: "memory-triggered re-engagement, never
generic/urgency-based... re-opens the Core Product Loop at the Discovery/Conversation boundary" and
its Product Flywheel (Module 1, §4.7) shows Retention as the stage between Premium and "back to
Discovery" — the loop has no explicit re-engagement mechanism modeled anywhere else in the Bible.

## 6. Completed modules

Re-verified independently at `ffd82dc`, not copied from the Sprint 10 audit without a fresh check:

- **Auth** — unchanged since Sprint 9; Sprint 10 added the `DELETED`-status enforcement gap fix to
  `JwtAuthGuard`, closing a real hole. COMPLETE.
- **Onboarding** — real conversational flow with a working skip path
  (`apps/web/features/onboarding/components/onboarding-chat.tsx:49,94-110`). COMPLETE.
- **Dashboard** — real links to Discovery/Memory, unchanged. COMPLETE.
- **Discover (hub)** — `apps/web/app/(app)/discover/page.tsx` confirms Tarot/Numerology/Natal
  Chart `available: true` with real hrefs; Eastern Horoscope `available: false`, honestly badged
  "Coming soon." COMPLETE as a hub.
- **Companion** — multi-provider (`apps/api/src/companion/providers/`: OpenAI, Anthropic, Gemini,
  Mock), SSE streaming, `SafetyService`, `CostControlService`/`CompanionThrottlerGuard`/
  `GenerationLockService` all present and wired via `@UseGuards(CompanionThrottlerGuard)`
  (`companion/conversation/conversation.controller.ts:9,37`). COMPLETE.
- **Memory** — unchanged, full lifecycle, 10 subfolders. COMPLETE.
- **Journal** — unchanged, full CRUD/export/timeline. COMPLETE.
- **Tarot / Numerology / Natal Chart** — independently re-confirmed end-to-end this pass: each has
  its own backend module (`deck`/`draw`/`interpretation`/`record` for Tarot;
  `engine`/`interpretation`/`record` for Numerology and Natal Chart), each calls
  `ProviderOrchestratorService` directly for AI narration
  (`tarot-interpretation.service.ts:2,67,87`, `numerology-interpretation.service.ts:2,66,91`,
  `natal-chart-interpretation.service.ts:2,99,121`), each is wired into the Companion's
  `ContextBuilderService` bridge (`apps/api/src/companion/context/context-builder.service.ts`
  references all three), each has a real history endpoint (`GET readings/:id/history` ×2, `GET
  :id/history` for Natal Chart), and each gates via `EntitlementService`/`hasPremiumAccess` in its
  `record` service. AI-generated content is clearly disclosed in the shared
  `ai-interpretation.tsx` component: **"Written by AI to narrate the result above — it never
  chooses or changes it."** All COMPLETE, end-to-end, mobile-usable (see §28).
- **Premium (mechanics)** — `EntitlementService` pattern unchanged, identical gating across all 3
  Discovery systems. COMPLETE.
- **Account data rights** — new this sprint (Sprint 10). `POST /users/me/export`, `GET
  /users/me/export/:jobId`, `DELETE /users/me` all real, tested (unit + e2e + Playwright), wired to
  a real Settings UI card (not buried — see §29). Two genuine defects (legacy `MemoryNote` export
  omission, late-webhook entitlement-for-deleted-account) were found and fixed during Sprint 10's
  own closure, not left for this audit to catch. COMPLETE.

## 7. Partial modules

- **Payment (production)** — CODE COMPLETE / PRODUCTION EXTERNALLY BLOCKED. Re-verified fresh this
  pass, not just trusted: signature verification
  (`payment-webhook.service.ts:74-86`), idempotency via a real DB unique constraint plus a
  conditional `updateMany` guard (lines 105,119,129-137), and the `PAYMENTS_ENABLED` kill switch
  (`env.validation.ts:116`, checked in `payment-checkout.service.ts:36-43`, deliberately never
  gating webhook processing) are all real and correct. `apps/api/.env.example:120-131` — PayOS
  vars are commented-out placeholders, no real-looking credential present anywhere in the repo.
  `PREMIUM_PRICE_VND=79000` is unconditionally flagged `isMvpTestPrice: true` in the API response
  itself (`payment.controller.ts:64-68`) — the placeholder status is honest and visible, not
  silently presented as final.
- **SEO** — real `sitemap.ts`/`robots.ts` exist, well-formed page-level metadata/OpenGraph exists
  even on gated pages, but the entire authenticated product surface is deliberately disallowed
  (`apps/web/app/robots.ts:9-11` matches `apps/web/middleware.ts:38-58`'s actual gated-route set
  exactly — policy and enforcement agree). No `canonical` tags or dynamic `generateMetadata` found
  anywhere. PARTIAL — correct and consistent, but structurally non-indexable beyond the marketing
  shell.
- **Privacy** — `/privacy` page exists, was updated in Sprint 10 to describe the new
  export/deletion behavior accurately, but **explicitly self-labels as a placeholder**: "This is a
  plain-language summary for Sprint 1. A complete legal Privacy Policy will be published before
  general availability" (`apps/web/app/(marketing)/privacy/page.tsx:25-28`). No AI-nature
  disclosure statement found on the page (grepped for "AI", "disclosure", "substitute",
  "licensed" — zero matches). PARTIAL.
- **Settings** — password/sessions/memory-consent real, account data rights now real
  (Sprint 10), notifications/theme preferences explicitly still "coming soon"
  (`apps/web/app/(app)/settings/page.tsx:158`). PARTIAL — the "coming soon" notification-preference
  copy is itself evidence the team already anticipated this module.

## 8. Not-started modules

- **Eastern Horoscope / Tử Vi** — zero backend/frontend/Prisma trace outside the disclosed,
  dormant `/menh-vi` prototype (see §16). Bible tier: V1.5/P3.
- **Notifications** — zero Prisma models (`grep -n "model Notification" schema.prisma` returns
  nothing), zero backend service, zero scheduler (`@Cron`/`ScheduleModule`/`CronExpression`: zero
  matches across `apps/api/src`), zero delivery pipeline, zero frontend Notification Center. The
  three UI-level hits for "notification" (case-insensitive) are a generic toast component, an
  unrelated payment-controller comment, and the Settings "coming soon" line — none are the actual
  feature. Bible tier: **V1** — the only unshipped V1 item.
- **Community** — zero Prisma models, zero backend/frontend code; the handful of "community"
  string hits are all incidental (marketing copy, a tarot-card meaning's prose, an unrelated schema
  comment). Bible tier: V1.5/P3.
- **Admin** — no dedicated Bible module exists; no RBAC beyond authenticated-user status found.
  Referenced only as scattered requirements in Modules 2/3/21.

## 9. Frozen modules

Reflection, Insight, Review, Goal — re-confirmed present and unchanged: still fully built, still
reachable only via one collapsed "More tools" card in Settings
(`apps/web/app/(app)/settings/page.tsx:133-152`), separate from the new, top-level "My data" card
(line 154). Still carry the long-standing flaky Playwright signature on 5 specs (§31). No Bible
module backs them; this audit did not expand or touch them, per instruction.

## 10. Experimental modules

`/menh-vi/*` — unchanged since Sprint 9 (confirmed via `git log ffd82dc...eee8aff -- apps/web/app/menh-vi apps/web/features/menh-vi` returning nothing). 12 routes + 1 layout, all either static mock data or `MvComingSoon` placeholders, zero API calls, outside auth/middleware, self-documented in its own `layout.tsx` as "isolated design exploration, not part of the BeaconVie shell/nav." Still dormant, still disclosed, still non-competing — no action needed.

## 11. Tarot status

COMPLETE end-to-end: input (topic/deck) → draw (deterministic, no AI-chosen cards, disclosed
explicitly in the Discover-page copy: "no card ever chosen or invented by AI") → result → AI
interpretation (labeled, retryable on failure) → history → Companion bridge → Premium depth gating.
Mobile-usable (no Tarot-specific mobile defect found in this pass beyond the product-wide tablet-nav
issue, §28).

## 12. Numerology status

COMPLETE end-to-end, identical architecture to Tarot (deterministic engine → AI narration → history
→ Companion bridge → Premium gating). No new findings this pass.

## 13. Natal Chart status

COMPLETE end-to-end, same pattern, deepest of the three (birth data + geocoding → real astronomy
engine → chart visualization → interpretation → history → Companion bridge). One refinement found
this pass: the 0°/360° collision-easing fix mentioned in the Sprint 9 backlog **was actually
implemented** since — `apps/web/features/natal-chart/components/natal-chart-wheel.tsx:39-53` adds
a real `planetRadii()` easing function for close (<7°) conjunctions — but the fix only compares each
sorted placement to its immediate predecessor (`i-1`), never wrapping the comparison from the
highest-longitude placement back to the lowest. **The specific 0°/360°-straddling case (e.g., 3° and
358°) is therefore still uncorrected**, even though general (non-boundary) close conjunctions are
now eased correctly. See §28 for disposition.

## 14. AI runtime status

Four providers implemented (OpenAI, Anthropic, Gemini, Mock) behind a single
`ProviderOrchestratorService`, registered conditionally by API-key presence
(`provider-registry.service.ts:39-47`). `DEFAULT_AI_PROVIDER`/`FALLBACK_PROVIDER` are configurable;
production boot **fails outright** if either resolves to `mock` or if the selected provider's key is
missing (`env.validation.ts:176-187,217-228`) — there is no silent degrade-to-Mock path in
production, by design. Fallback chain retries with backoff pre-first-token only; a mid-stream
failure emits a clean `GENERATION_INTERRUPTED` error rather than silently switching providers
mid-response. All three Discovery systems and Companion call the same orchestrator — no parallel AI
integration exists. AI content is clearly labeled in the UI. Frontend failure UX is a toast + retry
button, not a silent fallback or a hard error page.

**One confirmed, unchanged gap**: `CostControlService`/`CompanionThrottlerGuard`/
`GenerationLockService` are wired only into Companion's controller
(`companion/conversation/conversation.controller.ts:9,37`) — Tarot/Numerology/Natal-Chart
interpretation endpoints use only `JwtAuthGuard` + global CSRF, with no per-user concurrency lock or
cost/rate ceiling of their own. This has been true since at least Sprint 9 and is not a Sprint 10
regression; it remains an open, low-urgency hardening item.

## 15. Premium status

COMPLETE mechanics, unchanged. `EntitlementService.hasPremiumAccess()` is the single reused gate
across all 3 Discovery systems; core content free, depth/history/creation-ceiling gated — matching
Module 2's monetization thesis (gate relationship depth, not content) exactly.

## 16. PayOS code status

**CONTRACT VERIFIED, zero code-side blockers**, independently re-verified fresh (signature
verification, idempotency, kill switch, honest price-placeholder flagging — see §7). Unchanged
since Sprint 7/10.

## 17. PayOS production status

**BLOCKED — externally, not by code.** Confirmed no real-looking PayOS credential exists in any
committed file (`.env.example` only, all three PayOS vars commented placeholders). Outstanding
blockers, classified by type (unchanged from Sprint 10's own classification, re-verified):
real merchant account (EXTERNAL ACCOUNT), production price sign-off (PRODUCT DECISION), webhook URL
registration (DEPLOYMENT, blocked on domain), production domain/HTTPS (DEPLOYMENT), cancelled/expired-webhook behavior against the real provider (unverifiable without #1).

## 18. Account data-rights status

COMPLETE, shipped this sprint (Sprint 10), independently tested (unit/e2e/Playwright), two real
defects found and fixed during Sprint 10's own closure. Discoverable in the UI: a dedicated
top-level Settings card, not nested inside the collapsed "More tools" accordion
(`settings/page.tsx:154` vs. lines 133-152).

## 19. Notifications current state

**Zero code.** Confirmed via three independent methods this pass: (a) direct grep for
`model Notification` in `schema.prisma` — no match; (b) grep for "notification" (case-insensitive)
across `apps/` — only 3 files match, all incidental (generic toast component, an unrelated payment
comment, the Settings "coming soon" line); (c) grep for `@Cron`/`ScheduleModule`/`CronExpression`
across the entire API — zero matches anywhere in the codebase, confirming there is no scheduled-job
infrastructure of any kind today, not even for an unrelated purpose. There is also no queue library
(`BullMQ`) in `apps/api/package.json` — Redis is used today only for rate-limiting, the Companion
generation-concurrency lock, geocoding cache, and export-job state, all direct Redis calls, not a
job queue. This is a genuine, real gap relative to the Bible's own technical sketch (Module 19,
§17, which assumes BullMQ for scheduled evaluation and delivery) — building Notifications means
introducing either a scheduler package or a comparable polling/cron mechanism from scratch, not
just adding a new NestJS module to existing infrastructure.

## 20. Notifications Bible priority

**V1** — confirmed directly from Module 1 §4's Feature Prioritization list (not inferred, not
carried over from a prior audit's claim): "V1 — ... Notifications (memory-triggered, not generic
'come back' pushes)." This places it in the same tier as Natal Chart, Numerology, and the Premium
paywall — all of which have already shipped. It is the **only** V1-tier module with zero code.
Module 19 (the dedicated Notifications spec) reinforces this is not optional scope: its "standing
creed" ("Every notification should have a reason... Silence is better than interruption... The
best notification is often the one never sent") and its explicit hard dependency on Memory (already
built, Module 3 §3: "hard dependency on Memory — a notification requires a genuine memory-based
reason to exist") show the module was scoped assuming Memory would ship first, which it has.

## 21. Community current state

Zero code — same three-method verification as §19 applies (no Prisma model, only incidental string
matches, e.g. marketing copy and a tarot-card's prose). Confirmed unchanged since Sprint 9.

## 22. Community Bible priority

V1.5/P3, confirmed via Module 1 §4 and Module 16's engineering table. Module 3's IA reviewer
explicitly recommends Community **not** get a permanent nav slot pre-launch. Module 18's own
Reconciliation Note (§0) is unusually candid that the brief asked for Feed/Groups/Clubs/Profile/
Recognition/Leadership and the module had to actively resolve tension against Module 1's "not a
social network" guardrail — meaning even when built, Community carries a materially higher
trust/safety design burden (moderation, pseudonymous identity, per-item opt-in consent before
anything personal crosses over) than any other V1.5 candidate.

## 23. Eastern Horoscope actual Bible scope

Independently re-read Module 14 in full this pass (not just cited from the Sprint 10 audit): it is
a **Chinese zodiac / Five-Elements annual-cycle system** — animal sign, element, Year Energy,
thematic (never predictive) interpretation across life-domain sections (Relationships, Career,
Health Reflection), explicitly and permanently rejecting lucky-number/lucky-color/luck-scoring
content as "superstition-adjacent... with no reflective value." It is **not** Tử Vi Đẩu Số
(12-palace/star natal astrology) and not Bát Tự/Four Pillars — confirmed by Module 14's own
Technical Specification (§17), which calls only for "a precise lunisolar calendar calculation
library" and a Five Elements interaction lookup, not a palace/star placement engine. The repo folder
name `web-tu-vi` is a legacy codename never used inside the Bible itself.

## 24. Eastern Horoscope priority

**V1.5, Module 16's P3 ("expansion, not core-loop validation")** — confirmed directly, not
inferred. Module 1 §4's own trade-off note states the V1.5 placement was a deliberate choice:
"Choosing memory depth over content breadth (V1.5 pushes out Eastern Horoscope...) accepts slower
initial market coverage in exchange for a defensible product moat." It has always been scoped as
*after* the systems already shipped in Sprints 6–9, and — newly confirmed this audit — it is also
explicitly **below Notifications** in the same tier list (V1 vs V1.5).

## 25. SEO/indexability status

Re-verified fresh, file-by-file, not assumed from the Sprint 10 audit: `sitemap.ts` indexes exactly
7 public marketing routes; `robots.ts`'s disallow list is a byte-for-byte match against
`middleware.ts`'s actual auth-gated route set — policy and enforcement are consistent, this is a
deliberate architecture, not an oversight. Page-level metadata (title/OpenGraph/Twitter cards) is
genuinely well-built even on gated pages, but none of it is reachable by a crawler. No canonical
tags, no dynamic `generateMetadata`, no blog/content section anywhere. **The entire product beyond
the 7-route marketing shell remains structurally non-indexable by Google**, unchanged since before
Sprint 9.

## 26. Landing/activation findings

The landing page is a coherent single-scroll narrative (Hero → Trust → Problem/Solution →
HowItWorks → DiscoverySystems → CompanionPreview → Memory → Privacy → Testimonials → Pricing → FAQ
→ CTA) with a clear headline ("An AI that actually remembers you") and a single primary CTA into
registration. Onboarding is real but **skippable** (a working `useSkipOnboarding` hook + "Skip for
now" button), which is good for low-friction activation but means a new user can reach the Dashboard
having never been walked through why the product is different from a horoscope app — the exact
"mental-model mismatch" risk Module 1 §3/§17 names as the single biggest UX threat to the whole
strategy. More concretely: **the Bible's own defined Activation event — "the first Companion message
that references something the user just said" — does not appear to be instrumented anywhere in code**
(no analytics/event-tracking call found near Companion message handling in either research pass).
This means the product cannot currently measure whether its own North Star precursor event is even
happening, let alone at what rate.

## 27. Retention findings

**The single most consequential finding of this audit, confirmed by direct search rather than
inference**: there is no proactive return mechanism in the product today, of any kind. Zero
`@Cron`/`ScheduleModule`/`CronExpression` usage anywhere in `apps/api/src`. Zero push notification
service. Zero re-engagement email (the existing `mail.service.ts` is used only for
auth/verification email, never for lifecycle/re-engagement). Settings literally tells the user
"Notifications and theme are coming soon." What *does* exist for retention today is entirely
passive and content-based: Tarot/Numerology/Natal-Chart history pages, Journal/Memory accumulation,
and a private (non-gamified, non-shaming) streak-detection rule inside Reflection
(`positiveStreakRule`/`negativeStreakRule`, `apps/api/src/reflection/rules/reflection-rules.ts:277-302`)
that surfaces a card, not a counter or flame icon — confirming the product correctly avoided the
Guardrail-violating gamified-streak pattern, but also confirming that even this one retention-adjacent
mechanism is a frozen module hidden in a collapsed Settings card, not a first-class part of the
product experience. **Today, a user returns only if they remember to on their own.** This is the
structural gap Notifications (§19–20) exists specifically to close, and it is the single clearest,
most evidence-backed product gap this audit found anywhere in the repository.

## 28. Mobile/responsive findings

Both known historical Low findings were independently re-checked against current code, not
re-asserted from memory:

- **Tablet fixed-nav overlap**: still present, unchanged. `tailwind.config.ts:91` defines a single
  `desktop: 1280px` breakpoint; the sidebar (`components/layout/sidebar.tsx:15`) only renders at
  `desktop:flex` and the bottom tab bar (`components/layout/mobile-navigation.tsx:14`) only hides at
  `desktop:hidden` — so the entire 768–1279px tablet range still gets the phone's bottom nav rather
  than its own layout. Cosmetic, low-severity, open since Sprint 4B, four sprints running.
- **Natal chart 0°/360° collision**: **partially fixed, not fully closed** — new finding this
  audit (the Sprint 9/10 audits described this as untouched; it has since been addressed for the
  general case). A real collision-easing function exists
  (`natal-chart-wheel.tsx:39-53`) and correctly nudges glyphs for any two placements within 7° of
  each other *except* when they straddle the 0°/360° seam, because the comparison loop only checks
  each sorted placement against its immediate predecessor and never wraps the last element back to
  the first. The narrow original bug (e.g., a planet at 3° and another at 358°) therefore still
  reproduces. Both remain cosmetic, low-traffic, and isolated to their own surfaces — see §32 for
  disposition recommendation (still not worth gating a sprint on, but now a 10-minute fix rather than
  an open question).

## 29. Trust/privacy findings

Account export/deletion (Sprint 10) is genuinely well-surfaced: a dedicated top-level Settings card
with plain-language buttons and a confirmation dialog that states exactly what's deleted vs.
retained (`account-data-section.tsx:75-109`) — not buried in the collapsed "More tools" accordion
used for the frozen modules. The `/privacy` page was updated accurately for the new behavior but
**honestly labels itself as a Sprint-1-level placeholder**, not a finished legal policy. **New gap
found this audit**: no explicit AI-nature disclosure exists on the privacy page or anywhere else
public-facing — a real, if minor, shortfall against the AI Constitution's (Module 25 §9) and AI
Philosophy's (Module 1 §4.5, rule 7) standing requirement that the AI "never claims capabilities it
doesn't have" and that its nature be transparent. This is a cheap, high-trust-value fix, not a
structural one.

## 30. Operational-readiness findings

| Item | Status | Evidence |
|---|---|---|
| Env var documentation | **READY** | `apps/api/.env.example` (157 lines, fully categorized: DB/Redis/JWT/email/AI/PayOS/misc), `apps/web/.env.example` (2 vars) |
| Health checks | **READY** | `GET /health/live`, `GET /health/ready` (checks Postgres + Redis directly) |
| Prisma migrations | **READY** | 17 migration entries, latest `20260812033827_natal_chart_discovery_foundation`, zero drift per Sprint 10's own `prisma migrate status` |
| Redis | **READY** | `REDIS_URL` is the only var needed; used for throttling, Companion concurrency lock, geocoding cache, export-job state, health check |
| Email provider | **NEEDS BUSINESS DECISION** | Dev uses Mailpit; production providers (Resend, Postmark) are both fully coded (`mail-provider.interface.ts` + two real implementations) behind an `EMAIL_PROVIDER` switch, but no real API key exists anywhere — a business/ops choice, not an engineering gap |
| Error tracking / APM | **NEEDS ENGINEERING** | Structured logging exists (Pino, `pino-http`, `pino-pretty`) but no Sentry or equivalent error-tracking/APM dependency exists anywhere in either app's `package.json` — a genuine, real gap for production observability, newly surfaced by this audit (not mentioned in the Sprint 10 audit) |
| Job scheduling / queues | **NEEDS ENGINEERING** | No `@nestjs/schedule`, no BullMQ, no cron of any kind exists — directly relevant to §19/§20, since Notifications (and any future scheduled feature) needs this built from scratch |
| PayOS production credentials | **NEEDS BUSINESS DECISION** | See §17 |
| AI provider production credentials | **NEEDS BUSINESS DECISION** | Real key(s) must exist in the deployed environment; this repo intentionally contains none, and production boot hard-fails without one (`env.validation.ts:176-187`) — a safety feature, not a gap |

## 31. Test-health findings

All 4 flaky spec files reconfirmed present and unchanged: `flow-15-reflection-foundation.spec.ts`
(2 test cases, matching the historically reported "flow-15 ×2"), `flow-16-insight-preparation.spec.ts`,
`flow-17-insight-experience.spec.ts`, `flow-18-review-engine.spec.ts` — all reference
Reflection/Insight/Review content with 10-second assertion windows, consistent with the
long-documented "background pattern-detection job doesn't materialize in time" signature
independently reproduced across at least 4 sessions now (Sprint 8 baseline, Sprint 9 closure,
Sprint 10 implementation, Sprint 10 closure). **New, relevant finding this audit**:
`playwright.config.ts:6-7` sets `retries: 0` — there is no automatic retry safety net, so this
known environment-sensitive flake will always surface as a hard CI failure on the first bad timing
roll, not a pass-on-retry. This doesn't change the underlying diagnosis (still classified as
environment/timing, not a regression) but does mean the maintenance cost of leaving it unaddressed
is higher than a "just re-run CI" framing would suggest.

## 32. Biggest remaining product gap

**No proactive return loop exists anywhere in the product.** Every other major system (3 Discovery
engines, Companion, Memory, Journal, Premium mechanics, account data rights) is genuinely complete
and well-built. The product's own Business Flywheel (Module 1 §4.7) and Core Product Loop (Module 2
§4) both explicitly require a Retention/re-engagement stage to close the loop, and the Bible
assigns exactly one module to that job — Notifications — which is the only V1-tier item with zero
code. This is not a matter of opinion or prioritization philosophy; it's the one place where the
product's own designed loop is structurally incomplete.

## 33. Biggest remaining engineering gap

No scheduled-job/queue infrastructure exists at all (§19, §30) — building Notifications (or any
future time-based feature) requires introducing this capability from scratch, not just adding a
module on top of existing infrastructure. Secondarily: the Tarot/Numerology/Natal-Chart AI calls
still bypass the cost-control/concurrency-lock protections Companion has (§14) — a real, if
lower-urgency, abuse/cost-exposure gap.

## 34. Biggest external/business gap

PayOS production activation remains blocked purely on non-engineering items: real merchant
credentials, final price sign-off (currently an honestly-flagged `79,000 VND` placeholder),
production domain/HTTPS, and webhook URL registration. Zero code-side blockers remain, confirmed
independently this audit.

## 35. Option A score

**3.95 / 5** — Notifications & Retention Foundation. Highest on Bible priority, launch impact
(closes the flywheel's only missing stage), and retention impact (the only real fix for §27's
finding); the only real cost is medium engineering effort (new scheduler infra) — see §37 for full
methodology.

## 36. Option B score

**2.90 / 5** — Eastern Horoscope. Solid on engineering ease (proven 3x pattern, real library
candidate) and user-visible value, but explicitly ranked below Notifications by the Bible itself
and doesn't touch the retention gap.

## 37. Option C score

**2.15 / 5** — SEO/Public Acquisition. Weakest of the growth-oriented options: low retention impact
by definition, low near-term revenue impact (nothing to convert into without live payments), and a
Medium-High engineering lift once you account for the content/blog work implied by "make something
worth indexing," not just flipping `robots.ts` flags.

## 38. Option D score

**3.45 / 5** — Payment Production Enablement. Second-highest raw score (highest launch impact and
revenue impact of any option), but scores lowest on Risk/Dependencies because nearly all remaining
work is external/business-gated, not engineering-gated — this is exactly the "don't build an
engineering sprint around business blockers" case the audit brief calls out explicitly (§22 of the
brief). Routed to the parallel founder checklist (§49) instead of the primary sprint recommendation.

## 39. Option E score

**2.45 / 5** — UX/Activation Hardening. Real, cheap, evidence-backed items exist (AI disclosure,
activation-event instrumentation, the two mobile cosmetic bugs), but they don't cohere into a
sprint-sized, single-narrative body of work on their own — better absorbed as a small bundle inside
whichever sprint is chosen, matching the precedent Sprint 10 itself set (bundling the ProviderLog
fix and stale-comment cleanup alongside its main feature).

## 40. Option F score

**1.60 / 5** — Community. Lowest score on every dimension except retention potential; V1.5/P3,
explicitly not recommended for a pre-launch nav slot by the Bible's own IA module, and carries the
single largest new trust/safety surface (moderation, blocking, reporting, consent architecture) of
any candidate in this audit.

## 41. Recommended Sprint 11

# SPRINT 11 — NOTIFICATION & RETENTION FOUNDATION

## 42. Why this wins

It is the only option that is simultaneously: (a) explicitly Bible-tiered at V1, the same tier as
every other already-shipped system; (b) the direct, named fix for the single clearest, most
evidence-backed gap this audit found (§27 — zero proactive return loop, confirmed by exhaustive
grep, not inference); (c) fully engineerable today with no founder/business blocker standing in the
way, unlike Payment (§34, §38) or SEO's implied content strategy; and (d) the module that, once
shipped, completes the Bible's entire V1 tier — every remaining candidate becomes explicitly V1.5
or later, giving Sprint 12+ planning a clean, source-backed line to work from (§50).

## 43. Why not Eastern Horoscope now

Three independent, direct textual findings from Module 1 and Module 14 (§20, §23, §24), not
inference: it is V1.5/P3, explicitly described as "expansion, not core-loop validation," and
explicitly ranked *below* Notifications in the Bible's own tier list. Building a 4th Discovery
engine now would add user-facing content depth to a product that still has zero mechanism to bring
a user back tomorrow — the same "wrong order of operations" reasoning Sprint 10's own audit applied
to reject it in favor of Launch Hardening applies again here in favor of Notifications.

## 44. Sprint 11 scope

**IN SCOPE**
- Notification data model (`Notification`, `NotificationPreference` per Module 19 §17's own
  sketch) and the minimum scheduled-evaluation infrastructure needed to run it (introduce
  `@nestjs/schedule` or an equivalent lightweight cron mechanism — this is new infrastructure, size
  the estimate accordingly).
- The Notification Intelligence Engine's core rule, scoped conservatively for a first release:
  default-to-silence, evaluate only genuinely significant Memory-sourced signals already available
  today (reuse Module 10's existing significance scoring rather than inventing a new one), enforce a
  small, hardcoded per-user conservative budget/cooldown (Module 19 §6/§17) rather than building the
  full adaptive Timing Engine (§10) in v1 — ship the safe, restrained default first, defer learned
  per-user timing to a later iteration.
- Two delivery channels only: in-app Notification Center (chronological, no unread-badge/red-dot
  urgency styling, per Module 19 §5/§21's explicit rejection of that convention) and email (reusing
  the already-coded Resend/Postmark provider infrastructure — no new provider integration needed).
  Push notifications explicitly deferred (no mobile app exists yet to make push meaningful, and web
  push is a materially larger scope addition not justified for a first release).
- Preference controls in Settings: channel opt-out (push is moot; email/in-app) and category
  opt-out, easy to find, matching the existing Settings card pattern established by
  `AccountDataSection` in Sprint 10.
- Bundle two small, already-diagnosed hardening items alongside the main feature, following Sprint
  10's own precedent of absorbing cheap, already-root-caused fixes into the sprint that touches
  adjacent code: (a) add a plain-language AI-nature disclosure line to `/privacy` (§29 — a few
  sentences, no legal rewrite); (b) close the natal-chart wraparound comparison gap (§28 — the fix
  is extending the existing loop to also compare the last sorted placement against the first,
  isolated to `natal-chart-wheel.tsx`).

**OUT OF SCOPE**
- Push notifications (no mobile app; web push is a distinct, larger initiative).
- The full adaptive per-user Timing Engine (Module 19 §10) — ship fixed conservative timing first,
  learn adaptively later once real delivery data exists.
- Eastern Horoscope, Community, Reports, or any new Discovery engine.
- SEO/content investment, `/menh-vi` work (nothing to consolidate, unchanged finding).
- Payment production activation engineering (§38 — routed to the parallel founder checklist, §49;
  if founder-side blockers clear mid-sprint, the remaining engineering there is small and
  independently schedulable, but it is not this sprint's primary scope).
- Extending `CostControlService`/`CompanionThrottlerGuard` coverage to Tarot/Numerology/Natal-Chart
  AI calls (§14, §33) — real and worth a ticket, but unrelated to Notifications' own code paths;
  don't scope-creep the sprint to absorb it.
- Adding Sentry/APM (§30) — a real gap, but a horizontal ops investment better scoped as its own
  small ticket than folded into a product-feature sprint.
- Full WCAG accessibility audit, full design-system rework, tablet-nav layout redesign (§28 — still
  cosmetic and backlog-appropriate, not upgraded to in-scope by this audit).

**DEFERRED**
- Adaptive Timing Engine, push channel, and richer notification categories (Reports-ready,
  Community replies) — natural follow-ups once the foundation ships and real delivery/engagement
  data exists to tune against.
- Eastern Horoscope Foundation — next Discovery-engine candidate, technical/library groundwork
  already documented in the Sprint 10 audit (§21–25 there), ready to pick up once V1 is fully
  closed.

## 45. Sprint 11 dependencies

None blocking. Memory (the hard dependency Module 19 §3/Module 3 §3 both name explicitly) has been
built and stable since Sprint 3C. Email provider infrastructure (Resend/Postmark) already exists in
code, needing only a real API key in the target environment to activate for real delivery — the
same "needs config, not engineering" pattern already established for other production secrets.

## 46. Sprint 11 risks

1. **New infrastructure category**: this is the first scheduled/cron-driven feature in the
   codebase — get the "at-most-once delivery, safe under retry/restart" semantics right up front
   (idempotency keys per Module 19 §17, matching the pattern the payment webhook already
   established) rather than retrofitting it after a duplicate-notification incident.
2. **Judgment risk, not technical risk**: the "genuine significance" bar (what actually clears the
   notify threshold) is a product-judgment call the Bible deliberately leaves qualitative ("default
   is no"). Getting this too loose risks becoming exactly the engagement-bait pattern the entire
   module's creed exists to prevent; too tight risks shipping a feature that never fires. Recommend
   an explicit, conservative first-release bar with room to loosen deliberately later, never the
   reverse.
3. **Email deliverability** is untested at any real volume in this codebase (used today only for
   low-volume auth email) — first real Notification-driven email send should be smoke-tested
   carefully, matching the discipline already applied to the one real (paid) Gemini smoke test
   pattern used for AI features.

## 47. Sprint 11 Definition of Done

- Real, tested (unit + e2e) Notification model, evaluation engine (default-to-silence, budget-capped,
  Memory-significance-gated), and delivery pipeline for both in-app and email channels.
- Real Notification Center in the frontend (chronological, no unread-badge urgency styling per
  Module 19's explicit standing rule), wired to real preference controls in Settings replacing the
  current "coming soon" line.
- At least one real, end-to-end reproduced notification (Memory-anniversary or equivalent genuine
  trigger) delivered through both channels in a test environment, not merely unit-tested in
  isolation.
- The two bundled hardening fixes (AI disclosure copy, natal-chart wraparound comparison) shipped
  and verified.
- Full regression green (lint/typecheck/unit/e2e/build/Playwright — the 5 pre-existing
  Reflection/Insight/Review flakes are expected and should be re-confirmed as unrelated, not
  silently ignored) matching the rigor Sprints 8–10 established.
- Trust/safety pass specifically confirming zero urgency, FOMO, or guilt-based copy anywhere in the
  notification templates (Module 19 §21's own explicit QA requirement).

## 48. Founder/business checklist

See §49.

## 49. Founder/business checklist (full)

- [ ] Obtain real PayOS merchant credentials (sandbox and/or production).
- [ ] Sign off on the final Premium price (currently `79,000 VND`, an explicitly-flagged engineering
      placeholder).
- [ ] Provision a production domain + HTTPS (blocks checkout/webhook URL registration).
- [ ] Register the production webhook URL with PayOS once the domain exists.
- [ ] Decide the exact data-protection-law retention period for payment records (documented as an
      open question in `docs/architecture/account-data-rights.md` §3, not invented by engineering).
- [ ] Choose a production email provider (Resend or Postmark — both are fully coded) and provision a
      real API key.
- [ ] Decide whether/when to invest in a real legal Privacy Policy to replace the current, honestly-labeled
      Sprint-1 placeholder before any public/general-availability launch.

This checklist is intentionally not framed as Sprint 11 engineering tasks — every item here is
either an external account/credential action or a product/legal decision, consistent with the
"don't manufacture an engineering sprint around business blockers" principle this audit applied to
reject Payment Production as the primary Sprint 11 recommendation (§38, §44).

## 50. Proposed next 3–5 sprint roadmap

Tentative, not a commitment — re-evaluate after Sprint 11 actually ships, the same way this audit
re-evaluated Sprint 10's own forward-looking guesses rather than trusting them blindly.

**PRE-LAUNCH**
- **Sprint 11 — Notification & Retention Foundation** (this audit's recommendation). Completes the
  Bible's entire V1 tier.
- **Sprint 12 — Trust & Monetization Closeout**: whatever engineering remains once founder-side
  PayOS blockers clear (real webhook registration, one real end-to-end transaction verification),
  plus the small hardening items explicitly deferred out of Sprint 11 (§44 — cost-control parity for
  Discovery AI calls, Sentry/APM addition, tablet-nav layout if it's ever prioritized). Scoped small
  and bounded, matching Sprint 10's own "launch hardening" shape rather than a large feature build.

**V1.5**
- **Sprint 13 — Eastern Horoscope Discovery Foundation**: lowest-risk of the three remaining V1.5
  systems (proven 3x architecture, real library candidate already identified in the Sprint 10
  audit, no palace/star engineering complexity per Module 14's actual scope, §23).
- **Sprint 14 — Reports Foundation**: periodic Memory/Journal/Discovery synthesis; sequenced after
  Notifications (which will have driven fresh engagement data) and Eastern Horoscope (which adds a
  4th Discovery source to synthesize from) so the first Reports don't feel templated for lack of
  density, matching Module 2 §7's own explicit warning against shipping Reports before memory
  density exists.
- **Sprint 15 — Community Foundation**: last of V1.5, deliberately sequenced last given its
  materially larger trust/safety surface (§22) and the IA module's own recommendation against an
  early nav slot — do this only once moderation/reporting/blocking groundwork can be resourced
  properly, not just because it's the last item on a list.

## 51. Files changed

`docs/audit/sprint-11-pre-implementation-audit.md` only (this file).

## 52. Git status

Clean before this audit; one new untracked file after (`docs/audit/sprint-11-pre-implementation-audit.md`).

## 53. Commit status

Not staged, not committed, not pushed.

## 54. Final recommendation

# SPRINT 11 — NOTIFICATION & RETENTION FOUNDATION

Chosen from direct, independently-verified evidence: it is the only unshipped V1-tier module in the
Product Bible, it is the exact, named fix for the single clearest gap this audit found in the actual
repository (zero proactive return mechanism of any kind, confirmed by exhaustive search rather than
assumption), it has no founder/business blocker standing in its way, and shipping it closes the
Bible's entire V1 tier — leaving every future Discovery/Community candidate cleanly and
unambiguously V1.5. Payment production activation continues in parallel as a founder/business
checklist (§49), not as competing engineering scope.

---

## Final summary table

| # | Item | Answer |
|---|---|---|
| 1 | Current HEAD | `ffd82dc` |
| 2 | Local/remote sync | in sync, 0/0 |
| 3 | Working tree before audit | clean |
| 4 | Sprint 10 footprint (confirms no overlap with this audit's focus areas) | 26 files, auth/payment-webhook/users-export-deletion/settings/privacy only |
| 5 | Product Bible V1 tier | Memory, Natal Chart, Numerology, Premium, **Notifications** — all shipped except Notifications |
| 6 | Completed modules | Auth, Onboarding, Dashboard, Discover (hub), Companion, Memory, Journal, Tarot, Numerology, Natal Chart, Premium mechanics, Account data rights |
| 7 | Partial modules | Payment (production), SEO, Privacy, Settings |
| 8 | Not-started modules | Eastern Horoscope, Notifications, Community, Admin |
| 9 | Frozen modules | Reflection, Insight, Review, Goal — unchanged, still hidden in collapsed Settings card |
| 10 | Experimental modules | `/menh-vi/*` — unchanged, still dormant, disclosed, non-competing |
| 11 | Tarot status | COMPLETE end-to-end |
| 12 | Numerology status | COMPLETE end-to-end |
| 13 | Natal Chart status | COMPLETE end-to-end; 0°/360° collision fix now partial (general case fixed, wraparound case still open) |
| 14 | AI runtime status | 4 providers, single orchestrator, no silent prod fallback to Mock, cost-control gap on 3 Discovery surfaces unchanged |
| 15 | Premium status | COMPLETE mechanics, unchanged |
| 16 | PayOS code status | CONTRACT VERIFIED, zero code blockers |
| 17 | PayOS production status | BLOCKED externally (merchant account, price sign-off, domain, webhook registration) |
| 18 | Account data-rights status | COMPLETE, shipped Sprint 10, well-surfaced in UI |
| 19 | Notifications current state | Zero code — zero model, zero scheduler, zero delivery pipeline, zero UI |
| 20 | Notifications Bible priority | **V1** — confirmed directly, outranks Eastern Horoscope |
| 21 | Community current state | Zero code, unchanged |
| 22 | Community Bible priority | V1.5/P3, IA module recommends no pre-launch nav slot |
| 23 | Eastern Horoscope actual Bible scope | Chinese zodiac/Five-Elements annual system, NOT Tử Vi Đẩu Số |
| 24 | Eastern Horoscope priority | V1.5/P3, explicitly not next-after-V1, explicitly below Notifications |
| 25 | SEO/indexability status | Real sitemap/robots, policy matches enforcement, entire product beyond 7 marketing routes non-indexable by design |
| 26 | Landing/activation findings | Clear positioning, skippable onboarding, Activation event appears uninstrumented |
| 27 | Retention findings | **Zero proactive return mechanism exists anywhere in the codebase** — the audit's central finding |
| 28 | Mobile/responsive findings | Tablet-nav overlap unchanged; natal-chart collision partially fixed, wraparound case still open |
| 29 | Trust/privacy findings | Export/deletion well-surfaced; no AI-disclosure statement on `/privacy` (new finding) |
| 30 | Operational-readiness findings | Env vars/health/migrations/Redis READY; email NEEDS BUSINESS DECISION; error-tracking/APM and job scheduling NEED ENGINEERING |
| 31 | Test-health findings | 5 known flaky specs unchanged; `retries: 0` in Playwright config means no auto-retry safety net (new finding) |
| 32 | Biggest remaining product gap | No proactive return loop |
| 33 | Biggest remaining engineering gap | No scheduled-job/queue infrastructure exists at all |
| 34 | Biggest external/business gap | PayOS production activation (merchant account, price, domain, webhook registration) |
| 35 | Option A score | 3.95 / 5 — Notifications & Retention Foundation |
| 36 | Option B score | 2.90 / 5 — Eastern Horoscope |
| 37 | Option C score | 2.15 / 5 — SEO/Public Acquisition |
| 38 | Option D score | 3.45 / 5 — Payment Production Enablement (routed to founder checklist instead) |
| 39 | Option E score | 2.45 / 5 — UX/Activation Hardening (bundled in, not standalone) |
| 40 | Option F score | 1.60 / 5 — Community |
| 41 | Recommended Sprint 11 | **NOTIFICATION & RETENTION FOUNDATION** |
| 42 | Why this wins | Only unshipped V1 module; fixes the audit's central, evidence-backed gap; no business blockers; completes V1 tier |
| 43 | Why not Eastern Horoscope now | V1.5/P3, explicitly below Notifications in the Bible's own tier list |
| 44 | Sprint 11 scope | §44 |
| 45 | Sprint 11 dependencies | None blocking; Memory dependency already satisfied |
| 46 | Sprint 11 risks | New scheduled-infra correctness, notification-significance judgment calls, untested email volume |
| 47 | Sprint 11 Definition of Done | §47 |
| 48 | Founder/business checklist | §49 |
| 49 | Proposed next 3–5 sprint roadmap | Sprint 12 Trust & Monetization Closeout → Sprint 13 Eastern Horoscope → Sprint 14 Reports → Sprint 15 Community |
| 50 | Files changed by this audit | `docs/audit/sprint-11-pre-implementation-audit.md` only |
| 51 | Working tree after audit | One new untracked file, otherwise clean |
| 52 | Commit status | Not staged, not committed, not pushed |
| 53 | Implementation status | **Not implemented** — this is a research/decision document only |
| 54 | **FINAL RECOMMENDATION** | **SPRINT 11 — NOTIFICATION & RETENTION FOUNDATION** |
