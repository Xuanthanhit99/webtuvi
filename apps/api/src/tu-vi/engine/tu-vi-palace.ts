import { EARTHLY_BRANCHES, type EarthlyBranch } from '../../eastern-horoscope/engine/eastern-horoscope-tables';

export { EARTHLY_BRANCHES };
export type { EarthlyBranch };

/**
 * TUVI-CUNG-01 — the canonical 12-palace ROLE order, forward (thuận) from Mệnh.
 *
 * `PALACE_POSITION` (which of the 12 Chi a palace physically sits at — `EarthlyBranch`, reused
 * from Eastern Horoscope's table module, per TUVI-01's confirmed "thuận = clockwise = increasing
 * index" rule) is kept strictly separate from `PALACE_ROLE` (which of the 12 named palaces — Mệnh,
 * Phúc Đức, etc. — occupies a given position for a specific chart). The mapping between them
 * depends on where Mệnh itself lands, computed per birth input; `PALACE_ROLES_FROM_MENH` below is
 * the FIXED offset table, always the same regardless of birth input.
 *
 * Resolved this sprint (Sprint 18B.2) — a genuine internal-consistency finding, not merely copied
 * from prior extraction:
 *
 * VDTTL-1956 p.6 ("5. AN MỆNH") states, immediately after describing how Mệnh is placed: "Sau khi
 * đã an Mệnh, bắt đầu theo chiều thuận, thứ tự an các cung: Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc,
 * Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Thê Thiếp (hay Phu Quân nếu là số đàn bà), Huynh Đệ." —
 * re-verified twice at 5× zoom this sprint, unambiguous, no word omitted between "cung:" and "Phúc
 * Đức". Ten names for eleven non-Mệnh palaces — one name (out of the book's own 12-palace
 * vocabulary, confirmed via its own Table of Contents: "4. CUNG MỆNH VÀ CUNG THÂN" p.52, "5. CUNG
 * PHỤ MẪU" p.124, "6. CUNG PHÚC ĐỨC" p.132, ...) is missing from this specific list: Phụ Mẫu.
 *
 * Naively reading the ten listed names as consecutive offsets +1 through +10 (leaving Phụ Mẫu at
 * +11, last before wrapping back to Mệnh) directly CONTRADICTS an already-established fact:
 * VDTTL-1956 p.7 ("6. AN THÂN") states Thân may only land on "Mệnh Viên, Phúc Đức, Quan Lộc, Thiên
 * Di, Tài Bạch, Thê Thiếp" — and `canonical-ruleset-v1.md` §5 (Sprint 18A.5) proved, directly from
 * VDTTL-1956's own Mệnh/Thân counting-direction prose, that the Thân−Mệnh offset is ALWAYS an EVEN
 * number (`2×giờ0 mod 12` ∈ {0,2,4,6,8,10}) — a hard mathematical consequence of the forward/
 * backward counting structure, independent of any palace name. Under the naive "+1 through +10"
 * reading, those six named palaces would sit at ODD offsets {1,3,5,7,9} (plus Mệnh's own 0) —
 * directly contradicting the proven even-offset invariant.
 *
 * The only offset assignment consistent with BOTH (a) the page-6 list's own unambiguous relative
 * order (Phúc Đức immediately before Điền Trạch immediately before Quan Lộc, etc. — never in
 * question) AND (b) the proven even-offset invariant is to insert Phụ Mẫu at +1, shifting the
 * entire listed sequence one position later (Phúc Đức+2, Điền Trạch+3, ..., Huynh Đệ+11). Checked:
 * Mệnh(0), Phúc Đức(2), Quan Lộc(4), Thiên Di(6), Tài Bạch(8), Thê Thiếp(10) — all even, exact
 * match. This is additionally consistent with the book's own Table of Contents (Phụ Mẫu discussed
 * immediately after the Mệnh/Thân chapter, before Phúc Đức) and with universal, non-disputed
 * Vietnamese/Chinese Tử Vi convention (used here only as a plausibility check, per this project's
 * standing sourcing discipline — the decisive evidence is the mathematical proof plus the two
 * independent primary-source statements above, not general background knowledge).
 *
 * Not a `CONVENTION_LOCK_REQUIRED` item (there is no genuine tie between equally-plausible options)
 * — classified `DETERMINISTICALLY_CROSS_CHECKED`, since the assignment is mathematically forced
 * given two already-established primary-source facts, not an arbitrary engineering choice.
 *
 * `Phu Thê` is used as the canonical, sex-neutral role identifier for offset+10 (VDTTL-1956 itself
 * uses sex-conditional wording — "Thê Thiếp" for a male chart, "Phu Quân" for a female chart — for
 * this one palace's colloquial name; the engine's canonical identifier stays sex-neutral, per this
 * phase's instruction to keep no UI/presentation labels embedded in engine logic — sex-conditional
 * display naming, if ever needed, is a later, non-engine concern).
 */
export const PALACE_ROLES_FROM_MENH = [
  'Mệnh',
  'Phụ Mẫu',
  'Phúc Đức',
  'Điền Trạch',
  'Quan Lộc',
  'Nô Bộc',
  'Thiên Di',
  'Tật Ách',
  'Tài Bạch',
  'Tử Tức',
  'Phu Thê',
  'Huynh Đệ',
] as const;

export type PalaceRole = (typeof PALACE_ROLES_FROM_MENH)[number];

/** 0-based index of `branch` in the fixed 12-position ring (Tý=0 … Hợi=11). Single source of truth
 * for palace-position arithmetic — nothing in this module or its callers may redefine this order. */
export function getPalaceIndex(branch: EarthlyBranch): number {
  return EARTHLY_BRANCHES.indexOf(branch);
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** The palace `offset` positions forward (thuận) from `branch`, wrapping deterministically. A
 * negative `offset` moves backward (nghịch) — safe for negative-modulo, per Phase 4's requirement. */
export function addPalaceOffset(branch: EarthlyBranch, offset: number): EarthlyBranch {
  const nextIndex = mod12(getPalaceIndex(branch) + offset);
  return EARTHLY_BRANCHES[nextIndex]!;
}

export type PalaceLayout = Readonly<Record<EarthlyBranch, PalaceRole>>;

/**
 * Assigns all 12 palace roles around the ring, given where Mệnh landed. Guarantees exactly one
 * Mệnh, exactly one of each other role, no duplicates, no missing role, by construction (a single
 * pass over the fixed 12-offset table) — see `tu-vi-palace.spec.ts` for the invariant test that
 * verifies this construction claim rather than merely asserting it.
 */
export function buildPalaceLayout(menhPosition: EarthlyBranch): PalaceLayout {
  const layout = {} as Record<EarthlyBranch, PalaceRole>;
  for (let offset = 0; offset < 12; offset++) {
    const branch = addPalaceOffset(menhPosition, offset);
    layout[branch] = PALACE_ROLES_FROM_MENH[offset]!;
  }
  return Object.freeze(layout);
}
