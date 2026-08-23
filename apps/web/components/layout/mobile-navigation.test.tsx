import { render, screen } from '@testing-library/react';
import { MobileNavigation } from './mobile-navigation';

const mockUsePathname = jest.fn(() => '/discover/tarot');
jest.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));

describe('MobileNavigation', () => {
  it('renders every nav destination with a real accessible name', () => {
    render(<MobileNavigation />);
    expect(screen.getByRole('link', { name: 'Hôm nay' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lá số Tử Vi' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarot' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tôi' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Bản đồ sao' })).not.toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    render(<MobileNavigation />);
    expect(screen.getByRole('link', { name: 'Tarot' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks exactly one nav item as current, never also "Hôm nay" (regression — every href used to match "/" via a bare startsWith)', () => {
    render(<MobileNavigation />);
    expect(screen.getByRole('link', { name: 'Hôm nay' })).not.toHaveAttribute('aria-current');
  });

  it('is phone-only (hidden from tablet width up) — regression for the tablet/phone nav-sharing bug', () => {
    render(<MobileNavigation />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav.className).toContain('tablet:hidden');
    expect(nav.className).not.toContain('desktop:hidden');
  });
});
