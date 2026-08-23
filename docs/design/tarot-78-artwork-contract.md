# Tarot 78-Card Artwork Contract

**Purpose:** the stable, founder-facing contract for adding final Tarot card artwork. Generated
directly from the real `TAROT_DECK` data (`apps/api/prisma/data/tarot-deck.ts`) —
`apps/api/scripts/generate-tarot-artwork-docs.ts` — never hand-typed, so it can never drift from
the actual 78-card deck.

**Deck version:** `tarot-v1-78`

## How this works

1. Every card has an `imageSlug` (already stable, already seeded — not something artwork addition
   changes).
2. The frontend resolves `imageSlug` → a file path via **one function**,
   `resolveTarotArtworkSrc()` in `apps/web/features/tarot/artwork.ts` — the single centralized
   artwork manifest referenced by the master brief's "Artwork-integration readiness" requirement.
3. To add real artwork: **place a file at the exact expected path below. Nothing else.** No code
   change, no database migration, no redeploy of anything but the static file itself.
4. If a file is missing, `TarotCardVisual` (`apps/web/features/tarot/components/tarot-card-face.tsx`)
   already renders a typographic/symbolic fallback face automatically (via the `<img>` element's
   own `onError` handler) — never a broken-image icon. This fallback behavior predates this pass
   (see `docs/progress/sprint-6-progress.md` "Deliberate scope decisions" #2) and required no
   change here.

## Format requirements

- **Format:** `.webp` (matches this repo's existing image-asset convention, e.g.
  `apps/web/public/assets/menh-vi/*`, and the founder-approved reference assets themselves).
- **Canonical dimensions (measured from the approved reference art, not assumed):** 768×1280px.
- **Canonical aspect ratio:** `TAROT_ART_MASTER_RATIO = 0.6` (768:1280, i.e. 3:5) — every one of
  the 78 front artworks and the card back must match this ratio exactly. Full derivation and
  frame/typography specification: `docs/design/tarot-78-art-bible.md`.
- **File location root:** `apps/web/public/assets/tarot/cards/` for front artwork,
  `apps/web/public/assets/tarot/card-back.webp` for the one shared back.

## Card back

One shared asset, used for every face-down card — not one of the 78 front artworks, never
generated per-card.

| Asset | Expected path | Status |
|---|---|---|
| Card back | `/assets/tarot/card-back.webp` | **READY** — founder-approved, copied from the original `apps/web/public/assets/menh-vi/tarot/tarot-card-back.webp` |

Wired into `TarotCardVisual` (`apps/web/features/tarot/components/tarot-card-face.tsx`) via a new
`backImageSrc` prop, shown only when a card is rendered face-down (`revealed === false`) —
separate from the front-image prop so a face-down card can never accidentally reveal its front.
Resolved via `TAROT_CARD_BACK_SRC` in `apps/web/features/tarot/artwork.ts`.

## Front artwork status: 1 / 78 READY

`major-17-the-star` is founder-approved and already in place (see the checklist doc for full
provenance). All other 77 remain `PENDING_ARTWORK` — production specifications for each are in
`docs/design/tarot-78-card-prompts.md`.

## The 78 expected files

| # | Card ID (slug) | English name | Vietnamese name | Expected path |
|---|---|---|---|---|
| 0 | `major-00-the-fool` | The Fool | Kẻ Khờ | `/assets/tarot/cards/major/major-00-the-fool.webp` |
| 1 | `major-01-the-magician` | The Magician | Pháp Sư | `/assets/tarot/cards/major/major-01-the-magician.webp` |
| 2 | `major-02-the-high-priestess` | The High Priestess | Nữ Tư Tế | `/assets/tarot/cards/major/major-02-the-high-priestess.webp` |
| 3 | `major-03-the-empress` | The Empress | Nữ Hoàng | `/assets/tarot/cards/major/major-03-the-empress.webp` |
| 4 | `major-04-the-emperor` | The Emperor | Hoàng Đế | `/assets/tarot/cards/major/major-04-the-emperor.webp` |
| 5 | `major-05-the-hierophant` | The Hierophant | Giáo Hoàng | `/assets/tarot/cards/major/major-05-the-hierophant.webp` |
| 6 | `major-06-the-lovers` | The Lovers | Tình Nhân | `/assets/tarot/cards/major/major-06-the-lovers.webp` |
| 7 | `major-07-the-chariot` | The Chariot | Cỗ Xe | `/assets/tarot/cards/major/major-07-the-chariot.webp` |
| 8 | `major-08-strength` | Strength | Sức Mạnh | `/assets/tarot/cards/major/major-08-strength.webp` |
| 9 | `major-09-the-hermit` | The Hermit | Ẩn Sĩ | `/assets/tarot/cards/major/major-09-the-hermit.webp` |
| 10 | `major-10-wheel-of-fortune` | Wheel of Fortune | Bánh Xe Số Mệnh | `/assets/tarot/cards/major/major-10-wheel-of-fortune.webp` |
| 11 | `major-11-justice` | Justice | Công Lý | `/assets/tarot/cards/major/major-11-justice.webp` |
| 12 | `major-12-the-hanged-man` | The Hanged Man | Người Treo Ngược | `/assets/tarot/cards/major/major-12-the-hanged-man.webp` |
| 13 | `major-13-death` | Death | Tử Thần | `/assets/tarot/cards/major/major-13-death.webp` |
| 14 | `major-14-temperance` | Temperance | Điều Độ | `/assets/tarot/cards/major/major-14-temperance.webp` |
| 15 | `major-15-the-devil` | The Devil | Ác Quỷ | `/assets/tarot/cards/major/major-15-the-devil.webp` |
| 16 | `major-16-the-tower` | The Tower | Tòa Tháp | `/assets/tarot/cards/major/major-16-the-tower.webp` |
| 17 | `major-17-the-star` | The Star | Ngôi Sao | `/assets/tarot/cards/major/major-17-the-star.webp` |
| 18 | `major-18-the-moon` | The Moon | Mặt Trăng | `/assets/tarot/cards/major/major-18-the-moon.webp` |
| 19 | `major-19-the-sun` | The Sun | Mặt Trời | `/assets/tarot/cards/major/major-19-the-sun.webp` |
| 20 | `major-20-judgement` | Judgement | Phán Xét | `/assets/tarot/cards/major/major-20-judgement.webp` |
| 21 | `major-21-the-world` | The World | Thế Giới | `/assets/tarot/cards/major/major-21-the-world.webp` |
| WANDS 1 | `wands-01-ace-of-wands` | Ace of Wands | Át Gậy | `/assets/tarot/cards/minor/wands/wands-01-ace-of-wands.webp` |
| WANDS 2 | `wands-02-two-of-wands` | Two of Wands | Hai Gậy | `/assets/tarot/cards/minor/wands/wands-02-two-of-wands.webp` |
| WANDS 3 | `wands-03-three-of-wands` | Three of Wands | Ba Gậy | `/assets/tarot/cards/minor/wands/wands-03-three-of-wands.webp` |
| WANDS 4 | `wands-04-four-of-wands` | Four of Wands | Bốn Gậy | `/assets/tarot/cards/minor/wands/wands-04-four-of-wands.webp` |
| WANDS 5 | `wands-05-five-of-wands` | Five of Wands | Năm Gậy | `/assets/tarot/cards/minor/wands/wands-05-five-of-wands.webp` |
| WANDS 6 | `wands-06-six-of-wands` | Six of Wands | Sáu Gậy | `/assets/tarot/cards/minor/wands/wands-06-six-of-wands.webp` |
| WANDS 7 | `wands-07-seven-of-wands` | Seven of Wands | Bảy Gậy | `/assets/tarot/cards/minor/wands/wands-07-seven-of-wands.webp` |
| WANDS 8 | `wands-08-eight-of-wands` | Eight of Wands | Tám Gậy | `/assets/tarot/cards/minor/wands/wands-08-eight-of-wands.webp` |
| WANDS 9 | `wands-09-nine-of-wands` | Nine of Wands | Chín Gậy | `/assets/tarot/cards/minor/wands/wands-09-nine-of-wands.webp` |
| WANDS 10 | `wands-10-ten-of-wands` | Ten of Wands | Mười Gậy | `/assets/tarot/cards/minor/wands/wands-10-ten-of-wands.webp` |
| WANDS 11 | `wands-11-page-of-wands` | Page of Wands | Thị Vệ Gậy | `/assets/tarot/cards/minor/wands/wands-11-page-of-wands.webp` |
| WANDS 12 | `wands-12-knight-of-wands` | Knight of Wands | Kỵ Sĩ Gậy | `/assets/tarot/cards/minor/wands/wands-12-knight-of-wands.webp` |
| WANDS 13 | `wands-13-queen-of-wands` | Queen of Wands | Hoàng Hậu Gậy | `/assets/tarot/cards/minor/wands/wands-13-queen-of-wands.webp` |
| WANDS 14 | `wands-14-king-of-wands` | King of Wands | Vua Gậy | `/assets/tarot/cards/minor/wands/wands-14-king-of-wands.webp` |
| CUPS 1 | `cups-01-ace-of-cups` | Ace of Cups | Át Cốc | `/assets/tarot/cards/minor/cups/cups-01-ace-of-cups.webp` |
| CUPS 2 | `cups-02-two-of-cups` | Two of Cups | Hai Cốc | `/assets/tarot/cards/minor/cups/cups-02-two-of-cups.webp` |
| CUPS 3 | `cups-03-three-of-cups` | Three of Cups | Ba Cốc | `/assets/tarot/cards/minor/cups/cups-03-three-of-cups.webp` |
| CUPS 4 | `cups-04-four-of-cups` | Four of Cups | Bốn Cốc | `/assets/tarot/cards/minor/cups/cups-04-four-of-cups.webp` |
| CUPS 5 | `cups-05-five-of-cups` | Five of Cups | Năm Cốc | `/assets/tarot/cards/minor/cups/cups-05-five-of-cups.webp` |
| CUPS 6 | `cups-06-six-of-cups` | Six of Cups | Sáu Cốc | `/assets/tarot/cards/minor/cups/cups-06-six-of-cups.webp` |
| CUPS 7 | `cups-07-seven-of-cups` | Seven of Cups | Bảy Cốc | `/assets/tarot/cards/minor/cups/cups-07-seven-of-cups.webp` |
| CUPS 8 | `cups-08-eight-of-cups` | Eight of Cups | Tám Cốc | `/assets/tarot/cards/minor/cups/cups-08-eight-of-cups.webp` |
| CUPS 9 | `cups-09-nine-of-cups` | Nine of Cups | Chín Cốc | `/assets/tarot/cards/minor/cups/cups-09-nine-of-cups.webp` |
| CUPS 10 | `cups-10-ten-of-cups` | Ten of Cups | Mười Cốc | `/assets/tarot/cards/minor/cups/cups-10-ten-of-cups.webp` |
| CUPS 11 | `cups-11-page-of-cups` | Page of Cups | Thị Vệ Cốc | `/assets/tarot/cards/minor/cups/cups-11-page-of-cups.webp` |
| CUPS 12 | `cups-12-knight-of-cups` | Knight of Cups | Kỵ Sĩ Cốc | `/assets/tarot/cards/minor/cups/cups-12-knight-of-cups.webp` |
| CUPS 13 | `cups-13-queen-of-cups` | Queen of Cups | Hoàng Hậu Cốc | `/assets/tarot/cards/minor/cups/cups-13-queen-of-cups.webp` |
| CUPS 14 | `cups-14-king-of-cups` | King of Cups | Vua Cốc | `/assets/tarot/cards/minor/cups/cups-14-king-of-cups.webp` |
| SWORDS 1 | `swords-01-ace-of-swords` | Ace of Swords | Át Kiếm | `/assets/tarot/cards/minor/swords/swords-01-ace-of-swords.webp` |
| SWORDS 2 | `swords-02-two-of-swords` | Two of Swords | Hai Kiếm | `/assets/tarot/cards/minor/swords/swords-02-two-of-swords.webp` |
| SWORDS 3 | `swords-03-three-of-swords` | Three of Swords | Ba Kiếm | `/assets/tarot/cards/minor/swords/swords-03-three-of-swords.webp` |
| SWORDS 4 | `swords-04-four-of-swords` | Four of Swords | Bốn Kiếm | `/assets/tarot/cards/minor/swords/swords-04-four-of-swords.webp` |
| SWORDS 5 | `swords-05-five-of-swords` | Five of Swords | Năm Kiếm | `/assets/tarot/cards/minor/swords/swords-05-five-of-swords.webp` |
| SWORDS 6 | `swords-06-six-of-swords` | Six of Swords | Sáu Kiếm | `/assets/tarot/cards/minor/swords/swords-06-six-of-swords.webp` |
| SWORDS 7 | `swords-07-seven-of-swords` | Seven of Swords | Bảy Kiếm | `/assets/tarot/cards/minor/swords/swords-07-seven-of-swords.webp` |
| SWORDS 8 | `swords-08-eight-of-swords` | Eight of Swords | Tám Kiếm | `/assets/tarot/cards/minor/swords/swords-08-eight-of-swords.webp` |
| SWORDS 9 | `swords-09-nine-of-swords` | Nine of Swords | Chín Kiếm | `/assets/tarot/cards/minor/swords/swords-09-nine-of-swords.webp` |
| SWORDS 10 | `swords-10-ten-of-swords` | Ten of Swords | Mười Kiếm | `/assets/tarot/cards/minor/swords/swords-10-ten-of-swords.webp` |
| SWORDS 11 | `swords-11-page-of-swords` | Page of Swords | Thị Vệ Kiếm | `/assets/tarot/cards/minor/swords/swords-11-page-of-swords.webp` |
| SWORDS 12 | `swords-12-knight-of-swords` | Knight of Swords | Kỵ Sĩ Kiếm | `/assets/tarot/cards/minor/swords/swords-12-knight-of-swords.webp` |
| SWORDS 13 | `swords-13-queen-of-swords` | Queen of Swords | Hoàng Hậu Kiếm | `/assets/tarot/cards/minor/swords/swords-13-queen-of-swords.webp` |
| SWORDS 14 | `swords-14-king-of-swords` | King of Swords | Vua Kiếm | `/assets/tarot/cards/minor/swords/swords-14-king-of-swords.webp` |
| PENTACLES 1 | `pentacles-01-ace-of-pentacles` | Ace of Pentacles | Át Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-01-ace-of-pentacles.webp` |
| PENTACLES 2 | `pentacles-02-two-of-pentacles` | Two of Pentacles | Hai Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-02-two-of-pentacles.webp` |
| PENTACLES 3 | `pentacles-03-three-of-pentacles` | Three of Pentacles | Ba Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-03-three-of-pentacles.webp` |
| PENTACLES 4 | `pentacles-04-four-of-pentacles` | Four of Pentacles | Bốn Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-04-four-of-pentacles.webp` |
| PENTACLES 5 | `pentacles-05-five-of-pentacles` | Five of Pentacles | Năm Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-05-five-of-pentacles.webp` |
| PENTACLES 6 | `pentacles-06-six-of-pentacles` | Six of Pentacles | Sáu Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-06-six-of-pentacles.webp` |
| PENTACLES 7 | `pentacles-07-seven-of-pentacles` | Seven of Pentacles | Bảy Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-07-seven-of-pentacles.webp` |
| PENTACLES 8 | `pentacles-08-eight-of-pentacles` | Eight of Pentacles | Tám Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-08-eight-of-pentacles.webp` |
| PENTACLES 9 | `pentacles-09-nine-of-pentacles` | Nine of Pentacles | Chín Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-09-nine-of-pentacles.webp` |
| PENTACLES 10 | `pentacles-10-ten-of-pentacles` | Ten of Pentacles | Mười Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-10-ten-of-pentacles.webp` |
| PENTACLES 11 | `pentacles-11-page-of-pentacles` | Page of Pentacles | Thị Vệ Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-11-page-of-pentacles.webp` |
| PENTACLES 12 | `pentacles-12-knight-of-pentacles` | Knight of Pentacles | Kỵ Sĩ Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-12-knight-of-pentacles.webp` |
| PENTACLES 13 | `pentacles-13-queen-of-pentacles` | Queen of Pentacles | Hoàng Hậu Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-13-queen-of-pentacles.webp` |
| PENTACLES 14 | `pentacles-14-king-of-pentacles` | King of Pentacles | Vua Tiền | `/assets/tarot/cards/minor/pentacles/pentacles-14-king-of-pentacles.webp` |

## Not part of this contract

A card-back design (shown face-down before/during selection) is not covered here — the product
currently renders a symbolic face-down state directly in `TarotCardVisual` (no image file), and
adding one is a separate, optional decision, not required for the 78-card artwork set.
