# FIGMA-04 — AI & RELATIONSHIP PATTERNS

*These are BeaconVie's own composite components — built from FIGMA-03 primitives, but unique enough to the product (and load-bearing enough to trust) to warrant individual, detailed specification. Memory Card, Report Card, and AI Message are the highest-scrutiny components in the entire system: any change requires dual Design + Frontend sign-off per DG05.*

---

## Memory Card

| Field | Spec |
|---|---|
| Purpose | The single visual proof-of-memory mechanism — used identically in Companion, Dashboard, Reports, Search, Notifications, Memory Timeline |
| Hierarchy | Built on the base Card primitive; content order: memory text (`type/body-md`) → timestamp (`type/caption`) → "why this memory" expandable link → source link |
| Spacing | `space/4` internal, `space/2` between text and timestamp |
| Padding | `radius/lg`, `elevation/1` |
| Variants | `context`: Compact (Dashboard/Context Nav, single line) / Full (Search result, Report, Memory Timeline) |
| States | Default / Expanded (why-this-memory shown) |
| Accessibility | Full text content exposed to screen readers — never relying on the gold accent alone to convey "this is a memory" |
| Keyboard | Tappable to jump to source; expand control keyboard-operable |
| Animation | **Memory Recall** animation on first appearance in a Companion thread: 400ms fade-and-rise, distinct from a standard message appearing — this is the one animation reserved exclusively for this component appearing inline in conversation |
| Responsive | Same structure at every breakpoint, width adapts to container |
| Developer Notes | **This component must never render without a real, retrieved `memory_node` reference.** There is no "placeholder" or "example" state permitted in production — if content is unavailable, the component does not render at all (falls back per the consuming screen's own Error State, FIGMA-03). This is the literal design-tool enforcement of Product Bible Module 9's hallucination-prevention rule. |

---

## Insight Card

| Field | Spec |
|---|---|
| Purpose | Surface a cross-time pattern, framed as an offering, never a verdict |
| Hierarchy | Uses `color/accent/insight` border/accent — the only Card variant that does by default |
| Spacing | Matches Memory Card |
| Padding | `radius/lg`, `elevation/1`, gold-accented `1px` border |
| Variants | `context`: Companion-inline / Dashboard-highlight / Report-embedded |
| States | Default |
| Accessibility | Content phrased with explicit hedging language is itself part of the content requirement, not just a visual style — copy review (not just design review) required before use |
| Keyboard | Same as Card |
| Animation | Insight Animation (Module 4, Section 9): 500ms ease-in-out with a subtle gold shimmer on first appearance only, never repeating |
| Responsive | Same structure, adapts width |
| Developer Notes | Requires multi-item evidentiary backing per Product Bible Module 10, Section 11 — never generated from a single data point. Figma cannot enforce this; it's flagged here so the frontend implementer knows this component's *content*, not just its shell, carries a business rule. |

---

## Report Card

| Field | Spec |
|---|---|
| Purpose | Entry-point tile linking to a full generated Report |
| Hierarchy | Title (`type/heading-md`) → period/date (`type/caption`) → one-line preview (`type/body-sm`) |
| Spacing | `space/4` internal |
| Padding | `radius/lg`, `elevation/1` |
| Variants | `tier`: Unlocked / Locked-Preview |
| States | Default |
| Accessibility | Locked-Preview state's genuine partial content is real, readable text — never a blurred/obscured visual trick masquerading as accessible content |
| Keyboard | Tappable, standard Card keyboard rules |
| Animation | Standard reveal |
| Responsive | Grid on desktop, single column on mobile |
| Developer Notes | Locked-Preview must show real preview text pulled from the actual (available) portion of the report, never placeholder marketing copy |

---

## AI Message (Companion bubble base)

| Field | Spec |
|---|---|
| Purpose | Render a single message in a Companion conversation thread |
| Hierarchy | `type/companion-voice` (Fraunces) for Companion-authored messages, `type/body-md` (Karla) for user messages — this typographic split is the message's primary identity signal, not a bubble color difference |
| Spacing | `space/2` between consecutive same-sender messages (grouped, no repeated timestamp) |
| Padding | `space/3` internal |
| Variants | `sender`: Companion / User · `showMemoryCard`: true/false (Instance-swap slot for nested Memory Card) |
| States | Default / Streaming |
| Accessibility | Streaming text announced once complete, not word-by-word, to avoid overwhelming screen-reader output |
| Keyboard | Full tab order through thread; Memory Card nested inside follows its own keyboard rules |
| Animation | Token-by-token natural-pace streaming (Streaming state) — see Typing Indicator below for the pre-message state |
| Responsive | Max-width capped at the 720px reading column on desktop, full-width (minus margin) on mobile |
| Developer Notes | No avatar/icon renders per message — presence is carried by typography and position alone |

---

## Typing Indicator (Thinking State)

| Field | Spec |
|---|---|
| Purpose | Honest, labeled wait state before a Companion response begins streaming |
| Hierarchy | Circular Progress (FIGMA-03) + specific text label |
| Spacing | `space/2` between indicator and label |
| Padding | Matches AI Message padding |
| Variants | Label content varies by context (documented per screen — "thinking about what you shared…" for Companion, "connecting a few things you've shared…" for Reports) |
| States | Visible only between send and stream-start |
| Accessibility | `aria-live` announces the label once, not repeatedly |
| Keyboard | N/A |
| Animation | Quiet, labeled — never a bare three-dot ellipsis |
| Responsive | Same at every breakpoint |
| Developer Notes | **This is the only pre-response indicator in the system.** No separate "typing…" indicator exists layered on top of it — a single honest state covers both retrieval and generation. |

---

## Companion Bubble (container)

*Distinct from AI Message: this is the outer conversation-thread container, not an individual message.*

| Field | Spec |
|---|---|
| Purpose | Houses the full message list + input bar for a Companion conversation |
| Hierarchy | Message list (List/Timeline pattern) → input bar (fixed to bottom) → floating "+ New Topic" action |
| Spacing | `space/3` between messages, `space/4` around the input bar |
| Padding | `space/4` horizontal margin, capped reading width on desktop |
| Variants | `entryPoint`: Dashboard / Discovery-bridge / Onboarding (visual identical, entry context documented for analytics only) |
| States | Default / Empty (open invitation) |
| Accessibility | `<main>` landmark for the message list, `<form>` for the input bar |
| Keyboard | Enter sends; Shift+Enter (if supported) for a line break |
| Animation | Standard `motion/standard` for new message appearance (non-Memory-Card messages) |
| Responsive | Input bar respects safe-area insets on mobile |
| Developer Notes | The "+ New Topic" action resets immediate conversational context, never discards underlying Memory |

---

## Journal Entry

| Field | Spec |
|---|---|
| Purpose | A single saved (or in-progress) Journal entry, in list/timeline view |
| Hierarchy | Date/time (`type/caption`) → first-line preview (`type/body-md`, Karla) → (rare) Companion-annotated margin note (`type/companion-voice`) |
| Spacing | `space/3` internal |
| Padding | `radius/lg`, `elevation/1` |
| Variants | `status`: Draft / Saved · `hasCompanionNote`: true/false |
| States | Default |
| Accessibility | Full text content readable, margin note clearly distinguished as separate from the user's own writing |
| Keyboard | Tappable to open full entry |
| Animation | Standard list-item reveal |
| Responsive | Single column at every breakpoint |
| Developer Notes | Draft status entries are never shown to anyone but the authoring user, at any point in any flow |

---

## Reflection Card

*The post-entry AI response surface within Journal — distinct from a Companion conversation message.*

| Field | Spec |
|---|---|
| Purpose | Render the Reflection Engine's rare, brief post-entry response (or a Quiet Acknowledgment) |
| Hierarchy | `type/companion-voice`, no header/label needed — context (appearing directly beneath a just-saved entry) makes its source self-evident |
| Spacing | `space/2` gap from the entry above it |
| Padding | `space/3` internal, no border/card chrome — deliberately lighter-weight than a full Card, to avoid competing visually with the entry itself |
| Variants | `type`: Reflection / Question / Validation / QuietAcknowledgment |
| States | Default |
| Accessibility | Announced once, not interrupting active reading focus |
| Keyboard | N/A (non-interactive display) |
| Animation | Quiet fade-in, `motion/fast` |
| Responsive | Same at every breakpoint |
| Developer Notes | **This component's most common real-world state is absent entirely** — most entries receive no Reflection Card at all. A screen showing this component on every single entry in a design mockup is showing an unrepresentative, misleading demo state; verify against real distribution before finalizing any Journal screen. |

---

## Discovery Card

*The reveal + interpretation surface shared by Tarot, Natal Chart, Eastern Horoscope, and Numerology.*

| Field | Spec |
|---|---|
| Purpose | Render one Discovery-system reveal and its personalized interpretation |
| Hierarchy | Visual reveal (card art / chart wheel / elements diagram / number) → traditional meaning (collapsed by default) → personalized interpretation (`type/companion-voice`) → one closing question → Companion bridge CTA |
| Spacing | `space/6` between the reveal and the interpretation text |
| Padding | Full-width reveal area, `space/4` padding around interpretation text |
| Variants | `system`: Tarot / NatalChart / EasternHoroscope / Numerology (each with its own reveal-area illustration, same surrounding chrome) |
| States | Default / Loading (reveal) / Error (falls back to static traditional meaning) |
| Accessibility | Descriptive alt text for the reveal illustration conveying its actual symbolic content, not just "image" |
| Keyboard | "Learn more" (traditional meaning) is a keyboard-operable Accordion; bridge CTA follows Button rules |
| Animation | `motion/deliberate` (600–900ms) for the reveal only — the one slow, ritual-weight moment in this component; everything else uses standard timing |
| Responsive | Full-width reveal on mobile, constrained/centered on desktop |
| Developer Notes | Traditional-meaning content is fixed, curated reference data — never generated per-request. The personalized interpretation text must always be traceable to (a) that fixed reference content and (b) at most one retrieved Memory item. |

---

## Premium Card

| Field | Spec |
|---|---|
| Purpose | The upgrade comparison/felt-value surface |
| Hierarchy | Reuses Report Card and Insight Card visual language exactly — **no distinct visual treatment exists for this component** |
| Spacing | Matches Report Card |
| Padding | Matches Report Card |
| Variants | `plan`: Free / Premium (side-by-side comparison layout) |
| States | Default |
| Accessibility | Full keyboard/screen-reader support for the comparison table and the single CTA |
| Keyboard | Standard Card + Button rules |
| Animation | Standard reveal — **no special celebratory animation on selection or successful upgrade** |
| Responsive | Side-by-side on desktop, stacked on mobile |
| Developer Notes | This component must be built by literally reusing the Report Card / Insight Card component instances, not a visually similar but separately-maintained copy — divergence here is the single most likely place a future "make Premium pop more" request would try to introduce inconsistency, and the component structure itself should make that harder to do accidentally. |

---

**Continue to FIGMA-05.**
