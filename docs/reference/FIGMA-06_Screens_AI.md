# FIGMA-06 — SCREENS: AI & RELATIONSHIP

*Full frame specifications for Companion/Conversation, Memory, Journal/Reflection, Reports, and the four Discovery systems.*

---

## Companion / Conversation

**Purpose**: the core relationship surface. **User Story**: as a user, I want to talk with something that remembers me.

| Field | Spec |
|---|---|
| Layout | Full-screen conversational surface, message list above fixed input bar |
| Sections | Message thread (Companion Bubble, FIGMA-04) → input bar → floating "+ New Topic" |
| Hierarchy | Message content is the entire visual priority — chrome is minimal |
| Spacing | `space/3` between messages, capped 720px reading width on desktop |
| Responsive Grid | Full-width thread on mobile, centered capped column on desktop |
| Navigation | Global Nav present; Context Nav via tappable Memory Cards |
| Components | AI Message, Memory Card, Typing Indicator, Input, Button (floating action) |
| Loading | Typing Indicator (Thinking state) |
| Skeleton | On thread-resume, a brief message-shape skeleton for the last few messages before real content loads |
| Error | Preserve user's typed message on send failure; honest timeout copy with retry |
| Empty | Open, warm invitation copy, no forced prompt |
| Accessibility | Streaming announced once complete; full tab order through Memory Cards |
| Animation | Token-by-token streaming; Memory Recall fade-and-rise on any inline Memory Card |
| Developer Notes | This exact screen/component set is reused for Onboarding's conversation (FIGMA-05) — no divergent implementation |
| Edge Cases | User testing the AI ("do you actually remember me?") receives an honest, calm answer — no defensive or over-claiming response pattern in any copy variant |

---

## Memory (Timeline)

**Purpose**: full transparency into stored memory. **User Story**: as a user, I want to see, verify, and control what's remembered.

| Field | Spec |
|---|---|
| Layout | Reverse-chronological Timeline, filter bar above |
| Sections | Filter bar (type/date) → Timeline (grouped Today/This Week/Earlier) → Memory Card detail (on tap) |
| Hierarchy | Timeline is primary; filters are secondary, collapsed by default on mobile |
| Spacing | `space/4` between entries |
| Responsive Grid | Single column at every breakpoint |
| Navigation | Reachable from Settings, Dashboard, Companion (tap-through) |
| Components | Timeline, Memory Card (Full variant), Chip (filters), Search Box |
| Loading | Standard skeleton, Timeline shape |
| Skeleton | Timeline-shaped placeholder entries |
| Error | Degrade to cached/last-known state, clearly marked as such if stale |
| Empty | "We're just getting to know each other — say hello whenever you're ready" |
| Accessibility | Full text-equivalent per Memory Card, not just visual accent |
| Animation | Standard list reveal on scroll |
| Developer Notes | Deletion here is immediate at the query layer — verify no stale cached Memory Card remains visible post-delete on any device |
| Edge Cases | At 1000+ memories, retrieval-ranking (not pagination alone) keeps the visible set relevant — infinite unfiltered scroll is not an acceptable fallback |

---

## Journal / Reflection

**Purpose**: a quiet, private space where writing itself produces clarity. **User Story**: as a user, I want to write without being watched or interrupted.

| Field | Spec |
|---|---|
| Layout | Composer (Textarea, FIGMA-03) as the primary focus; entry list below, collapsed/secondary |
| Sections | Composer (optional single prompt line above it) → Reflection Card (rare, post-save) → past entries list |
| Hierarchy | Composer dominates the screen; no competing chrome |
| Spacing | `space/6` above composer, `space/3` between list entries |
| Responsive Grid | Single quiet column at every breakpoint |
| Navigation | Reachable from Dashboard, Companion prompt, direct nav |
| Components | Textarea, Reflection Card, Journal Entry (list item) |
| Loading | Entirely invisible (autosave — no loading state ever shown to the user for saving) |
| Skeleton | Simple list-shape skeleton for past entries only |
| Error | Draft always recoverable — verify no failure path can discard unsaved text |
| Empty | "Write your first entry — there's no wrong way to start" |
| Accessibility | Full resize/zoom/screen-reader support in the writing surface |
| Animation | None during typing — zero motion anywhere near the composer while focused |
| Developer Notes | Reflection Card's most common state is **absent** — do not default every mockup/demo state to showing one |
| Edge Cases | Offline writing works natively (local-first draft); sync happens silently on reconnect |

---

## Reports

**Purpose**: periodic narrative synthesis. **User Story**: as a long-tenured user, I want to see how I've changed.

| Field | Spec |
|---|---|
| Layout | Overview list → individual report (progressive sectioned reveal) → Deep Dive (evidence trail) |
| Sections | Report list (Report Card grid/list) → narrative body → closing Companion question → Deep Dive link |
| Hierarchy | Book-like, single reading column — this is the most text-forward screen in the product |
| Spacing | Generous line-height, `space/8` between narrative sections |
| Responsive Grid | Capped 720px reading column on desktop, full-width margin on mobile |
| Navigation | Reachable from Dashboard notice, Notifications |
| Components | Report Card, Timeline, AI Message (narrative voice, `type/companion-voice`) |
| Loading | Labeled, progressive, sectioned reveal (`motion/report` token) |
| Skeleton | Section-shaped skeleton per narrative block during progressive load |
| Error | Queue and retry — never display a partial/degraded narrative |
| Empty | "Your first Report will appear once we've gotten to know you a bit" — explicitly no countdown or ETA |
| Accessibility | Full screen-reader support for narrative and the full Deep Dive evidence trail |
| Animation | Sections animate in sequentially, `motion/report` |
| Developer Notes | Every visible narrative sentence must have a corresponding evidence-trail entry reachable via Deep Dive — verify this holds for every report type, not just Monthly Reflection |
| Edge Cases | A report touching a difficult period is worded with explicit compassion — QA copy review, not just visual QA, required before any Report template ships |

---

## Discovery — Tarot

**Purpose**: low-friction daily reflective ritual. **User Story**: as a user, I want a quick, meaningful card pull connected to my life.

| Field | Spec |
|---|---|
| Layout | Full-width card reveal, interpretation text below |
| Sections | Draw/shuffle (brief) → Reveal → traditional meaning (collapsed) → personalized interpretation → closing question → Companion bridge |
| Hierarchy | The card art is the visual anchor; text follows |
| Spacing | `space/6` between reveal and interpretation |
| Responsive Grid | Full-width reveal on mobile, constrained/centered on desktop |
| Navigation | Reachable from Dashboard, Companion offer, direct nav (Discovery tabs) |
| Components | Discovery Card (`system=Tarot`), AI Message (bridge) |
| Loading | `motion/deliberate` reveal timing |
| Skeleton | Card-back placeholder during shuffle |
| Error | Falls back to static traditional meaning if AI interpretation fails |
| Empty | First-visit variant offers a single low-pressure suggestion |
| Accessibility | Descriptive alt text conveying actual card symbolism |
| Animation | The single slowest, most deliberate animation moment on this screen (card flip/settle) |
| Developer Notes | No re-draw affordance for the Daily Draw — one card per day, by design |
| Edge Cases | Repeated identical questions get a gentle acknowledgment of the recurrence, not a mechanically identical re-interpretation |

---

## Discovery — Natal Chart

**Purpose**: deep, durable self-discovery map. **User Story**: as a user, I want a rich identity map I can return to for years.

| Field | Spec |
|---|---|
| Layout | Overview first, progressive disclosure into deeper sections |
| Sections | Chart Overview → Planets/Houses/Signs → Aspects/Identity Themes → Deep Dive |
| Hierarchy | Overview is the entry point every time — technical Aspects/Deep Dive are the furthest, most optional layer |
| Spacing | `space/6` between major sections |
| Responsive Grid | Chart wheel scales down on mobile without losing the full accessible text-equivalent structure |
| Navigation | Reachable from Dashboard, Companion offer, direct nav |
| Components | Discovery Card (`system=NatalChart`), Accordion (Deep Dive), Calendar (birth data entry, Picker variant) |
| Loading | Slightly extended `motion/deliberate` for first-ever chart generation specifically (a more significant one-time moment than a daily Tarot pull) |
| Skeleton | Chart-wheel-shaped skeleton |
| Error | Birth-time-missing state clearly labels which sections (Houses/Ascendant) are unavailable, without blocking the rest |
| Empty | N/A (chart either exists or birth-data entry is shown) |
| Accessibility | Full text/tabular equivalent of the chart wheel — never image-only |
| Animation | Extended reveal for first generation only; standard timing for all subsequent navigation |
| Developer Notes | Chart calculation is deterministic backend computation — this screen never shows an AI-generated placeholder chart |
| Edge Cases | Birth-data correction regenerates the chart and updates dependent memory via the standard Update mechanism, never leaves stale Identity memory behind |

---

## Discovery — Eastern Horoscope

**Purpose**: seasonal, culturally-grounded reflection. **User Story**: as a user, I want to understand this year's themes.

| Field | Spec |
|---|---|
| Layout | Overview → Animal Sign/Elements/Year Energy → life-domain sections → Deep Dive |
| Sections | Horoscope Overview → Animal Sign → Five Elements → Year Energy → Seasonal/Growth/Relationships/Career/Health Reflection → Annual Reflection → Deep Dive |
| Hierarchy | Mirrors Natal Chart's progressive-disclosure structure |
| Spacing | Matches Natal Chart |
| Responsive Grid | Elements/animal-year visualization scales down cleanly on mobile |
| Navigation | Reachable from Dashboard, Companion offer, direct nav |
| Components | Discovery Card (`system=EasternHoroscope`), Accordion |
| Loading | Standard reveal (calendrical calculation is near-instant) |
| Skeleton | Profile-shaped skeleton |
| Error | Falls back to static traditional meaning per section |
| Empty | N/A |
| Accessibility | Full text-equivalent for the visualization |
| Animation | Standard timing throughout — no extended first-generation reveal (annual content updates yearly, lower one-time significance than Natal Chart) |
| Developer Notes | No lucky-number/lucky-color content exists anywhere in this screen's component tree — verify this explicitly in content QA |
| Edge Cases | Lunar New Year calendar-boundary dates handled correctly by the backend calendar engine — verify visually with test dates near the boundary |

---

## Discovery — Numerology

**Purpose**: pattern-based reflective lens. **User Story**: as a user, I want a fast, meaningful reflection from my name and birthdate.

| Field | Spec |
|---|---|
| Layout | Overview → individual core numbers → Current Cycles/Growth Themes → Reflection Summary → Deep Dive |
| Sections | Overview → Life Path → Expression → Soul Urge → Personality → Birthday Number → Current Cycles → Growth Themes → Life Domains → Reflection Summary → Deep Dive |
| Hierarchy | Minimal, typography-led — the simplest visual treatment of the four Discovery systems |
| Spacing | Matches Natal Chart's progressive structure |
| Responsive Grid | Numbers rendered in `type/data-mono` at every breakpoint |
| Navigation | Reachable from Dashboard, Companion offer, direct nav |
| Components | Discovery Card (`system=Numerology`), Accordion |
| Loading | Near-instant, minimal loading state |
| Skeleton | Simple number-shape skeleton |
| Error | Falls back to static traditional meaning per number |
| Empty | N/A |
| Accessibility | Inherently text-based — simpler accessibility requirement than the visual-wheel systems |
| Animation | Standard timing throughout — no extended reveal |
| Developer Notes | **Zero personality-typing language** ("you are a 7") anywhere in this screen's copy — this is the single most aggressively QA'd content rule for this specific screen |
| Edge Cases | Non-Latin-script or diacritic-containing birth names require verified transliteration handling before number calculation |

---

**Continue to FIGMA-07.**
