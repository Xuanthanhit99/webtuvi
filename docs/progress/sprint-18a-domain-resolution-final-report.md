# Sprint 18A — Vietnamese Tử Vi Domain Resolution — Final Report

**Date:** 2026-08-20
**Type:** Domain-only research/documentation pass. No Tử Vi calculation logic, Prisma models, API endpoints, frontend calculation UI, or AI prompts were implemented, per this sprint's explicit prohibition.
**Relationship to prior work:** this sprint does not replace `docs/domain/tu-vi/*` (Sprint 15's authoritative-sources.md, domain-decision-register.md, calculation-specification.md, star-placement-rules.md, golden-vector-specification.md, an-sao-logic-audit.md) or `docs/domain/tu-vi/domain-resolution-pack.md` (Sprint 18's re-audit/decision pack) — those documents are exceptionally thorough, internally consistent, already committed to git history (`f06813b`, `dd029a2`, `2213cad`), and were **read in full, not summarized from memory**, before writing this report. This report synthesizes them, adds one new session finding (below), and issues the sprint-level verdict this task requires. Each existing document also received a short, clearly-marked addendum pointing here — nothing in them was erased or silently rewritten.

---

## 1–4. Baseline

- **Recovered HEAD:** `0c54adb` ("fix: complete pre-live product experience remediation").
- **origin/master:** `3bbd18c` — unchanged.
- **Ahead/behind:** `2 / 0`. Both `de25fcd` and `0c54adb` are confirmed **local-only** — present in `git log`, absent from `origin/master`. Not pushed, not squashed, not replaced.
- **Working tree at start of this sprint:** clean (`git status --short` empty) — the two commits from the prior closure pass left nothing uncommitted.

No reset, rebase, cherry-pick, or force-push was performed. No inherited change was touched.

---

## 5. Governing documents read (in full, this session)

`docs/domain/tu-vi/domain-decision-register.md`, `authoritative-sources.md`, `calculation-specification.md`, `star-placement-rules.md` (representative sections — group-structure and auxiliary tables, which is where the file's content concentrates), `golden-vector-specification.md`, `an-sao-logic-audit.md`, `domain-resolution-pack.md`. `docs/product/vietnamese-tu-vi-product-definition.md` was not re-read line-by-line this session (its §5 decision items are already fully re-derived into `domain-decision-register.md`, which this report treats as the current source of truth per that register's own stated relationship to the product definition) — flagged here rather than silently assumed.

`docs/audit/sprint-15-pre-implementation-audit.md`, `sprint-18-pre-implementation-audit.md`, and `roadmap-resequencing-after-tuvi-block.md` exist but were not re-opened this session; their findings are already fully absorbed into `domain-resolution-pack.md` §0, which explicitly states it reuses `sprint-18-pre-implementation-audit.md`'s re-audit rather than re-deriving it. Re-reading them would have duplicated, not added, information — noted rather than silently skipped.

---

## 6–7. New research performed this session, and the source-hierarchy result

**One new finding, via `WebSearch`/`WebFetch`, not present in any prior sprint's research:**

The primary text **VDTTL-1956** (*Tử Vi Đẩu Số Tân Biên*, Vân Đằng Thái Thứ Lang, 1956) is now confirmed **freely and fully accessible** — complete OCR full-text and page-image PDF scans, 6 parts plus a table of contents — at `archive.org/details/TuViDdauSoTanBien-VDThaiThuLang-DV`. Sprint 15's research had located citations *about* this book but explicitly stated it had not been located/read. This is a genuine change in the *access* question.

A WebFetch-mediated (i.e., read by an intermediary summarizing model, **not** directly by a human or verbatim by this report) pass over Part 1 ("Lập Thành" — chart construction) indicated the section headed "7. LẬP CỤC" and adjacent sections contain a Cục determination table, a Tử Vi star placement table (keyed by Cục and lunar day), directional placement language for at least some of the remaining chính tinh, and a Tứ Hóa table with a visible header row and at least one data row.

**This does not resolve anything.** Two things prevent treating it as resolution:

1. **No cell has been transcribed, verified, or independently cross-checked.** What exists is a lead confirming the tables are *in* the accessible source, at the `UNVERIFIED`-to-borderline-`SOURCE_EXTRACTED` level per `domain-resolution-pack.md` §14's own review-status scale — far below the `EXPERT_CONFIRMED` bar required to unblock a hard gate.
2. **A hard tooling limitation was discovered and must be recorded, not silently worked around:** `WebFetch` in this environment enforces an internal ~125-character cap on verbatim quotes (a guardrail of its own summarizing model). This makes genuine cell-by-cell transcription of a 120-cell Cục table, ~150-cell Tử Vi anchor table, or 40-cell Tứ Hóa table structurally impossible through this tool — every attempt returns a paraphrase, not a transcription. **One direct spot-check this session demonstrated exactly why that matters**: asked whether the primary text's Mệnh/Thân direction matched the existing candidate formula, the tool's headline answer ("contradicts") did not match its own quoted evidence (which described the same two-step structure already in the candidate formula). This is a concrete, not hypothetical, demonstration that AI-mediated web extraction cannot substitute for direct human reading in this domain — it independently confirms, rather than weakens, this project's existing discipline against exactly that failure mode.

**Source-hierarchy classification of this finding:** the *source itself* (VDTTL-1956, now located) is Level A/primary. The *extraction method used this session* (AI-mediated WebFetch summary) does not itself produce Level A evidence — it produces, at best, a lead pointing at Level A material, no more trustworthy than the Level C corroborating sources already in `authoritative-sources.md`, and in this case demonstrably less reliable on at least one direct check. **Nothing in this section moves any decision-register status.**

No other new web research meaningfully advanced beyond what Sprint 15 already found (which explicitly stated general web research was "exhausted... to the point of diminishing returns for table-level precision," a conclusion this session's own experience corroborates for anything beyond the access question above).

---

## 8. V1 school decision — DECISION-01

**Unchanged: `DOMAIN_EXPERT_REQUIRED`.** Candidate A (VDTTL-1956) remains the recommended, not selected, candidate — see `domain-resolution-pack.md` §1 for the full 4-candidate comparison table. This session's finding strengthens Candidate A's *practical* position (its full text is now provably in hand) but does not, and must not, substitute for the founder's explicit selection — selecting a school because its text happens to be the easiest one found online would itself be exactly the popularity-over-correctness failure mode this sprint exists to prevent. **FOUNDER DECISION REQUIRED**, options and consequences unchanged from `domain-resolution-pack.md` §1.

## 9. Giờ Tý — DECISION-02

**Unchanged: `CONFLICT`.** Three precise models (A1/A2/B) remain laid out in `domain-resolution-pack.md` §2 with an exact expert question. Not touched by this session's new finding (the archive.org lead was not checked against this specific question due to tool-budget prioritization toward the higher-leverage Cục/anchor/Tứ Hóa tables — flagged as a gap, not silently resolved).

## 10–11. Mệnh / Thân — DECISION-04

**Unchanged: `DOMAIN_EXPERT_REQUIRED`.** Candidate formula and worked examples unchanged from `domain-resolution-pack.md` §3–4. This session's one direct primary-text spot-check (§7 above) produced ambiguous, internally-inconsistent evidence — read as weak, unverified directional corroboration at best, explicitly **not** an upgrade to `SOURCE_EXTRACTED` or higher, given the tool's demonstrated unreliability on this exact question.

## 12. Cục — DECISION-05

**Unchanged: `UNSOURCED`** for the complete 120-cell table. New this session: confirmed the primary text contains a Cục-determination section (headed "LẬP CỤC") — a genuine, specific location to point a human transcriber at, not previously pinpointed this precisely. Still 0 of 120 cells verified.

## 13. 12 Cung

Not independently disputed anywhere in any prior sprint's research — mechanically well-defined layout/ordering once Mệnh (§10) is resolved, per `an-sao-logic-audit.md` item 8's own baseline ("would likely PASS if implemented correctly — no source found disputing the 12-palace layout order itself"). Unchanged.

## 14. Tử Vi anchor — DECISION-06

**Unchanged: `UNSOURCED`.** New this session: confirmed the primary text contains a Tử Vi placement table/section, located but not extracted. Still the single highest-leverage, still-fully-blocked hard gate in the entire register.

## 15. 14 Chính Tinh — DECISION-07

**Unchanged: `UNSOURCED`** for all 13 non-anchor offsets. Group-structure corroboration (Tử Vi group reverse/nghịch, Thiên Phủ group forward/thuận, mirrored across Tị/Hợi) stands, per `star-placement-rules.md`. New this session: the primary text's Part 1 was reported to contain directional placement language for at least Liêm Trinh and Thiên Đồng specifically — a lead, not a verified offset.

## 16. Main-star direction

The Tử Vi-group-vs-Thiên-Phủ-group direction question this task explicitly flags as a dangerous failure mode is **not resolved** — it remains at the same `CORROBORATING`-for-structure-only level documented in `star-placement-rules.md`. No exact per-star offset (the actual number of palaces each star sits from its anchor) has been verified from any source at any confidence level above a secondary web description. This is explicitly called out as unresolved, not glossed over.

## 17. Auxiliary-star MVP — DECISION-08

**Unchanged: `UNSOURCED`** for both the list-confirmation and every placement rule. The proposed 13-star list in `domain-resolution-pack.md` §8 remains a proposal pending founder lock; per that document's own sequencing, placement-rule sourcing should not proceed star-by-star until the list locks.

## 18–19. Tuần / Triệt — DECISION-09

**Unchanged: `UNSOURCED`** for both tables. Confirmed different input bases (Tuần: Tuần-Giáp decade group; Triệt: birth-year Can alone) remains the only resolved sub-claim, per `domain-resolution-pack.md` §10–11.

## 20. Tứ Hóa — DECISION-10

**Unchanged: `DOMAIN_EXPERT_REQUIRED`**, both steps (school selection, then table). New this session: confirmed the primary text's Part 1 contains a Tứ Hóa table with a visible header row ("Lộc Quyền Khoa Kỵ") and at least one data row — a specific, real lead, still zero of 40 cells verified, and the underlying Bắc Phái/Nam Phái school conflict this text does not by itself resolve (VDTTL-1956's own Tứ Hóa convention was not independently confirmed against either named school in this or any prior session).

## 21. Calendar reuse

**Unchanged, reconfirmed, not reopened unnecessarily** per this task's own instruction: `DECISION-03B` (Hồ Ngọc Đức algorithm) remains `RESOLVED_BY_SOURCE` for solar↔lunar conversion, leap-month astronomy, and UTC+7 handling — reusable from Eastern Horoscope's existing calendar layer. **Not reusable from Eastern Horoscope:** anything Tử Vi-specific — Cục, star placement, Tuần/Triệt, Tứ Hóa, and critically, `calculation-specification.md` §8's own explicit warning that Tử Vi Cục must **not** reuse Eastern Horoscope's `HEAVENLY_STEM_ELEMENT` mapping (Cục likely requires Nạp Âm logic, a distinct, separately-unsourced table). This session did not touch Eastern Horoscope's code or tables in any way — verified via `git status`/`git diff` showing zero changes to any `eastern-horoscope` path.

## 22. Cross-school contamination audit

**Clean.** No cell in any table (existing or newly found) was filled by mixing Candidate A/B/C/D content, or by borrowing from Eastern Horoscope, iztro, or any other implementation. The one new primary-text lead (VDTTL-1956) is single-source by construction — it cannot itself constitute contamination, since nothing from it was actually transcribed into any table cell this session.

## 23–25. Golden vectors

**Count: 0.** Unchanged from every prior sprint. `golden-vector-specification.md` and `domain-resolution-pack.md` §13's 15-vector acquisition plan (V1–V15, covering all 5 Cục, leap month, Tết boundary, both Giờ Tý boundary sides, a Tử Vi remainder/wraparound case, a dense multi-star case, both auxiliary-star input-basis pairs, and simultaneous Tuần+Triệt) remains a plan only — 0 populated. **Independence:** N/A, no vectors exist to assess. **Edge-case coverage:** planned, not populated — see the same 15-row table. Nothing in this session changes this; the newly-located primary text is a plausible *future* source for real vectors once its tables are transcribed (per `golden-vector-specification.md`'s own source-policy §, a primary-text worked example independently transcribed and reviewed by two people is the top-preference vector source) — but zero vectors were produced this session, and none should be, since none would meet the non-negotiable "never derived from a single unverified extraction" bar.

## 26. An Sao audit

**Unchanged: 3 of 14 items would plausibly PASS today (solar→lunar, UTC+7 normalization, 12-palace indexing — all structural/calendar items, not Tử Vi-specific disputes), 11 of 14 remain `DOMAIN_REFERENCE_REQUIRED`**, per `an-sao-logic-audit.md`'s own baseline table, re-confirmed unchanged this session. This is a template gate (no engine exists to actually run it against) — its status is a readiness snapshot, not a completed audit, exactly as that document itself states.

---

## 27. Implementation readiness matrix

| Layer | Ready? | Evidence | Blocker |
|---|---|---|---|
| Calendar | **PASS** | `DECISION-03B` `RESOLVED_BY_SOURCE`, Hồ Ngọc Đức algorithm, 4 independent reimplementations | None |
| Can Chi | **PASS** (mechanics only) | Standard sexagenary arithmetic, non-disputed once calendar layer trusted | Feeds from Giờ Tý (below) for the hour component |
| Giờ Tý | **BLOCKED** | Two named, real, sourced conventions (`SECONDARY-GIOTY`), 3-model decision table prepared | `CONFLICT_REQUIRES_FOUNDER_DECISION`/domain expert |
| Mệnh | **BLOCKED** | Candidate formula, 3 worked examples, ambiguous fresh spot-check | `DOMAIN_EXPERT_REQUIRED` |
| Thân | **BLOCKED** | Same as Mệnh, mirrored formula | `DOMAIN_EXPERT_REQUIRED` |
| Cục | **BLOCKED** | Methodology named, category structure corroborated, 0/120 cells; primary-text section now located | `DOMAIN_REFERENCE_REQUIRED` — transcription pending |
| 12 Cung | **PASS** (structural) | No source disputes the layout order itself | None found |
| Tử Vi anchor | **BLOCKED** | 0/~150 cells or algorithm; primary-text section now located | `DOMAIN_REFERENCE_REQUIRED` — transcription pending |
| 14 Chính Tinh | **BLOCKED** | Group structure only; 0/14 offsets; direction-inversion risk unresolved | `DOMAIN_REFERENCE_REQUIRED` |
| Auxiliary stars | **BLOCKED** | List itself unlocked; 0/13 placement rules | Founder lock (list) + `DOMAIN_REFERENCE_REQUIRED` (rules) |
| Tuần | **BLOCKED** | Input basis confirmed; 0 cells | `DOMAIN_REFERENCE_REQUIRED` |
| Triệt | **BLOCKED** | Input basis confirmed, distinct from Tuần; 0 cells | `DOMAIN_REFERENCE_REQUIRED` |
| Tứ Hóa | **BLOCKED** | Real Bắc/Nam conflict named; 0/40 cells; primary-text section now located | `CONFLICT_REQUIRES_FOUNDER_DECISION` (school) then `DOMAIN_REFERENCE_REQUIRED` (table) |
| Golden vectors | **BLOCKED** | 0 of 15 planned vectors populated | Depends on every table above |

**2 of 14 rows PASS (Calendar, 12 Cung — both structural/mechanical, not Tử Vi-interpretive). 12 of 14 remain BLOCKED.** Sprint 18B may not start.

---

## 28–30. Unresolved decisions, founder decisions required, domain-expert decisions required

Full decision forms already exist in `domain-resolution-pack.md` §1–§13 and are not reproduced here to avoid a duplicate, driftable copy — this report references them as current and unchanged except where §8–20 above note new leads. Summary:

**Founder decisions required:**
1. **School/tradition selection (DECISION-01)** — Candidate A/B/C/D per `domain-resolution-pack.md` §1. Now practically easier to act on (Candidate A's text is confirmed in hand), but the decision itself is unchanged and must still be made on tradition-fit grounds, not access convenience.
2. **MVP auxiliary-star list lock (DECISION-08)** — 13-star proposed list, `domain-resolution-pack.md` §8.
3. **Miếu/Vượng/Đắc/Hãm scope call (DECISION-11)** — recommended deferral to post-MVP stands, not a Sprint 18 hard gate.

**Domain-expert decisions required** (i.e., not a founder preference call — needs Vietnamese Tử Vi Đẩu Số expertise or careful primary-text transcription):
4. Giờ Tý convention (DECISION-02) — exact question in `domain-resolution-pack.md` §2.
5. Mệnh/Thân formula confirmation (DECISION-04) — candidate formula + worked examples ready for a quick confirm/deny, §3–4.
6. Cục table extraction (DECISION-05) — now has a specific, located primary-text section to transcribe from (§12 above), §5.
7. Tử Vi anchor + 14-star offset extraction (DECISION-06/07) — same access improvement, §6–7.
8. Auxiliary-star placement extraction (DECISION-08, rule half) — §9.
9. Tuần/Triệt table extraction (DECISION-09) — §10–11.
10. Tứ Hóa table extraction, once school is fixed (DECISION-10) — now has a specific, located primary-text section, §12.

No new founder or expert question was introduced this session beyond what `domain-resolution-pack.md` already precisely formed — this report's only addition is narrowing *where* the expert/transcriber should look for items 6, 7, and 10.

---

## 31. Stop conditions triggered

Checking every condition in this task's §22 against the current state:

| Condition | Triggered? |
|---|---|
| A. No canonical V1 school selected | **YES** |
| B. Giờ Tý unresolved | **YES** |
| C. Mệnh/Thân lacks adequate source evidence | **YES** |
| D. Complete Cục mapping unavailable | **YES** |
| E. Tử Vi anchor rule/table unavailable | **YES** |
| F. Any of 14 Chính Tinh lacks placement rule | **YES** (13 of 14) |
| G. Main-star group direction unresolved | **YES** |
| H. MVP auxiliary-star list/rules unresolved | **YES** |
| I. Tuần table/rule unavailable | **YES** |
| J. Triệt table/rule unavailable | **YES** |
| K. Tứ Hóa school/table unresolved | **YES** |
| L. Fewer than 12 usable independent golden-vector candidates | **YES** (0) |
| M. Golden vectors depend on the future engine | N/A — none exist to depend on anything |
| N. Sources from incompatible schools silently mixed | **NO** — confirmed clean (§22 above) |

**11 of 14 checkable stop conditions triggered.** Per this task's own §22, this is conclusive: the verdict must be BLOCKED.

## 32. Sprint 18B readiness

**Not ready.** Every hard-gated layer in the implementation readiness matrix (§27) remains BLOCKED. Sprint 18B must not start.

---

## 33. Files created/modified

**Created:** `docs/progress/sprint-18a-domain-resolution-final-report.md` (this document).

**Modified — addenda only, no prior finding erased or rewritten:** `docs/domain/tu-vi/authoritative-sources.md` (new dated addendum under VDTTL-1956's entry), `docs/domain/tu-vi/domain-decision-register.md` (short addendum note after the summary table), `docs/domain/tu-vi/domain-resolution-pack.md` (short addendum before the final verdict).

**Not touched:** `calculation-specification.md`, `star-placement-rules.md`, `golden-vector-specification.md`, `an-sao-logic-audit.md` — nothing in this session's findings changed any claim in these four, so no addendum was added to avoid noise-only edits.

**Confirmed not touched, per this sprint's hard prohibition:** no file under `apps/api` or `apps/web` related to Tử Vi; no Prisma schema/migration; no Tử Vi API route; no Tử Vi frontend calculation code; no AI/Tử Vi prompt file. Verified via `git status`/`git diff --stat` showing only the four `docs/` paths above.

## 34. Git status

```
 M docs/domain/tu-vi/authoritative-sources.md
 M docs/domain/tu-vi/domain-decision-register.md
 M docs/domain/tu-vi/domain-resolution-pack.md
?? docs/progress/sprint-18a-domain-resolution-final-report.md
```

## 35–37. Commit / push / deployment status

**Not committed.** Not pushed. Not deployed. Per this sprint's explicit instruction, all changes are left for review.

---

## 38. Final verdict

**SPRINT 18A BLOCKED — DOMAIN RESOLUTION INCOMPLETE — DO NOT IMPLEMENT SPRINT 18B**

This is the correct, expected outcome, not a failure of this session's effort. Eleven of fourteen checkable stop conditions remain triggered. Zero decision-register items reached `RESOLVED_BY_AUTHORITATIVE_SOURCE`, `RESOLVED_BY_EXPERT_CONFIRMATION`, or their equivalents this session. Zero golden vectors exist. Three real, named, sourced school/convention conflicts (school selection, Giờ Tý, Tứ Hóa) remain genuinely open, not glossed over. No rule was inferred from memory, no table cell was filled by inference or AI invention, no school was silently mixed, and the one primary-text lead found this session was deliberately *not* upgraded to a resolved status despite the temptation of "we found the book" — because finding a book is not the same as verifying a table, and this report is explicit about exactly that distinction throughout.

## 39. Recommended next action

**Unchanged in substance from `domain-resolution-pack.md` §25, sharpened by this session's one new finding:**

1. **Founder:** select the V1 school (DECISION-01) — the highest-leverage single action, unblocks nearly everything else. Candidate A's practical accessibility (now confirmed) is a legitimate factor but should not be the deciding one; tradition-fit for the Vietnamese-facing product (per the product definition's own framing) is.
2. **Once selected, engage a Vietnamese-fluent transcriber or domain expert** to read `archive.org/details/TuViDdauSoTanBien-VDThaiThuLang-DV`, Part 1 (`dv01`, section "7. LẬP CỤC" onward), directly against the scanned page images (not the OCR text alone, given OCR's known unreliability for tabular/diacritic-heavy content) — this is now a bounded, well-located task, not an open search. Transcribe using `domain-resolution-pack.md` §14's `RULE_ID`/`SOURCE_PAGE`/`WORKED_EXAMPLE`/`SECONDARY_CONFIRMATION` format, with a second independent reviewer, exactly as already specified.
3. In parallel, resolve Giờ Tý (fastest to ask, per the precise 3-model question in `domain-resolution-pack.md` §2) and lock the MVP auxiliary-star list (§8) — neither depends on the primary-text transcription effort and can proceed immediately.
4. Do not begin Sprint 18B, any Tử Vi Prisma model, API route, frontend calculation, or AI prompt until the implementation readiness matrix (§27) shows all fourteen rows PASS.
