# Full Product Completion & Roadmap Rebase Audit

**Date:** 2026-08-17
**Type:** Research / planning only. No application code, Prisma schema, migrations, or dependencies were modified. No commits were made.
**Trigger:** Post-Sprint-12 release closure. Goal: determine what remains before this can be considered a complete, coherent, production-ready product — not merely "what sprint comes next."

---

## 1. Git Baseline

```
HEAD            = eb0c313 (feat: complete Sprint 12 trust monetization closeout)
origin/master   = eb0c313
origin/HEAD     = eb0c313
ahead/behind    = 0 / 0
working tree    = clean (git status --short: no output)
diff --stat     = empty
diff --check    = clean
merge/rebase/cherry-pick state = none in progress
```

Sprint 11 (`9d66d3c`) and Sprint 12 (`eb0c313`) are both pushed and match `origin/master` exactly. No divergence, no unresolved repository state. **Audit proceeds on a clean, confirmed baseline.**

---

## 2. Authority Order Used

1. Actual repository (code, routes, controllers, Prisma schema/migrations) — highest authority on *what exists*.
2. Product Bible (`docs/reference/web-tu-vi/web-tu-vi/01–25`) — highest authority on *what was promised/scoped*.
3. `docs/architecture/*.md`, `docs/security/*.md` — design intent for shipped modules.
4. Sprint 10/11/12 pre-implementation audits and release-closure/final reports — most recent, most-reconciled prior analysis.
5. Older roadmap docs (`web-tu-vi-current-state.md`, `web-tu-vi-remediation-roadmap.md`, dated 2026-08-07, pre-Sprint-6) — historical context only, superseded by everything above.

Where these conflict, the mismatch is called out explicitly rather than silently resolved in either direction (see §9–11).

---

## 3. Product Bible Inventory (25 modules)

The Bible is organized as three Systems: **Discovery** (Tarot, Natal Chart, Eastern Horoscope, Numerology — mutually optional, each creates memory), **Relationship** (Companion, Memory, Journal, Reports — use/deepen memory), **Growth & Operations** (Landing, Auth, Dashboard, Premium, Community, Notifications, Settings, Admin).

**Core Product Loop:** `Discovery → Activation → Conversation → Memory → Journal → Insight → Trust → Premium → Retention → Referral → back to Discovery`

**Non-negotiable governing rules (Module 25, Constitution):**
- Decision hierarchy: **Trust > Memory > User Value > Retention > Revenue > Engagement**.
- Never becomes: a social network, a productivity tool, an addictive platform, an advertising platform, part of the attention economy, or a manipulative AI.
- A person owns their memory, absolutely, forever.
- Success = relationship depth over time, explicitly **not** DAU/session-length/streak metrics.
- What's free to change: tech stack, model provider, servers, visual design, **which features exist this year** — i.e. the Constitution itself pre-authorizes adding/removing modules like a future Tử Vi feature, provided the Mission/Values/Invariants aren't touched.

**Deterministic-first discipline (consistent across Modules 12, 13, 14, 15, 23):** every Discovery system's underlying computation (card meanings, chart placements, calendar/element mapping, number reductions) is fixed, curated, versioned, **never AI-generated**. Only the *personalized interpretation* layered on top is AI-generated, via one shared Companion AI service — never a module-specific AI. Reports (Module 16) is the sole exception: pure AI narrative synthesis, gated by an automated evidence-grounding-verification step.

**Tier map:**

| Tier | Modules |
|---|---|
| MVP | Tarot (daily + 3-card), Companion (session memory), Journal, Dashboard, Auth |
| V1 | Cross-session Memory, Natal Chart, Numerology, Premium, memory-triggered Notifications |
| V1.5 | Eastern Horoscope, Reports, Community |
| Future | Voice mode, multi-person compatibility, practitioner marketplace |
| Moonshot | Predictive life-pattern modeling |

**Premium mechanic (Modules 1, 2, 8, 17, 20, 21, 22 — repeated consistently):** Premium gates **Memory retrieval-window depth** primarily, never core Discovery content, Companion personality, or safety. Artificial scarcity, countdown timers, and usage-cap upsells are explicitly rejected. *(Note: the actual Sprint 7 implementation additionally gates Discovery daily-draw ceilings and interpretation depth/history — a reasonable, Bible-compatible extension, but broader than the Bible's literal "only Memory window" framing — see §17.)*

**Critical scope finding — Module 14, Eastern Horoscope (verbatim):**
> "it's transparent that this specific system is Chinese-zodiac/Five-Elements based, and doesn't present itself as a universal 'Eastern astrology' catch-all"
> "Chinese calendar engine: a precise lunisolar calendar calculation library, correctly converting a Gregorian birth date to the corresponding Chinese calendar year/animal sign/element"

A full-text search across **all 27 files** (25 modules, including duplicate-content variants of Modules 01 and 04) for "Tử Vi," "Lá số," "Đẩu Số," "Bát Tự," "12 cung," "chính tinh," "menh-vi," "Mệnh Vi" returns **zero genuine matches**. The Bible never names Vietnamese Tử Vi Đẩu Số — not to include it, not to exclude it by name. It scopes "Eastern Horoscope" narrowly and exclusively as Chinese zodiac + Five Elements, and "Natal Chart" (Module 13) exclusively as Western tropical astrology (ephemeris, houses, aspects). See §9–11 for the resulting product-promise analysis.

**Documented internal conflict found (not Tử Vi-related):** CLAUDE.md states *"the companion is rule-based, not an LLM, for Sprint 1."* The Bible (Module 9 §18, Module 10 §18, Module 7 §16) explicitly specifies an LLM-based Companion (OpenAI/embeddings, dynamic non-scripted generation). The actual repository confirms the Bible's version has been true since Sprint 2B (`companion` module uses real OpenAI/Anthropic/Gemini/Mock providers). **CLAUDE.md is stale**, describing a deleted Sprint-1-only implementation. Flagged as a P1 documentation-accuracy fix, not a product gap.

---

## 4. Actual Implemented Modules — Classification

| Module | Status | Basis |
|---|---|---|
| Auth | **COMPLETE** | Email+password, Google/Apple OAuth, JWT+rotated refresh, sessions mgmt, e2e-tested |
| Onboarding | **COMPLETE** | Conversational flow, real Companion service, e2e-tested |
| Landing | **COMPLETE** (marketing-tier) | Static, matches Bible's Module 5 structure |
| Dashboard | **COMPLETE** | Single aggregation endpoint, real data |
| Discover (hub) | **COMPLETE** except Eastern Horoscope | Tarot/Numerology/Natal Chart live; Eastern Horoscope explicitly `available:false` |
| Companion | **COMPLETE** (LLM-based, per Bible — see CLAUDE.md staleness note above) | Real conversation, streaming, memory-context-assembled |
| Memory | **COMPLETE**, actively integrated | Full lifecycle, wired into every Companion turn |
| Journal | **COMPLETE**, lightly integrated | Full CRUD/autosave/lifecycle, in main nav |
| Tarot | **COMPLETE** | 78-card deck, 3 spreads, deterministic seeded draw, tested, premium-gated, cost-controlled |
| Numerology | **COMPLETE** | 6 of 7 Bible numbers (Personal Month deferred), tested, premium-gated |
| Natal Chart | **COMPLETE** (Western tropical) | 10 planets, Placidus houses, 5 aspects, golden-vector tested, premium-gated |
| Eastern Horoscope | **NOT STARTED** | No backend module; `/discover` marks it "coming soon" honestly |
| Notifications | **PARTIAL** (narrow, real) | 2 real triggers only (Daily Tarot available, Premium activated); no Journal/Memory re-engagement triggers |
| Premium | **COMPLETE** (code); **BLOCKED** (production) | Entitlement chokepoint real; PayOS never exchanged a live request |
| Payment | **COMPLETE** (code); **BLOCKED** (production) | Contract-verified against PayOS docs; kill-switch bug found+fixed in Sprint 12 closure |
| Account export | **COMPLETE** | Shipped Sprint 10 |
| Account deletion | **COMPLETE** | Shipped Sprint 10 |
| Privacy (policy page) | **PLACEHOLDER** | Self-labeled "plain-language summary for Sprint 1," not a real legal document |
| Settings | **COMPLETE** | Full preference surface |
| SEO | **PARTIAL** | robots.ts/sitemap.ts exist; almost no public-indexable content beyond thin marketing pages |
| Reports | **NOT STARTED** | V1.5, no code exists |
| Community | **NOT STARTED** | V1.5, no code exists |
| Eastern Horoscope | *(see above)* | |
| Admin | **NOT STARTED** | No Bible module even defines it; no code |
| Observability | **COMPLETE** (code); **UNVERIFIED** (runtime) | Sentry wired both sides; no `SENTRY_DSN` ever configured in any checked environment |
| Email | **COMPLETE** (code); **BLOCKED** (production) | No real provider credential (Resend/Postmark) exists anywhere |
| Deployment/ops | **NOT STARTED** | No Dockerfile/vercel.json/railway.json anywhere in repo |
| Reflection | **FROZEN** | Complete for its Sprint 4B scope, untouched since |
| Insight | **FROZEN** | Complete for its Sprint 5B scope, untouched since |
| Review | **FROZEN** | Complete for its Sprint 5B scope, untouched since |
| Goal | **FROZEN** | Complete for its Sprint 5C scope, untouched since |
| `/menh-vi/*` | **EXPERIMENTAL** | Disclosed, dormant, public/unauthenticated design prototype — see §5, §9–11 |
| Analytics | **NOT STARTED** | Zero product-analytics tooling anywhere (no PostHog/Amplitude/GA/Segment) |

---

## 5. Route Inventory Highlights

43 `page.tsx` files across 5 route trees. `NAV_ITEMS` (the persistent nav) deliberately contains only 5 entries — Dashboard, Companion, Journal, Discover, Settings — matching the Bible's Module 3 IA exactly, by an explicit code comment.

**Orphan-from-nav but reachable-in-content:** `/goals`, `/memory`, `/reflections`, `/insights`, `/reviews`, `/premium`, `/journal/new|archive|:id`, `/discover/tarot|numerology|natal-chart` — all reachable via Settings or in-page links, none via the top-level nav bar. `/insights/internal` appears reachable from nowhere found — likely dev/QA-only, should be confirmed and either removed or gated.

**`/menh-vi/*` (14 routes)** sits entirely outside `middleware.ts`'s auth matcher — **publicly reachable without login**, with its own layout/nav/design tokens, explicitly self-documented in its own `layout.tsx` comment as *"isolated design exploration, not part of the BeaconVie shell/nav."* 13 of 14 sub-routes are `MvComingSoon` placeholders; `/menh-vi/tarot` is the one interactive one, but runs on local mock data disconnected from the real, working Tarot backend. `/menh-vi/la-so` ("Tử Vi Lá Số") is a 12-line stub: an icon, a title string, and one sentence of "coming soon" copy — no chart data, no palace grid, no calculation.

---

## 6. Backend Inventory Highlights

25 module directories, 29 controllers, 21 e2e-spec files (no controller-level unit specs — testing strategy is e2e-first). Prisma schema: **58 models**, most recent migration `20260816134552_sprint12_ai_feature_attribution` (one day before this audit — actively current). No `eastern-horoscope`, `tu-vi`, or `zodiac` module exists anywhere in `apps/api/src`. The only astrology-calculation backend is `natal-chart/`, built on `circular-natal-horoscope-js` (Western tropical, Placidus houses) — its own constants file explicitly comments that it is *"distinct from the unrelated future 'Eastern Horoscope' module,"* i.e. the codebase's own authors already treat these as separate, both-unbuilt-for-Tử-Vi concepts.

---

## 7. Core User Journey Verdict

Landing → Register → Onboarding (real Companion conversation) → Dashboard (single-recommendation decision engine) → Discover → Tarot/Numerology/Natal Chart (real, deterministic-first, AI-narrated) → save/history → Companion cross-reference → Notification (narrow) → Premium → PayOS (blocked externally) → Companion (ongoing).

**Verdict: the journey is coherent and Bible-compliant.** First-value moment is clear (Onboarding's first Companion message references something the user just said). Choice is deliberately narrow (Dashboard shows exactly one recommendation, not a menu; Nav has 5 items, not 16). Premium's value proposition is present but not yet reinforced by a payment surface a real user can actually complete (blocked externally). AI is consistently, architecturally distinguished from deterministic calculation across every touchpoint audited. The one structural discontinuity: `/menh-vi` is a second, parallel, publicly-reachable "front door" using a different brand identity, unlinked from this journey — not a broken journey, but a latent confusion risk if discovered pre-launch (see §36).

---

## 8. Discovery System Completeness

| System | Input | Engine | Interpretation | History | Companion bridge | Premium | Rate limit/cost | Tests/golden |
|---|---|---|---|---|---|---|---|---|
| Tarot | topic/spread choice | Deterministic seeded draw (Fisher–Yates+mulberry32) | AI, fixed card-meaning DB | Full lifecycle, append-only history | Read-only | Ceilings + history depth + token depth | Yes (Sprint 12) | 11+ unit tests, e2e, Playwright |
| Numerology | name+birthdate | Pythagorean, deterministic | AI, fixed meaning DB | Full lifecycle | Read-only | Same pattern | Yes (Sprint 12) | 6 spec files |
| Natal Chart | birth date/time/location | `circular-natal-horoscope-js`, deterministic | AI, fixed placement DB | Full lifecycle | Read-only | Same pattern | Yes (Sprint 12) | Golden vectors (Cases A–D), e2e, Playwright |

**No P0/P1 gap remains in any of the three built Discovery systems.** All three independently reached "code complete AND production-hardened" status as of Sprint 12 (cost-control parity was literally Sprint 12's headline deliverable). The one system defined by the Bible but not yet built is Eastern Horoscope (see §4) — a P2, not a P0/P1, since it is explicitly V1.5-tier and the audit trail already evaluated a viable library (`lunar-typescript`).

---

## 9. The Critical Domain Question: What Does "Tử Vi" Mean For This Product?

**Does the current product implicitly or explicitly promise a real Vietnamese Tử Vi / Lá Số experience? Mixed — no live promise in the shipped product; a real, unresolved promise-shaped signal at the meta level.**

Two separate things are true simultaneously:

1. **The live, real, nav-linked product (`(app)/*`, branded BeaconVie) makes no Tử Vi promise anywhere.** `/discover` labels Eastern Horoscope "coming soon" using Bible-compliant Chinese-zodiac framing; there is no "Tử Vi" string anywhere in the authenticated app shell, its nav, or its copy. A user who signs up and uses the real product today would never encounter a Tử Vi promise to be disappointed by.

2. **A second, public, unauthenticated surface (`/menh-vi/*`) exists in the same production repository, uses a different brand name ("Mệnh Vi"), and its one flagship placeholder route is literally titled "Tử Vi Lá Số"** with copy promising "your 12-palace chart... your own destiny picture will appear here soon." This route is reachable by anyone who guesses or is given the URL, requires no login, and is not disclosed to real users anywhere in the live product. Combined with the repository's own working name (`web-tu-vi`) and this very audit's origin as a "web tử vi" project, there is a clear, real signal that Tử Vi was — at some point, informally — part of the founder's intended product identity, but that intent was **never carried into the ratified Product Bible**, which instead standardized on a different, English-medium brand (BeaconVie) and a different, narrower Eastern astrology scope (Chinese zodiac only).

This is exactly the failure mode this audit exists to catch: **a capability implied by the product's own name and a shipped (if dormant) UI artifact, never formally specified, decided, or rejected.** Prior Sprint 10 and Sprint 11 pre-implementation audits already identified this precise gap independently and reached the same conclusion — this finding is corroborated, not novel, but it has never been escalated to a founder decision or closed out. It should be closed out now rather than carried forward through more sprints.

---

## 10. Vietnamese Tử Vi Gap Audit

Every concept below was searched exhaustively across `apps/web`, `apps/api`, and `packages`.

| Concept | Status |
|---|---|
| Solar → lunar conversion | **ABSENT** |
| Vietnam UTC+7 handling | **IMPLEMENTED** — but only for the Western natal-chart engine, not Tử Vi |
| Lunar leap month | **ABSENT** |
| Can Chi | **ABSENT** |
| Hour branch (giờ sinh) | **ABSENT** |
| Cung Mệnh | **ABSENT** |
| Cung Thân | **ABSENT** |
| 12 cung / 12 palaces | **PLACEHOLDER** (UI copy only — "your 12-palace chart is being prepared") |
| Ngũ Hành Cục (all 5 variants) | **ABSENT** |
| All 14 chính tinh | **ABSENT** (star names appear nowhere as data; "Tử Vi" appears only as a page title string) |
| Tả Phù / Hữu Bật / Văn Xương / Văn Khúc / Không-Kiếp | **ABSENT** |
| Tuần / Triệt | **ABSENT** |
| Tứ Hóa | **ABSENT** |
| Miếu/Vượng/Đắc/Hãm | **ABSENT** |
| Đại Hạn / Tiểu Hạn / Lưu Niên | **ABSENT** |

No lunar-calendar or Tử Vi npm package (`lunar-typescript`, `iztro`, etc.) exists in any `package.json` in the repo. **Real Vietnamese Tử Vi Đẩu Số implementation in this codebase: zero — not partial, not scaffolded.**

---

## 11. Recommended Tử Vi Product Definition

**Recommendation: Option D — support Eastern Horoscope (Chinese zodiac/Five Elements) and Vietnamese Tử Vi Đẩu Số as two clearly distinct, separately-branded, separately-scoped modules, both eventually real.**

Reasoning:
- **Not Option A** (leave as-is): the meta-level signal in §9 is real and has already surfaced independently in two prior audits without resolution. Leaving it unresolved a third time risks exactly the "discover it too late" scenario this audit was commissioned to prevent — and `/menh-vi` sitting live, public, and unauthenticated in production is itself a small but real and easily-fixed risk (see §14, §36).
- **Not Option C** (replace Eastern Horoscope's definition with Tử Vi): Eastern Horoscope's current Chinese-zodiac scope is cheap, already spec'd to implementation-ready detail (Module 14 has a concrete technical spec and an evaluated library candidate), and culturally distinct from Tử Vi — conflating the two would be the exact "cultural flattening" Module 14 itself warns against, and would throw away nearly-free, low-risk, already-correct work.
- **Option B and D converge in practice**; D is stated explicitly because it commits to Tử Vi eventually being real, not merely "added alongside" as an afterthought — appropriate given how central the name is to this project's own identity.

This is a **founder decision**, not an engineering one — it requires committing real scope (domain research, a dedicated spec sprint, possibly a paid domain-expert consultation) to a system the ratified Bible currently has zero chapter for. The Constitution (Module 25 §13) already pre-authorizes this kind of feature addition; it does not need to touch any Invariant. See §43 and the roadmap in §16 for the staged build sequence if greenlit.

---

## 12. Tử Vi Domain-Specification Requirements (if pursued)

Must be resolved, in writing, before any code, and flagged for domain-expert review where noted:

- Source tradition/school (North vs South Vietnamese practice differ in star-placement details) — **DOMAIN EXPERT REQUIRED**
- Solar/lunar conversion library and its correctness envelope
- Leap-month handling rule
- Day-boundary and giờ Tý (23:00–01:00) handling — a naive implementation risks off-by-one palace errors at the single most common ambiguity point in Vietnamese lá số practice — **DOMAIN EXPERT REQUIRED**
- Birth timezone policy (mirror the already-solved Natal Chart VN-override table)
- Mệnh/Thân placement rule
- Cục (destiny bureau) derivation rule
- Full 14-chính-tinh placement table — **DOMAIN EXPERT REQUIRED**
- Auxiliary-star placement rules
- Tuần/Triệt calculation
- Tứ Hóa mapping (varies by school) — **DOMAIN EXPERT REQUIRED**
- Miếu/Vượng/Đắc/Hãm brightness table
- Đại Hạn/Tiểu Hạn/Lưu Niên cycle rules

Do not guess any of these. Where two schools disagree, the spec sprint's output should name which school this product follows and why — not attempt to reconcile them silently.

---

## 13. Tử Vi Calculation Engine Architecture (if pursued)

Follow the identical proven pattern already used for Natal Chart, Tarot, and Numerology — deterministic-first, AI narration second, never AI-computed facts:

```
Birth data → time/calendar normalization → lunar date conversion
  → Can Chi → hour branch → Mệnh/Thân → Cục
  → 12 cung layout → 14 chính tinh placement → phụ tinh placement
  → Tuần/Triệt/Tứ Hóa → vận cycles
  → canonical deterministic chart (persisted, versioned)
  → UI (chart wheel / 12-palace grid)
  → Companion AI interpretation (reads fixed facts, never invents them)
```

Gemini/GPT/any LLM **must not** compute canonical values at any step above the AI-interpretation stage — this is the same non-negotiable rule already enforced for the three shipped Discovery systems (Module 23 §10) and should not be relaxed for Tử Vi despite its higher complexity.

---

## 14. Golden-Vector Strategy (if pursued)

Mandatory before any Tử Vi production release, mirroring Natal Chart's existing Case A–D discipline:
- A normal date (baseline correctness)
- A lunar leap-month date
- A solar/lunar year-boundary date (around Vietnamese Tết)
- A 23:00/00:00 hour-boundary date (giờ Tý edge case)
- At least one case per Cục (5 total)
- A case exercising Tử Vi's own placement boundary conditions
- A case with a dense multi-star palace (collision/ordering correctness)
- A case exercising Tuần/Triệt
- A case exercising Tứ Hóa
- A case exercising each of Đại Hạn/Tiểu Hạn/Lưu Niên

**Minimum ~12–15 vectors**, each independently sourced from a trusted external reference (a published lá số from a recognized calculator or text) — never derived from the implementation under test. This should be gated as a release blocker exactly as described in the audit brief §15, structurally identical to the existing Natal Chart golden-vector gate.

---

## 15. Tarot / Numerology / Natal Chart Future Depth

**Tarot** — MUST HAVE for Product Complete: none remaining (already complete). NICE TO HAVE: love/career-themed spreads, shareable results. POST-LAUNCH: more spreads, saved favorites.

**Numerology** — MUST HAVE: none remaining. DEFERRED, acceptable to remain deferred: Personal Month, Pinnacles/Challenges, compatibility, standalone reports (the latter folds naturally into the Reports module, §22).

**Natal Chart** — CORE COMPLETE as scoped (planets, houses, Ascendant, MC, 5 major aspects, wheel, interpretation, history). POST-LAUNCH EXPANSION: transits, synastry, progressions, solar return (all explicitly named as deferred in the module's own architecture doc — do not treat as launch gaps).

---

## 16. Companion, Memory, Journal — Cross-Feature Continuity

**Companion** is properly bridged (read-only, one-directional) to Tarot, Numerology, Natal Chart, Memory, and Goal (titles only); narrowly bridged to Reflection (one fixed hint sentence). No structural continuity gap found. The only real gap: Insight/Review content is never surfaced to Companion at all — acceptable given those modules' frozen status (§21), not worth building bridges into modules already slated for a keep/hide decision.

**Memory** is the most successful integration in the product — wired into every live Companion turn, real consent/lifecycle/scoring engine, hard-delete honored. Discoverable via Settings, Dashboard highlight, and Companion's "Remember this" flow, but not top-level nav — acceptable per Module 3's explicit IA (Memory is infrastructure the Companion surfaces, not a destination itself).

**Journal** is complete and in main nav, but Companion's involvement in it is deliberately minimal (Bible's own instruction — "closer to silence than in Companion chat itself"). This is by design, not a gap.

---

## 17. Frozen Module Decision

Reflection, Insight, Review, and Goal are **fully built, fully tested, functionally complete for their original scope, and confirmed frozen by git history** — no commit has touched any of the four since Sprints 4B–5C. They are not part of the Bible's 16-module tree at all (the Bible was ratified after these were built, and never absorbed them). They currently sit in genuine ambiguous limbo: reachable only via one Settings link, receiving none of the Sprint 7–12 hardening (Premium gating, cost control, Sentry-specific attention) the rest of the product got, and costing real ongoing maintenance surface (4 modules, dozens of files, a long-standing flaky Playwright signature on their specs since Sprint 8) for no forward product value.

**Recommendation: HIDE from user-facing Settings entirely; keep the code and data untouched.** Do not delete (real user data may exist in Goal/Reflection/Review tables; deletion is a data-loss risk with zero product upside). Do not reactivate or extend (no Bible module backs them, and re-absorbing them into the Bible's IA is a separate, larger product decision this audit doesn't need to force). This converts an indefinite ambiguous state into a definite, cheap, reversible one — see Sprint 14 in §46.

---

## 18. Reports Redefinition

The Bible's own words for Reports: *"the single strongest proof point of the whole business thesis."* It is explicitly the convergence point of every other system — Tarot, Numerology, Natal Chart, (eventually Eastern Horoscope/Tử Vi), Journal, and Companion conversation, all filtered through Memory/Insight and a mandatory automated evidence-grounding-verification step (the highest hallucination-risk module in the product, deliberately built with the most safeguards).

**Boundary: canonical facts (deterministic chart/reading/number outputs, already persisted) vs. AI synthesis (the narrative connecting them) — identical discipline to every other Discovery system, just applied across systems instead of within one.**

Reports should **not** move earlier in the roadmap ahead of Eastern Horoscope or the Tử Vi decision — the Bible's own sequencing rationale (*"so the first Reports don't feel templated for lack of density"*) still holds: more Discovery systems feeding it makes the first Reports meaningfully richer. It belongs after Eastern Horoscope ships, and can proceed in parallel with (not blocked by) any Tử Vi work.

---

## 19. Premium Value Audit

**Why would a real user pay, today?** More Discovery daily-draw headroom, deeper AI interpretation (700 vs 400 tokens), unlimited history vs a 20-item cap, and modestly deeper Memory context (≤1 reference vs 0) in interpretations. This is a real, coherent, non-manipulative value set, consistent with the Bible's anti-scarcity rules — but it is **thinner than the Bible's own stated ambition** (Module 17's "the only real difference is Memory window depth" framing implies something closer to persistent-memory depth being the flagship lever, which isn't yet the dominant, clearly-communicated Premium pitch on `/premium` today).

**Recommendation:** Reports (§18) is explicitly the Bible's own answer to "why pay" — until Reports ships, Premium's value proposition is real but modest. This is an argument for sequencing Reports relatively early in the post-Sprint-12 roadmap, not for inventing new paywalls.

---

## 20. Payment Production Readiness

Reconfirmed independently: **zero code-side blockers, 100% external/business blockers.**

1. No real PayOS merchant account/credentials in any environment ever checked.
2. `PREMIUM_PRICE_VND=79000` has no business sign-off (self-disclosed as `isMvpTestPrice: true` in the API response itself).
3. Production webhook URL never registered — blocked on a production domain existing.
4. Production domain/HTTPS never provisioned.
5. Refund policy/tooling and invoice/tax handling: not represented anywhere in the repo.
6. Payment-record retention period: unresolved founder/legal decision since Sprint 10.
7. Real email provider credential: does not exist in any checked environment.

A real, severe bug was found and fixed during Sprint 12 closure: `z.coerce.boolean()` silently broke the `PAYMENTS_ENABLED` kill switch for the product's entire history — now fixed and regression-tested. Engineering readiness for payment is genuinely done; production readiness is entirely gated on founder/business action (§45).

---

## 21. Retention

Current mechanics: Daily Tarot notification, Premium-activation notification, saved Discovery history, Journal, Companion continuity, Personal Year (Numerology). **A real, correctly-scoped V1 return loop exists** but is narrow — only 2 real notification triggers, no Journal/Memory re-engagement nudges (the team explicitly declined to fabricate a trigger without real underlying signal — a defensible, Bible-aligned choice, not an oversight).

**Missing retention mechanics worth adding, roughly in order of leverage:** Eastern Horoscope's annual cadence (a natural once-a-year re-engagement beat the Bible itself designed for), Reports (a natural "come back for the payoff" moment), and eventually Tử Vi's vận cycles (same shape). No urgent gap — the existing loop is honest and functional, just thin.

---

## 22. SEO / Public Acquisition

`robots.ts` and `sitemap.ts` exist, but the only genuinely public, indexable content is the thin marketing tier (`/`, `/about`, `/contact`, `/privacy`, `/terms`) — everything with real product substance (Tarot, Numerology, Natal Chart, Companion) sits behind auth. This is a real, structural acquisition gap: there is currently no public, SEO-durable content (Tarot card glossary, numerology explainer pages, a Chinese-zodiac/Five-Elements calculator) that could drive organic discovery.

**Recommendation:** SEO/public-content work should enter the roadmap **after** Eastern Horoscope ships (a public zodiac calculator is a natural, low-effort, high-search-volume public surface built directly on top of that engine) and after the `/menh-vi` disposition decision (§17, §36) is executed — building public SEO content while a confusingly-branded, unauthenticated duplicate surface sits live in the same domain is not a good sequencing choice.

---

## 23. Shareability

No sharing mechanism exists for any Discovery result today. Given the acquisition gap in §22 and the inherently shareable nature of Tarot pulls and horoscope-style content, privacy-safe shareable result cards (no PII, opt-in, matching the Bible's Community-adjacent privacy discipline) are a reasonable POST-LAUNCH candidate — not required for Product Complete, but worth flagging as a cheap, high-leverage acquisition lever once Eastern Horoscope/Tử Vi exist to make the shareable surface richer.

---

## 24. Community

No code exists. The Bible itself scores this correctly as V1.5/P3 and explicitly recommends it not receive a pre-launch nav slot. **Recommendation: DEFER, unconditionally, until there is a real, retained user base to seed it with** — building Community moderation/safety/reporting infrastructure ahead of having users to protect from each other is pure waste, and directly conflicts with the Constitution's "never a social network" boundary if rushed.

---

## 25. Admin / Operations

No dedicated Bible module exists for this at all. Minimal, evidence-based operator needs identified from actual production blockers already found in this audit: **user lookup, entitlement/premium status lookup, payment-order lookup, notification-scheduler health, and AI spend visibility** (the `AIUsage`/`ProviderLog` tables already exist — they just have no operator-facing surface yet). No moderation tooling is needed until Community exists. **Do not build a general admin dashboard** — build exactly these five lookups, in the sprint that also handles production launch hardening (§46).

---

## 26. Observability Completeness

Sentry is genuinely wired on both API and frontend, with real, non-trivial engineering behind it (allowlist-based PII scrubbing, scheduler-failure capture, a real bypass found and fixed in Sprint 12 closure). **The one load-bearing gap: it has never been run against a real Sentry project** — no `SENTRY_DSN` has existed in any environment checked across the entire audit trail. "Complete in code" and "verified in production" are not the same claim, and only the first is currently true. Also absent: AI-spend-specific alerting (data exists, no surfacing) and payment-webhook-failure-specific alerting (a rejected webhook is a 4xx, not captured by design). Both are minor, cheap additions once the Admin lookups (§25) exist to consume that data.

---

## 27. Analytics

**Absent entirely** — no PostHog, Amplitude, Mixpanel, GA, or Segment anywhere in the codebase. This is a genuine pre-launch gap: none of the standard funnel questions (landing→signup conversion, onboarding completion, first-Discovery-use rate, Premium page views, checkout initiation vs completion, day-1/day-7 return) can currently be answered. **Classification: PRE-LAUNCH REQUIRED** — not because analytics is glamorous, but because launching without any funnel visibility means the team would be flying blind on exactly the questions (does Onboarding convert? does Premium's value land?) this audit and all its predecessors have had to answer by code-reading instead of by looking at real numbers.

---

## 28. Mobile / Responsive

Not code-audited in visual/runtime detail in this pass (would require a running dev server and browser testing, out of scope for a docs-only research audit). One concrete, previously-flagged, still-open item carried forward from the audit trail: **the 768–1279px tablet breakpoint shares the phone's bottom-tab navigation** rather than getting its own layout — flagged since Sprint 4B, never fixed across 8+ subsequent sprints. Recommend closing this specific item during the launch-hardening sprint (§46) rather than commissioning a full responsive re-audit pre-launch.

---

## 29. Accessibility

Not comprehensively audited in this pass. Known, previously-fixed issues (Natal Chart wheel glyph collision, duplicate "Key Aspects" accessible name) demonstrate the team does respond to a11y findings when surfaced, but no systematic pass has occurred. **No launch-blocking accessibility issue is currently known**, but a lightweight targeted pass (forms, dialogs, notification center, chart wheel, Premium page) is reasonable pre-public-launch due diligence, not full WCAG certification.

---

## 30. Privacy / Trust

Account export/deletion: real, shipped. AI disclosure: consistently present per the deterministic-vs-AI-generated discipline. Memory/Journal privacy docs are genuinely thorough (documented IDOR/enumeration/CSRF threat tables). Sentry scrubbing: allowlist-based, a real bypass was found and fixed. **The one real gap: `/privacy` and `/terms` are both self-labeled placeholders** ("plain-language summary for Sprint 1," "placeholder summary for Sprint 1") — this is a founder/legal decision, not an engineering one, but it is a hard blocker for any real public launch given the product handles PII, payment data, and emotionally sensitive Memory/Journal content.

---

## 31. Security Completeness

Strong, consistent discipline: global CSRF guard, module-appropriate throttling (with a documented, deliberately-mirrored fix pattern for the historical "named throttler doesn't apply by default" bug class), uniform IDOR/ownership discipline (`findOwned()`, identical 404s), fail-open rate limiting on Redis outage (disclosed trade-off, not a bug). **Unresolved, explicitly disclosed risks:** PayOS webhook route has no rate limiting (infra-level mitigation needed); `TRUST_PROXY` correctness is unverifiable without knowing the real hosting topology (directly affects every IP-keyed rate limiter's correctness in production); no account-lockout escalation beyond flat rate limits; no device/IP anomaly detection. None of these are P0 in isolation, but `TRUST_PROXY` becomes P0 the moment a real production deployment exists, since a wrong setting silently defeats IP-based rate limiting entirely.

---

## 32. Product Design Coherence

The main product, Discover pages, Dashboard, Premium, and Settings all consistently follow the Bible's Module 4/22 design system (calm-first, no urgency patterns, Insight-gold reserved for genuine moments). `/menh-vi` visually and structurally diverges completely — its own layout, its own nav, its own color system, a different brand name — by explicit, disclosed design. It was built as a self-contained visual-reference exercise and has succeeded at being exactly that; the issue is not its quality but its current live, public, unauthenticated deployment status (§36).

---

## 33. Brand / Naming Coherence

**BeaconVie** is the sole, consistent brand throughout the Product Bible and the real, nav-linked, authenticated product. **"Mệnh Vi"** exists only inside `/menh-vi`, a disclosed design exploration. The repository folder name `web-tu-vi` is a legacy working codename the Bible never defines or uses in-product. **There is no naming conflict inside the real product** — but there is a real, easily-avoidable risk in having a second, differently-branded, publicly-reachable surface live in the same production deployment, discoverable by URL guessing or search-engine crawling, especially once SEO work begins. **Recommendation: one production naming architecture — BeaconVie, exclusively** — and resolve `/menh-vi`'s public accessibility before any SEO or public-launch work proceeds (§17, §36, §46).

---

## 34. Beta / Launch Readiness

| Gate | Engineering | Business | Legal | Content | Growth |
|---|---|---|---|---|---|
| Closed Beta | Ready (V1 tier code-complete) | Needs a real domain, hosting | `/privacy`,`/terms` still placeholders — acceptable for closed beta with a disclosed banner | n/a | n/a |
| Public Beta | Needs Sentry runtime verification, analytics, `/menh-vi` disposition | Needs PayOS merchant account, price sign-off, email provider | Real Privacy Policy/ToS required | Reports strengthens Premium's pitch | Needs SEO surface (§22) |
| Public Launch | All of the above, plus admin lookups (§25) | Refund policy, payment-retention policy, tax/invoice handling | Same as above, finalized | Reports live | Shareability, public content live |

---

## 35. Define "Product Complete"

Not "all possible astrology features exist." **Product Complete means:**
1. Every Bible V1 and V1.5-tier module (Companion, Memory, Discovery×4 including Eastern Horoscope, Journal, Premium, Notifications, Reports) is shipped **and production-verified**, not merely code-complete.
2. Payment is operational against a real merchant account with a real, signed-off price.
3. Legal documents (Privacy Policy, ToS) are real, not placeholders.
4. Basic product analytics answers the core funnel questions.
5. No ambiguous-status modules remain — Reflection/Insight/Review/Goal and `/menh-vi` have explicit, executed dispositions, not indefinite limbo.
6. The Vietnamese Tử Vi question has an explicit, recorded founder decision — either a scoped build is underway/shipped, or it is explicitly, permanently declined. "Unresolved" is not an acceptable end state.
7. No open P0 gap remains anywhere in this document.

This deliberately does **not** require: Community, Admin beyond the 5 lookups in §25, full Tử Vi (only the *decision* about it), or any deferred Discovery-system expansion (transits, synastry, Personal Month, etc.).

---

## 36. `/menh-vi` Disposition

**Recommendation: ARCHIVE.** Remove it from the live, publicly-routable app (move behind an internal-only flag, a `noindex` + auth-gate, or out of the deployed route tree entirely into a design-reference branch), but do not delete the code — it has real, stated value as a static visual/motion reference for whenever the founder decides to act on §11's Tử Vi recommendation. This is cheap, reversible, and closes the one concrete brand/security-adjacent loose end this audit found (a second brand, unauthenticated, live in production, at the exact moment SEO/public work is being newly considered elsewhere in this same roadmap).

---

## 37. P0 — Blocks Core Promise / Launch / Revenue

1. Payment production activation (merchant account, price sign-off, webhook registration, domain) — **business-owned**
2. Real email provider credential — **business-owned**
3. Production domain + deployment manifest (no Dockerfile/hosting config exists anywhere in-repo) — **engineering + business**
4. Real Privacy Policy / ToS (current pages are self-disclosed Sprint-1 placeholders) — **legal-owned**
5. Sentry runtime verification (never actually connected to a live project) — **engineering**
6. `TRUST_PROXY` correctness against real hosting topology (silently defeats IP-based rate limiting if wrong) — **engineering, blocked on #3**
7. Product analytics instrumentation (zero funnel visibility today) — **engineering**

## 38. P1 — Must Fix Before Product Complete

1. Explicit founder decision on Vietnamese Tử Vi (§11) — currently unresolved across 3 audit cycles
2. Frozen-module disposition executed (§17) — HIDE Reflection/Insight/Review/Goal from Settings
3. `/menh-vi` disposition executed (§36) — ARCHIVE
4. CLAUDE.md correction (Companion is LLM-based, not rule-based, since Sprint 2B)
5. Reports module (§18) — the Bible's own "strongest proof point," directly strengthens Premium's thin current value pitch
6. Refund policy / tax-invoice handling (§20) — **legal/business-owned**
7. Payment-record retention policy decision — **legal-owned**
8. Stale-`PENDING`-order sweep job + webhook route rate limiting
9. Tablet breakpoint (768–1279px) navigation fix — open since Sprint 4B

## 39. P2 — Important Post-Launch Expansion

1. Eastern Horoscope (Chinese zodiac/Five Elements) — cheap, already spec'd, V1.5 per Bible
2. Public SEO content (Tarot glossary, numerology explainer, zodiac calculator) — sequenced after Eastern Horoscope and `/menh-vi` archival
3. Shareability for Discovery results
4. Admin minimal tooling (5 lookups, §25)
5. AI-spend and payment-webhook-specific Sentry alerting
6. Richer notification triggers (Journal/Memory re-engagement)
7. Accessibility targeted pass (forms, dialogs, chart wheel, notification center)

## 40. P3 — Optional / Future

1. Full Vietnamese Tử Vi Đẩu Số build (§11–14) — contingent entirely on the P1 founder decision; large multi-sprint initiative if greenlit, not required for Product Complete as defined in §35
2. Community
3. Transits / synastry / progressions / solar return (Natal Chart)
4. Personal Month / Pinnacles / Challenges (Numerology)
5. Multi-person compatibility, Voice mode, practitioner marketplace (Bible's own "Future"/"Moonshot" tier)

---

## 41. Roadmap Duplication Check

No accidental duplication found. Eastern Horoscope and a future Tử Vi module are explicitly kept as **two separate systems** (§11) precisely to prevent the conflation this section warns against. Reflection/Insight/Review/Goal remain frozen and are **not** folded into or confused with Reports — Reports is a new, AI-synthesis-first module per Module 16; the frozen four are deterministic rule engines with no Bible-module home at all. Community remains singular and deferred, not fragmented across multiple docs.

---

## 42. Founder Parallel Checklist (independent of engineering sprints)

- [ ] PayOS merchant account + live credentials
- [ ] Premium production price sign-off (replace `isMvpTestPrice`)
- [ ] Production domain + hosting provider selection
- [ ] PayOS webhook URL registration (blocked on domain)
- [ ] Email provider credential (Resend/Postmark or equivalent)
- [ ] Payment-record retention policy
- [ ] Refund policy
- [ ] Tax/invoice requirements for Vietnamese consumer payments
- [ ] Real Privacy Policy (replace Sprint-1 placeholder)
- [ ] Real Terms of Service (replace Sprint-1 placeholder)
- [ ] Final production naming decision (confirm BeaconVie-only, per §33)
- [ ] Go/no-go decision on Vietnamese Tử Vi Đẩu Số as a product initiative (§11) — the single highest-leverage open decision in this entire audit
- [ ] If Tử Vi is greenlit: identify/engage a domain-expert reviewer for §12's flagged items

---

## 43. What Should NOT Be Built Before Product Complete

- Community (no user base to justify moderation infrastructure yet)
- A general/broad Admin dashboard (only the 5 lookups in §25)
- Multi-person compatibility, Voice mode, practitioner marketplace (Bible's own Future/Moonshot tier)
- Any second astrology "school" beyond Eastern Horoscope + (conditionally) one Tử Vi tradition — do not hedge across multiple Tử Vi schools
- Full WCAG certification (targeted pass only)
- Any rebuild/absorption of Reflection/Insight/Review/Goal back into active development — hide, don't reinvest
- Any further work inside `/menh-vi` as a live route — archive it, don't extend it

---

## 44. Final Completeness Matrix

| Capability | Current | Needed for Product Complete? | Target Sprint | Validation |
|---|---|---|---|---|
| Auth | DONE | — | — | e2e |
| Onboarding | DONE | — | — | e2e |
| Companion | DONE | — | — | e2e |
| Memory | DONE | — | — | e2e |
| Journal | DONE | — | — | e2e |
| Tarot | DONE | — | — | unit+e2e+Playwright |
| Numerology | DONE | — | — | unit+e2e |
| Natal Chart | DONE | — | — | golden vectors+e2e+Playwright |
| Eastern Horoscope | REQUIRED | Yes (V1.5 Bible module) | Sprint 16 | golden vectors |
| Reports | REQUIRED | Yes (Bible's core monetization proof point) | Sprint 15 | evidence-grounding tests |
| Premium/Payment (code) | DONE | — | — | e2e |
| Payment (production) | REQUIRED | Yes | Sprint 13 + founder checklist | live sandbox txn |
| Notifications | DONE (narrow) | Sufficient for Product Complete | — | e2e |
| Observability (code) | DONE | — | — | — |
| Observability (runtime) | REQUIRED | Yes | Sprint 13 | live captured event |
| Analytics | REQUIRED | Yes | Sprint 13 | funnel dashboard live |
| Account export/deletion | DONE | — | — | e2e |
| Privacy/ToS (real) | REQUIRED | Yes | Founder-owned | legal sign-off |
| Frozen modules disposition | REQUIRED | Yes | Sprint 14 | Settings updated |
| `/menh-vi` disposition | REQUIRED | Yes | Sprint 14 | route unreachable publicly |
| Tử Vi decision | REQUIRED | Yes (the decision itself) | Founder, before Sprint 15 | recorded decision |
| Tử Vi build | DEFERRED (conditional) | No (only if greenlit) | Sprint 17+ | golden vectors (§14) |
| Admin (5 lookups) | REQUIRED | Yes | Sprint 18 | manual verification |
| SEO/public content | DEFERRED | Post-launch | Sprint 19 | organic traffic |
| Shareability | DEFERRED | Post-launch | Sprint 19 | — |
| Community | REMOVED (from scope) | No | Not scheduled | — |
| Admin (broad) | REMOVED (from scope) | No | Not scheduled | — |

---

## 45. Final Roadmap Rebase (Sprint 13 → Product Complete)

### Sprint 13 — Production Verification & Analytics Foundation
**Goal:** convert "complete in code" into "verified in a real environment."
**Why now:** nothing shipped since Sprint 1 has ever touched a real domain, a real Sentry project, or a real analytics event — this is the biggest gap between "audited as done" and "actually launch-ready."
**In scope:** deployment manifest (Dockerfile/hosting config), Sentry DSN wired + one live-verified event in staging, `TRUST_PROXY` resolved against the chosen hosting topology, basic funnel analytics instrumented (landing→signup, onboarding completion, first Discovery use, Premium page view, checkout initiation).
**Out of scope:** any new product feature.
**Dependencies:** founder must have picked a hosting provider (parallel checklist).
**Major risks:** analytics tool choice becoming its own mini-project — timebox to one lightweight, privacy-respecting tool consistent with Module 21's third-party-sharing discipline.
**DoD:** staging reachable via real domain; one real Sentry event captured with correct PII scrubbing; 5 funnel events firing and visible in a dashboard.

### Sprint 14 — Ambiguity Cleanup: Frozen Modules, `/menh-vi`, CLAUDE.md
**Goal:** close every open "indefinite limbo" item found in this audit.
**Why now:** cheap, low-risk, and removes exactly the confusing surfaces (a second brand, live and public) that the upcoming SEO/public work (Sprint 19) would otherwise amplify.
**In scope:** hide Reflection/Insight/Review/Goal from Settings (code untouched); archive `/menh-vi` out of the public route tree; correct CLAUDE.md's stale Companion description.
**Out of scope:** deleting any frozen-module code or data; deciding Tử Vi (that's the founder checklist, not this sprint).
**DoD:** `/menh-vi/*` returns 404 or requires an internal flag; Settings no longer surfaces the frozen four; CLAUDE.md accurate.

### Sprint 15 — Reports (Premium Destiny Report)
**Goal:** ship the Bible's own "strongest proof point of the whole business thesis."
**Why now:** directly strengthens Premium's currently-thin value pitch (§19); converges Tarot/Numerology/Natal Chart/Memory into the product's highest-leverage monetization surface; does not depend on the Tử Vi decision.
**In scope:** Evidence Engine, grounding-verification pipeline, canonical-facts/AI-synthesis boundary per §18.
**Out of scope:** Eastern Horoscope or Tử Vi as report inputs (add later once they exist).
**Dependencies:** none blocking — can start immediately after Sprint 14.
**Major risks:** hallucination risk is real and named by the Bible itself as the highest in the product — do not ship without the grounding-verification step fully tested.
**DoD:** at least 3 of the Bible's 15 report types shipped with automated grounding tests; evidence-threshold gating verified (no report without sufficient underlying data).

### Sprint 16 — Eastern Horoscope (Chinese Zodiac / Five Elements)
**Goal:** ship the Bible's actual, narrowly-scoped V1.5 Discovery module — cheap, well-spec'd, independent of the Tử Vi decision.
**Why now:** lowest-risk, highest-ROI remaining Bible-scoped Discovery system; unblocks Sprint 19's SEO calculator idea.
**In scope:** lunisolar calendar engine (evaluate `lunar-typescript` per prior audit's finding), animal-sign/element deterministic mapping, same premium/cost-control/Companion-bridge pattern as the other three Discovery systems.
**DoD:** mirrors Natal Chart's golden-vector discipline; `/discover` badge flips from "coming soon" to live.

### Sprint 17 (conditional on founder go-decision) — Tử Vi Domain & Calculation Specification
**Goal:** produce the written domain spec per §12, zero code.
**Gate:** does not start until the founder checklist item in §42 is explicitly resolved YES.
**DoD:** spec document reviewed against an independent authoritative reference; every §12 item resolved or explicitly flagged for domain-expert sign-off.

### Sprint 18 (conditional) — Tử Vi Deterministic Core Engine
Implements §13's pipeline through canonical chart persistence. No UI, no AI interpretation.

### Sprint 19 — Admin Lookups, SEO/Public Content, Shareability
**Goal:** close the remaining P2 gaps once the higher-leverage P0/P1 work above is done.
**In scope:** the 5 Admin lookups (§25); public SEO content built on the now-live Eastern Horoscope engine (calculator, glossary pages); shareable result cards for Tarot/Numerology/Natal Chart/Eastern Horoscope.
**Dependencies:** Sprint 16 (Eastern Horoscope) for the calculator; Sprint 14 (`/menh-vi` archived) before any public content push.

### Sprint 20 (conditional) — Tử Vi Golden Verification & Domain Audit Gate
Implements §14's vector suite as a hard release gate, per §15's audit-gate design. Tử Vi may not proceed to UI/AI work until this passes.

### Sprint 21 (conditional) — Tử Vi Product Experience
Chart wheel/12-palace grid UI, history, lifecycle — same pattern as Natal Chart's UI layer.

### Sprint 22 (conditional) — Tử Vi AI Interpretation + Companion Bridge
Same deterministic-facts-in/AI-narration-out pattern as every other Discovery system; read-only Companion bridge.

### Product Complete Gate — Sprint 23
Final launch-hardening pass: legal documents finalized (founder-owned, tracked in parallel), refund/retention policy implemented, tablet-nav fix, targeted accessibility pass, final review against §35's 7-point definition. **This is the sprint that produces the "PRODUCT COMPLETE" declaration**, not a feature sprint itself.

**Engineering sprints to Product Complete: 6 unconditional (13–16, 19, 23) + up to 6 conditional (17–18, 20–22, plus any Tử Vi buffer) depending entirely on the single founder decision in §42.** Without Tử Vi: **~6 sprints**. With Tử Vi: **~11–12 sprints**.

---

## 46. Files Changed

```
docs/audit/full-product-completion-roadmap-rebase.md   (new file, this document)
```

No other files were modified. No Prisma changes. No migrations. No dependency changes. No commits made.

---

## 47. FOUNDER DECISIONS RESOLVED (appended 2026-08-17, post-audit)

**This section is an appendix. Nothing above this line has been edited or reinterpreted — the original findings, priority classifications, and conditional roadmap stand as originally written and remain the historical record of the audit's analysis.** The decisions below resolve the open questions that analysis surfaced, and supersede §45's *conditional* roadmap with a new unconditional one.

| Question this audit left open | Founder resolution |
|---|---|
| Vietnamese Tử Vi (§9–11) — build or explicitly decline? | **GREENLIT.** Build as a new, dedicated module, separate from Eastern Horoscope. Full specification: `docs/product/vietnamese-tu-vi-product-definition.md`. |
| Eastern Horoscope's relationship to Tử Vi (§11, Option A/B/C/D) | **Option D confirmed** — Eastern Horoscope (Chinese Zodiac/Five Elements) remains a separate, unchanged module; never renamed to or conflated with "Tử Vi." |
| Production naming architecture (§33) | **BeaconVie is the canonical brand**, confirmed. |
| `/menh-vi` disposition (§17, §36) | **Archive from public routing.** Code/design assets preserved for reuse, not deleted. Scheduled: Roadmap v2 Sprint 14. |
| Frozen modules — Reflection/Insight/Review/Goal (§17) | **Hide from user-facing Settings/nav.** Code and data kept intact; potential future internal reuse not foreclosed. Scheduled: Roadmap v2 Sprint 14. |
| Analytics (§27) | **Confirmed pre-launch required**, unchanged from the original finding. Scheduled: Roadmap v2 Sprint 13. |
| Community (§24) | **Confirmed deferred**, unchanged from the original finding, no date set. |

**Roadmap status:** §45's conditional roadmap (6 unconditional sprints + up to 6 conditional Tử Vi sprints) is **superseded** by `docs/product/product-completion-roadmap-v2.md`, which re-derives sprint ordering now that Tử Vi is unconditional — 12 engineering sprints (13 → 24) to the Product Complete gate, of which 5–6 are Tử Vi-specific (specification, engine, verification gate, UX, AI interpretation, vận depth).

**Files produced by this resolution:**
```
docs/product/vietnamese-tu-vi-product-definition.md   (new — module specification)
docs/product/product-completion-roadmap-v2.md          (new — authoritative roadmap, supersedes §45 above)
```

**Verdict:** PRODUCT ROADMAP V2 LOCKED — READY TO EXECUTE. See `docs/product/product-completion-roadmap-v2.md` for the sprint-by-sprint plan; execution begins with Sprint 13, not yet started as of this appendix.
