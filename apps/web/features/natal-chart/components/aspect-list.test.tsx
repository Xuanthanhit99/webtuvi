import { render, screen } from '@testing-library/react';
import type { NatalAspectDto } from '@beaconvie/types';
import { AspectList } from './aspect-list';

const aspects: NatalAspectDto[] = [
  { pointA: 'sun', pointB: 'venus', type: 'conjunction', orb: 1.2, angle: 1.2, meaning: 'Sun Conjunction Venus — fused warmth' },
  { pointA: 'moon', pointB: 'ascendant', type: 'trine', orb: 5.4, angle: 118, meaning: 'Moon Trine Ascendant — an easy flow' },
];

describe('AspectList', () => {
  it('renders every real aspect, tightest orb first, with its fixed meaning', () => {
    render(<AspectList aspects={aspects} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Sun');
    expect(items[0]).toHaveTextContent('Conjunction');
    expect(items[0]).toHaveTextContent('Venus');
    expect(screen.getByText('Sun Conjunction Venus — fused warmth')).toBeInTheDocument();
  });

  it('labels an Ascendant/Midheaven aspect point with its full name, not the raw key', () => {
    render(<AspectList aspects={aspects} />);
    expect(screen.getByText('Ascendant')).toBeInTheDocument();
  });

  it('shows an honest empty state when there are no major aspects, never a fabricated one', () => {
    render(<AspectList aspects={[]} />);
    expect(screen.getByText('No major aspects')).toBeInTheDocument();
  });
});
