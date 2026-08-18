# Sprint 15 — Vietnamese Tử Vi Domain Source & Pre-Implementation Audit

**Type:** Research / domain verification only. No Tử Vi engine code, no Prisma schema, no
migrations, no API implementation, no frontend implementation were written in this sprint. No
commit, no push.

---

## 1. Git baseline

```
HEAD (start)     = dc6684e (refactor: complete Sprint 14 product ambiguity cleanup)
origin/master    = 50c0e93 (feat: complete Sprint 13 production analytics foundation)
ahead/behind     = 0 / 1  (dc6684e is one local commit ahead, not yet pushed)
working tree     = clean at session start
diff --check     = clean
Sprint 14 commit = present (dc6684e), confirmed via git log
Sprint 14 pushed = No — origin/master is still 50c0e93
merge/rebase/cherry-pick in progress = none
```

No reset, stash, clean, commit, or push was performed. This audit was written by adding new files
under `docs/domain/tu-vi/` and this file — nothing else in the tree was touched.

---

## 2. Current Tử Vi code status

Searched the entire repository (excluding `node_modules`) for every term in the sprint brief's
list (Tử Vi, Can Chi, Thiên Can, Địa Chi, âm lịch, Cung Mệnh, Cung Thân, all 14 chính tinh names,
Tuần, Triệt, Tứ Hóa). 20 files matched. Classification:

| Path | Classification |
|---|---|
| `apps/web/app/menh-vi/la-so/page.tsx` | `PLACEHOLDER` — a 12-line component rendering a title string ("Tử Vi Lá Số") and one description sentence via `MvComingSoon`; no chart data, no calculation |
| `apps/web/features/menh-vi/data/mock-dashboard.ts` | `PLACEHOLDER` — explicitly self-labeled "MOCK DATA... not wired to a real API. No astrology/numerology/tarot backend exists for this product identity" |
| `docs/product/vietnamese-tu-vi-product-definition.md`, `docs/product/product-completion-roadmap-v2.md`, `docs/audit/full-product-completion-roadmap-rebase.md`, `docs/audit/sprint-10-pre-implementation-audit.md`, `docs/audit/sprint-11-pre-implementation-audit.md`, `docs/audit/web-tu-vi-current-state.md`, `docs/audit/web-tu-vi-remediation-roadmap.md` | `DOCUMENTATION` |
| `docs/design/menh-vi-*.md` (3 files) | `DOCUMENTATION` (design-asset references for the archived prototype) |
| `README.md`, `CLAUDE.md`, `apps/web/app/(app)/discover/page.tsx`, `apps/web/e2e/flow-26-ambiguity-cleanup.spec.ts`, `docs/architecture/product-surface-map.md`, `docs/progress/sprint-14-*.md`, `docs/progress/sprint-13-progress.md` | `DOCUMENTATION` / `UI_COPY` — Sprint 14's own naming-clarity work (distinguishing Tử Vi from Eastern Horoscope in Discover copy) and its supporting docs, not calculation logic |
| `apps/api/src/**` (2 comment lines only) | `UNRELATED` — both are comments referencing the *filename* `docs/audit/web-tu-vi-remediation-roadmap.md` as a pointer, not calculation logic |
| Prisma schema (`apps/api/prisma/schema.prisma`) | Zero matches for `TuVi`/`tu_vi`/`tu-vi`/`ZiWei` |

**Confirmed: no real Vietnamese Tử Vi calculation engine exists anywhere in this repository.**
This matches the expected state stated in the sprint brief and in every prior audit
(`full-product-completion-roadmap-rebase.md` §10: "Real Vietnamese Tử Vi Đẩu Số implementation in
this codebase: zero — not partial, not scaffolded"). Nothing was modified in this classification
pass.

---

## 3–6. Sources investigated, canonical/corroborating/rejected, school status

See `docs/domain/tu-vi/authoritative-sources.md` for the full register with citations. Summary:

**Canonical sources accepted:** **None.** Per this session's own hierarchy rules, a source only
qualifies as CANONICAL once directly read and cross-checked cell-by-cell against a second
independent primary source — no source met that bar this session (web search returns snippets and
secondary discussion, not full primary-text access at the fidelity needed).

**Corroborating sources:**
- `VDTTL-1956` — Vân Đằng Thái Thứ Lang, *Tử Vi Đẩu Số Tân Biên* (1956) — strongest candidate for
  "which tradition," existence/reputation corroborated by 8 independent sources, content not
  directly read.
- `TD-TOANTHU` — Trần Đoàn, *Tử Vi Đẩu Số Toàn Thư* (root Chinese text, Vietnamese editions exist)
  — existence/authorship corroborated by 10 independent sources, content not directly read.
- `HND-ALGORITHM` — Hồ Ngọc Đức's Vietnamese lunar calendar algorithm, grounded in Jean Meeus's
  *Astronomical Algorithms* and Reingold & Dershowitz's *Calendrical Calculations* — the one item
  in this entire register with genuinely strong, independently-checkable academic grounding and
  ~20 years of independent reimplementation.
- Five `SECONDARY-*` sources providing structural (not table-level) corroboration for Mệnh/Thân,
  Cục category structure, the 14-star two-group model, Tuần/Triệt's differing input bases, and the
  real Bắc Phái/Nam Phái Tứ Hóa conflict.

**Rejected/unreliable:** generic horoscope/lifestyle content sites, used nowhere as a standalone
citation; any AI-generated explanation (including this document's author's own prior training-data
familiarity with Zi Wei Dou Shu concepts) — explicitly excluded per the product definition's own
rule and this sprint's brief.

**School/tradition status:** `DOMAIN_EXPERT_REQUIRED`. A real, named conflict exists (Vietnamese
Vân Đằng tradition vs. the Chinese root text vs. the Bắc Phái/Nam Phái split specifically
documented for Tứ Hóa). Vân Đằng Thái Thứ Lang's 1956 text is recommended as the strongest
*candidate* default (see `domain-decision-register.md` DECISION-01) but this is a recommendation
requiring founder sign-off, not a decision made by this audit.

---

## 7–22. Per-topic status (calendar through vận)

Full detail in `docs/domain/tu-vi/domain-decision-register.md` and
`docs/domain/tu-vi/calculation-specification.md`. Condensed:

| # | Topic | Status |
|---|---|---|
| 7 | Calendar convention (overall) | Astronomy layer `RESOLVED_BY_SOURCE` (Hồ Ngọc Đức/Meeus); Tử-Vi-specific leap-month treatment `UNSOURCED` |
| 8 | UTC+7 convention | `RESOLVED_BY_SOURCE` — standard, uncontested, matches Natal Chart's existing VN handling pattern |
| 9 | Leap-month convention | `UNSOURCED` (Tử-Vi-specific treatment; astronomy itself resolved) |
| 10 | Giờ Tý rule | `CONFLICT` — two real, named conventions ("Sơ" vs "Chính") |
| 11 | ⁣Can Chi status | Mechanically low-risk once calendar layer trusted — standard sexagenary arithmetic, not independently disputed by any source found |
| 12 | Mệnh rule status | `DOMAIN_EXPERT_REQUIRED` — strong candidate formula found, not primary-source-verified |
| 13 | Thân rule status | Same as Mệnh |
| 14 | 12-cung status | Structurally uncontested (order/direction); not independently re-verified against a primary source this session, but no conflicting claim was found either |
| 15 | Cục rule status | `UNSOURCED` — methodology and one worked example found, full table not |
| 16 | Tử Vi placement status | `UNSOURCED` |
| 17 | 14-main-star status | `UNSOURCED` for offsets; group-structure `CORROBORATING` |
| 18 | Auxiliary-star status | `UNSOURCED` for all 13 candidate stars; even the MVP list itself unconfirmed |
| 19 | Tuần status | `UNSOURCED` for the table; input basis `CORROBORATING` |
| 20 | Triệt status | Same as Tuần |
| 21 | Tứ Hóa status | `DOMAIN_EXPERT_REQUIRED` — confirmed real school conflict |
| 22 | MVP vs post-MVP boundary | Unchanged from product definition §4 — no scope expansion or contraction from this sprint's research; see `calculation-specification.md` §16 |

---

## 23. Existing 12 domain decisions

All 12 original items from `docs/product/vietnamese-tu-vi-product-definition.md` §5 were located,
confirmed still present (none deleted, none silently merged — two split for precision, see below),
and re-researched. Full detail in `domain-decision-register.md`.

## 24. Existing 12 decisions — verification

Every item re-verified this session, with fresh evidence gathered for all 12. One item
(calendar/leap-month, originally #3) was split into DECISION-03 (Tử-Vi-specific leap-month
treatment, still unsourced) and DECISION-03B (calendar computation algorithm, newly resolved) —
this split is additive precision, not a deletion or merge of the original register.

## 25. Decisions resolved

**One** sub-item resolves to `RESOLVED_BY_SOURCE` this session: DECISION-03B (calendar
computation library/algorithm — Hồ Ngọc Đức/Meeus/Reingold-Dershowitz). **Zero of the original 12
items resolve fully to `RESOLVED_BY_SOURCE` on their own.**

## 26. Conflicts found

Two genuine, named, sourced conflicts (not merely "unresolved," but positively documented
disagreement):
- **DECISION-02** (Giờ Tý boundary) — "Giờ Tý Sơ" vs. "Giờ Tý Chính."
- **DECISION-10** (Tứ Hóa) — Bắc Phái vs. Nam Phái, with sources explicitly stating schools "often
  do not have unified views" here.

## 27. DOMAIN EXPERT REQUIRED items

DECISION-01 (school/tradition selection), DECISION-04 (Mệnh/Thân — closest to resolved, needs
confirmation not open research), DECISION-05 (Cục table), DECISION-06 (Tử Vi anchor), DECISION-07
(remaining 13 stars), DECISION-08 (auxiliary stars), DECISION-09 (Tuần/Triệt tables), DECISION-10
(Tứ Hóa table, pending school selection), DECISION-11 (Miếu/Vượng/Đắc/Hãm inclusion — founder scope
call specifically).

## 28. UNSOURCED items

Every table-level item above where a methodology or structure was found but no complete, verified
table: the full Cục lookup table, the Tử Vi anchor placement formula, the complete 14-star offset
table, all 13 auxiliary-star placement formulas, the Tuần lookup table, the Triệt lookup table, the
10-Can × 4-Hóa table (blocked additionally on school selection), the Tử-Vi-specific leap-month
convention.

**Per this sprint's own instruction: this is expected and acceptable. Sprint 15 does not force
readiness it does not have.**

---

## 29. Golden-vector plan

See `docs/domain/tu-vi/golden-vector-specification.md` — full coverage checklist (12–15 vectors
minimum, 14 required coverage dimensions), vector record template, and boundary test matrix.
**Zero vectors are populated this sprint** — no candidate source found met the "independently
verified, two-reviewer, full worked chart" bar required.

## 30. Golden-vector sources

No qualifying source found this session. The closest candidate (`SECONDARY-TNT`'s single Cục
worked example) covers one field of one chart, not a full vector, and has no second-reviewer
confirmation. Real vector sourcing requires either direct primary-text reading (VDTTL-1956 /
TD-TOANTHU) or a domain expert providing worked charts.

## 31. Boundary-test plan

See `golden-vector-specification.md`'s boundary test matrix — 8 boundary conditions specified, 3
resolvable today (lunar month end, lunar year end, solar year end — all via the resolved calendar
algorithm), 5 pending DECISION-02 or DECISION-03.

## 32. Property/invariant plan

See `golden-vector-specification.md`'s invariant list — 8 structural invariants specified, all
derivable from the pipeline's own shape (12 palaces, 14 stars, valid Cục range, etc.), none
requiring external sourcing since they are logical guarantees rather than domain facts.

---

## 33. Libraries investigated

**Calendar layer:** `HND-ALGORITHM`-derived libraries — `lunar-date-vn`, `lunar-calendar-ts-vi`,
`@dqcai/vn-lunar`, `hnthap/lunar-calendar-api` — all crediting the same underlying algorithm, all
JS/TS, actively discoverable on npm/GitHub.
**Tử Vi calculation (secondary comparison only, never a source of truth):** `SylarLong/iztro` —
actively maintained, documented at iztro.com, multi-language ports exist (`EdwinXiang/dart_iztro`,
`iztro-py`). School/tradition it encodes was **not** independently confirmed this session — this
is itself exactly the kind of check DECISION-01 exists to force before any comparison is trusted.
`ruijayfeng/ziwei` noted but not evaluated.

## 34. Library-vs-own-engine recommendation

| Layer | Recommendation | Rationale |
|---|---|---|
| Solar→lunar | `WRAP_LIBRARY` | Hồ Ngọc Đức algorithm is `RESOLVED_BY_SOURCE`, academically grounded, widely re-implemented — reimplementing lunar astronomy from scratch would add risk for zero domain-correctness benefit |
| Can Chi | `WRAP_LIBRARY` (same library, typically bundled) | Mechanical once calendar layer trusted |
| Mệnh/Thân | `UNRESOLVED` | Formula is simple enough to implement directly once verified — the blocker is verification, not implementation complexity |
| Cục | `UNRESOLVED` | Cannot decide implement-own vs. wrap-library until the table itself is sourced; no existing library's table should be trusted without independently confirming which school it encodes |
| 14 chính tinh | `UNRESOLVED` | Same reasoning as Cục |
| Auxiliary stars | `UNRESOLVED` | Same reasoning |
| Tuần/Triệt | `UNRESOLVED` | Same reasoning |
| Tứ Hóa | `UNRESOLVED` | Same reasoning, plus explicitly blocked on school selection |

**General principle applied:** domain correctness dominates implementation convenience, per this
sprint's explicit instruction — a library is only recommended where its underlying algorithm is
independently, academically verifiable (the calendar layer) and not merely popular.

---

## 35. Versioning recommendation

Confirmed unchanged from product definition §6: `TUVI_ENGINE_VERSION`, `CALENDAR_VERSION`,
`STAR_RULESET_VERSION`. Full increment-trigger definitions in `calculation-specification.md` §9.
No schema implemented this sprint.

## 36. Canonical representation

Design-only (no code), captured in `calculation-specification.md` and implied by
`star-placement-rules.md`'s group-structure findings:
- 12 Earthly Branches, 10 Heavenly Stems, 5 Elements, 5 Cục, 12 palaces, 14 main stars, and every
  auxiliary star/transformation each need a stable, machine-safe identifier (e.g., branch index
  0–11 with a fixed Dần=0 or Tý=0 convention — **not yet decided**, flagged as an open engineering
  choice to make explicitly once real implementation starts, not silently during Sprint 18) —
  separate from their Vietnamese display labels, mirroring how Natal Chart and Numerology already
  separate internal enums from user-facing copy.
- The two-directional-walk structure found for the 14 main stars (Tử Vi group reverse, Thiên Phủ
  group forward, from two mirrored anchors) suggests the internal representation should model two
  named "star cycles," not 14 independent placement functions — a design implication worth
  carrying into Sprint 18 even though the offsets themselves are not yet sourced.

## 37. Deterministic/AI boundary

Restated exactly, unchanged, in `calculation-specification.md` §7 — AI must never calculate lunar
date, Can Chi, Mệnh, Thân, Cục, palaces, star positions, Tuần, Triệt, Tứ Hóa, or vận positions. AI
may only explain/summarize/synthesize/personalize from already-computed canonical facts. This
mirrors the identical, already-proven rule for Tarot/Numerology/Natal Chart — no weakening, no
sprint-specific exception proposed.

## 38. Premium boundary

Confirmed unchanged from product definition §12 in `calculation-specification.md` §12 — full
deterministic chart free, deeper interpretation/synthesis/history/vận/Reports-inclusion premium.
No research finding this sprint conflicts with this.

## 39. Privacy/input requirements

See `calculation-specification.md` §11 — birth date and birth time `REQUIRED`; timezone fixed to
Vietnam UTC+7 (not user-selected) `REQUIRED`; gender `OPTIONAL` (collect now, cheap and reversible,
pending whether a future vận-cycle resolution needs it); birth location `NOT_NEEDED` for MVP —
explicitly not copied from Natal Chart's requirement, since no source this session showed Tử Vi
Đẩu Số chart construction depending on geographic coordinates the way Western ephemeris-based
Natal Chart does.

## 40. Reports interaction

See `calculation-specification.md` §13 — Reports (Sprint 16) ships before the Tử Vi engine exists
and must not reference or placeholder Tử Vi data; a future, additive, versioned Tử Vi section can
be added to Reports only after the engine passes its Sprint 19 gate.

## 41. Persistence requirements

Concept-only in `calculation-specification.md` §14 — a future `TuViReading`-shaped record needs
canonical input, all three version identifiers, every calculated canonical fact, separately-tagged
interpretation metadata, and history/lifecycle fields matching the existing Discovery-system
pattern. No Prisma schema was written or modified.

## 42. Failure-mode specification

See `calculation-specification.md` §10 — six named error codes (`UNSUPPORTED_DATE`,
`INVALID_BIRTH_TIME`, `CALENDAR_CONVERSION_FAILED`, `UNRESOLVED_RULESET`,
`ENGINE_VERSION_UNSUPPORTED`, `INCOMPLETE_CANONICAL_CHART`), with `UNRESOLVED_RULESET` specifically
designed to make "don't ship an unresolved decision-register item" enforceable in code, not just
in process discipline.

## 43. Rule traceability result

Every rule discussed in `star-placement-rules.md` and `calculation-specification.md` is tagged with
its decision-register item and, where applicable, its `SOURCE_ID` from `authoritative-sources.md`.
**No rule in any of these documents is stated without either a source citation or an explicit
`UNSOURCED`/`DOMAIN_EXPERT_REQUIRED`/`CONFLICT` marker.** This traceability chain (future code →
`ruleId` → `authoritative-sources.md` entry) is the mechanism product definition §6 requires; this
sprint establishes the document side of that chain, ready for Sprint 18 to reference by ID once
rules are actually implemented.

## 44. TỬ VI AN SAO LOGIC AUDIT definition

Formalized in full in `docs/domain/tu-vi/an-sao-logic-audit.md` — the 14-item gate, its allowed
result values, a Sprint 15 baseline projection (3 of 14 items would plausibly `PASS` today if an
engine existed and correctly implemented only the already-resolved layers; 11 require
`DOMAIN_REFERENCE_REQUIRED`), and the procedure Sprint 19 must follow, including the explicit
instruction that AI interpretation (Sprint 21) cannot begin until all 14 items are `PASS`.

## 45. Sprint 18 readiness assessment

**Not ready.** Per the Definition of Ready checklist (product definition + this sprint's brief
§48), the following remain unresolved: canonical tradition (DECISION-01), giờ Tý rule
(DECISION-02), Mệnh (DECISION-04), Thân (DECISION-04), Cục mapping (DECISION-05), Tử Vi placement
(DECISION-06), 14 chính tinh (DECISION-07), MVP auxiliary-star rules (DECISION-08), Tuần
(DECISION-09), Triệt (DECISION-09), Tứ Hóa (DECISION-10). Versioning is defined (§9 of
`calculation-specification.md`). Golden-vector sources are **not yet identified** (§30 above — the
plan exists, populated vectors do not). Multiple core rules remain `UNSOURCED` and
`DOMAIN_EXPERT_REQUIRED`. **Per instruction: do not pretend this is ready.** It is not.

## 46. Roadmap impact

Reviewed Sprint 18–22 assumptions against this session's findings:
- **Sprint 18 (Deterministic Core Engine)** — no scope change proposed. The roadmap already
  anticipated exactly this outcome ("if item 11 [Miếu/Vượng/Đắc/Hãm] is still open, ship without it
  and flag" — Roadmap V2's own Sprint 18 entry). This sprint's findings sharpen *which* items are
  the long poles (Cục and the star-offset tables, not the calendar layer, which turned out to be
  the most tractable part) but do not require reordering Sprint 18's position in the roadmap.
- **Sprint 19 (Golden Verification Gate)** — no scope change; `an-sao-logic-audit.md` is now a
  ready-to-execute procedure rather than something Sprint 19 has to design from scratch, which
  should shorten that sprint's setup time.
- **Sprint 20 (UX)**, **Sprint 21 (AI)** — no scope change; the deterministic/AI boundary (§37
  above) and the AI input contract (`calculation-specification.md` §8, including the fail-closed
  `INCOMPLETE_CANONICAL_CHART` behavior) are now specified in more detail than the product
  definition alone provided, which should make Sprint 21 faster to start once its dependencies
  clear, but does not change its scope.
- **Sprint 22 (Vận Depth)** — confirmed still correctly out of Sprint 18's scope; DECISION-12 was
  deliberately not researched this session, consistent with the roadmap's own sequencing.
- **No roadmap document was edited.** This section documents the assessment; it does not conclude
  evidence demands a correction, so none was made, per this sprint's explicit instruction ("Do not
  change roadmap merely for convenience").

---

## 47. Files created/modified

**Created (documentation only):**
```
docs/domain/tu-vi/authoritative-sources.md
docs/domain/tu-vi/domain-decision-register.md
docs/domain/tu-vi/calculation-specification.md
docs/domain/tu-vi/star-placement-rules.md
docs/domain/tu-vi/golden-vector-specification.md
docs/domain/tu-vi/an-sao-logic-audit.md
docs/audit/sprint-15-pre-implementation-audit.md   (this file)
```
**Modified:** none. **No code, Prisma, or config file was touched.**

## 48. Git status (end of sprint)

```
git status --short  →  7 untracked files, all under docs/domain/tu-vi/ and docs/audit/
git diff --stat     →  no tracked-file changes (all new files)
git diff --check    →  clean
```

## 49. Commit/push status

**Not committed. Not pushed.** Per this sprint's explicit instruction, no `git add`, `git commit`,
or `git push` was run.

---

## 50. Final verdict

**B. DOMAIN REFERENCES INCOMPLETE — EXPERT/SOURCE DECISIONS REQUIRED.**

Not A (no core rule is `RESOLVED_BY_SOURCE` at implementation-grade confidence except the calendar
layer). Not C (no evidence of an *irreconcilable* conflict that blocks the project's viability —
the conflicts found, giờ Tý and Tứ Hóa's school split, are normal, expected, resolvable-by-decision
situations, not signs the whole module is unworkable). This verdict is the expected, intended
outcome of a domain-specification sprint done honestly, per this sprint's own framing ("This is
expected and acceptable. Do not force READY.").

---

## 51. Exact founder/expert questions that must be answered next

Phrased to be directly answerable, per this sprint's own instruction to avoid vague questions:

1. **School selection:** "Should BeaconVie's Tử Vi engine follow the Vietnamese-adapted tradition
   as presented in Vân Đằng Thái Thứ Lang's *Tử Vi Đẩu Số Tân Biên* (1956), or a different named
   tradition/lineage — and if a domain expert is engaged, should they be asked to confirm this text
   is still standard current Vietnamese practice, or to recommend a different primary source?"
2. **Giờ Tý boundary:** "For births between 23:00–23:59 Vietnam time, does the selected tradition
   treat the astrological day as the current civil date or the following date for day-dependent
   star/palace placement — i.e., does 'Giờ Tý Sơ' (23:00–24:00) belong to the birth day or the next
   day for chart-construction purposes?"
3. **Mệnh/Thân formula confirmation:** "Does the formula Mệnh = ((tháng − giờ) + 1) mod 12, Thân =
   ((tháng + giờ) − 1) mod 12 (tháng = lunar birth month 1–12, giờ = birth-hour branch index from a
   Dần=1 reference) match the selected primary source exactly, including its handling of the
   mod-12 boundary cases (result = 0 or negative)?"
4. **Cục table:** "Can you provide, or confirm from [selected primary source], the complete mapping
   from (Cung Mệnh branch, Can năm sinh) to one of the five Ngũ Hành Cục — specifically via the
   Nạp Âm-of-the-month-containing-Mệnh method described by Hà Lạc Dã Phu (1972) and Vân Đằng Thái
   Thứ Lang (1956), with at least 3 independently-checkable worked examples beyond the one already
   found (Bính-year, Mệnh at Dậu → Hỏa Lục Cục)?"
5. **Tử Vi anchor:** "What is the complete placement table for the Tử Vi star given (Cục, lunar
   birth day 1 through the Cục's maximum relevant day), from the selected primary source?"
6. **14-star offsets:** "What are the exact palace offsets (not just 'one apart'/'two apart' but a
   complete, unambiguous table) for each of the 13 non-anchor main stars, relative to Tử Vi (for
   the 5-star Tử Vi group) or Thiên Phủ (for the 7-star remainder of the Thiên Phủ group)?"
7. **Tứ Hóa table:** "Given the school selected in question 1, what is the complete 10-Can × 4-Hóa
   (Lộc/Quyền/Khoa/Kỵ) table — and if the Trung Châu/Lục Bân Triệu/Khâm Thiên lineage is the
   selected reference, can that specific table be sourced and confirmed?"
8. **Auxiliary-star MVP list:** "Does the product definition's 13-star MVP list (Tả Phù, Hữu Bật,
   Văn Xương, Văn Khúc, Địa Không, Địa Kiếp, Lộc Tồn, Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, Thiên
   Khôi, Thiên Việt) match what the selected primary source treats as load-bearing, or does it
   include/exclude stars a real practitioner would consider essential?"
9. **Tuần/Triệt tables:** "What is the complete lookup table mapping Tuần-Giáp group → 2 palaces,
   and the complete lookup table mapping Can năm → 2 (different) palaces for Triệt?"
10. **Miếu/Vượng/Đắc/Hãm scope call:** "Does the founder want star brightness/dignity states
    (Miếu/Vượng/Đắc/Hãm) included in the V1 MVP scope, understanding this is a scope-size decision
    (larger MVP) rather than purely a correctness question — or should it be explicitly deferred to
    post-MVP, matching how the roadmap already treats vận cycles?"

## 52. Recommended next action

1. Engage a Vietnamese Tử Vi Đẩu Số domain expert (a practitioner or someone with direct primary-
   text fluency) — this is the single highest-leverage next step, since nearly every remaining item
   in the decision register is gated on primary-text reading this session's tools could not
   perform (web search returns discussion *about* these texts, not their full page content at
   table-level fidelity).
2. In parallel (does not block #1): acquire or access full copies of `VDTTL-1956` and
   `TD-TOANTHU` — both were found to exist as PDF scans/reprints online; whoever picks this up next
   should attempt direct transcription of the Cục table and the 14-star offset table specifically,
   since those are this sprint's two highest-value, lowest-progress items.
3. Confirm the founder's school/tradition preference (question 1 above) before spending further
   expert time on tables — DECISION-10 (Tứ Hóa) and several others cannot be finalized independent
   of that choice.
4. Do **not** begin Sprint 18 engine implementation until `domain-decision-register.md` shows
   DECISION-01 through DECISION-10 (excluding the deliberately-deferred DECISION-11/12) at
   `RESOLVED_BY_SOURCE`, per §48 of this sprint's own instructions.
5. Once source access improves, re-run this sprint's research pass specifically for Mệnh/Thân
   (DECISION-04) and calendar/leap-month Tử-Vi treatment (DECISION-03) — these are the closest to
   resolved and the most likely to close quickly with a single expert confirmation rather than
   requiring a full primary-text read.

---

**SPRINT 15 VERDICT: DOMAIN REFERENCES INCOMPLETE — EXPERT/SOURCE DECISIONS REQUIRED.**
Do not begin Tử Vi engine implementation. Sprint 16 (Reports) and Sprint 17 (Eastern Horoscope)
remain unblocked by this verdict, per Roadmap V2's own sequencing — neither depends on Tử Vi.
