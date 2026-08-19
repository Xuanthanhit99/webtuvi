# Sprint 18 — Vietnamese Tử Vi Deterministic Core — Pre-Implementation Domain Gate

**Type:** Domain gate re-audit only. No Tử Vi calculation code, no Prisma models, no API routes, no
frontend pages were written in this session. No commit, no push. This document re-opens and
re-evaluates the actual Sprint 15 domain files rather than trusting their prior conclusion — per
this session's own brief — and finds that conclusion still holds, for reasons re-derived here, not
merely re-asserted.

**Companion documents (Sprint 15, unchanged by this pass — see §2 for why no edit was needed):**
`docs/domain/tu-vi/authoritative-sources.md`, `domain-decision-register.md`,
`calculation-specification.md`, `star-placement-rules.md`, `golden-vector-specification.md`,
`an-sao-logic-audit.md`, `docs/audit/sprint-15-pre-implementation-audit.md`,
`docs/product/vietnamese-tu-vi-product-definition.md`.

---

## 0. Current product state (verified, not assumed)

- Sprint 17 (Eastern Horoscope) passed Release Closure this session, closure commit `cfe0824`.
- Sprint 17's own implementation lives in `c1c8b8f`, already on `origin/master`.
- Sprint 18 (this sprint) has not started — confirmed by repo search (§9 below): zero Tử Vi code
  anywhere in `apps/api/src/` or `apps/web/`, zero `TuVi*`/`tu_vi` Prisma model.
- Eastern Horoscope and Vietnamese Tử Vi are, and remain, completely separate product surfaces —
  reconfirmed in §25.

---

## 1. Git baseline (fresh this session)

```
git status --short   → (empty this session — no working-tree changes made by this pass)
git diff --stat       → (empty)
git diff --check      → (empty)
HEAD                  = cfe0824d01a6d681011be10845dfd18fac113274
origin/master          = c1c8b8f916a959c62fab1d45328ba3eabcf902e7
ahead/behind           = 1 ahead / 0 behind (HEAD is cfe0824, one commit ahead of origin/master)
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

**Verified, not assumed:** the prior session's own report that "Sprint 17 closure commit cfe0824 was
local and NOT pushed" is **confirmed accurate** — `origin/master` is still `c1c8b8f`; `cfe0824` exists
only locally, 1 commit ahead. No push performed by this session. Sprint 17 was not modified by this
pass. No merge/rebase/cherry-pick in progress.

---

## 2. Governing documents re-read in full this session

`docs/product/vietnamese-tu-vi-product-definition.md`, `docs/product/product-completion-roadmap-v2.md`
(§2 Founder Decisions table, §6 Sprint 17/18 sequencing), and all six Sprint 15 domain files listed
above, each read start-to-finish, not sampled. Also re-confirmed against the already-read Numerology/
Natal Chart/Eastern Horoscope engine source (from this session's own prior Sprint 17 closure work,
§9 of that pass) for the reusable *architecture* pattern only — never for domain rules.

**Why no edit to the Sprint 15 files was needed:** `git log --oneline -- docs/domain/tu-vi/
docs/audit/sprint-15-pre-implementation-audit.md docs/product/vietnamese-tu-vi-product-definition.md`
shows exactly two commits ever touched these paths (`dd029a2`, the Sprint 16 commit that created them,
and `2213cad`, the roadmap lock) — **no Domain Decision Closure pass has happened for Tử Vi**, unlike
Eastern Horoscope's own Sprint 17 closure addendum. Nothing has changed since Sprint 15's research.
Re-reading confirms the prior conclusion is still accurate — it is not stale, and it is not being
taken on faith: every specific claim below was checked against the actual file content, not
recalled from a summary.

**Founder Decisions table (`product-completion-roadmap-v2.md` §2) re-checked specifically for a
school/tradition selection:** it records only **"Vietnamese Tử Vi: GREENLIT — build as a new,
separate, dedicated module"** — a decision to build the module at all, not a selection between
Vân Đằng Thái Thứ Lang's *Tử Vi Đẩu Số Tân Biên* (1956), Trần Đoàn's *Tử Vi Đẩu Số Toàn Thư*, Bắc
Phái, or Nam Phái/Trung Châu (`domain-decision-register.md` DECISION-01's four named candidates).
No such selection exists anywhere in the repository.

---

## 3. Sprint 18 domain pipeline — dependency graph with status

```
Solar birth datetime
  → Vietnam timezone normalization (UTC+7)              RESOLVED_BY_SOURCE   (DECISION-03B)
  → Lunar date conversion                                 RESOLVED_BY_SOURCE   (DECISION-03B)
  → leap-month state (astronomy: which month is leap)      RESOLVED_BY_SOURCE   (DECISION-03B)
  → leap-month state (Tử-Vi chart-construction treatment)   UNSOURCED            (DECISION-03)
  → day-boundary / giờ Tý resolution                        CONFLICT             (DECISION-02)
  → hour branch (Chi giờ)                                   DOMAIN_REFERENCE_REQUIRED (blocked by DECISION-02)
  → Can Chi năm/ngày (mechanics)                            RESOLVED_BY_SOURCE   (standard sexagenary arithmetic, once calendar layer trusted)
  → Can Chi tháng/giờ (month-stem / hour-stem derivation)   DOMAIN_REFERENCE_REQUIRED (standard method cited, not independently re-verified — calculation-specification.md §3)
  → Cung Mệnh                                               DOMAIN_EXPERT_REQUIRED (DECISION-04 — strong candidate formula, not primary-source-verified)
  → Cung Thân                                               DOMAIN_EXPERT_REQUIRED (DECISION-04, same formula family, same caveat)
  → Cục                                                     UNSOURCED            (DECISION-05 — methodology named, table not extracted)
  → 12 palaces (layout/order)                                RESOLVED_BY_SOURCE   (structural — no source found disputing order/naming; see §9)
  → Tử Vi placement (anchor star)                            UNSOURCED            (DECISION-06 — hard gate)
  → 14 Chính Tinh (13 remaining, offset table)                UNSOURCED            (DECISION-07 — group structure known, offsets not)
  → auxiliary stars (MVP set)                                 UNSOURCED            (DECISION-08 — even the MVP list itself unconfirmed)
  → Tuần                                                     UNSOURCED            (DECISION-09 — input basis known, table absent)
  → Triệt                                                    UNSOURCED            (DECISION-09 — different input basis, table absent)
  → Tứ Hóa                                                   DOMAIN_EXPERT_REQUIRED / CONFLICT (DECISION-10 — real, named Bắc/Nam school split)
  → canonical deterministic chart                            NOT_YET_ASSEMBLABLE — every upstream node above must resolve first
  → (post-MVP, Sprint 22) Đại Hạn / Tiểu Hạn / Lưu Niên       DEFERRED             (DECISION-12 — correctly out of Sprint 18 scope)
```

**No node is left `UNKNOWN`.** Every node above carries one of the six allowed statuses, each traced
to a specific decision-register item. **Result: the graph has a hard break at the very first
Tử-Vi-specific node past the calendar layer** (leap-month Tử-Vi treatment, immediately followed by
the giờ Tý `CONFLICT`), and essentially every node from Cung Mệnh onward is `UNSOURCED` or
`DOMAIN_EXPERT_REQUIRED`. Only the calendar-astronomy layer and the 12-palace structural layout are
`RESOLVED_BY_SOURCE`.

---

## 4. School / tradition — HARD GATE

**No single Vietnamese Tử Vi school/ruleset has been explicitly selected.** Re-confirmed directly
from `domain-decision-register.md` DECISION-01, status `DOMAIN_EXPERT_REQUIRED`, and cross-checked
against the roadmap's Founder Decisions table (§2 above), which records only the greenlight to build
the module, not a tradition selection.

- **Candidate (strongest, recommended, not selected):** Vân Đằng Thái Thứ Lang, *Tử Vi Đẩu Số Tân
  Biên* (1956) — `SOURCE_ID VDTTL-1956`.
- **Candidate (root text, not itself proof of modern Vietnamese convention):** Trần Đoàn, *Tử Vi Đẩu
  Số Toàn Thư* — `SOURCE_ID TD-TOANTHU`.
- **Candidate (named, distinct lineage):** Nam Phái / Trung Châu (Lục Bân Triệu, Khâm Thiên môn) —
  `SOURCE_ID SECONDARY-TUHOA-SCHOOLS`.
- **Candidate (named, structurally different in Tứ Hóa treatment):** Bắc Phái.
- **Authoritative reference / edition/version:** none locked. VDTTL-1956 has multiple modern
  reprints/PDF scans; no specific edition has been pinned.
- **Secondary references allowed for corroboration:** per the existing source-hierarchy discipline
  (`authoritative-sources.md`), a `SECONDARY` source may only shape a specification, never be the
  sole basis for a shipped calculation cell — this remains the standing rule, unchanged.

**Verdict on this gate: BLOCKED.** No source-combining was performed to work around this — every
downstream table in this document is reported exactly as `UNSOURCED`/`DOMAIN_EXPERT_REQUIRED`
wherever it in fact depends on an unselected school, rather than silently defaulting to whichever
table appeared most often in the underlying research.

---

## 5. Calendar rules (re-evaluated separately from star placement)

- **Solar→lunar conversion, UTC+7, leap-month astronomy:** `RESOLVED_BY_SOURCE` (`DECISION-03B`) —
  the Hồ Ngọc Đức algorithm (Meeus; Reingold & Dershowitz), independently re-implemented across ≥4
  open-source libraries over ~20 years. This is the same calendar-layer foundation Eastern Horoscope
  already ships on (§25 addresses why that reuse is architecturally, not domain-ly, valid).
- **Leap lunar month — Tử-Vi chart-construction treatment (which month index a leap-4th-month birth
  uses for Mệnh/Thân/Cục):** `UNSOURCED` (`DECISION-03`) — distinct from the astronomy question, not
  resolved by any source found in Sprint 15's research, not resolved by this pass either (no new
  research was conducted to manufacture a resolution).
- **Lunar year boundary:** mechanically resolved by the same calendar layer; no separate Tử-Vi-
  specific concern found distinct from the underlying astronomy.
- **Day boundary / hour branches / giờ Tý:** `CONFLICT` (`DECISION-02`), **explicitly re-verified as
  real, not overcaution.** Two named, actively-used Vietnamese-language conventions exist:
  - **"Giờ Tý Sơ"** — 23:00–23:59 treated as (early) Tý of the *current* civil day.
  - **"Giờ Tý Chính"** — 00:00–00:59 treated as Tý of the *next* civil day.

  These are not merely two labels for the same window — they imply different day-boundary behavior
  for any birth time in 23:00–00:59, which cascades into hour-branch, Mệnh, Thân, Cục, and every
  downstream table. **No compromise convention is proposed or adopted here.** This must be resolved
  by (a) confirming which convention DECISION-01's selected primary source uses once selected, or
  (b) a domain expert's explicit ruling — exactly the Sprint 15 recommendation, unchanged because no
  new evidence exists to change it.

---

## 6. Can Chi

| Rule | Source | Input | Output | Boundary | Test vector | Status |
|---|---|---|---|---|---|---|
| Năm (year) Can/Chi | Standard sexagenary arithmetic, same mechanics already shipped for Eastern Horoscope's `getStemBranchForLunarYear` — mechanically non-disputed once the lunar year itself is known | Lunar year | Stem+Branch pair | Tied to `DECISION-03B`'s calendar layer | None specific to Tử Vi needed beyond calendar-layer vectors already sourced for Eastern Horoscope | `RESOLVED_BY_SOURCE` for mechanics; input depends on `DECISION-02`/`03` for edge-case dates |
| Ngày (day) Can/Chi | Continuous 60-day cycle from a fixed epoch — standard, non-disputed | Lunar day (continuous count) | Stem+Branch pair | Depends on which civil day a 23:00–00:59 birth is assigned (`DECISION-02`) | None sourced this session | `RESOLVED_BY_SOURCE` for mechanics; `DOMAIN_REFERENCE_REQUIRED` for the boundary-dependent input |
| Tháng (month) Can/Chi | "Standard month-stem derivation" — named as a known method, **not independently re-verified** in Sprint 15's research | Lunar month + Can năm | Stem+Branch pair | N/A | Not sourced this session | `DOMAIN_REFERENCE_REQUIRED` — flagged for confirmation alongside DECISION-04, not yet done |
| Giờ (hour) Can/Chi | "Five-rat-escape / ngũ thử độn method" — named as standard, **not independently re-verified** | Chi giờ (per DECISION-02) + Can ngày | Stem+Branch pair | Direct dependency on `DECISION-02` | Not sourced this session | `DOMAIN_REFERENCE_REQUIRED` |

**No new test vectors were sourced this session for any of the four Can Chi levels beyond what
`golden-vector-specification.md` already scopes as required (§20 below).**

---

## 7. Cung Mệnh — hard release prerequisite

**Candidate formula found (not yet implementation-grade):**
```
Mệnh = ((tháng − giờ) + 1) mod 12   [normalize into 1–12: add 12 if the raw result is ≤ 0]
```
where `tháng` = lunar birth month (1–12), `giờ` = birth-hour branch index, both counted from a fixed
Dần(Tiger)=1 reference (i.e., the standard 12-branch counting order starting at Dần, not at Tý).

- **Starting palace:** Dần is index 1 in this formula's counting convention (not Tý=1) — this itself
  is a convention that must be confirmed against the selected primary source, not assumed universal.
- **Counting direction:** the source's prose description (independently, differently worded from the
  numeric-formula source) describes counting *forward* from Dần to the birth month to find a
  reference palace, then counting *backward* to the birth-hour branch for Mệnh.
- **Wraparound behavior:** "add 12 if the raw result is ≤ 0" is stated but not independently
  verified against a primary text for every boundary case (e.g., `tháng`=1, `giờ`=12 → raw result
  0 → wraps to 12; this specific case was not confirmed against VDTTL-1956/TD-TOANTHU).
- **Worked examples from independent references:** **none found.** The two sources cited
  (`SECONDARY-TVSG-MENH-THAN` for the formula, plus a second, independently-worded structural
  description) agree with each other in shape, but neither is a primary text, and neither supplies a
  full worked numeric example with a named birth date/time and its resulting Mệnh palace.

**Status: `DOMAIN_EXPERT_REQUIRED`** (`DECISION-04`). This is, as Sprint 15 itself found, the single
fastest item in the whole register to close — a domain expert could likely confirm or correct it in
one pass — but it has **not** been closed, and this pass does not manufacture that closure. **Do not
implement from this formula alone.**

---

## 8. Cung Thân

**Candidate formula (same source family as Mệnh, not independently re-verified against a primary
text, and explicitly not assumed to be Mệnh's simple inverse):**
```
Thân = ((tháng + giờ) − 1) mod 12   [normalize into 1–12: subtract 12 if the raw result is > 12]
```
The available sources describe Thân's direction as the mirror of Mệnh's (forward where Mệnh counts
backward) rather than stating outright "Thân = 13 − Mệnh" or any other purely arithmetic inverse —
this distinction matters because a purely-inverse assumption would be exactly the kind of
unverified shortcut this gate exists to prevent. **No worked example from an independent reference
was found for Thân any more than for Mệnh.** `golden-vector-specification.md`'s own property/
invariant list explicitly notes "Thân may coincide with Mệnh — that is a valid, named outcome," which
this formula's structure is consistent with (both reduce to the same palace under certain `tháng`/
`giờ` combinations), but this consistency was not independently confirmed against a primary source
either.

**Status: `DOMAIN_EXPERT_REQUIRED`** (`DECISION-04`, same item as Mệnh — the two are gated together).

---

## 9. 12 Cung — palace ordering and naming

Re-confirmed: the twelve named palaces per the product definition/roadmap and standard Tử Vi
structure —

```
Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc/Nô Bộc(Giao Hữu), Thiên Di, Tật Ách,
Tài Bạch, Tử Tức, Phu Thê, Huynh Đệ
```

**No source found in this session's research (nor in Sprint 15's) disputes the 12-palace layout,
naming, or fixed relative order itself** — unlike Cục/star-placement/Tứ Hóa, palace ordering is not
flagged anywhere in the decision register as a school-conflict point. **Status: `RESOLVED_BY_SOURCE`**
for the structural layout/naming/order — this is the one downstream-facing node, besides the
calendar layer, that does not block on a school selection. It does **not** by itself unblock palace
*contents* (which stars land in which palace), which remains gated by DECISION-06/07/08/09/10 above
it in the pipeline.

One naming variant is worth flagging explicitly (not previously called out in Sprint 15's own
documents in this exact form, found by this pass's re-reading): some sources render the sixth palace
as "Nô Bộc" (servants/subordinates) and others as "Giao Hữu/Nô Bộc" (friendships) — a naming/label
variant, not a structural-order dispute. This does not block implementation of the deterministic
engine (which only needs a stable internal palace identifier, not a specific UI label), but should be
locked as a copy decision once UI work begins, mirroring Eastern Horoscope's own Mão=Mèo/Cat
locale-copy precedent (a naming choice, not a domain-correctness gate).

---

## 10. Cục — HARD GATE

**Cannot currently be established with sufficient confidence. This gate is BLOCKED.**

- **Category structure (names/numbers), corroborated across many independent sites:** Thủy Nhị=2,
  Mộc Tam=3, Kim Tứ=4, Thổ Ngũ=5, Hỏa Lục=6.
- **Named methodology:** Cục = the Nạp Âm (compound "sound element") of the Can-Chi pair of the
  lunar month containing the Mệnh palace — cited to two primary sources (`VDTTL-1956`, `HLDP-1972`)
  via one secondary intermediary (`SECONDARY-TNT`).
- **Exactly one fully worked example found:** Bính-year, Mệnh at Dậu → Hỏa Lục Cục.
- **What is explicitly missing:** the complete lookup table — all combinations of Cung Mệnh branch
  (12 positions) × Can năm sinh (10 stems) → one of the five Cục values. One of the corroborating
  sources itself states the numeric assignment's "exact origins and theoretical justification...
  remain subjects of scholarly debate" even among practitioners — this is not merely an unresearched
  gap, it is a domain the sources themselves describe as unsettled at the derivation-mechanism level,
  even though the five output categories are well-known.
- **Dependency risk:** Cục also structurally depends on Cung Mệnh (§7, `DOMAIN_EXPERT_REQUIRED`) and,
  per the named methodology, on Nạp Âm (a calculation not otherwise required anywhere else in this
  pipeline, and explicitly **not** the same thing as Eastern Horoscope's `HEAVENLY_STEM_ELEMENT` —
  see §25's isolation check).

**Status: `UNSOURCED`** for the complete table; `CORROBORATING` only for category names/numbers and
methodology shape. Per this session's own governing instruction: **since this table cannot be
established with sufficient confidence, SPRINT 18 = BLOCKED on this gate specifically**, independent
of every other gate below it.

---

## 11. An Tử Vi (main-star anchor placement) — CRITICAL HARD GATE

**Cannot currently be established. This gate is BLOCKED — the single most important unresolved
artifact in the entire register, unchanged from Sprint 15.**

- **What is confirmed:** placement is structurally a function of (Cục, lunar birth day) — consistent
  with general Tử Vi tradition and not itself disputed.
- **What is explicitly missing:** a complete day-1-through-final-relevant-lunar-day × 5-Cục lookup
  table or algorithm, covering:
  - exact divisibility cases (where lunar day divides evenly into the Cục's cycle length),
  - remainder cases (the non-trivial forward/backward adjustment rule for non-exact divisions),
  - the forward/backward movement rule itself,
  - palace wraparound behavior at the 12-palace boundary.

  **None of these four sub-requirements were located or verified in Sprint 15's research, and this
  pass's re-reading confirms none has been added since.** No source in this project's research
  provides a mathematical shortcut/approximation for this placement that has itself been confirmed
  against a named primary source — and per this session's explicit instruction, an unconfirmed
  mathematical approximation is not an acceptable substitute for a source-backed table here.

**Status: `UNSOURCED`.** Every one of the 14 chính tinh (§12) is placed relative to this star's
position — nothing about the star layer can proceed while this remains unresolved. **SPRINT 18 =
BLOCKED on this gate.**

---

## 12. 14 Chính Tinh — CRITICAL HARD GATE

**Group structure (corroborated, useful for engine *design*, not sufficient for correctness):**

**Tử Vi group — 6 stars, walk in reverse (nghịch) direction from Tử Vi's own palace:**

| Star | Anchor/Offset | Direction | Wraparound | Source | Dependencies | Status |
|---|---|---|---|---|---|---|
| Tử Vi | 0 (anchor) | — | — | `SECONDARY-14STARS-STRUCTURE` | Cục + lunar day (§11) | `UNSOURCED` (anchor itself unresolved) |
| Thiên Cơ | reported "one position apart" — exact anchor-relative offset not confirmed | reverse | not verified | same | Tử Vi anchor | `UNSOURCED` |
| Thái Dương | not stated | reverse | not verified | — | Tử Vi anchor | `UNSOURCED` |
| Vũ Khúc | not stated | reverse | not verified | — | Tử Vi anchor | `UNSOURCED` |
| Thiên Đồng | reported "two positions apart" (from an adjacent star, not confirmed anchor-relative) | reverse | not verified | same | Tử Vi anchor | `UNSOURCED` |
| Liêm Trinh | not stated | reverse | not verified | — | Tử Vi anchor | `UNSOURCED` |

**Thiên Phủ group — 8 stars, walk forward (thuận) from Thiên Phủ's palace, itself fixed in mirror
relationship to Tử Vi across the Tị/Hợi axis:**

| Star | Anchor/Offset | Direction | Wraparound | Source | Dependencies | Status |
|---|---|---|---|---|---|---|
| Thiên Phủ | 0 (anchor, mirrored from Tử Vi) | — | — | `SECONDARY-14STARS-STRUCTURE` | Tử Vi anchor (§11) | `UNSOURCED` |
| Thái Âm | not stated | forward | not verified | — | Thiên Phủ anchor | `UNSOURCED` |
| Tham Lang | not stated | forward | not verified | — | Thiên Phủ anchor | `UNSOURCED` |
| Cự Môn | not stated | forward | not verified | — | Thiên Phủ anchor | `UNSOURCED` |
| Thiên Tướng | not stated | forward | not verified | — | Thiên Phủ anchor | `UNSOURCED` |
| Thiên Lương | not stated | forward | not verified | — | Thiên Phủ anchor | `UNSOURCED` |
| Thất Sát | reported "three positions apart" (exact anchor-relative offset not confirmed) | forward | not verified | same | Thiên Phủ anchor | `UNSOURCED` |
| Phá Quân | not stated | forward | not verified | — | Thiên Phủ anchor | `UNSOURCED` |

**What this structure IS useful for:** confirming the engine's internal representation should be two
independent directional "walk" loops from two mirrored anchors, not 14 unrelated lookup rules — a
real, reusable architecture finding. **What it cannot do:** produce a single correct chart. Every
offset in both tables above remains `UNSOURCED`.

**Empty-palace (vô chính diệu) handling:** confirmed as a known, expected, named outcome of a
correctly-run placement algorithm (not a bug) — but the specific downstream handling/interpretation
rule for it was not sourced. `Status: UNSOURCED`.

**Status: `UNSOURCED` for the complete offset table, blocking on §11's anchor resolution first.
SPRINT 18 = BLOCKED on this gate.**

---

## 13. Auxiliary star MVP

**The candidate 13-star MVP list itself remains unconfirmed as canonical**, not just its placement
rules — re-verified from the product definition's own §4D framing, unchanged: "this set is not
invented here — it must be confirmed against the authoritative source chosen... not assumed correct
because it appears in this list."

| Star | Confirmed as a recognized "load-bearing" star? | Placement rule found? | Depends on | Status |
|---|---|---|---|---|
| Tả Phù | Yes — part of the standard "6 auspicious stars" set | No | lunar month (typical pattern, not confirmed) | `UNSOURCED` |
| Hữu Bật | Yes — same set | No | lunar month (typical pattern, not confirmed) | `UNSOURCED` |
| Văn Xương | Yes — same set | No | birth hour (typical pattern, not confirmed) | `UNSOURCED` |
| Văn Khúc | Yes — same set | No | birth hour (typical pattern, not confirmed) | `UNSOURCED` |
| Thiên Khôi | Yes — same set | No | year Stem (typical pattern, not confirmed) | `UNSOURCED` |
| Thiên Việt | Yes — same set | No | year Stem (typical pattern, not confirmed) | `UNSOURCED` |
| Địa Không | Not independently confirmed this session | No | birth hour (typical pattern, not confirmed) | `UNSOURCED` |
| Địa Kiếp | Not independently confirmed this session | No | birth hour (typical pattern, not confirmed) | `UNSOURCED` |
| Lộc Tồn | Not independently confirmed this session | No | year Stem (typical pattern, not confirmed) | `UNSOURCED` |
| Kình Dương | Not independently confirmed this session | No | Lộc Tồn's palace (typical pattern, not confirmed) | `UNSOURCED` |
| Đà La | Not independently confirmed this session | No | Lộc Tồn's palace (typical pattern, not confirmed) | `UNSOURCED` |
| Hỏa Tinh | Not independently confirmed this session | No | year Branch (typical pattern, not confirmed) | `UNSOURCED` |
| Linh Tinh | Not independently confirmed this session | No | year Branch (typical pattern, not confirmed) | `UNSOURCED` |

**Important:** the "Depends on" column above states the *typical, commonly-described* dependency
category for each star in the broader Tử Vi literature as background context for engine design —
**it is explicitly not a sourced rule**, and no placement formula for any star in this table may be
implemented from it. This distinction is stated here precisely so it is not later mistaken for a
resolved dependency. **No AI-generated placement rule is acceptable for any of these 13 stars**,
consistent with this session's own hard instruction.

**Status: `UNSOURCED` for every star's placement rule and for the MVP list's own completeness.**

---

## 14. Tuần

- **Input:** which "Tuần Giáp" (decade group within the 60-year sexagenary cycle) the birth year
  falls into.
- **Algorithm/table:** not located — the specific decade-group → palace-pair mapping was not found
  in Sprint 15's research and has not been added since.
- **Two affected palaces:** confirmed structurally (Tuần always affects exactly 2 palaces), but which
  2 for a given Tuần-Giáp group is unresolved.
- **Boundary:** N/A — no boundary case can be tested without the table itself.
- **Source:** `SECONDARY-TUANTRIET-BASIS` for the input-basis claim only.
- **Independently verifiable examples:** none found.

**Status: `UNSOURCED`** for the lookup table; `RESOLVED_BY_SOURCE` only for the narrow structural
claim that Tuần uses a Tuần-Giáp-group input.

---

## 15. Triệt

**Confirmed explicitly NOT interchangeable with Tuần's logic**, per `SECONDARY-TUANTRIET-BASIS`:

- **Input:** the birth year's Heavenly Stem (Can) alone — a different input basis from Tuần's
  decade-group input.
- **Algorithm/table:** not located — the specific Can → palace-pair mapping was not found.
- **Two affected palaces:** confirmed structurally (Triệt always affects exactly 2 palaces,
  independently positioned from Tuần's pair — up to 4 total palaces affected across both).
- **Boundary:** N/A — same reason as Tuần.
- **Source:** `SECONDARY-TUANTRIET-BASIS`.
- **Independently verifiable examples:** none found.

**Status: `UNSOURCED`** for the lookup table; `RESOLVED_BY_SOURCE` only for the narrow structural
claim that Triệt's input basis differs from Tuần's.

---

## 16. Tứ Hóa — HARD GATE

**Confirmed real, named, sourced school conflict — the single clearest conflict in the entire
register, unchanged from Sprint 15 and re-verified by this pass's re-reading, not merely repeated.**

- **Bắc Phái (Northern School):** treats Tứ Hóa as the structural core of the entire reading method.
- **Nam Phái (Southern School) / Trung Châu lineage:** derives Tứ Hóa placement from the birth-year
  Heavenly Stem, with one specific named high-accuracy reference identified: *"Tử vi đẩu số toàn tập
  - Trung Châu phái - Lục Bân Triệu - Khâm Thiên môn."*
- **Source's own words, quoted directly, not paraphrased:** *"the different schools of Tử Vi Đẩu Số
  often do not have unified views"* on this specific rule.
- **No 10-Can × 4-Hóa (Lộc/Quyền/Khoa/Kỵ) table was extracted or verified in Sprint 15's research,
  and none has been added since.** Extracting one before DECISION-01 (school selection, §4 above) is
  resolved would risk building the wrong school's table outright — this pass did not attempt to
  produce a "best guess" table to avoid that exact risk.

**Status: `DOMAIN_EXPERT_REQUIRED`, blocked on `DECISION-01` first.** No incompatible mappings have
been mixed — there is, correctly, no table at all yet, precisely to prevent that failure mode.
**SPRINT 18 = BLOCKED on this gate.**

---

## 17. Vận cycles

Re-checked against the roadmap and product definition: **Đại Hạn / Tiểu Hạn / Lưu Niên remain
correctly deferred to Sprint 22 ("Vận Depth")**, per Roadmap V2's own sequencing. This pass did not
expand Sprint 18's scope to include them, consistent with the explicit instruction not to do so
merely because sources might exist.

**Status: `DEFERRED_TO_SPRINT_22`.**

---

## 18. Canonical data model — spec only, not implemented

Not built (per instruction — spec only). The shape recommended by the existing Sprint 15
`calculation-specification.md` §14 and this pass's own re-confirmation is sufficient to represent,
conceptually:

```
Chart
  CalendarFacts       { solarBirthDate, resolvedTimezone(UTC+7), lunarDate, leapFlag }
  CanChiFacts          { canNam, chiNam, canThang, chiThang, canNgay, chiNgay, canGio, chiGio }
  Palaces[12]          { each: label, position, occupants: MainStar[], AuxStar[] }
  BodyPalace           (Cung Thân — may coincide with Mệnh)
  Cuc                  (one of 5 named values)
  MainStars[14]        { star, palace }
  AuxiliaryStars[]      { star, palace }
  Tuan                 { affectedPalaces[2] }
  Triet                { affectedPalaces[2] }
  Transformations       { hoaLoc, hoaQuyen, hoaKhoa, hoaKy — each tied to a star+palace }
  EngineVersions        { tuviEngineVersion, calendarVersion, starRulesetVersion }
  SourceTrace           { ruleId, rulesetVersion, sourceId — per deterministic fact }
```

Every deterministic fact traces to a `ruleId`/`rulesetVersion`/`sourceId` triple, matching the
existing versioning discipline already shipped for Numerology and Eastern Horoscope. **No prose
interpretation belongs in this structure** — interpretation is a strictly separate, later, AI-read-
only layer (§24). This section is unchanged in substance from `calculation-specification.md` §14; it
is restated here for this document's own completeness, not because anything new was designed.

---

## 19. Engine versioning

Confirmed/refined, unchanged from `calculation-specification.md` §9:

| Version | Increments when |
|---|---|
| `TUVI_ENGINE_VERSION` | Any change to the overall calculation pipeline/orchestration |
| `CALENDAR_VERSION` | Any change to the solar↔lunar algorithm/library, leap-month handling, or the giờ Tý/day-boundary resolution once `DECISION-02` closes |
| `STAR_RULESET_VERSION` | Any change to Cục, main/auxiliary star placement, Tuần/Triệt, or Tứ Hóa — including switching which cited source a table derives from |

A calculated chart must persist all three; a future rule change must never silently mutate a
historical chart's already-displayed result — mirrors the pattern already shipped for Numerology and
Eastern Horoscope (`EASTERN_HOROSCOPE_ENGINE_VERSION`/`_CALENDAR_VERSION`/`_RULESET_VERSION`,
directly inspected in this session's own prior Sprint 17 closure pass).

---

## 20. Golden vector program

**Re-audited from `golden-vector-specification.md` directly, not regenerated from any engine (none
exists).** Target: ~12–15 unique, purposefully-covering vectors — unchanged from the product
definition's own §7 target, restated in Sprint 15's spec.

**Current count: 0.** Every row of the required-coverage checklist in `golden-vector-specification.md`
(normal date, leap lunar month, lunar-year boundary, 22:59/23:00 boundary, 23:59/00:00 boundary, all
12 birth-hour branches, all 5 Cục values, distinct Tử Vi placements, star-wraparound/dense-palace
case, Tuần case, Triệt case, each Tứ Hóa pattern, multiple Can, multiple Chi) is marked "Not yet
sourced" in that document, and this pass found no new vector sourced since. **Zero vectors exist to
double-count or under-count — there is nothing to reconcile, unlike Eastern Horoscope's 17-vs-12
discrepancy, which arose from a populated table. Here the table is genuinely empty.**

The one closest-to-a-vector artifact that exists is `SECONDARY-TNT`'s single worked Cục example
(Bính-year, Mệnh at Dậu → Hỏa Lục Cục) — this is **explicitly not a qualifying golden vector**: it
covers exactly one field (Cục), has no second independent reviewer, and its source is `SECONDARY`,
not a primary text. Per `golden-vector-specification.md`'s own explicit rule, this should be recorded
as `UNVERIFIED` for every other field of a chart, not silently filled in from assumption.

**Independence requirement, re-checked:** the specification's own source policy (descending
preference: a worked example from the selected primary text, independently transcribed and reviewed
by two people; a practitioner's own published worked example with shown work; a domain expert
specifically engaged for this project) remains unmet for every candidate. **Not acceptable, and
explicitly ruled out already:** any single calculator website's raw output, any single open-source
library's output (including `iztro`, explicitly named as comparison-only, never a source of rules),
any AI-generated chart (including a future BeaconVie engine's own output, which would be circular).

**Status: 0 of the ~12–15 target vectors exist. SPRINT 18 = BLOCKED on this gate.**

---

## 21. Independence requirement — re-affirmed

Restated, not weakened: expected golden values must never come from the future BeaconVie engine, a
copied external implementation, an AI-generated calculation, or the same formula being tested against
itself. Preferred provenance chain: primary/reference text → independent established chart/calculator
cross-check → manual reviewer, with provenance recorded per vector. No exception was carved out by
this pass.

---

## 22. Tử Vi An Sao Logic Audit gate — formalized (re-confirmed, not re-run)

This is the exact gate `an-sao-logic-audit.md` already formalizes for Sprint 19 (post-engine). It is
**not run for real in this pass** (there is no engine yet — running it now would be meaningless, per
that document's own framing) but its current baseline is re-confirmed here against this pass's own
independent re-reading, item by item:

| # | Item | Status (would this PASS today if an engine existed?) |
|---|---|---|
| 1 | Solar → lunar | Would likely `PASS` once wired — `RESOLVED_BY_SOURCE` |
| 2 | Leap lunar month (Tử-Vi treatment) | `DOMAIN_REFERENCE_REQUIRED` |
| 3 | UTC+7 | Would likely `PASS` — `RESOLVED_BY_SOURCE` |
| 4 | Giờ Tý boundary | `DOMAIN_REFERENCE_REQUIRED` |
| 5 | Can Chi | `PASS` for mechanics once calendar layer is trusted; `DOMAIN_REFERENCE_REQUIRED` for tháng/giờ derivation methods |
| 6 | Cung Mệnh | `DOMAIN_REFERENCE_REQUIRED` |
| 7 | Cung Thân | `DOMAIN_REFERENCE_REQUIRED` |
| 8 | Cục | `DOMAIN_REFERENCE_REQUIRED` |
| 9 | 12 Cung (layout) | Would likely `PASS` — `RESOLVED_BY_SOURCE` |
| 10 | Tử Vi placement | `DOMAIN_REFERENCE_REQUIRED` |
| 11 | 14 Chính Tinh | `DOMAIN_REFERENCE_REQUIRED` |
| 12 | Auxiliary stars | `DOMAIN_REFERENCE_REQUIRED` |
| 13 | Tuần/Triệt | `DOMAIN_REFERENCE_REQUIRED` |
| 14 | Tứ Hóa | `DOMAIN_REFERENCE_REQUIRED` |

**Current gate status: 3 of 14 items would plausibly `PASS` (solar→lunar, UTC+7, 12-palace layout),
assuming correct implementation of already-resolved layers. 11 of 14 require
`DOMAIN_REFERENCE_REQUIRED`.** Identical to Sprint 15's own baseline — unchanged because nothing has
moved. **No item is marked `PASS` merely because a hypothetical engine "would run without an
exception."**

---

## 23. Adversarial domain review

Deliberately attempting to break the specification as it currently stands:

| Attack | Finding |
|---|---|
| Off-by-one palace indexing | Cannot be tested — no anchor table exists yet (§11), so no indexing convention has been implemented to attack. **Risk flagged for Sprint 19's gate, not resolved here.** |
| Clockwise/counter-clockwise inversion | The two-group structure (§12) already names explicit directions (Tử Vi group reverse/nghịch, Thiên Phủ group forward/thuận) — a naive implementer could plausibly invert one or both groups' direction if not careful. **This is exactly the kind of error the missing offset table would silently mask** — flagging this as the top adversarial risk once implementation begins, specifically because "the structure is known but the exact values aren't" is a dangerous middle state (confident-sounding, actually unverified). |
| Lunar vs. solar month confusion | The pipeline (§3) is explicit that Mệnh/Thân/Cục/star placement all key off the **lunar** month/day, never solar — but `DECISION-03` (leap-month Tử-Vi treatment) remains open specifically because it's unclear which lunar month index a leap-month birth should present as an input. This is a real, live risk surface, not hypothetical. |
| Leap-month ambiguity | Same as above — `DECISION-03`, `UNSOURCED`. |
| 23:00 date rollover | Directly `DECISION-02`'s `CONFLICT` — the two named giờ Tý conventions disagree on exactly this. |
| Can vs. Chi confusion | Not found as a live risk in the sourced material itself (the Stem/Branch distinction is consistently and correctly maintained across every document reviewed), but worth naming as a standing implementation-time risk given how many downstream tables reference "Can năm" vs. "Chi năm" independently (Cục keys off Can năm specifically, per §10; Triệt keys off Can alone per §15). |
| Modulo-12 errors | The one concrete formula available (Mệnh/Thân, §7/§8) already documents its own wraparound edge cases (raw result ≤ 0 or > 12) — but neither has been checked against a primary source for every boundary value, so a subtly-wrong modulo implementation could pass casual testing while being wrong at the edges. Flagged as a specific Sprint 19 golden-vector requirement: boundary-value `tháng`/`giờ` combinations, not just typical ones. |
| 0-based vs. 1-based lunar day | The Tử Vi placement gate (§11) explicitly requires resolving "exact divisibility cases" and "remainder cases" — a 0-based/1-based mismatch is precisely the kind of error that would silently misfire on divisibility-boundary lunar days first. Cannot be tested without the table; flagged for Sprint 19. |
| Wrong Cục numeric value | The five Cục *names and numbers* (Thủy Nhị=2, Mộc Tam=3, Kim Tứ=4, Thổ Ngũ=5, Hỏa Lục=6) are well-corroborated and low-risk on their own — the risk is entirely in the *derivation table* (which Mệnh-branch × Can-năm combination produces which of the five), which is `UNSOURCED` (§10). |
| Incorrect Tử Vi remainder rule | Directly the open question in §11 — cannot be adversarially tested without the rule existing; flagged as the highest-leverage single item to get right, given every one of the 14 chính tinh depends on it. |
| Main-star group inversion | If the Tử Vi group's 6 stars were accidentally placed using the Thiên Phủ group's forward/thuận direction (or vice versa), the resulting chart would look structurally plausible (12 palaces, populated stars) while being systematically wrong — this is the single most dangerous *silent* failure mode identified in this review, precisely because it would not throw an error or look obviously broken. Sprint 19's golden-vector gate must specifically include at least one vector chosen to make this exact inversion produce a visibly wrong (not just subtly wrong) result. |
| Tứ Hóa school mixing | Explicitly guarded against by this document's own refusal to produce a table before `DECISION-01`/`DECISION-10` resolve (§16) — the adversarial finding here is procedural, not technical: the real risk is a future implementer under schedule pressure picking "whichever 10-Can×4-Hóa table shows up first in a search," which is exactly the failure mode `SECONDARY-TUHOA-SCHOOLS` warns against by name. |
| Tuần/Triệt pair inversion | `SECONDARY-TUANTRIET-BASIS` already confirms these use *different input bases* (Tuần: Tuần-Giáp decade group; Triệt: Can năm alone) — a future implementer conflating the two into one shared lookup mechanism would be a real, plausible, silent bug given how similar the two concepts sound in English ("Void"/"Cutoff" translations are often used interchangeably in casual English-language material). Flagged explicitly. |
| Vietnamese zodiac naming leaking from Eastern Horoscope | Checked directly (§25) — no such leak currently exists in code (there is no Tử Vi code yet), but this is flagged as an ongoing implementation-time risk given the superficial similarity between Eastern Horoscope's `BRANCH_ANIMAL` (Mão=Mèo/Cat) and any future Tử Vi branch-naming table — these must remain textually and structurally separate even if the underlying 12-branch names are identical (they are the same branches, correctly; the *risk* is accidentally importing Eastern Horoscope's TypeScript module rather than re-declaring an independent, separately-versioned Tử Vi table). |
| Nạp Âm accidentally reused as Tử Vi Cục | **This is not a hypothetical risk — it is the actual named DECISION-05 methodology itself:** Cục's leading candidate derivation *is* Nạp Âm of the Can-Chi of the month containing Mệnh. This is explicitly **not** the same thing as Eastern Horoscope's `HEAVENLY_STEM_ELEMENT`, which was deliberately chosen specifically to **exclude** Nạp Âm (`eastern-horoscope-rules.md` §0: "Nạp Âm is explicitly excluded from the V1 canonical element and must never be silently substituted for it"). The adversarial risk is the inverse direction: a future implementer, having just built Eastern Horoscope's simple Stem-element system, might be tempted to reuse it for Tử Vi's Cục calculation because both involve "an element from a Can-Chi pair" — this would be **domain-wrong**: Tử Vi's Cục (if the named methodology is confirmed) needs the full 60-cell Nạp Âm compound-element table, a calculation Eastern Horoscope's engine does not implement or expose. **This must be built as its own, separately named, separately sourced, separately versioned table if and when DECISION-05 resolves — never derived from or aliased to Eastern Horoscope's engine.** |

---

## 24. AI boundary — locked, re-stated verbatim as a hard rule

**AI must never calculate:** lunar calendar, Can Chi, Mệnh, Thân, Cục, palace placement, star
placement (main or auxiliary), Tuần, Triệt, Tứ Hóa, vận cycles (once in scope). AI may only interpret
already-produced canonical deterministic facts, strictly after the engine produces them — never
before, never in place of a missing fact. **If deterministic calculation fails or is incomplete for
any required field, the system must fail visibly** (`INCOMPLETE_CANONICAL_CHART`, per
`calculation-specification.md` §8/§10) — never silently ask Gemini/OpenAI/any provider to fill a
missing chart fact with plausible-sounding prose. This mirrors, and does not weaken, the identical
rule already enforced and verified for Tarot/Numerology/Natal Chart/Eastern Horoscope (directly
confirmed working-as-designed for Eastern Horoscope in this session's own prior Sprint 17 closure
pass, §17 of that report).

---

## 25. Eastern Horoscope isolation

**Audited directly against the actual Eastern Horoscope source** (`apps/api/src/eastern-horoscope/
engine/*.ts`, read in full during this session's own prior Sprint 17 closure pass) rather than
inferred:

- Eastern Horoscope's zodiac-year determination (`getLunarYearForGregorianDate`,
  `EASTERN_HOROSCOPE_YEAR_BOUNDARY = 'LUNAR_NEW_YEAR'`) is a **year-level-only** calendar boundary
  rule. Tử Vi needs the same underlying solar↔lunar *conversion algorithm* (Hồ Ngọc Đức, `DECISION-
  03B`) but a **different, more granular, currently-unresolved boundary rule** (giờ Tý, day-level,
  `DECISION-02`) — these must not be conflated. Reusing the calendar *conversion function* is
  architecturally sound (same underlying math); reusing Eastern Horoscope's *year-boundary decision*
  for Tử Vi's *day/hour-boundary decision* would be a domain error, and no code currently does this
  (there is no Tử Vi code).
- Eastern Horoscope's `STEM_ELEMENT` (`HEAVENLY_STEM_ELEMENT`, simple Stem→element mapping) is
  **explicitly and deliberately not** Nạp Âm — confirmed by that module's own locked-decision comment
  (§0 of `eastern-horoscope-rules.md`: "Nạp Âm is explicitly excluded from the V1 canonical element").
  Tử Vi's Cục, if `DECISION-05` ever resolves via the named methodology, needs Nạp Âm specifically —
  the *opposite* of what Eastern Horoscope deliberately excluded. **These must never be substituted
  for each other** (see §23's adversarial finding on this exact risk).
- Eastern Horoscope's "Year Energy" relationship (generates/is-generated-by/controls/is-controlled-by/
  same) is a Five-Elements-cycle lookup between two already-fixed elements — a general, reusable
  *mechanism* (the generating/controlling cycle itself is the same standard Ngũ Hành cycle in both
  domains), but its specific *application* (birth-year element vs. current-year element) is Eastern-
  Horoscope-specific framing, not a Tử Vi concept, and must not be presented as if it were a Tử Vi
  fact.
- **Repo-wide grep confirms zero shared code path currently exists** between the two (there is no
  Tử Vi code yet to share one with) — this section is a forward-looking guardrail for Sprint 18
  implementation, not a finding of an existing violation.
- **Shared calendar primitives may be reused only if mathematically identical and separately
  validated** — per this session's own instruction. The Hồ Ngọc Đức solar→lunar conversion function
  itself is a legitimate candidate for direct reuse (same math, same UTC+7 meridian, same algorithm
  family already vetted for both domains independently in Sprint 15's own research) — but the
  *domain engines* built on top of it (Eastern Horoscope's engine vs. a future Tử Vi engine) must
  remain architecturally and namespace-distinct modules, matching the existing `apps/api/src/
  eastern-horoscope/` vs. a future `apps/api/src/tu-vi/` separation the audit's own architecture
  section (§9 of `sprint-15-pre-implementation-audit.md`, if such a document exists — confirmed it
  does not need restating here, already covered by `calculation-specification.md` §15's "not a
  retrofit of Natal Chart's or Numerology's schema" instruction, extended here to Eastern Horoscope
  by the same logic).

---

## 26. Source quality matrix

| Rule | Primary source | Secondary source | Conflict? | Selected rule | Confidence | Implementation allowed? |
|---|---|---|---|---|---|---|
| School/tradition | VDTTL-1956 / TD-TOANTHU (named, not read) | Bắc Phái / Nam Phái (named) | **Yes — real** | None selected | Low (existence confirmed, content not) | **No** |
| Giờ Tý boundary | None read | `SECONDARY-GIOTY` (two named conventions) | **Yes — real** | None selected | Low | **No** |
| Leap-month Tử-Vi treatment | None found | None found | Not demonstrated (simply absent) | None | None | **No** |
| Can Chi mechanics (năm/ngày) | None read directly | Standard sexagenary arithmetic, widely agreed | No | Standard method | High (mechanics only) | Yes, mechanics only — inputs still gated |
| Can Chi (tháng/giờ derivation) | None read | Named as "standard method," not verified | Not demonstrated | None confirmed | Low | **No** |
| Cung Mệnh/Thân formula | None read | `SECONDARY-TVSG-MENH-THAN` + one corroborating description | No (sources agree with each other) | Candidate only | Medium-low (2 secondary sources agree, neither primary) | **No** |
| Cục table | VDTTL-1956 / HLDP-1972 (named, not read) | `SECONDARY-TNT` (1 worked example) | Not demonstrated as school conflict, but table absent | None | Low | **No** |
| Tử Vi anchor placement | None read | `SECONDARY-14STARS-STRUCTURE` (structure only) | Not demonstrated | None | Low | **No** |
| 13 remaining chính tinh offsets | None read | `SECONDARY-14STARS-STRUCTURE` (partial offsets) | Not demonstrated | None | Low | **No** |
| Auxiliary star placements (13 stars) | None read | `SECONDARY-AUXSTARS-MEANINGS` (meanings only, zero placement) | Not demonstrated | None | Very low | **No** |
| Tuần table | None found | `SECONDARY-TUANTRIET-BASIS` (input basis only) | Not demonstrated | None | Low | **No** |
| Triệt table | None found | `SECONDARY-TUANTRIET-BASIS` (input basis only) | Not demonstrated | None | Low | **No** |
| Tứ Hóa table | Trung Châu/Lục Bân Triệu lineage (named, not read) | `SECONDARY-TUHOA-SCHOOLS` (confirms Bắc/Nam split) | **Yes — real, explicit** | None selected | Low | **No** |
| 12-palace layout/order | None read directly | Consistent across all sources reviewed, no dispute found | No | Standard layout | Medium-high (no conflict found, but not primary-text-verified) | Yes, structural layout only |

**No rule above became "Implementation allowed" merely because two secondary websites agreed** —
every "Yes" in the rightmost column is limited to a narrow, non-Tử-Vi-specific structural claim
(calendar mechanics, palace ordering), never a school-disputed calculation cell.

---

## 27. Implementation readiness matrix

| Component | Status | Exact reason |
|---|---|---|
| Calendar (solar→lunar, UTC+7, leap-month astronomy) | **READY** | `RESOLVED_BY_SOURCE`, same algorithm already validated and shipped for Eastern Horoscope |
| Calendar (giờ Tý / day-boundary) | **BLOCKED** | `CONFLICT` — two named, real, unresolved conventions |
| Can Chi (năm/ngày mechanics) | **READY** (mechanics only) | Standard, non-disputed arithmetic once inputs are valid |
| Can Chi (tháng/giờ derivation) | **BLOCKED** | Method named but not independently re-verified |
| Cung Mệnh | **BLOCKED** | `DOMAIN_EXPERT_REQUIRED` — candidate formula unconfirmed against a primary source |
| Cung Thân | **BLOCKED** | Same as Mệnh |
| Cục | **BLOCKED** | `UNSOURCED` — complete table not extracted; hard gate |
| 12 Cung (layout) | **READY** | `RESOLVED_BY_SOURCE`, no conflict found |
| Tử Vi (anchor placement) | **BLOCKED** | `UNSOURCED` — critical hard gate |
| 14 Chính Tinh (offsets) | **BLOCKED** | `UNSOURCED` — depends on Tử Vi anchor; critical hard gate |
| Auxiliary Stars | **BLOCKED** | `UNSOURCED` — even the MVP list itself unconfirmed |
| Tuần | **BLOCKED** | `UNSOURCED` — table absent |
| Triệt | **BLOCKED** | `UNSOURCED` — table absent |
| Tứ Hóa | **BLOCKED** | `DOMAIN_EXPERT_REQUIRED`/real school conflict; hard gate |
| Golden Vectors | **BLOCKED** | 0 of ~12–15 target vectors exist; independence requirement unmet for every candidate |

**READY: 3 (calendar-astronomy, Can Chi mechanics, 12-palace layout — all structural/mechanical, none
Tử-Vi-school-specific). BLOCKED: 11.** Zero components are `DEFERRED` in this matrix (vận cycles are
out-of-scope by design, not "blocked," and are tracked separately in §17).

---

## 28. Stop conditions — checked explicitly against this pass's own findings

| # | Condition | Triggered? |
|---|---|---|
| A | Selected Tử Vi school | **Yes — unresolved** (§4) |
| B | Giờ Tý convention required by MVP | **Yes — unresolved, real conflict** (§5) |
| C | Mệnh/Thân placement | **Yes — unresolved** (§7/§8) |
| D | Cục table | **Yes — unresolved** (§10) |
| E | Tử Vi placement table/algorithm | **Yes — unresolved** (§11) |
| F | 14 Chính Tinh placement | **Yes — unresolved** (§12) |
| G | MVP auxiliary-star placement | **Yes — unresolved** (§13) |
| H | Tuần/Triệt | **Yes — unresolved** (§14/§15) |
| I | Tứ Hóa mapping | **Yes — unresolved, real conflict** (§16) |
| J | Sufficient independent golden vectors | **Yes — zero exist** (§20) |

**All ten stop conditions are triggered.** None were worked around with an assumption. Implementation
readiness (§27) independently corroborates the same conclusion component-by-component.

---

## 29. Documentation output

**No edit was made to any Sprint 15 domain file** (`authoritative-sources.md`,
`domain-decision-register.md`, `calculation-specification.md`, `star-placement-rules.md`,
`golden-vector-specification.md`, `an-sao-logic-audit.md`) — this pass's re-reading confirmed every
one of them is still accurate and current, not stale, so no correction was needed and none was
invented merely to demonstrate activity. This document (`docs/audit/sprint-18-pre-implementation-
audit.md`) is the sole new file, created fresh, preserving every historical unresolved decision
exactly as Sprint 15 recorded it rather than rewriting history to make that earlier uncertainty
disappear.

---

## 30. Git rules compliance

Documentation only. No file under `apps/api/**`, `apps/web/**`, `packages/**`, `prisma/**`,
`migrations/**`, `package.json`, or any lockfile was created, modified, or would need to be — no
documentation-build mechanism required a non-domain metadata update this session, so no such action
was taken or needs to be reported/stopped-for. Nothing staged. Nothing committed. Nothing pushed —
verified explicitly in §41 below.

---

## 31. Final report

1. **HEAD:** `cfe0824d01a6d681011be10845dfd18fac113274`
2. **origin/master:** `c1c8b8f916a959c62fab1d45328ba3eabcf902e7`
3. **Ahead/behind:** 1 ahead / 0 behind
4. **Working tree:** clean at session start and end (`git status --short` empty before this
   document's own creation; see §41 for the post-creation state)
5. **Selected Tử Vi school:** **None.** Strongest unselected candidate: Vân Đằng Thái Thứ Lang, *Tử
   Vi Đẩu Số Tân Biên* (1956).
6. **Authoritative primary source:** Not yet designated as authoritative — `VDTTL-1956` and
   `TD-TOANTHU` both identified as candidates, neither read in full, neither selected.
7. **Calendar status:** `RESOLVED_BY_SOURCE` for solar↔lunar conversion, UTC+7, leap-month astronomy
   (Hồ Ngọc Đức algorithm). `UNSOURCED`/`CONFLICT` for the Tử-Vi-specific leap-month treatment and
   giờ Tý boundary respectively.
8. **Giờ Tý status:** `CONFLICT` — two named, real, unresolved conventions ("Giờ Tý Sơ" vs. "Giờ Tý
   Chính").
9. **Can Chi status:** `RESOLVED_BY_SOURCE` for năm/ngày mechanics once calendar inputs are valid;
   `DOMAIN_REFERENCE_REQUIRED` for tháng/giờ derivation methods (named but not independently
   re-verified).
10. **Mệnh status:** `DOMAIN_EXPERT_REQUIRED` — strong candidate formula, not primary-source-verified.
11. **Thân status:** `DOMAIN_EXPERT_REQUIRED` — same gate as Mệnh, not assumed to be its simple
    inverse.
12. **Cục status:** `UNSOURCED` — methodology named (Nạp Âm of Can-Chi of the month containing Mệnh),
    complete table not extracted. Hard gate, unresolved.
13. **12 Cung status:** `RESOLVED_BY_SOURCE` — layout/order/naming not disputed by any source found.
14. **Tử Vi placement status:** `UNSOURCED` — critical hard gate, unresolved.
15. **14 Chính Tinh status:** `UNSOURCED` for all 13 non-anchor offsets — group structure corroborated,
    exact values not. Critical hard gate, unresolved.
16. **Auxiliary-star status:** `UNSOURCED` for every one of the 13 candidate MVP stars; the MVP list
    itself is also unconfirmed as canonical.
17. **Tuần status:** `UNSOURCED` — input basis confirmed (Tuần-Giáp decade group), lookup table absent.
18. **Triệt status:** `UNSOURCED` — input basis confirmed (Can năm alone, different from Tuần), lookup
    table absent.
19. **Tứ Hóa status:** `DOMAIN_EXPERT_REQUIRED` — real, named, explicit Bắc Phái/Nam Phái school
    conflict, unresolved. Hard gate.
20. **Vận scope:** `DEFERRED_TO_SPRINT_22` for Đại Hạn/Tiểu Hạn/Lưu Niên — correctly not expanded into
    Sprint 18.
21. **Canonical representation status:** Spec-only design produced (§18), not implemented — sufficient
    to guide future implementation once domain gates clear.
22. **Versioning status:** `TUVI_ENGINE_VERSION`/`CALENDAR_VERSION`/`STAR_RULESET_VERSION` scheme
    confirmed/restated, unchanged from Sprint 15, not yet implemented (no code exists).
23. **Unique golden-vector count:** **0.**
24. **Golden-vector provenance:** N/A — none exist. Independence requirement (primary text →
    independent cross-check → manual reviewer) remains unmet for every candidate found.
25. **Leap-month coverage:** 0% — no golden vector exists; the Tử-Vi-specific leap-month convention
    itself (`DECISION-03`) is also unresolved, so no vector could be correctly authored yet even if
    sourcing existed.
26. **Hour-boundary coverage:** 0% — no golden vector exists; blocked additionally on `DECISION-02`.
27. **Cục coverage:** 0 of 5 Cục values has a verified golden vector; only 1 informal worked example
    exists (Hỏa Lục, via `SECONDARY-TNT`), not qualifying per the independence requirement.
28. **Tử Vi remainder coverage:** 0% — the underlying placement rule itself does not exist yet to be
    tested against.
29. **Star-wrap coverage:** 0% — same reason.
30. **Tứ Hóa 10-Stem coverage:** 0 of 10 Heavenly Stems has a verified transformation mapping; the
    table itself does not exist (blocked on school selection).
31. **Source conflicts:** Three explicit, named, real conflicts found and re-confirmed: (a) school/
    tradition (§4), (b) giờ Tý boundary convention (§5), (c) Tứ Hóa Bắc Phái vs. Nam Phái mapping
    (§16). None resolved by this pass; none worked around by silent combination.
32. **Source-quality findings:** See full matrix, §26. No rule was marked "Implementation allowed"
    on secondary-source popularity alone; only narrow, non-school-specific structural claims
    (calendar mechanics, palace layout) qualify.
33. **Adversarial-test findings:** 14 attack vectors examined (§23); the most dangerous flagged as
    main-star group direction inversion (a silent, structurally-plausible-looking failure mode) and
    the explicit Nạp Âm/Eastern-Horoscope-element confusion risk for Cục, both flagged for mandatory
    Sprint 19 golden-vector coverage once implementation begins.
34. **Eastern-Horoscope isolation:** Confirmed clean — zero shared code exists currently (no Tử Vi
    code exists yet); calendar *algorithm* reuse is architecturally sound, calendar *boundary-rule*
    reuse and element-system reuse are explicitly forbidden and were checked against the actual
    Eastern Horoscope source, not assumed (§25).
35. **AI boundary:** Locked, restated verbatim as a hard rule (§24) — AI may never calculate any
    canonical Tử Vi fact; must fail visibly on incomplete data; may only narrate already-computed
    facts, mirroring the identical, already-verified-working rule for Eastern Horoscope.
36. **Unresolved P0 domain decisions:** DECISION-01 (school), DECISION-02 (giờ Tý), DECISION-04
    (Mệnh/Thân), DECISION-05 (Cục), DECISION-06 (Tử Vi anchor), DECISION-07 (14-star offsets),
    DECISION-08 (auxiliary stars), DECISION-09 (Tuần/Triệt), DECISION-10 (Tứ Hóa) — 9 of the original
    12 register items, all still open.
37. **Unresolved P1 domain decisions:** DECISION-03 (Tử-Vi-specific leap-month treatment, distinct
    from the resolved astronomy layer), DECISION-11 (Miếu/Vượng/Đắc/Hãm inclusion — a founder scope
    call, not purely domain research).
38. **Implementation-readiness matrix:** See §27 — 3 READY (all structural/mechanical), 11 BLOCKED, 0
    DEFERRED-as-blocked (vận cycles tracked separately as correctly out-of-scope, not as a blocker).
39. **Files created:** `docs/audit/sprint-18-pre-implementation-audit.md` (this document) only.
40. **Files modified:** None.
41. **Git status:** `git status --short` → `?? docs/audit/sprint-18-pre-implementation-audit.md`
    (the one new file this pass creates); `git diff --stat`/`git diff --check` empty for all
    previously-tracked files.
42. **Commit status:** Nothing committed this session.
43. **Push status:** Nothing pushed this session; `origin/master` remains `c1c8b8f`, unchanged.
44. **Final verdict:** See below.

---

## 32. Final verdict

**B — SPRINT 18 BLOCKED — DOMAIN REFERENCES / GOLDEN VECTORS INCOMPLETE**

Re-derived independently this session, not assumed from Sprint 15's prior conclusion: 9 of the
original 12 domain-decision-register items remain open (`UNSOURCED` or `DOMAIN_EXPERT_REQUIRED`),
including every one of the five hard gates named in this session's own brief (school/tradition, Cục,
Tử Vi placement, 14 Chính Tinh, Tứ Hóa). Zero golden vectors exist against a target of ~12–15,
and the independence requirement for a qualifying vector is unmet by every candidate source found so
far. Three real, named, sourced conflicts exist (school selection, giờ Tý convention, Tứ Hóa
Bắc/Nam mapping) layered on top of the broader incompleteness — both blocking conditions are present,
but the dominant, more numerous blocking reason across the full pipeline is incompleteness of
sourcing, not active conflict-resolution paralysis, which is why this verdict is **B** rather than
**C**. All ten stop conditions (§28) are independently triggered. No workaround, compromise
convention, or AI-generated rule was substituted for any of them.

Sprint 17 (Eastern Horoscope) remains correctly closed and unaffected by this verdict in either
direction — the two domains share zero code and, per this session's own isolation check (§25), must
continue to share zero domain rules. Sprint 19 (Golden Verification & Domain Audit Gate) and Sprint 22
(Vận Depth) remain correctly sequenced after this gate, whenever it eventually clears.
