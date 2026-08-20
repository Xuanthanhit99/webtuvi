# Pre-Live Product Experience Completion Audit — Tử Vi Tarot

**Date:** 2026-08-20
**Type:** Audit only. No product code modified. No commits. No pushes. No production configuration touched.
**Baseline:** `HEAD = 3bbd18c` ("fix: complete accessibility and product polish pass"), working tree carries the same uncommitted changes left by the prior Domain + Brand Production Lock and Production Activation tasks (32 files modified/untracked — verified via `git status`, unchanged since those tasks completed). Nothing in this audit added to or altered that diff.

## 0. Methodology and disclosed scope decision

This audit was built primarily from **direct source review** (reading actual component/copy/backend files) supplemented by **four parallel research passes** covering the remaining feature surface, rather than an exhaustive live click-through across every viewport.

**Disclosed reason:** at audit start, Docker was not running (Postgres/Redis/Mailpit unavailable) and the host had ~1.96GB free RAM — a state that has repeatedly caused process crashes and false-test-failures earlier in this same engineering sprint when combined with a live dev server + browser QA session. Rather than risk destabilizing the host for a task whose deliverable is a judgment document, not a code change, I chose to establish every finding below from the actual rendered copy, component logic, and gating code in the repository — which is a stronger source of truth for *exact strings and logic* than a manual click-through would be, at the cost of not directly observing live layout/animation/perceived-performance behavior in a browser.

**What this means concretely:**
- All copy quoted in this report is verbatim from source, not paraphrased from memory of a UI.
- All gating/state-machine logic (empty states, error states, premium gates, polling behavior) is read directly from the implementing component, not inferred.
- **Responsive/viewport QA (Section 13) is NOT independently browser-verified in this pass.** It is assessed from the Tailwind responsive classes and component structure, and cross-referenced against the accessibility/polish pass's prior live-tested findings (already committed in `3bbd18c`). Any viewport claim below is marked accordingly.
- **Perceived-performance timings (loading skeletons, artificial pacing delays) are read from source constants** (e.g., "700ms shuffle delay"), not measured against real network latency.

This is the same "disclosed, not glossed over" discipline used in every prior phase of this sprint (e.g., the Accessibility/Product-Polish closure explicitly not running its full Playwright suite for similar host-resource reasons).

---

## 1. Brand Promise Audit

**The question:** does the product name "Tử Vi Tarot" — now locked as the production brand across domain, SEO, emails, and UI (per the completed Domain + Brand Production Lock) — oversell a Vietnamese Tử Vi Lá Số capability that does not exist?

**Finding — confirmed directly, independently re-verified via grep across `apps/web/app` and `apps/web/features` in this pass:**

- Zero Tử Vi calculation code exists anywhere in the live product surface.
- The Discover hub (`apps/web/app/(app)/discover/page.tsx`) — the product's single feature-showcase screen — lists exactly four systems (Tarot, Bản Đồ Sao, Ngũ Hành Phương Đông, Thần Số Học), all `available: true`. **There is no fifth card, no `comingSoon` placeholder, no badge, nothing** acknowledging Tử Vi Lá Số as a concept the product is aware of and building toward — despite the `comingSoon` badge pattern already existing and working elsewhere in the same file's rendering logic (`!system.available` branch).
- The *only* acknowledgment anywhere in the reachable product that Tử Vi Lá Số is a distinct, known concept is a single disclaiming parenthetical, twice repeated, inside the **Eastern Horoscope** module: "(Not Vietnamese Tử Vi Lá Số, a separate future module.)" — on the Discover hub card description and again as the module's own landing-page intro line. This is a *disclaimer of absence*, not an *acknowledgment of intent* — it tells a user what a feature is not, buried inside an unrelated feature's description, with no link, no waitlist, no "coming soon" signal of its own.
- A full, separate Vietnamese-language Tử Vi Lá Số prototype UI *does* exist in the codebase (`apps/web/app/menh-vi/la-so/*`, with real "coming soon" copy: "Lá số 12 cung của bạn đang được chuẩn bị — bức tranh vận mệnh của riêng bạn sẽ sớm xuất hiện ở đây."), but the entire `/menh-vi` route tree is deliberately `notFound()`-ed at the layout level and is not linked from any real navigation. It is inert.

**Verdict on the question:** Yes — as of today, the brand name actively invites an expectation ("Tử Vi") that the product's own feature set explicitly and repeatedly disclaims rather than roadmaps. A first-time visitor who arrives because of the name "Tử Vi Tarot" — the single most likely reason a Vietnamese-speaking visitor would click through — will find four real, well-built Discovery systems, none of which is Tử Vi, and no visible sign the team knows this gap exists, unless they happen to open Eastern Horoscope specifically and read its second sentence.

**This is a genuine brand-promise gap.** It is not, however, a reason to delay for a full Tử Vi build — see Section 20 (Domain Gate reconfirmation) for the distinction between "acknowledge the gap honestly" (small, achievable now) and "close the gap" (Sprint 18, correctly out of scope).

---

## 2. First-Time Visitor Journey

Traced from `/` (marketing landing) through registration into first dashboard load, using `apps/web/content/landing-copy.ts` and the marketing components as the source of truth for exact copy.

Sequence: Hero ("An AI that actually remembers you.") → Trust section (We are NOT / We ARE) → Problem/Solution → How it works (3 steps, step 1 explicitly names all four live Discovery systems) → Discovery systems grid (4 cards, all correctly `comingSoon: false`) → Companion example exchange → Memory example → Reports teaser line → Community line → Security/privacy line → Testimonials (3 quotes) → Pricing (2 cards, **no price shown**) → FAQ (4 Q&As) → Final CTA → Footer.

This is a coherent, well-sequenced narrative arc for a first-time visitor and reads as intentional, not assembled piecemeal. Two concrete defects surfaced within it:

1. **`reportsLine` is stale and describes a shipped feature as unshipped.** Verbatim: *"As your conversations build up, a monthly reflection report pulls the threads together — a **V1.5 feature, on its way**."* (`landing-copy.ts:87-88`). The Personal Destiny Report feature is fully shipped (Sprint 16) — a Premium, on-demand, 11-section report combining Natal Chart + Numerology, reachable today at `/reports` and cross-linked from the Discover hub with a "Premium" badge and "Open Personal Destiny Report" CTA. The homepage tells a prospective user this doesn't exist yet, and mischaracterizes its actual shape ("monthly," triggered by "conversations building up") when the real feature is on-demand and birth-data-driven. A visitor reading this line has been told to expect a future maybe; the real thing is one click away after signup.
2. **Testimonials are original marketing copy, not real user quotes, attributed generically to "Early user."** The file's own header comment is candid about this: *"Where Module 5 describes a section's intent without providing exact copy... two of three testimonials... copy below is original text written to match the documented tone/content rules — never lorem ipsum, always marked here so it's easy to revisit against real testimonials... later."* This is honest in the codebase but **not disclosed to the visitor** — the rendered page presents three quotes with the attribution "Early user," which a reasonable visitor will read as real testimony from real people who used the product. For a product that has not yet gone live, this is a materially different claim from reality. See Section 8 (Trust Audit).

---

## 3. Pre-Login Experience Model — Recommendation

Three models were specified for consideration; this audit recommends **one**, without implementing it:

- **Option A — fully authenticated-gated:** every feature (including Discovery) requires signup first.
- **Option B — public info + authenticated calculation (current de facto state):** marketing page fully describes all systems; actually running Tarot/Numerology/Natal Chart/Eastern Horoscope requires an account.
- **Option C — limited anonymous demo:** let a visitor run one real, deterministic calculation (e.g., a single free Tarot card) before requiring signup.

**Current actual state is Option B** — confirmed via the Discover hub and all four journey walkthroughs (Section 7): every calculation form is inside `(app)/discover/*`, all of which sit behind the authenticated route group.

**Recommendation: keep Option B.** Reasoning:
- The product's core differentiator per its own trust-section copy ("We ARE: An AI Companion that remembers what you share") is *memory across sessions* — a concept that structurally requires an account to demonstrate honestly. A frictionless anonymous demo (Option C) would showcase the *weakest* differentiator (a single deterministic draw, which is table-stakes for any Tarot app) while being unable to show the actual product (persistent Companion memory) without a second, disjointed signup step immediately after.
- Registration itself is already low-friction (Section 4): one screen, no forced email-verification gate before reaching the dashboard, OAuth buttons honestly disabled rather than faked. The marginal friction Option C would remove is small.
- Option A (fully gated even for marketing info) would actively hurt the brand-promise problem in Section 1 — a visitor specifically curious "is this a Tử Vi app?" needs to be able to see the Discover hub's system list (or a landing-page equivalent of it) *before* committing an account, precisely to self-select correctly and avoid disappointed signups.
- Option C is worth revisiting later as a growth experiment (a single anonymous Tarot pull is a reasonable low-cost acquisition lever), but is not required for pre-live readiness and would add scope, not close a gap.

**No implementation was made for this recommendation**, per the audit-only constraint.

---

## 4. Registration & Onboarding

**Registration** (`(auth)/register`): single screen, standard email/password + display name fields, OAuth buttons present and honestly labeled "(Coming soon)" — not clickable, not faked as functional (a positive trust signal, not a defect). No forced email-verification gate blocks progress to onboarding/dashboard; verification status is tracked (visible later in Settings: "Email verified: Yes/Not yet") but not enforced as a blocker. This is a reasonable low-friction choice for a reflection/companion product.

**Onboarding chat** (`apps/api/src/onboarding/conversation-script.ts`): scripted conversational flow. **One confirmed, severe defect:**

> **`DISCOVERY_CHOICE` stage, "accepted" response** (`conversation-script.ts:46`): *"Discovery is still warming up on our end — I'll let you know the moment it's ready. For now, I'll keep what you've shared in mind."*

This is false. All four Discovery systems are live, `comingSoon: false`, fully reachable at `/discover/*`. This line fires at the exact moment a brand-new user — during their very first structured interaction with the product — expresses interest in trying Discovery, and the product's own onboarding voice tells them, incorrectly, to wait. This actively suppresses engagement with a real, shipped, valuable feature at the highest-intent moment in the entire funnel. This reads as a script written before Sprint 16 shipped Discovery broadly and never revisited — independent of the Tử Vi question entirely, and one of the two most consequential findings in this audit (see Section 19, classified P0).

---

## 5. Dashboard

Reviewed via direct agent research (`dashboard-view.tsx`, `dashboard-api.ts`, `premium-status-card.tsx`).

Five stacked sections: Hero (server-driven greeting/CTA), Discovery suggestion card, Companion panel (fixed calm empty copy: *"I'm here whenever you're ready. We can start with something small."*), Recent activity (**entirely omitted with no empty-state copy when a user has zero history** — the only unexplained absence found in this audit's empty-state review), Memory card (explicit, warm empty copy), Premium status card (always present).

**Findings:**
- **Zero-history Recent Activity has no empty state at all** — the card simply doesn't render. Every other empty state in the product (Memory, Companion, Tarot history, Notifications, Reports) has considerate, specific copy. This one silently disappears instead, which is inconsistent with the product's otherwise deliberate empty-state voice (Section 9) and slightly disorienting for a first-time dashboard visit — a shorter dashboard than a returning user will eventually see, with no signal to the new user about what's missing or why.
- Up to 5 simultaneous CTAs on a zero-history dashboard (hero CTA, Discovery suggestion, "Start a conversation," Memory link, Premium upgrade). The hero CTA has real visual priority (solid button vs. text/card links elsewhere), so this is a mild rather than severe focus problem, but it is worth noting against the task's "single next best action" bar.

---

## 6. Discover Hub

Covered fully in Section 1. Structurally clean: heading, subheading naming all four live systems, four cards with consistent "Try {system}" CTAs, plus a separate Personal Destiny Report card (correctly badged "Premium," correctly gated). The only defect is the brand-promise gap already described — no structural/UX issues in the hub itself.

---

## 7. Discovery System Journeys (Tarot, Numerology, Natal Chart, Eastern Horoscope)

All four follow one clearly deliberate shared pattern, confirmed directly from each module's components:

- Landing intro always states the calculation is **real and deterministic**, with an explicit, repeated sentence that AI never chooses or invents the result — this same "deterministic-first" discipline the project's own CLAUDE.md requires is enforced consistently in user-facing copy, not just backend logic.
- A short artificial pacing delay (400–700ms) before reveal, explicitly commented in code as pacing rather than fake computation.
- AI-generated narrative is always visually distinct (bordered, tinted "insight" box, Sparkles icon, "AI Interpretation" caption) from the deterministic result above it, and always closes with a variant of "Written by AI to narrate the result above — it never chooses or changes it." This is a strong, consistent trust pattern applied uniformly across all four systems — a genuine product strength worth calling out, not just a gap list.
- Premium gating is uniform: `PREMIUM_REQUIRED` → message + "Upgrade to Premium" CTA; daily-limit-reached (even for Premium's higher ceiling) → message with no upsell (correctly, since upselling wouldn't help).

**Natal Chart-specific finding:** the "Calculation details" section exposes raw technical jargon with no glossary — house-system codes, timezone, "Calculation version" verbatim, plus aspect names (Conjunction/Opposition/Trine/Square/Sextile) and house numbers with no inline explanation of what a house or aspect *means* conceptually, only what placement fell where. This is the single clearest jargon-exposure risk found in the whole audit for a non-expert user. Not severe (it's a collapsed, secondary section, and each planet placement does carry a plain-language "meaning" sentence), but real.

**Eastern Horoscope:** carries the clearest, most prominent version of the Tử Vi disclaimer anywhere in the product — directly under its own H1, stated twice. This module is doing the disclosure work almost entirely alone; it should not have to (see Section 1 remediation).

---

## 8. Vietnamese Tử Vi Lá Số — Present-Reality Check

Reconfirmed independently (own grep + agent cross-check): **no live route, no nav entry, no calculation code.** The only artifact is the inert `/menh-vi` prototype tree, correctly 404'd, correctly unlinked, correctly preserved-not-deleted per its own governing comment (Sprint 14 founder decision). Nothing here contradicts CLAUDE.md's framing of Tử Vi as a separate, founder-greenlit future module with zero present code. This audit did not, and was not asked to, evaluate Tử Vi domain accuracy or implement anything — the only live question is the brand/UI acknowledgment gap already covered in Section 1.

---

## 9. Personal Destiny Report

Reviewed via agent research (`report-detail.tsx`, `report-readiness-panel.tsx`, `report-history-list.tsx`). Structurally strong: readiness panel clearly separates required sources (Natal Chart + Numerology) from optional context (Tarot, Memory-with-consent); 11 defined sections with a `"Deterministic — never AI-generated"` badge specifically on the Calculated Facts section, distinguishing it from context-augmented narrative sections; GENERATING state polls and handles bookmarked/shared links to an in-progress report; regeneration and retry both present; empty state ("No reports yet...") is warm and specific.

No defects found in the feature itself. The only issue touching this feature is external to it — the homepage's stale "V1.5, on its way" line (Section 2) undersells something this module actually does well.

---

## 10. Companion

Deliberately non-chat-bubble, "journal-like" layout — confirmed as an intentional design choice via code comment, not an oversight. Empty states are calm and consistent ("I'm here whenever you're ready. We can start with something small.") across both zero-conversations and zero-messages-in-conversation states. Memory usage is disclosed per-message via a "Why I remembered this" disclosure pattern, plus a parallel "why I ignored something" disclosure for skipped memory — an unusually honest, granular trust mechanism, worth noting as a strength.

**One finding:** the conversation header shows a bare `"AI"` badge but **no specific provider/model name is disclosed anywhere** (confirmed via grep — no "Claude"/"GPT"/"OpenAI"/"Anthropic"/"powered by" string exists in the Companion UI). This is very likely an intentional, correct choice (avoiding provider lock-in messaging, avoiding "AI marketing" per the code's own Sprint 8.5-remediation comment) rather than a gap — flagged for completeness, not as a defect. Retry/cancel/rate-limit/offline states all have specific, calm, on-brand copy — no generic "an error occurred" found anywhere in this module.

---

## 11. Memory

Reviewed via agent research. Genuinely sophisticated, honest consent model: global default + 18 per-type overrides, Health explicitly requiring manual opt-in regardless of global setting, full version/activity history per memory, JSON export. Copy is consistently precise about what is and isn't guessed ("Nothing here is guessed — every memory traces back to something you actually said or explicitly asked [Companion] to remember"). No defects found.

**Minor duplication note:** Settings retains a legacy "Onboarding memory (legacy)" consent dropdown, separate from and adjacent to the main Memory consent system, both on the same Settings page. Not broken, but two consent controls with overlapping subject matter sitting next to each other on one screen is a mild coherence smell worth a P3 cleanup note, not a launch blocker.

---

## 12. Notifications & Retention

One real eligibility rule exists in the notification system: a Tarot daily-reminder, correctly gated (active account, has drawn before, hasn't drawn today, respects the in-app/email preference toggle, cron-deduped). Empty state ("Nothing new... this is the expected, healthy state") is explicitly designed against anxiety-driven badge patterns per a cited product-bible reference — a deliberate, good restraint choice, not an unfinished feature. Account/payment notices are correctly always-on and disclosed as non-optional. No defects found; this system is small but coherent and honestly scoped (it does not pretend to have more retention mechanics than it does).

---

## 13. Premium & Payment UX

**Premium visibility:** no price is shown anywhere pre-login (confirmed twice, independently, by direct review and by agent research) — only descriptive tier copy. The actual price is correctly never hardcoded client-side (fetched from backend, `priceVnd`/`currency`), which is good engineering discipline, but the effect is that a visitor cannot answer "how much does this cost" without registering first. This is a real transparency gap against the task's own "pricing visibility" question.

**Benefit-copy inconsistency across three locations:**
- `/premium` upgrade panel: concrete — "Higher daily Tarot allowances, deeper AI interpretations, and unlimited reading history."
- Dashboard `PremiumStatusCard`: near-identical but reworded — "Higher Tarot daily limits, deeper interpretations, and unlimited reading history."
- Marketing pricing section: different message entirely, no mention of Tarot limits — "Premium remembers across every conversation, not just today's."

None of these three is wrong, but they describe Premium's value through three different lenses (feature limits vs. feature limits reworded vs. memory-only), which could read as three different products to a user comparing screens. A genuinely concrete, complete feature matrix *does* exist (`premium-matrix.tsx` — exact per-feature numbers) but is only surfaced in one of the three locations.

**Payment/checkout flow:** well-built. Full-page redirect to PayOS hosted checkout (no fake in-app card form — correct per "Payment provider selected via PayOS... real implementation" constraints), specific error copy per failure code, a kill-switch-aware disabled state ("Upgrades are temporarily unavailable"), and a return-page state machine that explicitly never trusts the redirect's query param and instead polls the real order status every 2s with distinct copy for PENDING (<60s), PENDING (slow, ≥60s), PAID, and terminal-non-paid states. This is a materially more careful payment-return implementation than most products ship. No defects found.

---

## 14. Settings & Account

Single-page, well-organized: Account, Premium status, password change (with an honest "signs out every other device" warning), active sessions (with per-session and sign-out-all controls), legacy onboarding-memory setting, full Memory consent embed, data export, account deletion (requires password re-entry, explicit and accurate about what is/isn't retained — "a record of your past payments is kept for accounting purposes, but it contains no personal profile information"), Notifications. No AI-provider/model preference control exists — consistent with the Companion's own choice not to expose model identity (Section 10), not a gap.

---

## 15. Trust Audit

Genuine strengths, confirmed directly across multiple modules: consistent "deterministic vs. AI-narrated" visual separation across all four Discovery systems and the Report; per-message memory-usage disclosure in the Companion; explicit non-guessing language in Memory; an honest, accurate account-deletion disclosure; OAuth buttons that are disabled rather than faked.

**Two real trust gaps:**
1. **Testimonials attributed to "Early user" are original marketing copy, not real user quotes** (Section 2). For a product about to go live for the first time, presenting invented quotes under a real-sounding attribution is a materially different claim than the truth, even though no specific person's name or likeness is used. This is the kind of claim CLAUDE.md-adjacent production-readiness guidance in this same sprint has previously and explicitly flagged as a "do not fabricate" category (testimonials/user counts/outcomes) elsewhere in this engineering effort.
2. **Legal/trust pages are unreachable once logged in.** `/privacy`, `/terms`, `/contact` exist only in the marketing footer, which is not rendered anywhere inside the authenticated app shell (`app-shell.tsx` composes Sidebar/Header/VerifyEmailBanner/content/MobileNavigation only — no Footer). A logged-in user who wants to re-read the privacy policy (a reasonable, not-rare action, especially around a Memory/Companion product that talks a lot about privacy) has no in-app path to it short of manually typing a URL.

---

## 16. Empty-State Audit

Systematically strong across the product — Memory, Companion (both conversation-list and no-conversation-selected), Tarot/Numerology/Natal Chart/Eastern Horoscope history, Reports history, Notifications, and Active Sessions all have specific, warm, on-voice empty copy (several explicitly designed against anxiety, per cited product-bible references). **The one exception is Dashboard's Recent Activity card, which renders nothing at all rather than an empty state** (Section 5) — the single inconsistency in an otherwise disciplined pattern.

---

## 17. Error-State Audit

Consistently specific rather than generic across every module reviewed: Tarot ("Couldn't draw a card"), Natal Chart geocoding (distinct copy for zero-results vs. service-unavailable vs. generic failure), Companion (distinct copy for rate-limited/offline/generic-error/safety-refusal), Premium checkout (distinct copy for provider-unavailable/rate-limited/generic), Dashboard/Reports (`ErrorState` component, specific messages, retry actions). No instance of a bare "Something went wrong" with no retry path was found. This is a genuine, cross-cutting product strength.

---

## 18. AI-Experience Audit

The deterministic/AI-narrated separation (Section 7) is the product's strongest, most consistently applied trust mechanic and directly enforces this same session's CLAUDE.md constraint ("Discovery systems are deterministic-first... only the narrated interpretation on top is AI-generated") in user-facing UI, not just backend logic. Companion correctly discloses memory usage per-message without disclosing specific provider/model (a defensible choice, Section 10). No AI-experience defects found beyond the onboarding-script staleness already covered in Section 4, which is a copy-accuracy bug, not an AI-disclosure bug.

---

## 19. Product-Coherence & Cross-Feature Journey Audit

The product tells one consistent story about itself in almost every place it speaks — except three places where stale or inconsistent copy breaks that coherence:

1. Onboarding chat says Discovery "is still warming up" (false; Section 4).
2. Homepage says Reports is "a V1.5 feature, on its way" (false; Section 2/9).
3. Two sr-only headings still say "BeaconVie" (`trust-section.tsx:9`: "What BeaconVie is and isn't"; `problem-solution.tsx:9`: "The problem BeaconVie solves") — confirmed via direct grep in this pass. These are not visually rendered (screen-reader-only `<h2>` labels) but are real, present in the accessible name/DOM, and were missed during the otherwise-thorough Domain + Brand Production Lock rename pass. A screen-reader user moving through the landing page today hears "Tử Vi Tarot" everywhere in visible copy and then hits "BeaconVie" twice in structural headings — a real accessibility-facing brand inconsistency, small in surface area but exactly the kind of gap an audit like this exists to catch.

Cross-feature journeys that *were* traced (Discover → feature → Companion "Ask Companion about this" link on Reports; Tarot/Numerology/Natal Chart/Eastern Horoscope → Premium upsell → checkout → return-page → Premium status refresh across Dashboard/Settings) are coherent and correctly wired, with React Query cache invalidation on payment success ensuring Premium status doesn't go stale across screens.

---

## 20. Tử Vi Domain Gate — Reconfirmation

Restating the distinction precisely, since it is the central judgment call of this audit:

- **Product-Complete blocker** (already established by the prior Product-Complete Production Readiness Audit, unchanged by this pass): a real, domain-source-grounded Vietnamese Tử Vi Lá Số calculation engine does not exist and must not be fabricated. This remains correctly out of scope until Sprint 18, per founder decision and CLAUDE.md.
- **PRE-LIVE blocker, as newly scoped by this audit: not the missing engine — the missing acknowledgment.** Nothing found in this audit requires building any Tử Vi calculation logic to reach pre-live readiness. What the current state lacks is a single, honest, minimal UI acknowledgment: a "coming soon" card on the Discover hub, using the exact same badge/card pattern already implemented and unused elsewhere in that same file (`!system.available` branch), requiring zero new logic — just a fifth `SYSTEMS` entry with `available: false` and a short, honest description. This closes the brand-promise gap (Section 1) without violating "do not implement Tử Vi rules without domain sources" in any way, since it implements nothing about Tử Vi itself, only that the team is aware it's expected and is building it deliberately.

**Conclusion: Tử Vi is not, by itself, a reason to withhold production activation.** The brand-promise gap it creates is real and should be closed before launch, but the fix is a small, honest UI addition, not a domain-completeness dependency.

---

## 21. Personas

**Persona 1 — Curious-about-Tarot visitor.** Arrives via search/social for "AI Tarot app." Journey: lands on marketing page, sees deterministic-Tarot-plus-memory pitch clearly, registers, onboards, is told Discovery "is still warming up" (false — Section 4), recovers by finding Discover hub via the sidebar nav regardless, draws a card, sees a clean deterministic/AI-narrated split. **Experience: good, undermined once by a false onboarding line that, if believed, could cause them to leave before finding the real feature.**

**Persona 2 — Visitor specifically seeking Vietnamese Tử Vi.** Arrives because of the brand name itself. Journey: marketing page never mentions Tử Vi Lá Số by name at all (confirmed absent from `landing-copy.ts`); registers anyway on the strength of the Tarot/Companion pitch; reaches Discover hub; sees four systems, none of which is Tử Vi; the only place they could learn "we know, it's coming" is by opening Eastern Horoscope specifically and reading its second sentence — which nothing on the Discover hub prompts them to do, since Eastern Horoscope's own card description buries the disclaimer as a parenthetical. **Experience: the most exposed persona in this audit — likely to conclude the brand name was empty marketing and to churn silently, with no signal to the team about why**, since there's no waitlist, no interest-capture, nothing to convert their specific intent into anything trackable.

**Persona 3 — Returning user evaluating Premium.** Has used free Discovery, hits a daily/history limit, sees a concrete, specific upgrade prompt with an "Upgrade to Premium" CTA. Cannot see the price without clicking through (Section 13); once on `/premium`, sees the real VND price and a concrete feature matrix. Checkout redirects cleanly to PayOS, return page handles slow/pending/paid states honestly. **Experience: solid, professionally built, only friction is the pre-registration price opacity, which doesn't affect this already-registered persona at all.**

---

## 22. Findings — Full Classification

| # | Severity | Category | Finding | Location |
|---|---|---|---|---|
| 1 | **P0** | PRODUCT / COPY | Onboarding tells new users Discovery "is still warming up" when it is fully live — actively suppresses engagement with real, shipped value at the highest-intent moment in the funnel. | `apps/api/src/onboarding/conversation-script.ts:46` |
| 2 | **P0** | PRODUCT / COPY | Homepage describes the shipped Personal Destiny Report as "a V1.5 feature, on its way," misrepresenting both its existence and its actual shape (on-demand, not monthly). | `apps/web/content/landing-copy.ts:87-88` |
| 3 | **P1** | TRUST / DOMAIN | Brand name "Tử Vi Tarot" has no acknowledgment anywhere in the product that Tử Vi Lá Số is a known, intended future feature, beyond one buried disclaiming parenthetical inside an unrelated module. | `apps/web/app/(app)/discover/page.tsx`, `apps/web/features/eastern-horoscope/*` |
| 4 | **P1** | TRUST | Homepage testimonials are original marketing copy attributed to "Early user," not real user quotes, undisclosed to the visitor as such. | `apps/web/content/landing-copy.ts:94-97` |
| 5 | **P2** | COPY / TRUST | FAQ answer "What does Premium actually add?" still references "full reflection reports," echoing the same stale framing as finding #2. | `apps/web/content/landing-copy.ts:128` |
| 6 | **P2** | ACCESSIBILITY / DOMAIN | Two sr-only headings still read "BeaconVie," missed during the Domain + Brand Production Lock rename pass. | `apps/web/components/marketing/trust-section.tsx:9`, `apps/web/components/marketing/problem-solution.tsx:9` |
| 7 | **P2** | MONETIZATION | No price shown anywhere pre-login; only descriptive tier copy, requiring registration to learn cost. | `apps/web/components/marketing/pricing-section.tsx`, `apps/web/content/landing-copy.ts:99-109` |
| 8 | **P2** | TRUST | Legal/trust pages (`/privacy`, `/terms`, `/contact`) unreachable from within the authenticated app — footer with these links only renders in the marketing route group. | `apps/web/components/layout/app-shell.tsx` |
| 9 | **P3** | UX | Dashboard's Recent Activity card silently disappears for zero-history users instead of showing an empty state, inconsistent with every other module's empty-state pattern. | `apps/web/features/dashboard/components/dashboard-view.tsx` |
| 10 | **P3** | COPY | Premium benefit copy is worded three different ways across `/premium`, `PremiumStatusCard`, and the marketing pricing section. | `premium-upgrade-panel.tsx`, `premium-status-card.tsx`, `landing-copy.ts:104-106` |
| 11 | **P3** | UX | Natal Chart's collapsed "Calculation details"/aspects/houses sections expose raw astrological jargon (house-system codes, aspect names) with no inline glossary. | `apps/web/features/natal-chart/components/interpretation-sections.tsx` (and siblings) |
| 12 | **P3** | UX | Settings retains a legacy "Onboarding memory" consent dropdown adjacent to the full Memory consent system, overlapping subject matter on one screen. | `apps/web/app/(app)/settings/page.tsx` |
| 13 | **P3** | DOC | `docs/architecture/product-surface-map.md` is stale (dated Sprint 14, predates Eastern Horoscope and Reports shipping, still says "BeaconVie exclusively"). Internal doc only, not user-facing. | `docs/architecture/product-surface-map.md` |

No P0/P1 findings require Tử Vi calculation work. No findings require production infrastructure changes. All are copy, a small UI addition, or a scoped honesty decision (testimonials).

---

## 23. "Ready to Live" Matrix

| Dimension | Status | Basis |
|---|---|---|
| Brand/domain consistency (visible copy) | **PASS** | Prior lock pass verified; only sr-only headings remain (finding #6) |
| Brand/domain consistency (full DOM incl. a11y tree) | **PARTIAL** | Finding #6 |
| Brand promise vs. actual feature set | **PARTIAL** | Finding #3 — real gap, small fix |
| Registration/onboarding correctness | **PARTIAL** | Finding #1 — false statement to new users |
| Dashboard coherence | **PARTIAL** | Finding #9 |
| Discovery systems (Tarot/Numerology/Natal Chart/Eastern Horoscope) | **PASS** | Section 7 — consistent, trustworthy, well-built |
| Personal Destiny Report | **PASS** | Section 9 — no defects in the feature itself |
| Companion | **PASS** | Section 10 |
| Memory | **PASS** | Section 11 |
| Notifications/retention | **PASS** | Section 12 |
| Premium/payment UX | **PARTIAL** | Findings #7, #10 — functionally solid, communication gaps |
| Trust/marketing honesty | **PARTIAL** | Findings #4, #2, #5 |
| Legal-page reachability | **PARTIAL** | Finding #8 |
| Error/empty-state discipline | **PASS** | Sections 16-17, one exception (#9) already counted above |
| AI-experience discipline | **PASS** | Section 18 |
| Vietnamese Tử Vi domain completeness | **N/A to pre-live** (correctly deferred to Sprint 18) | Section 20 |

**Overall: PARTIAL.** No dimension is an outright FAIL. Every PARTIAL is closeable without touching Tử Vi calculation logic, production infrastructure, or payment/domain configuration.

---

## 24. Recommended Minimum Remaining Pass

Not sprint-numbered, deliberately scoped to only what Section 22/23 actually requires:

1. Fix `conversation-script.ts:46` (finding #1) — replace the stale "still warming up" line with an accurate one pointing to the live Discover hub. Smallest, highest-priority fix in this report.
2. Fix `landing-copy.ts:87-88` and `:128` (findings #2, #5) — rewrite the Reports teaser and FAQ answer to describe the real, shipped feature.
3. Rename the two sr-only headings (finding #6) — two-line fix.
4. Add one honest `SYSTEMS` entry to the Discover hub for Tử Vi Lá Số, `available: false`, reusing the existing coming-soon badge pattern already in the file (finding #3) — no Tử Vi logic, a UI acknowledgment only.
5. Decide and act on the testimonials question (finding #4): either replace with real early-access user quotes once any exist, remove the section pre-launch, or add a visible "illustrative" disclaimer — a product/founder call, not an engineering one.
6. Decide the price-visibility question (finding #7): either show the real price pre-login or explicitly accept the current opacity as intentional — a product call.
7. Add a minimal in-app link to Privacy/Terms from Settings (finding #8) — smallest structural fix in this list.
8. Optional, P3, non-blocking: dashboard empty-state copy (#9), unify Premium benefit copy (#10), Natal Chart glossary (#11), Settings memory-control consolidation (#12), refresh the internal surface-map doc (#13).

**If items 1-7 are done, this product is genuinely ready to go live under its own stated brand promise.** None of them require Tử Vi domain sources, production credentials, or infrastructure changes — this is a copy-and-one-card pass, realistically same-day work once a founder makes the two disclosed product calls (testimonials, pricing visibility).

---

## Verdict

**PRE-LIVE PRODUCT EXPERIENCE NOT READY — REMEDIATION REQUIRED**
