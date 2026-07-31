# FIGMA-10 — DESIGN QA CHECKLISTS

*The final document in the BeaconVie Figma Specification (FIGMA-01 through FIGMA-10). Every checklist below is run before any component, pattern, or screen is marked implementation-ready.*

---

## Visual QA
- [ ] No color used outside the token set (FIGMA-02, Section 1)
- [ ] No typeface outside Fraunces / Karla / IBM Plex Mono
- [ ] `type/companion-voice` applied only to genuine AI-authored first-person content
- [ ] No shadow beyond `shadow/sm`; no shadow at all on default-state Cards
- [ ] Corner radius matches the token scale — never `0px` on consumer-facing surfaces
- [ ] Constellation Thread motif used only for genuine memory/insight moments; usage count reviewed per release
- [ ] Copy checked against the Design Guide's never-use / always-use word lists
- [ ] No component visually diverges from its shared definition (spot-check Memory Card, Insight Card, Report Timeline, AI Message across at least 5 different screens)

## UX QA
- [ ] Exactly one Primary CTA per screen
- [ ] Global Nav holds exactly 4 destinations + Settings
- [ ] No screen requires more than 2 taps from Global Nav to reach
- [ ] Dashboard resolves to at most one item per optional panel type
- [ ] Discovery never presents all four systems as a simultaneous menu
- [ ] Notification Center has no unread-count badge
- [ ] Community Feed is paginated, never infinite-scroll
- [ ] Every consequential/destructive action uses the Destructive Dialog with a specific, plain consequence statement
- [ ] No dark pattern present: symmetric friction between opt-in/opt-out, no pre-checked consent, no retention-offer maze on cancel

## Accessibility QA
- [ ] WCAG AA contrast (4.5:1 body / 3:1 large text) verified for every text/background pairing, both theme modes
- [ ] Every interactive element meets the 44×44px minimum touch target
- [ ] Every icon-only control has an accessible label
- [ ] Full keyboard operability and visible focus ring (`color/border/focus`) on every interactive element
- [ ] Color is never the sole carrier of meaning — verified with a grayscale/color-blind simulation pass
- [ ] Screen-reader structure verified for every Memory Card, Insight Card, and Report narrative (not just visual review)
- [ ] `prefers-reduced-motion` fallback present and correct for every animation beyond `motion/fast`
- [ ] Text-resize tested up to at least 200% without breaking layout

## Responsive QA
- [ ] Every screen built and reviewed at all three canonical widths (390 / 834 / 1280)
- [ ] Structure is identical across breakpoints — only density/padding/column-count differs
- [ ] No feature or content hidden on mobile that exists on desktop
- [ ] Reading-column content (Reports, Journal) respects the 720px cap on desktop
- [ ] Bottom Sheet (mobile) and Drawer (desktop) never both represent the same content simultaneously in a single flow

## Motion QA
- [ ] Duration matches significance per the token table (FIGMA-02, Section 11)
- [ ] No shake, bounce, elastic easing, or celebration/confetti sequence anywhere
- [ ] Loading states are always labeled — no bare, unlabeled spinner
- [ ] `motion/deliberate` reserved for genuinely significant reveal moments only (first chart generation, Card Reveal, Memory Recall) — not applied for visual flourish
- [ ] Skeleton loading uses static shape-matching, never a shimmer animation

## Dark Mode QA
- [ ] Every component built and validated dark-first
- [ ] Light mode reviewed for identical emotional register, not just passing contrast — a side-by-side reviewer check, not an automated one
- [ ] Mode-switch tested on every screen frame, confirming all nested components update correctly with no manual re-styling needed
- [ ] Light-mode `color/accent/insight` contrast specifically re-verified (flagged as marginal in the Design Guide)

## Localization QA
- [ ] Fraunces and Karla character-set support confirmed for each launched script
- [ ] Layout tested for ~30% text-expansion tolerance
- [ ] Copy tone re-evaluated (not literally translated) per locale, especially Companion-voice content
- [ ] Date/number formatting matches locale convention, particularly for Discovery-system birth-data entry

## Performance QA
- [ ] All illustration assets exported SVG-first
- [ ] No layout shift from late-loading fonts (font-display strategy confirmed with engineering)
- [ ] Landing's Core Web Vitals targets reviewed against the actual built assets, not just the design file
- [ ] Skeleton states match final content shape closely enough to prevent visible layout shift on resolve

## Consistency QA
- [ ] Memory Card, Insight Card, Report Timeline, and AI Message are component *instances*, never independently redrawn, on every screen that uses them
- [ ] No module introduces its own icon, illustration, or shadow style outside the shared system
- [ ] Premium screens use the identical Report/Insight Card visual language — spot-checked specifically against any temptation to make them "pop" more
- [ ] Companion voice (Fraunces + tone) is consistent across every AI-authored surface: Companion chat, Discovery interpretations, Report narration, Notification copy

---

## Sign-Off Requirements

| Change type | Required sign-off |
|---|---|
| New/modified Design Token | Design System lead + Design Director |
| Memory Card / Insight Card / Report Timeline / AI Message | Design lead + Frontend lead (dual, per DG05) |
| Any Safety/Trust-adjacent copy or flow (crisis handling, deletion, export) | Design lead + Product (Trust & Safety) reviewer |
| New screen or pattern | Design lead |
| Ordinary component/pattern iteration | Design lead + Frontend lead |

---

**This concludes the BeaconVie Figma Specification (FIGMA-01 through FIGMA-10).**

Together with the Product Bible (Modules 1–25) and the Design Guide (DG01–DG05), this specification gives a designer or frontend engineer everything needed to build BeaconVie without making a product decision: what to build (Product Bible), how it should feel (Design Guide), and exactly how to construct it in Figma and hand it to engineering (FIGMA-01–10).
