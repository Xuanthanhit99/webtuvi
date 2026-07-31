# MODULE 1 — PRODUCT VISION & STRATEGY
### AI-First Personal Discovery Platform

---

## 1. Executive Summary

**Purpose**
Define why this product exists, what it must become, and the single strategic bet everything else in this Product Bible must serve.

**Problem**
Self-reflection tools today fall into two failed categories:
- **Fortune-telling apps** (tarot/astrology apps): high engagement on day 1, near-zero retention past week 2, because the content is stateless — every reading is disconnected from the last. There is no relationship, only a transaction.
- **Generic AI chat apps**: infinite flexibility but no identity, no ritual, no memory depth on the user's inner life. Users don't return because there's no reason to return *here* specifically instead of any other chatbot.

Neither builds a long-term relationship. Neither compounds in value over time. Both plateau.

**Opportunity**
Tarot, astrology, numerology and Eastern horoscope are not the product — they are **structured entry rituals** that give an AI Companion a legitimate, low-friction reason to ask deep personal questions without feeling invasive. A card pull or a natal chart placement is a socially-acceptable icebreaker into "How are you really doing?" No one opens ChatGPT and says that unprompted. They will, after a tarot spread asks them to reflect on it.

This is the wedge: **discovery systems are the doorway, the Companion relationship is the house.**

**Vision**
A product where every tarot pull, every chart transit, every journal entry becomes a memory the AI Companion carries forward — so that six months in, the Companion knows the user better than any horoscope app ever could, and better than a new therapist would in a first session. The discovery systems age into the background; the relationship becomes the reason people stay.

**Expected Outcome**
A product where D30 retention is driven by emotional attachment to the Companion (measured via conversation depth and journaling frequency), not by novelty of daily content — because novelty decays and memory compounds.

---

## 2. Business Strategy

**Business Goals**
1. Prove that an AI Companion with persistent memory, entered through discovery-system rituals, retains better than either category alone.
2. Convert emotional trust into sustainable premium revenue without ever feeling like a paywall on empathy.
3. Build a defensible data asset (longitudinal personal memory graphs) that a generic chatbot cannot replicate after the fact — the moat is time-in-relationship, not features.

**North Star Metric**
**Weekly Meaningful Conversations per Active User** — a "meaningful conversation" is defined as ≥4 user turns AND a reference to a prior memory (explicit recall by the AI). This is chosen over DAU or session count because:
- DAU rewards habit without depth (matches the failure mode of horoscope apps — daily open, no retention).
- Session count rewards engagement-bait UX (streaks, notifications) which erodes trust long-term.
- Meaningful Conversations forces every team (AI, Product, Growth) to optimize for depth and memory quality, which is the actual moat.

**Business Value**
The discovery systems (tarot, astrology, numerology, Eastern horoscope) are cheap to produce (deterministic/rule-based + LLM narration), have near-zero marginal cost, and carry strong organic/shareable hooks (natal charts, daily cards). They fund CAC. The Companion relationship, not the discovery content, is what justifies premium pricing and drives LTV.

**Competitive Position**
- vs. Co–Star, The Pattern, Sanctuary (astrology apps): those products stop at content delivery. This product's Companion has continuity across modules — a tarot reading references the user's natal Saturn return; a journal entry gets surfaced by the Companion during a numerology cycle. Competitors don't cross-reference their own modules, let alone build memory from them.
- vs. Replika, Character.AI (companion apps): those products have memory but no structured, low-friction ritual to keep bringing users back with a *reason* to open the app. This product supplies daily/weekly rituals (a card, a transit, a cycle number) as the retention scaffold the companion category lacks.
- **Chosen position: "The AI Companion that actually remembers you, using tarot/astrology/numerology as how it gets to know you."** Rejected position: "all-in-one mystical app" — this frames discovery systems as the product, which caps the business at the horoscope-app ceiling (low LTV, high churn, commodity content).

**Revenue Impact**
Monetization strategy (detailed in Module 13) is gated by relationship depth, not by content scarcity: free users get full discovery-system access (this is CAC-funding content, don't gate it) but limited Companion memory depth and conversation length. Premium sells *continuity*, not *access*. This is the reverse of most competitors, who gate the content (charts, spreads) and give infinite free chat. We invert it because our bet is that memory depth, not content volume, is what people will pay to keep.

**Success Metrics**
| Metric | Target (6 months post-launch) | Why this metric |
|---|---|---|
| Weekly Meaningful Conversations / WAU | ≥ 2.5 | North Star — proves memory-driven engagement |
| D30 retention | ≥ 25% | Industry benchmark for astrology apps is ~8–12%; we must beat it by 2x to prove the thesis |
| Journal entries per retained user / week | ≥ 1.5 | Leading indicator of emotional investment before conversion |
| Premium conversion (from users with ≥5 Companion conversations) | ≥ 8% | Conversion should correlate with relationship depth, validating the pricing model |
| % of Companion messages referencing stored memory | ≥ 40% by month 3 | Proves the AI is actually using memory, not just chatting |

---

## 3. User Research

**Target Audience**
Primary: Women and men 22–38, urban, moderate-to-high self-reflection orientation, existing light users of astrology/tarot content on social media (not necessarily believers — many are secular users who enjoy the framework as a reflection tool). Secondary: users coming from journaling/mental wellness apps looking for more guided structure than a blank page.

We explicitly do NOT target: users seeking literal predictive/fortune-telling accuracy, or users seeking a therapy/clinical substitute. Both are handled in Safety (Module 10) as things the Companion must actively redirect away from.

**Personas**

*Persona A — "The Reflective Skeptic" (primary)*
Doesn't "believe" in astrology literally but uses horoscope content as a structured prompt for self-reflection, the way others use journaling prompts. Follows astrology meme accounts. Journals inconsistently. Wants a companion that feels emotionally intelligent, not mystical-performative.

*Persona B — "The Ritual Seeker" (primary)*
Uses tarot/astrology as a genuine daily ritual and organizing framework for decisions. Wants depth and internal consistency in the systems (accurate transits, correct card meanings) because the ritual only works if it feels legitimate. Highest content-engagement, needs the Companion to feel like a knowledgeable guide, not a novelty bot.

*Persona C — "The Companion-First User" (secondary, high LTV)*
Arrives via Companion/AI framing (may not care about tarot at all initially) but adopts discovery systems once the Companion introduces them contextually ("Want to see what your chart says about this pattern?"). This persona is the proof of the core thesis — discovery systems as an on-ramp, not the primary draw.

**Jobs To Be Done**
- "When I'm making a hard decision, help me organize my thinking using a framework, not just tell me what to do."
- "When I've had a similar feeling before, remind me what helped last time."
- "When I don't know what to journal about, give me a prompt that's actually about my life, not generic."
- "When I'm figuring out a life pattern, connect the dots across months, not just today."

**Pain Points**
- Existing astrology apps: content feels generic/mass-produced ("Mercury retrograde" copy pasted for millions of users); no sense of being known.
- Existing journaling apps: blank page anxiety; no feedback loop; entries disappear into a void.
- Existing companion apps: memory feels shallow or gimmicky ("I remember you like dogs!"); doesn't feel like it tracks emotional throughlines.

**Motivations**
Desire to feel understood without the vulnerability cost of a human conversation; desire for a structured, lower-stakes way to process big feelings; curiosity and identity-play (who am I, per this framework).

**Emotional Journey**
Curiosity (light content engagement) → surprising specificity (a reading "hits") → first vulnerable disclosure (journal or chat) → tests whether the product remembers → if yes, trust deepens rapidly; if no, the user reverts to being a content-only user (churns to competitor content, keeps this app as one of several).

**Mental Models**
Users bring the mental model of astrology apps ("daily card, daily horoscope, that's the whole app") and must be re-taught, gently, that this app also has a persistent relationship layer. This has UX implications (Module 7): the Companion must proactively surface memory early and often in the first two weeks, or users will default to the shallower mental model and never discover the deeper one.

---

## 4. Product Strategy

**Feature Goals**
Every feature must do one of three things: (a) generate a memory-worthy signal about the user, (b) surface a previously stored memory back to the user in a way that feels considered, or (c) reduce friction to (a) or (b). Features that do none of these are deprioritized regardless of how "on-brand" they feel.

**Product Principles (applied)**
- *Memory First* overrides *Scientific where appropriate*: if a technically "more accurate" astrology calculation adds friction to memory capture (e.g., requiring exact birth time before any Companion interaction is unlocked), we ship the lower-friction version first and backfill precision later.
- *Trust First* overrides growth tactics: no dark patterns in notifications, no fake urgency in paywalls (detailed rejection in Module 13).

**Feature Prioritization**

*MVP*
- Tarot (single-card daily pull + 3-card spread)
- AI Companion (chat, with short-term session memory only)
- Journal (freeform entry, Companion can reference same-session entries)
- Basic Dashboard (today's card, streak, entry point to Companion)
- Auth (email + Google/Apple OAuth)

*V1*
- Long-term Memory system (cross-session, structured memory graph — this is the core differentiator, must not slip past V1)
- Natal Chart (birth data input, core placements, narrative interpretation)
- Numerology (life path number + narrative)
- Premium tier + paywall
- Notifications (memory-triggered, not generic "come back" pushes)

*V1.5*
- Eastern Horoscope (zodiac year, elements)
- Reports (weekly/monthly synthesis reports pulling from Memory + Journal + all discovery systems)
- Community (opt-in, anonymized pattern-sharing — NOT social feed; see rejection below)

*Future*
- Voice mode for Companion
- Multi-person compatibility readings (requires two users' consent — Privacy First constraint)
- Practitioner marketplace (human astrologer/therapist handoff for users the Companion flags as needing more than reflection)

*Moonshot*
- Predictive life-pattern modeling: the Companion proactively identifies a recurring behavioral/emotional cycle across months of memory and initiates a conversation about it before the user brings it up. This requires mature memory infrastructure (V1) and strict safety guardrails (Module 10) before it's viable — attempting it pre-V1 would produce false-pattern hallucinations that destroy trust permanently.

*Out of Scope (explicitly, and why)*
- **Predictive claims of literal fortune-telling accuracy** ("this will happen to you"): destroys trust the first time it's wrong, and creates liability/safety exposure. The product frames all systems as reflective frameworks, never predictions.
- **Public social feed / follower mechanics**: turns a private reflective relationship into a performance space, directly undermining vulnerability and disclosure (our core data asset). Community (V1.5) is explicitly anonymized and pattern-based, not profile-based, for this reason.
- **Compatibility/relationship "scoring" between users without consent**: privacy and consent risk; deferred to Future with explicit dual opt-in required.

**Decision Log**
| Decision | Alternative considered | Why rejected |
|---|---|---|
| Memory system ships in V1, not MVP | Ship memory in MVP alongside tarot | MVP needs to validate the discovery-system content loop works and retains at all before investing in the harder memory infrastructure; sequencing risk is lower this way |
| Gate Companion depth, not discovery content, behind premium | Gate natal chart / advanced readings behind premium (industry standard) | Our thesis is that content is the CAC funnel, not the LTV driver; gating content would suppress top-of-funnel virality that funds the whole model |
| No public profiles/feed in Community | Public shareable reading feed (high viral potential) | Conflicts with Trust First and Privacy First; the vulnerability required for meaningful journal/chat content cannot coexist with a performative public feed in the same product surface |

**Trade-offs**
Choosing memory depth over content breadth (V1.5 pushes out Eastern Horoscope, a system with real audience demand in some markets) accepts slower initial market coverage in exchange for a defensible product moat. This is the correct trade-off given the North Star metric is about relationship depth, not content catalog size.

---

## 12. Growth Strategy (Portfolio-Level)

**Activation**
Activation event is not "signed up" or "did a tarot pull" — it's **first Companion message that references something the user said earlier** (even within the same session in MVP, cross-session from V1). This is the moment the product's actual value proposition is felt for the first time; everything in onboarding (Module 8, separate) must be sequenced to reach this moment within the first session.

**Retention**
Retention hooks are memory-triggered, not calendar-triggered. A push notification saying "3 weeks ago you mentioned starting a new job — how's it going?" outperforms "Your daily card is ready!" on trust and long-term retention, even if the latter has a higher short-term open rate. Growth must be measured on 30/60/90-day retention, not 24-hour open rate, or the team will optimize toward the wrong notification style.

**Habit Loops**
Trigger (memory-based notification or daily ritual) → Action (open card/chart, or reply to Companion) → Variable Reward (specificity of interpretation, or Companion recalling something unexpected) → Investment (journal entry or emotional disclosure that feeds the next loop).

**Referral, Gamification, Community, Notifications, Re-engagement**
Detailed per-module in Modules 12 (Growth), 19 (Community), 20 (Notifications) individually — this section only sets the portfolio-level constraint: **no growth mechanic may create false urgency or exploit anxiety** (e.g., no "your reading expires in 1 hour," no fake scarcity on premium). This is a hard constraint from Trust First, enforced at design review for every future growth feature.

---

## 14. Analytics (Portfolio-Level KPIs)

**North Star**: Weekly Meaningful Conversations / WAU (defined above).

**Supporting KPIs**: D1/D7/D30 retention, Journal entries/WAU, % Companion messages with memory-reference, Premium conversion rate segmented by pre-conversion conversation depth, NPS segmented by tenure (to detect whether trust compounds over time as hypothesized).

**Why these and not vanity metrics**: Total registered users, total readings generated, and DAU are explicitly *not* North Star candidates — they're exactly the metrics horoscope apps already optimize for, and they already prove that model plateaus. Every dashboard for this product must lead with retention and depth metrics, not volume metrics.

---

## 15. Technical Design (Portfolio-Level Rationale)

**Why NestJS + Prisma + PostgreSQL**: Structured relational data (users, charts, journal entries, memory nodes) benefits from strong schema guarantees and relational integrity — memory retrieval will require complex joins across modules (a Companion reply may need journal + chart + tarot history simultaneously). A pure document store would make cross-module memory queries — the core differentiator — harder to build correctly.

**Why Redis + BullMQ**: Memory-graph updates and embedding generation after every user interaction should be async (queued), not blocking the chat response. This keeps Companion response latency low while memory processing happens in the background.

**Why OpenAI + embeddings for Memory, not a simpler keyword/tag system**: Keyword tagging cannot capture emotional/thematic similarity across differently-worded entries (e.g., "stressed about my mom" and "family tension again" should retrieve the same memory cluster). Embeddings are required for the product's core differentiator to actually work; this is not a "nice to have," it is load-bearing for the North Star metric.

**Privacy/Security constraint that shapes architecture**: Memory data (the most sensitive data in the product — it includes emotional disclosures) must be encrypted at rest, and any AI API calls that include memory context must not be logged with PII by default. This is decided at the architecture level now because retrofitting privacy controls onto an already-built memory graph is significantly more expensive than designing for it from Module 1 onward.

---

## 16. Engineering Notes (Portfolio-Level Priority)

| Priority | Item | Rationale |
|---|---|---|
| P0 | Memory graph schema + retrieval pipeline | Everything else depends on this; if this is wrong, no downstream module can deliver the core thesis |
| P0 | Companion chat with session memory (MVP) | Needed to validate activation-event hypothesis before investing further |
| P1 | Tarot + Journal | Cheapest content loop to ship, funds early retention data collection |
| P1 | Cross-session memory (V1) | Converts session-memory MVP into the real differentiator |
| P2 | Natal Chart, Numerology | Higher computation/accuracy bar, can follow once memory pipeline is proven |
| P2 | Premium/paywall | Should not ship before there's a relationship worth paying for — premature monetization would suppress the trust-building period |
| P3 | Eastern Horoscope, Community, Reports | Expansion, not core-loop validation |

**QA Strategy**: Given the emotional sensitivity of the product, QA must include a dedicated "trust and safety" test pass on every Companion-facing release — testing for hallucinated memories (Companion claiming to remember something never said), inappropriate literal predictive claims, and unsafe responses to disclosures of distress. This is a release-blocking QA category, not an optional pass.

---

## 17. Product Optimization (Self-Critique)

**Weakness 1**: The North Star metric (Meaningful Conversations) is expensive to instrument correctly — detecting "reference to a prior memory" requires either LLM-judged classification or reliable tagging at generation time. Risk: the metric becomes fuzzy/gameable if the classifier is weak.
*Mitigation*: Tag memory-references at generation time (the Companion's own reply generation already knows if it pulled a memory node into context) rather than post-hoc classifying free text. Cheaper and more reliable.

**Weakness 2**: Gating Companion depth (not content) behind premium is an unproven monetization model — most competitors gate content because it's easier to communicate ("unlock unlimited readings"). "Unlock deeper memory" is a harder value proposition to sell in a paywall screen.
*Mitigation*: Module 13 (Monetization) must design the paywall moment around a felt experience (a specific instance of the Companion referencing something meaningful, then noting it can remember far more with Premium) rather than an abstract feature list. This is a UX problem to solve, not a reason to abandon the strategy.

**Weakness 3**: Sequencing Memory into V1 instead of MVP risks an early-adopter cohort experiencing the "shallow companion" version, forming a mental model that the Companion doesn't really remember, and churning before V1 ships.
*Mitigation*: MVP Companion should be transparent about scope ("I'll remember this for our conversation today") rather than implying persistent memory it doesn't yet have — an honest limited promise beats an implied broken one.

---

## 18. Future Expansion

**Roadmap direction**: Voice mode and practitioner handoff are the two highest-leverage Future items — voice deepens intimacy of the Companion relationship (higher bar for emotional realism, larger technical lift); practitioner handoff converts the product from a reflection tool into a genuine care-adjacent product, which requires new trust and liability infrastructure but significantly expands addressable use cases (from "curious self-reflection" to "actively working through something hard").

**AI Opportunities**: Proactive pattern-surfacing (the Moonshot) becomes viable once the memory graph has sufficient longitudinal density (likely 3+ months of consistent data per user) — this should be revisited as a real roadmap item once V1 memory infrastructure has been in production long enough to have that density in the retained cohort, not before.

**Business Opportunities**: Longitudinal, consented, anonymized pattern data (e.g., aggregate emotional/behavioral cycle research) is a plausible B2B2C or research-partnership opportunity in Future — explicitly deferred and explicitly consent-gated, not a default use of user data.

---

## 19. Product Review

**Founder**: The thesis is sound and differentiated — I'd stake the company on "discovery systems as doorway, Companion as house" over either pure-play alone. Biggest risk is patience: the team will be tempted to ship content features because they're easier to demo, at the expense of memory infrastructure that doesn't demo well but is the actual moat.

**Chief Product Officer**: Prioritization is correctly memory-first, but Module-level teams need explicit reminding that a "cool tarot feature" is not approved by default just because it's on-brand — it must serve the memory/reflection loop.

**Principal UX Designer**: The mental-model mismatch risk (Section 3) is the single biggest UX threat to this strategy. Onboarding and early-session design (Module 8) must work very hard to reveal the Companion relationship fast, or most users never discover it and the product silently becomes "just another horoscope app" for them.

**Staff Engineer**: The architecture bets (Postgres + embeddings + async memory pipeline) are correct and appropriately future-proofed. The main execution risk is embedding/retrieval quality — mediocre memory retrieval will feel worse than no memory claim at all, because it breaks trust actively rather than passively.

**Growth Manager**: Rejecting vanity-metric growth tactics (streaks, urgency paywalls) is right for the brand but will be a real fight in typical growth-team incentive structures. Recommend the North Star metric be the literal OKR for the growth team, not DAU, so incentives stay aligned with strategy.

**AI Architect**: The Moonshot (proactive pattern surfacing) is correctly gated behind memory maturity. Flag now: safety review (Module 10) needs a hard rule that the Companion never states a "pattern" with false confidence — every proactive insight must be phrased as an observation to explore, not a diagnosis, especially given the product's proximity to emotionally vulnerable disclosures.

**Strengths**: Clear, differentiated thesis; monetization model aligned with actual value driver; explicit rejection list prevents scope creep into performative/social features that would undermine trust.

**Weaknesses**: North Star metric instrumentation risk; monetization message is harder to sell than competitor paywalls; early-cohort mental-model risk during MVP-to-V1 gap.

**Recommendations**: (1) Instrument memory-reference tagging at generation time, not via post-hoc classification. (2) Design the premium paywall moment as an experiential trigger, not a feature list — hand this explicitly to UX, not just Monetization. (3) Make the MVP Companion honest about its temporary scope to protect the future reveal of true persistent memory.

---

## 20. Final Decision

**Chosen Solution**
Build an AI Companion with persistent, structured, cross-session memory, using Tarot, Natal Chart, Numerology, and Eastern Horoscope as low-friction rituals that generate memory-worthy signal. Monetize by gating relationship depth (memory/conversation continuity), not content access. Sequence: content loop first (MVP) to validate retention-worthiness of the discovery systems, memory infrastructure second (V1) as the core differentiator, expansion systems and community third (V1.5+).

**Rejected Alternatives**
- Pure horoscope/tarot content app with bolt-on chatbot — rejected because it caps at the retention ceiling this product's data already shows those apps hit.
- Pure generic AI companion app with astrology as reskinned theming only — rejected because it lacks a structured, repeatable ritual to drive return visits, which discovery systems uniquely provide.
- Gate content behind premium (industry standard) — rejected because it suppresses the top-of-funnel virality the business model depends on to fund CAC.

**Risks**
1. Memory retrieval quality directly determines whether the core promise is credible; a mediocre implementation is worse than none.
2. Monetization model is unproven relative to industry norms and requires strong UX execution to communicate value.
3. Early-cohort trust risk during the MVP (session-memory-only) period if users assume full persistent memory prematurely.

**Mitigation Plan**
Treat memory retrieval quality as a release-blocking QA category (Module 16). Assign paywall-moment design explicitly to UX with an experiential-trigger brief, not a feature-list brief (Module 13). Require the MVP Companion to explicitly and honestly scope its memory claims until V1 ships true persistence (Module 10, Safety/Trust).

---

---
---

# VERSION 1.1 — CONSTITUTIONAL FOUNDATIONS
### Added by Product Review Board (see companion file: 01-product-vision-and-strategy-v1.1-addendum.md for full review rationale)

All sections above (1–20) are unchanged and remain authoritative. The sections below are new, permanent foundations that every future module (2 through 22) must reference and may not contradict.

## 1.1 Mission

*To give people a trustworthy place to be known over time — by an AI that remembers, and by themselves, more clearly, through the practice of reflection.*

Distinct from Vision (Section 1 above): Vision describes the product this strategy builds; Mission describes why the company shows up regardless of how that strategy evolves. The company exists to make the practice of self-reflection compound over time — through memory — rather than reset every day like a horoscope feed or plateau like a stateless chatbot.

## 1.2 Brand Positioning

**We are NOT**: a fortune-telling app; a horoscope-content publisher; a generic AI chatbot with mystical skinning; a mental health/clinical product; a social network.

**We ARE**: a reflection practice structured by discovery systems and carried forward by an AI that remembers; a long-term relationship product measured in months and years, not sessions; a private, emotionally intelligent space.

**Positioning statement**: *The AI Companion that remembers you — using tarot, astrology, and numerology as how it gets to know you, not as what it sells you.*

## 1.3 Core Product Values

Empathy (attunement over textbook accuracy) · Curiosity (ask more than tell) · Growth (self-understanding over opens) · Reflection over reaction (no engagement-bait pacing) · Trust (finite, not a renewable growth lever) · Privacy (most private default always, sharing is opt-in).

## 1.4 Design Philosophy

Calm, warm, unhurried visual emotion — a wise curious friend, never a mystic performer or clinical assistant. Considered pacing over instant reveals. Warm serif/humanist sans for the Companion's voice, clean geometric sans for structural UI. Slow, organic motion, never urgency-driven. Abstract celestial illustration, never literal fortune-teller iconography.

**Never in the UI**: countdown/urgency badges, streak-shaming copy, fake social proof, literal predictive claims stated as fact, cluttered "mystical" visual tropes.

## 1.5 AI Philosophy

Permanent, non-negotiable constraints on every AI feature: (1) never judges; (2) never predicts the future as fact; (3) never manipulates for engagement; (4) always explains its reasoning when asked; (5) always encourages reflection over dependency; (6) always respects uncertainty in ambiguous frameworks; (7) never claims capabilities it doesn't have (e.g., implying persistent memory before it exists); (8) always has a tested escalation path for signs of distress.

## 1.6 Success Definition

**Users**: understand themselves better after months of use, and feel noticed. **Business**: revenue as a byproduct of trust, not a tax on it. **AI**: users say "it gets me" without pointing to any one clever feature. **Relationship**: trust is higher in month twelve than month one — if flat or declining with tenure, the product is failing regardless of dashboards.

## 1.7 Product Flywheel

Discovery → Conversation → Memory → Insight → Trust → Journal → More Memory → Better AI → Premium → Retention → back to Discovery (now ritual, not novelty). Each stage's removal collapses the loop into one of the two failed categories named in the Problem statement (Section 1). Compounding comes from each pass leaving behind a permanent memory node — the tenth loop is categorically richer than the first, which is why retention should rise with tenure rather than decay with novelty.

## 1.8 Product Guardrails

Never create dependency · never manipulate emotions for engagement · never replace professional advice · never exploit anxiety · never fake certainty · never use dark patterns. Violating any guardrail requires Founder/CPO escalation; the default answer is no.

## 1.9 Company Decision Framework

**Trust > Memory > User Value > Retention > Revenue > Engagement.** A lower priority never overrides a higher one, even under short-term metric pressure. All future Decision Log entries (per-module) must cite this hierarchy explicitly rather than reasoning freeform.

## 1.10 Company Product Principles

A feature may only be built if it **creates memory, uses memory, or improves memory.** If it does none of the three, it is not built — regardless of novelty, brand fit, or projected metrics. Secondary test: even if it passes the memory test, it must also comply fully with AI Philosophy (1.5) and Guardrails (1.8), or it is still rejected.

---

**Next module in sequence: Product Principles.**
*(Note: given the constitutional sections now added in 1.1–1.10 above, the Product Principles module should focus on operational/engineering-level principles — coding standards, feature-team rituals, cross-functional working agreements — rather than re-deriving the values and philosophy already established here.)*
