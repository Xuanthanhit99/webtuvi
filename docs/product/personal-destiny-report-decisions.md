# Personal Destiny Report — Locked Product Decisions

**Status:** Founder-locked. Resolves the five open decisions identified in
`docs/audit/sprint-16-pre-implementation-audit.md` §55, plus additional scope/stop-condition
decisions made at the same time. This is the authoritative, standalone decision record for Sprint
16 implementation — `docs/architecture/personal-destiny-report.md`'s own "PRODUCT DECISIONS LOCKED"
section carries the full reasoning and cross-references; this document is the flat, scannable
summary of what was decided.

**Type:** Product decision record. No code, no Prisma changes, no API routes, no frontend, no
queue infrastructure were added to produce this document. Not committed, not pushed.

---

## Report type

**Personal Destiny Report** — one specific, named V1 artifact. Not a generic "Insight Report," not
a Reflection/Insight/Review/Goal surface, not a Tử Vi report, not an Eastern Horoscope report.
Purpose: synthesize the stable, currently-available personal-discovery systems (Natal Chart,
Numerology) into one Premium long-form report, with fact-vs-interpretation boundaries strictly
preserved.

## Required sources

**Both**, not either — a report cannot be generated unless the user has:
- A completed Natal Chart
- A completed Numerology reading/profile

## Optional sources

- Tarot history (recent-context role only, bounded window — see below)
- Memory (existing consent/retrieval rules, strict small budget — see below)

## Excluded sources (V1)

- Journal
- Reflection, Insight, Review, Goal (frozen modules — not reactivated, data untouched)
- Eastern Horoscope
- Vietnamese Tử Vi

## Tử Vi status

```
TU_VI_REPORT_INTEGRATION = DEFERRED
```
Additive-only extension point once a verified engine exists (Sprint 15's own gate). Zero fabricated
Tử Vi data in Sprint 16. No hard schema dependency created now.

## Eastern Horoscope status

```
EASTERN_HOROSCOPE_REPORT_INTEGRATION = DEFERRED
```
Same treatment — additive, unpopulated, not required, not shipped (Sprint 17).

## Frozen-module decision

Reflection/Insight/Review/Goal must not become implicit Reports dependencies. No reactivation, no
data requirement, code/data intact and untouched.

## Required-source threshold

Generation requires **both** Natal Chart and Numerology complete. If either is missing: **no
partial report** — a source-readiness state with a CTA into the missing Discovery flow instead. No
fake placeholders.

## Tarot's role

**Recent context, not core identity evidence.** May inform Current Themes / recent-reflection
content; must never override or redefine a stable Natal/Numerology fact. A bounded history
window/count must be defined **from measurement during implementation**, not an arbitrary large
dump — no specific number is locked here by design.

## Memory's role

**Optional personalization context**, under existing consent/retrieval rules, with a strict *small*
retrieval budget (tighter than Companion's own per-turn budget, not a copy of it). Shapes AI
wording/relevance only — never contributes to a calculated fact.

## Journal decision

Excluded from V1. Reason: avoid unnecessary privacy expansion and prompt-surface growth in the
first release. May be reconsidered as a separate future decision.

## Generation mechanism

**Synchronous**, using existing AI infrastructure verbatim: provider orchestrator, generation lock,
cost control, `AIUsage`/`ProviderLog`, safety layer. **No BullMQ or any queue in Sprint 16.**

**Hard stop condition:** if measured real-world generation runtime exceeds acceptable
request/runtime limits, implementation must **stop and formally reclassify queue architecture as
REQUIRED** — never silently raise timeouts to work around it. No threshold number is invented here;
it must come from actual measurement.

## Snapshot policy

Reports are **immutable snapshots** once `READY`. The source snapshot does not mutate in place.
Newer source data requires an explicit regenerate/new-version action, never a silent update.

## Versioning

`REPORT_SCHEMA_VERSION`, `REPORT_TEMPLATE_VERSION`, `AI_PROMPT_VERSION`, plus preserved source
version metadata for Natal Chart and Numerology. Do not add or fake Tử Vi/Eastern Horoscope version
fields before those systems exist.

## Fact vs. AI boundary

**CALCULATED FACTS** (Natal placements, Numerology numbers, Tarot cards drawn) are never modified,
recomputed, or "corrected" by AI. **AI SYNTHESIS** (the narrative) may summarize, compare, contrast,
explain, and personalize — but may never: change a deterministic value; invent a missing source
value; claim independent systems mathematically/metaphysically prove each other; fabricate Tử
Vi/Eastern Horoscope facts.

## Final report structure

1. Overview
2. Core identity — Natal Chart + Numerology synthesis
3. Strengths
4. Growth tendencies
5. Relationships
6. Career / direction
7. Current themes — optional Tarot
8. Personalized reflection — optional Memory
9. Source highlights
10. Calculated Facts appendix
11. Methodology + AI disclosure

**Note:** this is a deliberate departure from Product Bible Module 16's report-*type* model
(Monthly Reflection, Growth Report, etc.), chosen because that model depends on a Memory-native
Insight/Theme-escalation engine confirmed (Sprint 16 audit §5) not to exist in this codebase. This
fixed-section structure is judged the more honest, buildable shape for what Roadmap V2 actually
names as a single artifact ("Personal Destiny Report"), not a silent regression into the
statistics-led anti-pattern Module 16 §23 rejects — every section here is populated by real
calculated facts and grounded AI narrative, not activity counts. See the flagged, unresolved
Roadmap V2 DoD-language question below.

## AI output-format decision

**Validated structured output, not free-form Markdown**, as the primary contract. Conceptual shape
(final field-level schema to be finalized in implementation):
```
{
  overview, coreIdentity, strengths[], growthAreas[], relationships, careerDirection,
  currentThemes?, personalizedReflection?, sourceHighlights[], calculatedFacts, methodology
}
```
`?` fields present only when their optional source (Tarot / Memory) was actually used. Every
narrative field must carry evidence references, enforced by an automated grounding-verification
step before display.

## Failure policy

| Condition | Behavior |
|---|---|
| Natal Chart missing | No generation |
| Numerology missing | No generation |
| Tarot missing | Generate without it |
| Memory absent/no consent | Generate without it |
| AI provider fails | `FAILED`, no fabricated content |
| Malformed AI output | Fail validation; retry only per existing bounded-retry policy |
| Budget exceeded | Block honestly |
| Any environment | No Mock fallback in production (existing platform-wide invariant) |

## Premium boundary

Report generation, full viewing, history, and explicit regeneration are Premium. **Natal Chart and
Numerology source results themselves remain free**, unchanged from their existing shipped state —
Reports must never retroactively paywall already-free content. Free users see: report explanation,
source-readiness checklist, and a genuine (non-obscured) preview/locked outline where appropriate.
No price/tier change.

## History policy

Persisted, owner-scoped. Regeneration creates a new version; the previous `READY` report is never
overwritten.

## Download policy

**HTML/web report only for V1.** No new PDF-generation stack. Browser print remains naturally
available. Dedicated branded PDF export is deferred.

## Sharing policy

**Owner-only.** No public report link. Shareability remains later Roadmap work (Sprint 23).

## Notification policy

Because generation is synchronous, **no report-ready notification is required for V1** — the user
already sees the completed report when generation finishes. If a future stop-condition escalation
(see Implementation Stop Conditions) forces asynchronous generation, reuse the existing Sprint 11
Notifications infrastructure for a completion notification at that time — not built preemptively.

## Companion bridge

Read-only "Ask Companion about this report," using the report's own structured sections as context.
Companion cannot mutate report facts. No arbitrary hidden user data sent beyond the report's own
content.

## Tử Vi / Eastern Horoscope extension policy

Additive-only source-snapshot slot for each, once each respective system ships and passes its own
release gate. Zero fabricated data for either in Sprint 16. No hard schema dependency created now.

## Analytics events (approved)

`report_viewed`, `report_generation_started`, `report_generation_completed`,
`report_generation_failed`, `report_upgrade_clicked`. **Note:** the Sprint 16 audit had recommended
against `report_upgrade_clicked` by default (existing `premium_viewed`/`checkout_started` events
already cover the upgrade funnel); the founder explicitly included it anyway, judging Reports'
distinct paywall-moment status (Module 16 §1) worth the dedicated attribution dimension. No report
body/content in any event.

## Account export / deletion

Reports are user-owned persisted data: included in account export (extends the existing
`AccountExportPayload.discoveries`-style pattern additively), deleted on account deletion, no
financial-style retention exception. `ProviderLog` remains governed by its own existing operational
policy.

## Security requirements (Sprint 16 implementation must cover)

IDOR, cross-user fetch, cross-user regeneration, mass assignment, generation race, duplicate
generation, prompt injection via Memory, prompt injection via Tarot question/history, Markdown/
HTML/XSS, analytics leakage, Sentry leakage, source-snapshot leakage. All mitigated via existing,
already-proven mechanisms — no new security subsystem.

## Privacy requirements

Only minimum necessary personal context reaches the AI provider. **Never sent:** raw Journal
content, frozen-module content, the full/unbounded Memory corpus, unbounded Tarot history — every
source passes through its already-locked bound (both-sources requirement, Tarot's bounded window,
Memory's strict budget) before reaching the prompt. Existing Sentry/`ProviderLog` scrubbing reused
unchanged.

## Safety requirements

Reuse `SafetyService`'s existing category taxonomy verbatim — no new safety subsystem. The report
must never produce: medical diagnosis, legal advice, investment certainty, fatalistic guarantees,
death predictions, or relationship certainty framed as fact.

---

## Sprint 16 implementation scope (approved)

Report persistence; required-source readiness (both Natal + Numerology); snapshotting; structured
AI synthesis; Premium gating; synchronous generation; history; explicit regeneration; AI
cost-control reuse; account export/delete; analytics; Companion bridge; responsive UI; tests/
security/docs.

## Explicit out of scope

Vietnamese Tử Vi, Eastern Horoscope, Journal as a source, frozen modules as a source, a PDF
generation engine, public report sharing, queue infrastructure, Community, broad Admin, a new AI
provider, payment changes, pricing changes.

## Implementation stop conditions

Implementation must **stop and trigger an explicit architecture review** — never silently work
around — if any of the following occur:

- **A.** Synchronous generation exceeds practical runtime limits (measured, not guessed).
- **B.** The source snapshot cannot be reproduced deterministically.
- **C.** AI output cannot be reliably validated against the locked schema.
- **D.** The active AI provider's context/output limits are insufficient for the already-bounded
  source payload (a signal the bound itself needs reassessment, not just the provider).
- **E.** Meeting privacy constraints would require sending more data than this document approves.

---

## Flagged, unresolved (not decided by this document)

**Roadmap V2 DoD-language tension.** `docs/product/product-completion-roadmap-v2.md`'s Sprint 16
entry says "at least 3 of the Bible's [16] report types shipped with automated grounding tests" —
written assuming Product Bible Module 16's report-*type* model (Monthly Reflection, Growth Report,
etc. as separately generatable artifacts). The locked structure above is **one** report type
(Personal Destiny Report) with 11 internal sections, not 3 separate report types. This document does
not resolve whether Roadmap V2's DoD language should be read as satisfied by "1 report with 3+
substantive synthesis sections" or requires an explicit roadmap amendment — **flagged for Sprint 16
Release Closure to raise with the founder directly**, not decided here.

---

## Sprint 15 preservation

Sprint 15's Vietnamese Tử Vi domain work (`docs/audit/sprint-15-pre-implementation-audit.md` and
all six `docs/domain/tu-vi/*.md` files) was not modified to produce this document, beyond what
`docs/architecture/personal-destiny-report.md`'s existing cross-references already pointed to.
**Sprint 15's verdict remains unchanged: DOMAIN REFERENCES INCOMPLETE.** Nothing in these Report
decisions resolves, narrows, or otherwise affects that verdict — `TU_VI_REPORT_INTEGRATION =
DEFERRED` above is fully consistent with, not a workaround of, Sprint 15's block.
