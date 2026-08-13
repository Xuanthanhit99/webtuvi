# Sprint 10 Pre-Implementation Audit

Date: 2026-08-13. HEAD at audit time: `eee8aff` (master, in sync with `origin/master`, 0 ahead / 0
behind, working tree clean). This is a research/decision document only — no product code, Prisma
schema, or migrations were touched to produce it.

Authority order used throughout: (1) actual code at HEAD, (2) Prisma schema + applied migrations,
(3) Product Bible (`docs/reference/web-tu-vi/web-tu-vi/`), (4) release-closure reports, (5)
architecture docs, (6) progress docs, (7) older prompts/assumptions. Two prior audit docs
(`docs/audit/web-tu-vi-current-state.md`, dated 2026-08-07, and
`docs/audit/full-product-feature-gap-audit.md`, dated 2026-08-11) are now stale — both predate
Sprint 8.5's remediation commit (`cc48504`) and Sprint 9 (`b1a05ac`/`eee8aff`). Their specific
completion claims are superseded below; their still-useful pattern-identification (e.g., the
"frozen module" convention) is retained.

---

## 1. Git baseline

- Branch `master`, HEAD `eee8aff`, `origin/master` = `eee8aff`, 0 ahead / 0 behind, working tree
  clean, no merge/rebase/cherry-pick in progress, no partial Sprint 10 work exists anywhere.
- Recent history: `eee8aff` (merge of Sprint 9 with an unrelated homepage-exploration branch),
  `b1a05ac` (Sprint 9 Natal Chart, closure-verified READY FOR SPRINT 10), `152c14e`/`deb7fa4`
  ("nav homepage"/"update homepage" — introduced `/menh-vi/*`, see §5–7), `30cdd32` and earlier
  (Sprints 1–8).

## 2. Product Bible inventory

25 numbered modules (01–25) plus a v1.1 addendum under `docs/reference/web-tu-vi/web-tu-vi/`, one
accidental duplicate file (Module 4 has a byte-identical `(1)` copy — harmless, not a scope
signal). No dedicated Admin module exists despite two other modules referencing "Next module in
sequence: Admin" — Admin content is scattered across Modules 2/3/21 only (see §19).

| # | Module | One-line requirement |
|---|---|---|
| 1 | Product Vision & Strategy (+ addendum) | Discovery systems are "doorways," Companion+Memory is "the house"; ranked decision framework Trust > Memory > User Value > Retention > Revenue > Engagement |
| 2 | Business Model & Ecosystem | 16-module ecosystem, each justified by a "memory test"; monetize relationship depth, not content |
| 3 | Information Architecture | Systems/Product Tree/nav/state machine/permissions |
| 4 | Experience Design System | Calm First / Memory First / AI First visual system |
| 5 | Landing Experience | Frame as Companion relationship, not a horoscope app |
| 6 | Auth Experience | Persistent identity anchor; minimal friction |
| 7 | Onboarding | A conversation, not a wizard; Activation = first memory-referencing reply |
| 8 | Dashboard | Single daily focal point, not a feature launcher |
| 9 | AI Companion | Core relationship surface; reflection over advice |
| 10 | Memory | Structured, never directly user-writable, always user-deletable |
| 11 | Journal | Highest-richness freeform input, zero social surface |
| 12 | Tarot | Daily-cadence, lowest-friction Discovery — **shipped (Sprint 6)** |
| 13 | Natal Chart | One-time-durable Discovery, deterministic astronomy — **shipped (Sprint 9)** |
| 14 | Eastern Horoscope | Chinese zodiac/Five-Elements annual system — **not started**, see §8 |
| 15 | Numerology | Fastest-setup Discovery — **shipped (Sprint 8)** |
| 16 | Reports | Periodic cross-Memory/Journal/Discovery synthesis, premium-upsell context |
| 17 | Premium | Monetizes relationship depth, never content access |
| 18 | Community | Anonymized Groups/Clubs/Feed, explicitly NOT a social network |
| 19 | Notifications | Memory-triggered only, default-to-silence |
| 20 | Settings | Retention/export/deletion controls |
| 21 | Privacy and Trust | Trust Center, data classification, audit logging |
| 22 | Design Language System | Cross-cutting visual grammar |
| 23 | AI Architecture | One Companion AI service, one Memory graph |
| 24 | Engineering Architecture | Platform-level scale/reliability |
| 25 | The BeaconVie Constitution | Highest-authority mission/identity statement |

## 3. Current module completion matrix

Verified against actual code at HEAD, not sprint-name inference.

| Module | Status | Evidence |
|---|---|---|
| Auth | COMPLETE | Full register/login/refresh/CSRF/session mgmt; social buttons correctly disabled |
| Onboarding | COMPLETE | Scripted conversational flow, real Activation event |
| Dashboard | COMPLETE | Discovery/Memory cards are real `<Link>`s (fixed Sprint 8.5); branching hero CTA |
| Discover | COMPLETE (as a hub) | Tarot/Numerology/Natal Chart `available:true`; Eastern Horoscope `available:false`, honestly badged |
| Companion | COMPLETE | Multi-provider, SSE streaming, safety layer — one known bug, see §12 |
| Memory | COMPLETE | 11 subfolders, full lifecycle |
| Journal | COMPLETE | Full CRUD/export/timeline |
| Tarot | COMPLETE | Full engine+interpretation+Companion bridge+Premium gating |
| Numerology | COMPLETE | Same pattern as Tarot |
| Natal Chart | COMPLETE | Same pattern; independently release-closure-verified, READY FOR SPRINT 10 verdict already given for Sprint 9 itself |
| Eastern Horoscope / Tử Vi | NOT STARTED (real product) | Zero backend/frontend/Prisma trace outside `/menh-vi`; only inert UI strings ("Coming soon") |
| Premium (mechanics) | COMPLETE | `EntitlementService`, identical gating pattern across all 3 Discovery systems |
| Payment (production) | CONTRACT VERIFIED / BLOCKED | See §14 |
| Community | NOT STARTED | Zero code |
| Notifications | NOT STARTED | Zero code; Settings honestly says "coming soon" |
| Admin | NOT STARTED | No RBAC beyond authenticated-user; no Bible module spec exists to build against |
| SEO | PARTIAL | Real `sitemap.ts`/`robots.ts`, but everything past the marketing shell is intentionally non-indexable (see §18) |
| Privacy | PARTIAL | `/privacy` page exists; no backend audit-log/data-classification implementation verified this pass |
| Settings | PARTIAL | Password/sessions/memory-consent real; **profile edit, account-wide export, and account deletion have no backend endpoint at all** — page literally says "coming soon" (`settings/page.tsx:156`) |

**"Frozen" convention** (this repo's own term, defined across `docs/progress/sprint-8-final-report.md` and later docs): Reflection/Insight/Review/Goal are fully built and tested but have no Product Bible module backing them; later sprints are expressly forbidden from touching or expanding them; they're deliberately kept out of primary nav/Dashboard, reachable only via one collapsed "More tools" card in Settings.

## 4. Current Discovery architecture

`apps/web/app/(app)/discover/page.tsx` — live: Tarot, Numerology, Natal Chart (`available: true`,
real links). Eastern Horoscope is the only `available: false` card, badge "Coming soon," no
backend. Reached via primary nav (Dashboard/Companion/Journal/Discover/Settings, identical on
desktop and mobile) → Discover → per-card CTA, or via Dashboard's `discoverySuggestion` card. No
hidden/dead Eastern-astrology route exists anywhere outside `/menh-vi` (grepped and confirmed
empty). No competing entry point for astrology exists in the real, authenticated product shell.

## 5. `/menh-vi/*` route inventory

12 routes + 1 layout under `apps/web/app/menh-vi/`, 18 supporting files under
`apps/web/features/menh-vi/`.

| Route | Content |
|---|---|
| `/menh-vi` | Real composed dashboard-style layout (hero, "destiny tools," tarot/compatibility/timeline teasers, spotlight/dimension-grid/events/star-map sidebar) — all reading from `mock-dashboard.ts` |
| `/menh-vi/tarot` | Interactive but fully mock topic→shuffle→pick→flip→reveal flow — always reveals the same hardcoded card ("The Star") from `mock-tarot.ts`, regardless of which card position is clicked |
| `/menh-vi/la-so` ("Tử Vi Lá Số") | `MvComingSoon` placeholder |
| `/menh-vi/than-so-hoc` ("Numerology") | `MvComingSoon` placeholder |
| `/menh-vi/ban-do-sao` ("Star Map") | `MvComingSoon` placeholder |
| `/menh-vi/cong-dong`, `/kham-pha`, `/nhat-ky-van-menh`, `/suc-khoe`, `/su-nghiep`, `/tai-chinh`, `/tinh-duyen`, `/toi` | All `MvComingSoon` placeholders (Community, Explore, Journal, Health, Career, Finance, Love, Profile/Settings/Premium) |

**Zero API calls exist anywhere in the entire `/menh-vi` tree** (`grep -rn "fetch(|useQuery|axios|apiClient|/api/"` across both directories returns nothing). No auth integration — the route sits outside the `(app)` route group and outside `middleware.ts`'s protected-route matcher, i.e., it is publicly reachable without login.

## 6. `/menh-vi/*` purpose verdict

This is unambiguous from the code's own documentation, not inference. `apps/web/app/menh-vi/layout.tsx`:

> "Isolated design exploration, not part of the BeaconVie shell/nav... Deliberately does not reuse (app)'s layout, navigation, or design tokens."

`docs/design/menh-vi-reference-breakdown.md`:

> "Source: single desktop reference screenshot supplied 2026-08-12... this is a design *exploration*, built as an isolated route (`/menh-vi`), not a rebrand of BeaconVie... No API contracts, existing routes, or Sprint 9 (natal chart) files are touched."

`mv-coming-soon.tsx`: "these surfaces are intentionally left as honest 'coming soon' pages rather than guessed at, per this being an isolated design exploration, not a full product build."

**Classification: A (pure visual prototype) + E (static mock screens) + B (homepage redesign experiment).** Not C, F, G, I. It is a one-screenshot visual-fidelity exercise that got committed to the repo — real, disclosed, harmless, and dormant. It does **not** contain a real Eastern Horoscope implementation: `/menh-vi/la-so`'s "Tử Vi Lá Số" label is decorative branding copy on an empty placeholder, not a spec or a start on the actual feature. It does **not** already provide usable production components for a real Sprint 10 — no component calls a real API, no component has real state persistence, the one "functional" flow (`/menh-vi/tarot`) is entirely faked data.

## 7. Parallel-shell risk

Explicitly **not** a risk requiring resolution:
1. Is `/menh-vi` intended to replace the current shell? **No** — its own layout comment says so directly.
2. Is it just an experiment? **Yes**, confirmed by its own documentation.
3. Can its components be reused safely? **Only as static visual reference** (colors/spacing/motion ideas) — none of the components are wired to real data or auth, so none are drop-in reusable as product code.
4. Would building Sprint 10 inside current `/discover` duplicate work? No — `/menh-vi` has no real Eastern Horoscope logic to duplicate.
5. Would building Sprint 10 inside `/menh-vi` fragment the architecture? Yes, severely — it has no auth, no design-token integration, no API layer; building real functionality there would mean re-solving problems the main shell already solves.
6. Should Sprint 10 first consolidate the shells? **No** — there is nothing live to consolidate. `/menh-vi` is dormant and non-competing. Forcing a "consolidation sprint" around an inert 1-screenshot mockup would be manufacturing work that doesn't exist yet. If the team likes its visual direction, that's a future design-language discussion for the *real* shell (Module 4/22), not an urgent architectural fix.

## 8. Eastern Horoscope Bible requirements

**Critical finding: the Bible's "Eastern Horoscope" (Module 14) is a Chinese zodiac / Five-Elements
annual-cycle system — not a Tử Vi Đẩu Số (12-palace/star) natal chart engine, and not Bát Tự/Four
Pillars.** A full-text search of the entire Bible for "Tử Vi," "cung," "sao," "đại vận," "tiểu
vận," "lưu niên," "Bát Tự," "Four Pillars," "BaZi," "Zi Wei"/"Ziwei" returns **zero genuine
matches** — every raw hit for "Tử Vi" was a false-positive substring inside unrelated English
words. The product's brand name throughout the Bible is uniformly "BeaconVie"; the repo folder
name `web-tu-vi` is a legacy/working codename the Bible itself never defines or uses.

This means **"Tử Vi Đẩu Số" and "the Bible's Eastern Horoscope" are two different candidate
features, not two names for one**. Building a real 12-palace Tử Vi engine would not be
"implementing Module 14" — it would be inventing a net-new astrology system the Bible has never
scoped, priced, or ethically reviewed.

| Capability | Bible requirement | Scoping |
|---|---|---|
| Core computation | Deterministic Chinese lunisolar calendar + Five Elements engine, paired with curated reference content, never AI-approximated | **V1.5** tier (Module 1 §4); Module 16 ranks it **P3** ("expansion, not core-loop validation") |
| Content sections | Overview, Animal Sign, Five Elements, Year Energy, Seasonal/Growth Themes, Relationships, Career, Health Reflection, Annual Reflection, Deep Dive | Same V1.5 scope |
| Lucky numbers/colors/scores | — | **Permanently rejected**, not deferred — explicit "Rejected Alternatives" |
| Monthly/Seasonal finer cadence | Plausible extension | Deferred until annual cadence validates first |
| Multi-year Life Cycles | Longer-horizon extension | Future Expansion, no MVP/V1 claim |
| Compatibility/Family charts | Needs dual-consent architecture | Future Expansion, blocked on infra that doesn't exist |
| Voice reading | — | Deferred alongside Module 9's Voice Companion prerequisite |
| Annual Reports | Extension via Reports module | Future Expansion |
| Festival rituals | Culturally-resonant idea | Future Expansion, explicit design-risk caveat |
| Technical engine | Real lunisolar library, "meaningfully higher engineering bar" | Core V1.5 build |
| API/DB shape (Bible's own sketch) | `POST /eastern-horoscope/generate`, `GET /eastern-horoscope/interpret/:section`; tables `eastern_horoscope_profile`, `annual_theme_engagement` | Specified at design level |

Module 1's own trade-off note: *"Choosing memory depth over content breadth (V1.5 pushes out
Eastern Horoscope...) accepts slower initial market coverage in exchange for a defensible product
moat."* The Bible has always treated this as later than the systems already shipped (Sprints 8–9),
not as automatically next.

## 9–11. Technical feasibility, library strategy, Gemini boundary (reference material for whichever sprint eventually builds this)

**Technical feasibility**: the Bible's actual V1.5 scope (year-level zodiac + element, no palace/
star placement, no birth-hour requirement evident in the Bible's own API sketch) is architecturally
**simpler** than Natal Chart — no geocoding, no timezone-sensitive house system, no ephemeris. It
needs: (a) a deterministic Gregorian→Chinese-lunisolar year conversion, (b) a fixed
animal-sign/element lookup table (curated reference content, same pattern as Natal Chart's
`natal-chart-meanings.ts`), (c) persistence, (d) the same deterministic-core→Gemini-narrates
architecture already proven three times.

**Library candidate (real evidence, not assumption)**: web search (2026-08) surfaced
[`lunar-typescript`](https://github.com/6tail/lunar-typescript) — MIT license, actively maintained
(latest release ~2 months old at search time per npm), zero third-party dependencies, native
TypeScript, and it already supports solar/Chinese-lunar/Buddhist/Taoist calendars plus 干支
(stem-branch), 生肖 (zodiac), 五行 (five elements) — i.e., more capability than the V1.5 spec
needs, giving headroom. This is a real, evaluable candidate; nothing was installed. A second option
(`lunisolar`, `mcthib/lunisolar`) also surfaced but with less evidence of current maintenance.
Alternatives should still be evaluated for correctness against golden vectors before selection —
same discipline Sprint 9 applied to `circular-natal-horoscope-js`.

**Gemini boundary** (directly reusable from the now-3x-proven pattern): deterministic engine
computes animal sign/element/year-energy facts → persisted → Gemini narrates only, via the
existing `ProviderOrchestratorService`/`SafetyService`, with the same "hard rules: never invent a
fact you weren't given, tendency language only" system-prompt pattern Natal Chart/Numerology/Tarot
already use. Gemini must not calculate can-chi, place elements, or choose the animal sign — exactly
analogous to "Gemini never calculates a planet's longitude." This is fully compatible with the
Bible's own AI Architecture (Module 23, "one intelligence system") and the Companion bridge pattern
audited in §12.

## 12. AI infrastructure reuse

Confirmed reusable without a 4th AI integration: `ProviderOrchestratorService` + `SafetyService`
(the only two things `CompanionModule` actually exports), the 4-provider abstraction
(Gemini/OpenAI/Anthropic/Mock), `ProviderLog`/`AIUsage` observability models, and the Companion
bridge pattern (`ContextBuilderService` — each Discovery system adds one near-identical
`Promise.all` entry; a 4th would add a fourth). **Not shared, would need to be built per-feature if
wanted**: `CostControlService`/`CompanionThrottlerGuard`/`GenerationLockService` are Companion-only
today — Tarot/Numerology/Natal-Chart interpretation calls go through none of them, so a 4th feature
inherits that same gap (not a regression, just an existing pattern to be aware of), and prompt
versioning is ad hoc per-service (no shared `PROMPT_VERSION` constant pattern like Companion's).

**One real, already-known bug, unrelated to any Sprint 10 candidate but worth flagging**:
`StreamService.generate()` returns early inside its loop on the Companion success path, which
terminates the orchestrator generator before it logs its `ProviderLog` row — successful Companion
generations produce no observability row (Tarot/Numerology/Natal-Chart are unaffected). Documented,
not yet fixed. P2, see §31.

## 13. Premium/monetization strategy

`EntitlementService.hasPremiumAccess()` is the single reused pattern across all 3 live Discovery
systems — core deterministic content is never gated, only interpretation depth/history
length/creation ceilings differ by tier. If Eastern Horoscope is ever built, the same split
applies cleanly (core chart free, deeper AI reading + history depth premium) — this is existing
product policy, not something to invent.

## 14. Payment production status

`docs/progress/payos-production-readiness.md`, verbatim:

> **PAYOS INTEGRATION: CONTRACT VERIFIED**
> **PAYMENT PRODUCTION: BLOCKED**

Remaining blockers, as the doc states them:
1. No real PayOS sandbox/production transaction has ever been executed — no merchant credentials exist in any environment checked.
2. Production price has no product/business sign-off (`79,000 VND` is an engineering placeholder).
3. Production webhook URL has never been registered with PayOS.
4. Cancelled/expired-order behavior against the real provider is unconfirmed.
5. Production domain/HTTPS is not yet provisioned (checkout/webhook URLs depend on it).
6. Stale-order sweep and webhook rate-limiting were explicitly decided **not required** for launch.

A `PAYMENTS_ENABLED` kill switch exists and defaults to on. **Every remaining blocker except (3)
and (4) is an operational/business action (merchant sign-up, price sign-off, domain purchase), not
an engineering task an implementation sprint can complete.** Payment activation can and should
continue independently of any Discovery-engine decision — but it is currently blocking real
revenue collection regardless of how many Discovery systems exist.

## 15. Current UX quality after Sprint 8.5/9

Substantially healthy. Confirmed fixed since the stale 2026-08-11 audit: Dashboard's Discovery/
Memory cards are real links (not dead `<p>` tags), AI-generated content is clearly labeled
(`ai-interpretation.tsx`, "Written by AI... it never chooses or changes it"), the landing page's
stale Companion-preview disclaimer is gone, frozen modules are visually deprioritized into one
Settings card. Remaining minor items: a stale doc-comment in `nav-items.ts` referencing "Natal
Chart" as still-Coming-Soon (harmless, not user-facing), tablet breakpoint (768–1279px) shares the
phone bottom-tab nav rather than getting its own layout (known, low-severity, open since Sprint
4B). Design consistency across all 3 live Discovery systems is genuinely good — confirmed as the
one surface the prior stale audit already called healthy and still true.

## 16. Sprint 9 Low finding dispositions

Both from the Sprint 9 independent release-closure audit (`docs/progress/sprint-9-final-report.md`):

1. **Chart-wheel 0°/360° collision-easing gap** — cosmetic glyph-overlap only when two planets
   straddle exactly the 0°/360° boundary within 7°, no data-correctness impact.
   **Disposition: BACKLOG.** Narrow occurrence rate, purely cosmetic, isolated to Natal Chart's own
   UI, unrelated to any Sprint 10 candidate. No reason to gate anything on it.
2. **Tablet-width scroll-to-card-text nav-overlap** — only triggers via programmatic/
   assistive-technology scroll to non-interactive text, not normal touch/mouse scrolling; the
   already-shipped, higher-value fix (submit-button clearing the nav) is confirmed still working.
   **Disposition: BACKLOG.** Same reasoning as above.

Neither rises to "fix before Sprint 10" or "Sprint 10 Phase 0" — they're isolated, low-traffic,
and unconnected to whatever Sprint 10 turns out to be.

## 17. Community/Notifications/Admin

- **Community**: full Bible module (18), V1.5/P3 tier, explicitly reconciled against "not a social
  network." Module 3's own IA reviewer recommends it **not** get a permanent nav slot pre-launch.
  Not required before launch; does not block Premium.
- **Notifications**: full Bible module (19), **V1 tier** — same priority tier as Natal
  Chart/Numerology/Premium, i.e., higher Bible priority than Eastern Horoscope (V1.5). Hard
  dependency on Memory (already built). Worth flagging as a real alternative candidate ahead of
  Eastern Horoscope on the Bible's own tiering — see §22.
- **Admin**: no dedicated Bible module exists at all — referenced only as scattered
  permission-model/audit-log requirements in Modules 2/3/21. Required for operational safety
  (content curation for any Discovery system's reference database routes through "the Admin
  content-curation process" per Module 23) but has no UX spec to build against. This is itself a
  planning gap worth naming for whoever scopes it later.

## 18. SEO/content gap

Real `sitemap.ts`/`robots.ts` exist and correctly index only the public marketing shell
(`/`, `/about`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`). **Every Discovery system
and every other product surface sits behind auth and is explicitly disallowed in `robots.ts`** —
this is a deliberate "nothing behind the login wall" policy, not an oversight, but the practical
effect is that the entire product beyond the marketing shell is structurally non-indexable. No
blog/content section exists. Building a 4th Discovery engine does not by itself create any new
acquisition surface, since nothing about any Discovery system (existing or hypothetical) is
publicly crawlable. Whether SEO investment is more valuable than a 4th engine right now depends on
whether the goal is deepening the product (engine count) or growing top-of-funnel (acquisition) —
see §22 for how this is weighed.

## 19. Beta/launch readiness

- **Closed beta**: plausible today from a pure feature-completeness standpoint (3 real Discovery
  systems, real Companion, real Memory) — but Premium cannot process a real payment yet (§14), and
  users cannot export or delete their own account data (§3), which is a real trust/compliance gap
  for any real cohort of users, even a closed one.
- **Public beta / public launch**: blocked on the same two items, more seriously — real revenue
  collection and real data-subject rights are foundational, not optional, for a public launch of a
  product that stores personal data (birth data, journal entries, memory) at meaningful scale.

## 20. Revenue-first priority ranking

Qualitative, evidence-based (not fake numeric precision):

| Candidate | User value | Revenue impact | Acquisition impact | Retention impact | Effort | Risk | Bible importance |
|---|---|---|---|---|---|---|---|
| A. Eastern Horoscope | Medium-high (proven pattern) | Medium (more premium content) | Low (still non-indexable) | Medium | Medium | Low (proven pattern, real library candidate) | V1.5/P3 |
| B. `/menh-vi` consolidation | None currently (nothing live to consolidate) | None | None | None | N/A — no real work exists to do | N/A | Not a Bible module |
| C. Discovery UX remediation | Low (mostly already fixed) | Low | None | Low | Low | Low | Cross-cutting, not its own module |
| D. PayOS production activation | High (unlocks revenue at all) | **Highest** | None directly | Medium (real purchase confidence) | Low engineering / requires founder action | Medium (external dependency, mostly non-code) | Module 17 |
| E. SEO/content | Medium | Low near-term (nothing to convert without payment) | **Highest**, if pursued later | Low | Medium-high | Low | Not a dedicated module |
| F. Admin/operations | Low direct user value | Indirect (enables trust/ops) | None | Low | Medium | Medium (no Bible spec to build against) | Undefined in Bible |
| G. Notifications | Medium | Low direct | Low | **High** | Medium | Low (Memory dependency already met) | **V1** |
| H. Community | Low-medium | Low | Low | Medium | Medium-high | Medium (new social-safety surface) | V1.5/P3 |
| I. Launch hardening (payment + data rights + small fixes) | High (foundation for everything else) | High (unblocks D) | None directly | Medium | Low-medium, mostly small/bounded | Low | Modules 17/20/21 |

## 21. Reuse plan (if Eastern Horoscope is picked next, after launch hardening)

From Natal Chart: the deterministic-core→persist→AI-narrate architecture, the geocoding module
only if a future richer Eastern system needs birth *location* (the Bible's actual V1.5 scope
doesn't — flag this explicitly before reusing geocoding unnecessarily), the birth-date
normalization utility pattern (not the calendar math itself — that's genuinely new). From
Numerology: the deterministic-explanation-steps + result-visualization + history pattern (closest
analog to a "no location, just date" Discovery system). From Tarot: the interpretation-state/
lifecycle pattern. From Companion: `ProviderOrchestratorService`, `ContextBuilderService` bridge
pattern. From Premium: `EntitlementService`, unchanged. No parallel copies of any of these should
be created.

## 22. Proposed data model (conceptual only — no Prisma changes made)

If/when Eastern Horoscope is built, following this repo's own established shape (not forcing exact
names): a primary record analogous to `NatalChart` (birth date, resolved lunisolar year/animal
sign/element, `calculationVersion`/`engineVersion`, status/visibility, interpretation +
`aiProvider`/`aiModel`/`interpretedAt`), a lifecycle-history child table mirroring
`NatalChartHistory`. Given the V1.5 scope has no palace/star placement, it likely does **not**
need Natal Chart's multi-child-table normalization (`NatalPlacement`/`NatalHouse`/`NatalAspect`) —
over-normalizing a single animal-sign+element result into several child tables would be
unwarranted complexity for this specific scope. Keep it closer to Numerology's flatter shape.

## 23. Golden-vector strategy (for whenever this is built)

Must not use the same library as both implementation and expected result (same discipline Sprint 9
used for astronomical facts). Golden cases should cover: several widely-known, independently
citable birth-year→animal-sign/element mappings (Chinese zodiac year boundaries are publicly
documented and independent of any specific library), a Lunar New Year boundary date (where the
Gregorian and lunar year disagree — the single highest-risk correctness case), and — only if the
Bible's actual V1.5 birth-hour requirement is confirmed non-existent (current evidence says it is)
— explicitly confirm birth-hour is NOT required, rather than silently assuming it. Leap lunar
month handling only matters if any future extension needs month-level (not year-level) precision;
out of scope for V1.5 as specified.

## 24. Proposed future UX (for whenever this is built)

birth data → calculate → visual chart (animal sign + element, in this product's real, integrated
design system — not `/menh-vi`'s tokens) → core summary (mirroring Natal Chart's Big Three
pattern) → theme sections (Year Energy, Career, Relationships, Health per the Bible's own list) →
AI interpretation, clearly labeled → history → Companion bridge. `/menh-vi` does not provide usable
components for this journey (§6) — its visual ideas could inform a future design pass on the *real*
shell, but that's a separate design-language decision, not a dependency.

## 25. Testing strategy (for whenever this is built)

Same gate sequence Sprint 9 used and this repo now has full precedent for: deterministic unit
tests + golden vectors, backend e2e, frontend tests, production build, a new Playwright flow, full
Playwright regression, one real (paid) Gemini smoke test, desktop/tablet/mobile manual
verification, security/privacy pass, migration verification, secret scan. Not executed now.

## 26. Roadmap options

**Option A — Product Bible Completion (Eastern Horoscope Foundation)**
Pros: proven 3x pattern, technically lower-risk than Natal Chart, real library candidate exists,
completes Discover's 4th card. Cons: Bible itself tiers it V1.5/P3 (explicitly not next-after-V1),
doesn't unblock revenue, doesn't address the account-deletion/export gap, adds premium-gated
content while Premium can't process a real payment yet. Dependencies: none blocking. Why now:
matches the sprint-over-sprint feature cadence. Why not now: the Bible's own prioritization and the
product's actual operational gaps argue against it being next.

**Option B — Revenue First (PayOS production + SEO + beta)**
Pros: unlocks the thing the whole product needs to be a real business; SEO grows acquisition.
Cons: most of payment's blockers are founder/business actions an implementation sprint can't
complete by itself; SEO has low near-term value with no payment to convert into. Dependencies:
founder decisions (merchant account, price sign-off, domain). Why now: revenue capability is
foundational. Why not now as a *full* sprint: too much of it isn't engineerable work — better
scoped as a lean checklist than a full sprint (see §30).

**Option C — Product Consolidation (`/menh-vi` + shell)**
Pros: none currently — there is nothing live to consolidate (§7). Cons: would manufacture
unnecessary work around a dormant, disclosed, harmless prototype. Dependencies: none. Why now:
no reason. Why not now: the premise doesn't hold given the actual evidence.

**Option D — Launch Hardening**
Pros: closes the two most consequential, evidence-backed gaps (payment production, account
deletion/export) plus several small, cheap, already-identified fixes (ProviderLog bug, stale doc
comment, Sprint 9 Low backlog items), directly serves Modules 17/20/21 which the Bible treats as
foundational trust/monetization requirements, bounded and small — not "endless architecture."
Cons: doesn't add a new user-facing Discovery system, so it won't feel like visible "product
growth" in the way Eastern Horoscope would. Dependencies: payment activation needs founder actions
in parallel. Why now: the product cannot legally/operationally sustain new users or real revenue
without this. Why not now: none identified — this is the strongest-evidenced option.

## 27. Recommended Sprint 10

# SPRINT 10 — LAUNCH HARDENING

Justification, from evidence, not preference: Payment production is **BLOCKED** (§14) — the
product cannot currently collect a single real payment, no matter how many Discovery engines
exist. Account data export/deletion has **zero backend implementation** and is self-acknowledged
as "coming soon" on the Settings page itself (§3) — a real gap against the Bible's own Modules
20/21 (Settings/Privacy and Trust) and ordinary data-protection expectations for a production app
handling birth data, journal entries, and persistent memory. The Bible's own tiering places Eastern
Horoscope at V1.5/P3 ("expansion, not core-loop validation") — explicitly not the automatic next
step after V1 (which Sprints 8–9 already delivered). Building a 4th Discovery engine now would add
user-facing depth to a product that still can't take real money or honor a user's right to delete
their data — the wrong order of operations. This is not chosen "merely because Sprint 9 is
complete" — it's chosen because it's the most consequential, most evidence-backed gap actually
found in this audit.

## 28. Exact Sprint 10 scope (Launch Hardening)

**IN SCOPE**
- Payment production activation checklist: whatever engineering remains once founder-provided
  credentials/domain/price exist (production webhook registration call, end-to-end real-transaction
  verification, re-confirming cancelled/expired-order behavior against the real provider). The
  code-side kill switch already exists and needs no rework.
- Account data-rights backend: a real `DELETE /users/me` (or equivalent) account-deletion endpoint
  and a real data-export endpoint (Journal/Memory/Discovery-history at minimum), wired to the
  existing Settings page's already-drafted (but currently inert) UI section.
- Fix the known `StreamService.generate()` early-return bug so successful Companion generations
  produce a `ProviderLog` row (small, isolated, already root-caused).
- Sweep the two Sprint 9 Low findings (chart-wheel 0°/360° collision easing, tablet scroll-to-card
  nav overlap) since they're cheap and already fully diagnosed.
- Fix the stale `nav-items.ts` doc-comment.

**OUT OF SCOPE**
- Eastern Horoscope / any new Discovery engine.
- Any `/menh-vi` work (nothing to consolidate).
- Community, Notifications, Admin (all genuinely deferred by the Bible's own tiering or lack of
  spec).
- SEO/content investment (low near-term value without working payment to convert into).
- Full WCAG accessibility audit or full design-system rework.

**DEFERRED**
- Eastern Horoscope Foundation — next Discovery-engine candidate after this sprint, with the
  technical/library/UX groundwork in §9–11, §21–25 above ready to use when picked up. Notifications
  (Bible V1 tier) is a legitimate alternative to weigh against it at that time, given it outranks
  Eastern Horoscope (V1.5) in the Bible's own priority tiers.

**DEPENDENCIES**
- PayOS merchant credentials, final price sign-off, and a production domain/HTTPS — all
  founder/business actions, not engineering (§29, §33).

**RISKS**
- Payment activation depends on an external provider's real-world behavior, which cannot be fully
  verified until founder-provided credentials exist — some residual uncertainty is irreducible
  until that real test happens.
- Account-deletion must correctly cascade through Memory/Journal/Discovery records without
  violating any other module's data-retention assumptions — needs careful schema review before
  implementation (not scoped here, this is a pre-implementation audit only).

## 29. Dependencies

Founder/business actions (§30, §33) block full payment-production completion; everything else in
scope is independently engineerable now.

## 30. Founder/business decisions required

1. Obtain real PayOS merchant credentials (sandbox and/or production).
2. Sign off on the final Premium price (currently a `79,000 VND` engineering placeholder).
3. Provision a production domain + HTTPS for checkout/webhook URLs.
4. Decide the account-deletion policy specifics (immediate hard-delete vs. grace-period soft-delete,
   and exactly what gets exported) before backend work starts, since this is a product/legal
   decision, not an engineering one.

## 31. Top P0 / P1 / P2

- **P0**: Payment production blocked (§14); account deletion/export has zero backend (§3).
- **P1**: None found rising to this severity beyond the P0 items above.
- **P2**: `StreamService` ProviderLog gap for successful Companion streams (§12); stale
  `nav-items.ts` doc-comment (§15); tablet breakpoint sharing phone bottom-nav (§15); Sprint 9 Low
  findings ×2 (§16).

## 32. Definition of Done (for the recommended Sprint 10)

- Real end-to-end PayOS transaction verified against the actual provider (not simulated), OR an
  honest, documented statement of exactly which founder-action items remain outstanding if full
  activation isn't reachable within the sprint.
- Real account-deletion and data-export endpoints exist, are tested (unit + e2e), and are wired to
  the Settings UI (replacing "coming soon").
- `StreamService` ProviderLog gap fixed and verified.
- Both Sprint 9 Low findings resolved or explicitly re-confirmed as intentionally backlogged with
  reasoning.
- Full regression (lint/typecheck/unit/e2e/build/Playwright/secret-scan) green, matching the rigor
  established in Sprints 8–9's own closure reports.

---

## Final summary table

| # | Item | Answer |
|---|---|---|
| 1 | Current HEAD | `eee8aff` |
| 2 | Local/remote sync | in sync, 0/0 |
| 3 | Working tree before audit | clean |
| 4 | Product Bible modules found | 25 (+1 addendum), no dedicated Admin module |
| 5 | Completed modules | Auth, Onboarding, Dashboard, Discover (hub), Companion, Memory, Journal, Tarot, Numerology, Natal Chart, Premium mechanics |
| 6 | Partial modules | Payment (production), SEO, Privacy, Settings |
| 7 | Not-started modules | Eastern Horoscope (real product), Community, Notifications, Admin |
| 8 | Live Discovery systems | Tarot, Numerology, Natal Chart |
| 9 | `/menh-vi/*` route count | 12 routes + 1 layout |
| 10 | `/menh-vi/*` purpose | Isolated, disclosed, one-screenshot visual design exploration |
| 11 | `/menh-vi/*` uses real APIs? | **NO** |
| 12 | `/menh-vi/*` contains real Eastern Horoscope? | **NO** (decorative "coming soon" label only) |
| 13 | Parallel-shell risk | None requiring resolution — `/menh-vi` is dormant and non-competing |
| 14 | Biggest current product gap | Payment production blocked + zero account data-rights backend |
| 15 | Eastern Horoscope Bible status | V1.5, P3 — explicitly not next-after-V1 |
| 16 | Eastern Horoscope MVP | Chinese zodiac/Five-Elements annual system, NOT Tử Vi Đẩu Số |
| 17 | Deterministic calculation requirements | Lunisolar year conversion + curated reference table — simpler than Natal Chart |
| 18 | Technical/library strategy | `lunar-typescript` (MIT, maintained) is a real, evaluable candidate; nothing installed |
| 19 | Gemini boundary | Same proven deterministic-core/AI-narrates pattern as all 3 existing systems |
| 20 | Companion reuse | `ProviderOrchestratorService`+`SafetyService`+bridge pattern, no 4th AI integration needed |
| 21 | Premium strategy | Same `EntitlementService` pattern, core content free / depth gated |
| 22 | Payment production status | CONTRACT VERIFIED / **PRODUCTION BLOCKED** |
| 23 | SEO/acquisition status | Real sitemap/robots, but entire product is intentionally non-indexable behind auth |
| 24 | Community status | NOT STARTED, V1.5/P3, not required pre-launch |
| 25 | Notifications status | NOT STARTED, **V1 tier** — outranks Eastern Horoscope in Bible priority |
| 26 | Admin status | NOT STARTED, no Bible module spec exists |
| 27 | Closed-beta readiness | Feature-plausible, blocked by payment + data-rights gaps |
| 28 | Public-launch readiness | Blocked by the same two gaps, more seriously |
| 29 | Sprint 9 Low finding #1 disposition | BACKLOG |
| 30 | Sprint 9 Low finding #2 disposition | BACKLOG |
| 31 | Top P0 | Payment production blocked; zero account deletion/export backend |
| 32 | Top P1 | None beyond the P0 items |
| 33 | Top P2 | ProviderLog gap, stale doc-comment, tablet-nav sharing, Sprint 9 Lows |
| 34 | Roadmap option A | Eastern Horoscope Foundation |
| 35 | Roadmap option B | Revenue First (Payment + SEO + beta) |
| 36 | Roadmap option C | Product Consolidation (rejected — nothing to consolidate) |
| 37 | Recommended Sprint 10 | **LAUNCH HARDENING** |
| 38 | Exact IN SCOPE | §28 |
| 39 | Exact OUT OF SCOPE | §28 |
| 40 | Dependencies | Founder-provided PayOS credentials/price/domain |
| 41 | Main risks | External-provider verification uncertainty; account-deletion cascade correctness |
| 42 | Definition of Done | §32 |
| 43 | Founder/product decisions required | §30 |
| 44 | Files changed by this audit | `docs/audit/sprint-10-pre-implementation-audit.md` only |
| 45 | Working tree after audit | One new untracked file, otherwise clean |
| 46 | Commit status | Not staged, not committed |
| 47 | **FINAL RECOMMENDATION** | **SPRINT 10 — LAUNCH HARDENING** |
