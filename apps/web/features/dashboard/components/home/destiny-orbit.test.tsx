import { render } from '@testing-library/react';
import { DestinyOrbit } from './destiny-orbit';

describe('DestinyOrbit', () => {
  it('renders the layered SVG celestial instrument with all 12 Earthly Branch glyphs', () => {
    const { container } = render(<DestinyOrbit />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    for (const glyph of branches) {
      expect(container.textContent).toContain(glyph);
    }
  });

  it('is purely decorative and hidden from assistive technology', () => {
    const { container } = render(<DestinyOrbit />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
