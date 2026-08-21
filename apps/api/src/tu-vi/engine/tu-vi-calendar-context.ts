import { parseTuViBirthInput, type TuViBirthInput, type ParseTuViBirthInputOptions } from './tu-vi-canonical-input';
import { getHourBranch, type EarthlyBranch } from './tu-vi-hour-branch';
import { convertGregorianToTuViLunarDate, TUVI_CALENDAR_VERSION, TUVI_TIMEZONE_OFFSET_HOURS, type TuViLunarDate } from './tu-vi-calendar.adapter';

/**
 * Sprint 18B.1 — the Tử Vi calendar foundation's single orchestration entry point.
 *
 * Produces the canonical, immutable set of calendar-layer facts every later phase (Mệnh/Thân,
 * Cục, star placement, ...) will read from — and computes NOTHING beyond those facts. Pure
 * function: no DB access, no I/O, no AI call, no randomness. Mirrors Eastern Horoscope's own
 * engine discipline (`eastern-horoscope-engine.ts`) — this is the ONE place that assembles a Tử Vi
 * calendar context; nothing downstream may recompute or approximate any field here.
 *
 * Explicitly OUT OF SCOPE for this file and this sprint (Sprint 18B.1): Mệnh, Thân, Cục, Tử Vi
 * anchor, 14 Chính Tinh, Tuần, Triệt, Tứ Hóa, CORE_13 auxiliary stars, AI interpretation. See
 * `docs/progress/sprint-18b1-calendar-foundation-final-report.md` §36 for the explicit
 * no-domain-leakage audit.
 */

/** `canonical-ruleset-v1.md` §7 — `TUVI_RULESET_V1 = VDTTL_1956_V1`, the frozen implementation
 * specification this calendar context is built to feed. */
export const TUVI_RULESET_VERSION = 'vdttl-1956-v1';

export interface TuViCalendarContext {
  readonly solarDate: { readonly year: number; readonly month: number; readonly day: number };
  readonly birthTime: { readonly hour: number; readonly minute: number };
  readonly timezoneOffsetHours: number;
  readonly lunarDate: TuViLunarDate;
  readonly hourBranch: EarthlyBranch;
  /**
   * The civil/lunar day used for every day-dependent Tử Vi calculation downstream (Cục, Tử Vi
   * anchor) — per the `TUVI-GIO-02` convention lock (`canonical-ruleset-v1.md` §1 row 8: midnight
   * rollover, disclosed as inherited from the general calendar layer, not VDTTL-1956-specific).
   *
   * Under this locked convention, the effective date is ALWAYS identical to `solarDate`: a
   * 23:00–23:59 birth uses the day that is ending (its own calendar date), and a 00:00–00:59
   * birth uses the day that has begun (its own calendar date) — neither is shifted forward or
   * backward by a day. This field exists as its own explicit, named, separately-tested value
   * rather than being silently folded into `solarDate` inline, specifically so that if a future
   * sprint ever finds VDTTL-1956-specific evidence supporting the alternative "Giờ Tý Sơ"
   * convention instead (which WOULD require shifting a 23:00–23:59 birth's effective date forward
   * by one day), there is exactly one place to change, with its own test coverage already in
   * place to catch any accidental regression to the other convention.
   */
  readonly effectiveTuViDate: { readonly year: number; readonly month: number; readonly day: number };
  /** Sprint 18B.5 addition (additive/optional, non-breaking) — passed through unchanged from
   * `TuViBirthInput.sex` so it is available to any downstream rule that genuinely needs it
   * (currently only Hỏa Tinh/Linh Tinh, `tu-vi-core13.ts`) without re-parsing raw input. */
  readonly sex?: TuViBirthInput['sex'];
  readonly calendarVersion: string;
  readonly rulesetVersion: string;
}

export type BuildTuViCalendarContextOptions = ParseTuViBirthInputOptions;

export function buildTuViCalendarContext(input: TuViBirthInput, options: BuildTuViCalendarContextOptions = {}): TuViCalendarContext {
  const parsed = parseTuViBirthInput(input, options);

  const solarDate = { year: parsed.year, month: parsed.month, day: parsed.day };
  const birthTime = { hour: parsed.hour, minute: parsed.minute };
  const lunarDate = convertGregorianToTuViLunarDate(parsed.year, parsed.month, parsed.day);
  const hourBranch = getHourBranch(parsed.hour, parsed.minute);

  // TUVI-GIO-02 (midnight-rollover convention lock): the effective day never shifts under this
  // convention — see the `effectiveTuViDate` field doc comment above for why this is still
  // computed and named explicitly rather than assumed equal to `solarDate` inline.
  const effectiveTuViDate = { ...solarDate };

  return Object.freeze({
    solarDate: Object.freeze(solarDate),
    birthTime: Object.freeze(birthTime),
    timezoneOffsetHours: TUVI_TIMEZONE_OFFSET_HOURS,
    lunarDate: Object.freeze(lunarDate),
    hourBranch,
    effectiveTuViDate: Object.freeze(effectiveTuViDate),
    sex: parsed.sex,
    calendarVersion: TUVI_CALENDAR_VERSION,
    rulesetVersion: TUVI_RULESET_VERSION,
  });
}
