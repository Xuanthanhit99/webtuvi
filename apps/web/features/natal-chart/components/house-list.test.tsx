import { render, screen } from '@testing-library/react';
import type { NatalChartDto } from '@beaconvie/types';
import { HouseList } from './house-list';

const baseChart = {
  housesAvailable: true,
  birthTimeKnown: true,
  houses: [
    { number: 1, cuspLongitude: 209.87, sign: 'libra' as const },
    { number: 2, cuspLongitude: 240, sign: 'scorpio' as const },
  ],
} as unknown as NatalChartDto;

describe('HouseList', () => {
  it('renders real house cusps and signs when available', () => {
    render(<HouseList chart={baseChart} />);
    expect(screen.getByText('1st house')).toBeInTheDocument();
    expect(screen.getByText('Libra')).toBeInTheDocument();
  });

  it('shows an honest "unavailable" state (never fabricated houses) when birth time is unknown', () => {
    render(<HouseList chart={{ ...baseChart, housesAvailable: false, birthTimeKnown: false, houses: [] }} />);
    expect(screen.getByText(/houses aren.t available/i)).toBeInTheDocument();
    expect(screen.getByText(/knowing your exact birth time/i)).toBeInTheDocument();
    expect(screen.queryByText('1st house')).not.toBeInTheDocument();
  });

  it('shows a different honest reason (extreme latitude) when birth time IS known but houses are still unavailable', () => {
    render(<HouseList chart={{ ...baseChart, housesAvailable: false, birthTimeKnown: true, houses: [] }} />);
    expect(screen.getByText(/birth latitude/i)).toBeInTheDocument();
  });
});
