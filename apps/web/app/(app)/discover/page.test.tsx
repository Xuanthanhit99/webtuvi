import { render, screen } from '@testing-library/react';
import DiscoverPage from './page';

// Domain + Brand Production Lock — the founder decision renamed the product to Tử Vi Tarot, but
// Eastern Horoscope (Ngũ Hành Phương Đông, Chinese Zodiac/Five Elements) is a distinct, shipped
// module, never to be conflated with the separate, not-yet-built Vietnamese Tử Vi Lá Số (blocked
// by Sprint 18's domain reference). This is a real regression risk once the surrounding product is
// itself named "Tử Vi Tarot" — a careless future edit could easily blur the two. This test proves
// the distinction is still explicit in the rendered page, not just in a source comment.
//
// Pre-Live Product Experience Completion Audit finding #3 (remediated): the page now carries an
// honest "Tử Vi Lá Số — Coming soon" card so the brand promise isn't silently unacknowledged. The
// tests below were updated accordingly — the naming-boundary intent is unchanged, only a real,
// clearly-labeled "Tử Vi Lá Số" heading is now expected to exist (as a non-available card, distinct
// from Eastern Horoscope), rather than expected to be absent.
describe('DiscoverPage — Eastern Horoscope vs. Tử Vi Lá Số naming boundary', () => {
  it('labels Eastern Horoscope with its real name, never as "Tử Vi"', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Ngũ Hành Phương Đông' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Tử Vi$/ })).not.toBeInTheDocument();
  });

  it('explicitly disclaims Eastern Horoscope is not Vietnamese Tử Vi Lá Số', () => {
    render(<DiscoverPage />);
    expect(screen.getByText(/Not Vietnamese Tử Vi Lá Số, a separate future module/)).toBeInTheDocument();
  });

  it('renders all four live Discovery systems by their correct, distinct names', () => {
    render(<DiscoverPage />);
    for (const name of ['Tarot', 'Bản Đồ Sao', 'Ngũ Hành Phương Đông', 'Thần Số Học']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });
});

describe('DiscoverPage — Tử Vi Lá Số coming-soon acknowledgment', () => {
  it('shows a Tử Vi Lá Số card marked Coming soon — the only card so badged', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Tử Vi Lá Số' })).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(1);
  });

  it('does not render a CTA/link for the Tử Vi Lá Số card', () => {
    render(<DiscoverPage />);
    expect(screen.queryByRole('link', { name: /Try Tử Vi Lá Số/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Try Tử Vi Lá Số/i })).not.toBeInTheDocument();
  });

  it('does not link the Tử Vi Lá Số card to the archived /menh-vi prototype', () => {
    const { container } = render(<DiscoverPage />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs.some((href) => href?.includes('menh-vi'))).toBe(false);
  });

  it('distinguishes Tử Vi Lá Số from Ngũ Hành Phương Đông in its own description', () => {
    render(<DiscoverPage />);
    expect(screen.getByText(/Not the same as Ngũ Hành Phương Đông above/)).toBeInTheDocument();
  });

  it('tells the user in the page subheading that Tử Vi Lá Số is coming soon', () => {
    render(<DiscoverPage />);
    expect(screen.getByText(/Tử Vi Lá Số is coming soon/)).toBeInTheDocument();
  });
});
