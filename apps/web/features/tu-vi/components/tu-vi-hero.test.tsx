import { render, screen } from '@testing-library/react';
import { TuViHero } from './tu-vi-hero';

describe('TuViHero', () => {
  it('renders a single real H1 and a CTA that jumps to the real form section', () => {
    render(<TuViHero />);
    expect(screen.getByRole('heading', { level: 1, name: 'Lá số Tử Vi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lập lá số ngay' })).toHaveAttribute('href', '#tu-vi-form');
  });

  it('shows the trust row as plain methodology copy, not a fabricated score or count', () => {
    render(<TuViHero />);
    for (const label of ['Chính xác', 'Khoa học', 'Chi tiết', 'Chu kỳ vận mệnh']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText(/^\d+\s*\/\s*100$/)).not.toBeInTheDocument();
  });

  it('renders the decorative Destiny Orbit as aria-hidden (never presented as chart data)', () => {
    const { container } = render(<TuViHero />);
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });
});
