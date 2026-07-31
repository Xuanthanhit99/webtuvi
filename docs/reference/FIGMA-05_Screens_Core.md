# FIGMA-05 — SCREENS: CORE & UTILITY

*Full frame specifications for Landing, Authentication, Onboarding, Dashboard, Settings, Trust Center, and Profile. Each screen exists as three linked frames (Mobile 390 / Tablet 834 / Desktop 1280, FIGMA-01 Section 9) per named state, per FIGMA-01 Section 3's frame-naming convention.*

---

## Landing

**Purpose**: convert visitors into activated users with the correct mental model. **User Story**: as a visitor, I want to understand what BeaconVie is before I sign up.

| Field | Spec |
|---|---|
| Layout | Full-bleed sections, alternating `color/bg/canvas`/`color/bg/surface` background per Module 4's scroll-rhythm rule |
| Sections | Hero → Problem → Solution → How It Works → Discovery Systems → Companion → Memory → Testimonials → Pricing → FAQ → Footer |
| Hierarchy | One `<h1>` (Hero headline), sequential `<h2>` per section |
| Spacing | `space/16` between major sections (desktop), `space/8` (mobile) |
| Responsive Grid | 12-col (desktop) → 4-col (mobile), full-bleed hero at every width |
| Navigation | No Global Nav — Landing has its own minimal header (logo + single CTA) |
| Components | Hero illustration (Constellation, High density), Button (Primary), Card ×4 (Discovery preview), AI Message (static example, non-interactive), Report Card (Pricing) |
| Loading | SVG-first assets, no blocking JS for above-the-fold content |
| Skeleton | Not applicable — Landing is effectively static/server-rendered |
| Error | Calm offline banner if load fails entirely |
| Empty | N/A |
| Accessibility | Single `<h1>`, full contrast compliance, alt text on all illustration |
| Animation | Constellation connect on load (`motion/deliberate`); parallax used exactly once (Hero background only) |
| Developer Notes | Primary CTA phrase ("Meet your Companion") appears in exactly 3 places: Hero, Pricing, Footer — never more |
| Edge Cases | Logged-in user landing here is redirected straight to Dashboard, never shown the marketing page |

---

## Authentication

**Purpose**: establish identity in under 60 seconds. **User Story**: as a visitor, I want to sign in without friction.

| Field | Spec |
|---|---|
| Layout | Single centered Card, `radius/lg`, on `color/bg/canvas` |
| Sections | Method buttons (Google/Apple/Facebook) → divider → email/password fallback |
| Hierarchy | Method buttons visually equal weight; email fallback secondary |
| Spacing | `space/3` between method buttons, `space/6` above the email fallback |
| Responsive Grid | Card is `Fixed` width on desktop (max 420px), `Fill` with margin on mobile |
| Navigation | Back-to-Landing link only |
| Components | Button ×4 (3 OAuth + email/password submit), Input ×2 (email/password) |
| Loading | Labeled per-method ("Connecting to Google…") |
| Skeleton | N/A |
| Error | Inline, specific per field/failure type (FIGMA-03 Input error state) |
| Empty | N/A |
| Accessibility | Full keyboard support, visible labels |
| Animation | `motion/fast` only |
| Developer Notes | No birth data, username, or profile fields collected here under any circumstance |
| Edge Cases | Email-exists-during-registration routes to Login with email pre-filled; OAuth+email same-email auto-merges silently |

---

## Onboarding

**Purpose**: reach Activation within ~5 minutes. **User Story**: as a new user, I want to feel met by something real.

| Field | Spec |
|---|---|
| Layout | Single-column, full-screen conversational surface — near-identical shell to Companion (FIGMA-06), deliberately, per Product Bible Module 7's non-duplication principle |
| Sections | Welcome (brief, auto-continuing) → Meet Companion → Conversation (2–3 exchanges) → Reflection (Memory Card reveal) → Discovery Choice (optional) → Activation → Success (brief) → Dashboard handoff |
| Hierarchy | Companion's message is always the visual/reading priority |
| Spacing | Matches Companion Bubble spacing (FIGMA-04) |
| Responsive Grid | Single column at every breakpoint, no reduced mobile version |
| Navigation | A quiet, always-available "skip" affordance, never buried |
| Components | AI Message, Typing Indicator, Memory Card, Discovery Card (single suggestion), Input |
| Loading | Standard Typing Indicator |
| Skeleton | N/A |
| Error | Preserves typed input on any failure; calm retry |
| Empty | N/A |
| Accessibility | Full screen-reader support for streaming |
| Animation | Memory Recall (Memory Card reveal, FIGMA-04), Insight-adjacent Constellation Thread connect at the Activation moment |
| Developer Notes | The AI service invoked here is the same Companion service used post-Onboarding — never a separate "onboarding bot" |
| Edge Cases | Returning/re-authenticated user with existing memory never sees this flow again — routes straight to Dashboard |

---

## Dashboard

**Purpose**: answer "what's most meaningful right now" once per day. **User Story**: as a returning user, I want one clear next step.

| Field | Spec |
|---|---|
| Layout | Fixed vertical-stack template; sections present/absent based on server-resolved recommendation, never client-side filtered |
| Sections | Hero greeting → Companion Panel → (conditional, max one each) Memory Highlight / Discovery Suggestion / Journal Prompt / Report-ready → Recent Activity (quiet, collapsed) |
| Hierarchy | Hero + Companion Panel occupy the largest, topmost space always |
| Spacing | `space/6` between present sections |
| Responsive Grid | Same structural template at every breakpoint — density/padding only adapts |
| Navigation | Global Nav present (Sidebar/Bottom bar) |
| Components | AI Message (preview), Memory Card, Discovery Card (single), Journal Entry (prompt variant), Report Card (ready flag) |
| Loading | Skeleton matching exact final section layout |
| Skeleton | Per-section, matches final content shape |
| Error | Degrades to neutral greeting + open Companion invitation |
| Empty | New-user variant: Companion Panel only, all optional sections structurally absent (not empty-placeholder) |
| Accessibility | Absent sections removed from DOM entirely, never `display:none`-hidden |
| Animation | Standard fade/rise on load; no staggered delay that delays perceived readiness |
| Developer Notes | Client renders exactly what the single `GET /dashboard` payload specifies — it never receives multiple candidate recommendations to choose between |
| Edge Cases | Long-absence returning user gets "It's been a little while. I'm glad to see you again." — never "Welcome back!" |

---

## Settings

**Purpose**: the relationship control center. **User Story**: as a user, I want to understand and change anything the product does with my data.

| Field | Spec |
|---|---|
| Layout | Two-pane (category list + detail) on desktop; single-pane drill-down on mobile |
| Sections | Profile, Companion, Memory, Journal, Reports, Community, Notifications, Discovery, Premium, Language, Theme, Accessibility, Devices, Security, Privacy, Data, Support, About |
| Hierarchy | Relationship-facing categories (Profile/Companion/Memory) ordered before technical ones (Account/Security) |
| Spacing | `space/2` between list rows, `space/6` between category groups |
| Responsive Grid | 2-pane → drill-down at the tablet breakpoint |
| Navigation | Search box at the top; reachable from Global Nav |
| Components | List, Switch, Input, Dialog (destructive confirmations), Search Box |
| Loading | Standard skeleton, brief |
| Skeleton | Category list shape |
| Error | Revert to last known-good toggle state on failed save, with a clear inline message |
| Empty | N/A |
| Accessibility | Highest bar in the entire product — full keyboard/screen-reader across every category, no exceptions |
| Animation | `motion/fast` only; toggles apply and confirm immediately, no Save-button delay |
| Developer Notes | Every toggle's visual state must always reflect confirmed backend state — never optimistic-UI-only |
| Edge Cases | Delete Account and Delete-All-Memory both use the Destructive Dialog variant with a plain, specific consequence statement, never a generic "Are you sure?" |

---

## Trust Center

**Purpose**: consolidated, plain-language privacy/trust verification. **User Story**: as a user, I want to verify, in one place, what's true about my privacy.

| Field | Spec |
|---|---|
| Layout | Same two-pane/drill-down structure as Settings — visually a close sibling, not a separate "legal page" design |
| Sections | Privacy Dashboard, Permission Center, Activity History, Export Center, Delete Center, Transparency Report, Security Overview |
| Hierarchy | Privacy Dashboard (summary) first, deeper sections below |
| Spacing | Matches Settings exactly |
| Responsive Grid | Matches Settings |
| Navigation | Reachable from Settings and a dedicated entry point |
| Components | Card, List, Dialog |
| Loading | Standard skeleton |
| Skeleton | Matches Settings pattern |
| Error | Standard, calm error handling |
| Empty | N/A |
| Accessibility | Matches Settings' bar exactly |
| Animation | `motion/fast` only |
| Developer Notes | No content in this screen uses legal/dense typographic treatment — body copy uses the exact same `type/body-md` as everywhere else in the product |
| Edge Cases | Aggregate Transparency Report statistics (Admin-override count) update on a documented cadence, never in real time per-request |

---

## Profile

**Purpose**: minimal identity representation. **User Story**: as a user, I want to confirm who I am and adjust display name/avatar.

| Field | Spec |
|---|---|
| Layout | Single column, minimal |
| Sections | Display name, Avatar, (if set up) Discovery-system birth data summary with links to manage each |
| Hierarchy | Avatar + name at top, birth data summary below |
| Spacing | `space/4` between fields |
| Responsive Grid | Single column at every breakpoint |
| Navigation | Reachable from Settings |
| Components | Avatar, Input (display name), Card (birth data summary per Discovery system) |
| Loading | Standard, brief |
| Skeleton | Simple field-shape skeleton |
| Error | Standard save-failure handling |
| Empty | Initials-on-color-token avatar by default, no forced photo prompt |
| Accessibility | Standard form accessibility |
| Animation | `motion/fast` only |
| Developer Notes | No "profile completion %" indicator exists anywhere in this screen |
| Edge Cases | A user with no Discovery system set up sees no birth-data section at all — not an empty placeholder |

---

**Continue to FIGMA-06.**
