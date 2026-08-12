# Mệnh Vi — Reference Breakdown

Source: single desktop reference screenshot supplied 2026-08-12 ("home / dashboard" view,
1536px-wide composite with an inset "MOBILE – TRẢI NGHIỆM TỐI ƯU" callout showing two phone
mockups, and a bottom meta-commentary strip).

**Scope note:** this is a design *exploration*, built as an isolated route (`/menh-vi`), not a
rebrand of BeaconVie. See implementation summary in the session for the product-identity decision.
No API contracts, existing routes, or Sprint 9 (natal chart) files are touched.

## 0. What is and isn't "the design"

Two regions of the screenshot are **not** product UI to reproduce:

1. **Bottom strip** ("ĐÁNH GIÁ TỔNG QUAN 10/10", "ĐIỂM NỔI BẬT", "THAM KHẢO TỪ CÁC WEB/APP HÀNG
   ĐẦU", "PHẢN HỒI NGƯỜI DÙNG", "CÔNG NGHỆ GỢI Ý") — this is the reference-image generator's own
   self-critique/annotation panel, not a screen a real user would see. **Excluded entirely.**
2. **Right-hand "MOBILE – TRẢI NGHIỆM TỐI ƯU" column** — two phone mockups presented as a
   callout/inset, not part of the desktop page's DOM. **Used only as reference for the mobile
   layout pass**, not reproduced as a literal element on the desktop page.

## 1. Navigation — reference fidelity supersedes the earlier deviation

**Round 1 decision (superseded):** the screenshot shows two full navigation systems at once — a
top horizontal nav and a large left sidebar — and Round 1 dropped the sidebar as an enterprise-
dashboard pattern the brief's own art direction warned against.

**Round 2 (current):** an explicit follow-up brief overrode this call — "REFERENCE FIDELITY wins"
— and asked for the sidebar to be restored alongside the top nav, matching the screenshot exactly.
Implemented as `MvSidebar` (desktop-only, `hidden desktop:flex`, 1280px+): full 11-item nav list,
active gold state with chevron, Premium upsell card, "Mệnh Vi trên mobile" card. The top nav keeps
its smaller set (now including Cộng đồng) and sits above the sidebar as a full-width bar, exactly
as in the reference. Mobile is unaffected — it never rendered the sidebar and keeps its own
bottom-tab composition per §13 of the brief.

Five sidebar destinations had no existing route (Tình duyên, Sự nghiệp, Tài chính, Sức khỏe, Nhật
ký vận mệnh) and were added as honest `MvComingSoon` pages, consistent with the existing pattern
for La Số/Bản Đồ Sao/etc. in Round 1 — not fabricated features, just the same "coming soon" honesty
extended to the newly-visible nav items.

## 2. Page structure (desktop, top nav variant)

```
┌─────────────────────────────────────────────────────────────────┐
│ Top nav: logo · Hôm nay/Lá số/Tarot/Bản đồ sao/Thần số/Khám phá · search/gift/bell/avatar │
├─────────────────────────────────────────────────────────────────┤
│ Hero band (deep violet/navy gradient, faint stars + planet silhouettes) │
│   Greeting (time · date, "Chào buổi tối, {name} ✦", supporting line)     │
│   Destiny Orbit (center) with 4 satellite stat chips (Tình cảm / Sự     │
│   nghiệp / Tài lộc / Nội tâm) + "Xem lời chúc hôm nay" CTA               │
├─────────────────────────────────────────────────────────────────┤
│ Right column (within hero band width, stacked cards):                   │
│   "ĐIỀU ĐÁNG CHÚ Ý" spotlight card                                       │
│   2×2 grid of dimension detail cards (Tình cảm/Sự nghiệp/Tài chính/Nội tâm)│
│   "SỰ KIỆN SẮP DIỄN RA" event list (3 rows)                              │
├─────────────────────────────────────────────────────────────────┤
│ "KHÁM PHÁ VẬN MỆNH" — 4-up feature card row (Tử Vi/Tarot/Bản đồ sao/Thần số học) │
├─────────────────────────────────────────────────────────────────┤
│ 3-up row: Tarot teaser · Compatibility · Life timeline    │  Star-map CTA card (right) │
├─────────────────────────────────────────────────────────────────┤
│ (excluded: bottom meta-commentary strip)                                │
└─────────────────────────────────────────────────────────────────┘
```

Grid: 2-column at desktop — a wider left column (hero + tools + teasers) and a narrower right
rail (spotlight/events/star-map), consistent with the screenshot's proportions (~65/35 split).

## 3. Spacing & proportions (approximate, derived from screenshot proportions)

- Page max-width: ~1280–1400px, centered, with generous outer gutter (matches existing
  `maxWidth.content: 1120px` token family — Mệnh Vi uses a slightly wider `1360px` variant given
  the denser 2-column layout).
- Section vertical rhythm: ~40–48px between major sections, ~16–20px between cards in a row.
- Card corner radius: large, ~20–24px on hero/feature cards, ~16px on smaller stat chips —
  matches existing `borderRadius.lg (20px)` / `xl (28px)` tokens closely enough to reuse them.
- Card padding: spacious, ~24–28px, never cramped — insight/today cards read as "one thought per
  card," not dense tables.

## 4. Typography hierarchy

| Role | Reference treatment | Mapping |
|---|---|---|
| Brand wordmark "MỆNH VI" | Serif, letter-spaced, gold | `font-display` (Playfair Display — already loaded globally, Vietnamese subset verified) |
| Greeting "Chào buổi tối, Thành ✦" | Large serif, warm | `font-display` |
| Section labels ("KHÁM PHÁ VẬN MỆNH", "SỰ KIỆN SẮP DIỄN RA") | Small caps, letter-spaced, muted gold | `font-body` uppercase + tracking-wide |
| Body/nav/card copy | Humanist sans | `font-body` (Be Vietnam Pro — already loaded globally, Vietnamese subset verified) |
| Orbit center number "78" | Large serif or sans numeral, gold | `font-display` |

No new font loading is required — both fonts the brief recommends are already wired into
`apps/web/app/layout.tsx` for BeaconVie and carry the `vietnamese` subset.

## 5. Color reading (screenshot vs. brief foundation)

The screenshot itself skews slightly more indigo/blue than the brief's stated hex foundation.
We follow the **brief's explicit hex values** (source of truth per its own instruction) rather
than eyeballing the image, since the brief supplies exact tokens. See `tailwind.config.ts` `mv-*`
additions for the resulting scale.

## 6. Component-by-component CODE vs ASSET classification

| Element | Classification | Notes |
|---|---|---|
| Top nav bar | CODE | flex layout, backdrop-blur, active-state underline |
| Logo mark (compass/star glyph) | ASSET (P1) | small enough to hand-draw in SVG as an interim; brief allows simple geometric marks as CODE, so we ship an SVG glyph now and treat a refined illustrated version as optional polish |
| Background stars/constellation lines | CODE | SVG/CSS, sparse, static and animated variants |
| Background planet/mountain silhouettes (hero) | ASSET (P2) | decorative, not load-bearing; CSS gradient blobs substitute until asset lands |
| Destiny Orbit rings, glow, dots, labels | CODE | SVG, slow rotation, respects `prefers-reduced-motion` |
| Stat chips (Tình cảm/Sự nghiệp/Tài lộc/Nội tâm) | CODE | icon (lucide) + number + label |
| "Điều đáng chú ý" spotlight card | CODE | text card |
| Dimension detail cards (2×2) | CODE | icon + score + one-line copy |
| Events list | CODE | icon (moon phase/planet — lucide as stand-in) + text |
| Feature cards (Tử Vi/Tarot/Bản đồ sao/Thần số học) | **ASSET required for illustration** (P0) / CODE for the card shell | brief explicitly forbids oversized generic icons as final artwork here |
| Tarot teaser card art | ASSET (P0 — card back) | face-down card placeholder now, real art later |
| Compatibility avatars | ASSET (P2) | placeholder avatar circles now (initials), real illustrated avatars optional |
| Compatibility ring/percentage | CODE | SVG progress ring |
| Life timeline | CODE | pure CSS/SVG, no raster needed |
| Star-map CTA illustration | ASSET (P1) | complex celestial artwork per brief's own ASSET criteria |
| Mobile bottom nav | CODE | 5-item bar, center item emphasized |

## 7. Responsive assumptions

- Desktop: full 2-column layout as above, 1280px+.
- Tablet (768–1024px): hero stays full-width, right rail collapses below the hero band (single
  column), feature card row goes 2-up.
- Mobile (<768px): single column throughout; Destiny Orbit shrinks but stays legible (min
  ~220px); feature cards go 1-up horizontally scrollable or stacked; bottom tab bar replaces top
  nav, matching the phone-mockup callout region of the screenshot (Hôm nay / Lá số / Khám phá /
  Kết nối / Tôi, per the brief's suggested mobile IA — the callout's own labels are illegible at
  source resolution, so the brief's explicit mobile nav list is used as source of truth).

## 8. Explicit deviations summary

1. Left SaaS sidebar dropped in favor of top nav only (§1).
2. Bottom meta-commentary strip excluded — not product UI (§0).
3. Mobile phone mockups treated as layout reference only, not reproduced as literal desktop
   elements (§0).
4. Logo/brand glyph shipped as a simple CODE SVG now; listed as optional P1 asset for a more
   illustrated version later, since a compass/star mark is within reach of CSS/SVG per the
   brief's own CODE list ("simple zodiac symbols").
