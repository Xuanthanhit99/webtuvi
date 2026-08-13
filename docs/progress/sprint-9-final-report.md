# Sprint 9 — Natal Chart Discovery Foundation — RELEASE CLOSURE REPORT

Date: 2026-08-13 (closure session; original implementation landed 2026-08-12)
Branch: `master`, HEAD `30cdd32` throughout (unchanged since baseline)

This document supersedes the earlier implementation-only report of the same filename. It records
an **independent verification pass** performed without trusting the prior implementation
session's claims — every number below was re-derived by actually running the suite, reading the
actual code, or reproducing the actual failure, not copied from the earlier report.

---

## 1. Final verdict

# READY FOR SPRINT 10

(See §41–46 for the full evidence basis. No unresolved Blocker or High finding exists.)

## 2. Recovered HEAD

`30cdd32` ("check AI"), `master`, matches `origin/master`/`origin/HEAD`, unchanged through the
entire closure session. No commits were made until the very end of this session (see §3).

## 3. Commit hash

See the closing section of this report — a commit was created **after** this report reached the
READY verdict, per Phase 35's explicit rule. If you are reading this before that commit landed,
treat commit-hash claims elsewhere as informational only and check `git log` directly.

## 4. Working tree status (before closure's own commit)

25 changed paths: 15 modified tracked files, 10 new untracked files/directories (the original
9 plus this report's own predecessor). `git status --short`, `git diff --check`, and a repo-wide
secret scan were all re-run fresh during this closure (§30) and came back clean.

## 5. Sprint 9 file scope

Confirmed via `git diff -- <path>` read in full for every modified file, and full `Read` of every
new file — see §41 (files created) / §42 (files modified). No unrelated/machine-local files were
present in the diff.

## 6. Product Bible reconciliation

Independently re-read Module 13 in full, cross-checked against actual code (not the architecture
doc's own claims). Summary table (full detail in the audit transcript):

| Requirement | Verified |
|---|---|
| Birth date/time/location, unknown-time degrade | Yes — matches Bible exactly |
| Geocoding, timezone (incl. historical VN correction) | Yes — real live Nominatim, tested |
| Sun/Moon/planets/Ascendant/houses/aspects | Yes |
| Big Three, chart wheel | Yes |
| AI interpretation boundary, Companion bridge | Yes — genuinely wired, not mocked |
| Premium gating (free content, paid depth only) | Yes |
| Mobile responsiveness | Yes (with the fix from the implementation session verified present) |
| History/lifecycle | Yes |

Three genuine gaps found, all now explicitly disclosed (previously under-disclosed to varying
degrees):
- **Approximate/ranged birth time** (Bible §16's "midpoint of a range" suggestion) has no code
  path — only exact `HH:mm` or full omission. **Real, was undisclosed — now added to
  `docs/architecture/natal-chart-discovery.md`'s "Explicitly deferred" section during this
  closure.**
- **Bible §18's `synthesizeIdentityTheme`** (a distinct, stricter-evidentiary-bar synthesis step)
  doesn't exist as a separate mechanism — the implementation uses one flat structured LLM call.
  This maps to the already-approved, already-documented Foundation-sprint scope decision
  ("Insight Engine hookup" deferred) made before implementation began — not a new gap, but the
  docs didn't name the specific Bible mechanism. Judged non-blocking: the approved plan
  explicitly chose this simpler shape for Foundation-sprint scope, and it fully satisfies the
  brief's own Phase 11 requirement (independently renderable sections).
- **Automatic Identity-memory materialization** (Bible §1/§8) is deferred, matching Tarot/
  Numerology precedent exactly and already disclosed in both docs — confirmed as a conscious,
  approved scope decision, not an oversight.

## 7. Astronomical engine

`circular-natal-horoscope-js@1.1.0` (Unlicense). Confirmed actually installed and imported (not
just declared) via `node_modules/.pnpm/circular-natal-horoscope-js@1.1.0`. Confirmed via a live
probe script (not just reading source) that the library's own `Aspects.all` output is already
deduplicated (0 duplicate A↔B/B↔A pairs, 0 self-pairs, in a 19-aspect real chart) — the
calculator service's downstream angle/orb computation was independently traced and confirmed to
consume this correctly.

## 8. Library / version / license

Unlicense (public domain), version `1.1.0`, pinned via `NATAL_CHART_ENGINE_VERSION` constant and
persisted per-chart (`engineVersion` column) for reproducibility.

## 9. Zodiac mode

Tropical — centralized constant, confirmed the only value ever used (no per-request override
path exists in the calculator or DTOs).

## 10. House system

Placidus — confirmed centralized. The 66.5° polar-latitude fallback (chosen because the library
returns finite, non-error values even past the pole) was independently re-verified via the fresh
re-run of `natal-chart-calculator.service.spec.ts` (15/15 passing, including the extreme-latitude
degrade case).

## 11. Orb rules

Major aspects only (Conjunction/Opposition/Trine/Square/Sextile), library default orbs, one
centralized constants file — confirmed via direct read, no scattered overrides found anywhere in
the diff.

## 12. Golden-vector result

Independently re-run (not just re-read) `natal-chart-calculator.service.spec.ts` fresh: **15/15
passing**, including externally-sourced astronomical facts (2020/2000 March equinox UTC instants,
2020 June solstice) verified against space.com/Wikipedia, and physical-law elongation limits for
Mercury/Venus. These reference values are independent of the library under test — genuine
golden-vector methodology, not circular verification.

## 13. Timezone result

Traced the full chain (place → geocoded coordinates → `tz-lookup` → optional country-code
override → `Origin`) by reading `natal-chart-timezone.util.ts` in full. Confirmed no use of
browser/server timezone for birth-time interpretation anywhere in the calculation path. The one
documented VN override (Hanoi `tz-lookup` misclassification → `Asia/Bangkok` corrected to
`Asia/Ho_Chi_Minh`) was re-verified via a fresh, independent test-suite run (part of the 15/15
above). Historical-offset correctness for VN specifically is unit-tested; other countries rely on
the library's own `moment-timezone` historical-zone data, not re-verified per-country in this
closure (matches the original scope — "narrow, disclosed correction," not a general fix).

## 14. Geocoding/Nominatim result

Confirmed via direct code read (`nominatim-geocoding.provider.ts`, `geocoding.service.ts`,
`geocoding.controller.ts`, `geocoding-search.dto.ts`): server-side only (no browser-callable
Nominatim path exists), identifying `User-Agent`, request timeout with `AbortController`, query
length bounded at both DTO (`@MaxLength(200)`) and service level (defense in depth), opaque
random-UUID tokens (not sequential/guessable), Redis TTL cache, truthful
`GeocodingUnavailableError` on any failure (never fabricated coordinates — traced every failure
branch). Auth-gated (`JwtAuthGuard`) and covered by the project-wide `CsrfGuard` (confirmed
registered as `APP_GUARD` in `csrf.module.ts`, applying automatically to every controller
including this one — the controller's own comment claiming this was verified accurate, not
assumed).

## 15. Migration result

Read the full migration SQL directly: 5 new tables (`natal_charts`, `natal_placements`,
`natal_houses`, `natal_aspects`, `natal_chart_history`), 6 new enums, appropriate indexes
(`userId+status+createdAt` composite for the charts table; `chartId` + unique
`chartId+body`/`chartId+number` on child tables), and exactly one `ALTER TABLE` per child table —
each adding only a `FOREIGN KEY ... ON DELETE CASCADE` to a table this same migration creates.
**Zero** `DROP`, zero `ALTER` on any pre-existing table. `prisma validate` and
`prisma migrate status` both re-run fresh during this closure — pass / up to date.

## 16. Planet calculation result

Confirmed via the fresh golden-vector suite re-run (§12) and via direct code trace: all 10
classical planets (Sun–Pluto), retrograde flag, sign, degree-in-sign, and house (when available)
computed once and persisted — never recomputed on read.

## 17. Ascendant result

Correctly gated by `housesAvailable` (birth time known AND latitude below the polar threshold);
`null` otherwise, never fabricated — confirmed in code and in the real chart screenshot (§37).

## 18. House result

Same gating as Ascendant; `NatalHouse` rows only created when houses are available (confirmed in
the migration's conditional `createMany` call read directly in `natal-chart-record.service.ts`).

## 19. Aspect result

Independently proven deduplicated at the library level (§7) and confirmed the persistence/mapper/
frontend chain never re-filters or re-derives aspects — the backend `create()` transaction
persists `result.aspects` from the calculator as-is, the mapper does a straight 1:1 map, and
`aspect-list.tsx` only sorts by orb, never filters.

## 20. Chart-wheel correctness

Independently traced the actual longitude→screen-angle math in `natal-chart-wheel.tsx`
(`toRad`/`pointOnCircle`/`makeLongitudeToScreenAngle`): 0°/90°/180°/270° all map correctly by
hand-trace, and the 359°/1° wraparound is correctly continuous through `cos`/`sin` (no
normalization bug). One **LOW, non-blocking** finding: the crowding/glyph-collision-easing logic
only compares each planet to its immediate array-neighbor after sorting by raw longitude, so a
pair straddling exactly 0°/360° (e.g., 359° and 1°) never gets the outward-nudge the rest of the
wheel gets. This affects only cosmetic glyph spacing in a rare configuration, not position
correctness, and the component's own comment already discloses the collision-easing is "a
deliberately modest visual simplification," so this is a real but narrow gap in that existing
disclosure, not a new defect class.

## 21. Big Three result

Confirmed single-source-of-truth: `big-three-summary.tsx` derives Sun/Moon/Ascendant purely from
the same `chart` object rendered by the wheel and planet list — no independent recalculation
exists anywhere in the feature folder. Verified visually in the real screenshot (§37): Sun Gemini
/ Moon Sagittarius / Rising Libra, matching the golden-vector input exactly.

## 22. API/ownership result

`findOwned()` fetches by `id` then checks `chart.userId !== userId` in application code (not a
compound Prisma `where`) — functionally safe (single-record fetch, no data returned before the
check, identical 404 either way) but noted as a defense-in-depth nuance. **Confirmed this is not
a Sprint 9 pattern**: it is a byte-for-byte mirror of `NumerologyRecordService.findOwned()`
(already-shipped Sprint 8 code, diffed directly to confirm). Not changed during this closure —
doing so would mean unilaterally altering already-committed precedent outside this sprint's
scope, and it carries no live risk as written. Real two-user IDOR tests (register two accounts,
attempt cross-access on every route) exist and were re-run fresh as part of the full e2e suite
(§26) — pass.

## 23. Security/privacy findings

No Blocker or High findings. Full checklist (IDOR, CSRF, mass assignment, invalid coordinates/
timezone, oversized input, prompt injection via birth-place text, malformed dates, deleted/
archived-record access, raw-data logging, secret leakage, AI-metadata leakage) verified via direct
code read and cross-checked against a fresh 91/91 unit-test and 19/19 e2e-test re-run. One **Low,
informational** item: soft-deleted/archived charts remain fetchable by their own owner via direct
ID/history/status-filtered-list — confirmed intentional and identical to the pre-existing
Numerology pattern (not a Sprint 9 regression), but not explicitly called out as intentional in
either doc; worth a product-owner confirmation in a future pass, not a release blocker.

## 24. AI boundary result

Traced the exact write path in `natal-chart-record.service.ts`: `create()` persists all
calculated facts in one Prisma transaction, returns, and *only then* calls
`generateInterpretation()` as a separate best-effort step whose only DB write is
`{ interpretation, interpretedAt }` on the same row — structurally incapable of touching
`NatalPlacement`/`NatalHouse`/`NatalAspect` rows or any other `NatalChart` column. Confirmed the
interpretation service (`natal-chart-interpretation.service.ts`) reuses the shared
`ProviderOrchestratorService`/`SafetyService` (no second AI client), and that the one piece of
user-influenced free text reaching the prompt (`birthPlaceLabel`) is screened by
`SafetyService.checkInput()` before being embedded — real prompt-injection mitigation, not
absent.

## 25. Real Gemini Natal result

**A second, independent real Gemini call was made during this closure session** (not just a
re-read of the prior session's own claim). `DEFAULT_AI_PROVIDER` was temporarily set to `gemini`,
the API restarted, and a real chart created end-to-end via raw HTTP calls (real registration,
real live Nominatim search for "Ha Noi", real chart creation) — not through the seeded/mocked
path. Result: **PASS**. `.env` was reverted to `openai` and the API restarted back to normal
immediately after.

## 26. Actual Gemini model

Confirmed via a fresh `provider_logs` query (Prisma client, not response-text inference):
```
provider: GEMINI, model: gemini-3.5-flash-lite, success: true, latencyMs: 5052
```
This is a distinct row (different id/timestamp) from the prior session's own smoke-test row —
genuine new evidence, not a stale read.

## 27. AI usage/observability result

`provider_logs` is the authoritative source and is unambiguous. `ai_usages` has no matching row
for Discovery-feature interpretation calls (Tarot/Numerology/Natal Chart alike) — confirmed this
is consistent, expected behavior (that table tracks Companion-conversation calls specifically),
not a Natal Chart-specific gap. Chart facts (`placements`/`ascendant`) were queried before and
after the interpretation call via direct HTTP round-trips and confirmed byte-identical.

## 28. Companion bridge result

Read the full diff of `context-builder.service.ts` directly: one new `Promise.all` entry
(`prisma.natalChart.findFirst`), scoped to `{ userId, status: 'ACTIVE', visibility:
'COMPANION_VISIBLE' }`, pulling only Sun/Moon placements plus `ascendantSign` and an
`overview`-only extraction of the interpretation. No write path exists in this file. Confirmed
one-directional module dependency (`NatalChartModule` imports `CompanionModule`; the reverse
import does not exist — checked both module files directly).

## 29. Premium result

`EntitlementService.hasPremiumAccess()` reused identically to Tarot/Numerology (grep-confirmed,
not a new pattern). Core chart facts (placements/houses/aspects/ascendant/midheaven) are never
gated — confirmed by reading `create()`/`getOne()`, which return the full chart regardless of
tier. Only interpretation token budget/prompt depth, one optional memory-personalization
reference, and history-list depth (Free: 20) differ by tier, plus a status-agnostic daily
creation ceiling (5 free / 15 premium) framed as cost control.

## 30. Backend unit result

Fresh, independent re-run during this closure: **95 suites / 895 tests, all passing** (full
monorepo backend unit suite, not just the Natal Chart subset). Natal Chart's own 8 suites / 91
tests are included in that total and were also separately confirmed.

## 31. Frontend unit result

Fresh, independent re-run: **66 suites / 314 tests, all passing** (full frontend suite). Natal
Chart's own 7 suites / 32 tests included.

## 32. Backend e2e result

Fresh, independent re-run of the full suite: **12/16 suites passed on the first parallel run**
(4 failed: Companion+Memory, Review, Insight-Experience, Account-Security — none touch Natal
Chart code). `natal-chart.e2e-spec.ts` itself: **19/19 passing**. The 4 failing suites were
**re-run in isolation** (serially, `--runInBand`) and came back **4/4 passing, 59/59 tests** —
proving the original failures were resource-contention flakiness (elevated durations on the
first parallel run: 694s/715s for suites that normally run in ~130s) from running 16 suites
concurrently with an unrelated CPU-heavy production build, not real regressions. This
reproduction step is the evidence basis for classifying these as Category D
(environment/infrastructure), not Category A (Sprint 9 product defect).

## 33. flow-23 result

**Root-caused and fixed a genuine environment defect during this closure**: `npx playwright`
was resolving an ad-hoc CLI version (**1.62.1**) that didn't match the repo's installed
`@playwright/test@1.62.0`, producing a version-mismatch failure
(`test.describe.configure() did not expect to be called here`) on **every** spec file in the
suite, not just flow-23 — confirmed by reproducing the identical error on the pre-existing,
untouched `flow-22-numerology-discovery.spec.ts`. Fixed by invoking the exact local binary
(`./node_modules/.bin/playwright`, version confirmed `1.62.0`) instead of `npx`. After the fix:
flow-23 passed **4 times in a row** (one isolated run, two more sequential runs, and once more
within the full-suite run) — genuinely stable.

## 34. Full Playwright result

Fresh production build (both API and web rebuilt clean, `rm -rf .next`/`dist` first), fresh
server restart, full suite run via the corrected local binary: **26/32 passed**. The 6 failures
(Companion+Memory suggestion/forget, Reflection Foundation ×2, Insight preparation, Insight
Experience, Monthly Review) are all in modules with **zero Sprint 9 code changes**, all fail on
plain `toBeVisible`/timeout assertions (not logic-content mismatches), and this exact
failure-category composition (Companion+Memory, Reflection, Insight, Review) matches — word for
word — both the original Sprint 9 implementation session's own independently-observed Playwright
result and Sprint 8's own separately-documented baseline. A follow-up isolated re-run of just
these 6 tests produced a *different* specific subset failing each time (non-deterministic across
reruns) while under confirmed severe memory pressure (18 zombie Chromium processes, ~1.1GB free
RAM out of 16GB, one very stale `nest start --watch` process running since 11:39 AM that was
cleaned up mid-closure) — consistent with environment-driven flakiness in these specific timing-
sensitive specs, not a stable, reproducible Sprint 9 regression. Classified Category D.

## 35. Production build result

Both apps rebuilt clean from scratch during this closure (`rm -rf dist`/`rm -rf .next` first).
API: `nest build` — success. Web: `next build` — success, confirmed `/discover/natal-chart`
present in the static route manifest, statically prerendered (`○` marker). No SSR/hydration
errors observed in server logs during subsequent manual verification.

## 36. Manual desktop result

Real browser screenshot (fresh registration → onboarding → Discover → Natal Chart form → live
Nominatim search "Ha Noi" → select → calculate) at 1440×900: clean layout, chart wheel renders
correctly with all planet glyphs/aspect lines/Ascendant marker, Big Three shows Sun Gemini/Moon
Sagittarius/Rising Libra (matching the golden vector exactly), calculated-vs-AI labeling clearly
visible ("Được tính toán từ dữ liệu sinh — calculated from your birth data, never chosen by AI"),
honest "Interpretation isn't ready yet" state with a working retry button (the dev `.env`'s
`openai` key has no credits, correctly falls back through to an honest non-fabricating state).

## 37. Manual tablet result

Real browser screenshot at 834×1194: chart renders correctly, layout clean, no horizontal
overflow. **New finding during this closure** (LOW severity, see §20-adjacent detail below):
programmatically scrolling to a non-interactive text node inside a lower planet card
(`scrollIntoViewIfNeeded()` on "Moon") lands with that card's body-paragraph text partially
obscured behind the fixed bottom nav bar at this specific viewport width. Verified this is a
**real rendering result** (via a real, non-fullPage, scrolled viewport screenshot), not a
fullPage-screenshot stitching artifact. This is a **different, narrower** issue than the one the
original implementation session found and fixed (that fix specifically covers the "Calculate my
chart" submit button's keyboard/programmatic-scroll target, and was re-verified in this closure
to still work correctly, screenshot in §38). The mechanism (`scroll-padding-bottom: 5rem`)
guarantees the *scroll target itself* clears the fixed nav but does not guarantee everything
*below* that target within the same card also clears it. Real-world impact is narrow: it only
manifests via programmatic/assistive-technology scroll-to a specific mid-card text node, not
ordinary touch/mouse scrolling, and did not reproduce at true mobile width (390px) in the same
test. Judged LOW/non-blocking, not fixed during this closure (see recommended next step, §49) —
fixing it well would mean auditing `scroll-margin-bottom` behavior across every list-item card in
this feature and possibly others, which is broader than a same-session safe fix.

## 38. Manual mobile result

Real browser screenshot at 390×844: layout clean, no overflow, Big Three/Planets cards render
correctly with the same programmatic-scroll target ("Moon") clearing the nav with no overlap
(unlike tablet). Separately re-verified the specific originally-fixed bug (submit button
clearing the bottom nav after scroll) is **still fixed and working** — real screenshot shows
clean spacing between "Calculate my chart" and the bottom nav.

## 39. Accessibility result

Confirmed via direct code read (not a full WCAG audit, per brief's own "quick pass" scope):
`BirthInputForm` uses proper `<label>`/`htmlFor` associations via the shared `FormField`
component, `role="alert"` on error/limit messages, a real disabled state on the birth-time input
when marked unknown, and no per-keystroke network calls. `InterpretationSections` uses
`aria-expanded`/`aria-controls` on its collapsible triggers and an explicit "Written by AI..."
caption. The chart wheel's internal SVG elements are `aria-hidden`, with `role="img"` and a
computed accessible name plus sibling list components (Planets/Houses/Aspects) providing the real
non-visual equivalent, matching Module 13 §20. No blocking accessibility defect found within this
scope.

## 40. Tarot/Numerology regression result

Both suites' backend e2e specs (`test/tarot.e2e-spec.ts`, `test/numerology.e2e-spec.ts`) were
included in, and passed within, the fresh full-suite e2e re-run (§32). Both Discovery systems'
Playwright flows (`flow-20-tarot-discovery.spec.ts`, `flow-22-numerology-discovery.spec.ts`) also
passed within the fresh full Playwright re-run (§34). No regression found in either system.

## 41. Defects found during closure

- Undisclosed approximate/ranged-birth-time gap (Bible §16) — documentation gap, not a code
  defect (**fixed** — added to the architecture doc's "Explicitly deferred" list).
- Stale `bodyA`/`bodyB` field-naming reference in the architecture doc (actual fields are
  `pointA`/`pointB`) and an inaccurate "planet/node/Lilith" claim (lunar nodes/Lilith are not
  implemented) — documentation-only (**fixed**).
- Chart-wheel collision-easing doesn't nudge apart planets straddling the exact 0°/360°
  wraparound boundary — real, narrow, LOW-severity cosmetic gap (**not fixed** — see §49).
- Tablet-width `scrollIntoViewIfNeeded()` on non-interactive planet-card text can leave that
  card's body text partially behind the fixed bottom nav — real, narrow, LOW-severity gap
  distinct from the already-fixed submit-button case (**not fixed** — see §49).
- `findOwned()` uses fetch-then-check-in-app-code rather than a compound Prisma `where` —
  confirmed functionally safe, confirmed to be an exact mirror of already-shipped Sprint 8
  precedent, not a Sprint 9-introduced pattern — **not changed** (out of this sprint's scope; see
  §49).
- Soft-deleted/archived charts remain fetchable by their own owner — confirmed intentional,
  consistent with existing Numerology precedent — **not changed**, flagged as a LOW
  product-confirmation item for a future pass.
- `npx playwright` version-drift causing every Playwright spec (not just flow-23) to fail with a
  misleading error — **fixed** (switched all closure-session Playwright invocations to the local
  binary; this is a session-environment issue, not a repo/CI configuration defect, since CI/other
  developer machines would resolve `npx playwright` against the correctly pinned local version
  under normal, non-network-interrupted conditions).

## 42. Defects fixed

See the "(**fixed**)" items in §41: two documentation corrections in
`docs/architecture/natal-chart-discovery.md`, and the local-Playwright-binary workaround applied
for the remainder of this closure session (no repo file changes were needed for that one — it was
purely an invocation-method fix).

## 43. Remaining Blocker

None.

## 44. Remaining High

None.

## 45. Remaining Medium

None identified specific to Natal Chart.

## 46. Remaining Low/Informational

- Chart-wheel 0°/360°-wraparound collision-easing gap (§20/§41).
- Tablet-width scroll-to-card-text nav-overlap gap (§37/§41).
- Soft-deleted/archived-chart owner-visibility — confirm intentional with product (§23/§41).
- `findOwned()` fetch-then-check pattern — confirmed safe, informational only (§22/§41).

## 47. Runtime-unverified items

- Nominatim behavior under sustained production load/rate-limiting was not stress-tested (only
  ordinary single-request usage exercised live) — documented as an MVP-appropriate limitation in
  the architecture doc, unchanged by this closure.
- Historical-timezone correctness for countries other than Vietnam relies entirely on the
  library's own `moment-timezone` data and was not independently spot-checked per-country in this
  closure (matches original scope: a narrow, disclosed VN-specific correction, not a general
  audit).
- No second real-Gemini call beyond the two total made across both sessions (cost-bounded by
  design).

## 48. Known limitations

Unchanged from the architecture doc, plus the two additions made during this closure (§6, §41):
extreme-latitude Placidus houses handled via a disclosed threshold rather than library-native
error detection; no in-place birth-data edit/regeneration; no automatic Identity-memory
materialization or Insight Engine hookup this Foundation sprint; major aspects only; no sidereal
option; and now explicitly: no approximate/ranged birth-time input.

## 49. Recommended next step

None of the four Low/Informational items rise to release-blocking severity, but a short follow-up
pass could reasonably: (a) extend the chart-wheel's collision-easing to check the sorted array's
wraparound neighbor (first-vs-last element) in addition to adjacent pairs; (b) add
`scroll-margin-bottom` to individual planet/house/aspect list-item cards (not just the page-level
`scroll-padding-bottom`) so any future programmatic-scroll target within a card guarantees the
whole card clears the fixed nav, not just the scrolled-to element; (c) get explicit product
confirmation that soft-deleted/archived charts remaining owner-visible is intended (matches
Numerology precedent, so likely yes, but not yet explicitly confirmed for Natal Chart). None of
these block Sprint 10.

## 50. Secret scan

Re-run fresh during this closure across the entire diff (tracked-file diffs and every new file):
zero API keys, tokens, or private keys found. The one hit (`password = 'Sup3r$ecretPass'` in
`natal-chart.e2e-spec.ts`) is the identical shared test-fixture constant used verbatim in all 15
other `apps/api/test/*.e2e-spec.ts` files in this repo — confirmed not a real secret.
`GEMINI_API_KEY` was never printed at any point in either session's real-Gemini smoke test.
`apps/api/.env` was touched transiently during this closure's own real-Gemini re-verification and
confirmed reverted to its original, git-ignored state (`DEFAULT_AI_PROVIDER=openai`) before this
report was finalized.

---

## Test summary (this closure's own fresh, independent re-runs)

| Suite | Result |
|---|---|
| Backend unit (full) | 95 suites / 895 tests — all green |
| Frontend unit (full) | 66 suites / 314 tests — all green |
| Backend e2e (full, parallel) | 12/16 suites; 4 failures reproduced as pass (59/59) in isolation |
| Backend e2e — natal-chart | 19/19 |
| Backend e2e — tarot / numerology | pass / pass |
| Golden-vector calculator spec | 15/15 |
| Playwright flow-23 | 4/4 runs passed after root-causing an `npx` version-drift issue |
| Playwright full suite | 26/32 — 6 failures, all pre-existing, cross-verified environment-driven |
| Real Gemini Natal smoke (this closure's own) | PASS — `provider_logs` confirmed |
| Production build (API + web) | Both clean, fresh rebuild |
| Manual desktop/tablet/mobile | All rendered correctly; 1 new LOW finding on tablet |

## Final verdict (repeated for clarity)

# READY FOR SPRINT 10
