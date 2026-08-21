# Sprint 18A.6 — Tử Vi Implementation Entry Gate Closure

**Date:** 2026-08-21
**Type:** Domain research/documentation only. Zero application-code changes.

---

## 1. Git baseline

**HEAD:** `c88a5092fadf51731bd29581889c39364277399f`. **origin/master:** identical. **Ahead/behind:** `0/0`, unchanged throughout. Working tree at start: clean except Sprint 18A.4/18A.5's untracked docs (no tracked file modified before this sprint).

## 2. Founder auxiliary decision — recorded

```
TUVI_AUXILIARY_STAR_SCOPE_V1 = CORE_13
```

Recorded in `canonical-ruleset-v1.md` §7 and `domain-decision-register.md` DECISION-08's Sprint 18A.6 addendum. V1 implements exactly the 13 stars below — no expansion, no silent contraction.

### CORE_13 verification table

| # | Star | Canonical ID exists | VN display name exists | Deterministic rule exists | Required inputs known | VDTTL-1956 page recorded | Transcription rechecked | Conflicts documented | No runtime LLM inference | Test constructible | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Lộc Tồn | ✅ `TUVI-AUX-LOCTON` | ✅ Lộc Tồn | ✅ year-Can, 10-cell table | ✅ year Can | ✅ p.9 | ✅ 4× (18A.1/18A.2/18A.5/18A.6 text corroboration) | ✅ none | ✅ | ✅ computed in V-B1,B2/B3,B4,B5,B6 | **IMPLEMENTATION_READY** |
| 2 | Kình Dương | ✅ `TUVI-AUX-KINHDA` | ✅ Kình Dương | ✅ Lộc Tồn's palace +1 | ✅ Lộc Tồn's result (CORE_13-internal) | ✅ p.10 | ✅ re-rendered 18A.6, matches own worked example (Lộc Tồn Tý→Sửu) | ✅ none | ✅ | ✅ computed in all 6 vectors | **IMPLEMENTATION_READY** |
| 3 | Đà La | ✅ `TUVI-AUX-KINHDA` | ✅ Đà La | ✅ Lộc Tồn's palace −1 | ✅ Lộc Tồn's result | ✅ p.10 | ✅ same re-render, worked example (→Hợi) matches | ✅ none | ✅ | ✅ computed in all 6 vectors | **IMPLEMENTATION_READY** |
| 4 | Địa Không | ✅ `TUVI-AUX-DIAKHONGKIEP` | ✅ Địa Không | ✅ hour, from Hợi, backward | ✅ hour branch | ✅ p.10 | ✅ re-rendered 18A.6, verbatim identical | ✅ none | ✅ | ✅ computed in V-B2/B3,B4 | **IMPLEMENTATION_READY** |
| 5 | Địa Kiếp | ✅ `TUVI-AUX-DIAKHONGKIEP` | ✅ Địa Kiếp | ✅ hour, from Hợi, forward | ✅ hour branch | ✅ p.10 | ✅ same re-render | ✅ none | ✅ | ✅ computed in V-B2/B3,B4 | **IMPLEMENTATION_READY** |
| 6 | Hỏa Tinh | ✅ `TUVI-AUX-HOALINH` | ✅ Hỏa Tinh | ✅ year-Chi trine group × yin-yang, 4-group table | ✅ year Chi + sex + Âm Dương rule (p.6, already `IMPLEMENTATION_READY`) | ✅ pp.10–11 | ✅ re-rendered 18A.6 at 5× — the previously-flagged "2 groups share a start palace" question resolved as printed-and-correct, not an artifact | ✅ resolved, documented in `canonical-ruleset-v1.md` row 24 | ✅ | ✅ constructible; not yet included in an existing golden vector — explicit gap, disclosed | **IMPLEMENTATION_READY** |
| 7 | Linh Tinh | ✅ `TUVI-AUX-HOALINH` | ✅ Linh Tinh | ✅ same table, opposite direction per yin-yang | ✅ same | ✅ pp.10–11 | ✅ same re-render | ✅ same resolution | ✅ | ✅ constructible; same disclosed gap | **IMPLEMENTATION_READY** |
| 8 | Tả Phù | ✅ `TUVI-AUX-TAPHUUBAT` | ✅ Tả Phù (book spells "Tả Phụ" in one place) | ✅ lunar month, Thìn=1 forward | ✅ lunar month (incl. leap-month convention lock, `TUVI-CAL-04`) | ✅ p.11 | ✅ re-rendered 18A.6, verbatim identical | ✅ spelling variant noted, not a placement conflict | ✅ | ✅ computed in V-B1,B2/B3,B4 | **IMPLEMENTATION_READY** |
| 9 | Hữu Bật | ✅ `TUVI-AUX-TAPHUUBAT` | ✅ Hữu Bật | ✅ lunar month, Tuất=1 backward | ✅ same | ✅ p.11 | ✅ same re-render | ✅ none | ✅ | ✅ computed in V-B1,B2/B3,B4 | **IMPLEMENTATION_READY** |
| 10 | Văn Xương | ✅ `TUVI-AUX-VANXUONGKHUC` | ✅ Văn Xương | ✅ hour, Tuất=Tý backward | ✅ hour branch | ✅ p.11 | ✅ re-rendered 18A.6, verbatim identical | ✅ none | ✅ | ✅ computed in V-B2/B3,B4 | **IMPLEMENTATION_READY** |
| 11 | Văn Khúc | ✅ `TUVI-AUX-VANXUONGKHUC` | ✅ Văn Khúc | ✅ hour, Thìn=Tý forward | ✅ hour branch | ✅ p.11 | ✅ same re-render | ✅ none | ✅ | ✅ computed in V-B2/B3,B4 | **IMPLEMENTATION_READY** |
| 12 | Thiên Khôi | ✅ `TUVI-AUX-KHOIVIET` | ✅ Thiên Khôi | ✅ year-Can, 10-cell table | ✅ year Can | ✅ p.11 | ✅ re-rendered 18A.6, matches own worked example (Ất Mùi→Tý) | ✅ none | ✅ | ✅ computed in V-B1,B2/B3,B4 | **IMPLEMENTATION_READY** |
| 13 | Thiên Việt | ✅ `TUVI-AUX-KHOIVIET` | ✅ Thiên Việt | ✅ year-Can, 10-cell table | ✅ year Can | ✅ p.11 | ✅ same re-render, worked example (→Thân) matches | ✅ none | ✅ | ✅ computed in V-B1,B2/B3,B4 | **IMPLEMENTATION_READY** |

**Internal-dependency audit (per the founder's carve-out condition):** checked whether any CORE_13 star requires a `DEFERRED_TO_V1_1` star as a calculation input. **None do.** Kình Dương/Đà La depend only on Lộc Tồn (itself CORE_13); all others depend only on year Can/Chi, lunar month, hour branch, or sex — none depend on any of the ~40 deferred stars (Thái Tuế's companion series, the Tràng Sinh series, Lộc Tồn's own 12-star companion walk, etc.). **No exception to the CORE_13 boundary is needed.**

**No star was silently removed from CORE_13 to make this table pass.** All 13 are `IMPLEMENTATION_READY`; 0 are `BLOCKED`.

## 3. CORE_13 stars checked

13 / 13.

## 4. CORE_13 ready count

13.

## 5. CORE_13 blocked count

0.

---

## 6. Re-run of the complete 18B entry gate

Every item re-verified against current documentation (not merely re-stamped):

| # | Gate item | Re-verified evidence | Status |
|---|---|---|---|
| 1 | Calendar (solar→lunar, UTC+7, leap-month astronomy) | `TUVI-CAL-01/02/03`, independently re-implemented 4×, unchanged since Sprint 18A.2 | ✅ PASS |
| 2 | Can Chi | `TUVI-CC-01`, standard non-disputed arithmetic | ✅ PASS |
| 3 | 12 palaces | `TUVI-PAL-01`, `PRIMARY_SOURCE_RECHECKED` ×3 (p.5) | ✅ PASS |
| 4 | Mệnh | `TUVI-MT-01`, structure `PRIMARY_SOURCE_RECHECKED` ×3, arithmetic `DETERMINISTICALLY_CROSS_CHECKED` against the source's own 6-palace invariant (`canonical-ruleset-v1.md` §5) | ✅ PASS |
| 5 | Thân | `TUVI-MT-02`/`TUVI-MT-03`, same evidence | ✅ PASS |
| 6 | Cục | `TUVI-CUC-01`, `PRIMARY_SOURCE_RECHECKED` ×3, 30/30 cells clean | ✅ PASS |
| 7 | Tử Vi anchor | `TUVI-TVA-01` (4/5 Cục blocks clean) + `TUVI-TVA-02` (Kim Tứ Cục, `CONVENTION_LOCK_REQUIRED`, day 24→Mùi, independently formula-corroborated) | ✅ PASS (via disclosed lock) |
| 8 | 14 Chính Tinh | `TUVI-TV-GRP`/`TUVI-TP-GRP`, offsets `INDEPENDENT_SOURCE_CORROBORATED` (`mingming3.com`) | ✅ PASS |
| 9 | Main-star offsets (direction-label policy) | `canonical-ruleset-v1.md` §2 — encode `anchor+offset mod 12` directly, never a direction-label loop; re-confirmed unchanged | ✅ PASS |
| 10 | Tuần | `TUVI-TUAN-01`, `PRIMARY_SOURCE_RECHECKED` ×3, self-consistent | ✅ PASS |
| 11 | Triệt | `TUVI-TRIET-01`, `CONVENTION_LOCK_REQUIRED` (table over worked example), now `INDEPENDENT_SOURCE_CORROBORATED` ×2 | ✅ PASS (via disclosed lock) |
| 12 | Tứ Hóa | `TUVI-TUHOA-01`, `PRIMARY_SOURCE_RECHECKED` ×3, 40/40 cells clean | ✅ PASS |
| 13 | Giờ Tý / day rollover | `TUVI-GIO-01` (hour labeling, clean) + `TUVI-GIO-02` (day rollover, `CONVENTION_LOCK_REQUIRED`, midnight rollover, disclosed as non-VDTTL-specific) | ✅ PASS (via disclosed lock) |
| 14 | CORE_13 auxiliary stars | §2 above — 13/13 `IMPLEMENTATION_READY`, scope founder-locked this sprint | ✅ PASS |
| 15 | Golden/regression-vector strategy | `golden-vector-v2-spec.md` — Class A (0, honestly absent, not fabricated) / Class B (6, fully computed, all 5 Cục, both convention-lock cells, both sides of the Triệt lock) | ✅ PASS |
| 16 | Deterministic/AI boundary | `sprint-18b-revised-entry-gate.md` §6, unconditional, re-confirmed unchanged this sprint | ✅ PASS |

**Convention-lock machine-implementability check** (explicit, per this sprint's Phase 3 instruction): all 4 locks (Kim Tứ Cục day 24→Mùi; Triệt table-over-example; midnight day-rollover; leap-month-repeats-preceding-month) are each a single named constant or a one-line conditional — none require runtime interpretation, none require an LLM call, none are ambiguous about which of two values to apply. Each is documented with its exact trigger condition in `canonical-ruleset-v1.md` §7's table. **All 4 pass the machine-implementability check.**

## 7. Complete entry-gate PASS count

**16 / 16.**

## 8. Complete entry-gate FAIL count

**0.**

---

## 9. Canonical ruleset promotion result

**Promoted.** `TUVI_RULESET_CANDIDATE_V1 = VDTTL_1956_CANDIDATE_1` → `TUVI_RULESET_V1 = VDTTL_1956_V1`, status `IMPLEMENTATION_READY`. Recorded in `canonical-ruleset-v1.md` §7, with every convention lock listed explicitly. Candidate/history records preserved, not erased — §1's full rule inventory and §5's derivation remain exactly as researched; the promotion is additive.

## 10. Final ruleset identifier

`TUVI_RULESET_V1 = VDTTL_1956_V1`

## 11. Version identifiers

| Identifier | Value |
|---|---|
| `TUVI_ENGINE_VERSION` | `tuvi-engine-v1` (reserved; no engine exists yet) |
| `TUVI_RULESET_VERSION` | `vdttl-1956-v1` |
| `TUVI_CALENDAR_VERSION` | inherits the existing verified Hồ Ngọc Đức algorithm wrapper version (no new calendar version introduced) |
| `TUVI_AUXILIARY_SCOPE_VERSION` | `core-13-v1` |

Full table: `canonical-ruleset-v1.md` §8. Documentation only — no application constant was added to any source file.

## 12. Golden-vector policy status

Unchanged and preserved: `SOURCE_ANCHORED_VECTOR` (Class A, 0, honestly absent) vs. `RULE_DERIVED_TEST_VECTOR` (Class B, 6, fully computed and labeled as such). No rule-derived vector was or will be relabeled as independent. This sprint added no new vectors — `golden-vector-v2-spec.md` is unmodified.

## 13. Human-expert limitation disclosure

Unchanged and re-confirmed: no human Tử Vi expert participated in this sprint or any prior one. `EXPERT_CONFIRMED` was not used anywhere in this sprint's work, including in the CORE_13 verification table above — every "rechecked" claim states which AI-driven re-read produced it and when, per `ai-only-verification-standard.md`.

## 14. Deterministic/AI boundary

Restated, unconditional, unchanged from Sprint 18A.5: no LLM star placement, no LLM table repair, no runtime rule inference, no reuse of Eastern Horoscope's element mapping as Cục, no silent school mixing, no AI-driven change to a computed result. Full statement: `sprint-18b-revised-entry-gate.md` §6.

## 15. Final Sprint 18B implementation phases

| Phase | Inputs | Outputs | Test gate | Stop condition |
|---|---|---|---|---|
| **18B.1** — Calendar adapter reuse + canonical input normalization | Birth date/time (Gregorian), sex; existing Hồ Ngọc Đức algorithm wrapper | Normalized lunar date (year/month/day, leap flag), UTC+7-fixed hour branch | Round-trip test against ≥5 known Gregorian↔lunar pairs from the existing wrapper's own test suite | If the existing calendar wrapper cannot be reused as-is (a genuinely new conversion implementation would be needed), STOP and re-open `TUVI-CAL-01` — do not hand-write a new converter |
| **18B.2** — Can Chi + 12-palace skeleton + Mệnh/Thân | Lunar date, hour branch | Year/month/day/hour Can-Chi; empty 12-palace ring; Mệnh, Thân palaces | Mệnh/Thân match `golden-vector-v2-spec.md`'s 6 vectors exactly; Thân-offset invariant (`{0,2,4,6,8,10}`) holds as a hard assertion on every run, not just test inputs | If any input produces a Thân offset outside that 6-value set, STOP — this is a code defect, not a domain question (the domain question is closed, `DETERMINISTICALLY_CROSS_CHECKED`) |
| **18B.3** — Cục | Year Can, Mệnh Chi | One of 5 Cục values | Matches `canonical-ruleset-v1.md` §3's table for all 6 test vectors | Never a 6th value, never null for a complete input |
| **18B.4** — Tử Vi anchor + 14 Chính Tinh | Cục, lunar day; Tử Vi's palace | Tử Vi + 13 other main-star palaces | Matches all 6 vectors; Kim Tứ Cục day-24 case explicitly asserts the locked value (Mùi), with a code comment citing `canonical-ruleset-v1.md` row 14 | A later phase must never "correct" an 18B.4 output to make an 18B.5+ feature look better — if a discrepancy appears downstream, the bug is here, not papered over later |
| **18B.5** — Tuần + Triệt + Tứ Hóa | Year Can (+ decade group for Tuần) | Tuần palace pair, Triệt palace pair, Tứ Hóa's 4 assignments | Matches all vectors that computed these fields; Triệt's Canh-year case explicitly asserts Mùi/Ngọ (not Thân/Dậu), with a comment citing the convention lock | Never silently fall back to VDTTL-1956's own disputed worked example for Triệt |
| **18B.6** — CORE_13 auxiliary stars | Year Can/Chi, lunar month, hour branch, sex | All 13 CORE_13 star palaces | Matches every vector's computed auxiliary fields; a new test added for Hỏa Tinh/Linh Tinh (the one disclosed gap in the existing 6 vectors) | Implementing any of the 27 non-CORE_13 stars found in VDTTL-1956 without a fresh, explicit founder scope-expansion decision is itself a stop condition |
| **18B.7** — Canonical full-chart composition | All prior phases' outputs | One immutable canonical chart object per `calculation-specification.md` §14's shape, tagged with `TUVI_ENGINE_VERSION`/`TUVI_RULESET_VERSION`/`TUVI_CALENDAR_VERSION`/`TUVI_AUXILIARY_SCOPE_VERSION` | Deterministic repeatability: same input + same versions → byte-identical output, every run | Any nondeterminism (unordered map iteration, floating-point drift) found here blocks this phase, not a later one |
| **18B.8** — Golden/regression suite + adversarial boundary tests | The 6 existing Class B vectors + new ones closing the disclosed coverage gaps (remaining 5 Can, leap-month/Tết-boundary cases via the real calendar layer, Hỏa Tinh/Linh Tinh) | Automated test suite | 100% pass, all labeled `RULE_DERIVED_TEST_VECTOR` in test names/comments, never `EXPERT_CONFIRMED` or "golden" without qualification | A failing vector blocks all later phases, per `an-sao-logic-audit.md`'s existing "no partial re-run" discipline |
| **18B.9** — Persistence/API | Canonical chart object | Stored `TuViReading`-shaped record (per `calculation-specification.md` §14), API endpoint | Round-trip: persist → reload → byte-identical to the original canonical chart | No endpoint may return a partial chart labeled as complete (`INCOMPLETE_CANONICAL_CHART` fails closed, per `calculation-specification.md` §10) |
| **18B.10** — Frontend Lá Số rendering | Persisted chart via API | 12-palace visual chart | Visual QA against at least 2 of the 6 reference vectors, including the maximal-density wraparound case (V-B6) to confirm the UI handles 5-stars-sharing-2-palaces cleanly | UI must never invent, omit, or reposition a star to make the layout look cleaner |
| **18B.11** — AI interpretation boundary | Finished, persisted canonical chart only | Narrative interpretation | Interpretation payload contract test: the AI call receives no field it could use to recompute a placement, and a fabricated/altered placement in test input causes a detectable mismatch | Any code path where AI output could change a stored deterministic fact is a stop condition, not a bug to fix later |
| **18B.12** — Playwright + responsive QA + release closure | Full feature | Passing E2E suite, release notes | Matches this project's existing Discovery-system release-closure pattern (Tarot/Numerology/Natal Chart precedent) | Unchanged from existing project release discipline |

## 16. Files created

`docs/progress/sprint-18a6-entry-gate-closure.md` (this file). 1 new file.

## 17. Files modified

`docs/domain/tu-vi/canonical-ruleset-v1.md` (§1 rows 22–28 upgraded; §6 updated; §7–§8 added), `docs/domain/tu-vi/sprint-18b-revised-entry-gate.md` (§3 auxiliary row and §5 updated to reflect closure), `docs/domain/tu-vi/domain-decision-register.md` (DECISION-08 Sprint 18A.6 addendum added). All edits are additive/updating, no prior content deleted.

## 18. Application-code files touched

**0.** Confirmed via `git diff --stat -- apps/ packages/ prisma/` returning empty.

## 19. Commit status

**Not committed.**

## 20. Push status

**Not pushed.**

## 21. Deployment status

**Not deployed.**

## 22. Sprint 18B readiness

**Ready.** 16/16 gate items pass, 13/13 CORE_13 stars implementation-ready, ruleset frozen and versioned, phased implementation plan defined with explicit test gates and stop conditions per phase.

## 23. Exact next action

1. Begin Sprint 18B at phase **18B.1** (calendar adapter reuse) per §15's table — the only phase with zero remaining domain risk and no dependency on any other phase.
2. Carry `canonical-ruleset-v1.md`'s `CONVENTION_DECISION` column (4 locks) directly into code as named constants with comments citing the source row — do not let any lock become an unexplained magic number.
3. When 18B.8 (regression suite) is reached, close the disclosed coverage gaps from `golden-vector-v2-spec.md` (remaining 5 Can, leap-month/Tết-boundary cases, Hỏa Tinh/Linh Tinh) as automated tests rather than more hand computation.
4. If a genuine human Tử Vi expert or an independent worked chart ever becomes available, add it as a `SOURCE_ANCHORED_VECTOR` immediately, at any phase — it remains the strongest possible evidence this domain can have.

## Final verdict

**SPRINT 18A.6 COMPLETE — SPRINT 18B IMPLEMENTATION AUTHORIZED**
