# MODULE 4 — PRODUCT EXPERIENCE DESIGN SYSTEM

---

## 1. Executive Summary

**Purpose**
Modules 1–3 established why the product exists, how the business runs, and how it's structured. Module 4 defines how it looks, feels, behaves, and speaks — the complete experience system that Design and Frontend build directly from, and that every future screen must pass through without deviation.

**Scope**
Experience principles, design language, the full visual system (color/type/spacing/tokens), the component library, layout system, per-screen architecture, interaction and motion systems, the AI experience system, content/writing rules, accessibility, error and loading experience, empty states, design tokens, and frontend composition rules.

**Relationship with previous modules**
Every visual and interaction choice below is a direct execution of Module 1's Design Philosophy (calm, warm, unhurried; wise-friend personality; never mystical-performative; never urgency-driven) and Guardrails (no dark patterns, no dependency-creating mechanics), applied to the concrete structure Module 3 already fixed (three-System IA, two-tap navigation, Core Product Loop-based nav). This module introduces no new strategic decisions — only the concrete form of decisions already made.

---

## 2. Experience Principles

| Principle | What it means in practice | Why |
|---|---|---|
| **Calm First** | No animation, color, or copy competes for urgent attention. Nothing pulses, flashes, or auto-plays sound. | Module 1's brand emotion is "dim evening light," not a dashboard — urgency contradicts the core emotional register the entire strategy depends on. |
| **Memory First** | Every screen that can surface a relevant past memory does so by default, not behind a tap. | Directly implements Module 1's Product Principle (build only what creates, uses, or improves memory) at the pixel level. |
| **AI First** | The Companion's presence (an entry point, a subtle reference) is never more than one tap away from any screen. | Module 3 fixed this structurally (Section 15, "Companion always reachable"); this module makes it visually true, not just navigationally true. |
| **Reflection First** | Interfaces default to open-ended, exploratory framing ("what comes to mind?") over closed, transactional framing ("select an option"). | Reinforces Module 1's Curiosity value — the product invites meaning-making, it doesn't hand down conclusions. |
| **Consistency** | One component means one thing everywhere it appears; a Memory Card never looks different in Dashboard vs. Reports. | Inconsistency reads as untrustworthy in a product whose entire value proposition is "we keep track of you carefully." |
| **Progressive Disclosure** | Complexity (chart details, deep Report data) reveals only as it becomes relevant, never all at once. | Matches Module 3's progressive-disclosure IA rule and prevents the "cluttered mystical" look explicitly rejected in Module 1. |
| **Trust Before Delight** | A feature that would be delightful but slightly deceptive (e.g., a "typing…" indicator implying more thought than occurred) is rejected even if it tests well. | Directly enforces the Decision Framework: Trust outranks Engagement, full stop, even at the level of a loading-state animation. |

---

## 3. Design Language

**Brand Emotion**: dusk, not day. The emotional reference point is the specific quality of light at the end of a day — warm, low-contrast, unhurried, safe. Not midnight (too heavy), not noon (too bright/urgent).

**Personality**: a wise, curious friend who has time for you. Confident in what it knows, honest about what it doesn't, never performing mysticism and never clinical.

**Visual Tone**: warm-neutral darks as the primary canvas, with restrained, meaningful color used only to mark specific moments (an Insight, a new memory, a gentle warning) — never as general decoration.

**Interaction Tone**: deliberate pacing over instant snap. Small, intentional delays (a card settling before it's readable, a Companion response that streams rather than appears instantly) signal consideration, not sluggishness — the product is not competing on speed.

**Writing Tone**: plain, warm, specific. Never mystical-flowery ("the cosmos whispers..."), never clinical ("your analysis is ready"), never hype-driven ("You won't believe what your chart says!").

**AI Tone**: the Companion writes the way a thoughtful friend texts — short sentences, real curiosity, no therapy-speak, no fortune-teller cadence. It asks one genuine question more often than it makes one confident statement.

**Motion Tone**: organic, slow, physical — things drift, settle, and unfurl rather than slide and snap. Motion never signals urgency (no bouncing, no attention-grabbing pulses).

**Why this direction, specifically, and not the default**: the two most common "AI product" visual defaults right now are (a) warm cream background with a high-contrast serif and a terracotta accent, and (b) near-black background with a single neon accent. Both are rejected here — (a) because the terracotta-on-cream combination reads as generic AI-product default rather than a considered choice, and because a bright cream canvas contradicts the "dusk" brand emotion; (b) because a neon accent on near-black reads as tech/gaming, not reflective and warm. This system instead takes its signature from **dusk itself**: a deep indigo-plum canvas (not black) with a warm, muted gold accent (not neon, not terracotta) reserved specifically for Insight moments — described fully in Section 4.

---

## 4. Visual Design System

**Color Philosophy**: color is meaning, not decoration. The base palette is almost entirely neutral (dusk-toned darks and warm off-whites); the only saturated color in the entire system is the gold Insight accent, and it appears *only* when something memory-derived and genuinely meaningful is being surfaced — never on a generic button, never for decoration. This scarcity is deliberate: if gold appeared everywhere, it would stop meaning "the Companion just showed you something true about yourself."

**Color Tokens**

| Token | Hex | Usage |
|---|---|---|
| `color.bg.canvas` | `#161428` | Primary app background — deep indigo-plum "dusk," not black |
| `color.bg.surface` | `#1F1C36` | Card/panel background, one step lighter than canvas |
| `color.bg.surface-raised` | `#2A2645` | Modals, sheets, elevated surfaces |
| `color.text.primary` | `#F1ECE4` | Warm off-white, primary text — never stark `#FFFFFF` |
| `color.text.secondary` | `#B7AFC9` | Muted lavender-grey, secondary/meta text |
| `color.text.disabled` | `#6E6785` | Disabled/placeholder text |
| `color.accent.insight` | `#E3B368` | Muted gold — reserved exclusively for Insight moments, memory-callouts, and Premium's felt-value moment |
| `color.accent.reflection` | `#9A7FA6` | Dusty plum — Journal and reflective-prompt accents |
| `color.accent.trust` | `#7E9787` | Muted sage green — confirmation, saved, synced states |
| `color.accent.caution` | `#C17B6B` | Muted rust — warnings, never bright red (calm-first: even errors stay warm) |
| `color.border.subtle` | `#332F52` | Default hairline borders |
| `color.border.focus` | `#E3B368` | Keyboard focus ring — reuses the Insight gold, so focus states feel considered rather than purely functional |
| `color.bg.canvas.light` | `#F5F2F6` | Light-mode canvas — cool lavender-white, deliberately not a cream/parchment tone, to avoid the cream+terracotta default cluster |
| `color.bg.surface.light` | `#FFFFFF` | Light-mode card surface |
| `color.text.primary.light` | `#211D33` | Light-mode primary text |

**Typography**

| Role | Typeface | Why |
|---|---|---|
| Display (headlines, Companion's spoken voice) | **Fraunces** (serif, warm, humanist, variable optical size) | Carries warmth and personality without reading as "mystical fortune-teller serif" — its soft curves fit a wise-friend, not a tarot-parlor, personality |
| Body / UI text | **Karla** (humanist grotesque sans) | Clean and highly legible at small sizes, warmer than a purely geometric grotesque, avoids the overused feel of the most common default UI sans |
| Utility / data (chart degrees, numerology numbers, timestamps) | **IBM Plex Mono** | Gives precise, structured data (a chart placement, a life-path number) a quiet technical credibility distinct from the emotional/conversational type roles |

**Type Scale** (rem, 16px base)
`display-xl 3.5` / `display-lg 2.5` / `heading-lg 1.75` / `heading-md 1.375` / `body-lg 1.125` / `body-md 1` / `body-sm 0.875` / `caption 0.75`

**Spacing** (4px base unit): `space-1 4px` · `space-2 8px` · `space-3 12px` · `space-4 16px` · `space-6 24px` · `space-8 32px` · `space-12 48px` · `space-16 64px`. All spacing is a multiple of 4px — no arbitrary values — to keep the calm, considered visual rhythm consistent across every screen.

**Radius**: `radius-sm 8px` (chips, badges) · `radius-md 12px` (buttons, inputs) · `radius-lg 20px` (cards) · `radius-xl 28px` (sheets, modals). Consistently soft, rounded — never sharp/zero-radius (which would read as the "broadsheet/newspaper" default aesthetic, wrong register for this brand) and never pill-shaped everywhere (which reads as generic consumer-app default).

**Elevation**: elevation is expressed through subtle background-lightness steps (canvas → surface → surface-raised, per the color tokens) rather than heavy drop-shadows — shadows are used sparingly (`shadow-sm` only, a soft 8px blur at 20% opacity) since heavy shadow stacks contradict the calm, flat-dusk visual tone.

**Borders**: 1px hairlines in `color.border.subtle`, used to separate list items and card edges — never used decoratively, never doubled.

**Icons**: a single rounded-stroke icon set (2px stroke, rounded caps/joins) matching the soft radius system — no mixed icon styles across the product.

**Illustrations**: abstract, celestial, line-based (constellations, soft gradients, drifting particles) — reused as the platform's one recurring illustrative motif (see Section 3's rejection of literal fortune-teller iconography, and Section 9's signature motion element).

**Photography**: not used in core product UI (Companion, Journal, Discovery). Reserved only for Landing/marketing surfaces, and even there restricted to natural, unposed imagery — never stock "mystical" photography (crystal balls, tarot spreads lit dramatically).

**Empty States**: covered fully in Section 15; visually, always paired with the constellation illustration motif at low density (a few soft points, not a full starfield) to avoid feeling like a "nothing here" dead end.

**Charts**: data visualizations (Report timelines, natal chart wheel) use the neutral palette plus the Insight gold accent only for the single most relevant highlighted data point — never a multi-color chart palette, which would contradict the color-scarcity philosophy.

**Cards**: the base surface unit for nearly everything (see Component System, Section 5) — `radius-lg`, `surface` background, hairline border, no shadow by default (shadow only on drag/lift states).

**Widgets**: Dashboard modules (today's card, Companion entry, streak-neutral tracker) are all built from the same base Card component with different internal content — no bespoke widget shapes.

**Avatars**: user avatars are simple initials-on-color-token circles by default (no forced photo upload); the Companion has no anthropomorphic avatar/face — represented instead by a small, abstract constellation glyph, deliberately avoiding an assistant "mascot" look that would undercut the wise-friend-not-character positioning.

---

## 5. Component System

| Component | Purpose | Variants | Usage Rules | Do | Don't |
|---|---|---|---|---|---|
| **Buttons** | Primary user actions | Primary (filled, insight-gold text-on-surface for high-commitment actions only), Secondary (outline), Ghost (text-only, most common) | Primary variant reserved for genuinely significant actions (start a reading, save a journal entry) — not overused | Use Ghost for most in-flow actions | Don't use Primary for every button on a screen — it must stay rare to stay meaningful |
| **Inputs** | Text/data entry | Single-line, multi-line (Journal), date/time (birth data) | Labels always visible above field (never placeholder-only labels) | Show helper text for anything non-obvious (e.g., why exact birth time matters) | Don't use placeholder text as the only label — it disappears on focus and harms accessibility |
| **Cards** | Base content container | Standard, Memory Card, Insight Card, Report Card, Notification Card (below) | `radius-lg`, `surface` background | Keep one clear piece of content per card | Don't stack multiple unrelated CTAs on one card |
| **Dialogs** | Interrupting, high-attention decisions | Confirm, Destructive (e.g., delete memory) | Reserved for genuinely consequential actions only | Use plain, specific language ("Delete this memory permanently?") | Don't use a dialog for routine confirmations — that trains users to blindly dismiss dialogs, weakening them for the moments that matter |
| **Bottom Sheets** | Mobile-first secondary content/actions | Standard, Draggable-expand (Journal quick-entry) | Primary mobile pattern for anything that would be a modal on desktop | Use for Quick Actions (Module 3, Section 4) | Don't nest a sheet inside a sheet |
| **Drawers** | Desktop secondary panels (Settings, Search results) | Left (nav-adjacent), Right (context/detail) | Right drawer used for Context Navigation (Module 3) | Keep drawer content scoped to one task | Don't use for primary navigation — that's Global Nav's job |
| **Tooltips** | Brief clarifying info | Standard, Icon-triggered | Used sparingly — if something needs a tooltip to be understood, consider redesigning it first | Use for genuinely non-obvious icons only | Don't use tooltips to explain core interaction patterns — that's a content-design failure, not a tooltip opportunity |
| **Badges** | Small status indicators | Neutral, Insight (gold), New | Insight badge reserved exclusively for memory-derived content, matching color-scarcity rule | Use New sparingly (Reports ready, not every minor update) | Don't badge routine app updates — badge fatigue erodes the meaning of the Insight badge specifically |
| **Chips** | Selectable/filter tags | Standard, Removable | Used in Discovery tabs (Module 3, Secondary Nav) | Keep to single-line, short labels | Don't use for anything requiring multi-line text |
| **Tabs** | Peer-level navigation within a module | Segmented (Discovery System tabs) | Max 4 tabs per row, matching optional-dependency peer relationship (Module 3) | Use for genuinely equal-weight peer content | Don't use tabs to hide a hierarchy — that's a Drawer or nested-screen problem |
| **Accordions** | Progressive disclosure of dense content | Standard | Used in Natal Chart detail, Settings advanced options | Default collapsed for anything non-essential | Don't default-expand more than one section at a time |
| **Lists** | Sequential content (Journal history, Conversation history) | Standard, Timeline (with connecting line) | Timeline variant used specifically for Memory-adjacent history to visually reinforce continuity | Group by relative time (Today / This Week / Earlier) | Don't use infinite unstyled scroll without temporal grouping — undermines the "considered" feel |
| **Tables** | Structured comparative data (rare — mostly Admin) | Standard | Reserved almost entirely for Admin module | Use only where genuinely tabular data exists | Don't use tables in user-facing Companion/Journal/Reports surfaces — too clinical for this brand |
| **Progress** | Loading/multi-step indication | Linear, Circular (AI thinking) | Circular used for AI Thinking state (Section 8/10) | Always paired with a specific, honest label, never a generic spinner alone | Don't imply false precision (e.g., a percentage bar for something with no real "percent complete") |
| **Timeline** | Chronological memory/insight display | Standard (Reports), Compact (Dashboard) | The core visual metaphor for "memory over time" | Use consistently across Reports and Memory-adjacent surfaces | Don't reinvent the timeline visual per module — one shared component (Module 3, Section 10, Shared Components) |
| **Memory Card** | Surfaces a specific stored memory | Compact (Dashboard/Context Nav), Full (Search result, Report) | Always shows: what was remembered, when, and (if applicable) why it's relevant now | Keep language plain ("You mentioned starting a new job on March 3") | Don't paraphrase in a way that could feel like the AI is guessing rather than recalling accurately |
| **Insight Card** | Surfaces a cross-time pattern | Standard | Uses the Insight gold accent — the only card type that does by default | Frame as an observation to explore ("noticed a pattern — want to look at it together?"), per AI Philosophy | Don't state a pattern with false confidence or clinical certainty |
| **Report Card** | Summary tile linking to a full Report | Standard, Locked (free-tier preview) | Locked variant shows genuine preview content, not just a blurred teaser | Show real (if partial) value even when locked | Don't fully obscure content purely to create FOMO — Guardrail violation |
| **Notification Card** | In-app notification list item | Memory, Journal, Companion, Reports, System (per Module 3, Section 13) | Each type maps to its own icon/accent per Section 4 | Always specific, never generic ("come back!") | Don't batch high-priority (Memory/System) notifications visually with low-priority (Community) ones |
| **AI Messages** | Companion chat bubbles | User message, Companion message (streaming), Companion message (with Memory Card attached) | Companion messages use Display typeface (Fraunces) at body size to feel distinctly "spoken," user messages use body Karla | Stream Companion responses (Section 8/10) | Don't use a bot-like avatar/icon on every message — repetitive and undercuts wise-friend tone |
| **Journal Blocks** | Freeform entry unit | Draft, Saved, Companion-annotated (a subtle margin note where the Companion referenced it later) | Companion-annotated variant is a direct visual proof of memory continuity | Keep the writing surface visually quiet — no heavy chrome around the text area | Don't add AI suggestions inline while the user is actively typing — that interrupts reflection, contradicting Reflection First |

---

## 6. Layout System

```
Desktop (≥1280px)          Tablet (768–1279px)         Mobile (<768px)
┌───┬─────────────┐        ┌──────────────────┐        ┌────────────┐
│Nav│   Content    │        │   Top Nav Bar     │        │  Top Bar   │
│   │   (max 720px │        ├──────────────────┤        ├────────────┤
│   │   centered)  │        │                   │        │            │
│   │              │        │     Content       │        │  Content   │
│   │              │        │   (fluid, padded) │        │  (fluid)   │
│   │              │        │                   │        │            │
└───┴─────────────┘        └──────────────────┘        ├────────────┤
                                                          │ Bottom Nav │
                                                          └────────────┘
```

**Desktop**: persistent left sidebar (Global Nav from Module 3, Section 4), content column capped at 720px and centered for reading-heavy surfaces (Journal, Reports, Companion) — an uncapped full-bleed content area would undercut the calm, book-like reading feel intended for reflective content.

**Tablet**: sidebar collapses to a top nav bar; content becomes fluid with generous padding (`space-8`) rather than a fixed max-width, since tablet viewport variance is wide.

**Mobile**: bottom navigation (thumb-reachable, matching Module 3's Global Nav items), top bar reserved for screen title and context actions (search, settings) only.

**Sidebar**: desktop-only, houses the five Global Nav destinations (Module 3) plus a persistent, subtle Companion-availability indicator (never a notification-badge-style unread count — that would introduce urgency pressure).

**Content Width**: 720px max for text-heavy/reflective content; full-width (minus padding) for Dashboard grids and Discovery visual content (chart wheel, card spreads).

**Responsive Rules**: components resize via the same token scale at every breakpoint — no separate "mobile-only" component variants beyond layout (Bottom Sheet replacing Drawer/Modal, per Component System).

**Safe Areas**: bottom navigation and any floating action (Companion's "+ New Topic") respect device safe-area insets; nothing interactive sits within 8px of a device's rounded corners or home-indicator zone.

---

## 7. Screen Architecture

| Screen | Purpose | Layout Pattern | Priority | Component Hierarchy |
|---|---|---|---|---|
| **Landing** | Correctly frame the Companion-relationship positioning before signup | Single-column, hero + brand statement, no dashboard preview clutter | P0 | Hero text (Fraunces display) → single CTA button → brief "We are NOT / We ARE" section (Module 1) |
| **Dashboard** | Daily entry ritual | Card grid: today's Discovery card, Companion entry widget, Journal quick-action | P0 | Greeting (memory-aware if available) → Quick Action cards → Context Nav to Reports if ready |
| **Discovery** (Tarot/Chart/Horoscope/Numerology) | Low-friction ritual entry | Full-width visual (card reveal, chart wheel) + reflection prompt below | P0 | Visual reveal → interpretation text → "reflect with Companion" CTA |
| **Companion** | Core relationship surface | Chat thread, Memory Cards inline, input at bottom | P0 | Message list (Timeline component) → streaming response → input bar → floating "+ New Topic" |
| **Journal** | Freeform disclosure | Single quiet writing surface, entry list below | P0 | Entry composer (Journal Block, draft) → saved entries list, grouped by time |
| **Reports** | Periodic synthesis | Timeline component + narrative sections | P1 | Timeline (Insight moments) → narrative text blocks → Companion "discuss this" CTA |
| **Profile** | Identity/discovery-system data (birth data, chart, life path) | Sectioned accordion | P1 | Summary header → accordion sections per Discovery system |
| **Settings** | Account, privacy, memory controls | Sectioned list | P1 | Account → Privacy/Memory controls (export/delete, prominent) → Notifications preferences |
| **Community** | Anonymized pattern browsing | Card feed, no profiles | P2 | Pattern cards (never user-attributed) grouped by theme |
| **Premium** | Upgrade surface, only ever reached contextually | Single-focus, reuses Report/Insight visual language (Module 3, Shared Components) | P1 | Felt-value recap (an actual Insight/Memory Card the user just experienced) → plan details → single CTA |
| **Admin** | Internal trust & safety, content curation | Dense data tables, dashboards | Internal | Not subject to consumer brand visual softness — clarity and density prioritized over calm aesthetic, since audience is internal staff, not end users |

---

## 8. Interaction System

**Hover** (desktop): subtle background lightness shift only (no color hue change, no scale/bounce) — signals interactivity without theatrics.

**Click/Tap**: a soft, single-step press-state (slight opacity dip), release triggers action — no double-confirmation micro-animations for routine actions.

**Touch**: minimum 44×44px targets throughout (Section 12); swipe-to-dismiss supported on Notification Cards and Bottom Sheets.

**Keyboard**: full tab-order support; Enter submits the focused primary action; Escape closes any Dialog/Sheet/Drawer without penalty (never trap focus, per Module 3 Guardrail).

**Focus**: visible focus ring using `color.border.focus` (Insight gold) on every interactive element — never suppressed for aesthetic reasons.

**Transitions**: 200–300ms ease-out for most UI transitions (menus, sheets); slower, 500–800ms organic easing reserved specifically for memory/insight-related reveals (Section 9).

**Gestures**: swipe between Discovery tabs (mirrors Module 3's segmented tab structure); pull-to-refresh on Dashboard reserved for genuine data refresh, not decorative.

**Scrolling**: momentum-based native scroll everywhere; no scroll-jacking, no forced scroll-triggered animations that block reading pace (contradicts Reflection First).

**Selection**: text selection always enabled in Journal and Companion messages (a user may want to copy something they or the Companion said) — never disabled for "protection" reasons that would frustrate legitimate use.

**Streaming**: Companion responses stream token-by-token at a natural reading pace (not artificially slowed for effect, not instant-dump) — the pace should approximate how quickly a thoughtful person would type, not a special effect.

**AI Thinking**: a quiet, labeled state ("thinking about what you shared…") using the circular Progress component — never a generic three-dot ellipsis with no label, which reads as evasive rather than considered.

---

## 9. Motion System

| Moment | Duration | Curve | Behavior |
|---|---|---|---|
| Standard UI transition (menu open, tab switch) | 200–250ms | ease-out | Snappy but not abrupt |
| Card Reveal (Tarot pull, chart render) | 600–900ms | custom organic ease (slow-start, gentle-settle) | The single slowest, most deliberate animation in the product — this pacing is what signals "this moment deserves attention," matching the Ritual Seeker persona's need for the ritual to feel legitimate |
| Memory Recall (a Memory Card appearing in a Companion message) | 400ms | ease-in-out | A gentle fade-and-rise, distinct from a standard message appearing, so recall visually reads as "different" from ordinary conversation |
| Insight Animation | 500ms | ease-in-out, with a subtle gold shimmer only on first appearance | Reserved exclusively for genuine Insight Cards — reinforces color-scarcity rule from Section 4 |
| Report Generation | Progressive reveal, ~1.5–2s total, sectioned | staged ease-out per section | Sections of the Report animate in sequentially (not all at once) to mirror the feeling of a synthesis being assembled thoughtfully, not instantly rendered |
| Success state | 250ms | ease-out | Small, quiet checkmark or sage-green accent pulse — one pulse only, never repeating |
| Error state | 250ms | ease-out | A gentle shake is explicitly avoided (reads as alarm); instead a calm color shift to `color.accent.caution` with clear copy |
| Navigation | 250ms | ease-in-out | Standard slide/fade depending on platform convention (iOS push vs. Android/web fade) |

**Signature motion element — "The Constellation Thread"**: a thin, softly glowing line that traces between two or more points whenever the product visually connects one memory to another (an Insight Card forming, a Report's timeline linking entries). This is the one recurring, ownable motion signature of the entire product — everywhere else, motion stays quiet and functional; this single motif is allowed to feel special, because it is the literal visual metaphor for the product's core promise (connecting memory across time).

**Motion Principles**: (1) motion never implies urgency; (2) motion duration scales with significance — routine UI is fast, memory/insight moments are deliberately slower; (3) the constellation-thread motif is reserved and never reused for decoration; (4) all motion respects reduced-motion settings (Section 12) by degrading to instant or minimal-fade equivalents, never omitted entirely (state changes must still be perceivable).

---

## 10. AI Experience System

**Streaming Responses**: token-by-token at natural reading pace (Section 8) — never instant-dump, never artificially throttled for dramatic effect.

**Thinking States**: labeled, honest, brief ("thinking about what you shared…", "connecting this to your last few entries…") — the label should reflect, in plain terms, what's actually happening (retrieval vs. generation), never a decorative placeholder phrase.

**Typing**: no separate "typing…" indicator distinct from the labeled Thinking state — one honest state covers both, since a fake secondary "typing" indicator after "thinking" would imply more sequential deliberation than actually occurs (Trust Before Delight).

**Memory Recall**: always visually attributed via a Memory Card (Section 5) inline in the message — never silently woven into prose in a way the user can't distinguish from generation. This is a hard rule: recalled memory must be visually distinguishable from freshly generated reasoning, because that distinction is what makes the Companion's memory claims verifiable rather than just asserted.

**Source References**: when the Companion references a specific Discovery-system reading or Journal entry, the reference is tappable (Context Navigation, Module 3) — the user can always jump to the original source.

**Confidence**: the Companion expresses uncertainty in plain language ("this is just one way to read it…") rather than a numeric confidence score or badge — a percentage would imply false quantitative precision about an inherently interpretive framework (AI Philosophy rule 6).

**Suggestions**: offered as soft, skippable chips below a message (e.g., "want to write about this?"), never as forced next-steps blocking the input field.

**Follow-up Questions**: the Companion is designed to ask more than it concludes (Curiosity value) — a response that only states a conclusion without an invitation to reflect further should be treated as an incomplete AI Experience, not a finished one.

**AI Actions**: any action the Companion can take on the user's behalf (creating a Journal draft, surfacing a Discovery suggestion) requires explicit user confirmation before it's saved — the AI drafts, the user decides, matching the never-direct-Memory-write rule from Module 3, Section 9.

**AI Limitations**: the Companion states plainly, without excessive apology, when something is outside its scope (a crisis-adjacent disclosure, a request for literal predictive certainty) and redirects per AI Philosophy rule 8 — the tone here is calm and clear, not clinical, not alarmed.

**How AI should feel**: like being listened to by someone with a good memory and no agenda — never like being "processed," "analyzed," or "sold to." Every rule above exists to protect that specific feeling.

---

## 11. Content Design System

**Voice**: warm, plain, specific — a wise friend, not a brochure and not a mystic.

**Tone**: calm and curious by default; softer and slower in moments of disclosure; never celebratory-hype even for good news (no exclamation-point-heavy copy).

**Microcopy rules**: buttons name the exact action taken ("Save entry," not "Submit"); the same verb is reused consistently through a flow (a "Save entry" button produces a "Entry saved" confirmation, never "Success!").

**Dialogs**: state the consequence plainly ("This will permanently delete this memory. This can't be undone.") — no persuasive language talking the user out of their own choice.

**Errors**: state what happened and what to do next, in the interface's voice, never apologetic ("Couldn't save your entry. Check your connection and try again.") — never blame the user, never over-apologize either.

**Warnings**: calm, specific, non-alarmist ("Deleting your account also deletes your memory graph. Export first if you'd like to keep a copy.").

**Notifications**: always specific to a real memory-based reason (Module 3, Section 13) — "Three weeks ago you mentioned starting a new job — curious how it's going?" not "We miss you!"

**Onboarding**: sets expectations honestly about current memory scope (Module 1's Weakness-3 mitigation) — "I'll remember what we talk about today. Come back tomorrow and I'll remember more."

**Empty States**: framed as an invitation, not a deficiency (Section 15) — "Nothing here yet — this is where your reflections will start to add up."

**Premium**: sells the specific, already-felt value ("Keep this thread going — Premium remembers across every conversation"), never generic feature-list marketing copy, and never urgency ("limited time!").

**Companion**: first-person, warm, asks genuine questions, never uses therapy-clinical phrasing ("How does that make you feel?" is avoided in favor of plainer, more specific prompts like "What's that been like for you?").

**Journal**: prompts are specific and drawn from actual stored context when available ("You mentioned feeling uncertain about work last week — has anything shifted?"), generic prompts ("What's on your mind today?") only used when no relevant memory yet exists.

**Reports**: narrative, not bulleted data-dump — written in the same first-person Companion voice, since a Report is the Companion's synthesis, not a separate analytics product.

---

## 12. Accessibility System

**Contrast**: all text/background pairs meet WCAG AA (4.5:1 body text, 3:1 large text) at minimum — verified per the specific dusk-toned palette above (e.g., `#F1ECE4` on `#161428` exceeds AA comfortably; the muted gold accent is checked separately against both dark and light surfaces before use as text color, and is restricted to large-text/icon use where contrast is marginal).

**Typography**: minimum 16px body text on mobile; user-adjustable text-size setting respected throughout, including inside Companion message bubbles.

**Keyboard**: full operability without a mouse/touch (Section 8); no keyboard traps in any Dialog/Sheet/Drawer.

**Screen Reader**: every icon-only control has an accessible label; Memory Cards and Insight Cards expose their full content (not just a visual gold accent) to screen readers, since the color-based meaning system (Section 4) must not be the only channel carrying that meaning.

**Motion Reduction**: `prefers-reduced-motion` disables the Constellation Thread animation and Card Reveal's slow easing in favor of an immediate, still-labeled state change — the meaning (something happened) is preserved even when the motion isn't.

**Touch Targets**: minimum 44×44px, consistent with Section 8.

**Accessibility Rules (summary)**: color is never the sole carrier of meaning; motion is always optional; every interactive element is keyboard- and screen-reader-operable; text is legible and resizable everywhere, including inside the AI Message and Journal Block components.

---

## 13. Error Experience

| Failure | Behavior | Recovery |
|---|---|---|
| **Offline** | A calm, persistent (not modal) banner: "You're offline — we'll save this once you're back." Journal drafts persist locally. | Auto-syncs on reconnect, confirms with a quiet Success state |
| **API Failure** | Specific, non-technical error copy; retry action offered inline | Retry button, no full-page reload required |
| **AI Timeout** | Companion message area shows "That took longer than expected — want to try again?" rather than a silent hang | Retry regenerates the response; prior user message is preserved, never lost |
| **Memory Failure** (write fails) | Silent retry attempted first (async pipeline, Module 3); if persistently failing, a quiet Settings-level notice, never a jarring in-conversation error, since the user's immediate experience (the conversation) shouldn't be interrupted by a backend/infrastructure concern | Automatic background retry; manual "Sync now" option in Settings |
| **Authentication Failure** | Clear, specific copy distinguishing wrong password vs. account-not-found vs. network issue | Direct path to password reset or support, never a generic "something went wrong" |
| **Payment Failure** | States the specific reason if known (card declined vs. network error), never blames the user | Retry with a different payment method offered inline, no forced restart of the whole Premium flow |
| **Report Failure** (generation fails) | "We couldn't put your Report together this time — we'll try again shortly," never implies the underlying memory was lost | Automatic retry; manual regenerate option after a short wait |

**Recovery Patterns (general)**: every error state preserves whatever user input or progress existed before the failure — nothing is silently discarded; every error names the specific problem rather than a generic catch-all message, consistent with Content Design rules (Section 11).

---

## 14. Loading Experience

**Skeleton**: used for Dashboard/Discovery/Reports initial load — shaped placeholders matching final content layout, in muted surface tones, no shimmer animation (shimmer reads as generic-template; a very subtle static-to-content cross-fade is used instead).

**Streaming**: Companion responses (Section 8/10) — the primary "loading" experience most users see most often, framed as thinking rather than waiting.

**Progressive Loading**: Reports load section-by-section (Section 9) rather than blocking on the full synthesis.

**Background Sync**: Memory writes happen invisibly (Module 3, async pipeline) — no user-facing loading state for this at all, since surfacing backend mechanics here would violate the "never expose system internals" content rule (Section 11, plain-terms writing).

**Memory Loading**: when the Companion is retrieving relevant memory before responding, this is folded into the single AI Thinking state (Section 10) — not a separate visible step, to avoid multiplying loading states beyond what's meaningful to a user.

**Report Generation**: the progressive, sectioned reveal described in Section 9.

**AI Thinking**: labeled circular progress (Section 8/10).

**Queue Waiting**: for genuinely long-running actions (e.g., a deep Credits-based synthesis action), an honest estimated-time label is shown rather than an indeterminate spinner alone.

---

## 15. Empty State System

| Screen | Emotion | Illustration | CTA |
|---|---|---|---|
| **No Memory yet** | Anticipation, not deficiency | Low-density constellation (a few soft points, room to grow) | "Start with today's card" or "Say hello to your Companion" |
| **No Journal entries** | Invitation | A single soft, open page motif | "Write your first entry — there's no wrong way to start" |
| **No Reports yet** | Patience, not lack | Constellation forming, not yet connected | "Your first Report appears once we've gotten to know you a bit" (no fixed countdown — avoids urgency/false-precision) |
| **No Notifications** | Calm, not empty | Simple soft-gradient field | No CTA needed — an empty notification list is a fine, unremarkable state |
| **No Community activity yet** | Quiet, optional | Soft constellation, muted | "Patterns from others will show up here as the community grows" — no pressure to participate |
| **No Search Results** | Helpful, not apologetic | None (text-only) | Plain restatement of query + a suggestion to try different words — never "no results found" alone with no next step |
| **No Premium (free tier)** | Neutral, informative, never guilt-based | None decorative — clean plan comparison only when the user actively navigates here | Clear, single "See what Premium adds" — never shown unprompted as a nag |
| **First Visit (Landing)** | Warm invitation | Full constellation motif at moderate density — the richest use of the illustration system, since this is the one place a slightly more expressive visual makes the first impression land | "Meet your Companion" |

---

## 16. Design Tokens

```json
{
  "color": {
    "bg": { "canvas": "#161428", "surface": "#1F1C36", "surfaceRaised": "#2A2645",
            "canvasLight": "#F5F2F6", "surfaceLight": "#FFFFFF" },
    "text": { "primary": "#F1ECE4", "secondary": "#B7AFC9", "disabled": "#6E6785",
              "primaryLight": "#211D33" },
    "accent": { "insight": "#E3B368", "reflection": "#9A7FA6",
                "trust": "#7E9787", "caution": "#C17B6B" },
    "border": { "subtle": "#332F52", "focus": "#E3B368" }
  },
  "typography": {
    "fontFamily": { "display": "Fraunces", "body": "Karla", "mono": "IBM Plex Mono" },
    "scale": {
      "displayXl": "3.5rem", "displayLg": "2.5rem",
      "headingLg": "1.75rem", "headingMd": "1.375rem",
      "bodyLg": "1.125rem", "bodyMd": "1rem", "bodySm": "0.875rem", "caption": "0.75rem"
    }
  },
  "spacing": {
    "1": "4px", "2": "8px", "3": "12px", "4": "16px",
    "6": "24px", "8": "32px", "12": "48px", "16": "64px"
  },
  "radius": { "sm": "8px", "md": "12px", "lg": "20px", "xl": "28px" },
  "elevation": { "shadowSm": "0 4px 12px rgba(0,0,0,0.2)" },
  "animation": {
    "durationFast": "200ms", "durationStandard": "250ms",
    "durationDeliberate": "600ms", "durationReport": "1500ms",
    "easeStandard": "ease-in-out", "easeOut": "ease-out",
    "easeOrganic": "cubic-bezier(0.22, 1, 0.36, 1)"
  },
  "zIndex": { "base": 0, "dropdown": 100, "drawer": 200, "sheet": 300, "modal": 400, "toast": 500 },
  "breakpoints": { "mobile": "0px", "tablet": "768px", "desktop": "1280px" }
}
```

---

## 17. Frontend Design Rules

**Reusable Components**: every component in Section 5 lives in a single shared library, consumed identically across web (Next.js) and any future native surface — no per-screen bespoke reimplementations of Card, Memory Card, or AI Message.

**Composition**: follow atomic-design layering — Tokens (Section 16) → Primitives (Button, Input, Badge) → Composite Components (Memory Card, Insight Card = Card primitive + Timeline primitive + text primitives) → Screen Templates (Section 7) → Screens.

**Atomic Design mapping**:
```
Tokens → Atoms (Button, Icon, Avatar, Badge)
       → Molecules (Memory Card, Notification Card, Chip)
       → Organisms (Companion Message Thread, Report Timeline, Discovery Reveal)
       → Templates (Screen layouts, Section 7)
       → Pages (actual routed screens)
```

**Naming**: component names describe what they are, not where they're used (`MemoryCard`, not `DashboardMemoryWidget`) — the same component appears in Dashboard, Companion, and Reports (Module 3, Shared Components), so location-based naming would be actively misleading.

**Folder Structure**:
```
/components
  /atoms        (Button, Icon, Avatar, Badge, Chip)
  /molecules    (MemoryCard, InsightCard, ReportCard, NotificationCard, JournalBlock)
  /organisms    (CompanionThread, ReportTimeline, DiscoveryReveal, DashboardGrid)
  /templates    (ScreenTemplates per Section 7)
/tokens         (design tokens, Section 16, as the single source of truth import)
```

**Component Ownership**: Design owns token values and component visual spec; Frontend owns implementation and accessibility compliance (Section 12); any change to a shared component (especially Memory Card, Insight Card, AI Message) requires sign-off from both, since these three components carry the product's core trust signals and must never silently drift between surfaces.

**Shared Components**: Memory Card, Insight Card, Report Timeline, and AI Message are explicitly the four components most likely to be duplicated by mistake under deadline pressure — flagged here as the highest-priority targets for a shared-component lint/audit process in QA.

---

## 18. UX Review

**Founder**: The dusk-and-gold visual identity is distinctive and correctly avoids both dominant "AI product" visual clichés (cream/terracotta and near-black/neon) while still clearly reading as calm and premium. The color-scarcity rule (gold only for genuine Insight moments) is the single smartest constraint in this module — it makes trust visible, not just felt.

**Design Director**: The Constellation Thread signature motif is a strong, ownable choice, but risks overuse if not tightly scoped — recommend an explicit usage audit each release (it should appear in single digits of moments per typical session, not on every screen transition).

**UX Lead**: Screen Architecture (Section 7) correctly keeps Premium visually continuous with Reports/Insight rather than introducing a separate "sales screen" aesthetic — this is consistent with Module 2's monetization strategy and should be protected against future growth-team pressure to make the paywall "pop" more.

**Frontend Lead**: The atomic-design/folder-structure mapping (Section 17) is implementable as specified; the explicit call-out of Memory Card, Insight Card, Report Timeline, and AI Message as dual-owned, audit-priority components is the right level of specificity to prevent silent drift — recommend this list feed directly into a CI lint rule (flag any new component that visually duplicates one of these four).

**AI Designer**: The rule that recalled memory must be visually distinguishable from generated reasoning (Section 10) is the load-bearing trust mechanic of the entire AI Experience System — recommend this be a QA-testable assertion (does every Memory Card render correctly when the Companion recalls something), not just a design guideline.

**Accessibility Specialist**: Contrast ratios for the gold accent against the light-mode surface need a explicit secondary check beyond what's stated here (gold-on-white tends to sit closer to the AA boundary than gold-on-dusk-dark) — flagged as an implementation-time verification, not a rejection of the token.

**Weaknesses found**: gold-on-light-mode contrast needs explicit verification at implementation time; Constellation Thread motif needs a hard per-session usage ceiling to avoid dilution; no explicit dark/light mode switching UX pattern was specified (assumed dusk/dark as default, light as alternate, but the toggle mechanism itself isn't designed here).

**Future risks**: growth pressure to make the Premium paywall visually more aggressive (brighter CTA, urgency copy) is the single most likely future violation of this design system, given Module 2's flagged organizational tension around monetization; this module's explicit reuse of Report/Insight visual language for Premium is the main structural defense.

---

## 19. Final Decisions

**Chosen Design Language**
A "dusk" visual identity — deep indigo-plum canvas, warm off-white text, a single scarce warm-gold accent reserved exclusively for genuine memory/Insight moments, paired with a warm humanist serif (Fraunces) for the Companion's voice and a clean humanist sans (Karla) for UI, unified by one recurring signature motion motif (the Constellation Thread) that visually embodies the product's core promise of connecting memory over time.

**Rejected Alternatives**
- Cream background with high-contrast serif and terracotta accent — rejected as the current default "AI product" look, contradicting the brief's need for a distinctive identity and clashing with the "dusk," not "daylight," brand emotion.
- Near-black background with a neon/bright accent — rejected as reading as tech/gaming rather than warm and reflective.
- A broadsheet/hairline-rule, zero-radius editorial layout — rejected as too clinical/journalistic for a product whose entire value is emotional warmth and continuity.
- Numeric AI confidence scores — rejected in favor of plain-language uncertainty, since a percentage implies false precision about interpretive frameworks (consistent with Module 1 AI Philosophy).
- A visible per-message "typing…" indicator separate from the Thinking state — rejected as implying a deliberation step that doesn't actually occur separately, a Trust Before Delight violation.

**Trade-offs**
Reserving the gold accent exclusively for Insight moments means most of the interface is deliberately, intentionally quiet/neutral — this trades some visual "pop" a growth-oriented redesign might want, in exchange for making the one accent color that does appear carry real, trustworthy meaning. This is the correct trade-off given the Decision Framework's Trust-over-Engagement ranking.

**Reasons**
Every choice in this module is traceable to a specific Module 1 constraint (Design Philosophy, AI Philosophy, Guardrails) or Module 2/3 structural decision (Core Product Loop staging, three-System IA, shared-component principle) — nothing here is a stylistic preference introduced independently of the strategy already fixed in earlier modules.

---

**Next module in sequence: Landing.**
