import { render, screen } from '@testing-library/react';
import type { NatalPlacementDto } from '@beaconvie/types';
import { PlanetList } from './planet-list';

const placements: NatalPlacementDto[] = [
  { body: 'sun', longitude: 84.5, sign: 'gemini', degreeInSign: 24.5, house: 8, retrograde: false, meaning: 'Sun (core identity) in Gemini — the 8th house' },
  { body: 'mercury', longitude: 90, sign: 'cancer', degreeInSign: 0, house: null, retrograde: true, meaning: 'Mercury in Cancer' },
];

describe('PlanetList', () => {
  it('renders every real placement with its sign, degree, house, and fixed meaning', () => {
    render(<PlanetList placements={placements} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText(/in Gemini · 24.5°/)).toBeInTheDocument();
    expect(screen.getByText('8th house')).toBeInTheDocument();
    expect(screen.getByText('Sun (core identity) in Gemini — the 8th house')).toBeInTheDocument();
  });

  it('shows a Retrograde badge only for retrograde placements, and omits a house badge when house is null', () => {
    render(<PlanetList placements={placements} />);
    expect(screen.getByText('Retrograde')).toBeInTheDocument();
    expect(screen.getByText('Mercury')).toBeInTheDocument();
  });
});
