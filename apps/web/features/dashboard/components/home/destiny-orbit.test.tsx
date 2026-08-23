import { render, screen } from '@testing-library/react';
import { DestinyOrbit } from './destiny-orbit';

describe('DestinyOrbit', () => {
  it('renders all 12 Earthly Branch labels as static, readable text', () => {
    render(<DestinyOrbit />);

    ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'].forEach((branch) => {
      expect(screen.getByText(branch)).toBeInTheDocument();
    });
  });

  it('is purely decorative and hidden from assistive technology', () => {
    const { container } = render(<DestinyOrbit />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
