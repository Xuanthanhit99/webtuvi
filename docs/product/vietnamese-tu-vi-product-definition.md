# Vietnamese Tử Vi / Lá Số Tử Vi — Product Definition (Proposal)

**Status:** Approved amendment proposal, founder-greenlit. Not yet merged into the ratified Product Bible (`docs/reference/web-tu-vi/web-tu-vi/`). This document is the authoritative specification for the new module until/unless it is formally folded into a future Bible revision.
**Founder decision (recorded):** YES — Vietnamese Tử Vi is an intended core product capability, built as a system **separate from and in addition to** the existing Eastern Horoscope (Chinese Zodiac / Five Elements) module. Neither replaces the other.
**Scope of this document:** definition only. No code, no Prisma schema, no migrations.

---

## 1. Terminology

Canonical naming, locked here to prevent drift across code, copy, and the Bible:

| Concept | Canonical Vietnamese term | Canonical English term | Do NOT call it |
|---|---|---|---|
| The new module | **Tử Vi Lá Số** (display), `tu-vi` (internal/route slug) | Vietnamese Tử Vi / Purple Star Astrology | "Eastern Horoscope," "Natal Chart," "Zodiac" |
| The existing module | **Ngũ Hành / Cung Hoàng Đạo Phương Đông** (display), `eastern-horoscope` (existing internal slug, unchanged) | Eastern Horoscope | "Tử Vi," "Lá Số" |
| A Tử Vi chart instance | **Lá số** | Chart / Natal chart (Tử Vi) | — |
| One of the 12 houses | **Cung** | Palace | — |
| One of the 14 primary stars | **Chính tinh** | Main star | — |

**Discover hub structure** (display order, final naming):

```
Discover / Khám phá
├── Tarot
├── Thần Số Học        (Numerology — existing, unchanged)
├── Bản Đồ Sao         (Natal Chart — existing, Western tropical, unchanged)
├── Tử Vi Lá Số        (NEW — this document)
└── Ngũ Hành Phương Đông  (Eastern Horoscope — existing name kept distinct from "Tử Vi")
```

Rationale for renaming Natal Chart's display label to "Bản Đồ Sao" ("star map") rather than leaving it unlabeled or reusing "chart": this was already the working label used in the `/menh-vi` prototype for a Western-astrology-adjacent concept, and reusing it here (on the *real*, shipped Western Natal Chart) resolves the naming ambiguity cheaply — "Tử Vi Lá Số" is reserved exclusively for the new module, never applied to Natal Chart or Eastern Horoscope.

`/menh-vi/la-so`'s existing "Tử Vi Lá Số" placeholder string is the **correct** name for this new module — it was simply nine months premature. See `docs/audit/full-product-completion-roadmap-rebase.md` §36 for the disposition of that route itself (archive the route; the name lives on in the real module).

---

## 2. Product Promise

> "A real, correctly-calculated Vietnamese Tử Vi Đẩu Số chart — the same lá số a person would get from a trusted traditional practitioner — explained by an AI Companion that never invents a star, palace, or fact that isn't actually there."

**Target user:** a Vietnamese user (likely already engaged with Tarot/Numerology/Natal Chart) who wants the specific, culturally-load-bearing Tử Vi Đẩu Số system — not a Western horoscope, not a Chinese zodiac summary, not a generic "Eastern mysticism" gloss.

**What this module is not**, mirroring the discipline already established for Tarot (Module 12) and Natal Chart (Module 13):
- Not a Western Natal Chart with Vietnamese labels.
- Not the existing Eastern Horoscope (Chinese Zodiac/Five Elements) renamed.
- Not an AI-approximated or AI-generated chart.
- Not a single-tradition-agnostic blend of multiple Tử Vi schools presented as if they agree.

---

## 3. Deterministic Architecture (locked)

```
Birth data (solar date, time, location)
  → calendar/time normalization (Vietnam UTC+7, day-boundary rule)
  → lunar date conversion (incl. leap-month handling)
  → deterministic Tử Vi calculation:
      Can năm / Chi năm → Cung Mệnh → Cung Thân → Ngũ Hành Cục
      → 12 cung layout → 14 chính tinh placement → phụ tinh placement
      → Tuần / Triệt → Tứ Hóa → (MVP+) Đại Hạn / Tiểu Hạn / Lưu Niên
  → canonical chart object (persisted, versioned — see §6)
  → visualization (12-cung chart)
  → AI interpretation (reads canonical facts only)
```

**Non-negotiable rule, identical in force to the existing rule for Tarot/Numerology/Natal Chart (Module 23 §10 of the Bible):** the LLM (Gemini, or whichever provider is active) **must never calculate** any of the following — it may only explain values that were already computed deterministically and handed to it as structured facts:

- Lunar date / leap-month resolution
- Can Chi
- Hour branch
- Cung Mệnh / Cung Thân
- Ngũ Hành Cục
- Palace positions (the 12-cung layout)
- Star positions (chính tinh and phụ tinh)
- Tứ Hóa
- Tuần / Triệt
- Vận cycles (Đại Hạn / Tiểu Hạn / Lưu Niên)

This is the same architectural pattern already proven correct and trust-preserving for the three shipped Discovery systems. It is not a new discipline being invented for Tử Vi — it is the existing discipline extended to a harder domain, which makes adherence to it *more* important here, not less.

---

## 4. Minimum Deterministic Scope

### A. Calendar
Required for MVP: solar→lunar conversion, leap lunar month handling, Vietnam UTC+7 normalization, explicit day-boundary rule, hour-branch (12 double-hour) resolution including the giờ Tý (23:00–01:00) edge case.

### B. Core chart
Required for MVP: Can năm, Chi năm, Cung Mệnh, Cung Thân, full 12-cung layout, Ngũ Hành Cục (all five variants: Thủy Nhị Cục, Mộc Tam Cục, Kim Tứ Cục, Thổ Ngũ Cục, Hỏa Lục Cục).

### C. 14 Chính Tinh
Required for MVP, all 14, with correct wraparound placement: Tử Vi, Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân. A chart that omits any of these, or omits an empty-palace (vô chính diệu) case, is not MVP-complete.

### D. Auxiliary stars
Required initial set for MVP (the auxiliary stars a real lá số reader treats as load-bearing, not decorative): Tả Phù, Hữu Bật, Văn Xương, Văn Khúc, Địa Không, Địa Kiếp, Lộc Tồn, Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, Thiên Khôi, Thiên Việt. **This set is not invented here** — it must be confirmed against the authoritative source chosen in the decision register (§5), not assumed correct because it appears in this list. Additional minor auxiliary stars beyond this set are explicitly **deferred** (post-MVP).

### E. Additional core concepts
Required for MVP: Tuần, Triệt, Tứ Hóa. **Undecided, requires explicit resolution before MVP scope is locked:** whether Miếu/Vượng/Đắc/Hãm (star brightness/dignity states) belongs to the MVP convention — see decision register item 11. Do not default to "yes, include it" or "no, skip it" without that decision being made explicitly and recorded.

### F. Time systems
MVP: none required for the first shippable chart — a static natal lá số (facts A–E above) is a complete, honest, valuable MVP on its own, exactly as Natal Chart shipped without transits first. **Post-MVP, required before the module can be called feature-complete:** Đại Hạn (major cycle), Tiểu Hạn (minor cycle), Lưu Niên (annual cycle) — sequenced as their own sprint (see roadmap v2), not bundled into MVP.

---

## 5. Domain Decision Register

Every row below must be resolved and recorded here — with a named source — before the corresponding engineering work begins. **No LLM, including the one producing this document, may resolve these unilaterally.** Where a row is currently unresolved, it is marked exactly that; it is not defaulted to a guess.

| # | Decision | Current status | Authoritative source required? | Founder decision needed? | Domain expert required? | Engineering impact |
|---|---|---|---|---|---|---|
| 1 | School/tradition/reference system (Vietnamese vs. Chinese Zi Wei Dou Shu conventions differ in places) | **UNRESOLVED** | Yes | Yes | Yes | Determines every downstream table; must be chosen first, nothing else can start |
| 2 | Giờ Tý / day-boundary convention (23:00 start vs. midnight, "early/late Tý" handling) | **UNRESOLVED** | Yes | No (technical, but consult expert) | Yes | Affects hour-branch and downstream Mệnh/Thân/Cục for a large share of real birth times |
| 3 | Lunar leap-month behavior (which month a leap-month birth is treated as) | **UNRESOLVED** | Yes | No | Yes | Affects Can Chi/Cục for a meaningful minority of birth dates |
| 4 | Mệnh/Thân placement rule | **UNRESOLVED** | Yes | No | Yes | Foundational — every palace label depends on this |
| 5 | Cục (destiny bureau) derivation table | **UNRESOLVED** | Yes | No | Yes | Foundational — star placement depends on this |
| 6 | Tử Vi star placement table (the anchor star all others are placed relative to) | **UNRESOLVED** | Yes | No | Yes | The single highest-leverage table in the entire engine |
| 7 | Remaining 13 chính tinh placement rules | **UNRESOLVED** | Yes | No | Yes | Direct dependency on #6 |
| 8 | Auxiliary-star placement tables (§4D's 13-star list) | **UNRESOLVED** | Yes | No | Yes | Confirm the MVP list itself, then each placement rule |
| 9 | Tuần/Triệt calculation rule | **UNRESOLVED** | Yes | No | Yes | — |
| 10 | Tứ Hóa mapping (known to vary meaningfully by school) | **UNRESOLVED** | Yes | No | Yes | Directly downstream of decision #1 |
| 11 | Miếu/Vượng/Đắc/Hãm — include in V1 convention or defer? | **UNRESOLVED** | Yes, if included | Yes (scope call) | Yes | Changes MVP scope size non-trivially |
| 12 | Vận calculation rules (Đại Hạn/Tiểu Hạn/Lưu Niên) | **UNRESOLVED** | Yes | No | Yes | Post-MVP, but must be resolved before that sprint starts |

**Where two schools disagree, the spec sprint (Roadmap v2 Sprint 15) must name one explicit V1 convention and record why — never silently blend schools.** A future alternative-school mode is possible but must be a separately versioned, explicitly labeled option, never a silent default change.

---

## 6. Rule & Version Policy

No deterministic rule ships without a traceable reference. Every rule in the engine must eventually carry:

```
ruleId            (e.g. "tuvi.core.menh-palace-v1")
ruleVersion
reference         (named source — text, practitioner, published table — not "AI consensus")
input
output
boundaryBehavior  (what happens at edge cases: leap month, giờ Tý, year boundary)
```

"Claude/Gemini says this is the standard formula" is explicitly **not** an acceptable reference for any row in §5 or any `ruleId` above.

**Engine-level versioning, to be persisted with every generated chart** so a historical chart remains explainable even after rules evolve:

- `TUVI_ENGINE_VERSION`
- `CALENDAR_VERSION`
- `STAR_RULESET_VERSION`

This mirrors the `calculationVersion`/`normalizationVersion` pattern already shipped in Numerology — not a new pattern, an extension of a proven one.

---

## 7. Golden Vector Policy

**Golden vectors are a hard release blocker** — the module may not ship AI interpretation or go to any real user until this gate passes, mirroring Natal Chart's existing Case A–D discipline (extended in scope given Tử Vi's greater complexity).

**Minimum initial target: 12–15 independently verified charts**, expanded if domain coverage gaps are found during review. Required coverage:

- Normal dates (baseline correctness, multiple)
- A lunar leap-month date
- A lunar/solar year-boundary date (around Tết)
- A 23:00/00:00 boundary date (giờ Tý edge case)
- Multiple distinct birth hours (covering all 12 hour branches at least once across the set)
- All five Ngũ Hành Cục (at least one chart each)
- Distinct Tử Vi placements (covering meaningfully different palace positions)
- A star-wraparound case (dense multi-star palace, ordering correctness)
- A case exercising Tuần/Triệt
- A case exercising Tứ Hóa
- A case exercising vận calculation (once that scope ships)

**Each vector record must store:**

```
solarDatetime, timezone
lunarDate, leapFlag
canChi, hourBranch
menh, than, cuc
palaceArrangement (12 cung)
mainStarPositions (14 chính tinh)
auxiliaryStars (per §4D)
tuanTriet
tuHoa
vanResult (once in scope)
referenceSource, referenceVersionOrDate
```

**Expected values must come from an independent, named reference** (a published lá số from a recognized calculator, text, or practitioner) — **never derived from the implementation under test.** This is the same non-negotiable rule stated in the prior audit and is repeated here because it is the single most important safeguard against a plausible-looking but silently wrong engine.

---

## 8. Domain Logic Release Gate

A mandatory, independent, pre-AI-interpretation audit gate: **TỬ VI AN SAO LOGIC AUDIT.**

Reviews, each resolved to exactly one of `PASS` / `FAIL` / `DOMAIN REFERENCE REQUIRED`:

1. Solar → Lunar
2. Leap month
3. UTC+7 / birth-time normalization
4. Hour branch
5. Mệnh
6. Thân
7. Cục
8. 12-palace indexing
9. 14 main stars
10. Auxiliary stars
11. Tuần/Triệt
12. Tứ Hóa
13. Vận
14. Golden vectors

**Hard rule: AI interpretation cannot ship while any item above is unresolved.** This gate sits between the "Engine" and "AI Interpretation" sprints in Roadmap v2 — it is not optional, and it is not satisfied by the engine merely running without errors; it requires the golden-vector comparison in §7 to actually pass against the independent reference set.

---

## 9. Product UX Scope

```
Discover → Tử Vi Lá Số → birth information → deterministic calculation
  → chart reveal → core summary → 12-palace exploration → star details
  → vận (once in scope) → AI interpretation → Ask Companion → history → Premium report
```

**Hard rule:** the first screen shown after calculation completes is the **canonical chart** (12-cung grid, Mệnh/Thân marked, star placements visible) — never a wall of AI-generated prose. This mirrors Natal Chart's existing progressive-disclosure structure (Overview → Planets → Houses → ... → Deep Dive) and the Bible's Module 4 rule that "Memory Recall must always be visually attributed... never silently woven into prose."

---

## 10. Visual Chart Requirement (definition only, no implementation)

The eventual UI must display an understandable 12-cung chart, requiring:

- 12-cung layout (traditional square/diamond grid arrangement)
- Clear Mệnh/Thân indication
- All 14 chính tinh visibly placed
- Auxiliary stars visibly placed, visually subordinate to main stars
- Star status indicators (Miếu/Vượng/Đắc/Hãm) **only if** decision register item 11 resolves to "include"
- Đại Hạn indication (once in scope)
- Current-year (Lưu Niên) information (once in scope)
- A responsive mobile alternative to the 12-cell grid (the grid format is desktop-friendly by tradition; mobile needs a genuinely usable alternative, not a shrunk grid — same class of problem already flagged and unresolved for the existing tablet breakpoint, see the completion roadmap's P1 list)

---

## 11. AI Interpretation Boundary

Structured interpretation sections, mirroring the palace-by-palace structure a real Tử Vi reading follows:

- Tổng quan (overview)
- Mệnh (self/destiny palace)
- Tài Bạch (wealth)
- Quan Lộc (career)
- Phu Thê (relationships)
- Điền Trạch (property/home)
- Phúc Đức (fortune/wellbeing)
- Thiên Di (travel/movement)
- Tật Ách (health)
- Relationships among important palaces (cross-palace synthesis)
- Đại Hạn outlook (once in scope)
- Current-year outlook (once in scope)

**Hard rule, identical in force to Tarot/Natal Chart/Numerology's existing prompts:** the AI receives only structured, already-computed canonical chart facts. The prompt must explicitly and unconditionally prohibit adding a star, palace, or fact not present in the canonical data — this is the direct Tử Vi analog of Natal Chart's "never AI-approximated" rule and Tarot's "never bypass the curated meaning database" rule.

---

## 12. Premium Boundary

Do not hide the fundamental chart — this would violate the Bible's own anti-scarcity discipline (Modules 2, 4, 17, 22) and the existing precedent set by Tarot/Numerology/Natal Chart, where full core content is always free.

**FREE:**
- Full deterministic chart (all 12 cung, all 14 chính tinh, auxiliary stars, Tuần/Triệt/Tứ Hóa)
- Short interpretation per palace

**PREMIUM:**
- Deeper palace interpretation (mirrors the existing 700-vs-400-token depth pattern)
- Cross-palace synthesis
- Vận analysis (once in scope)
- Richer/unlimited history (mirrors the existing 20-item free cap pattern)
- Memory-aware explanation (≤1 Memory reference, mirroring the existing pattern)
- Inclusion in the Destiny Report (§13)

This is not a paywall designed backward from a revenue target — it is the same, already-validated Premium shape applied to a fourth (fifth, counting Eastern Horoscope) Discovery system. Core calculation correctness stays fully visible, which is itself a trust-building requirement given how skeptically a wrong or hidden Tử Vi chart would be received by exactly the users this module targets.

---

## 13. Reports Integration

Tử Vi becomes one of the canonical-fact inputs to the **Personal Destiny Report** (see `docs/product/product-completion-roadmap-v2.md` for sequencing), alongside Natal Chart, Numerology, selected Tarot history, and Memory context.

**Strict, non-negotiable boundary, identical to the existing Reports discipline (Bible Module 16):** calculated facts (chart placements, star positions, numerology numbers) and AI synthesis (the narrative connecting them) must remain visibly distinguishable at all times. The report must never merge systems in a way that makes a deterministic Tử Vi fact indistinguishable from an AI-generated interpretive sentence.

---

## 14. Privacy

No new privacy category is introduced — Tử Vi birth data (date, time, location) is materially the same sensitivity class as Natal Chart's existing birth data, and should reuse the exact same collection, storage, and consent patterns already shipped and audited for Natal Chart. No separate consent flow is required beyond what already governs birth-data collection.

---

## 15. Future / Deferred Scope

Explicitly out of scope for the module described in this document, unless evidence later demonstrates otherwise:

- Multiple Tử Vi schools offered simultaneously (one V1 convention only, per §5/§6)
- Compatibility/synastry between two Tử Vi charts
- Family charts
- Voice interpretation
- Any AI-approximated or AI-shortcut version of any deterministic step in §3

---

*This document is a proposal pending formal Product Bible integration. Its content is binding for engineering purposes (per the founder decision recorded in `docs/audit/full-product-completion-roadmap-rebase.md`), but the canonical Bible files under `docs/reference/web-tu-vi/web-tu-vi/` remain unmodified until a future, separate Bible-revision task explicitly merges this in.*
