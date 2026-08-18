# Sprint 16 — Personal Destiny Report — Pre-Implementation Audit

**Type:** Audit / specification only. No Reports implementation, no Prisma changes, no API code,
no frontend code were written in this sprint. No commit, no push. Full architecture detail lives in
`docs/architecture/personal-destiny-report.md` — this document is the audit record; that one is the
design spec. Cross-referenced throughout rather than duplicated.

---

## 1. Git baseline

```
HEAD             = dc6684e (refactor: complete Sprint 14 product ambiguity cleanup)
origin/master    = 50c0e93 (feat: complete Sprint 13 production analytics foundation)
ahead/behind     = 0 / 1  (not pushed)
working tree     = clean at session start except Sprint 15's 7 documentation files
diff --check     = clean
merge/rebase/cherry-pick in progress = none
```

## 2. Sprint 15 preservation status

Confirmed present, untouched, unmodified, unstaged: `docs/audit/sprint-15-pre-implementation-audit.md`
and the 6 files under `docs/domain/tu-vi/` (`authoritative-sources.md`,
`domain-decision-register.md`, `calculation-specification.md`, `star-placement-rules.md`,
`golden-vector-specification.md`, `an-sao-logic-audit.md`). None deleted, reset, staged, or
committed. Sprint 16's own two new files are additive alongside them.

## 3. Governing docs read

Full text: `docs/product/product-completion-roadmap-v2.md`, `docs/product/
vietnamese-tu-vi-product-definition.md`, `docs/audit/sprint-15-pre-implementation-audit.md`, all
six `docs/domain/tu-vi/*.md` files. **Product Bible Module 16 (Reports Experience)** read in full —
this was the single most consequential document in this audit; see §5 for why. Module 17 (Premium),
Module 10 (Memory), Module 9 (Companion) referenced for specific cross-checks (§13, §18, §32) rather
than re-read cover-to-cover, since this session already has working familiarity with their shipped
implementations from prior sprints in this same session.

---

## 4. Existing Report code

Repository-wide search for `report`/`reports`/`destiny report`/`PDF`/`export`/`summary`/`premium
report`/`insight report`/`generated report` returned 60 files. Classification of every genuine hit
(excluding the many false-positive matches on the English word "report" in unrelated contexts —
e.g., a webhook comment about "reports a mismatched..." signature):

| Path | Classification |
|---|---|
| `apps/api/src/users/export/account-export.service.ts` (+ spec) | `ACCOUNT_DATA_EXPORT` — GDPR-style raw record dump, architecturally unrelated to a narrative Report despite the shared word; useful as a precedent for §28's extension pattern, not reusable report logic itself |
| `apps/api/src/users/deletion/account-deletion.service.ts` (+ spec) | `ACCOUNT_DATA_EXPORT`-adjacent (deletion, not export, but same precedent value for §29) |
| `apps/api/src/payment/entitlement/entitlement.service.spec.ts` | `UNRELATED` to Reports directly, but the exact precedent for §13's Premium-boundary check |
| `apps/api/src/companion/**` (cost-control, generation-lock, provider-orchestrator, safety) | `UNRELATED` to Reports as a feature, but the exact reusable AI infrastructure Reports must plug into (§16–19, §35 below) |
| `docs/reference/web-tu-vi/web-tu-vi/16-reports-experience.md` | `DOCUMENTATION` — the Product Bible's own Reports module, read in full, see §5 |
| `docs/product/product-completion-roadmap-v2.md` (Sprint 16 entry) | `DOCUMENTATION` |
| Every Sprint 14/15 doc that mentions "report" in the generic sense (progress reports, audit reports) | `UNRELATED` |
| All other matches (Tarot/Numerology/Natal Chart specs referencing "reporting" test results, `global-error.tsx`'s error-reporting language, `payos-production-readiness.md`) | `UNRELATED` |

**Confirmed: zero `REAL_REPORT_FEATURE`, zero `DISCOVERY_RESULT`-as-report, zero
`AI_INTERPRETATION`-as-report, zero `FROZEN_MODULE` Report remnant, and zero `PLACEHOLDER` exists.
No reusable report architecture exists anywhere in this codebase** — Sprint 16 is greenfield within
an otherwise mature AI/Premium/analytics/notification substrate, all of which is directly reusable
(see §16–19, §30–32).

---

## 5. Report V1 purpose

**This is the audit's central finding, not a formality.** Product Bible Module 16 describes Reports
as a Memory-native narrative engine built on an internal Theme/Pattern "Insight Engine escalation
ladder" living inside Memory (Module 10 §11). The actual Memory module
(`apps/api/src/memory/`) — verified by direct code search this session — has consent, CRUD,
versioning, importance *scoring*, and retrieval *ranking*, but **no embeddings, no semantic
clustering, no automatic Theme/Pattern escalation**. That capability, as Module 16 assumes it,
does not exist in this codebase. A structurally similar but separate, non-Bible, deterministic rule
engine (Reflection → Insight, Sprint 4B/4C) does exist, but it is one of the four modules Sprint 14
froze and hid from primary UX, and prior audits explicitly recorded it as outside the Bible's
16-module tree.

**Resolution recommended in `personal-destiny-report.md` §1** (a recommendation requiring explicit
founder sign-off per §55 below, not assumed here): build Sprint 16 to Roadmap V2's actual, narrower
scope — cross-Discovery-system (Tarot/Numerology/Natal Chart) + basic Memory synthesis — rather than
Module 16's full Memory-native vision, and treat "should Reports reuse the frozen Reflection/Insight
backend services internally" as its own explicit decision, not a default.

**Classification against the sprint brief's own options:** primarily **B (cross-system synthesis)**,
not **A** (bare snapshot — explicitly rejected by Module 16 §23's "statistics-led reports... rejected
outright"), with **C** (premium value) as the commercial framing, not the product mechanism.

---

## 6. Available source systems

See `personal-destiny-report.md` §4 for the full table. Summary: Natal Chart (facts + AI
interpretation), Numerology (facts + AI interpretation), and profile information are `AVAILABLE`.
Tarot and Memory are `AVAILABLE_BUT_OPTIONAL`. Journal is `AVAILABLE_BUT_OPTIONAL`. Reflection,
Insight, Review, Goal are `NOT_READY` (frozen). Eastern Horoscope is `NOT_READY` (unshipped). Tử Vi
is `FORBIDDEN` for this sprint.

## 7. Required sources

Recommended: **at least one of Natal Chart or Numerology** (`personal-destiny-report.md` §21) — not
both, to keep the eligibility bar achievable for users who've only engaged one Discovery system.

## 8. Optional sources

Tarot, Memory, Journal — all `OPTIONAL`/`ENRICHMENT` per §21 of the architecture spec, none block
generation on their own.

## 9. Deferred sources

Reflection, Insight, Review, Goal (frozen — excluded by default per §9 of the architecture spec,
pending an explicit founder decision if that default is ever revisited); Eastern Horoscope and Tử
Vi (extension points only, §40–41).

## 10. Tử Vi integration status

`TU_VI_REPORT_INTEGRATION = DEFERRED`. Confirmed: the Tử Vi engine does not exist (Sprint 15 §2),
no canonical chart data exists, and Sprint 15's own decision register has multiple items still
`UNSOURCED`/`DOMAIN_EXPERT_REQUIRED`. Reports V1 does not calculate, fabricate, placeholder, or
block on Tử Vi in any way — verified against the actual design (§40 of the architecture spec: an
additive, unpopulated snapshot key, nothing more).

## 11. Eastern Horoscope integration status

Same treatment — not shipped (Sprint 17 hasn't run), extension point only, no fake data, no block
(§41 of the architecture spec).

---

## 12. Deterministic/AI boundary

Two layers — CALCULATED FACTS (never modified by AI) and AI SYNTHESIS (narrative, always
evidence-cited) — restated in full in `personal-destiny-report.md` §5, identical in force to the
already-proven Discovery-system rule and the parallel rule independently re-derived for the future
Tử Vi module.

## 13. Source snapshot strategy

**Recommendation: B — snapshot at generation time**, not live resolution. Full rationale (engine
version drift, deleted readings, Memory consent changes, AI model changes, historical consistency)
in `personal-destiny-report.md` §11. Directly required by Module 16 §17's own "shouldn't silently
change later" design decision.

## 14. Versioning

`REPORT_SCHEMA_VERSION`, `REPORT_TEMPLATE_VERSION`, `AI_PROMPT_VERSION` — full increment-trigger
table in `personal-destiny-report.md` §12. Source-system versions (Numerology's
`calculationVersion`, etc.) preserved automatically via the snapshot, no new concept needed there.

## 15. Report structure

**The sprint brief's own suggested generic structure (Cover/Executive Summary/Core
Personality/Strengths/etc.) was explicitly evaluated and rejected** — it matches the exact
"statistics-led"/fixed-template anti-pattern Module 16 §23 names as a rejected alternative.
Recommended V1 structure instead derives from Module 16 §4's actual report-type vocabulary: Monthly
Reflection + Growth Report + Memory Highlights (the three lowest-evidence-bar, most achievable types
given only Tarot/Numerology/Natal Chart/Memory are in scope), plus the mandatory Deep Dive
evidence-trail affordance. Full reasoning in `personal-destiny-report.md` §10.

## 16. Cross-system synthesis policy

Must explicitly distinguish agreement/contrast/reflection/uncertainty in generated language;
explicitly forbidden framing ("all systems prove...") named and reasoned in
`personal-destiny-report.md` §6.

## 17. Tarot's role

Recent-context section, not core identity — a single random draw must never anchor a long-lived
destiny narrative. Full reasoning in `personal-destiny-report.md` §7.

## 18. Memory's role

Existing consent/budget/relevance infrastructure reused verbatim
(`MemoryConsentService`, `context-budget.service.ts`, `memory-ranking.util.ts`) — no new Memory
access pattern. Full detail in `personal-destiny-report.md` §8.

## 19. Journal/frozen-module decision

Journal: included as `AVAILABLE_BUT_OPTIONAL`. Reflection/Insight/Review/Goal: **excluded by
default**, per the sprint brief's own instruction and because no governing document explicitly
justifies pulling them in — Module 16's "Insight Engine" reference is to a different, non-existent
Memory-native concept (§5), not license to reuse the frozen Sprint 4C module by name. Full reasoning
in `personal-destiny-report.md` §9.

## 20. Premium boundary

Verified against `EntitlementService`'s actual test/spec structure (status/expiry-based
entitlement check, matching the pattern already proven for Tarot/Numerology/Natal Chart's
Premium-gated depth). Recommended: free genuine partial preview, Premium full report + regeneration
+ full history; free tier gets latest-report-only or a small cap. No price/tier change proposed.
Full table in `personal-destiny-report.md` §13.

## 21. Generation lifecycle

`REQUESTED → GENERATING → READY | FAILED`, no `PARTIAL` state (Module 16 §14's own explicit
instruction). **Real finding: no BullMQ/job-queue infrastructure exists anywhere in this codebase**
— verified by direct search. Every existing AI generation surface (Companion, Discovery
interpretation) is a synchronous, lock-and-budget-gated HTTP request, not a queued job, despite
Module 16 §17 assuming "inherently async (BullMQ)." **This is a genuine architecture decision, not
a detail** — recommendation (reuse the existing synchronous pattern for V1, re-evaluate only if
measured generation time proves impractical) vs. the alternative (introduce BullMQ for the first
time) is spelled out in `personal-destiny-report.md` §14, flagged in §55 below as requiring
explicit sign-off rather than assumed.

## 22. Idempotency

Generation lock keyed `(feature='reports', userId, reportPeriodKey)`, reusing
`GenerationLockService.tryAcquireDiscovery` verbatim; report period itself is the idempotency key;
immutable once `READY`. Full detail in `personal-destiny-report.md` §15.

## 23. AI cost controls

Verified `CostControlService` is deliberately **global per-user across all AI features** (not
feature-scoped) — "a security decision, not an oversight" per its own code comment. Reports must
add to this same ceiling, never a separate one. `AIFeature`/`DiscoveryAIFeature` type (currently
`'companion' | 'tarot' | 'numerology' | 'natal_chart'`) needs a new `'reports'` value, following the
exact existing Sprint 12 attribution convention. No fifth AI infrastructure. Full detail in
`personal-destiny-report.md` §16.

## 24. AI provider architecture

No new client — reuse `ProviderOrchestratorService`/`ProviderRegistryService` verbatim, same
`DEFAULT_AI_PROVIDER` switch, same Mock-blocked-in-production guarantee. Confirmed via direct code
inspection of `apps/api/src/companion/providers/`.

## 25. AI input contract

Structured JSON facts, not scraped UI text — explicit instruction set (never alter calculated
values, never invent, distinguish fact from interpretation, no medical/legal/financial certainty,
no fate claims, surface contradictions honestly). Full detail in `personal-destiny-report.md` §18.

## 26. AI output schema

**Recommendation: schema-validated structured JSON, not free Markdown** — required to make Module
16 §17's per-claim evidence-tagging/verification step reliable and to give the frontend a stable,
accessible rendering target (§39). Full reasoning in `personal-destiny-report.md` §19.

## 27. Failure behavior

Full table (provider unavailable, budget exceeded, lock active, missing optional source, malformed
AI response) in `personal-destiny-report.md` §20. No fake report, no silent Mock fallback in
production — the latter is already a platform-wide enforced invariant (`env.validation.ts`), not a
new rule for Reports.

## 28. Partial-report policy

`REQUIRED_SOURCE`: at least one of Numerology or Natal Chart. `OPTIONAL_SOURCE`: Tarot, Memory.
`ENRICHMENT_SOURCE`: Journal. A Numerology-only user **can** generate a report. Full table in
`personal-destiny-report.md` §21.

## 29. Refresh/regeneration policy

Immutable snapshots; explicit, Premium-gated regeneration only, creating a new versioned record —
never silent auto-refresh. Full detail in `personal-destiny-report.md` §22.

## 30. History

Recommend report history (not latest-only), matching Module 16 §10/§12's explicit framing of the
report sequence itself as evidence of change over time. Free: capped; Premium: full. Full detail in
`personal-destiny-report.md` §23.

## 31. PDF/download decision

**Recommendation: HTML-only V1 (in-app reading + browser print), no server-side PDF pipeline.**
Verified: no PDF-generation dependency exists anywhere in the repo today. Comparison table (
complexity/mobile UX/branding/cost/deployment) in `personal-destiny-report.md` §24. Matches Module
16 §22's own framing of "Printable Reports" as a **Future Expansion**, not a V1 requirement.

## 32. Sharing decision

**Default: owner-only, no public report URLs.** Confirmed against Roadmap V2's own Sprint 23
placement of general shareability (after Eastern Horoscope/Tử Vi). Every proposed endpoint (§26 of
the architecture spec) is owner-scoped by design.

## 33. API proposal

`POST /reports`, `GET /reports`, `GET /reports/:id`, `GET /reports/:id/evidence`, `POST
/reports/:id/regenerate` — all owner-scoped. Spec only, in `personal-destiny-report.md` §26.

## 34. Data-model proposal

`DestinyReport` (single table, embedded structured JSON for sections and source snapshot — not
separate `DestinyReportSection`/`DestinyReportSource` rows, since no requirement in this audit
identifies an independent-query need for either). Full field list in `personal-destiny-report.md`
§27. **No Prisma schema was modified.**

## 35. Account export

**Must be included.** Verified `AccountExportPayload` already has a `discoveries: { tarot,
numerology, natalChart }` keyed structure — Reports should extend this additively (`reports:
unknown[]`), following the exact established pattern. Confirmed by direct inspection of
`apps/api/src/users/export/account-export.service.ts`.

## 36. Account deletion

**Reports must not survive account deletion.** No documented legal basis was found for retaining
generated Reports post-deletion — the payment-retention policy is explicitly a separate,
business/legal-owned exception elsewhere in the roadmap and does not extend here by default.

## 37. Analytics

Recommended minimum: `report_generation_started`, `report_generation_completed`, `report_viewed`,
`report_generation_failed` (a new pattern not currently mirrored elsewhere, justified by Reports'
higher generation stakes). **Not recommended for V1:** `report_upgrade_clicked` — the existing
funnel events already cover this without a Reports-specific dimension the current taxonomy doesn't
otherwise track. Checked against the actual closed `ClientAnalyticsEventName`/
`ServerAnalyticsEventName`/`AnalyticsFeature` types in `packages/types/index.ts` — confirmed these
are closed unions requiring explicit extension, not an open event namespace. No report content in
analytics, matching the existing closed-shape privacy discipline exactly.

## 38. Notifications

**Reuse Sprint 11 infrastructure, add one type.** Verified `NOTIFICATION_TYPES`'s own doc comment
already anticipates this: *"Companion/Community/Reports triggers (none of those systems exist/are
wired yet)"* — direct, explicit acknowledgment from the module's own author. Recommend
`'report.ready'`, mapped like `'premium.activated'`. No new notification architecture.

## 39. Companion bridge

Yes — reuse the existing read-only Discovery bridge pattern verbatim, per Module 16 §7's own
explicit design (a "discuss this with your Companion" action is a named requirement, not an
optional add-on). Companion cannot mutate report facts/narrative.

---

## 40. Security findings

Full threat table in `personal-destiny-report.md` §33: IDOR, mass assignment, prompt injection
(via Memory and Tarot-question content), stored-output XSS, generation abuse, report enumeration,
source-snapshot leakage — each mapped to an existing, already-proven mitigation (owner-scoping,
existing DTO allowlist discipline, existing `SafetyService`/`PromptInjectionDetector`, structured-
JSON rendering instead of raw HTML, existing lock/budget mechanisms, existing UUID/cuid ID scheme).
**No new security architecture is required** — every mitigation is a reuse of an already-shipped
pattern. **No unresolved Blocker/High finding** — the security posture is contingent on actually
reusing these existing mechanisms during implementation, not on inventing new ones, which is itself
noted as a P0 implementation discipline (§53).

## 41. Privacy findings

Full table in `personal-destiny-report.md` §34 — persisted snapshot, AI-provider payload,
`ProviderLog` (existing scrubbing), `AIUsage` (counts only), analytics (feature/route only, no
content), Sentry (existing allowlist scrubbing must continue to exclude report content). No new
privacy category introduced; Reports aggregates existing, already-vetted content categories under
their existing consent/scrubbing rules.

## 42. Safety architecture

**Reuse `SafetyService`'s existing category taxonomy verbatim** (`none | crisis |
prompt_injection | unsafe_content | too_long | fabricated_sensitive_data`) — no separate safety
system. Crisis content surfaced through synthesized Memory/Journal content must trigger the same
escalation Companion already has, per Module 16 §16's own explicit deferral to "the standard
crisis-escalation behavior."

---

## 43. UX flow

Discover/Reports entry → eligibility → source-readiness → preview → generate (Premium gate here,
the "clearest, most legitimate" moment per Module 16 §1) → processing → reveal → sections →
Companion → history. Full flow in `personal-destiny-report.md` §36.

## 44. Empty states

No Numerology/Natal Chart yet → route to the relevant Discovery page. No Tarot/Memory → not
blocking. No report yet (insufficient evidence) → Module 16 §14's own honest, no-false-countdown
language pattern, reused verbatim. Full table in `personal-destiny-report.md` §37.

## 45. Mobile

Single-column ~720px reading layout (Module 16 §20's own spec), lightweight collapsible TOC,
in-page anchor navigation, minimal sticky Companion-bridge affordance, browser-print-only download.
Full detail in `personal-destiny-report.md` §38.

## 46. Accessibility

Semantic headings per structured section, labeled TOC landmark, full keyboard navigation through
sections and Deep Dive, existing `aria-live` loading/error patterns reused, programmatic (not just
visual) fact-vs-interpretation labeling. Full detail in `personal-destiny-report.md` §39.

## 47. Future Tử Vi extension point

Additive, keyed, unpopulated `sourceSnapshot` slot — no fake data, no block on Sprint 16. Confirmed
consistent with the Vietnamese Tử Vi product definition's own §13 (Reports Integration) instruction
that this comes later, additively, gated on the Sprint 19 verification gate.

## 48. Future Eastern Horoscope extension point

Same treatment, unshipped, no fake data, no block.

## 49. Test strategy

Unit (evidence-threshold gating, snapshot construction, idempotency, grounding-verification), e2e
(lifecycle, ownership, budget/lock integration, export/deletion), Playwright (full flow, empty
states, Premium-gate placement), security (cross-user fetch, duplicate generation, malformed AI
output, prompt injection, provider failure, budget exhaustion), AI-boundary (automated rejection of
an unsupported synthetic claim — flagged as the single highest-value test given Module 16's own
framing of grounding-verification as this module's core risk), cost-control (global-budget
contribution and enforcement). Full detail in `personal-destiny-report.md` §42.

---

## 50. Definition of Done for Sprint 16 implementation

- Persisted, owner-scoped `DestinyReport` records with immutable source snapshots (§13, §34)
- Structured AI synthesis with per-claim evidence citation and an automated, release-blocking
  grounding-verification check (Module 16 §21's own requirement)
- Premium enforcement at the correct boundary (free preview / full report, §20)
- Reused shared AI controls — cost budget, generation lock, provider orchestrator (§21–24) —
  zero new parallel AI infrastructure
- Report history with the established free-cap/Premium-unlimited pattern (§30)
- Full lifecycle (`REQUESTED→GENERATING→READY|FAILED`) with honest failure behavior, no fake/
  partial reports (§21, §27)
- Included in account export; removed on account deletion (§35–36)
- Minimum analytics event set instrumented, closed-shape/no-content-leak (§37)
- Reused `SafetyService`, no new safety architecture (§42)
- Companion bridge (read-only) wired (§39)
- Responsive, accessible reading UI matching Module 16 §20's reading-column spec (§45–46)
- Production build clean; e2e and Playwright suites (§49) passing before release
- At least 3 report types shipped (Monthly Reflection, Growth Report, Memory Highlights — §15),
  satisfying Roadmap V2's own DoD language

## 51. Dependency matrix

| Feature area | Dependency status |
|---|---|
| Natal Chart / Numerology facts as input | `READY` |
| Tarot as optional input | `READY` |
| Memory as optional input (consent/budget/ranking reuse) | `READY` |
| Journal as enrichment input | `READY` |
| AI cost control / generation lock reuse | `READY` |
| AI provider orchestrator reuse | `READY` |
| Safety service reuse | `READY` |
| Premium/entitlement check reuse | `READY` |
| Account export/deletion extension | `READY` (additive pattern already established) |
| Notifications extension | `READY` (module's own comment anticipates this) |
| Analytics contract extension | `READY` (requires a small, explicit type extension, not new infra) |
| Companion bridge (read-only) | `READY` (identical existing pattern) |
| Report generation lifecycle mechanism (sync vs. queue) | `PARTIAL` — synchronous pattern is `READY` to reuse; introducing a queue (the alternative) is `BLOCKED_ENGINEERING` (no infra exists, would be new) |
| Report structure / type selection | `BLOCKED_ENGINEERING` until the §5/§55 product decision is made |
| Reflection/Insight backend reuse (if ever revisited) | `DEFERRED` — explicitly excluded by default this sprint |
| Eastern Horoscope input | `DEFERRED` (Sprint 17 not shipped) |
| Vietnamese Tử Vi input | `BLOCKED_EXTERNAL` (Sprint 15 verdict B — domain sourcing/expert engagement, outside engineering's control) |
| PDF/server-side download | `DEFERRED` (recommended out of V1 scope, §31) |
| Public sharing | `DEFERRED` (Roadmap V2 Sprint 23) |

---

## 52. P0 (would block correct Report implementation)

1. **Resolve the Module-16-vs-Roadmap-V2 scope gap (§5)** — whether V1 targets Module 16's full
   Memory-native vision (not achievable — the Insight Engine it assumes doesn't exist) or Roadmap
   V2's narrower cross-Discovery-system scope (achievable). Implementing without resolving this
   risks building against the wrong mental model mid-sprint.
2. **Decide the generation-lifecycle mechanism (§21, §51)** — synchronous reuse vs. new BullMQ
   infrastructure. This changes the shape of nearly every other design decision (API response
   shape, failure-retry behavior, ops footprint) and must be settled before implementation starts,
   not discovered partway through.
3. **Confirm the grounding-verification step is implemented as an automated, release-blocking
   check**, not a manual review — Module 16 §21 states this explicitly and this audit treats it as
   non-negotiable given the module's stated hallucination-risk profile.

## 53. P1 (important implementation concerns)

1. Extend `AIFeature`/`DiscoveryAIFeature`, `NOTIFICATION_TYPES`, and the analytics event/feature
   unions with the new Reports values, following each existing convention exactly (§23, §37–38) —
   straightforward but must not be skipped or duplicated as a parallel system.
2. Extend `AccountExportPayload` additively (§35) rather than building a separate export path.
3. Tune AI cost-ceiling configuration for Reports' larger per-generation token cost (§16 of the
   architecture spec) — not a blocker, but likely needs founder/ops attention before real launch.
4. Determine the specific Memory-per-report retrieval cap empirically once real generation exists,
   rather than guessing a number now (§8 of the architecture spec).

## 54. P2 (polish/future)

1. PDF/server-side download (§31) — explicitly deferred, Module 16 itself frames as Future
   Expansion.
2. `report_upgrade_clicked` analytics event — only if a specific attribution need emerges.
3. Public sharing — Roadmap V2 Sprint 23.
4. Separate `DestinyReportSection`/`DestinyReportSource` rows — only if a real independent-query
   need emerges; embedded JSON is sufficient for V1.

---

## 55. Product decisions required (not decided by this audit)

1. **Scope framing:** confirm Sprint 16 targets Roadmap V2's narrower cross-Discovery-system scope,
   not Module 16's full Memory-native vision (§5, P0 #1).
2. **Frozen-module reuse:** should Reports ever internally reuse the frozen Reflection/Insight
   backend services as an evidence source? Default recommendation is no — needs explicit founder
   confirmation if that default is to change (§19 of the architecture spec).
3. **Generation mechanism:** synchronous request reuse (recommended) vs. new BullMQ infrastructure
   (§21, P0 #2).
4. **Report-type selection for V1:** confirm Monthly Reflection + Growth Report + Memory Highlights
   as the initial three (§15), or select a different set from Module 16 §4's full vocabulary.
5. **Required-source threshold:** confirm "at least one of Natal Chart or Numerology" (§28) as the
   generation-eligibility bar, rather than requiring both or allowing Tarot alone.

---

## 56. Files created/modified

**Created (documentation/spec only):**
```
docs/audit/sprint-16-pre-implementation-audit.md   (this file)
docs/architecture/personal-destiny-report.md
```
**Modified:** none. **No code, Prisma, or config file was touched.** Roadmap V2 was read but not
edited — no evidence surfaced in this audit demands a correction to the roadmap document itself
(the Module-16-vs-Roadmap-V2 gap identified in §5 is a scope-interpretation question for
implementation to resolve via product decision, not a factual error in either document requiring
an amendment).

## 57. Git status (end of sprint)

```
git status --short  →  9 untracked files total (Sprint 15's 7 + Sprint 16's 2), no other changes
git diff --stat     →  no tracked-file changes
git diff --check    →  clean
```

## 58. Commit/push status

**Not committed. Not pushed.** No `git add`, `git commit`, or `git push` was run.

---

## 59. Final verdict

**B. REPORT ARCHITECTURE REQUIRES PRODUCT DECISION.**

Not A — real, substantive gaps exist between what Module 16 assumes (a Memory-native Insight Engine
that doesn't exist) and what's actually buildable, and a real, unresolved engineering-architecture
question (sync vs. queue) materially shapes the implementation. Not C — no platform gap blocks
correct implementation; every piece of AI/Premium/analytics/notification/export infrastructure
Reports needs already exists and is directly reusable, confirmed by this audit's own code
inspection. The five decisions in §55 are the actual gate, not a missing platform capability.

## 60. Recommended next action

1. Resolve the five product decisions in §55 — none require new research or external engagement
   (unlike Sprint 15's Tử Vi gate); they are founder/product calls informed by this audit's
   findings and can be closed quickly.
2. Once resolved, `docs/architecture/personal-destiny-report.md` is implementation-ready as
   written, contingent on those decisions — no further audit pass is needed first.
3. Do not begin implementation until at minimum P0 items (§52) are explicitly settled — this
   mirrors Sprint 15's own discipline (don't force readiness), scaled to a much smaller, faster-
   closing gap than Sprint 15's domain-sourcing problem.
4. Sprint 15's Tử Vi block remains independently in force and unaffected by this sprint —
   `TU_VI_REPORT_INTEGRATION = DEFERRED` throughout, confirmed compatible with Reports proceeding.

---

**SPRINT 16 VERDICT: REPORT ARCHITECTURE REQUIRES PRODUCT DECISION.**
Do not begin implementation. Sprint 17 (Eastern Horoscope) and Sprint 15's Tử Vi track remain
unaffected by this verdict.
