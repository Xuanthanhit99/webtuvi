# Personal Destiny Report — Architecture Specification (Sprint 16, spec only)

**No code, no Prisma changes in this document or the sprint that produced it.** This is a design
specification gated by the product decisions listed in
`docs/audit/sprint-16-pre-implementation-audit.md` §55 — where a decision is still open, this
document says so rather than silently picking an answer.

---

## 1. What this module actually is (resolving a real tension, not assuming it away)

Two governing sources describe "Reports" somewhat differently, and this document does not paper
over the gap:

- **Product Bible Module 16** describes Reports as a Memory-native narrative engine: it consumes
  a "Memory graph" with an internal Theme/Pattern **Insight Engine escalation ladder** (Module 10
  §11), synthesizes evidence-gated first-person narrative prose, and explicitly rejects
  statistics-led or fixed-template structure ("Chosen Reports Model," Module 16 §23). Its report
  *types* are things like Monthly Reflection, Growth Report, Life Chapters — narrative artifacts,
  not a single document with fixed sections.
- **Roadmap V2's Sprint 16 entry** narrows this to "using currently-available inputs (Tarot,
  Numerology, Natal Chart, Memory)... at least 3 of the Bible's 15 [sic — Module 16 §4 lists 16]
  report types shipped with automated grounding tests."

**The gap:** Module 16's Insight Engine is described as living *inside* Memory (Module 10) — an
automatic significance/Theme/Pattern escalation system. The actual Memory module
(`apps/api/src/memory/`) has consent, CRUD, versioning, importance *scoring*, retrieval ranking,
and duplicate/conflict detection — but **no embeddings, no semantic clustering, no automatic
Theme/Pattern escalation**. That capability does not exist under Memory. A *separate*, non-Bible,
deterministic rule engine with a similar shape (Reflection → Insight, Sprint 4B/4C) does exist in
the codebase, but it is one of the four modules Sprint 14 explicitly froze and hid from primary UX,
and prior audits recorded it as "not part of the Bible's 16-module tree at all."

**This document's resolution (a recommendation requiring explicit product sign-off, not a silent
choice — see audit §55):** build Sprint 16 V1 as Roadmap V2 actually scopes it — a cross-Discovery-
system + basic-Memory evidence synthesis, narrower than Module 16's full vision — and treat using
the frozen Reflection/Insight *backend services* (not their UI, not "reviving" them) as an internal
evidence-source dependency as a distinct, explicit decision the founder should make, not an
assumption this document bakes in. See §6 and §17 for the two concrete options this produces.

---

## 2. Report V1 purpose

Per Module 16 §1/§2 and Roadmap V2's framing: **not** a personality-profile printout, **not** a
concatenation of existing Tarot/Numerology/Natal Chart interpretation text, **not** an activity
digest. It exists to show the Companion "showing, not telling" that it has been paying attention —
turning what the user has already generated across Discovery systems and (where available) Memory
into one coherent, evidence-traceable narrative, gated so it is never generated from insufficient
material.

**Classification against the sprint brief's own options:** primarily **B (cross-system synthesis)**
with elements of **C (long-form premium value)** — explicitly **not A** (a bare snapshot) and not
faithfully **D** (a downloadable artifact is a nice-to-have export of the synthesis, not the
product itself, per §26 below).

---

## 3. Existing report-related code (audit finding, not this document's own claim — see main audit
§4 for the search)

**Zero** real report-generation code exists anywhere in the repository. `AccountExportPayload`
(`apps/api/src/users/export/account-export.service.ts`) is a data-export mechanism (raw record
dump for GDPR-style rights), architecturally unrelated to a narrative Report despite the shared
English word. No reusable report-rendering, evidence-engine, or narrative-synthesis code exists to
build on — Sprint 16 is greenfield within an otherwise-mature AI/Premium/analytics substrate.

---

## 4. Input inventory

| Input | Classification | Why |
|---|---|---|
| Natal Chart deterministic facts | `AVAILABLE` | Shipped Sprint 9, persisted, versioned |
| Natal Chart AI interpretation | `AVAILABLE` | Shipped, persisted per reading |
| Numerology deterministic facts | `AVAILABLE` | Shipped Sprint 8, persisted, versioned |
| Numerology AI interpretation | `AVAILABLE` | Shipped, persisted per reading |
| Tarot readings/history | `AVAILABLE_BUT_OPTIONAL` | Shipped Sprint 6, but reading-based/ephemeral in nature — see §11 for why it must not dominate a long-lived report |
| Memory | `AVAILABLE_BUT_OPTIONAL` | CRUD/consent/retrieval exist; no automatic significance escalation (§1) — usable as a bounded, consent-respecting, budget-limited context source, not a rich narrative-theme source yet |
| Journal | `AVAILABLE_BUT_OPTIONAL` | Shipped Sprint 4A, no AI-generated content itself, real user-authored text — a legitimate, low-risk evidence source once explicitly approved (§14) |
| Reflection | `NOT_READY` (frozen module) | Code/data intact but hidden from primary UX since Sprint 14; using its *output* internally is a distinct product decision, not a default — see §1 |
| Insight | `NOT_READY` (frozen module) | Same as Reflection |
| Review | `NOT_READY` (frozen module) | Same; additionally Review's own content (weekly/monthly aggregation) is closer to Reports' own domain than a useful *input* to it — risk of overlapping product surfaces if reused, not just a freeze status |
| Goal | `NOT_READY` (frozen module) | Same status; no clear evidentiary link to a "destiny" narrative found in governing docs |
| Eastern Horoscope | `NOT_READY` | Not shipped (Sprint 17) — extension point only, §42/§43 of the main audit |
| Vietnamese Tử Vi | `FORBIDDEN` for this sprint | Sprint 15 verdict B — engine does not exist, decision register incomplete. `TU_VI_REPORT_INTEGRATION = DEFERRED` |
| Profile information (display name, etc.) | `AVAILABLE` | Already collected at signup; identity/cover framing only, never treated as evidence |

---

## 5. Deterministic facts vs. AI synthesis (mandatory boundary)

Two conceptual layers, matching the discipline already proven for Tarot/Numerology/Natal Chart and
made explicit for the larger synthesis surface Reports operates at (Module 16 §6/§17):

- **CALCULATED FACTS** — Numerology's Life Path/Expression/etc. numbers, Natal Chart's placements/
  houses/aspects, Tarot's drawn cards, Memory's stored content, Journal's entry text. **AI must
  never modify, recompute, or "correct" any of these** — identical in force to the existing
  Discovery-system rule (Bible Module 23 §10) and the rule already re-confirmed for the future Tử
  Vi module (`docs/domain/tu-vi/calculation-specification.md` §7).
- **AI SYNTHESIS** — the narrative prose connecting facts across systems. Every generated sentence
  must be traceable to a specific fact/evidence item it drew from (Module 16 §18's grounding-
  verification requirement) — a structural, enforced pipeline stage, not an optional QA pass.

The report record itself must keep these visibly distinguishable at render time (a "why this
appears" / Deep Dive affordance per fact or evidence item), mirroring Module 16 §12's Deep Dive
pattern and the same discipline the Vietnamese Tử Vi product definition independently re-derived
for its own future Reports integration (§13 there).

---

## 6. Cross-system synthesis policy

The report must distinguish, explicitly, in its generated language:
- **Agreement** — where two systems' facts point the same direction (e.g., a Numerology Life Path
  theme and a Natal Chart placement both suggesting a similar growth area) — narrated as a genuine,
  noticed pattern, never as "proof."
- **Contrast** — where systems point different directions — narrated honestly, not smoothed over.
- **Reflection** — a system's content used as a prompt for an open question, not a claim.
- **Uncertainty** — explicitly flagged where evidence is thin (a single Tarot draw, a sparse
  Memory set) rather than treated with false confidence.

**Explicitly forbidden framing** (per the sprint brief and consistent with every Discovery system's
existing "never invent/never overclaim" discipline): "All systems prove that...", "the universe
confirms...", any framing implying independent systems mathematically or metaphysically validate
each other. Numerology, Natal Chart, and Tarot are independent symbolic systems with no shared
mathematical basis — an agreement between them is a narratively interesting coincidence to note,
never evidence of external validation. This must be a stated, tested prompt-level instruction
(§20 of the main audit), not left to a general "be honest" instruction.

---

## 7. Tarot's role

**Recommendation: recent-context section, not core identity.** Tarot is reading/history-based, not
a fixed birth-derived system like Natal Chart or Numerology — a single random draw should never be
allowed to dominate or anchor a long-lived destiny narrative. Concretely: Tarot evidence should be
scoped by recency and/or explicitly framed as "what you've been reflecting on lately" rather than
"who you are," and a report's core-identity framing should draw primarily from Natal Chart/
Numerology (both derived once from fixed birth data, stable across the user's lifetime) with Tarot
contributing texture/current-mood context, weighted down relative to the two birth-derived systems.

---

## 8. Memory's role

Memory retrieval for Reports must respect the same consent/budget/relevance discipline already
built for Companion (`apps/api/src/memory/budget/context-budget.service.ts`,
`apps/api/src/memory/retrieval/memory-retrieval.service.ts`) — **reused, not reinvented**:
- **Consent:** only memories the user has actually consented to save are eligible (existing
  `MemoryConsentService` gate) — Reports introduces no new consent bypass.
- **Retrieval budget:** bounded, matching the existing context-budget pattern that already caps how
  much Memory content enters any single AI call — Reports must not "dump arbitrary Memory content"
  (explicit brief instruction), it must request a bounded, ranked slice.
- **Relevance:** existing `memory-ranking.util.ts` significance/confidence-based ranking, not a new
  scoring system.
- **Maximum memories per report:** a specific number is a P1 implementation decision, not fixed
  here — recommend starting from Companion's existing per-turn cap as a reference point and
  measuring, rather than inventing a report-specific number with no evidence behind it.
- **Explainability:** every Memory-derived narrative claim needs a Deep-Dive-style attribution back
  to the specific memory, mirroring Settings' existing "why I remembered" pattern already shipped
  for Companion.

---

## 9. Journal / frozen-module decision

**Journal:** plausible, low-risk inclusion — real user-authored text, no AI content of its own, no
freeze status, already an established Memory-adjacent evidence source per README's own description.
Recommend `AVAILABLE_BUT_OPTIONAL` (§4).

**Reflection / Insight / Review / Goal:** **default to exclusion**, per the sprint brief's own
instruction ("Default to exclusion unless governing docs explicitly justify it") — no governing
document explicitly justifies pulling the frozen modules' data into Reports; Module 16's own
"Insight Engine" reference is to a *different*, Memory-native concept that doesn't exist (§1), not
license to reuse the frozen Sprint 4C module by name. **Do not reintroduce them through Reports**,
per the sprint brief's explicit instruction — this applies to both their UI (already true, unaffected)
and, absent an explicit founder decision, their backend services as silent report inputs.

---

## 10. Report structure (derived, not assumed)

**Do not adopt the sprint brief's own suggested generic structure wholesale** ("Cover / Executive
Summary / Core Personality / Strengths / Growth Areas / Relationships / Career / Current Themes /
Numerology / Natal Chart / Tarot reflection / Memory-aware synthesis / Calculated Facts appendix /
Methodology") — that shape reads as a static personality-profile template, which Module 16 §23
explicitly rejects ("Statistics-led reports... rejected outright as the precise anti-pattern").

**Recommended V1 structure**, derived from what Module 16 §4 actually defines and what Roadmap V2
scopes as achievable now:
- **Monthly Reflection** — the first cadence Module 16 itself calls out as having "reliable enough
  density to feel genuinely earned" (§4) — built from that period's Discovery activity + any
  Memory/Journal content, narrated with real shape (beginning/turn/current-state per §6's own
  worked example), not bullet sections.
- **Growth Report** — explicitly named in Module 16 §4 as drawing on "Natal Chart/Numerology Growth
  Themes" — the most naturally achievable type given only Tarot/Numerology/Natal Chart/Memory are
  in scope, and directly maps to Roadmap V2's "at least 3... report types" DoD.
- **Deep Dive** (§4) — not a report type on its own but the mandatory evidence-trail affordance
  every generated report needs (§5 above), satisfying the sprint brief's "Calculated Facts
  appendix" instinct in the form Module 16 actually specifies it (tap-through, not a static
  section).

This yields 2 narrative types + the Deep Dive affordance for V1 — meeting "at least 3... report
types" only if a third (e.g., Memory Highlights, Module 16's lightest-weight type, achievable even
with sparse evidence) is added. **Recommend Memory Highlights as the third**, since it has the
lowest evidence-density bar (Module 16 §14) and is achievable for more users sooner than Yearly
Review or Life Chapters, which need more accumulated history than most users will have at Sprint 16
launch.

**No "Executive Summary," "Core Personality," "Strengths," "Career/Direction" fixed sections are
recommended** — these read as the rejected statistics/personality-profile pattern, not as any of
Module 16's actual named report types.

---

## 11. Source snapshot strategy

**Recommendation: B — store a canonical source snapshot at generation time.** Rationale:
- **Reproducibility:** Module 16 §17 explicitly states "generated reports are cached/stored
  permanently once created (they represent a point-in-time synthesis and shouldn't silently change
  later)."
- **Engine version changes:** Numerology/Natal Chart already persist `calculationVersion`; a report
  referencing "Life Path 7" must remain correct even if a later engine-version fix changes how Life
  Path is computed for *new* readings — resolving live would silently rewrite history.
- **Deleted readings:** if a user later archives/deletes a Tarot reading a report referenced, the
  report must remain internally consistent, not develop a dangling reference.
- **Memory changes / consent revocation:** if a user forgets a memory a report drew from, the
  already-generated report's *stored text* should remain as originally shown (it was true when
  generated) while the live system stops surfacing that memory going forward — consistent with how
  Memory deletion already works elsewhere in the product (immediate for future use, not retroactive
  rewriting of past artifacts).
- **AI model changes:** a switch in `DEFAULT_AI_PROVIDER` must not retroactively alter previously
  generated report text.

Live-resolving (option A) is rejected — it would violate Module 16's own "permanent artifact" model
and create exactly the reproducibility gaps listed above.

---

## 12. Versioning

Three identifiers, mirroring the pattern already established for Tử Vi (`docs/domain/tu-vi/
calculation-specification.md` §9) and Numerology's existing `calculationVersion`:

| Version | Increments when |
|---|---|
| `REPORT_SCHEMA_VERSION` | The persisted report record's shape changes (new required field, structural change to how sections are stored) |
| `REPORT_TEMPLATE_VERSION` | The narrative structure/section set for a given report type changes (e.g., Monthly Reflection gains a new required subsection) |
| `AI_PROMPT_VERSION` | The Reports-specific prompt/instruction set changes — tracked separately from `REPORT_TEMPLATE_VERSION` because a prompt change can alter narrative *quality/tone* without changing the report's structural shape |

Source versions are preserved via the snapshot (§11) — each source-system fact stored in the
snapshot carries its own already-existing version field (Numerology's `calculationVersion`, Natal
Chart's equivalent); no new source-version concept is needed, only faithful snapshotting of what
already exists. A future `TUVI_ENGINE_VERSION`/`CALENDAR_VERSION`/`STAR_RULESET_VERSION` (once Tử
Vi ships) would be captured the same way, additively.

---

## 13. Premium boundary

Per Module 16 §1 ("the clearest, most legitimate context for the Premium paywall moment") and the
product's existing anti-scarcity discipline (confirmed unchanged across every other module audited
this year): **free preview + Premium full report**, not a full paywall on the concept of Reports
existing at all — consistent with how Discovery systems keep full core content free and gate depth.

| Aspect | Policy |
|---|---|
| Free preview | A genuine partial view (Module 4's anti-artificial-scarcity rule — "never a fully obscured teaser") — e.g., the report's opening paragraph and theme headline, not a blurred/locked full page |
| Full report | Premium |
| Regeneration | Premium-gated — mirrors the existing pattern of Premium unlocking deeper/more-frequent access elsewhere (Tarot/Numerology/Natal Chart's existing daily-draw-ceiling + interpretation-depth pattern) |
| History | Free: latest report only (or a small fixed cap); Premium: full history — mirrors the existing 20-item free cap pattern already shipped for Discovery history |
| Download | Not price-differentiated by this document — a UX/infra decision (§26), not a monetization lever with existing precedent either way |
| Refresh frequency | Bounded by evidence-threshold gating (Module 16 §8/§14) regardless of tier — Premium does not entitle a user to force-generate a report before genuine evidence density exists; it entitles deeper/more frequent access to reports that *are* eligible to generate |

**No price change proposed** — this section describes access-tier boundaries only, consistent with
the sprint brief's explicit instruction not to invent pricing.

---

## 14. Generation lifecycle

States: `REQUESTED → GENERATING → READY | FAILED`. No `PARTIAL` state — Module 16 §14 is explicit
that "a half-generated Report is worse than a delayed one."

**No BullMQ or any job-queue infrastructure exists anywhere in this codebase today** (verified —
see main audit §4/§18). Module 16 §17 assumes "inherently async (BullMQ)" generation, but every
actually-shipped AI generation surface (Companion streaming, Tarot/Numerology/Natal Chart
interpretation) uses a synchronous request bracketed by `GenerationLockService`/`CostControlService`
— not a queue. **This is a real architecture decision, not a detail:**

- **Option 1 (recommended default): reuse the existing synchronous-request pattern.** A report
  generation request is a normal HTTP request, locked via
  `GenerationLockService.tryAcquireDiscovery('reports', userId, reportRequestId)` (the exact
  existing per-feature-per-source lock, extended with a new feature key) for the duration of
  generation, budget-checked via the existing `CostControlService`. If synthesis genuinely takes
  too long for a single HTTP request (untested — no report generation exists yet to measure), the
  existing pattern can be adapted with a short client-side poll against a `GENERATING` status
  rather than introducing a new queue dependency.
- **Option 2: introduce BullMQ/Redis-backed job queue for the first time.** Matches Module 16's own
  spec more literally, but is new infrastructure with real deployment/ops cost (a worker process,
  job monitoring, failure/retry semantics) that nothing else in this codebase has needed yet.

**Recommendation: Option 1 for V1**, re-evaluated only if real generation-time measurements show
synchronous requests are impractical — consistent with this project's demonstrated bias (every
sprint so far) toward not introducing new infrastructure until an actual, measured need forces it.
This is flagged as a product/engineering decision in the main audit (§55), not decided unilaterally
here.

---

## 15. Idempotency

- **Generation lock:** the existing `GenerationLockService.tryAcquireDiscovery` pattern, keyed by
  `(feature='reports', userId, reportPeriodKey)` — a second "Generate" click for the same report
  period while one is in flight is rejected exactly like a duplicate Tarot-interpretation-retry
  click already is today (Sprint 12's confirmed abuse vector, §"cost-control" comment in
  `generation-lock.service.ts`).
- **Idempotency key:** the report period itself (e.g., `(userId, type='monthly_reflection',
  periodStart)`) is the natural idempotency key — a second request for an already-`READY` period
  returns the existing report, never generates a duplicate.
- **Report period/version semantics:** once `READY`, a given (user, type, period) tuple is
  immutable (§11) — regeneration (§13, Premium-gated) creates an explicitly new, separately-
  versioned record rather than overwriting, preserving historical consistency for anything that
  already referenced the original.

---

## 16. AI cost control

**Must reuse, not duplicate:**
- `CostControlService` — global per-user `AIUsage`-based budget check, already deliberately
  feature-agnostic (Companion + Tarot + Numerology + Natal Chart share one ceiling; "a security
  decision, not an oversight" per its own code comment). Reports must add to this same global
  ceiling, not introduce a separate Reports-only budget that could let a user's *effective* spend
  exceed the intended cap.
- `GenerationLockService` — extend `AIFeature`/`DiscoveryAIFeature` (currently `'companion' |
  'tarot' | 'numerology' | 'natal_chart'`, `apps/api/src/companion/providers/ai-feature.types.ts`)
  with a new `'reports'` value, following the exact Sprint 12 attribution convention already
  established — not a fifth independent mechanism.
- `AIUsage`/`ProviderLog` — same `feature`/`sourceId` attribution pattern (schema.prisma, Sprint 12
  convention) — a Reports generation call records a normal `AIUsage`/`ProviderLog` row tagged
  `feature: 'reports'`, nothing new invented.

**Cost estimate for long report generation:** a cross-system synthesis call is larger than a
single-turn Companion message or a single Discovery interpretation — expect meaningfully higher
per-generation token cost. This is a P1 concern for the founder's cost-ceiling configuration
(`AI_MAX_CONCURRENT_GENERATIONS_PER_USER` and the daily/monthly budget thresholds may need
Reports-aware tuning), not a blocker to architecture, since the mechanism itself is already proven
and reusable.

---

## 17. AI provider

**No new client.** Reports must call through the existing `ProviderOrchestratorService` /
`ProviderRegistryService` stack (`apps/api/src/companion/providers/`) exactly like Companion and
Discovery interpretation already do — same `DEFAULT_AI_PROVIDER` switch (OpenAI/Anthropic/Gemini/
Mock), same Mock-blocked-in-production guarantee, same retry/error semantics. A Reports-specific
prompt (§20) is layered on top of this existing stack, not a parallel one.

---

## 18. AI input contract

**Structured JSON facts, never scraped UI text or pasted-together existing prose** — the sprint
brief's own strong preference, consistent with how Tarot/Natal Chart/Numerology interpretation
already receives structured already-computed facts rather than re-deriving anything.

Explicit system-level instructions (extending the existing Discovery-interpretation prompt
discipline, scaled to synthesis-across-systems per Module 16 §17):
- Never alter, "correct," or recompute a calculated value from any source system.
- Never invent a fact, memory, quote, or specific detail not present in the provided evidence set.
- Distinguish interpretation from fact explicitly in the output structure (§19).
- No medical, legal, or financial certainty — matches the existing Companion/Discovery safety
  boundary (§37 of the main audit; reused, not reinvented).
- Avoid deterministic fate claims — matches every Discovery system's existing "never predicts, only
  reflects" framing (explicitly restated in Module 16 §16's "Future Reflection... reflective, never
  predictive").
- Surface contradictions honestly (§6 above) rather than smoothing them into false agreement.

---

## 19. AI output schema

**Recommendation: schema-validated structured JSON sections, not free Markdown.** The sprint
brief's own instinct is correct and matches Module 16 §17's own instruction ("requiring the model
to tag which evidence item(s) support each narrative claim, verified before display") — free-form
Markdown makes that verification step unreliable (headings/structure become AI-controlled and
unpredictable), where a validated schema (e.g., `{ sections: [{ id, title, narrative, evidenceRefs:
[...] }], closingQuestion }`) lets the backend run the grounding-verification pass (§5, §20)
deterministically before anything reaches the UI, and lets the frontend render a stable,
accessible structure (§41) rather than parsing arbitrary Markdown headings.

---

## 20. Failure behavior

| Failure | Behavior |
|---|---|
| AI provider (Gemini/etc.) unavailable | Generation fails to `FAILED`, no partial/degraded report shown — matches Module 16 §14's explicit "queues and retries rather than producing a degraded/partial narrative." No queue exists yet (§14 above), so V1 behavior is: fail the request cleanly, let the user retry, rather than a silent background retry — revisit if/when a queue is introduced |
| Budget exceeded | Generation refused before starting (existing `CostControlService` check, reused verbatim) — same user-facing behavior as an existing Discovery interpretation hitting budget |
| Generation lock active | Reject the duplicate request (§15) — existing pattern |
| One source system unavailable (e.g., Natal Chart API hiccup mid-evidence-gathering) | Treat as `CALENDAR_CONVERSION_FAILED`-equivalent for Reports — fail the generation cleanly, do not silently omit that source and present a report as if it were complete |
| No Tarot history | Not a failure — Tarot is `AVAILABLE_BUT_OPTIONAL` (§4); report generates without it if other evidence thresholds are met |
| No Memory (no consent, or empty) | Not a failure — same reasoning |
| No Natal Chart | See §21 (partial-report policy) — may or may not block, depending on which sources are `REQUIRED` |
| No Numerology | Same |
| Malformed AI response (schema validation fails) | Treat as a generation failure (`FAILED`), never coerce/guess a shape — no fake report, no silent fallback to Mock in production (explicit brief instruction, already an enforced platform-wide invariant via `env.validation.ts`) |

---

## 21. Partial-report policy

| Source | Classification |
|---|---|
| Numerology **or** Natal Chart (at least one) | `REQUIRED_SOURCE` — a "destiny" narrative with zero birth-derived deterministic system present has no real anchor; recommend requiring at least one of these two, not both, to keep the bar achievable for users who've only tried one Discovery system |
| Tarot | `OPTIONAL_SOURCE` (§7) |
| Memory | `OPTIONAL_SOURCE` — enriches but Module 16 §14 itself says "No journal... still generate from Companion/Discovery memory alone if sufficient" (by direct analogy, the same graceful-degradation logic applies to Memory being sparse or absent) |
| Journal | `ENRICHMENT_SOURCE` — never required, adds specificity when present (§9) |

**Can a Numerology-only user generate a report?** Yes, per the above — recommend not requiring both
Natal Chart and Numerology, since that would exclude a meaningful share of users who've only tried
one Discovery system, contradicting Module 16 §14's own "graceful degradation" precedent.

---

## 22. Refresh/regeneration policy

**Recommendation: immutable snapshots, explicit regeneration only** (§11, §15) — never silent
auto-refresh. A user can request a new report for a new period (natural, not a "refresh" of the
old one) or explicitly regenerate an existing period's report (Premium-gated, §13, creating a new
versioned record, not overwriting). New Tarot readings, Memory changes, or source
calculation-version updates that occur *after* a report was generated do not retroactively alter
it — consistent with Module 16 §17's "shouldn't silently change later."

---

## 23. History

**Recommendation: report history, not latest-only** — Module 16 §12 (Life Timeline) and §10 ("the
accumulated sequence of reports itself becomes visible evidence of change... a user can look back
at how their own Yearly Reviews have evolved") make history a core part of the module's value, not
an optional extra. Free tier: latest report only, or a small fixed cap (§13); Premium: full history
— mirroring the existing 20-item free-history-cap pattern already shipped for Tarot/Numerology/
Natal Chart. Retention: indefinite, subject to the same account-deletion behavior as every other
persisted user-content type (§31/§35 of the main audit).

---

## 24. PDF / download decision

**Recommendation: HTML-only V1 (in-app reading + browser print), no server-side PDF generation.**
No PDF generation infrastructure exists anywhere in this codebase today (verified — no `puppeteer`,
`pdfkit`, or similar dependency found). Comparison:

| Approach | Complexity | Mobile UX | Branding | Cost | Deployment |
|---|---|---|---|---|---|
| HTML-only + browser print | Low — reuses the reading-column layout Module 16 §20 already specifies | Good — same responsive component as reading the report normally | Full control via existing CSS | None | No new dependency |
| Server-rendered PDF | High — new rendering pipeline (headless browser or PDF library), new failure modes, new infra | Requires a download/share flow on mobile, weaker than native reading | Requires separate print-stylesheet maintenance | New dependency + render-time cost per generation | New deployment surface (memory/CPU for rendering) |

Module 16 §22 itself lists "Printable Reports" as a **Future Expansion** item, not a V1
requirement, and frames it as "a plausible, low-risk export format extension of the existing
Settings data-export capability" — i.e., explicitly deferred, matching this recommendation.

---

## 25. Sharing decision

**Default: owner-only, no public report URLs in Sprint 16.** Roadmap V2 places general
shareability at Sprint 23, after Eastern Horoscope and Tử Vi ship (`product-completion-roadmap-v2.md`
Sprint 23 dependencies). Reports must not accidentally introduce a public/unauthenticated report
route as a side effect of implementation convenience (e.g., a shareable-by-link "preview" URL) —
every report endpoint must be owner-scoped (§26), identical in discipline to every existing
Discovery-result endpoint's ownership check (`findOwned()` pattern, per the project's established
IDOR discipline).

---

## 26. API design (spec only — no implementation)

Owner-scoped, mirroring the existing Discovery-system controller pattern:

```
POST   /reports                    — request generation for a report type/period
GET    /reports                    — list the caller's own reports (history, §23)
GET    /reports/:id                — fetch one report (narrative + section structure)
GET    /reports/:id/evidence       — Deep Dive: full evidence trail for a report
POST   /reports/:id/regenerate     — Premium-gated, creates a new versioned record (§15, §22)
```

Every route requires the same ownership check already used elsewhere (`findOwned()`-equivalent —
a report ID that doesn't belong to the requesting user must 404, not 403, matching the existing
IDOR-prevention convention flagged in every prior sprint's security review).

---

## 27. Data model (spec only — no Prisma changes)

Conceptual shapes only:

```
DestinyReport
  id, userId, type, periodStart, periodEnd,
  status (REQUESTED | GENERATING | READY | FAILED),
  reportSchemaVersion, reportTemplateVersion, aiPromptVersion,
  sourceSnapshot (the canonical facts captured at generation time, §11),
  narrativeSections (structured, §19),
  aiMetadata (provider, model, token counts — mirrors AIUsage/ProviderLog attribution),
  createdAt, generationStartedAt, completedAt, failedAt, failureReason
```

**Evaluated: separate `DestinyReportSection` rows vs. embedded structured JSON.** Recommend
embedded JSON for V1 (matches how Numerology/Natal Chart already store structured results as JSON
columns rather than one row per data point) — separate rows would only earn their complexity if
sections need independent querying/indexing, which no requirement in this document identifies.
Revisit only if a real query need emerges.

**Evaluated: separate `DestinyReportSource` rows** (one per contributing system) vs. a single
`sourceSnapshot` JSON blob. Recommend the snapshot blob for V1, consistent with the "point-in-time,
immutable" framing (§11) — the snapshot doesn't need to be queried independently of its parent
report.

No migration is created in this sprint.

---

## 28. Account export

**Must be included, per existing precedent.** `AccountExportPayload`
(`apps/api/src/users/export/account-export.service.ts`) already includes a `discoveries: { tarot,
numerology, natalChart }` keyed structure — Reports is exactly analogous persisted personal
content and should extend this payload additively (e.g., a new `reports: unknown[]` key), following
the exact established pattern rather than inventing a separate export mechanism.

## 29. Account deletion

**Reports must not survive account deletion**, matching every other persisted personal-content
type's existing behavior (`account-deletion.service.ts`'s established cascade pattern) — no
documented legal reason was found in any governing doc that would require retaining a user's
generated Reports after account deletion (payment-record retention, which does have a
legal/business basis, is explicitly noted in the roadmap as a *separate*, unrelated policy that
does not automatically extend to Reports).

---

## 30. Analytics

Following the exact existing naming/attribution convention (`ClientAnalyticsEventName`/
`ServerAnalyticsEventName`/`AnalyticsFeature` in `packages/types/index.ts`):

**Recommended minimum set** (not the full brainstormed list — checked against the existing
allowlist discipline, §32 of the main audit):
- `report_generation_started` (client, mirrors `tarot_started`) — fired when the user initiates
  generation.
- `report_generation_completed` (server, mirrors `tarot_completed`) — fired in-process when the
  report row flips to `READY`.
- `report_viewed` (client, mirrors `discover_viewed`) — fired on report-read mount.
- `report_generation_failed` — **new pattern**, not mirrored elsewhere in the existing contract
  (no Discovery system currently emits a `*_failed` analytics event) — worth adding since Reports'
  higher-stakes generation (§14, §16) makes failure-rate visibility genuinely valuable, but this is
  a small, deliberate contract extension, not an automatic copy-paste.
- **Not recommended for V1:** `report_upgrade_clicked` — the existing `premium_viewed`/
  `checkout_started` events already capture the funnel; a Reports-specific upgrade-click event adds
  a dimension not present anywhere else in the current event taxonomy (which surface prompted an
  upgrade click) and should only be added if that specific attribution question becomes a real
  product need — not by default.

**Privacy:** matches the existing closed-shape discipline exactly — `feature: 'reports'` (new
`AnalyticsFeature` value), `route` (pathname only), never report title/narrative/evidence content,
never source-system facts. No new privacy category introduced.

---

## 31. Notifications

**Reuse Sprint 11 infrastructure, add one new type.** `NOTIFICATION_TYPES`
(`apps/api/src/notifications/notifications.types.ts`) is a closed, bounded enum whose own doc
comment already anticipates this: *"Companion/Community/Reports triggers (none of those systems
exist/are wired yet)"* — explicit acknowledgment from the Notifications module's own author that a
Reports-completion notification is expected once Reports ships. Recommend adding
`'report.ready'` (or similar), mapped to the same transactional/category conventions already
established for `'premium.activated'`. **No new notification architecture** — this is exactly the
kind of deterministic, non-speculative trigger the existing module's philosophy requires (contrast
with the deliberately-excluded "Journal/Memory 'haven't thought about this' reminders," which lack
a deterministic trigger — a completed report generation is unambiguous and real).

---

## 32. Companion bridge

**Yes — reuse the existing read-only Discovery bridge pattern exactly**, per Module 16 §7's own
explicit design ("every report ends with a natural, specific invitation to discuss it with the
Companion... a 'discuss this with your Companion' action is always present"). Mirrors the existing
Tarot/Numerology/Natal Chart → Companion one-directional, read-only reference pattern (a real
report now exists → Companion can reference it in later conversation, never the reverse). Companion
must never be able to mutate report facts or narrative — the bridge is read-only, identical in
force to every existing Discovery bridge.

---

## 33. Security

| Threat | Mitigation |
|---|---|
| IDOR / cross-user report fetch | Owner-scoped queries on every route (§26), matching the existing `findOwned()` convention |
| Mass assignment on generation request | Strict DTO allowlist (existing `ValidationPipe` `whitelist: true, forbidNonWhitelisted: true` pattern, reused verbatim) |
| Prompt injection via Memory content | Existing `PIIDetector`/`PromptInjectionDetector`/`SafetyService` pipeline (Companion's, reused — §37) runs over retrieved Memory content before it enters the Reports prompt, identical to how Companion already screens Memory content |
| Prompt injection via Tarot question/context | Same existing safety pipeline, applied to any user-authored text pulled into evidence |
| Stored AI output (XSS via Markdown/HTML rendering) | Structured JSON output (§19) sanitized/escaped at render time — the existing frontend rendering discipline (no `dangerouslySetInnerHTML` on raw AI text anywhere in the current Discovery-interpretation components) extends directly |
| Generation abuse (spam-generate) | Existing `GenerationLockService` + `CostControlService` (§16), plus the idempotency-by-period design (§15) which makes repeated generation for the same period a no-op rather than a new AI call |
| Report enumeration | Sequential/guessable IDs must not be used for report fetch (existing convention already uses UUIDs/cuids across the schema) |
| Source-snapshot leakage | The snapshot (§11) contains the same class of personal data as the source systems already do — no new exposure surface beyond what Numerology/Natal Chart/Memory already persist, but the report's *aggregation* of multiple systems in one place is itself a higher-value target, reinforcing why owner-scoping (§26) and existing auth guards are non-negotiable, not optional hardening |

---

## 34. Privacy

| Surface | What Reports sends there |
|---|---|
| Persisted (`DestinyReport`) | Source snapshot + generated narrative — the aggregation itself is the most sensitive artifact this module creates, by design (it's meant to be a rich picture of the person) |
| Sent to AI provider | The structured evidence payload (§18) — same class of content Companion/Discovery interpretation already send, just aggregated across more sources per call |
| `ProviderLog` | Existing allowlist-scrubbed logging pattern (Sprint 12's PII-scrubbing discipline), reused verbatim — no raw report content, matching how Companion/Discovery generations are already logged |
| `AIUsage` | Token counts/cost only, no content — existing pattern |
| Analytics | `feature`/`route` only (§30) — never narrative or fact content |
| Sentry | Existing allowlist-based scrubbing (Sprint 12) must continue to exclude report content from error payloads, identical to the existing discipline for Companion/Memory/Journal error paths |

No new privacy category is introduced — Reports aggregates existing categories (Discovery results,
Memory, Journal) under existing consent/scrubbing rules, and must not create a new, weaker path for
any of that content to reach a system not already vetted for it.

---

## 35. Content safety

**Reuse `SafetyService` and its existing category taxonomy** (`companion/safety/safety.types.ts`:
`none | crisis | prompt_injection | unsafe_content | too_long | fabricated_sensitive_data`) —
**no separate safety architecture.** Specific attention points, mapped to existing categories:
- Medical/financial/relationship certainty → `unsafe_content`-equivalent constraint, enforced at
  the prompt-instruction level (§18), consistent with the existing Companion/Discovery boundary.
- Fatalism/deterministic fate claims → prompt-level instruction (§18), matching Module 16 §16's
  "reflective, never predictive" rule and every Discovery system's existing anti-prediction stance.
- Self-harm/crisis content surfaced through synthesized Memory/Journal content → the existing
  `crisis-detector.ts` must run over source evidence before synthesis, with the same escalation
  behavior already defined for Companion (Module 16 §16 itself defers to this: "the standard
  crisis-escalation behavior takes precedence over normal report generation").
- Prompt injection → existing `prompt-injection-detector.ts`, reused (§33).

---

## 36. UX flow

```
Discover/Reports entry
  → eligibility check (evidence thresholds, §21)
  → source-readiness display (which systems are contributing, which are missing/optional)
  → preview (free-tier partial view, §13)
  → generate (Premium gate appears here if not entitled — the correct point per Module 16 §1's
    "clearest, most legitimate context for the Premium paywall moment")
  → processing (honest, labeled loading state, Module 16 §13 — "connecting a few things you've
    shared…", never a generic spinner)
  → report reveal (progressive sectioned reveal, Module 16 §13/§20)
  → sections (read as prose, Deep Dive tap-through per section, §5)
  → Companion (closing invitation + bridge, §32)
  → history (§23)
```

---

## 37. Empty states

| State | Behavior |
|---|---|
| No Numerology yet | Route to `/discover/numerology`, honest framing ("Numerology or Natal Chart will help build your first report") |
| No Natal Chart yet | Route to `/discover/natal-chart`, same framing |
| No Tarot history | Not blocking (§21) — no empty-state prompt needed unless the UI wants to mention it's optional |
| No Memory consent | Route to Settings' existing Memory consent control, honest framing, not blocking (§21) |
| No report yet (evidence insufficient) | Module 16 §14's own exact language pattern: a calm note, no false countdown/promise — "your first Report will appear once we've gotten to know you a bit" |

---

## 38. Mobile

Single-column, ~720px reading-column layout (Module 16 §20, reusing whatever component already
implements this pattern elsewhere in the product — no bespoke Reports-only layout system).
- **TOC behavior:** a lightweight section jump-list at the top on mobile, collapsible, not a
  persistent sidebar (no room for one at mobile widths).
- **Section navigation:** in-page anchor scroll, matching standard long-form reading patterns
  already used for any existing long-form content in the product.
- **Sticky elements:** at most a slim "Ask Companion about this" affordance pinned near the bottom,
  not a sticky header competing with reading focus (Module 4's Calm First principle).
- **Print/download:** browser print only for V1 (§24) — no custom mobile download flow to design.

## 39. Accessibility

- Semantic heading hierarchy per section (matches the structured-JSON output design, §19 — each
  section has a real `<h2>`/`<h3>`, not a styled `<div>`).
- TOC/section-jump list as a real, labeled navigation landmark.
- Full keyboard navigation through sections and the Deep Dive evidence trail (explicit Module 16
  §20 requirement — "Deep Dive evidence trail fully navigable as structured, labeled content, not
  just inline citations").
- Loading-state and error-state announcements via existing `aria-live` patterns already used
  elsewhere in the app (Companion's streaming-status announcement is the closest existing
  precedent).
- AI-disclosure and fact-vs-interpretation labeling (§5) must be programmatically associated with
  the content it describes (not just a visual color/icon distinction), so screen-reader users get
  the same "this is calculated, this is narrated" signal sighted users get.

---

## 40. Future Tử Vi extension point (design only — no fake data)

`sourceSnapshot`'s shape should be additive/keyed by source type (e.g., `{ numerology: {...},
natalChart: {...}, tuVi: null }`) so a future `TU_VI` source type can be added without a breaking
schema change — but **no `tuVi` key is populated, faked, or even present with placeholder content
in Sprint 16.** `TU_VI_REPORT_INTEGRATION = DEFERRED`, consistent with the Sprint 15 verdict and the
Vietnamese Tử Vi product definition §13's own instruction that Reports integration comes "later,"
additively, once the engine passes its Sprint 19 gate. Report V1 does not block waiting for this.

## 41. Future Eastern Horoscope extension point (design only — no fake data)

Same pattern — an additive source-type slot, unpopulated, no placeholder content, no blocking
dependency. Sprint 17 has not shipped; this document creates no assumption about its eventual data
shape beyond "another keyed entry in the same snapshot structure."

---

## 42. Test strategy (design only — future work, not written this sprint)

- **Unit:** evidence-threshold gating logic, snapshot-construction logic, idempotency-key
  derivation, the grounding-verification pass (every narrative claim must cite real evidence —
  mirrors Module 16 §21's explicit "should be an automated, release-blocking check").
- **e2e (backend):** generation lifecycle (`REQUESTED→GENERATING→READY/FAILED`), ownership
  enforcement, budget/lock integration, account export inclusion, account deletion cascade.
- **Playwright:** full generate→reveal→Deep Dive→Companion-bridge flow; empty-state routing;
  Premium-gate appearance at the preview boundary.
- **Security:** cross-user report-ID fetch (expect 404), duplicate-generation-click (expect
  single report, no duplicate `AIUsage` row), malformed/schema-invalid AI response (expect
  `FAILED`, not a corrupted `READY` report).
- **AI-boundary:** an automated test asserting the grounding-verification step actually rejects a
  synthetic narrative containing an unsupported claim — this is the single highest-value test in
  the whole suite given Module 16's own framing of this as the module's core risk.
- **Cost-control:** confirm Reports generation correctly contributes to the existing global
  `AIUsage` budget (not a separate ceiling) and is correctly blocked once exceeded.
- **Account deletion/export:** confirm Reports rows are included in export and removed on deletion
  (§28/§29).

Attack cases explicitly required by the sprint brief: cross-user report ID, duplicate generation,
malformed AI output, prompt injection in Memory content, AI provider failure, budget exhausted —
all covered above.

---

## PRODUCT DECISIONS LOCKED

**Status:** All five decisions this document previously left open (§55 of
`docs/audit/sprint-16-pre-implementation-audit.md`) are now founder-resolved. Nothing above this
line has been edited — this section is an appendix that resolves the open questions and, in three
places, explicitly **overrides** a recommendation made above. Each override is called out by name
so a future reader isn't misled by the earlier, superseded recommendation. Sprint 16 implementation
may proceed against this section; where this section is silent, the analysis above it still stands.

### 1. Report V1 purpose — LOCKED

The V1 artifact is **the Personal Destiny Report**, one specific, named product — not a generic
"Insight Report," not a Reflection/Insight/Review/Goal surface, not a Tử Vi report, not an Eastern
Horoscope report. Purpose: synthesize the stable, currently-available personal-discovery systems
(Natal Chart, Numerology) into one Premium long-form report, with strict fact-vs-interpretation
boundaries preserved throughout. Confirms and sharpens §2 above.

### 2. Source requirements — LOCKED (overrides §21/§28's recommendation)

**Required (both, not "at least one"):** completed Natal Chart **and** completed Numerology
reading/profile. **This overrides §21/§28 above**, which recommended "at least one of the two" to
keep the eligibility bar lower — the founder has chosen the stricter bar instead, prioritizing a
report that always has both birth-derived systems as its core over a lower generation threshold.
**Optional enrichment:** Tarot history, Memory (existing consent/retrieval rules only).
**Excluded from V1:** Journal, Reflection, Insight, Review, Goal, Eastern Horoscope, Vietnamese Tử
Vi.
```
TU_VI_REPORT_INTEGRATION = DEFERRED
EASTERN_HOROSCOPE_REPORT_INTEGRATION = DEFERRED
```

### 3. Frozen-module policy — LOCKED

Reflection/Insight/Review/Goal must not become implicit Reports dependencies. No reactivation, no
data requirement. Code and data remain intact and untouched, exactly as Sprint 14 left them. This
resolves the open question in §1/§9 above in favor of the "exclude by default" option — confirmed,
not overridden.

### 4. Required-source threshold — LOCKED

A user may generate a Report only when **both** Natal Chart and Numerology are complete. If either
is missing: **no partial report is generated.** Instead, show a source-readiness state naming the
missing piece(s) with a CTA into the relevant Discovery flow. No fake/placeholder content ever
fills the gap. (This is the concrete generation-time rule implementing decision #2 above.)

### 5. Tarot's role — LOCKED (confirms §7)

Recent context, not core identity evidence — confirmed exactly as recommended. May inform Current
Themes / recent reflection / "questions currently occupying the user" sections; must never override
or redefine a stable Natal/Numerology fact. **New requirement not previously specified:** a bounded
history window/count (how many recent Tarot readings, over what time span, are eligible as
evidence) must be defined during implementation **from a measured decision, not an arbitrary large
dump** — no specific number is locked here; implementation must propose one grounded in actual
usage/content-length data, not guess one.

### 6. Memory's role — LOCKED (confirms and sharpens §8)

Optional personalization context only, under existing consent/retrieval rules, with a strict *small*
retrieval budget (smaller than merely "bounded" — implementation should treat this as a tighter cap
than Companion's own per-turn budget, not just a copy of it, given Reports aggregates across a
longer time horizon). Memory content may shape AI wording/personal relevance only — it must never
become or contribute to a calculated fact (§5's fact/AI boundary applies without exception here).

### 7. Journal — LOCKED (confirms §9, with explicit reasoning added)

Excluded from V1. Reasoning, now explicit: avoiding unnecessary privacy expansion and prompt-surface
growth in the first release — a deliberate scope-discipline choice, not an oversight. May be
reconsidered as a separate, future decision; this document creates no assumption either way about
that future outcome.

### 8. Generation mechanism — LOCKED (confirms §14's recommendation, adds a hard stop condition)

**Synchronous generation using existing AI infrastructure** — provider orchestrator, generation
lock, cost control, `AIUsage`/`ProviderLog`, safety layer, all reused verbatim. **No BullMQ or any
queue is introduced in Sprint 16.** This confirms §14's Option 1 recommendation as final, not merely
a default to revisit opportunistically.

**Hard review condition (new, not previously specified):** if real report-generation runtime, once
measured during implementation or release closure, exceeds acceptable request/runtime limits,
**implementation must stop and formally reclassify queue architecture as REQUIRED** — this is an
explicit escalation trigger, not a soft warning. **Silently increasing HTTP/request timeouts to
paper over slow generation is expressly prohibited.** No specific runtime threshold number is
invented here; it must come from actual measurement during implementation, not a guess.

### 9. Report immutability — LOCKED (confirms §11/§22)

Reports are immutable snapshots once `READY`. The source snapshot does not mutate in place. Newer
source data requires an explicit regenerate/new-version action — never a silent historical update.

### 10. Versioning — LOCKED (confirms §12)

`REPORT_SCHEMA_VERSION`, `REPORT_TEMPLATE_VERSION`, `AI_PROMPT_VERSION`, plus source-version
metadata for Natal Chart and Numerology specifically (their existing `calculationVersion`-equivalent
fields, captured via the snapshot). **Explicit prohibition, newly stated:** do not add or fake
`TUVI_ENGINE_VERSION`/Eastern-Horoscope-equivalent version fields before those systems actually
exist — an empty/absent field, never a placeholder value.

### 11. Fact vs. AI boundary — LOCKED (confirms §5, sharpened)

Unchanged in substance; the founder decision restates it with two explicit additions to the "AI may
NOT" list beyond what §5 already said: AI may not claim systems mathematically/metaphysically prove
each other (already implicit in §6's "explicitly forbidden framing," now stated directly as a
fact-boundary rule too), and AI may not fabricate Tử Vi/Eastern Horoscope facts under any
circumstance (directly enforces decision #2's exclusion).

### 12. Report structure — LOCKED (**overrides §10's recommendation**)

**This is the most significant override in this section.** §10 above recommended following Module
16's report-*type* vocabulary (Monthly Reflection + Growth Report + Memory Highlights) instead of a
single fixed-section document, specifically because a fixed-section structure resembled the
"statistics-led"/template anti-pattern Module 16 §23 names as rejected. **The founder has
explicitly chosen the fixed-section structure anyway**, for a coherent, stated reason: Module 16's
report-type model depends on a Memory-native Insight/Theme-escalation engine that (§5 of the audit
confirms) does not exist in this codebase, so it isn't actually available to build against —
whereas Roadmap V2 names this sprint's deliverable "Personal Destiny Report," a single named
artifact, not a report-type menu. Given that, a fixed-section synthesis document is judged the more
honest, achievable shape for what's actually buildable, not a silent regression into the rejected
pattern — the anti-pattern Module 16 warns against is *statistics-led, evidence-free* sections; this
structure's sections are still populated by real calculated facts and AI narrative synthesis, not
activity counts.

**Locked V1 structure:**
1. Overview
2. Core identity — Natal Chart + Numerology synthesis
3. Strengths
4. Growth tendencies
5. Relationships
6. Career / direction
7. Current themes — optional Tarot (per decision #5's bounded-window rule)
8. Personalized reflection — optional Memory (per decision #6's strict-budget rule)
9. Source highlights
10. Calculated Facts appendix
11. Methodology + AI disclosure

**Note for whoever runs Sprint 16 Release Closure (not resolved here, flagged for visibility only):**
Roadmap V2's Sprint 16 DoD language ("at least 3 of the Bible's [16] report types shipped with
automated grounding tests") was written assuming Module 16's report-type model. This locked
structure is one report type (Personal Destiny Report) with 11 internal sections, not 3 separate
report types. This document does not resolve whether that DoD language should be read as satisfied
by "1 report with 3+ substantive synthesis sections" or requires amendment — that is a Roadmap V2
interpretation question for Release Closure to raise explicitly with the founder, not a
determination this decision-closure pass makes unilaterally.

### 13. AI output format — LOCKED (confirms §19, with the concrete shape now specified)

Validated structured output, not free-form Markdown as the primary contract — confirmed. Conceptual
schema (final field-level schema to be finalized during implementation, per the founder's own
framing):
```
{
  overview: string,
  coreIdentity: { narrative: string, evidenceRefs: [...] },
  strengths: [{ title: string, narrative: string, evidenceRefs: [...] }],
  growthAreas: [{ title: string, narrative: string, evidenceRefs: [...] }],
  relationships: { narrative: string, evidenceRefs: [...] },
  careerDirection: { narrative: string, evidenceRefs: [...] },
  currentThemes?: { narrative: string, evidenceRefs: [...] },       // present only if Tarot used
  personalizedReflection?: { narrative: string, evidenceRefs: [...] }, // present only if Memory used
  sourceHighlights: [{ source: string, fact: string }],
  calculatedFacts: { natalChart: {...}, numerology: {...} },        // the snapshot, §11 above
  methodology: string                                                // AI-disclosure text
}
```
This maps directly onto decision #12's locked section list — each narrative field must still carry
`evidenceRefs` per §5's grounding-verification requirement; the optional (`?`) fields correctly
reflect that Tarot/Memory are enrichment-only (decisions #5/#6), never required for generation.

### 14. Failure policy — LOCKED (confirms §20)

Natal missing → no generation. Numerology missing → no generation. Tarot missing → generate without
it. Memory absent/no consent → generate without it. AI provider fails → `FAILED`, no fabricated
content. Malformed AI output → fail validation, retry only per the existing bounded-retry policy
already used elsewhere (no Reports-specific retry invention). Budget exceeded → block honestly. **No
Mock fallback in production** — restates the existing platform-wide `env.validation.ts` invariant,
not a new rule.

### 15. Premium boundary — LOCKED (confirms §13, sharpened)

Personal Destiny Report generation, full-report viewing, history, and explicit regeneration are all
Premium. No price/tier change. Free users see: the report's explanation/value proposition, a
source-readiness checklist, and a preview/locked outline where appropriate — never a fully obscured
teaser (Module 4's anti-scarcity rule, restated). **Explicit, non-negotiable:** the underlying
Natal Chart and Numerology source results themselves remain free, exactly as already shipped —
Reports must never retroactively paywall content that's already free elsewhere in the product.

### 16. History — LOCKED (confirms §23)

Persisted, owner-scoped history. Regeneration creates a new version; the previous `READY` report is
never overwritten. (Free/Premium history-depth split from §13/§23 above stands — this section
confirms persistence/non-overwrite specifically, which the founder's decision emphasized.)

### 17. Download policy — LOCKED (confirms §24)

HTML/web report only for V1. No new PDF-generation stack. Browser print remains naturally available
(no code required to support it, no code required to block it). Dedicated branded PDF export
remains deferred, per §24's own comparison table.

### 18. Sharing policy — LOCKED (confirms §25)

Owner-only. No public report link in Sprint 16. Shareability remains later Roadmap work (Sprint 23).

### 19. Notification policy — LOCKED (refines §31/§38 of the main audit)

**Because generation is synchronous (decision #8), no report-ready notification is required for
V1** — the user is already looking at the completed report when generation finishes, so there is no
async gap for a notification to fill. This refines the audit's earlier recommendation to add a
`'report.ready'` notification type — that type is **not needed now**. **Conditional, forward-looking
rule:** if a future architecture-review escalation (decision #8's stop condition) ever forces
asynchronous generation, reuse the existing Sprint 11 Notifications infrastructure for a completion
notification at that time — do not build notification plumbing preemptively for a scenario that
hasn't happened.

### 20. Companion bridge — LOCKED (confirms §32)

Read-only "Ask Companion about this report" bridge, using the report's own structured sections
(decision #13's schema) as context. Companion must not mutate report facts. No arbitrary hidden
user data is sent beyond what the report itself already contains.

### 21. Analytics — LOCKED (confirms 4 of 5 events from §30; **overrides §30's omission of the
5th**)

Approved minimal event set: `report_viewed`, `report_generation_started`,
`report_generation_completed`, `report_generation_failed`, **and `report_upgrade_clicked`.** The
audit (§30 of this document, §37 of the main audit) had recommended *against* adding
`report_upgrade_clicked` by default, reasoning that existing `premium_viewed`/`checkout_started`
events already cover the upgrade funnel without a Reports-specific attribution dimension. **The
founder has explicitly included it anyway** — recorded here as a deliberate override, not an
oversight: Reports is expected to be a distinctive enough upgrade trigger (Module 16 §1's "clearest,
most legitimate context for the Premium paywall moment") that isolating its click-through rate is
judged worth the small, explicit contract extension. Implementation must add this as a genuinely new
`ClientAnalyticsEventName` value, following the exact existing naming/typing convention — not a
generic/reused event repurposed for this. No report body/content in any event, unchanged.

### 22. Account data rights — LOCKED (confirms §35/§36)

Reports are user-owned persisted data: included in account export (extends
`AccountExportPayload` additively, per the existing `discoveries` precedent), deleted on account
deletion, no financial-style retention exception (the payment-retention policy is a separate,
legally-grounded exception elsewhere and does not extend to Reports by default — confirmed, not
reopened). `ProviderLog` remains governed by its own existing operational-data policy, unchanged by
this decision.

### 23. Security / Privacy / Safety — LOCKED (confirms §33/§34/§35 of this document; §40–42 of the
main audit)

All threat mitigations and privacy/safety rules stand as already specified — reuse of existing
IDOR-prevention, DTO allowlisting, `SafetyService`/`PromptInjectionDetector`, structured-output
rendering (no raw-HTML injection risk), existing lock/budget mechanisms, and existing
Sentry/`ProviderLog` scrubbing. **Explicit, newly stated boundary on what may reach the AI provider:
no raw Journal content, no frozen-module content, no full/unbounded Memory corpus, no unbounded
Tarot history** — every source must pass through its already-decided bound (decision #4's
required-both-sources rule, decision #5's Tarot window, decision #6's strict Memory budget) before
reaching the prompt. No new security or safety subsystem is introduced.

### 24. Tử Vi / Eastern Horoscope extension points — LOCKED (confirms §40/§41)

Additive-only. Once a verified Tử Vi engine exists (Sprint 15's gate, independently unaffected by
this decision — see "Sprint 15 preservation" below), the report's source-snapshot shape may gain a
`TU_VI` entry; same for a future `EASTERN_HOROSCOPE` entry once Sprint 17 ships. **Zero fabricated
data for either in Sprint 16.** No hard schema dependency on either future system is created now.

### 25. Sprint 16 implementation scope — LOCKED

Report persistence; required-source readiness (both Natal + Numerology); snapshotting (decision #9);
structured AI synthesis (decision #13); Premium gating (decision #15); synchronous generation
(decision #8); history (decision #16); explicit regeneration; AI cost-control reuse; account
export/delete (decision #22); analytics (decision #21); Companion bridge (decision #20); responsive
UI; tests/security/docs (§42 of this document, §49 of the main audit).

### 26. Explicit out of scope — LOCKED

Vietnamese Tử Vi, Eastern Horoscope, Journal as a source, frozen modules as a source, a PDF
generation engine, public report sharing, queue infrastructure, Community, broad Admin, a new AI
provider, payment changes, pricing changes.

### 27. Implementation stop conditions — LOCKED (new — did not exist in the original audit)

Implementation must **stop and trigger an explicit architecture review**, not silently work around,
if any of the following occur:

- **A.** Synchronous generation exceeds practical runtime limits (measured, not guessed — see
  decision #8).
- **B.** The source snapshot cannot be reproduced deterministically (violates decision #9's
  immutability guarantee at its foundation).
- **C.** AI output cannot be reliably validated against the locked schema (decision #13).
- **D.** The active AI provider's context/output limits are insufficient for the bounded source
  payload decisions #4–#6 already constrain it to (i.e., even the *deliberately bounded* input is
  too large for the provider — a signal the bound itself, not just the provider choice, needs
  reassessment).
- **E.** Meeting privacy constraints would require sending more data to the AI provider than
  decisions #4–#7/#23 approve.

None of these may be resolved by a silent workaround (e.g., quietly raising a timeout, quietly
loosening the Memory/Tarot bound, quietly sending more context than approved) — each requires
surfacing back to product/architecture review before implementation proceeds past that point.
