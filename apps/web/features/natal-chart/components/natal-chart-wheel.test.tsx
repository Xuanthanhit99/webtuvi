import { render, screen } from '@testing-library/react';
import type { NatalChartDto } from '@beaconvie/types';
import { NatalChartWheel, planetRadii } from './natal-chart-wheel';

const baseChart: NatalChartDto = {
  id: 'c1',
  status: 'ACTIVE',
  visibility: 'COMPANION_VISIBLE',
  birthDate: '2000-06-15',
  birthTime: '14:30',
  birthTimeKnown: true,
  birthPlaceLabel: 'Hà Nội, Vietnam',
  timezone: 'Asia/Ho_Chi_Minh',
  zodiacMode: 'tropical',
  houseSystem: 'placidus',
  housesAvailable: true,
  calculationVersion: 'natal-chart-circular-horoscope-v1',
  engineVersion: '1.1.0',
  ascendant: { longitude: 209.87, sign: 'libra', degreeInSign: 29.87, meaning: 'Ascendant in Libra' },
  midheaven: { longitude: 280, sign: 'capricorn', degreeInSign: 10, meaning: 'Midheaven in Capricorn' },
  placements: [
    { body: 'sun', longitude: 84.5, sign: 'gemini', degreeInSign: 24.5, house: 8, retrograde: false, meaning: 'Sun in Gemini' },
    { body: 'moon', longitude: 86, sign: 'gemini', degreeInSign: 26, house: 8, retrograde: false, meaning: 'Moon in Gemini' },
    { body: 'mercury', longitude: 90, sign: 'cancer', degreeInSign: 0, house: 9, retrograde: false, meaning: 'Mercury' },
    { body: 'venus', longitude: 100, sign: 'cancer', degreeInSign: 10, house: 9, retrograde: false, meaning: 'Venus' },
    { body: 'mars', longitude: 120, sign: 'leo', degreeInSign: 0, house: 10, retrograde: false, meaning: 'Mars' },
    { body: 'jupiter', longitude: 150, sign: 'virgo', degreeInSign: 0, house: 11, retrograde: false, meaning: 'Jupiter' },
    { body: 'saturn', longitude: 180, sign: 'libra', degreeInSign: 0, house: 12, retrograde: false, meaning: 'Saturn' },
    { body: 'uranus', longitude: 210, sign: 'scorpio', degreeInSign: 0, house: 1, retrograde: false, meaning: 'Uranus' },
    { body: 'neptune', longitude: 240, sign: 'sagittarius', degreeInSign: 0, house: 2, retrograde: false, meaning: 'Neptune' },
    { body: 'pluto', longitude: 270, sign: 'capricorn', degreeInSign: 0, house: 3, retrograde: false, meaning: 'Pluto' },
  ],
  houses: Array.from({ length: 12 }, (_, i) => ({ number: i + 1, cuspLongitude: i * 30, sign: 'aries' as const })),
  aspects: [{ pointA: 'sun', pointB: 'moon', type: 'conjunction', orb: 1.5, angle: 1.5, meaning: 'Sun Conjunction Moon' }],
  interpretation: null,
  interpretedAt: null,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  archivedAt: null,
};

describe('NatalChartWheel', () => {
  it('renders as an accessible image with a Big Three summary in its label', () => {
    render(<NatalChartWheel chart={baseChart} />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveAccessibleName(/sun in gemini/i);
    expect(svg).toHaveAccessibleName(/moon in gemini/i);
    expect(svg).toHaveAccessibleName(/ascendant in libra/i);
  });

  it('renders every internal element as decorative (aria-hidden) — the real accessible data lives in the sibling list components', () => {
    const { container } = render(<NatalChartWheel chart={baseChart} />);
    const group = container.querySelector('svg > g');
    expect(group).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders without an Ascendant/Midheaven/houses when unavailable, and still labels the summary honestly', () => {
    const chartWithoutHouses: NatalChartDto = { ...baseChart, housesAvailable: false, ascendant: null, midheaven: null, houses: [] };
    render(<NatalChartWheel chart={chartWithoutHouses} />);
    const svg = screen.getByRole('img');
    expect(svg).toHaveAccessibleName(/ascendant unavailable/i);
  });

  it('does not crash when a chart has no aspects at all', () => {
    const chartWithoutAspects: NatalChartDto = { ...baseChart, aspects: [] };
    render(<NatalChartWheel chart={chartWithoutAspects} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});

// Sprint 11 remediation (docs/audit/sprint-11-pre-implementation-audit.md §28, §34): the
// collision-easing loop only ever compared a placement to its immediate predecessor in sorted
// order, so two planets straddling the 0°/360° seam were never checked against each other even
// though they're circularly only a few degrees apart. Regression coverage for the fix.
describe('planetRadii — 0°/360° wraparound collision easing', () => {
  it('eases two placements that straddle the 0°/360° boundary within 7° (e.g. 359.5° and 0.5°)', () => {
    // Sorted ascending, as the wheel component always passes them: the near-360° placement sorts
    // last, the near-0° placement sorts first — exactly the pair the original bug never compared.
    const radii = planetRadii([0.5, 90, 180, 359.5]);
    expect(radii[0]).not.toBe(radii[3]); // first (0.5°) and last (359.5°) must not render identically
    expect(radii[0]).toBeLessThan(100); // nudged inward from PLANET_BASE_R, not left at the default
  });

  it('does not ease placements that are near the boundary but more than 7° apart', () => {
    const radii = planetRadii([10, 90, 180, 340]);
    expect(radii[0]).toBe(100); // 10° vs 340° is a 30° circular distance — not close, no easing
    expect(radii[3]).toBe(100);
  });

  it('still eases ordinary interior conjunctions exactly as before (no regression)', () => {
    const radii = planetRadii([84.5, 86, 200]);
    expect(radii[0]).toBe(100);
    expect(radii[1]).not.toBe(radii[0]); // 84.5° and 86° are within 7° of each other
    expect(radii[2]).toBe(100); // far from both — unaffected
  });

  it('handles a single placement without throwing (no wraparound partner to compare against)', () => {
    expect(() => planetRadii([180])).not.toThrow();
    expect(planetRadii([180])).toEqual([100]);
  });
});
