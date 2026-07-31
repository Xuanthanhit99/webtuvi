# FIGMA-02 — DESIGN SYSTEM SPECIFICATION

*Every token below is implemented as a Figma Variable per FIGMA-01, Section 6. This document is the authoritative source for what each token means and how it must be used — the underlying hex/px source-of-truth values live in the tokens file referenced by Module 4, Section 16, and are not re-derived here.*

---

## 1. Color Tokens

| Token | Purpose | Usage | Rules | Example |
|---|---|---|---|---|
| `color/bg/canvas` | Primary app background | Every screen's root background | Never used for foreground content | Dashboard root frame fill |
| `color/bg/surface` | Card/panel background | One elevation step above canvas | Never nested more than 2 levels deep (canvas → surface → surface-raised, no further) | Card component fill |
| `color/bg/surface-raised` | Modal/sheet background | Highest elevation step | Reserved for Dialog, Bottom Sheet, Drawer | Dialog fill |
| `color/text/primary` | Body copy | Default text color everywhere | Never used at less than AA contrast against its background variable | Companion message text |
| `color/text/secondary` | Meta/supporting text | Timestamps, captions, helper text | Must still pass AA at `body-sm`/`caption` sizes | Memory Card timestamp |
| `color/text/disabled` | Disabled control labels | Disabled Button/Input text only | Never used for meaningful content the user needs to read | Disabled Button label |
| `color/accent/insight` | Genuine memory/insight moments | Insight Card accent, focus ring, gold badge | **Scarcity rule**: never applied to a component that isn't a verified memory/insight moment — a designer adding this color to a new component must cite which Product Bible rule justifies it | Insight Card border, Memory Recall animation |
| `color/accent/reflection` | Journal-specific accents | Journal composer accent only | Not used outside the Journal module | Journal entry indicator |
| `color/accent/trust` | Success/confirmation | Toast success, Switch "on" state, save confirmation | Never used for anything other than a genuinely completed, positive action | Settings save confirmation |
| `color/accent/caution` | Warnings/errors | Error text, Input error border, destructive Dialog accent | Never a bright/saturated red — stays within the muted rust value | Failed export error state |
| `color/border/subtle` | Default hairlines | List dividers, Card borders | 1px only, never doubled | Settings list divider |
| `color/border/focus` | Keyboard focus ring | Every focusable element | Reuses `color/accent/insight` — never a separate focus color | Input focus state |

**Mode behavior**: every token above resolves differently under the `Dark` (default) and `Light` modes (FIGMA-01, Section 6) — component instances never hardcode a mode-specific value.

---

## 2. Typography Tokens

| Token | Font | Size | Line-height | Use | Rules |
|---|---|---|---|---|---|
| `type/display-xl` | Fraunces | 3.5rem / 56px | 1.1 | Landing hero only | Never used in-app |
| `type/display-lg` | Fraunces | 2.5rem / 40px | 1.15 | Section heroes | — |
| `type/heading-lg` | Karla, 600 | 1.75rem / 28px | 1.25 | Screen titles | One per screen |
| `type/heading-md` | Karla, 600 | 1.375rem / 22px | 1.3 | Section headers | — |
| `type/body-lg` | Karla, 400 | 1.125rem / 18px | 1.5 | Emphasized body copy | — |
| `type/body-md` | Karla, 400 | 1rem / 16px | 1.5 | Default body, minimum size on mobile | Never smaller than this for primary content |
| `type/body-sm` | Karla, 400 | 0.875rem / 14px | 1.4 | Meta text | — |
| `type/caption` | Karla, 400 | 0.75rem / 12px | 1.3 | Timestamps, labels | Smallest permitted size anywhere |
| `type/companion-voice` | Fraunces, 400 | `body-md` size | 1.5 | Companion messages, Report narrative, any first-person AI voice | Never applied to user-authored or system/UI text |
| `type/data-mono` | IBM Plex Mono, 400 | `body-sm` size | 1.4 | Numerology numbers, chart degrees, timestamps in data tables | Reserved for precise/structured data only |

**Rule**: `type/companion-voice` (Fraunces) is applied only where content is literally spoken by the Companion or narrated in its voice (Reports). Applying it to ordinary UI copy is a defect, not a stylistic choice — it's the single typographic signal distinguishing "the Companion said this" from "the interface says this."

---

## 3. Spacing Tokens

| Token | Value | Typical use |
|---|---|---|
| `space/1` | 4px | Icon-to-label gap |
| `space/2` | 8px | Label-to-field gap, tight internal padding |
| `space/3` | 12px | Button internal padding, list item gap |
| `space/4` | 16px | Card internal padding, standard component gap |
| `space/6` | 24px | Section gap within a screen |
| `space/8` | 32px | Major section separation |
| `space/12` | 48px | Screen-level top/bottom margins (mobile) |
| `space/16` | 64px | Screen-level top/bottom margins (desktop), Landing section spacing |

**Rule**: every Auto Layout padding/gap value in every component and screen references one of these — no arbitrary value is ever typed directly into an Auto Layout field.

---

## 4. Radius Tokens

| Token | Value | Use |
|---|---|---|
| `radius/sm` | 8px | Chips, Badges, Tags |
| `radius/md` | 12px | Buttons, Inputs |
| `radius/lg` | 20px | Cards |
| `radius/xl` | 28px | Dialogs, Bottom Sheets, Drawers |
| `radius/full` | 9999px | Avatars, icon-only circular Buttons only |

**Rule**: never `0px` on any consumer-facing surface (Admin module exempted, per DG04's Admin screen note — Admin may use tighter, denser controls but still uses `radius/sm` minimum, never true sharp corners).

---

## 5. Elevation Tokens

| Token | Expression | Use |
|---|---|---|
| `elevation/0` | `color/bg/canvas` | Screen root |
| `elevation/1` | `color/bg/surface` | Cards, panels |
| `elevation/2` | `color/bg/surface-raised` | Modals, sheets |

Elevation is a **background-lightness step**, not a shadow value — see Section 6. A component "elevated" without changing its background token (relying on shadow alone) is a build defect.

---

## 6. Shadow Tokens

| Token | Value | Use |
|---|---|---|
| `shadow/sm` | 0 / 4px / 12px blur / `rgba(0,0,0,0.2)` | Drag/lift states, Dialogs, Bottom Sheets only |

This is the **only** shadow token in the system. No component may define a custom shadow value. Cards use `elevation/1` alone, with no shadow, as their default resting state.

---

## 7. Grid

| Breakpoint | Columns | Margin | Gutter | Max content width |
|---|---|---|---|---|
| Mobile (390px) | 4 | 16px | 8px | Fluid |
| Tablet (834px) | 8 | 32px | 16px | Fluid |
| Desktop (1280px+) | 12 | Fluid (centered) | 24px | 1120px (marketing sections) / 720px (reading column, Reports/Journal) |

---

## 8. Breakpoints

| Token | Value | Maps to |
|---|---|---|
| `breakpoint/mobile` | 0px | Default/base styles |
| `breakpoint/tablet` | 768px | Tablet layout activates |
| `breakpoint/desktop` | 1280px | Desktop layout, Sidebar nav activates |

---

## 9. Icons

Single rounded-stroke set, 24×24px artboard, 2px stroke weight, rounded caps/joins, built on the same 4px grid as spacing (DG01, Section 29). Every icon exists as one component with a `state` variant (`Default`/`Filled`) — filled reserved for active/selected states only. Icons never scale below 16px; below that size, use the simplified glyph variant where one exists (e.g., the Companion's constellation glyph, Section 11).

---

## 10. Illustration

The Constellation Thread motif exists as a parameterized component with a `density` variant (`Low`/`Medium`/`High`) matching its documented usage contexts (DG01, Section 30): Low for empty states, Medium for Dashboard ambient background and Journal empty state, High for Landing hero and first Onboarding moment. No other illustration style exists in the production library.

---

## 11. Motion Tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion/fast` | 200ms | ease-out | Routine UI (hover, press) |
| `motion/standard` | 250ms | ease-in-out | Page transitions, menu open/close |
| `motion/deliberate` | 600–900ms | custom organic (slow-start, gentle-settle) | Card Reveal, first chart/profile generation |
| `motion/report` | ~1500ms, staged | ease-out per section | Report progressive reveal |

**Rule**: duration scales with significance (Module 22, Section 8) — a designer proposing a new animated moment must select the token matching the moment's actual significance, never default to `motion/deliberate` because it "looks nicer."

Figma cannot natively preview custom cubic-bezier organic easing at production fidelity — every `motion/deliberate` and `motion/report` usage requires a written developer note (per-component, FIGMA-03/04) specifying the intended feel in words, since the prototype-mode approximation will be visually close but not exact.

---

## 12. Interaction Tokens

| Token | Behavior |
|---|---|
| `interaction/hover` | Subtle background-lightness shift only — no scale, no color-hue change |
| `interaction/press` | Slight opacity dip on the pressed element |
| `interaction/focus` | Visible ring using `color/border/focus`, never suppressed |
| `interaction/drag` | Applies `shadow/sm` for the duration of the drag only |

---

## 13. Accessibility Tokens

| Token | Value | Purpose |
|---|---|---|
| `a11y/target-min` | 44×44px | Minimum touch target, every interactive element |
| `a11y/contrast-min` | 4.5:1 (body text) / 3:1 (large text ≥24px or ≥19px bold) | WCAG AA floor for every text/background pairing |
| `a11y/motion-reduced` | Maps every `motion/*` token to an instant or minimal-fade equivalent | Applied automatically when `prefers-reduced-motion` is set |

---

## 14. Component Tokens

Component-specific token aliases exist where a component's usage is narrow enough to warrant a semantic name distinct from the raw token — e.g., `button/primary/bg` aliases to `color/text/primary` inverted against `color/accent/insight` at high-commitment moments only, rather than every Button instance manually selecting a raw color variable. This indirection is what lets a future palette adjustment update every Button at once without touching individual instances.

---

## 15. Semantic Colors

| Semantic name | Resolves to | Use |
|---|---|---|
| `semantic/success` | `color/accent/trust` | Toast, Switch on-state |
| `semantic/error` | `color/accent/caution` | Input error, error Toast |
| `semantic/significant` | `color/accent/insight` | Insight Card, Memory Card highlight |
| `semantic/informational` | `color/text/secondary` | Helper text, neutral Badge |

Designers reference semantic tokens in component definitions wherever a semantic meaning (not a literal color choice) is being made — this is what keeps Section 1's scarcity rule for `color/accent/insight` enforceable: a designer reaching for "the significant one" via `semantic/significant` is less likely to misapply the raw gold value decoratively than one picking a color from a swatch list.

---

**Continue to FIGMA-03.**
