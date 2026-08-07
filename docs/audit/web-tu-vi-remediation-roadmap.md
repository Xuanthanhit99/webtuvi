# Web Tử Vi — Product Direction Remediation Roadmap

**Date:** 2026-08-07
**Status:** Planning only — no code changed, nothing committed, no sprint started.
**Premise (given, not re-derived):** the product direction is confirmed as **RETURN TO THE PRODUCT BIBLE**. Discovery systems (Tarot, Natal Chart, Eastern Horoscope, Numerology) are the entry point; Companion remains the long-term relationship layer; Reflection/Insight/Insight/Review/Goal are not the next roadmap priority.

**Source of truth:** `docs/reference/web-tu-vi/web-tu-vi/` (Product Bible, Modules 1–25), `docs/audit/web-tu-vi-current-state.md` (this session's own prior audit), current repository code.

---

## 1. Current Product Mismatch

The Product Bible's thesis (Module 1) is a two-part flywheel: **Discovery systems are the doorway** (cheap, shareable, CAC-funding content — Tarot, Natal Chart, Eastern Horoscope, Numerology), **the Companion relationship is the house** (the thing that retains and eventually monetizes, via memory-depth Premium, not content gating).

What was built is **the house with no doorway and no rent collection**: a fully-realized Companion/Memory/Journal relationship layer (Bible Modules 6–11), plus four additional systems — Reflection, Insight, Review, Goal — that consume the same Journal/Memory/Companion data but appear nowhere in the 25-module Bible. Zero Discovery systems exist. Zero monetization exists. Meanwhile the landing page and root SEO metadata already publicly promise *"BeaconVie starts with tarot, astrology, or numerology"* — a live claim the product cannot back up today. The mismatch is not a missing feature here or there; it is that the product's entire funnel mechanism and its entire revenue mechanism are both absent, while four modules is has instead of them.

---

## 2. Existing Code Worth Preserving

Everything here is Bible-aligned, tested, and should be **extended, not rewritten**:

- **Auth, Onboarding, Dashboard** (Modules 6–8) — complete, matches spec.
- **Companion Core** (Module 9) — multi-provider abstraction (OpenAI/Anthropic/Gemini + Mock), safety detectors (crisis/PII/prompt-injection), cost control, streaming. This is the exact `AIService`-style abstraction Module 23 requires; Discovery-system AI interpretation should call into this, not duplicate it.
- **Memory Engine + Intelligence** (Module 10) — consent lifecycle, versioning, audit trail, deterministic retrieval/ranking. The retrieval-depth mechanism Module 17's Premium model gates already exists structurally; Premium mainly needs an entitlement check wired in front of it, not a new retrieval system.
- **Journal Foundation** (Module 11) — complete, matches spec.
- **Security/ownership discipline** — every module's `userId`-scoped queries, identical-404 ownership checks, CSRF, rate limiting. This pattern should be copied verbatim into every new Discovery/Premium module.

**Reusable pattern, even though the feature is out-of-Bible**: Reflection/Insight/Review/Goal's core engineering discipline — *deterministic computation, persisted with real evidence citations, AI (if any) only narrates, never calculates* — is precisely the architecture Module 23 mandates for Discovery systems. The pattern is worth studying as a template when building Tarot/Natal Chart/Numerology engines; the features themselves are not worth extending further right now.

---

## 3. Existing Code to Freeze/Defer

**Freeze, do not delete, do not extend:** Reflection Foundation, Insight Preparation, Insight Experience, Review Engine, Goal System (including the currently-uncommitted Goal working tree).

- No new phases, sprints, or features added to any of these four systems until Discovery + Premium ship and are stable.
- Existing users/tests/routes for these four keep working exactly as they are today — this is a freeze on *further investment*, not a regression or removal.
- `/insights/internal` stays as-is (unlinked, not further built).
- Any half-formed plans to extend Goal (relationship auto-detection, richer milestone types, etc.) are explicitly shelved.
- Revisit decision point: once Discovery + Premium are live and stable in production, Founder/CPO may explicitly re-approve one or more of these four as a *parallel* differentiator track — but that is a future decision, not a default.

---

## 4. Missing Product Bible Features

| Module | Feature | Bible priority |
|---|---|---|
| 12 | Tarot | MVP |
| 15 | Numerology | V1 |
| 13 | Natal Chart | V1 |
| 17 | Premium/Payment | V1 (sequenced after content, per Module 1's own engineering notes) |
| 19 | Notifications | V1 |
| 14 | Eastern Horoscope | V1.5 |
| 16 | Reports | V1.5 |
| 18 | Community | V1.5 |
| 20 | Settings (full surface) | Cross-cutting, currently partial |
| 21 | Privacy/Trust Center | Cross-cutting, currently partial |
| — | Admin | Implied by Module 3's permission tiers; currently absent |
| — | SEO infrastructure (sitemap/robots/per-route metadata) | Not a numbered module, but required by Module 1's own growth strategy |

---

## 5. P0 Launch Blockers

1. **No Discovery system exists at all.** The product's own stated entry point (Module 1) is entirely unbuilt; `/discover` is four static "Coming soon" badges.
2. **Landing/SEO copy actively misdescribes the product.** `apps/web/app/layout.tsx`'s metadata and the landing page both claim tarot/astrology/numerology as the product's starting point — a live, public overpromise.
3. **No content-funded CAC loop.** Module 1's business model depends on cheap Discovery content funding acquisition; nothing exists to fund it with.

*(The fourth P0 identified in the prior audit — ambiguous product direction — is resolved by this task's own premise. It must still be communicated explicitly to whoever owns the roadmap, so it does not silently recur.)*

---

## 6. P1 Revenue Blockers

1. **Zero payment/entitlement infrastructure** — no provider integration, no subscription model, no webhook, nothing to gate.
2. **Nothing to anchor value around even once payment exists** — Premium (Module 17) gates memory *depth*, which requires Discovery-driven engagement to make that depth feel valuable; today there's no Discovery activity generating that engagement.
3. **No organic top-of-funnel SEO surface** — the Discovery landing pages Module 1's growth strategy depends on for cheap acquisition don't exist yet.

---

## 7. Minimal Discovery MVP Scope

Per Module 1's own explicit MVP line — *"Tarot (single-card daily pull + 3-card spread)"* — and this task's instruction to prioritize deterministic calculation before AI: **Tarot only, two reading types only.**

**In scope:**
- Static, versioned 78-card deck dataset (upright + reversed meanings), seeded once — traditional meanings only, never AI-generated.
- Deterministic draw engine: random draw without replacement, positional metadata (e.g., Past/Present/Future for the 3-card spread).
- Two reading types: **Daily Draw** (single card, no re-draw — preserves the reflective premise per Module 12) and **3-Card Spread**.
- `tarot_reading(id, user_id, reading_type, cards[], question, created_at)` persistence — lightweight, separate from the Memory graph.
- `POST /tarot/draw` endpoint.
- Minimal UI flow: Shuffle → Draw → Reveal → traditional-meaning display → AI interpretation → mandatory Companion-chat bridge invitation.

**Explicitly deferred:** the remaining 8 Module-12 reading types (Relationship, Career, Decision, Self Reflection, Life Direction, Year Ahead, Shadow Reflection, Custom), Natal Chart, Eastern Horoscope, Numerology (all sequenced after, Section 13).

---

## 8. Minimal Premium/Payment Scope

Per Module 17's actual model — **gate memory-retrieval depth, never content or Companion access**:

**In scope:**
- `subscription_status(user_id, tier, renewed_at, expires_at)` — one paid tier, no tier matrix.
- Entitlement check wired in front of the *already-existing* Memory retrieval depth/window (extend, don't rebuild).
- **One** payment provider (Module 17 names PayOS/VNPay — pick one for MVP, defer the other).
- `GET /subscription/status`, `POST /subscription/upgrade`, `POST /subscription/cancel`.
- One webhook endpoint with real signature verification and idempotency handling — this is a hard security requirement even at MVP scale, not a corner to cut.
- Synchronous webhook processing is acceptable for MVP (no BullMQ dependency required yet) — a deliberate, disclosed simplification versus Module 24's full async-queue design, to be revisited once volume justifies it, in the same "disclose the deviation" spirit this codebase already applies elsewhere.

**Explicitly deferred:** Credits system, tier matrix, full historical-archive gating, priority Discovery access, richer personalization tiers.

---

## 9. Minimal AI Interpretation Scope

Per Module 23's non-negotiable rule — **deterministic calculation always precedes and is separate from AI narration; AI never calculates**:

**In scope:**
- Reuse the existing `companion/providers/` abstraction as-is (already has a real OpenAI provider) — no new provider layer.
- One narrow, Tarot-specific interpretation prompt: input is the real drawn card(s), their real traditional meaning(s) from the seeded deck DB, and — per Module 12's own rule — **at most one** most-relevant existing Memory, never multiple.
- Reuse the existing Companion safety layer (crisis/PII/prompt-injection detectors) rather than building a parallel one.
- Output is reflective/possibility-framed language only (matches the hard rule already enforced in the Companion's own system prompt today).

**Explicitly deferred:** interpretation layers for Natal Chart/Eastern Horoscope/Numerology (until those engines exist), Reports narrative synthesis, and Module 23's full seven-layer prompt architecture (MVP needs System + Tarot layer + Memory + Safety only).

---

## 10. Minimal SEO Scope

- **Immediate, sprint-independent fix**: correct `apps/web/app/layout.tsx`'s root metadata/OpenGraph/Twitter copy so it stops describing tarot/astrology/numerology as available today. This is nearly free and is actively misleading in production right now — do not wait for Sprint 6 to fix it.
- Add `sitemap.ts` and `robots.ts` route handlers (trivial in Next.js App Router).
- Add real per-route metadata to the new `/tarot` route once built.

**Explicitly deferred:** blog, programmatic SEO landing pages, schema.org structured data, full content strategy.

---

## 11. Exact Next Engineering Sprint

> **This is a recommendation only. Per instruction, no sprint is to be started from this document.**

### Sprint 6 — Tarot Discovery Foundation

**Mission:** Ship the Product Bible's own designated MVP Discovery system — deterministic Tarot engine, minimal UI, Companion bridge, narrow AI interpretation — as the first real doorway feature, without touching Companion/Memory/Journal internals and without extending Reflection/Insight/Review/Goal.

**In scope** (exactly Sections 7 + 9 above, plus the Section 10 metadata fix folded in as Phase 0 cleanup):
- Phase 0: repository audit re-confirmation + the immediate `layout.tsx` SEO fix.
- Phase 1: Tarot domain (deck dataset, `TarotReading` model/migration).
- Phase 2: deterministic draw engine (Daily Draw + 3-Card Spread only).
- Phase 3: `POST /tarot/draw` API, ownership-scoped, same security discipline as every existing module.
- Phase 4: narrow AI interpretation layer (reuses existing provider abstraction + safety layer).
- Phase 5: minimal frontend flow (`/tarot` route, off the existing `/discover` stub) + the mandatory Companion-chat bridge.
- Phase 6: tests (unit for the draw engine's determinism, e2e for ownership/ never-re-draw-on-Daily, Playwright for the full flow) + documentation, matching this repo's own established Definition-of-Done discipline.

**Explicitly not in scope for Sprint 6:** Premium/Payment (Sprint 7), Natal Chart, Numerology, Eastern Horoscope, Notifications, Admin, Community, any further Reflection/Insight/Review/Goal work.

**Why this sprint and not Premium first:** Module 1's own engineering priority table sequences Premium *after* content ("should not ship before there's a relationship worth paying for — premature monetization would suppress the trust-building period"), and Premium's own gating model (memory depth) is only felt as valuable once Discovery-driven engagement exists to deepen. Tarot is the cheapest, fastest, Bible-designated way to create that engagement.

---

## 12. 30-Day Execution Roadmap

| Days | Work |
|---|---|
| 1–2 | Communicate the "return to Product Bible" decision + the Reflection/Insight/Review/Goal freeze explicitly to whoever owns the roadmap (closes the direction-ambiguity P0 for good). Ship the `layout.tsx` SEO metadata fix immediately — independent of sprint boundaries. |
| 3–14 | **Sprint 6** (Section 11): Tarot Discovery Foundation, full Phase 0–6. |
| 15–16 | Sprint 6 closure: full Definition-of-Done pass (lint/typecheck/unit/e2e/Playwright/build/prisma/security review), matching this repo's own established closure discipline. |
| 17–28 | **Sprint 7**: Minimal Premium/Payment (Section 8) — entitlement model, one payment provider, webhook, gating the existing Memory retrieval depth. |
| 29–30 | Beta readiness review: re-run the P0/P1 blocker list from Sections 5–6 as a go/no-go checklist for closed beta. |

---

## 13. Revenue-First Release Sequence

1. **Tarot MVP ships free** — the Bible's own model never gates Discovery content; this is the CAC-funding doorway, not a revenue source itself.
2. **Premium/Payment ships**, gating Memory-retrieval depth per Module 17's exact model — this is the first real revenue mechanism.
3. **Closed beta** with a real, working payment path live end-to-end.
4. **Numerology** (V1, cheap to build, high content-loop value per the Bible's own priority notes) — widens the Discovery funnel.
5. **Natal Chart** (V1, higher computation/accuracy bar) — deepens the funnel, feeds richer Companion context.
6. **Notifications** (V1, memory-triggered, per Module 19) — retention hook that increases LTV of already-paying users.
7. **Public launch hardening.**
8. **V1.5** (only after the core loop is proven in production): Eastern Horoscope, Reports, Community.

Reflection/Insight/Review/Goal remain frozen-but-intact throughout this sequence — available as a possible future differentiator once the Bible-aligned core is proven, not a promise, not a default next step.
