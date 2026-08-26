import { render } from '@testing-library/react';
import { DestinyOrbit } from './destiny-orbit';

describe('DestinyOrbit', () => {
  it('renders the approved Board 01 destiny wheel artwork', () => {
    const { container } = render(<DestinyOrbit />);

    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('08_destiny_wheel'));
  });

  it('is purely decorative and hidden from assistive technology', () => {
    const { container } = render(<DestinyOrbit />);

    expect(container.querySelector('img')).toHaveAttribute('aria-hidden', 'true');
  });
});
