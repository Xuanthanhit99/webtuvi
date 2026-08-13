import moment from 'moment-timezone';
import { resolveNatalOrigin } from './natal-chart-timezone.util';

describe('resolveNatalOrigin', () => {
  it('uses tz-lookup directly when no country override applies', () => {
    // New York City — no override table entry for 'US'.
    const { origin, timezone } = resolveNatalOrigin({
      year: 2000,
      month: 6,
      day: 15,
      hour: 14,
      minute: 30,
      latitude: 40.7128,
      longitude: -74.006,
      countryCode: 'US',
    });

    expect(timezone).toBe('America/New_York');
    const expectedUtc = moment.tz({ year: 2000, month: 5, date: 15, hour: 14, minute: 30, second: 0 }, 'America/New_York').utc();
    expect(origin.utcTime.toISOString()).toBe(expectedUtc.toISOString());
  });

  it('is a pure function — repeated calls with identical input produce identical UTC/Julian Date', () => {
    const input = { year: 2000, month: 6, day: 15, hour: 14, minute: 30, latitude: 21.0285, longitude: 105.8542, countryCode: 'VN' };
    const a = resolveNatalOrigin(input);
    const b = resolveNatalOrigin(input);
    expect(a.origin.utcTimeFormatted).toBe(b.origin.utcTimeFormatted);
    expect(a.origin.julianDate).toBe(b.origin.julianDate);
    expect(a.timezone).toBe(b.timezone);
  });

  it('corrects Hanoi coordinates to Asia/Ho_Chi_Minh (tz-lookup misclassifies them as Asia/Bangkok)', () => {
    const { timezone } = resolveNatalOrigin({
      year: 2000,
      month: 6,
      day: 15,
      hour: 14,
      minute: 30,
      latitude: 21.0285,
      longitude: 105.8542,
      countryCode: 'VN',
    });

    expect(timezone).toBe('Asia/Ho_Chi_Minh');
  });

  it('produces the numerically correct UTC instant for a modern Vietnamese date (both zones agree on offset)', () => {
    const { origin } = resolveNatalOrigin({
      year: 2000,
      month: 6,
      day: 15,
      hour: 14,
      minute: 30,
      latitude: 21.0285,
      longitude: 105.8542,
      countryCode: 'VN',
    });

    const expectedUtc = moment.tz({ year: 2000, month: 5, date: 15, hour: 14, minute: 30, second: 0 }, 'Asia/Ho_Chi_Minh').utc();
    expect(origin.utcTime.toISOString()).toBe(expectedUtc.toISOString());
  });

  it('produces a DIFFERENT UTC instant for a pre-1975 Vietnamese date than the uncorrected Bangkok zone would (the correction materially changes the calculation for historical dates)', () => {
    const input = { year: 1970, month: 1, day: 1, hour: 12, minute: 0, latitude: 21.0285, longitude: 105.8542 };

    const corrected = resolveNatalOrigin({ ...input, countryCode: 'VN' });
    const uncorrected = resolveNatalOrigin({ ...input, countryCode: null });

    expect(corrected.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(uncorrected.timezone).toBe('Asia/Bangkok');
    expect(corrected.origin.utcTime.toISOString()).not.toBe(uncorrected.origin.utcTime.toISOString());

    // Vietnam used UTC+8 for this period (1959-1975); Thailand has used UTC+7 continuously since
    // 1920 — the corrected instant must match Vietnam's real historical offset, independently
    // computed here via moment-timezone directly (the IANA tzdata authority), not derived from
    // the same code path being tested.
    const expectedUtc = moment.tz({ year: 1970, month: 0, date: 1, hour: 12, minute: 0, second: 0 }, 'Asia/Ho_Chi_Minh').utc();
    expect(corrected.origin.utcTime.toISOString()).toBe(expectedUtc.toISOString());
  });

  it('applies no override for a country code not in the table', () => {
    const { timezone } = resolveNatalOrigin({
      year: 2000,
      month: 6,
      day: 15,
      hour: 14,
      minute: 30,
      latitude: 21.0285,
      longitude: 105.8542,
      countryCode: 'TH',
    });

    // Thailand itself has no override entry — falls through to tz-lookup's own (correct, in this
    // case) result.
    expect(timezone).toBe('Asia/Bangkok');
  });
});
