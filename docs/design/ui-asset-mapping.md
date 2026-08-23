# Tử Vi Tarot — UI Asset Mapping

Tracks every Board visual element against its real implementation, per each Board's asset policy.
One growing table across boards — never overwritten, only appended to.

| Board | Screen | Element | Type | Real source | Status | Implementation |
|---|---|---|---|---|---|---|
| 01 | Home (auth+guest) | Destiny Orbit | CODE_GENERATED_VISUAL | SVG/CSS, `aria-hidden` | READY | [destiny-orbit.tsx](../../apps/web/features/dashboard/components/home/destiny-orbit.tsx) |
| 01 | Home | Hero headline/greeting | REAL_API | `useAuth().user.displayName` | READY | [dashboard-view.tsx](../../apps/web/features/dashboard/components/dashboard-view.tsx) `HomeHero` |
| 01 | Home | "Vận trình hiện tại" (Đại Vận / Tiểu Hạn) | REAL_API | `tuViApi.listCharts` → `TuViChartDto.currentDaiVan/currentTieuHan` | READY | `HeroContextPanel`, `ForYouSection` |
| 01 | Home | "Tiếp tục hành trình" | REAL_API | latest of Tarot/Natal/Numerology by `createdAt` | READY | `buildContinuityItem` |
| 01 | Home | Sidebar/nav icons | UI_ICON | lucide-react (existing icon set) | READY | `nav-items.ts` |
| 01 | Home | 4 Discovery cards (Tử Vi/Tarot/Bản đồ sao/Thần số học) | CODE_GENERATED_VISUAL + REAL_API | inline SVG motifs; copy driven by latest chart/reading per module | READY | `TuViFeatureVisual`, `TarotFeatureVisual`, `NatalFeatureVisual`, `NumerologyFeatureVisual` |
| 01 | Home | Articles rail | STATIC_EDITORIAL | hand-authored fallback copy (no CMS/article API exists) | READY (static by design) | `editorialFallbacks` |
| 01 | Home | Community card | STATIC_EDITORIAL | honest "in progress" copy, links to real `/community` route | READY | `ForYouSection` |
| 01 | Home | Premium rail | REAL_API | `usePremiumStatus()` → `PremiumStatusDto` | READY | `PremiumRail` |
| 01 | Home | Notification bell + badge | REAL_API | `notificationsApi.unreadCount()` | READY (pre-existing) | [notification-bell.tsx](../../apps/web/features/notifications/components/notification-bell.tsx) |
| 01 | Global Shell | Sidebar Premium promo box | REAL_API | `usePremiumStatus()`, shown only when `!isPremium && paymentsEnabled` | READY (added this pass) | [sidebar.tsx](../../apps/web/components/layout/sidebar.tsx) |
| 01 | Global Shell | Topbar profile control (avatar + name + dropdown) | REAL_API | `useAuth().user.displayName`; initials-only avatar (no `avatarUrl` field exists — never fabricated) | READY (added this pass) | [app-header.tsx](../../apps/web/components/layout/app-header.tsx) `ProfileMenu` |
| 01 | Global Shell | Topbar search input | MISSING_ASSET | no site/content search API exists in the repo | NOT_AVAILABLE — intentionally omitted | not implemented; would need a real search backend, out of scope for a Home+Shell pass |
| 01 | Global Shell | Sidebar "Lịch sử" / "Sự kiện" nav items | MISSING_ASSET | no `/history` or `/events` route exists | NOT_AVAILABLE — intentionally omitted | not added; would be a fake route |
| 01 | Global Shell | Guest top nav | REAL_API/DECORATIVE mix | static brand nav + real `/login`, `/register` links | READY (pre-existing) | `home-route.tsx` `GuestHeader` |
| 01 | Global Shell | Mobile bottom nav | REAL_API | same `NAV_ITEMS` as sidebar, phone-only subset | READY (pre-existing) | [mobile-navigation.tsx](../../apps/web/components/layout/mobile-navigation.tsx) |
| 02 | Tử Vi Landing | Hero headline/CTA | STATIC_EDITORIAL | fixed copy, CTA is an in-page anchor to the real form | READY (added this pass) | [tu-vi-hero.tsx](../../apps/web/features/tu-vi/components/tu-vi-hero.tsx) |
| 02 | Tử Vi Landing | Hero decorative visual | CODE_GENERATED_VISUAL | reuses Board 01's `DestinyOrbit` (already generic/system-agnostic, `aria-hidden`) — not a second graphic | READY (added this pass) | `tu-vi-hero.tsx` |
| 02 | Tử Vi Landing | Trust/feature row (Chính xác/Khoa học/Chi tiết/Chu kỳ vận mệnh) | STATIC_EDITORIAL | methodology claims already substantiated by `TuViTrustSection`'s glossary — no numbers, no user data | READY (added this pass) | `tu-vi-hero.tsx` |
| 02 | Create-chart form | Birth date / time / sex fields | REAL_API | `POST /tu-vi/calculate` (`CalculateTuViChartDto`) | READY (pre-existing, polish only) | [tu-vi-form.tsx](../../apps/web/features/tu-vi/components/tu-vi-form.tsx) |
| 02 | Create-chart form | "Nơi sinh" (birth place) field shown in Board 02 mockup | MISSING_ASSET | `TuViChartDto`/`CalculateTuViChartDto` have no location field — Tử Vi Đẩu Số's calculation does not use birth place | NOT_AVAILABLE — intentionally omitted | not added; would be a fake, unused field |
| 02 | Calculation state | "Đang lập lá số cho bạn…" loading panel | REAL_DYNAMIC | real `useMutation` pending state, no fake progress percentage | READY (added this pass) | `tu-vi-form.tsx` |
| 02 | Result overview | Mệnh / Thân / Cục / Can Chi / Giờ sinh summary panel | REAL_ENGINE | `TuViChartDto.palaces`, `.cuc`, `.canChi`, `.hourBranch` | READY (pre-existing, polish only) | [tu-vi-chart-view.tsx](../../apps/web/features/tu-vi/components/tu-vi-chart-view.tsx) |
| 02 | Result overview | "Deterministic — never AI-generated" disclosure | REAL_DYNAMIC | static badge, always true for this surface | READY (pre-existing) | `tu-vi-chart-view.tsx` |
| 02 | 12-palace chart | Palace grid (roles, branches, Mệnh/Thân markers) | REAL_ENGINE | `TuViChartDto.palaces.layout` via `buildPalaceCells` | READY (pre-existing, polish only) | [tu-vi-palace-grid.tsx](../../apps/web/features/tu-vi/components/tu-vi-palace-grid.tsx) |
| 02 | 12-palace chart | Principal/auxiliary star placement | REAL_ENGINE | `TuViChartDto.mainStars[]` / `.auxiliaryStars[]` | READY (pre-existing, polish only) | `tu-vi-palace-grid.tsx` |
| 02 | 12-palace chart | Miếu/Vượng/Đắc/Hãm dignity badges | REAL_ENGINE | `TuViMainStarPlacementDto.dignity` — 5-state palette, color+text together, never color-only, never a numeric score | READY (polished this pass: compact pill badge) | `tu-vi-palace-grid.tsx` `DIGNITY_TONE` |
| 02 | 12-palace chart | Tứ Hóa superscript tags | REAL_ENGINE | `TuViChartDto.transformations[]` | READY (pre-existing) | `tu-vi-palace-grid.tsx` |
| 02 | 12-palace chart | Tuần/Triệt palace markers | REAL_ENGINE | `TuViChartDto.tuan` / `.triet` | READY (pre-existing) | `tu-vi-palace-grid.tsx` |
| 02 | Palace interaction | Click-to-expand palace detail | N/A | grid cells already render full detail inline (role, branch, stars, dignity, Tuần/Triệt) — no separate detail view needed | EXPECTED_BEHAVIOR | preserved as-is, not rebuilt into a new interaction paradigm |
| 02 | Đại Vận | 10-year cycle timeline + current-cycle highlight | REAL_DYNAMIC | `TuViChartDto.daiVan[]` / `.currentDaiVan` (server-computed fresh every read) | READY (pre-existing, polish only) | [tu-vi-dai-van-timeline.tsx](../../apps/web/features/tu-vi/components/tu-vi-dai-van-timeline.tsx) |
| 02 | Đại Vận | Chính tinh / Phụ tinh for the selected cycle's palace | REAL_ENGINE (derived) | real cross-reference: `chart.mainStars`/`.auxiliaryStars` filtered by the selected cycle's own `position` branch — same technique the palace grid already uses, not fabricated | READY (added this pass) | `tu-vi-dai-van-timeline.tsx` |
| 02 | Tiểu Hạn | Annual cycle year window + current-year highlight | REAL_DYNAMIC | `TuViChartDto.nearbyTieuHan[]` / `.currentTieuHan` (server-computed, ±2yr window) | READY (pre-existing) | [tu-vi-tieu-han-year-nav.tsx](../../apps/web/features/tu-vi/components/tu-vi-tieu-han-year-nav.tsx) |
| 02 | Tiểu Hạn | Chính tinh / Phụ tinh for the current year's palace | REAL_ENGINE (derived) | same real cross-reference technique as Đại Vận, filtered by `currentTieuHan.palace` | READY (added this pass) | `tu-vi-tieu-han-year-nav.tsx` |
| 02 | AI Interpretation | Narration text + "written by AI, never chooses/changes facts" disclosure | AI_INTERPRETATION | `TuViChartDto.interpretation` (single string contract — no per-topic tabs fabricated) | READY (pre-existing, untouched — shared component also used by Tarot/Numerology) | [ai-interpretation.tsx](../../apps/web/components/ui/ai-interpretation.tsx) |
| 02 | AI Interpretation | Board 02 mockup's per-topic tabs (Tổng quan/Sự nghiệp/Tài chính/Tình duyên/Sức khỏe) | MISSING_ASSET | API returns one interpretation string, not per-topic sections | NOT_AVAILABLE — intentionally omitted | not fabricated; would misrepresent the real interpretation contract |
| 02 | Trust section | VDTTL-1956 methodology glossary/disclosure | STATIC_EDITORIAL | fixed glossary + source citation, deliberately never shows internal rule IDs/versions to users | READY (pre-existing) | [tu-vi-trust-section.tsx](../../apps/web/features/tu-vi/components/tu-vi-trust-section.tsx) |
| 02 | History | Saved lá số list + free-plan cap notice | REAL_API | `GET /tu-vi/charts`, `usePremiumStatus()` | READY (pre-existing, polish only) | [tu-vi-history-list.tsx](../../apps/web/features/tu-vi/components/tu-vi-history-list.tsx) |
| 02 | Lifecycle actions | Archive / Restore / Delete | REAL_API | `POST /tu-vi/charts/:id/archive|restore`, `DELETE /tu-vi/charts/:id` | READY (pre-existing) | `tu-vi-chart-view.tsx` |
| 02 | Calculation details | Engine/ruleset/star/auxiliary version strings | REAL_PERSISTED | `TuViChartDto.versions.*` | READY (pre-existing) — tucked in a collapsed "Calculation details" section, never surfaced prominently to normal users | `tu-vi-chart-view.tsx` |
| 03 | Tarot Landing | Hero deck composition | EXISTING_PRODUCTION_ASSET | real card back + selected canonical front artwork (`17-the-star.webp`, `cups-ace.webp`) | READY | [tarot-draw-panel.tsx](../../apps/web/features/tarot/components/tarot-draw-panel.tsx) |
| 03 | Tarot Landing | Reflection-not-prediction disclosure | STATIC_EDITORIAL | fixed safety/product copy, no prediction claim | READY | `TarotDrawPanel` |
| 03 | Topic / Intention | Six intention choices | CODE_GENERATED_VISUAL | local UI state only; no fake backend topic enum persisted | READY | `TarotDrawPanel` |
| 03 | Question | Optional question textarea | REAL_API | sent only to `POST /tarot/draw` when non-empty and not Daily Draw; not analytics | READY | `TarotDrawPanel`, [tarot-api.ts](../../apps/web/features/tarot/api/tarot-api.ts) |
| 03 | Spread Selection | Daily Draw / Single Card / Three Card | REAL_API | `DrawReadingDto.type` supports `DAILY_DRAW`, `SINGLE_CARD`, `THREE_CARD`; no fake 5-card spread | READY | `TarotDrawPanel`, [draw-reading.dto.ts](../../apps/api/src/tarot/dto/draw-reading.dto.ts) |
| 03 | Focus / Shuffle | Face-down animated deck fan | EXISTING_PRODUCTION_ASSET + CODE_GENERATED_VISUAL | real shared card back, CSS transforms only | READY | `TarotDrawPanel` |
| 03 | Card Selection | Face-down selectable slots | EXISTING_PRODUCTION_ASSET + REAL_API | selected slot never submits card ID; server draw is already authoritative | READY | `TarotDrawPanel` |
| 03 | Card Back | Shared back artwork | EXISTING_PRODUCTION_ASSET | `/assets/tarot/card-back.webp` | READY | [artwork.ts](../../apps/web/features/tarot/artwork.ts), [tarot-card-face.tsx](../../apps/web/features/tarot/components/tarot-card-face.tsx) |
| 03 | Reveal / Result Cards | Front artwork | FOUNDER_SUPPLIED_ARTWORK | 78 canonical `.webp` files under `/assets/tarot-card/` resolved from card identity | READY | `resolveTarotArtworkSrc`, `TarotCardFace` |
| 03 | Upright / Reversed | Orientation badge + physical reversed artwork | REAL_PERSISTED | `TarotReadingCardDto.isReversed`; card image rotates 180deg while text remains readable | READY | `TarotReadingView`, `TarotCardFace` |
| 03 | Canonical Meanings | Position, name, VI name, keywords, meanings | REAL_API | `TarotCardDto` + persisted spread position labels | READY | [tarot-reading-view.tsx](../../apps/web/features/tarot/components/tarot-reading-view.tsx) |
| 03 | Topic Meanings | Love / Career / Finance / Self blocks | REAL_API | `TarotCardDto.loveMeaning/careerMeaning/financeMeaning/selfMeaning` | READY | `TarotReadingView`, [tarot-card-detail-dialog.tsx](../../apps/web/features/tarot/components/tarot-card-detail-dialog.tsx) |
| 03 | AI Synthesis | AI interpretation panel + retry | AI_INTERPRETATION | `TarotReadingDto.interpretation`, retry via `POST /tarot/readings/:id/interpret` | READY | `TarotReadingView`, [tarot-record.service.ts](../../apps/api/src/tarot/record/tarot-record.service.ts) |
| 03 | Reflection | Prompt list | REAL_API | `TarotCardDto.reflectionPrompts` from canonical 78-card seed | READY | `TarotReadingView`, `TarotCardDetailDialog` |
| 03 | History | Saved readings list | REAL_API | `GET /tarot/readings`, owner-scoped; shows date/time, spread, cards, orientation | READY | [tarot-history-list.tsx](../../apps/web/features/tarot/components/tarot-history-list.tsx) |
| 03 | Reopen Exact Reading | In-place detail route | REAL_API | `GET /tarot/readings/:id`, same `?item=` pattern as existing modules | READY | [tarot-dashboard.tsx](../../apps/web/features/tarot/components/tarot-dashboard.tsx), [tarot-reading-detail.tsx](../../apps/web/features/tarot/components/tarot-reading-detail.tsx) |
| 03 | Daily Tarot | Daily Draw spread | REAL_API | `DAILY_DRAW`; server enforces one UTC-day draw per user | READY | `TarotRecordService.assertNoDailyDrawToday` |
| 03 | Tarot Library 78 | Filterable deck grid | REAL_API + FOUNDER_SUPPLIED_ARTWORK | `GET /tarot/deck`; filters All/Major/Wands/Cups/Swords/Pentacles | READY | [tarot-library.tsx](../../apps/web/features/tarot/components/tarot-library.tsx) |
| 03 | Card Detail | Artwork + structured facts modal | REAL_API + FOUNDER_SUPPLIED_ARTWORK | selected `TarotCardDto` and resolved artwork path | READY | `TarotCardDetailDialog` |
| 03 | Purple Tint Treatment | Global artwork tint/filter | MISSING | deliberately absent; no global filter/blend/overlay applied to Tarot artwork | READY (absence verified) | `TarotCardFace` uses `object-contain` with no tint/filter |

## Notes — Board 01

- No new nav destinations were invented. Board 01 shows "Lịch sử" and "Sự kiện" in the sidebar and
  "Hồ sơ của tôi" as a separate page; none of these routes exist in the repo, so they were not
  added. The `/community` route does exist (marketing page) and is already linked honestly with
  "feature being finished" copy.
- The Board 01 topbar search field has no backing API in this codebase (`grep` across
  `apps/web/features` found no search feature). Rather than ship a decorative/dead search input,
  it was left out — flagged here as `MISSING_ASSET` for a future, real search implementation.
- Percentage/score widgets shown in some Board 01 sub-panels ("78/100", "Công việc 82", etc.) are
  not implemented anywhere in this codebase and were not added — there is no verified computation
  backing them (per the Board 01 brief's explicit prohibition on fabricated personalization scores).

## Notes — Board 02

- The Tử Vi engine, persistence, API, and DTO contract were not modified in any way this pass —
  this was a UI/visual pass only, over an already-complete, already-tested (404 backend unit tests,
  full Playwright e2e) deterministic system. See `docs/domain/tu-vi/canonical-ruleset-v1.md` for the
  frozen ruleset (`VDTTL_1956`) this pass deliberately did not touch.
- Board 02's mockup shows a "Nơi sinh" (birth place) field on the create-chart form. The real
  `CalculateTuViChartDto`/`TuViChartDto` contract has no location field at all — Vietnamese Tử Vi
  Đẩu Số's calculation depends only on lunar date, hour branch, and sex, never geography. This field
  was deliberately not added, matching the Board 01 precedent of omitting the mockup's search bar.
- Board 02's mockup shows the AI Interpretation panel split into topic tabs (Tổng quan/Sự
  nghiệp/Tài chính/Tình duyên/Sức khỏe). The real API returns one `interpretation` string, not
  per-topic sections — inventing tabs would misrepresent what the AI actually generated, so the
  shared `AiInterpretation` component (also used by Tarot and Numerology) was left untouched.
- The two genuine data enhancements this pass added — Chính tinh/Phụ tinh cross-referenced per
  selected Đại Vận cycle and per current Tiểu Hạn year — are not new engine computations. They
  filter the chart's own already-computed `mainStars`/`auxiliaryStars` arrays by the cycle's/year's
  `position`/`palace` branch, exactly the same technique `TuViPalaceGrid` already used for the main
  grid. No new deterministic fact was invented.
