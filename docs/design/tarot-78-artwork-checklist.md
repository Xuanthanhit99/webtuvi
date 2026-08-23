# Tarot 78-Card Artwork Checklist (Founder-Facing)

**Purpose:** track exactly which of the 78 card artwork files have been supplied. Generated
directly from the real `TAROT_DECK` data and a real filesystem check against
`apps/web/public/assets/tarot/cards/` — `apps/api/scripts/generate-tarot-artwork-docs.ts`. A row
is only ever marked `READY` if the file genuinely exists on disk; it is never marked `READY` by
assumption.

**Last generated:** 2026-08-22 (Artwork Production pass) · **Front artwork:** 1 / 78 READY, 77 / 78
PENDING · **Card back:** 1 / 1 READY.

The founder approved `tarot-the-star.webp`/`tarot-card-back.webp` (originally produced for the
archived `/menh-vi` design exploration — see `docs/design/tarot-78-art-bible.md` §"Provenance") as
the V1 visual direction. `tarot-the-star.webp` is confirmed to depict XVII The Star correctly
(roman numeral, kneeling figure pouring two vessels into a pool, radiant central star,
constellation lines, twin pillars — matches the traditional Star archetype) and has been copied
(not moved — the archived module's own copy is untouched) to the canonical path below, so it is now
counted as real, verified front artwork, not a placeholder.

To regenerate this table after adding files, run from `apps/api`:
```bash
npx ts-node scripts/generate-tarot-artwork-docs.ts
```

## Card back

| Asset | Path | Status |
|---|---|---|
| Shared card back (all 78 cards use this one asset) | `/assets/tarot/card-back.webp` | READY |

## Front artwork (78)

| # | Card ID | English name | Vietnamese name | Arcana | Suit | Rank | Expected filename | Expected path | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `major-00-the-fool` | The Fool | Kẻ Khờ | MAJOR | — | 0 | `major-00-the-fool.webp` | `/assets/tarot/cards/major/major-00-the-fool.webp` | PENDING_ARTWORK |
| 2 | `major-01-the-magician` | The Magician | Pháp Sư | MAJOR | — | 1 | `major-01-the-magician.webp` | `/assets/tarot/cards/major/major-01-the-magician.webp` | PENDING_ARTWORK |
| 3 | `major-02-the-high-priestess` | The High Priestess | Nữ Tư Tế | MAJOR | — | 2 | `major-02-the-high-priestess.webp` | `/assets/tarot/cards/major/major-02-the-high-priestess.webp` | PENDING_ARTWORK |
| 4 | `major-03-the-empress` | The Empress | Nữ Hoàng | MAJOR | — | 3 | `major-03-the-empress.webp` | `/assets/tarot/cards/major/major-03-the-empress.webp` | PENDING_ARTWORK |
| 5 | `major-04-the-emperor` | The Emperor | Hoàng Đế | MAJOR | — | 4 | `major-04-the-emperor.webp` | `/assets/tarot/cards/major/major-04-the-emperor.webp` | PENDING_ARTWORK |
| 6 | `major-05-the-hierophant` | The Hierophant | Giáo Hoàng | MAJOR | — | 5 | `major-05-the-hierophant.webp` | `/assets/tarot/cards/major/major-05-the-hierophant.webp` | PENDING_ARTWORK |
| 7 | `major-06-the-lovers` | The Lovers | Tình Nhân | MAJOR | — | 6 | `major-06-the-lovers.webp` | `/assets/tarot/cards/major/major-06-the-lovers.webp` | PENDING_ARTWORK |
| 8 | `major-07-the-chariot` | The Chariot | Cỗ Xe | MAJOR | — | 7 | `major-07-the-chariot.webp` | `/assets/tarot/cards/major/major-07-the-chariot.webp` | PENDING_ARTWORK |
| 9 | `major-08-strength` | Strength | Sức Mạnh | MAJOR | — | 8 | `major-08-strength.webp` | `/assets/tarot/cards/major/major-08-strength.webp` | PENDING_ARTWORK |
| 10 | `major-09-the-hermit` | The Hermit | Ẩn Sĩ | MAJOR | — | 9 | `major-09-the-hermit.webp` | `/assets/tarot/cards/major/major-09-the-hermit.webp` | PENDING_ARTWORK |
| 11 | `major-10-wheel-of-fortune` | Wheel of Fortune | Bánh Xe Số Mệnh | MAJOR | — | 10 | `major-10-wheel-of-fortune.webp` | `/assets/tarot/cards/major/major-10-wheel-of-fortune.webp` | PENDING_ARTWORK |
| 12 | `major-11-justice` | Justice | Công Lý | MAJOR | — | 11 | `major-11-justice.webp` | `/assets/tarot/cards/major/major-11-justice.webp` | PENDING_ARTWORK |
| 13 | `major-12-the-hanged-man` | The Hanged Man | Người Treo Ngược | MAJOR | — | 12 | `major-12-the-hanged-man.webp` | `/assets/tarot/cards/major/major-12-the-hanged-man.webp` | PENDING_ARTWORK |
| 14 | `major-13-death` | Death | Tử Thần | MAJOR | — | 13 | `major-13-death.webp` | `/assets/tarot/cards/major/major-13-death.webp` | PENDING_ARTWORK |
| 15 | `major-14-temperance` | Temperance | Điều Độ | MAJOR | — | 14 | `major-14-temperance.webp` | `/assets/tarot/cards/major/major-14-temperance.webp` | PENDING_ARTWORK |
| 16 | `major-15-the-devil` | The Devil | Ác Quỷ | MAJOR | — | 15 | `major-15-the-devil.webp` | `/assets/tarot/cards/major/major-15-the-devil.webp` | PENDING_ARTWORK |
| 17 | `major-16-the-tower` | The Tower | Tòa Tháp | MAJOR | — | 16 | `major-16-the-tower.webp` | `/assets/tarot/cards/major/major-16-the-tower.webp` | PENDING_ARTWORK |
| 18 | `major-17-the-star` | The Star | Ngôi Sao | MAJOR | — | 17 | `major-17-the-star.webp` | `/assets/tarot/cards/major/major-17-the-star.webp` | **READY** |
| 19 | `major-18-the-moon` | The Moon | Mặt Trăng | MAJOR | — | 18 | `major-18-the-moon.webp` | `/assets/tarot/cards/major/major-18-the-moon.webp` | PENDING_ARTWORK |
| 20 | `major-19-the-sun` | The Sun | Mặt Trời | MAJOR | — | 19 | `major-19-the-sun.webp` | `/assets/tarot/cards/major/major-19-the-sun.webp` | PENDING_ARTWORK |
| 21 | `major-20-judgement` | Judgement | Phán Xét | MAJOR | — | 20 | `major-20-judgement.webp` | `/assets/tarot/cards/major/major-20-judgement.webp` | PENDING_ARTWORK |
| 22 | `major-21-the-world` | The World | Thế Giới | MAJOR | — | 21 | `major-21-the-world.webp` | `/assets/tarot/cards/major/major-21-the-world.webp` | PENDING_ARTWORK |
| 23 | `wands-01-ace-of-wands` | Ace of Wands | Át Gậy | MINOR | WANDS | 1 | `wands-01-ace-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-01-ace-of-wands.webp` | PENDING_ARTWORK |
| 24 | `wands-02-two-of-wands` | Two of Wands | Hai Gậy | MINOR | WANDS | 2 | `wands-02-two-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-02-two-of-wands.webp` | PENDING_ARTWORK |
| 25 | `wands-03-three-of-wands` | Three of Wands | Ba Gậy | MINOR | WANDS | 3 | `wands-03-three-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-03-three-of-wands.webp` | PENDING_ARTWORK |
| 26 | `wands-04-four-of-wands` | Four of Wands | Bốn Gậy | MINOR | WANDS | 4 | `wands-04-four-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-04-four-of-wands.webp` | PENDING_ARTWORK |
| 27 | `wands-05-five-of-wands` | Five of Wands | Năm Gậy | MINOR | WANDS | 5 | `wands-05-five-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-05-five-of-wands.webp` | PENDING_ARTWORK |
| 28 | `wands-06-six-of-wands` | Six of Wands | Sáu Gậy | MINOR | WANDS | 6 | `wands-06-six-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-06-six-of-wands.webp` | PENDING_ARTWORK |
| 29 | `wands-07-seven-of-wands` | Seven of Wands | Bảy Gậy | MINOR | WANDS | 7 | `wands-07-seven-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-07-seven-of-wands.webp` | PENDING_ARTWORK |
| 30 | `wands-08-eight-of-wands` | Eight of Wands | Tám Gậy | MINOR | WANDS | 8 | `wands-08-eight-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-08-eight-of-wands.webp` | PENDING_ARTWORK |
| 31 | `wands-09-nine-of-wands` | Nine of Wands | Chín Gậy | MINOR | WANDS | 9 | `wands-09-nine-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-09-nine-of-wands.webp` | PENDING_ARTWORK |
| 32 | `wands-10-ten-of-wands` | Ten of Wands | Mười Gậy | MINOR | WANDS | 10 | `wands-10-ten-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-10-ten-of-wands.webp` | PENDING_ARTWORK |
| 33 | `wands-11-page-of-wands` | Page of Wands | Thị Vệ Gậy | MINOR | WANDS | 11 | `wands-11-page-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-11-page-of-wands.webp` | PENDING_ARTWORK |
| 34 | `wands-12-knight-of-wands` | Knight of Wands | Kỵ Sĩ Gậy | MINOR | WANDS | 12 | `wands-12-knight-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-12-knight-of-wands.webp` | PENDING_ARTWORK |
| 35 | `wands-13-queen-of-wands` | Queen of Wands | Hoàng Hậu Gậy | MINOR | WANDS | 13 | `wands-13-queen-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-13-queen-of-wands.webp` | PENDING_ARTWORK |
| 36 | `wands-14-king-of-wands` | King of Wands | Vua Gậy | MINOR | WANDS | 14 | `wands-14-king-of-wands.webp` | `/assets/tarot/cards/minor/wands/wands-14-king-of-wands.webp` | PENDING_ARTWORK |
| 37 | `cups-01-ace-of-cups` | Ace of Cups | Át Cốc | MINOR | CUPS | 1 | `cups-01-ace-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-01-ace-of-cups.webp` | PENDING_ARTWORK |
| 38 | `cups-02-two-of-cups` | Two of Cups | Hai Cốc | MINOR | CUPS | 2 | `cups-02-two-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-02-two-of-cups.webp` | PENDING_ARTWORK |
| 39 | `cups-03-three-of-cups` | Three of Cups | Ba Cốc | MINOR | CUPS | 3 | `cups-03-three-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-03-three-of-cups.webp` | PENDING_ARTWORK |
| 40 | `cups-04-four-of-cups` | Four of Cups | Bốn Cốc | MINOR | CUPS | 4 | `cups-04-four-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-04-four-of-cups.webp` | PENDING_ARTWORK |
| 41 | `cups-05-five-of-cups` | Five of Cups | Năm Cốc | MINOR | CUPS | 5 | `cups-05-five-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-05-five-of-cups.webp` | PENDING_ARTWORK |
| 42 | `cups-06-six-of-cups` | Six of Cups | Sáu Cốc | MINOR | CUPS | 6 | `cups-06-six-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-06-six-of-cups.webp` | PENDING_ARTWORK |
| 43 | `cups-07-seven-of-cups` | Seven of Cups | Bảy Cốc | MINOR | CUPS | 7 | `cups-07-seven-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-07-seven-of-cups.webp` | PENDING_ARTWORK |
| 44 | `cups-08-eight-of-cups` | Eight of Cups | Tám Cốc | MINOR | CUPS | 8 | `cups-08-eight-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-08-eight-of-cups.webp` | PENDING_ARTWORK |
| 45 | `cups-09-nine-of-cups` | Nine of Cups | Chín Cốc | MINOR | CUPS | 9 | `cups-09-nine-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-09-nine-of-cups.webp` | PENDING_ARTWORK |
| 46 | `cups-10-ten-of-cups` | Ten of Cups | Mười Cốc | MINOR | CUPS | 10 | `cups-10-ten-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-10-ten-of-cups.webp` | PENDING_ARTWORK |
| 47 | `cups-11-page-of-cups` | Page of Cups | Thị Vệ Cốc | MINOR | CUPS | 11 | `cups-11-page-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-11-page-of-cups.webp` | PENDING_ARTWORK |
| 48 | `cups-12-knight-of-cups` | Knight of Cups | Kỵ Sĩ Cốc | MINOR | CUPS | 12 | `cups-12-knight-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-12-knight-of-cups.webp` | PENDING_ARTWORK |
| 49 | `cups-13-queen-of-cups` | Queen of Cups | Hoàng Hậu Cốc | MINOR | CUPS | 13 | `cups-13-queen-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-13-queen-of-cups.webp` | PENDING_ARTWORK |
| 50 | `cups-14-king-of-cups` | King of Cups | Vua Cốc | MINOR | CUPS | 14 | `cups-14-king-of-cups.webp` | `/assets/tarot/cards/minor/cups/cups-14-king-of-cups.webp` | PENDING_ARTWORK |
| 51 | `swords-01-ace-of-swords` | Ace of Swords | Át Kiếm | MINOR | SWORDS | 1 | `swords-01-ace-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-01-ace-of-swords.webp` | PENDING_ARTWORK |
| 52 | `swords-02-two-of-swords` | Two of Swords | Hai Kiếm | MINOR | SWORDS | 2 | `swords-02-two-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-02-two-of-swords.webp` | PENDING_ARTWORK |
| 53 | `swords-03-three-of-swords` | Three of Swords | Ba Kiếm | MINOR | SWORDS | 3 | `swords-03-three-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-03-three-of-swords.webp` | PENDING_ARTWORK |
| 54 | `swords-04-four-of-swords` | Four of Swords | Bốn Kiếm | MINOR | SWORDS | 4 | `swords-04-four-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-04-four-of-swords.webp` | PENDING_ARTWORK |
| 55 | `swords-05-five-of-swords` | Five of Swords | Năm Kiếm | MINOR | SWORDS | 5 | `swords-05-five-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-05-five-of-swords.webp` | PENDING_ARTWORK |
| 56 | `swords-06-six-of-swords` | Six of Swords | Sáu Kiếm | MINOR | SWORDS | 6 | `swords-06-six-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-06-six-of-swords.webp` | PENDING_ARTWORK |
| 57 | `swords-07-seven-of-swords` | Seven of Swords | Bảy Kiếm | MINOR | SWORDS | 7 | `swords-07-seven-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-07-seven-of-swords.webp` | PENDING_ARTWORK |
| 58 | `swords-08-eight-of-swords` | Eight of Swords | Tám Kiếm | MINOR | SWORDS | 8 | `swords-08-eight-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-08-eight-of-swords.webp` | PENDING_ARTWORK |
| 59 | `swords-09-nine-of-swords` | Nine of Swords | Chín Kiếm | MINOR | SWORDS | 9 | `swords-09-nine-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-09-nine-of-swords.webp` | PENDING_ARTWORK |
| 60 | `swords-10-ten-of-swords` | Ten of Swords | Mười Kiếm | MINOR | SWORDS | 10 | `swords-10-ten-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-10-ten-of-swords.webp` | PENDING_ARTWORK |
| 61 | `swords-11-page-of-swords` | Page of Swords | Thị Vệ Kiếm | MINOR | SWORDS | 11 | `swords-11-page-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-11-page-of-swords.webp` | PENDING_ARTWORK |
| 62 | `swords-12-knight-of-swords` | Knight of Swords | Kỵ Sĩ Kiếm | MINOR | SWORDS | 12 | `swords-12-knight-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-12-knight-of-swords.webp` | PENDING_ARTWORK |
| 63 | `swords-13-queen-of-swords` | Queen of Swords | Hoàng Hậu Kiếm | MINOR | SWORDS | 13 | `swords-13-queen-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-13-queen-of-swords.webp` | PENDING_ARTWORK |
| 64 | `swords-14-king-of-swords` | King of Swords | Vua Kiếm | MINOR | SWORDS | 14 | `swords-14-king-of-swords.webp` | `/assets/tarot/cards/minor/swords/swords-14-king-of-swords.webp` | PENDING_ARTWORK |
| 65 | `pentacles-01-ace-of-pentacles` | Ace of Pentacles | Át Tiền | MINOR | PENTACLES | 1 | `pentacles-01-ace-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-01-ace-of-pentacles.webp` | PENDING_ARTWORK |
| 66 | `pentacles-02-two-of-pentacles` | Two of Pentacles | Hai Tiền | MINOR | PENTACLES | 2 | `pentacles-02-two-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-02-two-of-pentacles.webp` | PENDING_ARTWORK |
| 67 | `pentacles-03-three-of-pentacles` | Three of Pentacles | Ba Tiền | MINOR | PENTACLES | 3 | `pentacles-03-three-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-03-three-of-pentacles.webp` | PENDING_ARTWORK |
| 68 | `pentacles-04-four-of-pentacles` | Four of Pentacles | Bốn Tiền | MINOR | PENTACLES | 4 | `pentacles-04-four-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-04-four-of-pentacles.webp` | PENDING_ARTWORK |
| 69 | `pentacles-05-five-of-pentacles` | Five of Pentacles | Năm Tiền | MINOR | PENTACLES | 5 | `pentacles-05-five-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-05-five-of-pentacles.webp` | PENDING_ARTWORK |
| 70 | `pentacles-06-six-of-pentacles` | Six of Pentacles | Sáu Tiền | MINOR | PENTACLES | 6 | `pentacles-06-six-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-06-six-of-pentacles.webp` | PENDING_ARTWORK |
| 71 | `pentacles-07-seven-of-pentacles` | Seven of Pentacles | Bảy Tiền | MINOR | PENTACLES | 7 | `pentacles-07-seven-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-07-seven-of-pentacles.webp` | PENDING_ARTWORK |
| 72 | `pentacles-08-eight-of-pentacles` | Eight of Pentacles | Tám Tiền | MINOR | PENTACLES | 8 | `pentacles-08-eight-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-08-eight-of-pentacles.webp` | PENDING_ARTWORK |
| 73 | `pentacles-09-nine-of-pentacles` | Nine of Pentacles | Chín Tiền | MINOR | PENTACLES | 9 | `pentacles-09-nine-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-09-nine-of-pentacles.webp` | PENDING_ARTWORK |
| 74 | `pentacles-10-ten-of-pentacles` | Ten of Pentacles | Mười Tiền | MINOR | PENTACLES | 10 | `pentacles-10-ten-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-10-ten-of-pentacles.webp` | PENDING_ARTWORK |
| 75 | `pentacles-11-page-of-pentacles` | Page of Pentacles | Thị Vệ Tiền | MINOR | PENTACLES | 11 | `pentacles-11-page-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-11-page-of-pentacles.webp` | PENDING_ARTWORK |
| 76 | `pentacles-12-knight-of-pentacles` | Knight of Pentacles | Kỵ Sĩ Tiền | MINOR | PENTACLES | 12 | `pentacles-12-knight-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-12-knight-of-pentacles.webp` | PENDING_ARTWORK |
| 77 | `pentacles-13-queen-of-pentacles` | Queen of Pentacles | Hoàng Hậu Tiền | MINOR | PENTACLES | 13 | `pentacles-13-queen-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-13-queen-of-pentacles.webp` | PENDING_ARTWORK |
| 78 | `pentacles-14-king-of-pentacles` | King of Pentacles | Vua Tiền | MINOR | PENTACLES | 14 | `pentacles-14-king-of-pentacles.webp` | `/assets/tarot/cards/minor/pentacles/pentacles-14-king-of-pentacles.webp` | PENDING_ARTWORK |
