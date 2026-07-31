# FIGMA-07 — SCREENS: COMMUNITY, NOTIFICATIONS, PREMIUM, ADMIN

---

## Community — Groups (Overview)

**Purpose**: pseudonymous, opt-in mutual support space. **User Story**: as a user, I want to feel less alone without giving up privacy.

| Field | Spec |
|---|---|
| Layout | Groups/Circles list as the entry point — never a single global feed default |
| Sections | Group cards (theme-organized) → join/browse action |
| Hierarchy | Groups are peer-weighted Cards, no algorithmic "recommended for you" ranking visual treatment |
| Spacing | `space/4` between Group cards |
| Responsive Grid | Grid on desktop, single column on mobile |
| Navigation | Reachable from Dashboard, direct nav, Reports pattern-mention |
| Components | Card, Chip (theme tags) |
| Loading | Standard skeleton grid |
| Skeleton | Card-shaped placeholders |
| Error | Standard error handling |
| Empty | "Patterns from others will show up here as the community grows" |
| Accessibility | Full keyboard/screen-reader support |
| Animation | Standard reveal |
| Developer Notes | No follower/following relationship exists anywhere in this screen's data model |
| Edge Cases | A new user with zero Community activity sees this screen with no pressure to join anything |

---

## Community — Posts (Feed within a Group)

**Purpose**: paginated, theme-scoped discussion. **User Story**: as a member, I want to read and contribute without an infinite, algorithmic feed.

| Field | Spec |
|---|---|
| Layout | Paginated List (never infinite scroll) within a selected Group |
| Sections | Group header → post list → pagination controls → composer (new post/question) |
| Hierarchy | Posts ranked by recency/relevance only — no engagement-prediction visual weighting |
| Spacing | `space/3` between posts |
| Responsive Grid | Single column at every breakpoint |
| Navigation | Back to Groups overview |
| Components | List, Pagination, Chip (reactions — supportive only, no numeric like-count-as-status) |
| Loading | Standard skeleton |
| Skeleton | List-shaped placeholders |
| Error | Transparent moderation-action explanation if content was removed |
| Empty | "Nothing here yet" invitation framing |
| Accessibility | Full keyboard/screen-reader support for posting, reply, and report actions |
| Animation | Standard reveal |
| Developer Notes | `author_pseudo_id` is used throughout this screen's data layer — never the user's core account identity, enforced at the schema level, not just the UI |
| Edge Cases | A report action produces a calm acknowledgment, never an exposed view into moderation internals |

---

## Notifications (Center)

**Purpose**: chronological record of past notifications. **User Story**: as a user, I want to review what I've been notified about, calmly.

| Field | Spec |
|---|---|
| Layout | Single List, grouped by relative time |
| Sections | Notification list (Section-grouped: Today / This Week / Earlier) |
| Hierarchy | No unread-count indicator anywhere on this screen or its Global Nav entry point |
| Spacing | `space/3` between entries |
| Responsive Grid | Single column at every breakpoint |
| Navigation | Reachable from Global Nav / push notification tap |
| Components | Notification (list item, category-coded), List |
| Loading | Standard skeleton |
| Skeleton | List-shaped placeholders |
| Error | N/A |
| Empty | Calm, unremarkable — explicitly no CTA required |
| Accessibility | Full screen-reader labeling per category |
| Animation | Standard reveal — no attention-grabbing entrance animation |
| Developer Notes | This screen's design should feel deliberately unremarkable — a healthy, correctly-calibrated system produces a short, quiet list most of the time |
| Edge Cases | A category with zero recent items simply doesn't group-header at all, rather than showing an empty group header |

---

## Premium / Subscription

**Purpose**: transparent, non-pressured upgrade surface. **User Story**: as a user who's felt real value, I want to deepen the relationship.

| Field | Spec |
|---|---|
| Layout | Felt-value recap (a real, specific Insight/Memory Card) → plan comparison → single CTA |
| Sections | Recap → Free/Premium comparison (side-by-side) → CTA → (if reached via Settings) plain FAQ |
| Hierarchy | The recap is the emotional anchor — plan comparison is secondary, factual |
| Spacing | `space/6` between recap and comparison |
| Responsive Grid | Side-by-side plans on desktop, stacked on mobile |
| Navigation | Reachable only via contextual triggers (post-Report, post-Insight moment) or Settings — never an ambient nav badge |
| Components | Premium Card (reuses Report/Insight Card visual language exactly), Button |
| Loading | Standard, explicitly **no** special celebratory activation flourish |
| Skeleton | Standard Card-shaped placeholder |
| Error | Clear, specific payment-failure messaging naming the actual reason where known |
| Empty | N/A |
| Accessibility | Full keyboard/screen-reader support |
| Animation | Standard timing only |
| Developer Notes | This screen's visual QA should specifically confirm it does *not* look more polished, more colorful, or more "sold" than a Report screen — deliberate visual sameness is the goal, not an oversight |
| Edge Cases | Downgrade/cancellation flow uses the identical friction level as upgrade — no retention-offer maze |

---

## Admin

**Purpose**: internal trust & safety, content curation, system health. **User Story**: as internal staff, I want dense, clear operational tooling.

| Field | Spec |
|---|---|
| Layout | Dense, desktop-primary — this is the one screen exempted from the product's consumer-facing minimal-density rule |
| Sections | Content curation (Discovery reference data), Moderation queue (Community), Audit log viewer, System health dashboards |
| Hierarchy | Data-table-forward; clarity and scanability prioritized over calm/warm register (internal audience, not end user) |
| Spacing | Tighter than consumer screens — `space/2`/`space/3` row spacing acceptable here |
| Responsive Grid | Desktop-only; not optimized for mobile |
| Navigation | Internal staff authentication only, separate from consumer auth |
| Components | Table, List |
| Loading | Standard |
| Skeleton | Table-row-shaped placeholders |
| Error | Standard technical error handling, more verbose/technical than consumer-facing copy is permitted to be elsewhere |
| Empty | Standard, minimal |
| Accessibility | Still genuinely accessible (keyboard/screen-reader) — the exemption is from the *visual calm/minimal-density* rule only, never from accessibility itself |
| Animation | None |
| Developer Notes | This is the only screen in the entire product where `radius/sm` (not `radius/lg`) is an acceptable default for containers, given its data-density needs |
| Edge Cases | Any Admin action that touches an individual user's personal Memory/Journal content requires the audited, reason-required override flow — this screen never exposes ambient personal content browsing |

---

**Continue to FIGMA-08.**
