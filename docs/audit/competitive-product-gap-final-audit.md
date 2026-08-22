# Competitive Product Gap — Final Audit (2026-08-22)

**Scope of this pass:** a targeted audit against the 29-section "Competitive Product Gap Audit +
Final Pre-Live Remediation" brief, run against the real repository state (`HEAD = origin/master =
c3760dc` at session start, working tree clean). This is **not** a from-scratch audit — the brief's
own premise ("a large amount of engineering... has already been completed") was verified true, and
this pass built on that rather than re-deriving it. Evidence classification used throughout:
`VERIFIED_FROM_CODE`, `VERIFIED_BY_TEST`, `INFERENCE`, `NOT_VERIFIED`, `DEFERRED_BY_DECISION`.

---

## 1. Recovered repository state

- Branch `master`, `HEAD = origin/master = c3760dc`, 0 ahead / 0 behind, working tree clean at
  session start. `VERIFIED_FROM_CODE`.
- No inherited uncommitted work found; all changes in this session are this session's own.

## 2. Prior-work discovery (before any implementation)

A research pass confirmed no prior run of *this specific* audit exists (`docs/audit/*` and
`docs/progress/*remediation*` were checked directly — absent). What does exist and was treated as
authoritative:

- Sprint 18B (18B.1–18B.12): the full Tử Vi deterministic engine, persistence, AI interpretation,
  and frontend shipped and closed. Evidence: `docs/progress/sprint-18b-final-report.md`,
  `docs/progress/sprint-18b12-runtime-qa-final-report.md`. `VERIFIED_FROM_CODE` (engine files read
  directly) + `VERIFIED_BY_TEST` (338/338 engine unit tests, cited in that report — not re-run this
  session, treated as `INFERENCE` from a recent, internally-consistent report, not re-verified live).
- Domain/brand production lock: brand → "Tử Vi Tarot", domain → tuvitarot.vn. `VERIFIED_FROM_CODE`
  (read `docs/progress/domain-brand-production-lock-final-report.md` and confirmed the decision is
  real and referenced from `apps/web/lib/seo.ts`'s own comments).
- Domain decision register (`docs/domain/tu-vi/domain-decision-register.md`): 12 items, current
  status re-read directly this session (§4 below).

## 3. Tử Vi capability matrix (this session's verification)

| Capability | Status | Evidence |
|---|---|---|
| Calendar/Can Chi/Mệnh-Thân/Cục/14 chính tinh/CORE_13/Tuần-Triệt/Tứ Hóa | SHIPPED | `apps/api/src/tu-vi/engine/*.ts` read directly; `VERIFIED_FROM_CODE` |
| Deterministic/AI separation in the UI | SHIPPED, now strengthened | `tu-vi-chart-view.tsx` badge (pre-existing) + new `TuViTrustSection` (this session). `VERIFIED_BY_TEST` |
| Source/school transparency in user-facing UI | **GAP — now closed this session** | Zero matches for "VDTTL"/"Vân Đằng"/"Tử Vi Đẩu Số Tân Biên" anywhere in `apps/web` before this session (`VERIFIED_FROM_CODE`, direct grep); now disclosed in `TuViTrustSection`. |
| Guest/anonymous Tử Vi computation | **ABSENT — deliberately, correctly** | `tu-vi.controller.ts` — every route behind `JwtAuthGuard`; `GuestTuViBoundary` in `dashboard-view.tsx` already explains why (birth hour + gender are more sensitive than Tarot/Numerology's guest previews, which never call the backend at all). Founder/product-owner explicitly chose not to change this posture this session. `DEFERRED_BY_DECISION`. |
| Đại Vận / Tiểu Hạn / Lưu Niên | ABSENT | `domain-decision-register.md` DECISION-12: `UNSOURCED`, deliberately deferred to an unscheduled "Sprint 22" mini-spec pass. Do not implement from memory, competitor convention, or AI inference — this is a hard domain gate. `DOMAIN_REFERENCE_REQUIRED`. |
| Miếu/Vượng/Đắc/Hãm | ABSENT | DECISION-11: `DOMAIN_EXPERT_REQUIRED` / open founder scope call, never exercised. `DOMAIN_REFERENCE_REQUIRED` / `PRODUCT_DECISION_REQUIRED`. |
| PNG share card / PDF export | ABSENT | No matching code in `apps/web/features/tu-vi`; tracked as an existing P2 roadmap item ("Shareability for Discovery results"), not unique to this audit. `NOT_VERIFIED` as urgent — no new evidence found that this blocks V1 credibility. |

## 4. Brand audit — the one significant new finding

**LIVE_BRAND_BUG, confirmed and fixed this session.** `apps/web/lib/seo.ts` carried a comment
explicitly documenting that the brand was renamed from BeaconVie to **"Tử Vi Tarot"** (the founder's
own locked decision) and stating `SITE_NAME` is "the single point every other metadata/copy/JSON-LD/
share call in this app derives from" — but `SITE_NAME` itself was still `'Mệnh Vi'`, the name of a
separate, correctly-archived internal design prototype (`/menh-vi/*`, per CLAUDE.md). This meant the
live site's page titles, meta descriptions, OG tags, header wordmark, and dozens of in-product
strings (Settings, Memory, Journal, Reflection, Insight, onboarding, auth) all displayed the wrong
brand name. `VERIFIED_FROM_CODE`, fixed and `VERIFIED_BY_TEST` (496/496 frontend tests pass after
the fix, including corrected assertions that previously encoded the wrong brand as expected
behavior). Full file list in the companion remediation report.

**Classification discipline applied:** every match of "Mệnh Vi" in the repo was read in context
before touching it. `apps/web/app/menh-vi/**`, `apps/web/features/menh-vi/**`, and
`tailwind.config.ts`'s comments about that archived design exploration were left untouched — those
are legitimately, correctly named after a different, real thing, not brand drift.

**Separately found, not fixed:** `apps/web/app/(marketing)/contact/page.tsx` links
`mailto:hello@beaconvie.local` — a non-resolving placeholder domain. Not touched: a real support
email/domain is a founder/ops decision (`EXTERNAL_CONFIGURATION_REQUIRED`), not something to
fabricate.

## 5. Guest acquisition audit (§6 of the source brief)

**Finding: the existing pattern is a deliberate, already-correct product decision, not an
oversight.** `dashboard-view.tsx`'s `GuestTuViBoundary` explains — in user-facing copy — why Tử Vi
has no anonymous compute path: it needs birth hour and gender, more identifying than Tarot's random
client-side draw or Numerology's client-side life-path math (both zero backend calls, confirmed by
reading `guest-trial-storage.ts` and its call sites). Building a real anonymous compute flow would
mean exposing the deterministic engine (and potentially AI interpretation) to unauthenticated
traffic — new anonymous rate-limiting/cost-control surface, and collecting more sensitive data from
anonymous users. This matches the source brief's own stop condition (§26E: "guest flow would weaken
privacy/security"). Presented to the product owner directly; decision: **keep the existing gate,
do not build new anonymous compute surface this session.** `DEFERRED_BY_DECISION`.

## 6. Terminology audit

No conflation found between Tử Vi Đẩu Số and Eastern Horoscope (Ngũ Hành Phương Đông) — confirmed by
existing regression test `e2e/flow-26-ambiguity-cleanup.spec.ts` and `tu-vi-dashboard.tsx`'s own
doc comment stating the page "never links to or mentions that module's routes/terms, and vice
versa." No internal terminology leakage found in the primary Tử Vi UX beyond the pre-existing,
already-collapsed "Calculation details" section (raw `rulesetVersion` string `vdttl-1956-v1` etc.) —
judged low-risk since it's opt-in/advanced, not the primary surface a beginner sees; not changed this
session to keep the diff targeted, but flagged here as a minor P3 polish opportunity for whoever
does the next UX pass.

## 7. What was NOT done this session (explicitly, by scope)

- No live browser QA across the 12 breakpoints listed in the source brief (§23). This session's
  verification is `VERIFIED_BY_TEST` (Jest/RTL + existing Playwright suite reports cited, not
  re-run) and `VERIFIED_FROM_CODE`, not `VERIFIED_LIVE`.
- No new Playwright/axe runs were executed this session; existing ones (from Sprint 18B12) were
  cited as recent, not re-verified live.
- Đại Vận, Tiểu Hạn, Lưu Niên, Miếu/Vượng/Đắc/Hãm: correctly not implemented — both are hard domain
  gates with no sourced ruleset, per the existing decision register. Implementing from memory or
  inference would violate the source brief's own non-negotiable rules.
- Guest anonymous Tử Vi compute: correctly not built, per product-owner decision this session.

## 8. Priority reclassification (re-derived, not copied from the source brief's candidate list)

- **P0 (fixed this session):** the SITE_NAME/brand-leak bug — this was live-user-visible on every
  page of the real product, higher severity than anything else found.
- **P1 (fixed this session):** Tử Vi source/methodology transparency (no disclosure existed at all
  before this session).
- **P2 (documented, not implemented):** stale roadmap/checklist status lines predating Sprint 18B's
  shipment (fixed as an additive correction, not a rewrite); `hello@beaconvie.local` placeholder
  contact address; raw ruleset-version string in the advanced "Calculation details" panel.
- **P3 / correctly deferred:** Đại Vận/Tiểu Hạn/Lưu Niên, Miếu/Vượng/Đắc/Hãm, guest anonymous Tử Vi
  compute, PNG/PDF share export — all require either a sourced domain ruleset or a founder decision
  neither this session nor the source brief's own rules authorize inventing.

## 9. Final verdict

**COMPETITIVE PRODUCT REMEDIATION PARTIAL — PRODUCT DECISION / DOMAIN REFERENCE REQUIRED** for the
remaining items (Đại Vận family, Miếu/Vượng/Đắc/Hãm). Everything within this session's authorized,
evidence-backed scope (brand-bug fix, trust/source transparency, stale-doc correction) is complete
and verified by a clean full frontend test run (496/496) plus typecheck and lint. See the companion
remediation report for the exact file-by-file diff and test evidence.

## 10. Exact next action

Bring DECISION-11 (Miếu/Vượng/Đắc/Hãm scope call) and DECISION-12 (Đại Vận/Tiểu Hạn/Lưu Niên
sourcing) to the founder/domain-expert track referenced in
`docs/domain/tu-vi/domain-decision-register.md` — nothing else in this audit blocks production
activation on the engineering side.
