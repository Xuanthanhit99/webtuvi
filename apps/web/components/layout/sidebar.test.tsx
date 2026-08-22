import { render, screen } from '@testing-library/react';
import { Sidebar } from './sidebar';

jest.mock('next/navigation', () => ({ usePathname: () => '/' }));

describe('Sidebar', () => {
  it('renders every nav destination with a real accessible name, even at the icon-rail width', () => {
    render(<Sidebar />);
    // Labels use sr-only (not `hidden`) at the tablet icon-rail width, so they must still be
    // reachable by accessible name at all times — this is the regression this test guards.
    expect(screen.getByRole('link', { name: 'Hôm nay' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lá số Tử Vi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarot' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bản đồ sao' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Thần số học' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cài đặt' })).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tarot' })).not.toHaveAttribute('aria-current');
  });

  it('renders at the tablet breakpoint (768px), not only desktop — regression for the tablet/phone nav-sharing bug', () => {
    render(<Sidebar />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav.className).toContain('tablet:flex');
    expect(nav.className).not.toContain('desktop:flex');
  });

  it('gives the logo link a real accessible name independent of the icon/wordmark responsive swap', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Tử Vi Tarot' })).toBeInTheDocument();
  });
});
