# Tarot Asset Audit

Source directory: `apps/web/public/assets/tarot-card`
Audit date: 2026-08-23

## 1. Initial inventory

- Total image files found: **115** (all `.png`; no `.jpg`/`.jpeg`/`.webp` present before processing)
- Dimensions found:
  - 768x1376 — 59 files
  - 800x1333 — 33 files
  - 1600x2666 — 15 files
  - 1536x1024 — 5 files (landscape — turned out to be non-card UI mockups, see below)
  - 2816x1536 — 2 files (landscape — outpainted/defective renders, see below)
  - 1536x2752 — 1 file (oversized portrait outlier)
- Filenames were **not trustworthy**: almost all files were named `Gemini_Generated_Image_*.png` or `ChatGPT Image *.png` with no identifying information. Only 3 files had descriptive names ("Five/Six/Seven of Swords.png"), and those still had to be verified visually like everything else.
- Every image was visually inspected (title text, Roman numeral, suit symbols, composition) by dedicated visual-QA passes — filenames were never trusted for identification.

## 2. Duplicate detection (SHA-256, exact byte match)

6 exact-duplicate pairs were found (12 files → 6 unique contents):

| File A | File B |
|---|---|
| Five of Swords.png | Gemini_Generated_Image_ (2).png |
| Six of Swords.png | Gemini_Generated_Image_ (1).png |
| Gemini_Generated_Image_ (5).png | Gemini_Generated_Image_wnpzxswnpzxswnpz.png |
| Gemini_Generated_Image_ (7).png | Gemini_Generated_Image_wnpzxswnpzxswnpz (2).png |
| Gemini_Generated_Image_ (8).png | Gemini_Generated_Image_wnpzxswnpzxswnpz (3).png |
| Gemini_Generated_Image_.png | Seven of Swords.png |

Beyond exact duplicates, **near-duplicate / competing-art duplicates** (different renders of the same card) were common: every Cups-suit rank and several Swords/Wands/Pentacles ranks had 2–3 independently generated candidate images. Knight of Cups had **3** competing renders. These are recorded individually in the table below with `DUPLICATE` status; the best candidate was kept as canonical, the rest excluded from the production set but preserved in the backup.

## 3. Non-card files found in the folder

7 files were **not Tarot card artwork at all** and were excluded from the canonical deck:

- 5× `ChatGPT Image *.png` (1536x1024 landscape) — these are Vietnamese-language **UI/UX design mockup boards** for the app (e.g. "BOARD 01: HOME + GLOBAL SHELL", "BOARD 03 / TAROT 78 COMPLETE FLOW"), not tarot artwork. They appear to have been accidentally saved into the tarot-card folder.
- 2× `Gemini_Generated_Image_ (53/54).png` — photographs of the **entire physical deck fanned/laid out** on velvet with crystals (promo/reference shots), not single-card images.

## 4. Defective renders

- `Gemini_Generated_Image_7j0wig7j0wig7j0w (1).png` (2816x1536) — intended as Nine of Pentacles, but only the left ~28% of the canvas contains a bordered card; the rest is blank gray with a stray sparkle icon. **Rejected** — a clean alternate (`Gemini_Generated_Image_7j0wig7j0wig7j0w.png`) covers `pentacles-09`.
- `Gemini_Generated_Image_39bjxt39bjxt39bj (3).png` — Seven of Swords with a truncated/garbled title ("SEVEN OF SWIE"). **Rejected** — clean alternates exist (`Seven of Swords.png` / its exact duplicate).

## 5. Outpainted canvas requiring crop

- `Gemini_Generated_Image_7j0wig7j0wig7j0w (2).png` (2816x1536) — the **only** candidate found for Queen of Pentacles. The real portrait-ratio card sits centered in the canvas with duplicated mountain/flower background outpainted on both sides. This was center-cropped to the actual card boundary (`left:950, top:5, width:915, height:1525`) — verified visually afterward: full gold frame, "Q" glyph, and "QUEEN OF PENTACLES" title all intact, nothing cut off. This is the one file in the final 78 that required cropping, and it was cropped only to remove the erroneous outpainted padding, not to alter or reframe the actual artwork.

## 6. Numbering / title-text QA (Roman numerals)

**Major Arcana: all 22 cards have correct, canonical Roman numerals** (0–XXI) matching their titles — no numbering defects found in the Major Arcana set.

**Minor Arcana: pervasive numeral defects.** A large fraction of Minor Arcana source images carry a decorative Roman-numeral banner that does **not** belong on a pip/court card (traditionally Minor Arcana pips show no numeral or just their own rank, and court cards show no numeral at all). Observed patterns:
- Numerals colliding with unrelated Major Arcana numbers (e.g. an Ace of Cups stamped "XV", which is The Devil's number)
- Numerals with no valid meaning at all, exceeding the 0–21 Major Arcana range (e.g. "XXXVIII" on Ten of Swords, "XXXIX" on Page of Pentacles)
- A few court cards stamped with a plain letter ("K", "Q", "A") instead of a numeral — inconsistent styling across the deck
- Two cases of garbled/duplicated numeral text ("X IX X" on Nine of Pentacles)

None of these numeral defects affect **card identity** — every affected card was still identifiable with high confidence from its title text and artwork/suit symbolism — but they are a real cosmetic inconsistency in the source art and are called out per-file below (`PASS_WITH_WARNING`). No numerals were edited or corrected in the WebP conversion (per "do not redesign" instruction); this is a note for future regeneration, not a blocker.

## 7. Symbolism concerns

- `wands-07` primary candidate rejected: `Gemini_Generated_Image_39bjxt39bjxt39bj.png` is titled "Seven of Wands" but the object held resembles a sword (crossguard/gemmed hilt), not a wand — suit-symbol mismatch. The clean alternate was used instead.
- `pentacles-10`: both available candidates for Ten of Pentacles have a decorative arch built from crossed sword-like shapes rather than pentacle/coin motifs. Kept as `PASS_WITH_WARNING` since the coins and family composition are otherwise correct and no clean alternate exists.
- `pentacles-page`: correct Page of Pentacles subject, but odd floating swords appear in the background — noted as a minor symbolism concern.
- `pentacles-08`: display rack in the background shows 9 pentacles rather than 8 — minor count mismatch, noted.
- `cups-09`: cup count in the arc is ambiguous (~7 clearly countable vs. the expected 9) — noted, kept since title/rank/suit are unambiguous.

## 8. Full per-file audit table

Status legend: PASS · PASS_WITH_WARNING · DUPLICATE · FIX_REQUIRED · REGENERATE_RECOMMENDED · UNKNOWN

| Source file | Identified card | Canonical ID | Confidence | Title | Rank/Numeral | Duplicate | Status |
|---|---|---|---|---|---|---|---|
| Gemini_Generated_Image_ (51).png | The Fool | 00-the-fool | high | THE FOOL | 0 | no | PASS |
| Gemini_Generated_Image_ (50).png | The Magician | 01-the-magician | high | THE MAGICIAN | I | no | PASS |
| Gemini_Generated_Image_ (52).png | The High Priestess | 02-the-high-priestess | high | THE HIGH PRIESTESS | II | no | PASS |
| Gemini_Generated_Image_ (49).png | The Empress | 03-the-empress | high | THE EMPRESS | III | no | PASS |
| Gemini_Generated_Image_ (47).png | The Emperor | 04-the-emperor | high | THE EMPEROR | IV | no | PASS |
| Gemini_Generated_Image_ (48).png | The Hierophant | 05-the-hierophant | high | THE HIEROPHANT | V | no | PASS |
| Gemini_Generated_Image_ (46).png | The Lovers | 06-the-lovers | high | THE LOVERS | VI | no | PASS |
| Gemini_Generated_Image_ (45).png | The Chariot | 07-the-chariot | high | THE CHARIOT | VII | no | PASS |
| Gemini_Generated_Image_ (44).png | Strength | 08-strength | high | STRENGTH | VIII | no | PASS |
| Gemini_Generated_Image_ (43).png | The Hermit | 09-the-hermit | high | THE HERMIT | IX | no | PASS |
| Gemini_Generated_Image_ (42).png | Wheel of Fortune | 10-wheel-of-fortune | high | WHEEL OF FORTUNE | X | no | PASS |
| Gemini_Generated_Image_ (41).png | Justice | 11-justice | high | JUSTICE | XI | no | PASS |
| Gemini_Generated_Image_ (40).png | The Hanged Man | 12-the-hanged-man | high | THE HANGED MAN | XII | no | PASS |
| Gemini_Generated_Image_ (38).png | Death | 13-death | high | DEATH | XIII | no | PASS |
| Gemini_Generated_Image_ (39).png | Temperance | 14-temperance | high | TEMPERANCE | XIV | no | PASS |
| Gemini_Generated_Image_ (37).png | The Devil | 15-the-devil | high | THE DEVIL | XV | no | PASS |
| Gemini_Generated_Image_ (33).png | The Tower | 16-the-tower | high | THE TOWER | XVI | no | PASS |
| Gemini_Generated_Image_sp4v2vsp4v2vsp4v.png | The Star | 17-the-star | high | THE STAR | XVII | no | PASS (traditional RWS nudity) |
| Gemini_Generated_Image_ (36).png | The Moon | 18-the-moon | high | THE MOON | XVIII | no | PASS |
| Gemini_Generated_Image_ (34).png | The Sun | 19-the-sun | high | THE SUN | XIX | no | PASS |
| Gemini_Generated_Image_ (35).png | Judgement | 20-judgement | high | JUDGEMENT | XX | no | PASS |
| Gemini_Generated_Image_ (32).png | The World | 21-the-world | high | THE WORLD | XXI | no | PASS |
| Gemini_Generated_Image_ (16).png | Two of Cups | cups-02 | high | TWO OF CUPS | II | no | PASS |
| Gemini_Generated_Image_34iqg434iqg434iq.png | Two of Cups | cups-02 (rejected alt) | high | TWO OF CUPS | XVI (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (15).png | Three of Cups | cups-03 | high | THREE OF CUPS | none | no | PASS |
| Gemini_Generated_Image_e03blte03blte03b.png | Three of Cups | cups-03 (rejected alt) | high | THREE OF CUPS | XVII (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (13).png | Four of Cups | cups-04 | high | FOUR OF CUPS | IV | no | PASS |
| Gemini_Generated_Image_2yb2m22yb2m22yb2.png | Four of Cups | cups-04 (rejected alt) | high | FOUR OF CUPS | XVIII (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (14).png | Five of Cups | cups-05 | high | FIVE OF CUPS | V | no | PASS |
| Gemini_Generated_Image_h9zdtqh9zdtqh9zd.png | Five of Cups | cups-05 (rejected alt) | high | FIVE OF CUPS | XIX (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (12).png | Six of Cups | cups-06 | high | SIX OF CUPS | XII (anomalous) | no | PASS_WITH_WARNING |
| Gemini_Generated_Image_glvoaxglvoaxglvo.png | Six of Cups | cups-06 (rejected alt) | high | SIX OF CUPS | XX (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (11).png | Seven of Cups | cups-07 | high | SEVEN OF CUPS | VII | no | PASS |
| Gemini_Generated_Image_gezuyegezuyegezu.png | Seven of Cups | cups-07 (rejected alt) | medium | SEVEN OF CUPS | XXI (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (10).png | Eight of Cups | cups-08 | high | EIGHT OF CUPS | VIII | no | PASS |
| Gemini_Generated_Image_b6hn4db6hn4db6hn.png | Eight of Cups | cups-08 (rejected alt) | high | EIGHT OF CUPS | XXII (invalid) | yes | DUPLICATE |
| Gemini_Generated_Image_ (9).png | Nine of Cups | cups-09 | medium | NINE OF CUPS | IX | no | PASS_WITH_WARNING (cup count ambiguous) |
| Gemini_Generated_Image_t6dka3t6dka3t6dk.png | Nine of Cups | cups-09 (rejected alt) | medium | NINE OF CUPS | XXIII (invalid) | yes | DUPLICATE |
| Gemini_Generated_Image_ (8).png | Ten of Cups | cups-10 | high | TEN OF CUPS | X | no | PASS |
| Gemini_Generated_Image_p60subp60subp60s.png | Ten of Cups | cups-10 (rejected alt) | medium | TEN OF CUPS | XXIV (invalid) | yes | DUPLICATE |
| Gemini_Generated_Image_wnpzxswnpzxswnpz (3).png | Ten of Cups | cups-10 (exact dup of (8)) | high | TEN OF CUPS | X | yes | DUPLICATE |
| Gemini_Generated_Image_ (17).png | Ace of Cups | cups-ace | high | ACE OF CUPS | none | no | PASS |
| Gemini_Generated_Image_fchhb5fchhb5fchh.png | Ace of Cups | cups-ace (rejected alt) | medium | ACE OF CUPS | XV (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (3).png | King of Cups | cups-king | high | KING OF CUPS | XVII (anomalous) | no | PASS |
| Gemini_Generated_Image_6t7p5q6t7p5q6t7p.png | King of Cups | cups-king (rejected alt) | medium | KING OF CUPS | XIV (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_ (6).png | Knight of Cups | cups-knight | medium | KNIGHT OF CUPS | XIII (anomalous) | no | PASS_WITH_WARNING |
| Gemini_Generated_Image_29kkx229kkx229kk.png | Knight of Cups | cups-knight (rejected alt) | medium | KNIGHT OF CUPS | XII (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_wnpzxswnpzxswnpz (1).png | Knight of Cups | cups-knight (rejected alt) | high | KNIGHT OF CUPS | XIII (shown twice) | yes | DUPLICATE (size outlier 1536x2752) |
| Gemini_Generated_Image_ (7).png | Page of Cups | cups-page | high | PAGE OF CUPS | XXVI (invalid) | no | PASS_WITH_WARNING |
| Gemini_Generated_Image_b20osb20osb20osb.png | Page of Cups | cups-page (rejected alt) | high | PAGE OF CUPS | XI (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_wnpzxswnpzxswnpz (2).png | Page of Cups | cups-page (exact dup of (7)) | high | PAGE OF CUPS | XXVI (invalid) | yes | DUPLICATE |
| Gemini_Generated_Image_ (5).png | Queen of Cups | cups-queen | high | QUEEN OF CUPS | none | no | PASS |
| Gemini_Generated_Image_q0rnleq0rnleq0rn.png | Queen of Cups | cups-queen (rejected alt) | high | QUEEN OF CUPS | XIII (anomalous) | yes | DUPLICATE |
| Gemini_Generated_Image_wnpzxswnpzxswnpz.png | Queen of Cups | cups-queen (exact dup of (5)) | high | QUEEN OF CUPS | none | yes | DUPLICATE |
| Gemini_Generated_Image_fohrhbfohrhbfohr.png | Two of Pentacles | pentacles-02 | high | TWO OF PENTACLES | II | no | PASS |
| Gemini_Generated_Image_igl4szigl4szigl4.png | Three of Pentacles | pentacles-03 | high | THREE OF PENTACLES | III | no | PASS |
| Gemini_Generated_Image_hekpvfhekpvfhekp.png | Four of Pentacles | pentacles-04 | high | FOUR OF PENTACLES | IV | no | PASS |
| Gemini_Generated_Image_igl4szigl4szigl4 (1).png | Five of Pentacles | pentacles-05 | high | FIVE OF PENTACLES | V | no | PASS |
| Gemini_Generated_Image_jt12y1jt12y1jt12.png | Six of Pentacles | pentacles-06 | high | SIX OF PENTACLES | VI | no | PASS |
| Gemini_Generated_Image_jt12y1jt12y1jt12 (1).png | Seven of Pentacles | pentacles-07 | high | SEVEN OF PENTACLES | VII | no | PASS |
| Gemini_Generated_Image_jt12y1jt12y1jt12 (2).png | Eight of Pentacles | pentacles-08 | high | EIGHT OF PENTACLES | VIII | no | PASS_WITH_WARNING (rack shows 9 coins) |
| Gemini_Generated_Image_7j0wig7j0wig7j0w.png | Nine of Pentacles | pentacles-09 | high | NINE OF PENTACLES | garbled | no | PASS |
| Gemini_Generated_Image_7j0wig7j0wig7j0w (1).png | Nine of Pentacles | pentacles-09 (rejected) | medium | NINE OF PENTACLES | garbled | no | REGENERATE_RECOMMENDED (defective render) |
| Gemini_Generated_Image_b1728ub1728ub172.png | Ten of Pentacles | pentacles-10 | medium | TEN OF PENTACLES | X | no | PASS_WITH_WARNING (sword-arch symbolism) |
| Gemini_Generated_Image_v7awzvv7awzvv7aw.png | Ten of Pentacles | pentacles-10 (rejected alt) | medium | TEN OF PENTACLES | X | yes | DUPLICATE |
| Gemini_Generated_Image_fb2saifb2saifb2s.png | Ace of Pentacles | pentacles-ace | high | ACE OF PENTACLES | A | no | PASS |
| Gemini_Generated_Image_39bjxt39bjxt39bj (2).png | Ace of Pentacles | pentacles-ace (rejected alt) | high | ACE OF PENTACLES | A | yes | DUPLICATE |
| Gemini_Generated_Image_tw9ffqtw9ffqtw9f.png | King of Pentacles | pentacles-king | high | KING OF PENTACLES | K | no | PASS |
| Gemini_Generated_Image_r5f2t5r5f2t5r5f2.png | Knight of Pentacles | pentacles-knight | high | KNIGHT OF PENTACLES | K | no | PASS |
| Gemini_Generated_Image_7agp3t7agp3t7agp.png | Page of Pentacles | pentacles-page | high | PAGE OF PENTACLES | XXXIX (invalid) | no | PASS (stray swords in bg noted) |
| Gemini_Generated_Image_7j0wig7j0wig7j0w (2).png | Queen of Pentacles | pentacles-queen | high | QUEEN OF PENTACLES | Q | no | PASS (cropped from outpainted canvas, see §5) |
| Gemini_Generated_Image_r580ar580ar580ar.png | Two of Swords | swords-02 | high | TWO OF SWORDS | XXX (invalid) | no | PASS |
| Gemini_Generated_Image_dd0ax0dd0ax0dd0a.png | Three of Swords | swords-03 | medium | THREE OF SWORDS | XXXI (invalid) | no | PASS_WITH_WARNING |
| Gemini_Generated_Image_596v3v596v3v596v.png | Four of Swords | swords-04 | high | FOUR OF SWORDS | XXXII (invalid) | no | PASS |
| Five of Swords.png | Five of Swords | swords-05 | high | FIVE OF SWORDS | V | no | PASS |
| Gemini_Generated_Image_ (2).png | Five of Swords | swords-05 (exact dup) | high | FIVE OF SWORDS | V | yes | DUPLICATE |
| Gemini_Generated_Image_6se4516se4516se4.png | Five of Swords | swords-05 (rejected alt) | high | FIVE OF SWORDS | XXXIII (invalid) | yes | DUPLICATE |
| Six of Swords.png | Six of Swords | swords-06 | high | SIX OF SWORDS | VI | no | PASS |
| Gemini_Generated_Image_ (1).png | Six of Swords | swords-06 (exact dup) | high | SIX OF SWORDS | VI | yes | DUPLICATE |
| Gemini_Generated_Image_6q1osf6q1osf6q1o.png | Six of Swords | swords-06 (rejected alt) | high | SIX OF SWORDS | XXXIV (invalid) | yes | DUPLICATE |
| Seven of Swords.png | Seven of Swords | swords-07 | high | SEVEN OF SWORDS | VII | no | PASS |
| Gemini_Generated_Image_.png | Seven of Swords | swords-07 (exact dup) | high | SEVEN OF SWORDS | VII | yes | DUPLICATE |
| Gemini_Generated_Image_39bjxt39bjxt39bj (3).png | Seven of Swords | swords-07 (rejected) | high | SEVEN OF SWIE (typo/defect) | XXXV (invalid) | yes | DUPLICATE (title-text render defect) |
| Gemini_Generated_Image_6n76no6n76no6n76.png | Eight of Swords | swords-08 | medium | EIGHT OF SWORDS | XXXVI (invalid) | no | PASS_WITH_WARNING |
| Gemini_Generated_Image_u3d9kyu3d9kyu3d9.png | Nine of Swords | swords-09 | high | NINE OF SWORDS | XXXVII (invalid) | no | PASS |
| Gemini_Generated_Image_wr2n5vwr2n5vwr2n.png | Ten of Swords | swords-10 | high | TEN OF SWORDS | XXXVIII (invalid) | no | PASS |
| Gemini_Generated_Image_ (4).png | Ace of Swords | swords-ace | high | ACE OF SWORDS | XVII (anomalous) | no | PASS |
| Gemini_Generated_Image_ahjph1ahjph1ahjp.png | Ace of Swords | swords-ace (rejected alt) | high | ACE OF SWORDS | XXIX (invalid) | yes | DUPLICATE |
| Gemini_Generated_Image_g7ujl6g7ujl6g7uj.png | King of Swords | swords-king | high | KING OF Swords (mixed case) | XXVIII (invalid) | no | PASS |
| Gemini_Generated_Image_39bjxt39bjxt39bj (1).png | Knight of Swords | swords-knight | high | KNIGHT OF SWORDS | K | no | PASS |
| Gemini_Generated_Image_sgwzwcsgwzwcsgwz.png | Knight of Swords | swords-knight (rejected alt) | high | KNIGHT OF SWORDS | XXVI (invalid) | yes | DUPLICATE |
| Gemini_Generated_Image_6ke6ku6ke6ku6ke6.png | Page of Swords | swords-page | high | PAGE OF Swords (mixed case) | XXV (invalid) | no | PASS |
| Gemini_Generated_Image_256cst256cst256c.png | Queen of Swords | swords-queen | high | QUEEN OF Swords (mixed case) | XXVII (invalid) | no | PASS |
| Gemini_Generated_Image_ (30).png | Two of Wands | wands-02 | high | TWO OF WANDS | none | no | PASS |
| Gemini_Generated_Image_ (29).png | Three of Wands | wands-03 | high | THREE OF WANDS | III | no | PASS |
| Gemini_Generated_Image_ (28).png | Four of Wands | wands-04 | high | FOUR OF WANDS | IV | no | PASS |
| Gemini_Generated_Image_ (25).png | Five of Wands | wands-05 | high | FIVE OF WANDS | V | no | PASS |
| Gemini_Generated_Image_ (27).png | Six of Wands | wands-06 | high | SIX OF WANDS | VI | no | PASS |
| Gemini_Generated_Image_ (26).png | Seven of Wands | wands-07 | high | SEVEN OF WANDS | VII | no | PASS |
| Gemini_Generated_Image_39bjxt39bjxt39bj.png | Seven of Wands (titled) | wands-07 (rejected) | medium | SEVEN OF WANDS | VII | yes | DUPLICATE (suit-symbol mismatch: looks like swords) |
| Gemini_Generated_Image_ (24).png | Eight of Wands | wands-08 | high | EIGHT OF WANDS | VIII | no | PASS |
| Gemini_Generated_Image_ (23).png | Nine of Wands | wands-09 | high | NINE OF WANDS | XVI (anomalous) | no | PASS |
| Gemini_Generated_Image_ (22).png | Ten of Wands | wands-10 | high | TEN OF WANDS | X | no | PASS |
| Gemini_Generated_Image_ (31).png | Ace of Wands | wands-ace | high | ACE OF WANDS | I | no | PASS |
| Gemini_Generated_Image_ (18).png | King of Wands | wands-king | high | KING OF WANDS | XIV (anomalous) | no | PASS |
| Gemini_Generated_Image_ (20).png | Knight of Wands | wands-knight | medium | KNIGHT OF WANDS | I (anomalous) | no | PASS_WITH_WARNING |
| Gemini_Generated_Image_ (21).png | Page of Wands | wands-page | high | PAGE OF WANDS | none | no | PASS |
| Gemini_Generated_Image_ (19).png | Queen of Wands | wands-queen | high | QUEEN OF WANDS | none | no | PASS |
| ChatGPT Image Aug 23, 2026, 12_04_49 AM.png | NOT A CARD (UI board) | — | high | BOARD 01: HOME + GLOBAL SHELL | — | no | FIX_REQUIRED (wrong asset, not tarot art) |
| ChatGPT Image Aug 23, 2026, 12_07_14 AM.png | NOT A CARD (UI board) | — | high | BOARD 02 / TU VI COMPLETE FLOW | — | no | FIX_REQUIRED |
| ChatGPT Image Aug 23, 2026, 12_09_38 AM.png | NOT A CARD (UI board) | — | high | BOARD 03 / TAROT 78 COMPLETE FLOW | — | no | FIX_REQUIRED |
| ChatGPT Image Aug 23, 2026, 12_40_58 AM.png | NOT A CARD (UI board) | — | high | BOARD 04 BAN DO SAO + THAN SO HOC | — | no | FIX_REQUIRED |
| ChatGPT Image Aug 23, 2026, 12_43_43 AM.png | NOT A CARD (UI board) | — | high | BOARD 05 - ACCOUNT + PREMIUM + HISTORY + SYSTEM + MOBILE | — | no | FIX_REQUIRED |
| Gemini_Generated_Image_ (53).png | NOT A CARD (full-deck photo) | — | high | — | — | no | FIX_REQUIRED |
| Gemini_Generated_Image_ (54).png | NOT A CARD (full-deck photo) | — | high | — | — | no | FIX_REQUIRED |

## 9. Summary

- Source images: **115**
- Unique Tarot cards identified and assigned: **78 / 78** (Major 22/22, Wands 14/14, Cups 14/14, Swords 14/14, Pentacles 14/14)
- Missing: **0**
- Exact-duplicate files: **6 pairs** (12 files)
- Near-duplicate/competing-art groups: **21** canonical IDs had 1–2 rejected alternates; `cups-knight` had 2 rejected alternates (3-way competition)
- Non-card files (excluded): **7** (5 UI mockup boards + 2 full-deck photos)
- Defective render (excluded, superseded by clean duplicate): **1** (`pentacles-09` alt)
- Files requiring crop before use: **1** (`pentacles-queen`, outpainted canvas — see §5)
- Unknown / unidentifiable: **0**
- Incorrect titles: **1 minor defect** (typo/truncated "SWIE" on a rejected Seven of Swords alternate — not used)
- Incorrect numerals: **widespread on Minor Arcana** (see §6) — cosmetic only, does not affect identity, none corrected/edited per "no redesign" rule
- Dimension outliers: **1** (`cups-knight` alternate at 1536x2752, rejected) + **2** landscape 2816x1536 defective/outpainted renders (one rejected, one cropped)
- Style outliers: none beyond the symbolism notes in §7

All 78 canonical cards were resolved with a confident source image. No hard-stop condition was triggered.
