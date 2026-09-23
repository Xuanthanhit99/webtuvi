import { render, screen } from '@testing-library/react';
import DiscoverPage from './page';

// Domain + Brand Production Lock — the founder decision renamed the product to Tử Vi Tarot, but
// Eastern Horoscope (Ngũ Hành Phương Đông, Chinese Zodiac/Five Elements) and Tử Vi Lá Số
// (Vietnamese Tử Vi Đẩu Số, VDTTL-1956, shipped Sprint 18B) are two distinct, separate shipped
// modules, never to be conflated with each other. This is a real regression risk once the
// surrounding product is itself named "Tử Vi Tarot" — a careless future edit could easily blur the
// two. This test proves the distinction is still explicit in the rendered page, not just in a
// source comment.
//
// Sprint 18B.11: Tử Vi Lá Số shipped a real, deterministic engine + frontend — the tests below
// were updated from the prior "Coming soon" acknowledgment to reflect the card now being live and
// linking to `/discover/tu-vi`, while keeping the naming-boundary assertions unchanged.
describe('DiscoverPage — Eastern Horoscope vs. Tử Vi Lá Số naming boundary', () => {
  it('labels Eastern Horoscope with its real name, never as "Tử Vi"', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Ngũ Hành Phương Đông' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Tử Vi$/ })).not.toBeInTheDocument();
  });

  it('explicitly disclaims Eastern Horoscope is not Vietnamese Tử Vi Lá Số', () => {
    render(<DiscoverPage />);
    expect(screen.getByText(/Đây là một hệ riêng, không phải lá số Tử Vi Đẩu Số/)).toBeInTheDocument();
  });

  it('renders all five live Discovery systems by their correct, distinct names', () => {
    render(<DiscoverPage />);
    for (const name of ['Tarot', 'Bản Đồ Sao', 'Ngũ Hành Phương Đông', 'Thần Số Học', 'Tử Vi Lá Số']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });
});

describe('DiscoverPage — Tử Vi Lá Số (live, Sprint 18B)', () => {
  it('shows a Tử Vi Lá Số card with a working CTA to its real route, not marked Coming soon', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Tử Vi Lá Số' })).toBeInTheDocument();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Tử Vi Lá Số' });
    expect(heading.closest('a')).toHaveAttribute('href', '/discover/tu-vi');
  });

  it('does not link the Tử Vi Lá Số card to the archived /menh-vi prototype', () => {
    const { container } = render(<DiscoverPage />);
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs.some((href) => href?.includes('menh-vi'))).toBe(false);
  });

  it('distinguishes Tử Vi Lá Số from Ngũ Hành Phương Đông in its own description', () => {
    render(<DiscoverPage />);
    expect(screen.getByText(/Lập lá số Tử Vi Đẩu Số/)).toBeInTheDocument();
  });

  it('introduces the five real systems without implementation jargon', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: /Một câu hỏi, nhiều cách để hiểu mình/ })).toBeInTheDocument();
    expect(screen.queryByText(/API|deterministic|flow thật/i)).not.toBeInTheDocument();
  });
});

describe('DiscoverPage — editorial information architecture', () => {
  it('offers real cross-module paths and labels static curation honestly', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Đi theo câu hỏi của bạn' })).toBeInTheDocument();
    expect(screen.getByText(/không phải đề xuất cá nhân hóa/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Khám phá Thần số học/i })).toHaveAttribute('href', '/discover/numerology');
  });

  it('keeps the cross-system report separate from the five discovery systems', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Báo Cáo Vận Mệnh' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem báo cáo/i })).toHaveAttribute('href', '/reports');
  });
});
