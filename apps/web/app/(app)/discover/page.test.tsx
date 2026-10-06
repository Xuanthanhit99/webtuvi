import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiscoverPage from './page';

function setupUser() {
  return { user: userEvent.setup() };
}

describe('DiscoverPage — Eastern Horoscope vs. Tử Vi Lá Số naming boundary', () => {
  it('labels Eastern Horoscope with its real name and explicitly keeps it separate from Tử Vi Đẩu Số', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Ngũ Hành Phương Đông' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Tử Vi$/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Đây là một hệ riêng, không phải lá số Tử Vi Đẩu Số/)).toBeInTheDocument();
  });

  it('keeps the Eastern Horoscope route live and separate', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('link', { name: /Khám phá Ngũ Hành/i })).toHaveAttribute('href', '/discover/eastern-horoscope');
  });
});

describe('DiscoverPage — locked V4.1 intent-led information architecture', () => {
  it('starts from the user question instead of a system catalog', () => {
    render(<DiscoverPage />);
    expect(screen.getByRole('heading', { name: 'Điều gì đang khiến bạn bận lòng?' })).toBeInTheDocument();
    for (const label of ['Tình yêu', 'Công việc', 'Bản thân', 'Quyết định', 'Tương lai']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText(/API|deterministic|flow thật/i)).not.toBeInTheDocument();
  });

  it('maps Công việc to the live Tử Vi route and explains why it fits', async () => {
    const { user } = setupUser();
    render(<DiscoverPage />);
    await user.click(screen.getByRole('button', { name: 'Công việc' }));
    expect(screen.getByRole('heading', { name: 'Tử Vi Lá Số' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bắt đầu với Tử Vi Lá Số/i })).toHaveAttribute('href', '/discover/tu-vi');
    expect(screen.getByText(/Tử Vi phù hợp khi bạn muốn nhìn công việc/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Một điểm bắt đầu, không phải một phán quyết' })).toBeInTheDocument();
  });

  it('keeps all four core systems reachable through real intent states', async () => {
    const { user } = setupUser();
    const { container } = render(<DiscoverPage />);

    const expected: Array<[string, string, string]> = [
      ['Tình yêu', 'Tarot', '/discover/tarot'],
      ['Công việc', 'Tử Vi Lá Số', '/discover/tu-vi'],
      ['Bản thân', 'Bản Đồ Sao', '/discover/natal-chart'],
    ];

    for (const [intent, system, href] of expected) {
      await user.click(screen.getByRole('button', { name: intent }));
      expect(screen.getByRole('heading', { name: system })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: new RegExp(`Bắt đầu với ${system}`, 'i') })).toHaveAttribute('href', href);
    }

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/discover/numerology');
    expect(hrefs.some((href) => href?.includes('menh-vi'))).toBe(false);
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });
});
