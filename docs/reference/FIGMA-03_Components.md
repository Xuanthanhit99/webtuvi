# FIGMA-03 — PRIMITIVE COMPONENT SPECIFICATION

*Every component below lives in `Components / Primitives` (or the noted sub-page) per FIGMA-01, Section 2. Composite, BeaconVie-specific patterns (Memory Card, AI Message, etc.) are specified separately in FIGMA-04. Each row is production-ready: a designer or engineer should be able to build or implement directly from it.*

---

## Button

| Field | Spec |
|---|---|
| Purpose | Trigger exactly one clear action |
| Hierarchy | `type=Primary` is the highest-commitment visual weight in the system; reserved for one per screen |
| Spacing | `space/3` horizontal internal padding × `space/2` vertical |
| Padding | Auto Layout, `Hug` on both axes by default; `Fill` width on mobile for Primary buttons in a form context |
| Variants | `type`: Primary / Secondary / Ghost · `state`: Default / Hover / Active / Disabled / Loading · `size`: Standard / Compact |
| States | Loading state swaps label for a small labeled spinner, never a bare icon spin |
| Accessibility | `role="button"`, label always visible (never icon-only without an `aria-label`), `a11y/target-min` enforced even at `Compact` size |
| Keyboard | Enter/Space activates; visible `interaction/focus` ring |
| Animation | `motion/fast` background-lightness shift on hover; no scale/bounce |
| Responsive | Full-width on mobile in vertical forms; auto-width elsewhere |
| Developer Notes | Loading state must disable the click handler, not just visually gray out |

## Input

| Field | Spec |
|---|---|
| Purpose | Single-line text/data entry |
| Hierarchy | Label always above field, never placeholder-only |
| Spacing | `space/2` label-to-field |
| Padding | `space/3` internal |
| Variants | `type`: Text / Email / Password / Date · `state`: Default / Focus / Error / Disabled |
| States | Error state shows `semantic/error` border + inline message below, `space/1` gap |
| Accessibility | Programmatic `<label>` association; error message linked via `aria-describedby` |
| Keyboard | Tab order follows visual order; password fields include a show/hide toggle, keyboard-operable |
| Animation | Border-color transition on focus/error, `motion/fast` |
| Responsive | `Fill` width in its container at every breakpoint |
| Developer Notes | Never rely on placeholder text as the accessible name |

## Textarea

| Field | Spec |
|---|---|
| Purpose | Multi-line entry — primarily the Journal composer |
| Hierarchy | No visible chrome beyond a quiet border; minimal UI per Journal's "quiet room" requirement |
| Spacing | `space/4` internal padding, generous line-height (`1.6`, an exception to the standard type line-heights, justified by the sustained-reading context) |
| Padding | `Fill` width, `Hug` height with a defined minimum |
| Variants | `type`: Standard / Draft (autosave-connected, no functional Figma difference, documented for dev handoff only) |
| States | Default / Focus — no error state (Journal has no required-field validation) |
| Accessibility | Full resize/zoom support; announces content length changes conservatively (not on every keystroke) to screen readers |
| Keyboard | Standard text-editing keys; no custom keyboard shortcuts intercepted |
| Animation | None during typing — this is an explicit rule, not an oversight (Product Bible Module 11, Section 5) |
| Responsive | Full-width, single column at every breakpoint |
| Developer Notes | Zero live AI suggestion UI may ever render inside or adjacent to this component while focused |

## Checkbox

| Field | Spec |
|---|---|
| Purpose | Multi-select from independent options |
| Hierarchy | Label to the right, `space/2` gap |
| Spacing | `space/2` between stacked checkbox options |
| Padding | `a11y/target-min` hit area even though the visible box is smaller |
| Variants | `state`: Unchecked / Checked / Disabled |
| States | Checked shows a quiet check-mark fade-in |
| Accessibility | Native checkbox semantics or full ARIA equivalent |
| Keyboard | Space toggles |
| Animation | `motion/fast` |
| Responsive | Same at every breakpoint |
| Developer Notes | Use only where multiple independent selections are valid |

## Radio

| Field | Spec |
|---|---|
| Purpose | Single-select from a small set |
| Hierarchy | Grouped visually and semantically |
| Spacing | `space/2` between options |
| Padding | `a11y/target-min` hit area |
| Variants | `state`: Unselected / Selected / Disabled |
| States | Selected shows a quiet fill transition |
| Accessibility | `role="radiogroup"` on the container |
| Keyboard | Arrow keys move selection within the group |
| Animation | `motion/fast` |
| Responsive | Same at every breakpoint |
| Developer Notes | Never used for more than ~5 options — use Select beyond that |

## Switch

| Field | Spec |
|---|---|
| Purpose | Binary on/off, primarily Settings |
| Hierarchy | Label to the left, switch right-aligned in a Settings row |
| Spacing | Row height `space/12` minimum for comfortable tap target |
| Padding | Internal `space/1` thumb padding |
| Variants | `state`: Off / On / Disabled |
| States | On uses `semantic/success`, never a generic "brand" color |
| Accessibility | `role="switch"`, `aria-checked` reflects real state |
| Keyboard | Space/Enter toggles |
| Animation | Quiet slide, `motion/fast` |
| Responsive | Same at every breakpoint |
| Developer Notes | Toggling applies immediately — no Save button anywhere in the flow; visual state must be driven by confirmed backend state, not optimistic-only |

## Select / Dropdown

| Field | Spec |
|---|---|
| Purpose | Choose from a longer list |
| Hierarchy | Matches Input's visual weight |
| Spacing | Matches Input padding |
| Padding | `space/3` internal |
| Variants | `state`: Closed / Open / Selected / Disabled |
| States | Open state shows an options list, `elevation/2` |
| Accessibility | Full ARIA combobox pattern |
| Keyboard | Arrow keys navigate options, Enter selects, Escape closes |
| Animation | `motion/standard` reveal |
| Responsive | Becomes a full-screen Bottom Sheet variant on mobile |
| Developer Notes | Never used for binary choices — use Switch |

## Avatar

| Field | Spec |
|---|---|
| Purpose | User identity representation |
| Hierarchy | Default: initials-on-color-token circle |
| Spacing | N/A (fixed-size element) |
| Padding | N/A |
| Variants | `type`: Initials / Photo · `size`: Small (24px) / Medium (40px) / Large (64px) |
| States | Default only — no interactive states unless used as a button trigger |
| Accessibility | `alt` text if Photo type; decorative-marked if purely presentational |
| Keyboard | N/A unless interactive (e.g., opens Profile — then follows Button rules) |
| Animation | None |
| Responsive | Same sizes, scaled per context, at every breakpoint |
| Developer Notes | Never a mascot/character illustration — initials or user photo only |

## Card (base)

| Field | Spec |
|---|---|
| Purpose | The universal content container |
| Hierarchy | `radius/lg`, `elevation/1`, no shadow by default |
| Spacing | `space/4` internal padding |
| Padding | `Hug` height, `Fill` or fixed width depending on grid context |
| Variants | `state`: Default / Selected (rare) |
| States | No hover elevation change by default (this system does not use hover-lift as a hint) |
| Accessibility | Correct heading level inside, if the card contains a title |
| Keyboard | If the whole card is a tap target, it's a single focusable element, not multiple nested tab-stops |
| Animation | Standard reveal on scroll-into-view (`motion/standard`), except where noted in FIGMA-04 for AI/memory patterns |
| Responsive | Reflows to single column on mobile |
| Developer Notes | This is the base every specialized card (Memory, Insight, Report, Notification — FIGMA-04) extends; never rebuild card chrome from scratch |

## Toast

| Field | Spec |
|---|---|
| Purpose | Brief, non-blocking confirmation |
| Hierarchy | Floats above content, `elevation/2` |
| Spacing | `space/3` internal padding |
| Padding | `Hug` |
| Variants | `type`: Success / Error |
| States | Appearing / Visible / Dismissing |
| Accessibility | `aria-live="polite"` region |
| Keyboard | Dismissible via Escape if focused; otherwise auto-dismiss |
| Animation | Quiet fade, `motion/fast`, auto-dismiss after ~4s |
| Responsive | Fixed position, safe-area aware on mobile |
| Developer Notes | Never used for anything requiring a decision — use Dialog |

## Tooltip

| Field | Spec |
|---|---|
| Purpose | Brief clarifying info for a non-obvious icon |
| Hierarchy | Small, `elevation/2` |
| Spacing | `space/1` internal padding |
| Padding | `Hug` |
| Variants | None — one style |
| States | Visible / Hidden |
| Accessibility | Triggered by focus, not only hover |
| Keyboard | Appears on focus, dismissible via Escape |
| Animation | Quiet fade |
| Responsive | Tap-triggered on touch devices, auto-dismiss after a few seconds |
| Developer Notes | Used only where a genuine icon-meaning gap exists — a UI needing many tooltips needs a redesign, not more tooltips |

## Dialog

| Field | Spec |
|---|---|
| Purpose | Interrupt for a genuinely consequential decision |
| Hierarchy | `radius/xl`, `elevation/2`, `shadow/sm` |
| Spacing | `space/6` internal padding |
| Padding | Centered, `Hug` height |
| Variants | `type`: Confirm / Destructive |
| States | Open / Closed |
| Accessibility | Focus-trapped, labeled via `aria-labelledby`, Escape closes (non-destructive only — destructive dialogs require explicit action, not Escape, to close-and-confirm) |
| Keyboard | Tab cycles within the dialog only while open |
| Animation | `motion/standard` fade/scale-in |
| Responsive | Full-screen on mobile |
| Developer Notes | Consequence copy is written per-instance, never generic "Are you sure?" |

## Drawer

| Field | Spec |
|---|---|
| Purpose | Desktop secondary panel (context/detail) |
| Hierarchy | `elevation/2`, slides from screen edge |
| Spacing | `space/6` internal padding |
| Padding | Fixed width, `Fill` height |
| Variants | `side`: Left / Right |
| States | Open / Closed |
| Accessibility | Focus-trapped while open |
| Keyboard | Escape closes |
| Animation | `motion/standard` slide |
| Responsive | Desktop-only; becomes Bottom Sheet on mobile |
| Developer Notes | Right Drawer is the Context Navigation vehicle (jump-to-memory-source, etc.) |

## Bottom Sheet

| Field | Spec |
|---|---|
| Purpose | Mobile secondary content/Quick Actions |
| Hierarchy | `radius/xl` top corners only, `elevation/2` |
| Spacing | `space/6` internal padding |
| Padding | `Fill` width, `Hug` or draggable-expand height |
| Variants | `type`: Standard / Draggable-expand |
| States | Open / Closed / Expanded |
| Accessibility | Focus-trapped |
| Keyboard | Escape/back-gesture closes |
| Animation | Slide-up, `motion/standard` |
| Responsive | Mobile-primary; desktop equivalent is Drawer, never both simultaneously for the same content |
| Developer Notes | Never nest a sheet inside a sheet |

## Sidebar

| Field | Spec |
|---|---|
| Purpose | Desktop persistent navigation |
| Hierarchy | Fixed width, full height |
| Spacing | `space/4` between nav items |
| Padding | `space/4` internal |
| Variants | None — single, always-expanded state at current IA depth |
| States | Item `Active`/`Inactive` |
| Accessibility | `<nav>` landmark, full keyboard tab order |
| Keyboard | Tab through items, Enter activates |
| Animation | None (persistent, no open/close) |
| Responsive | Desktop-only |
| Developer Notes | Exactly 4 destinations + Settings — do not add a 5th without a Constitution-level review (Product Bible Module 25) |

## Topbar

| Field | Spec |
|---|---|
| Purpose | Screen title + context actions (Search, Settings icon) |
| Hierarchy | Fixed height, title left/center, icons right |
| Spacing | `space/3` between icons |
| Padding | `space/4` horizontal |
| Variants | None |
| States | Default |
| Accessibility | `<header>` landmark |
| Keyboard | Full tab order |
| Animation | None |
| Responsive | Present at every breakpoint (replaces Sidebar's role on mobile/tablet nav) |
| Developer Notes | Never more than title + 2 icons |

## Navigation (Global)

| Field | Spec |
|---|---|
| Purpose | Persistent top-level wayfinding |
| Hierarchy | Sidebar (desktop) / Bottom bar (mobile) — same 4 items, different container |
| Spacing | Even distribution across available width (mobile) |
| Padding | `space/2` per item |
| Variants | `platform`: Sidebar / BottomBar |
| States | Item `Active`/`Inactive` |
| Accessibility | Landmark region, current-page indicated via `aria-current` |
| Keyboard | Full tab order (desktop); standard OS tab-bar behavior (mobile) |
| Animation | None |
| Responsive | Sidebar → Bottom bar at the tablet/mobile breakpoint |
| Developer Notes | This is the literal implementation of Module 3's two-tap-maximum IA rule — verify new features nest correctly under an existing item |

## Tabs

| Field | Spec |
|---|---|
| Purpose | Peer-level navigation within one module (e.g., the four Discovery systems) |
| Hierarchy | Segmented control, equal visual weight per tab |
| Spacing | Equal-width segments |
| Padding | `space/3` per tab |
| Variants | `count`: 2–4 (never more without a redesign review) |
| States | `Active`/`Inactive` per tab |
| Accessibility | `role="tablist"`, arrow-key navigation |
| Keyboard | Arrow keys move between tabs, Enter/Space activates |
| Animation | Underline/fill slide, `motion/fast` |
| Responsive | Horizontal scroll if content forces it (rare, given the 4-max rule) |
| Developer Notes | Reserved for genuinely equal-weight peer content — not for hiding hierarchy |

## Progress

| Field | Spec |
|---|---|
| Purpose | Loading/multi-step indication |
| Hierarchy | Always paired with a specific text label |
| Spacing | `space/2` between indicator and label |
| Padding | Contextual |
| Variants | `type`: Linear / Circular |
| States | Indeterminate / Determinate |
| Accessibility | `aria-live` region announces label changes |
| Keyboard | N/A (non-interactive) |
| Animation | Quiet, honest pacing — never sped up to feel faster than the real wait |
| Responsive | Same at every breakpoint |
| Developer Notes | Never a bare, unlabeled spinner anywhere in the product |

## Timeline

| Field | Spec |
|---|---|
| Purpose | Chronological memory/insight display |
| Hierarchy | Connecting line + point per entry, grouped by relative time |
| Spacing | `space/4` between entries |
| Padding | `space/2` per entry internal |
| Variants | `density`: Standard (Memory/Reports) / Compact (Dashboard) |
| States | Default |
| Accessibility | Full text-equivalent list structure underlying the visual line |
| Keyboard | Full tab order through entries |
| Animation | Quiet connecting-line draw on first render only |
| Responsive | Compact variant used on mobile/Dashboard regardless of desktop density elsewhere |
| Developer Notes | One component, reused identically across Memory, Reports, and Discovery reading-history — never reinvented per module |

## Search (box)

| Field | Spec |
|---|---|
| Purpose | Global content search entry point |
| Hierarchy | Prominent, top-of-screen when active |
| Spacing | Matches Input |
| Padding | `space/3` internal |
| Variants | `state`: Idle / Focused / Results |
| States | Results state shows a ranked list below |
| Accessibility | Full keyboard operability, results announced |
| Keyboard | Standard text input + Arrow/Enter to navigate results |
| Animation | `motion/standard` reveal for results |
| Responsive | Full-screen overlay on mobile, inline panel on desktop |
| Developer Notes | One Search component instance system-wide, never duplicated per module |

## Notification (list item)

| Field | Spec |
|---|---|
| Purpose | Single Notification Center entry |
| Hierarchy | Icon (category-coded) + text, `space/2` gap |
| Spacing | `space/3` internal padding |
| Padding | `Fill` width |
| Variants | `category`: Memory / Journal / Companion / Reports / Community / System |
| States | Default (no unread visual treatment beyond subtle text-weight, never a red dot/badge) |
| Accessibility | Full screen-reader labeling |
| Keyboard | Full tab order, Enter opens |
| Animation | Standard list-item reveal |
| Responsive | Same at every breakpoint |
| Developer Notes | No unread-count badge exists anywhere referencing this component |

## Badge

| Field | Spec |
|---|---|
| Purpose | Small status indicator |
| Hierarchy | Inline, attached to a parent element |
| Spacing | N/A (small, fixed) |
| Padding | `space/1` |
| Variants | `type`: Neutral / Insight (gold) / New |
| States | Static |
| Accessibility | Text-equivalent, never color-only |
| Keyboard | N/A |
| Animation | None |
| Responsive | Same at every breakpoint |
| Developer Notes | Insight variant reserved exclusively for memory-derived content |

## Chip

| Field | Spec |
|---|---|
| Purpose | Selectable/filter tag (Discovery tabs, Search filters) |
| Hierarchy | Inline, single-line |
| Spacing | `space/1` between chips in a row |
| Padding | `space/2` internal |
| Variants | `state`: Selected / Unselected · `removable`: true/false |
| States | Selected shows filled/accented treatment |
| Accessibility | Keyboard selectable |
| Keyboard | Space/Enter toggles |
| Animation | Quiet select transition |
| Responsive | Horizontal scroll if many |
| Developer Notes | Never multi-line text |

## Tag

| Field | Spec |
|---|---|
| Purpose | Auto-derived category label (Life Domain, Theme) |
| Hierarchy | Inline, small |
| Spacing | `space/1` internal |
| Padding | `space/1` |
| Variants | None — one visual style |
| States | Static |
| Accessibility | Text-equivalent |
| Keyboard | N/A (non-interactive by default) |
| Animation | None |
| Responsive | Same at every breakpoint |
| Developer Notes | Never manually authored by a user (Community's own tagging, if any, is a distinct pattern — not this component) |

## Table

| Field | Spec |
|---|---|
| Purpose | Structured tabular data — Admin only |
| Hierarchy | Standard row/column, header row emphasized |
| Spacing | `space/3` per cell |
| Padding | `space/2` internal per cell |
| Variants | None |
| States | Default, Row-Selected |
| Accessibility | Full `<th>`/`<td>` semantics |
| Keyboard | Full tab/arrow navigation |
| Animation | None |
| Responsive | Horizontal scroll on mobile if needed (Admin is desktop-primary) |
| Developer Notes | Never used in consumer-facing Companion/Journal/Reports surfaces |

## Calendar

| Field | Spec |
|---|---|
| Purpose | Date selection (birth data entry) and date-grid browsing (Discovery/Journal history) |
| Hierarchy | Month grid, current/selected date emphasized |
| Spacing | Even grid spacing |
| Padding | `space/2` per cell |
| Variants | `type`: Picker / Browse |
| States | Default / Selected / Disabled (future dates, where relevant) |
| Accessibility | Full keyboard date navigation (arrow keys move by day, Page Up/Down by month) |
| Keyboard | Full arrow-key support |
| Animation | None |
| Responsive | Full-screen sheet on mobile |
| Developer Notes | Historical-date support (pre-1970, pre-timezone-standardization) required for birth-data Picker variant |

## Empty State

| Field | Spec |
|---|---|
| Purpose | Communicate "nothing here yet" as invitation, not deficiency |
| Hierarchy | Low-density Constellation illustration + one line of copy + optional soft CTA |
| Spacing | `space/6` vertical rhythm |
| Padding | Centered within available space |
| Variants | Per-module copy variant (documented per screen in FIGMA-05/06/07) |
| States | Static |
| Accessibility | Illustration marked decorative; copy is the actual accessible content |
| Keyboard | CTA (if present) follows Button rules |
| Animation | Standard fade-in |
| Responsive | Same layout, scaled, at every breakpoint |
| Developer Notes | Never a "sad face" or generic stock graphic |

## Loading State

| Field | Spec |
|---|---|
| Purpose | Communicate an honest, labeled wait |
| Hierarchy | Skeleton (shape-matched) or labeled Progress, per context |
| Spacing | Matches the final content it's standing in for |
| Padding | Matches final content |
| Variants | `type`: Skeleton / Labeled-Spinner |
| States | Static (no shimmer animation) |
| Accessibility | `aria-busy` on the container |
| Keyboard | N/A |
| Animation | None beyond a static-to-content cross-fade on resolve |
| Responsive | Matches final content shape at every breakpoint |
| Developer Notes | Never a bare, unlabeled spinner |

## Error State

| Field | Spec |
|---|---|
| Purpose | Communicate what happened and what to do next |
| Hierarchy | `semantic/error` accent, specific copy, retry action if applicable |
| Spacing | `space/4` internal |
| Padding | Contextual |
| Variants | Per-failure-type copy (documented per screen) |
| States | Static |
| Accessibility | `aria-live="assertive"` for the error message |
| Keyboard | Retry action follows Button rules |
| Animation | Calm color shift only — no shake |
| Responsive | Same at every breakpoint |
| Developer Notes | Never vague ("Something went wrong") without a specific next step |

## Skeleton

| Field | Spec |
|---|---|
| Purpose | Shape-matched loading placeholder |
| Hierarchy | Muted surface-tone blocks matching final layout |
| Spacing | Matches final content |
| Padding | Matches final content |
| Variants | Per-component shape (Card skeleton, List skeleton, Timeline skeleton) |
| States | Static |
| Accessibility | `aria-busy`, hidden from screen readers until resolved |
| Keyboard | N/A |
| Animation | None (no shimmer) |
| Responsive | Matches final content at every breakpoint |
| Developer Notes | Built per-component as a variant, not a separate generic block |

---

**Continue to FIGMA-04.**
