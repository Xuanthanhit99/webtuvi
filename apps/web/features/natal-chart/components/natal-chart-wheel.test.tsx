import { render, screen } from '@testing-library/react';
import type { NatalChartDto } from '@beaconvie/types';
import { NatalChartWheel } from './natal-chart-wheel';

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
