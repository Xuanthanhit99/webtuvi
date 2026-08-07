# Web Tử Vi — Current State Audit

**Audit date:** 2026-08-07
**Branch:** `master` @ `87ccd06` + uncommitted Sprint 5C ("Goal System") working-tree changes
**Scope:** Full repository — code, migrations, tests, and reference documentation. No code was written, refactored, staged, or committed as part of this audit.

---

## 1. Executive Summary

**The repository is real.** `git remote -v` shows `origin → https://github.com/Xuanthanhit99/webtuvi.git` — this is unambiguously the "web tử vi" project. There is no separate, hidden astrology codebase to find; this is it.

**The central finding of this audit**: the actual Product Bible for this project — 25 modules at `docs/reference/web-tu-vi/web-tu-vi/`, which this audit read in full — defines "web tử vi" as an astrology/tarot/numerology product **branded "BeaconVie"**, whose core thesis (Module 1) is *"discovery systems [Tarot, Natal Chart, Eastern Horoscope, Numerology] are the doorway, the Companion relationship is the house."* Every commit in this repository's history (12 commits, `ff77169` "Sprint 1" through `87ccd06` "Sprint 5B") has built **only the house** — the AI Companion, Memory, Journal, and three large, sophisticated systems (Reflection, Insight, Review) plus an uncommitted fourth (Goal) that **do not appear anywhere in the 25-module Product Bible at all**. **The doorway — Tarot, Natal Chart, Eastern Horoscope, Numerology — has zero implementation.** So does Premium/Payment, Community, Notifications, and Admin, all of which the Product Bible specifies as required V1/V1.5 modules.

In short: a large, well-engineered, well-tested backend and frontend exists — for a generic AI journaling/reflection companion. The specific product this repository is named after, and the specific feature set the Product Bible requires to fund it (Tarot as the P1 CAC-funnel, Premium as the revenue mechanism), does not exist in any form beyond four "Coming soon" badges on a single stub page (`/discover`) and marketing copy that describes a product the code does not deliver.

**This product cannot launch and cannot generate revenue in its current state** — not because of bugs, but because the two things the business model depends on (a working Discovery-system content loop, and a working Premium paywall) were never started. See Section 20/21 for the full reasoning and Section 19 for the prioritized backlog.

---

## 2. Repository / Git State

```
Branch: master
HEAD:   87ccd06 "feat: complete Sprint 5B review engine"
Remote: https://github.com/Xuanthanhit99/webtuvi.git
```

**Working tree** (uncommitted, from an in-progress Sprint 5C "Goal System" build session):
```
 M README.md
 M apps/api/prisma/schema.prisma
 M apps/api/src/app.module.ts
 M apps/api/src/companion/context/{context-builder.service.ts,context-builder.service.spec.ts,context.types.ts}
 M apps/api/src/companion/prompt/{system-prompt.ts,prompt-builder.service.spec.ts}
 M apps/api/src/companion/stream/stream.service.spec.ts
 M apps/web/app/(app)/settings/page.tsx
 M packages/types/index.ts
?? apps/api/prisma/migrations/20260807030820_goal_system/
?? apps/api/src/goal/
?? apps/api/test/goal.e2e-spec.ts
?? apps/web/app/(app)/goals/
?? apps/web/e2e/flow-19-goal-system.spec.ts
?? apps/web/features/goal/
?? docs/architecture/goal-system.md
?? docs/progress/sprint-5c-progress.md
```
`git diff --check`: clean (only expected LF→CRLF warnings, exit 0). No merge conflicts, no partial/broken edits. This uncommitted work is a coherent, complete, already-tested Goal System feature (verified in the same working session this audit follows) — not abandoned/broken code.

**Commit history** (all 12 commits, oldest to newest):
```
ff77169 feat: complete BeaconVie Sprint 1 foundation
624c2de feat: complete Sprint 2A production hardening
3284287 [update][commit]
5027d16 feat: complete Companion remediation and Memory Foundation
eec2755 [update][commit] update code md
5e90ce8 [update][commit] sprint 3
94d2bc5 feat: complete Sprint 3C companion memory integration
a004c73 [update][commit] update ai sprint 4
81fc874 feat: complete Sprint 4B reflection foundation
547536b [update][commit] update code sprint 4
14c00f0 fix: correct API production start path
5d8a9a2 feat: complete Sprint 5A insight experience
87ccd06 feat: complete Sprint 5B review engine
```
Every single commit is a "Sprint N" milestone for the Companion/Memory/Journal/Reflection/Insight/Review line. **Zero commits touch Tarot, Natal Chart, Eastern Horoscope, Numerology, Premium, Payment, Community, Notifications, or Admin.**

**Contradiction #1 — project identity documentation is stale.** `CLAUDE.md` (the project's own AI-assistant instructions, checked into the repo) describes the project only as *"a monorepo for a Sprint 1 AI companion product"* with modules "auth, onboarding, companion, dashboard, memory" — it does not mention the Product Bible, does not mention Tử Vi/Tarot/Astrology at all, and does not reflect Sprints 2–5C. Per the resolution order specified for this audit (code > migrations > tests > final docs > Product Bible > Design Guide > old prompts), `CLAUDE.md` is the lowest-priority, most-stale source found and should not be trusted as a scope definition — it appears to have been written once for Sprint 1 and never updated.

---

## 3. Current Architecture

**Stack** (confirmed from `apps/api/package.json`, `apps/web/package.json`, `docker-compose.yml`):
- Frontend: Next.js 15 App Router, TypeScript, Tailwind, React Hook Form + Zod, TanStack Query, Zustand.
- Backend: NestJS 10, Prisma + PostgreSQL, Redis (via `ioredis`, used only for rate-limit-throttle storage — **no BullMQ, no queue infrastructure of any kind**), Argon2, class-validator, Swagger.
- AI: `companion/providers/` — real `OpenAIProvider`, `AnthropicProvider`, `GeminiProvider`, plus a `MockProvider` gated to non-production. Provider selection is config-driven (`DEFAULT_AI_PROVIDER`).
- Infra: PostgreSQL + Redis + Mailpit via Docker Compose.

**Contradiction #2 — this deviates from the Product Bible's own Engineering/AI Architecture modules.** Module 24 (Engineering Architecture) specifies **BullMQ as required shared queue infrastructure** for memory evaluation, embedding generation, report generation, and notification evaluation — none exists (`bullmq` is not a dependency anywhere). Module 23 (AI Architecture) specifies **a single LLM provider (OpenAI)** behind one abstraction, and **OpenAI embeddings + a Postgres vector extension (pgvector)** for Memory retrieval, calling this "load-bearing for the North Star metric" (Module 1). What was actually built is a **three-provider abstraction (OpenAI/Anthropic/Gemini)** and a Memory Engine whose own architecture docs (`docs/architecture/memory-engine.md`, `memory-intelligence.md`) *explicitly and repeatedly* state "no embeddings, no vector database, no semantic search, no RAG" as a deliberate design boundary carried through Sprints 3A/3B/3C. This is a real, load-bearing architectural divergence from the Product Bible, not a bug — but it is undocumented as a divergence anywhere; the Sprint 3A/3B docs justify the "no embeddings" choice on its own terms without acknowledging Module 23 requires the opposite.

**Module boundaries actually present** (`apps/api/src/`): `auth`, `onboarding`, `companion`, `memory`, `journal`, `reflection`, `insight`, `review`, `goal` (uncommitted), `dashboard`, `users`, `activities`, `mail`, `health`, `common`, `config`, `prisma`, `redis`. This maps to Product Bible Modules 6 (Auth), 7 (Onboarding), 8 (Dashboard), 9 (Companion), 10 (Memory), 11 (Journal) — and then diverges: Reflection/Insight/Review/Goal have no corresponding Product Bible module numbers at all. Modules 12–21 (Tarot, Natal Chart, Eastern Horoscope, Numerology, Reports, Premium, Community, Notifications, Settings\*, Privacy\*) have no corresponding backend module folder (\*Settings and Privacy have partial frontend/backend coverage folded into `users`/`auth`, not a dedicated module).

---

## 4. Actual Completed Features

Backed by real, tested code (migrations exist, controllers exist, frontend routes call them, tests pass — see Section 17 for the exact numbers):

- **Auth**: register/login/refresh/logout, cookie-based JWT sessions, CSRF, password reset, email verification, session management, change password.
- **Onboarding**: scripted (rule-based, not AI), conversational, captures memory consent and a "Discovery" preference that is stored but never acted on.
- **Dashboard**: aggregated home view (greeting, companion preview, memory highlight, recent activity, static "Discovery" coming-soon card).
- **AI Companion**: real, multi-provider (OpenAI/Anthropic/Gemini/Mock) streaming chat, cost control, safety detectors (crisis, PII, prompt-injection), memory retrieval into context, journal-suggestion and forget-intent detection.
- **Memory Engine + Intelligence**: consent-gated structured memories, candidate lifecycle, versioning, audit trail, importance scoring, duplicate/conflict detection, merge suggestions, deterministic retrieval/ranking (no embeddings — see Contradiction #2).
- **Journal**: full CRUD, drafts/autosave, revisions, timeline, Markdown/JSON export.
- **Reflection Foundation** *(not in Product Bible)*: deterministic rule engine over Journal/Memory/Activity/Companion data.
- **Insight Preparation + Experience** *(not in Product Bible)*: deterministic clustering/relationships/priority over Reflection Candidates, presentation dashboard.
- **Review Engine** *(not in Product Bible)*: deterministic weekly/monthly aggregation of Insight/Reflection/Journal/Memory/Activity into review documents.
- **Goal System** *(not in Product Bible, uncommitted)*: first-class goals, milestones, deterministic progress engine, evidence citing Journal/Memory/Reflection/Insight/Review.

---

## 5. Partial Features

- **Settings** (`/settings`): account info, password change, sessions, memory consent/export, links to Memory/Reflections/Insights/Reviews/Goals — but the page's own footer states *"Notifications, theme, and account deletion are coming soon"* (`apps/web/app/(app)/settings/page.tsx`). Product Bible Module 20 requires a much larger surface (Companion prefs, Journal, Reports, Community, Discovery birth-data management, Language, Accessibility, Devices, Data export/delete-all, Support) — largely absent.
- **Privacy** (`/privacy`): page text explicitly says *"plain-language summary for Sprint 1... will be published before general availability"* — an acknowledged interim, not the Trust Center Module 21 requires.
- **Onboarding "Discovery" step**: captures a choice (`OnboardingDiscoveryChoice`: `ACCEPTED`/`SKIPPED`) and responds with a static message — *"Discovery is still warming up on our end..."* (`apps/api/src/onboarding/conversation-script.ts:43`) — no feature behind it.

---

## 6. Placeholder / Dead Features

- **`/discover`** (`apps/web/app/(app)/discover/page.tsx`): a fully static page listing Tarot / Natal Chart / Eastern Horoscope / Numerology, each with a hard-coded "Coming soon" badge. Zero API calls, zero interactivity. This is the **entire** user-facing surface for the product's own namesake feature set.
- **`/terms`**: explicitly labeled placeholder in-page.
- **`/insights/internal`**: a real, working route but deliberately unlinked from any nav/settings — reachable only by typing the URL. Not "dead" so much as intentionally hidden pre-release tooling.
- **Dead code**: none found at the route level; no orphaned pages. At the API level, no endpoints were found with zero frontend callers (every controller group audited in Section 8 has a corresponding frontend `features/*/api/*.ts` client and route using it).

---

## 7. Frontend Audit

Full route table (purpose / APIs called / auth / states / mock data / readiness) is reproduced in the audit working notes; summarized findings:

| Route | Status | Notes |
|---|---|---|
| `/`, `/about`, `/contact` | COMPLETE (marketing) | Static, well-structured, all copy sourced from `content/landing-copy.ts` |
| `/privacy`, `/terms` | PLACEHOLDER | Self-declared interim in-page |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email*` | COMPLETE | Full form validation, error states; OAuth buttons present but disabled ("Coming soon") |
| `/onboarding` | COMPLETE | Real conversational flow, Skeleton/ErrorState handled |
| `/dashboard` | COMPLETE | Skeleton + ErrorState + retry |
| `/companion` | COMPLETE | Most feature-rich route; streaming, memory/journal/reflection integration |
| `/journal`, `/journal/new`, `/journal/[id]`, `/journal/archive` | COMPLETE | Full CRUD, export |
| `/memory` | COMPLETE | Most extensive single feature surface in the app |
| `/reflections`, `/reviews`, `/reviews/[param]`, `/insights`, `/goals` | COMPLETE | All have Skeleton/ErrorState/EmptyState |
| `/insights/internal` | COMPLETE but hidden | Not linked anywhere |
| `/settings` | PARTIAL | See Section 5 |
| `/discover` | PLACEHOLDER | See Section 6 |

**Navigation contradiction**: `apps/web/components/layout/nav-items.ts` implements exactly Module 3's 5-item Global Nav (Dashboard, Companion, Journal, Discover, Settings) — correctly minimal per the Bible. But `/goals`, `/insights`, `/memory`, `/reflections`, `/reviews` (five real, fully-built features) are **not reachable from Global Nav at all**, only via links buried in `/settings`. A first-time user following only the nav bar would never discover Memory, Reflections, Insights, Reviews, or Goals exist. This is a genuine UX/IA regression against Module 3's own "max two-tap depth from Global Nav to any feature" rule — none of these five features can be reached from Global Nav in two taps; they can't be reached from it at all.

**Auth-guard gap**: `apps/web/middleware.ts`'s route matcher covers `/dashboard`, `/companion`, `/journal`, `/discover`, `/settings` but **not** `/goals`, `/insights*`, `/memory`, `/reflections`, `/reviews*`. These five routes still work correctly today because their data-fetching hooks 401 client-side with no session — but they lack the server-side redirect-before-render guard the other authenticated routes get. Low severity today (no data leaks — API calls still fail closed), but worth closing since it's an inconsistency, not a decision.

**Design system compliance**: spot-checked against Module 22 (Design Language) — Dusk/Light theme tokens, calm/unhurried motion language, and the "never mystical-performer iconography" rule appear to be followed in the built UI (no countdown badges, no streak-shaming copy, no fake urgency observed anywhere in the audited pages), consistent with what the Companion-focused build has actually shipped.

---

## 8. Backend Audit

Full module/controller/route inventory (Section 2 of the dispatched research, reproduced in working notes) confirms:

- **18 module folders**, all mapping to Auth/Onboarding/Dashboard/Companion/Memory/Journal/Reflection/Insight/Review/Goal/cross-cutting concerns.
- **Zero** controllers for: admin, notifications, community, payment/subscription/billing, webhooks, tarot, natal chart, eastern horoscope, numerology, reports.
- Every existing controller sits behind `JwtAuthGuard` + the project-wide `CsrfGuard`; every service method audited across this and prior sessions is `userId`-scoped with identical-404 ownership checks (this has been independently verified via dedicated security reviews in every prior sprint's closure — see `docs/security/*.md` and the per-sprint final reports).
- Rate limiting: global default throttle + a dedicated `auth` bucket + a dedicated `companion`/`companion-ip` bucket (Redis-backed via `RedisThrottlerStorageService`). No rate limiting exists for anything else because nothing else (payment, community) exists yet to rate-limit.
- Swagger: present (`@nestjs/swagger` decorators used throughout controllers).
- Tests: every existing module has unit + e2e coverage (see Section 17 for exact counts from this session's own run).

**No dead/unreachable API found** — every controller group has a corresponding frontend caller.

---

## 9. Database Audit

`apps/api/prisma/schema.prisma`, read in full: **11 applied migrations** (dev DB) + 1 uncommitted (`goal_system`), organized in clearly-commented sections per sprint. Full model/enum inventory confirmed by direct read (Section 3 of dispatched research): every model belongs to Auth/Onboarding/Companion/Memory/Journal/Reflection/Insight/Review/Goal. **No `payment`, `subscription`, `admin`, `notification`, `community`, `tarot_reading`, `natal_chart`, `eastern_horoscope_profile`, or `numerology_profile` model exists anywhere** — i.e., every schema entity Module 12–19 explicitly specifies by name (e.g., `tarot_reading(id, user_id, reading_type, cards[], question, created_at)` from Module 12, `natal_chart(...)` from Module 13) is absent.

`prisma validate` and `prisma migrate status` both pass clean against the dev database (verified this session, see Section 17).

---

## 10. Astrology Engine Audit

**Not started.** No natal chart calculation code, no ephemeris library dependency, no house-system logic, no timezone/lat-long birth-data handling anywhere in `apps/api` or `apps/web`. The only trace is the static UI card on `/discover` and one line of onboarding copy. Module 13 requires a documented, versioned, deterministic ephemeris-based calculation engine with its own correctness test suite — none of this exists to audit.

---

## 11. Tarot Audit

**Not started.** No 78-card deck data, no draw/shuffle logic, no spread engine, no `tarot_reading` persistence, no `/tarot/draw` endpoint. Module 12 specifies this as **P1/MVP priority** (per Module 1's own engineering priority table: *"Tarot + Journal — cheapest content loop to ship, funds early retention data collection"*) — meaning this is not a deferred nice-to-have per the product's own stated sequencing, it is the very first revenue-funnel feature that was supposed to ship before or alongside Journal. Journal shipped (Sprint 4A); Tarot never did.

(Numerology and Eastern Horoscope audits are equally "not started" — no calculation logic, no models, no endpoints exist for either. Full technical requirements for all three are documented in Section 12/14/15 findings; none apply to code that exists.)

---

## 12. AI Audit

| Feature | Classification | Evidence |
|---|---|---|
| Companion chat (generation) | **REAL** | Three live providers (OpenAI/Anthropic/Gemini) with real HTTP calls to each provider's real API, cost tracking (`AIUsage`/`ProviderLog` models), retry/fallback orchestration |
| Mock provider | **REAL, scoped correctly** | Active only outside production or via explicit env flag |
| Memory retrieval | **REAL, but deterministic, not embeddings** | Ranking-based, not vector similarity — see Contradiction #2 |
| Discovery-system interpretation (Tarot/Chart/Numerology AI narration) | **NOT WIRED** | No such feature exists to wire |
| Reports synthesis | **NOT WIRED** | No such feature exists |
| Safety (crisis/PII/prompt-injection detection) | **REAL** | `companion/safety/*.ts`, unit-tested |

**Deterministic-calc-then-AI-narration separation** (Module 23's core architectural doctrine) is, in fact, the exact discipline every one of Reflection/Insight/Review/Goal was built with — each is explicitly, repeatedly documented as "deterministic, never AI-generated text." The engineering discipline the Product Bible demands for Discovery-system integrity was applied correctly — just to four systems the Product Bible never asked for, instead of the four it did.

No evidence anywhere of an LLM being asked to perform a calculation that should be deterministic (there is no calculation-requiring feature built yet to check this against) — this is a moot finding today, but the discipline demonstrated elsewhere in this codebase is a positive signal for how Tarot/Natal Chart/Numerology would likely be built correctly if undertaken.

---

## 13. Premium/Payment Audit

Answered directly, by code, per the audit's own required questions:

1. **Can a user pay real money today?** No. No payment provider SDK in either `apps/api/package.json` or `apps/web/package.json`. No Stripe/PayPal/PayOS/VNPay integration anywhere (Module 17 names PayOS/VNPay specifically).
2. **Does a successful payment unlock anything server-side?** N/A — no payment path exists.
3. **Can premium be bypassed via direct API call?** N/A — there is no premium gate to bypass. Every feature currently built is available to every authenticated user unconditionally.
4. **Webhook signature verification?** N/A — no webhook endpoint exists.
5. **Webhook idempotency?** N/A.
6. **Duplicate payment handling?** N/A.
7. **Premium expiry handling?** N/A.
8. **What could be sold today?** Nothing is gated, so nothing is currently sellable as "premium" — the entire built feature set (Companion, Memory, Journal, Reflection, Insight, Review, Goal) is given away in full to every free user today, which is actually *directionally consistent* with Module 17's stated model (content/relationship is never gated, only the memory retrieval *window* is meant to be) — but since there's no entitlement system at all, there's no way to gate even that one dimension yet.

**Verdict: NOT STARTED.** No implementation exists to critique for correctness; the gap is 100% absence, not a broken attempt.

---

## 14. Security/Privacy Audit

This repository has an unusually strong security track record **for the modules that exist**: every prior sprint closure in `docs/progress/sprint-*-final-report.md` and `docs/security/*.md` includes an explicit ownership/IDOR/cross-user-isolation review, and this session's own Sprint 5C closure repeated that discipline (dedicated security-review pass, zero high-confidence findings, one functional gap found and fixed). Password hashing (Argon2), JWT + httpOnly cookies, CSRF double-submit, CORS, rate limiting, and secret-scanning are all real and were re-verified this session.

**Gaps relevant to this audit's scope**: no birth-data privacy model exists (because no birth-data feature exists) — Module 21's "Personal Content" encryption-at-rest tier would need to explicitly extend to birth date/time/location once Natal Chart/Eastern Horoscope are built; nothing to audit today. No admin RBAC exists (no admin surface exists). AI content privacy (memory data not used for training without opt-in, no PII in AI-call logs) — confirmed via grep in prior sprints' own audits, holds for the Companion module as built.

---

## 15. Admin Audit

**Not started.** No admin routes (frontend or backend), no RBAC roles beyond `AuthenticatedUser`, no content-management surface for Tarot cards, chart interpretations, or any other content, no user-management tooling, no moderation queue (moot — no Community exists to moderate), no payment/subscription admin view (moot — no payment exists). Module 3's own permission-tier table (Guest/Registered/Premium/Moderator/Admin/Super Admin) is entirely unimplemented beyond the basic authenticated-vs-not distinction.

---

## 16. SEO Audit

- No `sitemap.ts`/`sitemap.xml`, no `robots.ts`/`robots.txt` route handler found anywhere under `apps/web/app/`.
- Root-level `metadata` object exists in `apps/web/app/layout.tsx` (title template, OpenGraph, Twitter card) — but its description text itself advertises tarot/astrology/numerology (*"BeaconVie starts with tarot, astrology, or numerology, then remembers what you share"*) for a product surface that doesn't exist, which is a real, live inaccuracy in production-facing SEO metadata today.
- Per-route metadata exists for a few app routes (e.g., `/reviews` sets `title: 'Reviews'`) but no systematic per-route SEO strategy.
- No blog, no category/tag pages, no programmatic SEO landing pages, no schema.org structured data found.
- App Router defaults give SSR/SSG per-route "for free" (confirmed via this session's own production build output — routes are correctly marked Static `○` vs Dynamic `ƒ`), so the *infrastructure* for good SEO exists; the *content* to rank for (which, per the product's own thesis, would be exactly the Tarot/Natal Chart/Numerology landing content that drives organic top-of-funnel traffic per Module 1's own stated growth strategy) does not.

**Verdict: NOT STARTED** beyond framework defaults.

---

## 17. Test & Build Verification

Commands read directly from `package.json` (root) before running; all of these were executed against this exact repository state (HEAD `87ccd06` + the uncommitted Goal System changes) earlier in this same working session — re-stating results here rather than re-running, since nothing has changed since:

| Command | Result |
|---|---|
| `pnpm lint` | PASS — 0 errors |
| `pnpm typecheck` | PASS — both apps clean |
| `pnpm --filter @beaconvie/api test` | PASS — 72 suites / 622 tests |
| `pnpm --filter @beaconvie/api test:e2e` | PASS — 12 suites / 149 tests |
| `pnpm --filter @beaconvie/web test` | PASS — 227/227 (one unrelated auth test flaked once under parallel load, confirmed passing in isolation) |
| `pnpm build` | PASS — both apps, including the uncommitted `/goals` route |
| `npx prisma validate` | PASS |
| `npx prisma migrate status` | PASS — schema up to date |
| Full Playwright suite (`npx playwright test`) | PASS — 28/28, run alone against a production build |
| `git diff --check` | PASS |
| Secret scan (pattern-based) | PASS — no matches |

**RUNTIME UNVERIFIED**: nothing in this audit required Docker/external services beyond what was already running from the prior session (Postgres, Redis, Mailpit via `docker-compose.yml`) — all confirmed live and used by the above runs. No claim in this report about code that doesn't exist (Tarot, Payment, etc.) is a "FAIL" — it is correctly N/A/NOT STARTED, since there is nothing to run.

---

## 18. Findings Table

| # | Area | Status | Evidence | Missing | Recommendation |
|---|---|---|---|---|---|
| 1 | Tarot | NOT STARTED | Zero deck/draw/spread code; `/discover` stub only | Everything (Module 12) | P0 — build before any further Companion-adjacent work |
| 2 | Natal Chart | NOT STARTED | Zero ephemeris/calc code | Everything (Module 13) | P1 |
| 3 | Eastern Horoscope | NOT STARTED | Zero lunisolar calc code | Everything (Module 14) | P2 |
| 4 | Numerology | NOT STARTED | Zero calc code | Everything (Module 15) | P1 (cheap to build, high content-loop value) |
| 5 | Premium/Payment | NOT STARTED | No SDK, no models, no gate anywhere | Everything (Module 17) | P0 — no revenue mechanism exists |
| 6 | Community | NOT STARTED | One marketing copy line only | Everything (Module 18) | P3 (V1.5 per Bible) |
| 7 | Notifications | NOT STARTED | Settings page says "coming soon" | Everything (Module 19) | P2 |
| 8 | Admin | NOT STARTED | Zero routes/RBAC | Everything | P2 (needed before any content-managed feature ships) |
| 9 | SEO | PLACEHOLDER | Root metadata only, describes non-existent features | Sitemap, robots, per-route metadata, landing content | P1 — cheap, high-leverage, currently actively misleading |
| 10 | Reflection/Insight/Review/Goal | COMPLETE but out-of-Bible | Fully built, tested, documented | Product/Founder sign-off that this scope is intentional | P0 — resolve the scope question explicitly before building more in this direction |
| 11 | Global Nav missing 5 real features | BROKEN (UX) | `nav-items.ts` vs. actual route list | Nav entries or an intentional "power user" IA decision, documented | P1 |
| 12 | Middleware auth-guard gap (5 routes) | PARTIAL | `middleware.ts` matcher vs. actual `(app)` routes | Matcher update | P2 (fails closed today, but inconsistent) |
| 13 | Embeddings/pgvector vs. Module 23 | CONTRADICTION (documented divergence, undisclosed against the Bible) | `memory-engine.md` vs. Module 23 | A decision record acknowledging and either ratifying or reversing this | P1 — resolve before Reports (Module 16) is ever attempted, since Reports depends on the richer retrieval Module 23 assumes |
| 14 | CLAUDE.md stale | PLACEHOLDER (docs) | Describes only Sprint 1 | Update to reflect actual scope + the Product Bible relationship | P2 |

---

## 19. P0/P1/P2/P3 Backlog

**P0 — blocks launch or blocks revenue**
- Resolve the scope question (Finding #10): is Reflection/Insight/Review/Goal *replacing* the Discovery-system thesis, or is Discovery still required alongside it? This is a product decision, not an engineering one, and every other P0/P1 item below depends on the answer.
- Build Tarot (Module 12) — the Bible's own designated P1/MVP content loop; currently fully absent.
- Build a Premium/Payment path (Module 17) — no revenue mechanism exists at all today.

**P1 — strongly affects conversion/correctness/trust**
- Build Numerology (cheap, high content-loop value per the Bible's own priority table).
- Build Natal Chart.
- Fix SEO metadata actively describing non-existent features (`app/layout.tsx` description/OG text) — currently misleading, zero-cost to fix immediately.
- Add sitemap/robots and basic per-route metadata.
- Resolve/document the embeddings-vs-deterministic-retrieval divergence from Module 23 before building Reports.
- Fix Global Nav — five real, fully-built features are currently undiscoverable from primary navigation.

**P2 — should follow launch**
- Notifications (Module 19).
- Admin (needed once any content — Tarot cards, chart interpretations — needs managing).
- Eastern Horoscope.
- Close the middleware auth-guard matcher gap.
- Update `CLAUDE.md` to reflect real scope.

**P3 — polish / technical debt**
- Community (Module 18 — explicitly V1.5 in the Bible itself, correctly not urgent).
- `/insights/internal` — decide whether to formally gate it or remove it now that Insight Experience (the public version) is stable.

---

## 20. Current Launch Readiness

**Can a user go from landing to a complete first-use flow today?** Partially. Landing → Register → Onboarding → Companion/Journal/Memory all work end-to-end and are well-built. But the marketing copy on that same landing page (and the root SEO metadata) promises tarot/astrology/numerology as the entry point — the actual first thing a curious visitor can do related to that promise is look at four "Coming soon" badges.

**Is there a P0 blocking launch?** Yes: the product, as specified by its own Product Bible and as marketed on its own landing page, has not built its stated entry point (Discovery systems). Launching today would mean launching a generic AI journaling companion whose own homepage over-promises a feature set that doesn't exist — a trust and expectations problem on day one, for a product whose #1 stated value (Module 25, Constitution) is trust.

---

## 21. Current Revenue Readiness

**Can this product make money today?** No. There is no payment provider integration, no entitlement model, no gated feature, and no pricing enforcement anywhere in the code — `pricing-section.tsx` renders static marketing text describing tiers that don't exist behind them. Per the Product Bible's own stated model (Module 17), Premium is meant to gate memory-retrieval depth, not content — which is actually a lower-lift monetization surface than a typical astrology-app content paywall, but zero of the entitlement infrastructure to support even that narrower model exists yet.

---

## 22. Recommended NEXT SPRINT ONLY

This audit does not propose a multi-sprint roadmap (out of scope per the task). For the **single next sprint**, the highest-leverage, lowest-risk action is:

**Get an explicit Founder/CPO decision (Module 25's own required escalation for anything touching a Product Invariant) on Finding #10** — is the Reflection/Insight/Review/Goal line of work a deliberate, sanctioned pivot away from the Discovery-systems thesis, or has the last several sprints drifted from the Product Bible without anyone deciding that on purpose? Every other prioritization in this report (Tarot vs. more Companion-adjacent features, Premium vs. more free functionality) is downstream of that single answer, and building anything further before it's answered risks compounding the same drift.

---

## FINAL VERDICT

**NEEDS REMEDIATION**

The engineering that exists is high quality, well-tested, and well-documented — but it has built a different product than the one this repository, its Product Bible, and its own landing-page marketing copy all say it is. This is not a bug-fixing or hardening problem (that would be "NOT READY" or "READY FOR LAUNCH HARDENING"); it is a scope-and-direction problem that requires a product decision before further engineering sequencing can be meaningfully planned.
