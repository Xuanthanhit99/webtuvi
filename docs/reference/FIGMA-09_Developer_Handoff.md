# FIGMA-09 — DEVELOPER HANDOFF

*This document is the contract between Figma and frontend implementation. It consolidates naming, structure, and rule conventions already established across FIGMA-01 through FIGMA-08 into one reference an engineer can work from without opening every prior document.*

---

## 1. Naming Convention (consolidated)

| Element | Convention | Example |
|---|---|---|
| File | `BeaconVie / [FileName]` | `BeaconVie / Components` |
| Page | `[emoji] [Title Case]` | `🏠 Dashboard` |
| Frame (screen) | `[Module]/[ScreenName]/[State]` | `Dashboard/Home/Empty-NewUser` |
| Component (top-level) | `[Category]/[ComponentName]` | `Primitives/Button` |
| Variant property | lowerCamelCase name, Title Case values | `type: Primary` |
| Layer (inside component/frame) | Named for role, never appearance | `Label`, `IconLeading`, never `Text 1` |
| Asset export | `[category]-[name]-[size].{svg\|png}` | `icon-companion-24.svg` |

## 2. Component Naming

Every component lives under exactly one category page (FIGMA-01, Section 2). A component is never duplicated under two categories — if it seems to belong in two places, that's a signal the categorization itself needs revisiting, not that the component should be copied.

## 3. Variant Naming

Variant axes are limited to what's specified in FIGMA-01, Section 4's standard axis table, plus any component-specific axis explicitly documented in FIGMA-03/04 (e.g., Discovery Card's `system` axis). No speculative axis is added without updating this document first.

## 4. Layer Naming

Every layer inside a component's structure is named for its semantic role. This is what makes Figma's Dev Mode "Inspect" panel produce a CSS/structure readout an engineer can map directly to a component's props without a design walkthrough.

## 5. Asset Naming

All exports are lowercase, hyphenated. SVG preferred for icons/illustrations (matches Module 4/22's SVG-first performance requirement); PNG only for the rare case of a required raster asset (e.g., app store screenshots), always exported at 2x/3x alongside 1x.

## 6. Frame Naming

Every screen frame follows `[Module]/[ScreenName]/[State]`, with State drawn from the fixed vocabulary: `Default`, `Loading`, `Empty`, `Error-[Type]`, `Success`. This vocabulary is exhaustive — a state that doesn't fit one of these categories is a signal to reconsider whether it's a genuinely new state or a variant of an existing one.

## 7. Page Naming

Per FIGMA-01, Section 2 — fixed, documented page structure per file, not extended ad hoc.

## 8. File Naming

Five fixed files (FIGMA-01, Section 1): `Foundations`, `Components`, `Templates & Screens`, `Prototype`, `Assets`. A sixth file is never created without updating this document and FIGMA-01 first.

---

## 9. Auto Layout Rules

- Every frame and component uses Auto Layout. No absolute positioning in production libraries.
- Padding/gap values reference Spacing tokens (FIGMA-02, Section 3) exclusively — never a typed arbitrary pixel value.
- Resizing behavior (`Fill`/`Hug`/`Fixed`) is set explicitly per element.
- Nested Auto Layout frames are named for structural role (`Content`, `Actions`, `Meta`).

## 10. Variables

- Figma Variables are the source of truth for Color, Spacing, Radius, and Typography-scale tokens.
- Two modes exist on the `Color` collection: `Dark` (default) and `Light`. Every screen frame is built with a mode switch wired at the top level.
- No component ships with a hardcoded value where a Variable exists for that property.

## 11. Component Properties

- Boolean/Instance-swap properties are used for genuine, existing content states (e.g., `AI Message`'s `showMemoryCard`) — never for speculative future states.
- Every exposed property has a description in the component's own Figma metadata explaining what it represents and which Product Bible section governs it.

## 12. Responsive Rules

- Structure is identical across Mobile/Tablet/Desktop — only density, padding, and column count adapt (Product Bible Module 22, Section 7's governing rule, restated as a hard build rule here).
- No feature or content is hidden on mobile that exists on desktop.
- Every screen is built at all three canonical widths (390/834/1280) as linked, separately-designed frames — never a single frame resized and assumed to reflow correctly.

## 13. Grid Rules

Per FIGMA-02, Section 7 — 4/8/12-column grids at Mobile/Tablet/Desktop respectively, with content-width caps of 1120px (marketing) and 720px (reading column: Reports, Journal, long-form Companion review).

## 14. Spacing Rules

Every spacing value in every frame traces to the `space/*` token scale (FIGMA-02, Section 3). A design review that finds an un-tokenized spacing value blocks merge into the Components/Templates files.

## 15. Typography Rules

- `type/companion-voice` (Fraunces) is applied only to genuine first-person AI-authored content (Companion messages, Report narrative). Applying it to ordinary UI copy is a defect.
- `type/data-mono` (IBM Plex Mono) is applied only to precise/structured data (Numerology numbers, chart degrees, timestamps in tabular contexts).
- No font weight, size, or line-height outside the defined type scale (FIGMA-02, Section 2) is used anywhere.

## 16. Color Rules

- `color/accent/insight` (gold) is applied only to verified memory/insight moments — a designer adding it elsewhere must cite the Product Bible section justifying the usage in the component's Figma description.
- No color is used outside the token set defined in FIGMA-02, Section 1.
- Both Dark and Light modes are validated for every new component before it ships.

## 17. Accessibility Rules

- WCAG AA contrast minimum (4.5:1 body / 3:1 large text) verified for every new color pairing, in both theme modes.
- Every interactive element meets the 44×44px minimum touch target.
- Every icon-only control has an accessible label.
- `prefers-reduced-motion` fallback exists for every animation beyond `motion/fast`.
- Color is never the sole carrier of meaning.

## 18. Motion Rules

- Duration scales with significance: `motion/fast` (200ms) for routine UI, `motion/standard` (250ms) for transitions, `motion/deliberate` (600–900ms) reserved for genuine ritual/reveal moments (Card Reveal, first chart generation, Memory Recall), `motion/report` (staged, ~1500ms) for Report generation only.
- No shake, bounce, elastic easing, or confetti/celebration sequence exists anywhere in the production library.
- The Constellation Thread motif's usage is counted per release and reviewed against overuse (target: appears in single digits of moments per typical session).

---

## 19. Implementation Priority

| Priority | Scope | Rationale |
|---|---|---|
| P0 | Foundations (tokens), Primitives (FIGMA-03), Authentication, Dashboard, Companion | Nothing else can be built correctly without these; Companion is the core product |
| P0 | Memory Card, AI Message hallucination-prevention behavior | Highest trust-risk components in the system — must be correct before anything ships around them |
| P1 | Onboarding, Memory, Journal, one Discovery system (Tarot, lowest setup cost) | Completes the MVP core loop |
| P1 | Settings, Trust Center | Trust infrastructure must ship alongside, not significantly after, the core loop |
| P2 | Reports, remaining Discovery systems (Natal Chart, Eastern Horoscope, Numerology), Premium | V1 scope, per Product Bible Module 1's sequencing |
| P2 | Notifications | Depends on Memory being mature enough to generate genuine triggers |
| P3 | Community | V1.5, explicitly sequenced after the core relationship is proven (Product Bible Module 1) |
| P3 | Admin | Internal tooling, built in parallel but never blocking consumer-facing priorities |

## 20. QA Checklist (summary — full checklists in FIGMA-10)

Before any component or screen is marked implementation-ready: token compliance verified, both theme modes validated, accessibility bar met, motion tokens correctly applied, responsive structure identical across breakpoints, and — for the four flagged shared components specifically — dual Design + Frontend sign-off obtained.

---

**Continue to FIGMA-10.**
