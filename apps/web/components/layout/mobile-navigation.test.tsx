import { render, screen } from '@testing-library/react';
import { MobileNavigation } from './mobile-navigation';

jest.mock('next/navigation', () => ({ usePathname: () => '/discover/tarot' }));

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

  it('is phone-only (hidden from tablet width up) — regression for the tablet/phone nav-sharing bug', () => {
    render(<MobileNavigation />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav.className).toContain('tablet:hidden');
    expect(nav.className).not.toContain('desktop:hidden');
  });
});
