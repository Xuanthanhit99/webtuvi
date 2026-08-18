# Vietnamese Tử Vi Đẩu Số — Authoritative Sources Register

**Status:** Sprint 15 (Domain Source & Pre-Implementation Audit). Research only — no code.
**Method disclosure:** Every source below was located via web search (`WebSearch`/`WebFetch`) in
this session. No source was invented. Where a source's full text could not be directly read (most
of them — see "Verification depth" per source), that limitation is stated explicitly rather than
implied away. **No entry in this document should be read as "verified against the primary text
page-by-page"** unless its Verification depth says so. None currently do — that is the central,
honest finding of this sprint (see the audit report's final verdict).

---

## Source hierarchy definitions

- **CANONICAL** — a primary text, directly read and cross-checked cell-by-cell against at least one
  independent primary source, with page/section citation. **No source below currently qualifies.**
- **CORROBORATING** — a primary text identified by name/author/year and cited consistently by
  multiple independent secondary discussions, OR a secondary source whose stated methodology names
  its own primary references and whose structural claims agree with another independent secondary
  source. Usable to shape a specification and to know *what to verify*, not yet usable as the sole
  basis for a shipped calculation cell.
- **SECONDARY** — a single web source (blog, practitioner site, forum) with no cited bibliography,
  used only as directional/structural evidence, always requiring corroboration before any rule is
  built on it alone.
- **REJECTED/UNRELIABLE** — content that is calculator-app output with no methodology shown, or
  that contradicts a CORROBORATING source without resolving the contradiction.

---

## Primary texts identified (not yet directly read in full)

### SOURCE_ID: VDTTL-1956
- **Title:** Tử Vi Đẩu Số Tân Biên
- **Author:** Vân Đằng Thái Thứ Lang
- **Year / publisher:** 1956, Saigon (multiple modern reprints/PDF scans exist)
- **Source type:** Primary Vietnamese-language reference text
- **Tradition/school:** Vietnamese-adapted Tử Vi (the most widely cited Vietnamese-language source
  in the domain overall — described by contemporaries as "Tử Vi Kinh," i.e. treated as the closest
  thing to a canonical text for the Vietnamese tradition specifically)
- **Rules potentially supported:** general chart construction, Mệnh/Thân, Cục, star placement,
  interpretation (3-part structure: construction / general interpretation / vận interpretation)
- **Confidence:** High as a *candidate* canonical source for "which tradition" (decision register
  item 1); **not yet verified** against its actual page content for any specific calculation rule
  in this session — scanned PDF copies exist online but were not parsed cell-by-cell here.
- **Conflicts with other sources:** unknown until directly read; cited as one of two sources behind
  the Nạp Âm-based Cục method described by SOURCE_ID SECONDARY-TNT (below).
- **Verification depth:** Existence, author, year, and reputation corroborated by 8 independent
  Vietnamese sources in search results (blogspot bios, Scribd/PDF hosts, bookstore listings,
  tuvi.cohoc.net). Full text not read in this session.

### SOURCE_ID: TD-TOANTHU
- **Title:** Tử Vi Đẩu Số Toàn Thư (紫微斗数全书)
- **Author:** Trần Đoàn (Hi Di Trần Đoàn), founder of the Tử Vi school; Vietnamese edition compiled/
  translated with Lâm Canh Phàm
- **Year / publisher:** Chinese classical text of disputed original date; the specific Vietnamese
  edition referenced repeatedly online is dated 1973 (Trúc Lâm An Thư Cục, Taiwan)
- **Source type:** Primary classical Chinese text (Zi Wei Dou Shu root text), Vietnamese translation
- **Tradition/school:** Root/originating text for the entire Tử Vi Đẩu Số tradition, both Chinese
  Zi Wei Dou Shu and its Vietnamese derivatives
- **Rules potentially supported:** foundational theory and construction rules predating the
  Vietnamese-specific adaptations
- **Confidence:** High as the historical root text; **not yet verified** against actual page
  content in this session. A specific annotated Vietnamese edition ("Đồ Giải Tử Vi Đẩu Số Toàn
  Thư," hosted as a PDF at thuviensach.vn) was located but not parsed for table content here.
- **Conflicts with other sources:** the Chinese/Zi Wei Dou Shu tradition and the Vietnamese Tử Vi
  tradition are known to diverge in places (this is the entire reason decision-register item 1
  exists) — this text is the shared ancestor, not proof either tradition's specific rules match it
  exactly today.
- **Verification depth:** Existence and authorship corroborated by 10 independent sources (Google
  Books listings, Scribd, multiple Vietnamese bookstore/library sites). Full text not read.

### SOURCE_ID: HLDP-1972
- **Title:** Tử Vi Áo Bí Biện Chứng Học
- **Author:** Hà Lạc Dã Phu
- **Year:** 1972
- **Source type:** Primary Vietnamese-language reference text
- **Rules potentially supported:** cited (via SOURCE_ID SECONDARY-TNT) as a source for the
  Nạp Âm-based Cục derivation method
- **Confidence:** Identified only through one secondary citation in this session — not independently
  cross-searched for existence/reputation the way VDTTL-1956 was.
- **Verification depth:** Low — single mention, not independently corroborated by a second source
  in this session. Treat as a lead to verify, not yet even CORROBORATING on its own.

---

## Calendar-layer source (higher confidence — academically grounded)

### SOURCE_ID: HND-ALGORITHM
- **Title:** Vietnamese lunar calendar computation algorithm ("thuật toán tính âm lịch")
- **Author:** Hồ Ngọc Đức (mathematician)
- **Year:** documented from 2004 onward; algorithm itself grounded in:
  - Jean Meeus, *Astronomical Algorithms* (1998)
  - Edward M. Reingold & Nachum Dershowitz, *Calendrical Calculations*
- **Source type:** Named individual's published algorithm, built on two independently citable,
  established astronomical/computational reference works — not a from-scratch personal claim.
- **What it resolves:** solar→lunar date conversion, new-moon-based month boundaries, leap-month
  (intercalary month) determination via Principal Terms, computed for the UTC+7 meridian
  specifically (the documented reason the Vietnamese calendar occasionally diverges from the
  Chinese calendar, which is computed for a different meridian/timezone).
- **Confidence:** **High** for this specific, narrower layer (calendar conversion only — this
  source says nothing about Tử Vi-specific rules). Documented accuracy: ±1 day only for dates
  before approximately 1500 CE; effectively exact for any realistic birth date. Independently
  re-implemented in at least 4 separate open-source libraries found in this session
  (`lunar-date-vn`, `lunar-calendar-ts-vi`, `@dqcai/vn-lunar`, `hnthap/lunar-calendar-api`), all
  crediting the same original algorithm — convergent reimplementation by independent authors over
  ~20 years is meaningful corroboration for an algorithmic (non-interpretive) claim in a way it
  would not be for a disputed astrological rule.
- **Verification depth:** Not re-derived from the astronomical formulas in this session, but the
  citation chain (Meeus; Reingold & Dershowitz) is to real, independently checkable, non-Tử-Vi
  academic works, and the algorithm's real-world adoption is broad and long-running.
- **Status:** Recommended as the calendar-layer foundation — see decision register item 2 (calendar
  library recommendation is separable from the giờ Tý boundary question, which this source does
  not resolve).

---

## Secondary sources used for structural corroboration (not standalone-authoritative)

### SOURCE_ID: SECONDARY-TNT
- **URL:** trannhatthanh.wordpress.com, "Định Cục Tính và an Vòng Tràng Sinh trong Tử Vi" (2012)
- **What it provides:** a stated methodology (Cục = the Nạp Âm five-element quality of the Can-Chi
  of the month containing the Mệnh palace), one fully worked example (Bính-year, Mệnh at Dậu →
  Hỏa Lục Cục), and citations to VDTTL-1956 and HLDP-1972.
- **Confidence:** CORROBORATING for methodology shape and the single worked example; explicitly
  **not** a full lookup table — the author presents this as an alternative to memorizing "poetic
  formulas," implying the traditional presentation is table/mnemonic-based, not this derivation.
- **Reused as:** the strongest lead toward primary-source verification for decision register item 5
  (Cục), not as the resolution itself.

### SOURCE_ID: SECONDARY-TVSG-MENH-THAN
- **URL:** tuvisaigon.vn, "Bài 1: An Mệnh - Thân trong Tử vi đẩu số"
- **What it provides:** explicit numeric formulas — Mệnh = (tháng − giờ) + 1 (mod 12, add 12 if
  negative); Thân = (tháng + giờ) − 1 (mod 12, subtract 12 if >12) — where "tháng"/"giờ" are the
  lunar birth month number and birth-hour-branch index counted from a Dần=1 reference.
- **Confidence:** SECONDARY on its own (article cites no bibliography, single named contributor
  "Minh Tuệ," no publisher). **Structurally corroborated** by an independent second search result
  describing the same forward/backward (thuận/nghịch) counting logic without giving the numeric
  formula — agreement between an independently-worded description and this formula is a real
  positive signal, not proof.
- **Reused as:** the leading candidate formula for decision register item 4 (Mệnh/Thân), pending
  verification against a primary text.

### SOURCE_ID: SECONDARY-CUC-STRUCTURE
- **What it provides:** confirms the five Cục names/numbers (Thủy Nhị=2, Mộc Tam=3, Kim Tứ=4,
  Thổ Ngũ=5, Hỏa Lục=6) are consistent across many independent Vietnamese practitioner sites, and
  explicitly states: *"The exact origins and theoretical justification for these specific numbers
  associated with each element remain subjects of scholarly debate within Tử Vi studies."*
- **Confidence:** CORROBORATING for the *category structure* (names/numbers), but this source
  itself flags the *derivation* as unsettled — read as evidence for caution, not for a resolved
  table.

### SOURCE_ID: SECONDARY-TUHOA-SCHOOLS
- **What it provides:** explicit, named confirmation of a real school split — Bắc Phái (Northern
  School) treats Tứ Hóa as the structural core of the whole system; Nam Phái (Southern School)
  derives Tứ Hóa placement from the birth-year Heavenly Stem, with one specific named lineage
  cited as a high-accuracy reference: *"Tử vi đẩu số toàn tập - Trung Châu phái - Lục Bân Triệu -
  Khâm Thiên môn"* (Trung Châu school, Lục Bân Triệu, Khâm Thiên gate). The source states plainly:
  *"the different schools of Tử Vi Đẩu Số often do not have unified views"* on Tứ Hóa specifically.
- **Confidence:** This is the strongest, most explicit evidence found in this session of a genuine,
  named, real (not hypothetical) school conflict — directly confirms decision register item 10
  cannot be resolved by picking whichever table appears most often online.

### SOURCE_ID: SECONDARY-GIOTY
- **What it provides:** explicit naming of a real internal split even within convention, not just
  across schools: "Giờ Tý Sơ" (23:00–24:00, early Tý) vs. "Giờ Tý Chính" (00:00–01:00, exact/main
  Tý) as two named, different conventions in active use.
- **Confidence:** Directly confirms decision register item 2 is a real open question, not
  overcaution inherited from the product definition document.

### SOURCE_ID: SECONDARY-TUANTRIET-BASIS
- **What it provides:** confirms Tuần and Triệt use **different input bases** — Tuần is derived
  from which "Tuần Giáp" (decade group within the 60-year sexagenary cycle) the birth year belongs
  to; Triệt is derived directly from the birth year's Heavenly Stem (Can) alone. States a person can
  have Tuần affecting one pair of palaces and Triệt affecting a different pair, up to 4 palaces
  total.
- **Confidence:** Directly confirms the product definition's own instruction ("do not assume Tuần
  and Triệt follow analogous rules") reflects a real structural difference, not caution for its own
  sake. Does not provide the actual lookup table for either.

### SOURCE_ID: SECONDARY-14STARS-STRUCTURE
- **What it provides:** confirms the classic two-group model — the "Tử Vi tinh hệ" (6 stars: Tử Vi,
  Thiên Cơ, Thái Dương, Vũ Khúc, Thiên Đồng, Liêm Trinh, placed in reverse/nghịch direction from Tử
  Vi's own position with stated but only partially specified offsets) and the "Thiên Phủ tinh hệ"
  (8 stars: Thiên Phủ, Thái Âm, Tham Lang, Cự Môn, Thiên Tướng, Thiên Lương, Thất Sát, Phá Quân,
  placed forward/thuận from Thiên Phủ's position). Confirms Tử Vi and Thiên Phủ sit in a fixed
  mirror relationship around the Tị/Hợi axis.
- **Confidence:** CORROBORATING for structure/shape; the exact per-star offset count needed for a
  deterministic engine was only partially given (some offsets stated, e.g. "one position apart,"
  "two positions apart," others not) — **not sufficient alone to build the placement table.**

### SOURCE_ID: SECONDARY-AUXSTARS-MEANINGS
- **What it provides:** confirms the standard six-auspicious-star grouping (Văn Xương, Văn Khúc,
  Tả Phù, Hữu Bật, Thiên Khôi, Thiên Việt) exists as a recognized set, and gives interpretive
  meaning, but **no deterministic placement formula** for any of them.
- **Confidence:** UI_COPY/interpretation-grade only. Zero calculation value. Placement rules for
  every MVP auxiliary star (§4D of the product definition) remain UNSOURCED from this session's
  research.

---

## Open-source implementations (secondary comparison only — per Sprint 15 instructions, never
proof of domain correctness)

### SOURCE_ID: IZTRO
- **Repo:** github.com/SylarLong/iztro ("紫微研习社")
- **License / maintenance:** actively maintained, popular (multi-language ports exist — Dart,
  Python), documented at iztro.com
- **Language:** JavaScript/TypeScript, with derivative ports
- **Calendar implementation:** supports both lunar and solar calendar input
- **Rule coverage:** full 12-palace, traditional star-placement logic per its own documentation
- **School/tradition:** not independently confirmed in this session which specific school iztro
  encodes, or whether it targets Chinese Zi Wei Dou Shu conventions vs. Vietnamese-specific
  conventions — this is exactly the kind of divergence decision register item 1 exists to resolve,
  so iztro's output **must not** be treated as ground truth for a Vietnamese-tradition product
  without that check.
- **Use in this project:** comparison/sanity-check tool only, once a canonical source is selected —
  never a source of rules itself, per explicit instruction.

### Others found but not evaluated this session
`ruijayfeng/ziwei`, `EdwinXiang/dart_iztro` (an iztro port) — noted for future comparison, not
evaluated.

---

## Rejected / not usable as authoritative

- Generic horoscope/lifestyle sites (soha.vn, fptshop.com.vn, mytour.vn, tierra.vn as a standalone
  citation) — SEO-oriented consumer content, used only where their claims were independently
  corroborated by a second, more specific source; never cited alone in the decision register.
- Any AI-generated explanation, including this document's own author's prior knowledge — explicitly
  excluded as a source per the product definition's own rule ("'Claude/Gemini says this is the
  standard formula' is explicitly not an acceptable reference") and this sprint's brief.

---

## What this register does *not* contain

A verified, cell-by-cell Cục lookup table; a verified, cell-by-cell 14-star offset table; a verified
Tuần lookup table; a verified Triệt lookup table; a verified 10-Can × 4-Hóa Tứ Hóa table; verified
auxiliary-star placement formulas. **These require either (a) direct, careful reading of VDTTL-1956
and/or TD-TOANTHU by someone fluent in the material and the language, with a second independent
reviewer cross-checking, or (b) a domain-expert consultation** — not further web search, which has
now been exhausted to the point of diminishing returns for table-level precision (see the main audit
report §"web research boundary").
