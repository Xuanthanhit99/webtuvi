# Product Completion Roadmap V2

**Status:** Founder-approved rebase, supersedes the conditional roadmap in `docs/audit/full-product-completion-roadmap-rebase.md` §45.
**Trigger:** Founder greenlit Vietnamese Tử Vi as an unconditional (not conditional) product initiative. This document re-derives sprint ordering accordingly and is now the authoritative near-term roadmap.
**Type:** Planning only. No code, Prisma, migrations, or dependency changes in this document or the task that produced it.

---

## 1. Current Baseline

```
HEAD = origin/master = eb0c313 (Sprint 12 trust monetization closeout)
ahead/behind = 0/0, working tree clean except this documentation task's own new files
```

V1-tier Bible modules are code-complete (Companion, Memory, Discovery×3 — Tarot/Numerology/Natal Chart, Journal, Premium, Notifications). Payment and observability are code-complete but unverified against real production services. See the full prior audit for exhaustive detail; this document does not repeat it.

---

## 2. Founder Decisions (locked inputs to this roadmap)

| Decision | Resolution |
|---|---|
| Vietnamese Tử Vi | **GREENLIT** — build as a new, separate, dedicated module. See `docs/product/vietnamese-tu-vi-product-definition.md`. |
| Eastern Horoscope | **Remains separate** — Chinese Zodiac/Five Elements, unchanged scope, never renamed to "Tử Vi." |
| Canonical brand | **BeaconVie**, exclusively. |
| `/menh-vi/*` | **Archive** from public routing; preserve code/assets for reuse. |
| Reflection/Insight/Review/Goal | **Hide** from user-facing Settings/nav; keep code and data intact. |
| Analytics | **Pre-launch required.** |
| Community | **Deferred**, no date set. |

---

## 3. P0 / P1 / P2 / P3 (re-derived with Tử Vi now unconditional)

### P0 — blocks core promise / launch / revenue
1. Payment production activation (merchant account, price sign-off, webhook registration, domain) — business-owned
2. Real email provider credential — business-owned
3. Production domain + deployment manifest — engineering + business
4. Real Privacy Policy / ToS — legal-owned
5. Sentry runtime verification — engineering
6. `TRUST_PROXY` correctness against real hosting topology — engineering, blocked on #3
7. Product analytics instrumentation — engineering
8. Tử Vi domain decision register (§5 of the product definition) resolved with a named authoritative source — **this is now P0, not P1**, because it blocks the single largest unconditional workstream in this roadmap from starting correctly. Building against an unresolved or guessed convention would be worse than not building at all.

### P1 — must fix before Product Complete
1. Frozen-module disposition executed (hide from Settings)
2. `/menh-vi` disposition executed (archive from public routing)
3. CLAUDE.md correction (Companion is LLM-based, not rule-based, since Sprint 2B)
4. Reports module (strengthens Premium's value pitch; will also eventually integrate Tử Vi per §13 of the product definition)
5. Refund policy / tax-invoice handling — legal/business-owned
6. Payment-record retention policy decision — legal-owned
7. Stale-`PENDING`-order sweep job + webhook route rate limiting
8. Tablet breakpoint (768–1279px) navigation fix
9. Tử Vi golden-vector independent verification (§7–8 of the product definition) — release-blocking for that module specifically, not for the rest of Product Complete

### P2 — important post-launch expansion
1. Eastern Horoscope (Chinese zodiac/Five Elements) build
2. Public SEO content (sequenced after Eastern Horoscope and `/menh-vi` archival)
3. Shareability for Discovery results
4. Admin minimal tooling (5 lookups: user, entitlement, payment, notification health, AI spend)
5. AI-spend and payment-webhook-specific Sentry alerting
6. Richer notification triggers
7. Accessibility targeted pass
8. Tử Vi vận (Đại Hạn/Tiểu Hạn/Lưu Niên) depth — post-MVP within the Tử Vi module itself

### P3 — optional / future
1. Community
2. Transits/synastry/progressions/solar return (Natal Chart)
3. Personal Month/Pinnacles/Challenges (Numerology)
4. Multi-person compatibility, Voice mode, practitioner marketplace
5. Multiple Tử Vi schools offered simultaneously

---

## 4. External / Founder Checklist (parallel track, unchanged in kind, tracked here for completeness)

- [ ] PayOS merchant credentials
- [ ] Premium production price sign-off
- [ ] Production frontend domain
- [ ] Production API domain
- [ ] PayOS webhook registration (blocked on domain)
- [ ] Production email provider + credential
- [ ] Payment retention period decision
- [ ] Refund policy
- [ ] Tax/invoice decision
- [ ] Real Privacy Policy
- [ ] Sentry project/DSN provisioned
- [ ] `TRUST_PROXY` production setting (depends on hosting choice)
- [ ] Final analytics provider selected
- [ ] Tử Vi authoritative source(s) identified/engaged for the decision register (§5 of the product definition) — the single highest-priority item on this list given it now gates an entire unconditional workstream

---

## 5. Roadmap Ordering Rationale

The prior roadmap treated Tử Vi as a conditional tail (Sprints 17–22, "if greenlit"). With the founder decision now locked, the naive move would be to slot the full Tử Vi track immediately after production hardening. This roadmap does **not** do that, for three reasons:

1. **Domain correctness cannot be rushed by moving it earlier in the calendar.** The decision register (product definition §5) requires sourcing an authoritative reference and possibly engaging a domain expert — a founder/business action with its own lead time, not something an engineering sprint can compress. Scheduling the *specification* sprint early (Sprint 15) starts that clock immediately without blocking anything else.
2. **Production verification and cleanup are prerequisites for everything downstream being trustworthy**, including Tử Vi — there is no point building a second high-trust deterministic system on top of an observability/analytics stack that has never been verified against a real environment.
3. **Reports benefits from sequencing after Eastern Horoscope but can absorb Tử Vi later without rework**, since the Reports boundary (canonical facts vs. AI synthesis) is system-agnostic by design — Reports does not need to wait for Tử Vi to ship first, and Tử Vi does not need to wait for Reports.

This yields: **Production/Analytics first → cleanup → Tử Vi specification (started early, in parallel with the founder's source-sourcing lead time) → Reports and Eastern Horoscope (unconditional, independent tracks) → Tử Vi engine → Tử Vi verification gate → Tử Vi UX → Tử Vi AI → Tử Vi vận depth → SEO/acquisition → final hardening.** Tử Vi's specification sprint is pulled early (Sprint 15) precisely because its lead time (sourcing) is the longest pole in the whole roadmap; its engine/UX/AI sprints stay sequenced after Reports/Eastern Horoscope because those are faster, lower-risk, unconditional wins that should not wait behind a multi-sprint new-domain build.

---

## 6. Sprints

### Sprint 13 — Production Verification & Analytics Foundation
**Goal:** convert "complete in code" into "verified in a real environment."
**In scope:** deployment manifest (Dockerfile/hosting config), Sentry DSN wired + one live-verified event in staging, `TRUST_PROXY` resolved against chosen hosting topology, analytics instrumented for the event set in §7 below (excluding `tuvi_*` events, added later).
**Out of scope:** any new product feature; Tử Vi work of any kind.
**Dependencies:** founder must have selected a hosting provider.
**Major risks:** analytics tool selection scope-creeping — timebox to one lightweight, privacy-respecting tool.
**DoD:** staging reachable via real domain; one real Sentry event captured with correct PII scrubbing; core funnel events firing and visible in a dashboard.

### Sprint 14 — Ambiguity Cleanup
**Goal:** close every open "indefinite limbo" item before any public-facing or SEO work begins.
**In scope:** hide Reflection/Insight/Review/Goal from Settings (code untouched); archive `/menh-vi/*` out of public routing (preserve design assets/components for reuse per the founder's explicit instruction not to delete); correct CLAUDE.md's stale Companion description; rename Natal Chart's display label to "Bản Đồ Sao" per the terminology locked in the product definition §1 (copy-only change, no route change).
**Out of scope:** deleting any frozen-module code/data; any Tử Vi work.
**Dependencies:** none.
**DoD:** `/menh-vi/*` unreachable publicly; Settings no longer surfaces the frozen four; CLAUDE.md accurate; Discover hub copy updated.

### Sprint 15 — Vietnamese Tử Vi Domain & Calculation Specification
**Goal:** resolve every row of the decision register (product definition §5) with a named authoritative source; produce the locked V1 convention.
**In scope:** sourcing/engaging domain reference(s), resolving all 12 decision-register items, writing the final rule tables (Cục derivation, Tử Vi placement, remaining 13-star placement, auxiliary-star placement, Tuần/Triệt, Tứ Hóa, Miếu/Vượng/Đắc/Hãm in/out decision), zero code.
**Out of scope:** any implementation; vận rules may be deferred to Sprint 20 if lead time runs long, but should be attempted here first.
**Dependencies:** founder checklist item "Tử Vi authoritative source(s) identified" (§4) — this sprint cannot start meaningfully without it, so it should be kick-started in parallel with Sprint 13/14, not strictly after them.
**Major risks:** sourcing takes longer than one sprint if a domain expert must be found and engaged; if so, this sprint's DoD should still lock what can be resolved (calendar, Mệnh/Thân, Cục) and explicitly carry forward what can't (school-dependent star tables) rather than blocking the whole sprint.
**DoD:** every §5 row marked `RESOLVED` with a cited source, or explicitly carried forward with a named blocker and owner; zero rows silently defaulted.

### Sprint 16 — Reports (Personal Destiny Report)
**Goal:** ship the Bible's own "strongest proof point of the whole business thesis," using currently-available inputs (Tarot, Numerology, Natal Chart, Memory) — does not wait for Tử Vi or Eastern Horoscope.
**In scope:** Evidence Engine, grounding-verification pipeline, canonical-facts/AI-synthesis boundary.
**Out of scope:** Tử Vi or Eastern Horoscope as inputs (both added as separate follow-up increments once each ships).
**Dependencies:** none blocking.
**DoD:** ~~at least 3 of the Bible's 15 report types shipped with automated grounding tests~~ —
**clarified at Sprint 16 Release Closure, per the founder-locked decision in
`docs/product/personal-destiny-report-decisions.md`:** one Personal Destiny Report, with its 11
locked internal sections, shipped with automated grounding tests and evidence-threshold gating
verified. This wording originally assumed Product Bible Module 16's report-*type* model (Monthly
Reflection, Growth Report, etc. as separately generatable artifacts); the founder locked a single
cross-Discovery-synthesis report instead. This is a wording correction to match the already-locked
product decision, not a scope change — see the architecture doc's §23/§24 and the decision record's
"Flagged, unresolved → Roadmap V2 DoD-language tension" section for the original analysis.

### Sprint 17 — Eastern Horoscope (Chinese Zodiac / Five Elements)
**Goal:** ship the Bible's actual, narrowly-scoped, already-spec'd V1.5 Discovery module — independent of Tử Vi, unblocks the SEO calculator idea later.
**In scope:** lunisolar calendar engine, animal-sign/element deterministic mapping, same premium/cost-control/Companion-bridge pattern as the other Discovery systems.
**Out of scope:** anything Tử Vi-specific; do not let this sprint absorb Tử Vi scope by convenience.
**Dependencies:** none.
**DoD:** `/discover` badge flips from "coming soon" to live; golden-vector discipline applied at Natal-Chart-equivalent rigor.

### Sprint 18 — Vietnamese Tử Vi Deterministic Core Engine
**Goal:** implement the calculation pipeline (product definition §3) through canonical chart persistence, using the resolved rule set from Sprint 15.
**In scope:** calendar normalization, Can Chi, Mệnh/Thân, Cục, 12-cung layout, 14 chính tinh, auxiliary stars, Tuần/Triệt, Tứ Hóa; versioning metadata (`TUVI_ENGINE_VERSION`, `CALENDAR_VERSION`, `STAR_RULESET_VERSION`).
**Out of scope:** UI, AI interpretation, vận cycles.
**Dependencies:** Sprint 15 must have resolved at minimum items 1–10 of the decision register; if item 11 (Miếu/Vượng/Đắc/Hãm) is still open, ship without it and flag.
**Major risks:** the single highest-complexity engine in the product; do not compress this into fewer than a full dedicated sprint.
**DoD:** engine produces a canonical chart object for arbitrary valid birth data; no AI, no UI yet.

### Sprint 19 — Vietnamese Tử Vi Golden Verification & Domain Audit Gate
**Goal:** execute the release-blocking gate (product definition §7–8) before any further Tử Vi work proceeds.
**In scope:** source/build the 12–15 independent golden vectors; run the TỬ VI AN SAO LOGIC AUDIT across all 14 checklist items; resolve every item to PASS/FAIL/DOMAIN REFERENCE REQUIRED.
**Out of scope:** proceeding to UX or AI work while any item remains unresolved — this is a hard gate, not a soft checkpoint.
**Dependencies:** Sprint 18.
**Major risks:** finding a real defect here is the intended, healthy outcome — budget time to fix and re-verify, not just to run the audit once.
**DoD:** all 14 audit items PASS; golden-vector suite passing and checked in as a permanent regression gate.

### Sprint 20 — Vietnamese Tử Vi Product Experience
**Goal:** ship the UX described in product definition §9–10 — chart reveal, 12-cung exploration, star details, history, mobile-responsive alternative to the grid layout.
**In scope:** UI only, reading from the already-verified engine.
**Out of scope:** AI interpretation (next sprint); vận display (depends on vận rules, may still be open from Sprint 15).
**Dependencies:** Sprint 19 gate passed.
**DoD:** canonical chart is the first thing shown after calculation, per the hard rule in the product definition §9; responsive mobile alternative shipped, not deferred.

### Sprint 21 — Vietnamese Tử Vi AI Interpretation
**Goal:** ship the structured interpretation (product definition §11), premium gating (§12), Companion bridge (read-only, mirroring the existing pattern).
**In scope:** palace-by-palace interpretation, cross-palace synthesis (premium), prompt-level prohibition on inventing facts.
**Out of scope:** vận-based interpretation (depends on vận rules).
**Dependencies:** Sprint 20.
**DoD:** interpretation demonstrably never references a star/palace absent from the canonical chart (tested, not just prompted); premium/free boundary matches §12.

### Sprint 22 — Vietnamese Tử Vi Vận Depth
**Goal:** ship Đại Hạn / Tiểu Hạn / Lưu Niên, contingent on decision-register item 12 being resolved by now (from Sprint 15 or a follow-up mini-spec pass).
**In scope:** vận calculation, vận display, vận-aware interpretation section.
**Out of scope:** anything not already covered by the existing engine/UX/AI sprints.
**Dependencies:** Sprint 15 (item 12) and Sprint 21.
**DoD:** vận golden vectors added to the Sprint 19 suite and passing; vận surfaced in both chart UI and AI interpretation.

### Sprint 23 — Admin, SEO/Public Content, Shareability
**Goal:** close the remaining P2 gaps once the higher-leverage P0/P1 and Tử Vi-critical work above is done.
**In scope:** the 5 Admin lookups; public SEO content built on the now-live Eastern Horoscope engine (calculator, glossary pages); shareable result cards across Tarot/Numerology/Natal Chart/Eastern Horoscope/Tử Vi.
**Dependencies:** Sprint 17 (Eastern Horoscope) for the calculator; Sprint 14 (`/menh-vi` archived) before any public content push; Sprint 22 ideally complete so shareability covers all five Discovery systems at once, though this can start earlier for the first four.
**DoD:** 5 lookups live for operators; at least one public, indexable, SEO-durable page per shipped Discovery system.

### Sprint 24 — Product Complete Release Gate
**Goal:** final launch-hardening pass and formal Product Complete declaration — not a feature sprint.
**In scope:** legal documents finalized (founder-owned, tracked in §4), refund/retention policy implemented, tablet-nav fix, targeted accessibility pass, final review against §7 of this document.
**DoD:** every item in §7's Product Complete Release Gate checklist is checked.

---

## 7. Product Complete Release Gate

Formal, explicit criteria — the roadmap terminates here, not "forever":

- [ ] No unresolved P0 (§3)
- [ ] No ambiguous-status product module (frozen four hidden, `/menh-vi` archived)
- [ ] Deterministic systems (Tarot, Numerology, Natal Chart, Eastern Horoscope, Tử Vi) independently golden-vector verified
- [ ] Vietnamese Tử Vi promise fulfilled — real chart, real stars, real palaces, verified engine, shipped UX and AI interpretation
- [ ] Payment operational against a real merchant account
- [ ] Analytics live, funnel questions answerable
- [ ] Production email live
- [ ] Sentry live, verified with a real captured event
- [ ] Real Privacy Policy / ToS (not Sprint-1 placeholders)
- [ ] Premium value proposition coherent (Reports shipped, Tử Vi/Eastern Horoscope included in the gating pattern)
- [ ] Responsive main journeys, including the tablet breakpoint fix
- [ ] No public `/menh-vi` competing shell
- [ ] Frozen modules intentionally hidden, not merely forgotten
- [ ] Launch routes coherent (Discover hub naming matches §1 of the product definition throughout)
- [ ] Production configuration documented (domain, hosting, `TRUST_PROXY`, env matrix)

---

## 8. Explicitly Deferred Beyond Product Complete

Unless future evidence demonstrates one is essential:

- Community
- Marketplace
- Voice mode
- Multiple Tử Vi schools offered simultaneously
- Advanced compatibility/synastry (Western or Tử Vi)
- Full social layer
- Full/broad Admin dashboard (beyond the 5 lookups)
- Full WCAG certification (targeted pass only)
- Advanced Western transits/progressions/solar return

---

## 9. Sprint Count Summary

**12 engineering sprints from Sprint 13 to the Product Complete gate (Sprint 24)** — up from the prior roadmap's ~6-sprint unconditional path, reflecting Tử Vi's move from conditional to unconditional scope. Of these, 5 sprints (15, 18, 19, 20, 21) plus part of 22 are Tử Vi-specific — consistent with the prior audit's estimate that a full Tử Vi build adds roughly 5–6 sprints, now confirmed as the accurate estimate rather than a conditional placeholder.

---

## 10. EXECUTION RESEQUENCING — TỬ VI DOMAIN BLOCK

**Added:** after Sprint 18 was formally blocked (`docs/audit/sprint-18-pre-implementation-audit.md`,
verdict B — domain references / golden vectors incomplete) and a domain-resolution intake pack was
produced (`docs/domain/tu-vi/domain-resolution-pack.md`). Full detail, scoring, and rationale:
`docs/audit/roadmap-resequencing-after-tuvi-block.md`. **This section is additive only — nothing
above it in this document is edited, erased, or renumbered.** Vietnamese Tử Vi remains a founder-
greenlit, unconditional Product Complete requirement (§2 above); this section records a *temporary
execution-order* change, not a scope change.

**Sprint 13–17 status (verified against actual git history, not this document's own stale §1
baseline):** all shipped and, for Sprint 17, formally closed. See the resequencing audit §2 for the
full commit-by-commit reconstruction.

**Tử Vi track status (unchanged sprint numbers, current execution state):**

| Sprint | Status |
|---|---|
| 18 — Tử Vi Deterministic Core Engine | `BLOCKED_BY_DOMAIN_REFERENCE` |
| 19 — Tử Vi Golden Verification & Domain Audit Gate | `BLOCKED_BY_SPRINT_18` |
| 20 — Tử Vi Product Experience | `BLOCKED_BY_SPRINT_18/19` |
| 21 — Tử Vi AI Interpretation | `BLOCKED_BY_SPRINT_18/19/20` |
| 22 — Tử Vi Vận Depth | `BLOCKED_BY_SPRINT_18+` (also independently gated on decision-register item 12) |

**Interim next sprint (pulled forward temporarily; does not renumber or redefine Sprint 23):**
**Admin Operator Tooling** — a scoped subset of Sprint 23's existing "Admin minimal tooling (5
lookups)" item (§3 P2), pulled forward because zero admin/operator infrastructure currently exists
in the codebase (no role concept, no lookup endpoints) and this work has complete Tử Vi independence,
low risk, and high reversibility. Exact scope, out-of-scope, and safety rationale: resequencing audit
§6. Sprint 23's remaining components (SEO content, shareability) stay in Sprint 23 for a later pass,
not bundled into this interim sprint.

**Parallel, non-engineering Tử Vi domain-resolution track** (no sprint number, not scheduled against
engineering capacity): source acquisition → school selection → expert review → table transcription →
cross-check → golden-vector population → expert confirmation → Sprint 18 Domain Gate rerun. Full
detail: resequencing audit §7.

**Critical path:** the engineering path (interim admin sprint → later SEO/shareability/accessibility
→ credential wiring once provided) and the Tử Vi domain/founder path both feed the same Product
Complete Gate (§7 above). **Engineering finishing its independent work first does not and must not be
read as grounds to declare Product Complete without Tử Vi** — §7's own checklist already names the
fulfilled Tử Vi promise as a required line item. Full diagram: resequencing audit §9.
