# Roadmap V2 — Tử Vi Domain Block Resequencing Audit

**Type:** Planning/research only. No feature implementation, no Prisma changes, no API routes, no
frontend pages, no astrology-rule inference, no edit to the locked Tử Vi product definition. No
commit, no push.

**Trigger:** Sprint 18 (Vietnamese Tử Vi Deterministic Core) was formally blocked this session
(`docs/audit/sprint-18-pre-implementation-audit.md`, verdict **B — DOMAIN REFERENCES / GOLDEN
VECTORS INCOMPLETE**), and a domain-resolution intake pack was produced
(`docs/domain/tu-vi/domain-resolution-pack.md`) to make that resolution process concrete. **This
does not remove Vietnamese Tử Vi from Product Complete** — it is still a founder-greenlit,
unconditional core capability (`product-completion-roadmap-v2.md` §2). This document determines what
engineering work can safely proceed in parallel while domain resolution happens on its own,
non-engineering timeline.

---

## 1. Git baseline (fresh this session)

```
git status --short   → ?? docs/audit/sprint-18-pre-implementation-audit.md
                        ?? docs/domain/tu-vi/domain-resolution-pack.md
git diff --check      → (empty)
HEAD                  = cfe0824d01a6d681011be10845dfd18fac113274
origin/master          = c1c8b8f916a959c62fab1d45328ba3eabcf902e7
ahead/behind           = 1 ahead / 0 behind
```

`git log -10 --oneline`:
```
cfe0824 docs: Sprint 17 Eastern Horoscope release closure verification
c1c8b8f [update][commit] phase add eastern
dd029a2 [update]
dc6684e refactor: complete Sprint 14 product ambiguity cleanup
50c0e93 feat: complete Sprint 13 production analytics foundation
2213cad docs: lock product completion roadmap v2
eb0c313 feat: complete Sprint 12 trust monetization closeout
9d66d3c feat: complete Sprint 11 notification retention foundation
ffd82dc feat: complete Sprint 10 launch hardening
eee8aff Merge branch 'master' of https://github.com/Xuanthanhit99/webtuvi
```

**Sprint 17 release-closure state:** verified closed, commit `cfe0824`, still local-only (1 ahead of
`origin/master`), not pushed by this session or any prior one. Sprint 17's own implementation lives in
`c1c8b8f`, already on `origin/master`. Not modified by this pass.

**Sprint 18 audit files:** `docs/audit/sprint-18-pre-implementation-audit.md` (verdict B, this
session's prior turn) and `docs/domain/tu-vi/domain-resolution-pack.md` (decision-form intake pack,
this session's prior turn) — both untracked, both unmodified by this pass.

**Unrelated local changes:** none found. No stash, no reset, no clean performed.

---

## 2. Roadmap V2 reconstruction (as actually executed vs. as originally written)

`product-completion-roadmap-v2.md` §1 states its own baseline as `HEAD = origin/master = eb0c313`
(Sprint 12) — that snapshot is now stale relative to actual repo state, since Sprints 13–17 have since
shipped. Reconstructed against real git history (not the document's own outdated baseline):

| Sprint | Roadmap V2 title | Actually shipped? | Evidence |
|---|---|---|---|
| 13 | Production Verification & Analytics Foundation | **Yes** | `50c0e93 feat: complete Sprint 13 production analytics foundation`; deployment runbook (`docs/operations/production-deployment-runbook.md`) documents real Docker build-and-run verification with 3 real defects found/fixed |
| 14 | Ambiguity Cleanup | **Yes** | `dc6684e refactor: complete Sprint 14 product ambiguity cleanup`; CLAUDE.md confirms `/menh-vi` archived (404) and frozen modules hidden |
| 15 | Tử Vi Domain & Calculation Specification | **Partially** — spec produced, decision register left open per its own honest verdict | `dd029a2 [update]` created `docs/domain/tu-vi/*.md`; verdict was "DOMAIN REFERENCES INCOMPLETE," not silently defaulted |
| 16 | Reports (Personal Destiny Report) | **Yes** | Bundled into the same `dd029a2` commit as Sprint 15's docs; `apps/api/src/reports/**` exists and was confirmed shipped in this session's own Sprint 17 closure pass |
| 17 | Eastern Horoscope | **Yes, closed** | `c1c8b8f`; Release Closure passed this session (`cfe0824`) — 82/82 unit, 21/21 e2e, flow-28 2/2, zero Blocker/Critical/High |
| 18 | Tử Vi Deterministic Core Engine | **BLOCKED** | This session's audit, verdict B |
| 19–22 | Tử Vi Verification/UX/AI/Vận | **Not started** | Sequentially dependent on 18 |
| 23 | Admin, SEO/Public Content, Shareability | **Not started** | Confirmed zero admin module, zero share feature (§4 below) |
| 24 | Product Complete Release Gate | **Not started** | N/A |

**No sprint was silently skipped or renumbered.** Sprint 15's own honest "carry forward what can't be
resolved" DoD clause (roadmap §6, Sprint 15 entry) is exactly what happened — this is the roadmap
working as designed, not a deviation from it.

---

## 3. Tử Vi track status (explicit, not renumbered away)

| Sprint | Status |
|---|---|
| 18 — Tử Vi Deterministic Core Engine | **BLOCKED_BY_DOMAIN_REFERENCE** |
| 19 — Tử Vi Golden Verification & Domain Audit Gate | **BLOCKED_BY_SPRINT_18** |
| 20 — Tử Vi Product Experience (UX) | **BLOCKED_BY_SPRINT_18/19** |
| 21 — Tử Vi AI Interpretation | **BLOCKED_BY_SPRINT_18/19/20** |
| 22 — Tử Vi Vận Depth | **BLOCKED_BY_SPRINT_18+** (also independently gated on `DECISION-12`, deliberately deferred) |

These five sprint numbers are **not renumbered, not removed, not merged into later sprints**. What
moves is *execution order in calendar time* — later, independent sprints (23's admin-tooling
component specifically) may run before 18–22 clear, without changing what number they will eventually
carry when the roadmap is next formally revised. This mirrors the same non-destructive resequencing
discipline already used once in this project (Sprint 15's own "pull the spec sprint early because its
lead time is the longest pole," roadmap §5) — reapplied here in the opposite direction (pull
*unblocked* work forward, rather than pulling the *blocked* work's prerequisite earlier).

---

## 4. Independent remaining work — audited against actual repository state

Findings below are from direct repository inspection this session (grep/read across `apps/api/src`,
`apps/web`, `.github/`, `docs/`), not assumed from the roadmap document's own descriptions.

| Item | Classification | Evidence |
|---|---|---|
| **Admin/operator lookups** (user, entitlement, payment, notification-health, AI-spend) | **READY_ENGINEERING** | **Zero admin infrastructure exists.** No `apps/api/src/admin/` module, no `AdminModule`/`RolesGuard`/`@Roles()` anywhere, no `role` field on the Prisma `User` model at all (only unrelated chat-message `MessageRole` enums). This is a real, well-precedented, additive gap — every other module in this codebase already follows the owner-scoped-record pattern an admin layer would extend. |
| **SEO/public acquisition** | **READY_ENGINEERING** (content-heavy, lower engineering lift) | Eastern Horoscope (the roadmap's own stated SEO precondition, §6 Sprint 23 dependency) is shipped and closed. No SEO/calculator page code found yet. Largely content-authoring work, not blocked technically, but lower leverage before real traffic exists. |
| **Shareability** for Discovery results | **READY_ENGINEERING** | Confirmed zero implementation — grep for "share"/"Share" across `apps/web/features` found only unrelated prose. A real, scoped, additive UI feature. |
| **Accessibility cleanup** | **READY_ENGINEERING**, but explicitly scoped "targeted pass" only (roadmap §8) | No `*a11y*`/`*accessib*` doc or test tooling (`jest-axe` etc.) exists anywhere. `aria-*` usage is broad (126 occurrences/87 files) but ad hoc, not audited. Real gap, low urgency per the roadmap's own explicit scope-out of full WCAG certification. |
| **Tablet breakpoint polish** | **READY_ENGINEERING, but lower urgency than the roadmap assumed** | `tailwind.config.ts` defines a `tablet: '768px'` breakpoint, but the core nav (`sidebar.tsx`/`mobile-navigation.tsx`) only branches at `desktop: '1280px'` — the 768–1279px range gets the mobile bottom-nav treatment, not a dedicated tablet layout. **This session's own hands-on Sprint 17 QA (both the initial pass and the independent release-closure pass) directly tested 768px and 1024px and found no overflow, no clipping, no nav-overlap** — functionally correct, just visually "mobile nav stretched wide" rather than a purpose-built tablet layout. Reclassifying from the roadmap's P1 "fix" framing to a polish item is a judgment call, not a domain-decision reversal, and is flagged as such rather than silently downgraded. |
| **Production domain readiness** | **BLOCKED_EXTERNAL** | Dockerfiles (`apps/api/Dockerfile`, `apps/web/Dockerfile`) are real, build-and-run-verified per Sprint 13's runbook (3 real defects found and fixed during that verification — this is genuine done work, not aspirational). What remains (a real domain, real hosting choice, `TRUST_PROXY` final value) is founder/infra-owned, not engineering-blocked on missing code. |
| **Sentry runtime** | **BLOCKED_EXTERNAL** (code side is done) | `Sentry.init()` wired in both apps (`apps/api/src/instrument.ts`, `apps/web/instrumentation*.ts`/`sentry.*.config.ts`), scrubbing utilities exist and are tested. `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` are commented out in both `.env.example` files — disabled until a real DSN is provisioned. Nothing further for engineering to build here; verification requires the founder's Sentry project. |
| **PostHog runtime** | **BLOCKED_EXTERNAL** (code side is done) | Real HTTP-based server-side PostHog sink (`posthog-http.sink.ts`, deliberately not the `posthog-node` SDK, for privacy reasons — a real, documented engineering decision, not a shortcut) with a no-op fallback. `POSTHOG_API_KEY` commented out in `.env.example`. No client-side analytics SDK exists in `apps/web` — analytics is server-only by design. Needs a real API key, not more code. |
| **Production email** | **BLOCKED_EXTERNAL** (code side is done) | Three real provider implementations exist (Mailpit/dev, Resend, Postmark) behind one interface, selected via `EMAIL_PROVIDER`. `.env.example` explicitly warns "production must not use mailpit." Needs a real provider credential, not more code. |
| **PayOS activation** | **BLOCKED_EXTERNAL** (code side is largely done) | Provider integration, signature verification, a real production kill switch (`PAYMENTS_ENABLED`, confirmed wired end-to-end, commit `1946b45`), and an idempotent webhook handler all exist. Needs real merchant credentials and a price sign-off, not more code. |
| **Privacy/ToS** | **BLOCKED_PRODUCT_DECISION** (legal-owned) | Real pages exist at `apps/web/app/(marketing)/privacy` and `/terms`, but each explicitly self-labels as a "Sprint 1 placeholder" pending real legal text. This is legal-owned content, not an engineering task. |
| **Deployment runbook gaps** | **Mostly closed** | `docs/operations/production-deployment-runbook.md` and `docs/architecture/production-deployment-readiness.md` both exist and are substantive, not placeholders. One concrete engineering gap found this session (not previously flagged anywhere): **`.github/workflows/ci.yml` triggers only on `push: branches: [main]`, but this repository's actual default branch is `master`** (`git remote show origin` confirms `HEAD branch: master`; no `main` branch exists) — meaning CI's push trigger has likely never fired on a direct push to this repo's real default branch. `pull_request:` triggers are unaffected. **A one-line, zero-risk fix.** |
| **Analytics dashboards/funnels** | **BLOCKED_EXTERNAL** (downstream of PostHog activation) | Instrumentation exists server-side; dashboard construction happens inside the PostHog product itself once a real project/key exists — not a BeaconVie codebase task. |
| **Payment retention/refund/tax policy impact** | **BLOCKED_PRODUCT_DECISION** | No refund-handling code exists anywhere in `apps/api/src/payment` (confirmed by grep). This is correctly gated on a policy decision (roadmap §4's own external checklist) before engineering builds against an undecided policy — building refund code against a guessed policy would repeat exactly the mistake this project's own Tử Vi domain discipline exists to prevent, just in a different domain. |
| **Stale-`PENDING`-order sweep job** | **READY_ENGINEERING, but re-scope against current architecture before building** | No cron/sweep job exists. However, `entitlement.service.ts` already documents a deliberate design choice: entitlement expiry is computed at *read* time specifically "so there is no background job whose failure could leave stale access" — meaning the original roadmap item's *purpose* (preventing stale access) may already be structurally satisfied by a different, arguably more robust mechanism than the sweep job it originally envisioned. This should be explicitly re-scoped (confirm what problem a sweep job would still solve, if any — e.g., cleaning up abandoned `PENDING` rows for reporting hygiene, not access correctness) rather than built to the original 1-year-old spec unchanged. |
| **Alerting** (AI-spend, payment-webhook-specific) | **BLOCKED_EXTERNAL** (downstream of Sentry/PostHog activation) | Cannot be meaningfully built or tested without a real Sentry project to alert into. |
| **Notification enrichment** | **DEFERRED_POST_LAUNCH** | Only 2 notification types exist (`tarot.daily_reminder`, `premium.activated|`), by explicit, documented design choice (the type's own doc comment lists Journal/Memory/Companion/Community/Reports triggers as deliberately excluded for lacking a deterministic trigger or being duplicative). Real, but correctly low-priority (roadmap P2 item). |
| **Reports polish** | **DEFERRED_POST_LAUNCH** | Reports (Sprint 16) is shipped; no specific defect or gap was found this session to justify prioritizing further polish now over higher-leverage gaps. |
| **Eastern Horoscope polish** | **DEFERRED_POST_LAUNCH** | Closed this session with zero Blocker/Critical/High findings (`sprint-17-final-report.md`) — no known defect to polish. |
| **Companion bridge for Eastern Horoscope (and the other 3 Discovery modules)** | **DEFERRED_POST_LAUNCH**, but worth naming precisely | Confirmed **absent as a real link/button in all four** Discovery modules (Tarot has prose text mentioning bridging to Companion, but no actual `<Link>`; Numerology/Natal Chart/Eastern Horoscope have none at all). Real, working `/companion` links exist elsewhere (Dashboard, Reports). This is consistent, cross-cutting, low-priority backlog — not a Sprint-17-specific gap, and not urgent enough to justify pulling forward on its own. |
| **Product Complete release automation/checklists** | **Mostly closed** | CI (`ci.yml`) already runs lint, typecheck, `prisma validate`/`migrate status` (drift detection), backend unit+e2e, frontend unit, both production builds, and a full Playwright e2e pass against the production build — a genuinely comprehensive pipeline, not a stub. The one concrete gap is the branch-trigger mismatch noted above. |

---

## 5. Candidate next-sprint scoring

Scored on: Product Complete impact, launch impact, revenue impact, user value, independence from
Tử Vi, effort, risk, reversibility. Scale: Low/Medium/High, qualitative (this is a planning judgment
call, not a fabricated numeric score).

| Candidate | Product Complete impact | Launch impact | Revenue impact | User value | Tử-Vi independence | Effort | Risk | Reversibility |
|---|---|---|---|---|---|---|---|---|
| **A. Admin tooling** (5 lookups) | High — directly named in roadmap §3 P2 item 4; operationally necessary before real users exist | High — support/debugging is not optional once payment is live | Medium-High — faster resolution of stuck payments/entitlement disputes | Indirect (support speed) | Complete | Medium | Low (additive schema, read-mostly endpoints) | High |
| **B. Production Activation & Legal/Runtime Closeout** | High in principle, but **almost entirely already engineering-complete** — remaining work is founder/legal-owned, not a buildable engineering sprint right now | High, eventually | High, eventually | None until launch | Complete | **Low remaining engineering effort** (mostly wiring credentials once provided) | Low | High |
| **C. UX/Accessibility Hardening** | Medium — real gaps (no a11y audit tooling, no dedicated tablet layout) but neither blocks launch and the roadmap itself scopes both narrowly | Low-Medium | Low | Medium (a11y genuinely matters, but no user complaint or defect surfaced this session) | Complete | Medium-High (a11y tooling setup + targeted fixes; tablet is lower-effort given it's already functionally correct) | Low | High |
| **D. Operator/Observability Hardening** | Overlaps substantially with A (admin lookups largely *are* the observability tooling); the Sentry/PostHog/alerting pieces are BLOCKED_EXTERNAL, not buildable now | Medium | Medium | Indirect | Complete | Low for what's actually buildable now (mostly blocked) | Low | High |
| **SEO/Shareability** (Sprint 23's other two components) | Medium — genuine growth-loop value, but lower leverage before real traffic/launch exists | Low pre-launch | Low pre-launch, higher post-launch | Medium (shareability), Low pre-launch (SEO) | Complete | Medium (shareability) / Low-Medium, content-heavy (SEO) | Low | High |

**Scoring conclusion:** **B is not actually a viable "next sprint"** in the normal sense — the
engineering side of it is already done (Dockerfiles verified, kill switch shipped, webhook
idempotent, three email providers wired, Sentry/PostHog wired-but-dormant); what remains is founder
credential provisioning and legal drafting, which is not engineering-schedulable work. **A (Admin
tooling) scores highest among genuinely available, well-scoped, high-value, zero-Tử-Vi-dependency
engineering work.** C and the SEO/Shareability components of the original Sprint 23 are real and
worth doing, but score lower on urgency/leverage right now and are natural candidates for the
*following* temporary sprint, not this one — bundling them in now would be exactly the "select a task
merely to stay busy"/scope-creep failure mode this task's own brief warns against.

---

## 6. Recommended temporary next sprint

### Recommendation: **"Interim Sprint — Admin Operator Tooling"** (a scoped subset of Roadmap V2's existing Sprint 23, pulled forward temporarily; Sprint 23 itself is not renumbered or redefined — its SEO/Shareability components remain there for a later pass)

### Exact scope

- Minimal role concept: add an additive `role` field to the `User` Prisma model (e.g. `USER` default,
  `ADMIN` value), migration additive-only, no destructive change to any existing table.
- An `AdminGuard` (or equivalent role check) mirroring this codebase's existing guard patterns
  (`JwtAuthGuard`, `DiscoveryThrottlerGuard`), not a new authorization paradigm.
- Five read-focused operator lookup endpoints, each owner/role-scoped exactly like every other module
  in this codebase already is:
  1. User lookup (account status, email verification state, key timestamps — no plaintext secrets)
  2. Entitlement lookup (Premium status, source, expiry — read-only against the existing
     `EntitlementService`)
  3. Payment lookup (order/webhook history for a user — read-only against existing payment records)
  4. Notification-health lookup (recent send/failure counts by type — read-only)
  5. AI-spend lookup (per-user or aggregate `AIUsage`/`provider_logs` summary — the exact tables this
     session's own Sprint 17 closure pass already queried directly to verify real Gemini usage,
     reused here as a first-class operator view instead of an ad hoc `psql` query)
- A minimal, unstyled-is-fine internal UI surface (or, if faster and equally safe, admin-only API
  responses consumed via existing tooling) — the roadmap's own P2 framing explicitly scopes this as
  "5 lookups," not a dashboard product.
- **Bonus, trivial, zero-risk, fold into the same sprint:** fix `.github/workflows/ci.yml`'s `push`
  trigger from `branches: [main]` to `branches: [master]` (or `[main, master]` if a future rename to
  `main` is anticipated) so CI actually runs on pushes to this repo's real default branch.

### Exact out of scope

- SEO/public content, shareability, accessibility audit tooling, tablet-nav redesign — all remain in
  their existing roadmap slots (Sprint 23 for the first two, Sprint 24 for the accessibility pass),
  not pulled into this interim sprint.
- Any Sentry/PostHog/email/PayOS credential wiring — blocked on founder-provided secrets, not
  engineering-schedulable.
- Any refund/retention/tax policy code — blocked on a legal/business policy decision.
- The stale-`PENDING`-order sweep job **as originally specified** — re-scope first (per §4's note
  above) rather than build to a possibly-superseded spec.
- **Anything Tử Vi.** No calculation code, no Prisma models for Tử Vi, no UI, no inference of missing
  astrology rules, no touching the locked product definition.

### Why this is safe during the Tử Vi block

- **Zero code path overlap.** Admin tooling reads existing tables (`User`, entitlements, payment
  records, `AIUsage`/`provider_logs`, notifications) that already exist and are already stable —
  it does not touch, depend on, or anticipate any Tử Vi schema, route, or engine.
- **Additive-only schema change** (one new `role` field with a default), consistent with every prior
  migration in this project's history (Eastern Horoscope's own Sprint 17 migration was the most
  recent example of this same additive discipline, independently verified clean in this session's
  Sprint 17 closure pass).
- **No founder/external blocker.** Unlike Production Activation, this sprint needs no new credential,
  no domain, no legal text — it can start today.
- **Reversible.** An admin role flag and five read-only lookups carry essentially no product-surface
  risk; if priorities shift again, this work is not wasted or entangled with anything else.
- **Directly de-risks the eventual Tử Vi launch itself**, without being Tử Vi work: once Tử Vi ships
  (Sprint 18–22, whenever domain resolution clears), the same admin surface will need to support it
  too (a 6th "Tử Vi chart" lookup is a natural, cheap future addition) — building the pattern now on
  already-stable modules is lower-risk than building it for the first time under Tử Vi launch
  pressure later.

---

## 7. Parallel Tử Vi domain-resolution track (non-engineering)

This track runs independently, on its own timeline, and must not be confused with an engineering
sprint — it has no sprint number, no engineering DoD, and is not scheduled against engineering
capacity.

```
TỬ VI DOMAIN RESOLUTION (parallel, non-engineering track)

1. Source acquisition        — obtain direct access to VDTTL-1956 / TD-TOANTHU (or the founder's
                                 chosen alternative), not just discussion-about-them search results
2. School selection           — founder decision, using domain-resolution-pack.md §1's decision form
3. Expert review               — engage a Tử Vi practitioner/domain expert to work through the
                                 resolution pack's remaining forms (§2–§12 of the pack)
4. Table transcription          — Cục, Tử Vi anchor, 14-star offsets, auxiliary stars, Tuần, Triệt,
                                 Tứ Hóa — each transcribed from the primary source per the pack's
                                 exact templates
5. Cross-check                  — second independent reviewer confirms each transcribed table
                                 (per this project's own two-reviewer discipline, unchanged)
6. Golden-vector population      — populate the 15-vector acquisition plan (domain-resolution-
                                 pack.md §13) from independently verifiable charts, never from a
                                 future BeaconVie engine
7. Expert confirmation            — every hard-gated rule reaches `EXPERT_CONFIRMED` per the pack's
                                 own review-status ladder (§14 of the pack)
8. Sprint 18 Domain Gate rerun      — re-run this session's own audit procedure
                                 (`sprint-18-pre-implementation-audit.md`'s methodology) against the
                                 now-resolved register; only a clean rerun unblocks Sprint 18
                                 implementation
```

**No checkpoint above is engineering work**, and no engineering sprint should be scheduled *inside*
this track — engineering's role is limited to receiving the resolved register at the end (checkpoint
8) and then proceeding with Sprint 18 as already specified in the roadmap.

---

## 8. Founder/external checklist (updated, separated from engineering)

Carried forward from `product-completion-roadmap-v2.md` §4, re-verified against actual repo state
this session (items marked "code-ready" have zero further engineering dependency — only the credential
itself is missing):

- [ ] PayOS merchant credentials *(code-ready — kill switch, provider, webhook all implemented)*
- [ ] Premium production price sign-off
- [ ] Production frontend domain
- [ ] Production API domain
- [ ] PayOS webhook registration *(blocked on domain, above)*
- [ ] Production email provider + credential *(code-ready — Resend and Postmark both implemented)*
- [ ] Payment retention period decision
- [ ] Refund policy *(no code exists yet — correctly gated on this decision first)*
- [ ] Tax/invoice decision
- [ ] Real Privacy Policy *(placeholder page live, explicitly self-labeled as such)*
- [ ] Real Terms of Service *(same)*
- [ ] Sentry project/DSN provisioned *(code-ready — both apps wired, scrubbing tested)*
- [ ] `TRUST_PROXY` production setting *(depends on hosting choice)*
- [ ] PostHog project/API key *(code-ready — real HTTP sink implemented)*
- [ ] **Tử Vi authoritative source(s) identified/engaged** — still the single highest-priority item
      on this list, now with a concrete intake mechanism (`domain-resolution-pack.md`) ready to
      receive the answer the moment source access exists

**Nothing on this list is engineering-blocked.** Every item is either a founder decision, a legal
task, or a credential/account the business must obtain — engineering has already done everything
buildable in advance of each one.

---

## 9. Product Complete critical path

```
                    ┌─────────────────────────────────────────────────┐
                    │  ENGINEERING PATH (independent of Tử Vi)         │
                    │                                                   │
                    │  Interim Sprint — Admin Tooling (this document)  │
                    │       ↓                                          │
                    │  (next) SEO / Shareability                       │
                    │       ↓                                          │
                    │  (next) Accessibility targeted pass              │
                    │       ↓                                          │
                    │  Wire real credentials once founder provides     │
                    │  them (Sentry/PostHog/email/PayOS/domain) —      │
                    │  near-zero engineering effort, already coded     │
                    └───────────────────────┬───────────────────────────┘
                                             │
                                             ▼
                              ┌───────────────────────────┐
                              │   PRODUCT COMPLETE GATE     │
                              │ (roadmap-v2.md §7, all 14   │
                              │  checklist items)            │
                              └───────────────────────────┘
                                             ▲
                                             │
                    ┌───────────────────────┴───────────────────────────┐
                    │  DOMAIN / FOUNDER PATH (Tử Vi)                     │
                    │                                                     │
                    │  Tử Vi domain resolution (§7 above, 8 checkpoints) │
                    │       ↓                                            │
                    │  Sprint 18 — Deterministic Core Engine              │
                    │       ↓                                            │
                    │  Sprint 19 — Golden Verification & Domain Audit Gate│
                    │       ↓                                            │
                    │  Sprint 20 — Product Experience (UX)                │
                    │       ↓                                            │
                    │  Sprint 21 — AI Interpretation                       │
                    │       ↓                                            │
                    │  Sprint 22 — Vận Depth                               │
                    └─────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────────┐
                    │  LEGAL/BUSINESS PATH (independent, parallel)      │
                    │  Legal Privacy Policy/ToS, refund/retention/tax   │
                    │  policy decisions — feeds the same Gate           │
                    └─────────────────────────────────────────────────┘
```

**The two main paths rejoin only at the Product Complete Gate, and the Gate's own checklist
(`roadmap-v2.md` §7) already names "Vietnamese Tử Vi promise fulfilled — real chart, real stars, real
palaces, verified engine, shipped UX and AI interpretation" as an explicit, non-optional line item.**
The engineering path being far along on its own independent work does **not** and must not be read as
license to declare Product Complete without Tử Vi — this diagram makes that dependency structurally
explicit rather than something a later session could overlook once the engineering path "feels done."

---

## 10. Roadmap document update

`docs/product/product-completion-roadmap-v2.md` is updated with a new, clearly-marked
**"EXECUTION RESEQUENCING — TỬ VI DOMAIN BLOCK"** section (§10, appended after §9, the document's
prior final section). The original roadmap content (§1–§9, all 12 sprint definitions, the Release
Gate checklist, the deferred-scope list) is **not erased, not rewritten, not renumbered** — the new
section only records the resequencing decision and points back to this audit document for full
detail, exactly per this task's own instruction.

---

## 11. Final report

1. **Git baseline:** HEAD `cfe0824` (1 ahead of `origin/master` `c1c8b8f`), working tree carries only
   this session's own new doc files, no unrelated changes, no merge/rebase/cherry-pick in progress.
2. **Sprint 18 status:** `BLOCKED_BY_DOMAIN_REFERENCE` (unchanged from the standing audit verdict).
3. **Blocked Tử Vi downstream sprints:** 19 (`BLOCKED_BY_SPRINT_18`), 20 (`BLOCKED_BY_SPRINT_18/19`),
   21 (`BLOCKED_BY_SPRINT_18/19/20`), 22 (`BLOCKED_BY_SPRINT_18+`, also independently gated on
   `DECISION-12`). None renumbered.
4. **Independent engineering tasks:** Admin tooling (`READY_ENGINEERING`, zero infra exists today),
   SEO content (`READY_ENGINEERING`, content-heavy), Shareability (`READY_ENGINEERING`, zero
   implementation today), Accessibility (`READY_ENGINEERING`, narrowly scoped), Tablet polish
   (`READY_ENGINEERING`, lower urgency than assumed — functionally verified working this session),
   CI branch-trigger fix (`READY_ENGINEERING`, trivial).
5. **External/founder tasks:** PayOS credentials, price sign-off, domain (×2), email credential,
   Sentry DSN, PostHog key — all `BLOCKED_EXTERNAL`, all code-ready on the engineering side. Refund/
   retention/tax policy, real Privacy/ToS — `BLOCKED_PRODUCT_DECISION`/legal-owned.
6. **Candidate next-sprint options:** A (Admin tooling), B (Production Activation — not actually a
   viable engineering sprint right now), C (UX/Accessibility), D (Operator/Observability — largely
   overlaps A or is externally blocked).
7. **Scoring:** A scores highest on Product Complete impact, launch impact, effort-to-value ratio,
   and complete Tử Vi independence, with low risk and high reversibility. B's engineering component
   is already done. C and the non-Admin parts of the original Sprint 23 are real but lower-urgency,
   better sequenced as the *next* interim sprint rather than bundled into this one.
8. **Recommended next sprint:** Interim Sprint — Admin Operator Tooling (a scoped subset of the
   existing Sprint 23, pulled forward temporarily, not renumbered).
9. **Exact scope:** additive `role` field + guard, 5 read-focused operator lookup endpoints (user,
   entitlement, payment, notification-health, AI-spend), minimal internal UI, plus the trivial CI
   branch-trigger fix.
10. **Exact out-of-scope:** SEO, shareability, accessibility audit tooling, tablet redesign, any
    credential wiring, any refund/policy code, the stale-order sweep job as originally specified
    (needs re-scoping first), and — absolutely — anything Tử Vi.
11. **Why safe during the Tử Vi block:** zero code-path overlap, additive-only schema change, no
    founder/external blocker, fully reversible, and directly de-risks (without being) the eventual
    Tử Vi admin surface.
12. **Parallel Tử Vi domain-resolution track:** 8 checkpoints (source acquisition → school selection
    → expert review → table transcription → cross-check → golden-vector population → expert
    confirmation → Sprint 18 Domain Gate rerun), explicitly non-engineering, no sprint number.
13. **Product Complete critical path:** engineering path and domain/founder path shown as
    independent, rejoining only at the Product Complete Gate, which explicitly requires the Tử Vi
    promise to be fulfilled — engineering progress cannot substitute for or bypass that requirement.
14. **Remaining founder checklist:** 14 items, re-verified this session; every credential/decision
    item has zero remaining engineering dependency except the Tử Vi source/expert item itself, which
    now has a concrete intake mechanism ready.
15. **Roadmap changes:** one new, clearly-marked, non-destructive section appended to
    `product-completion-roadmap-v2.md` (§10, "EXECUTION RESEQUENCING — TỬ VI DOMAIN BLOCK"). No
    existing content erased or renumbered.
16. **Files changed:** `docs/audit/roadmap-resequencing-after-tuvi-block.md` (this document, new);
    `docs/product/product-completion-roadmap-v2.md` (appended §10 only).
17. **Git status:** three untracked/modified files after this pass — see §17 in the chat-facing
    summary for the exact `git status --short` output captured after these edits.
18. **Commit/push status:** nothing staged, nothing committed, nothing pushed this session.
19. **Final recommendation:** proceed with the Interim Sprint — Admin Operator Tooling as the next
    engineering sprint, while the Tử Vi domain-resolution track (§7) runs independently and Sprint
    18's own audit gate is re-run only once that track reaches its final checkpoint.

**ROADMAP RESEQUENCED — SAFE TO CONTINUE NON-TỬ-VI ENGINEERING**
