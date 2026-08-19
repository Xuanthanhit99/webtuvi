import { render, screen } from '@testing-library/react';
import { MobileNavigation } from './mobile-navigation';

jest.mock('next/navigation', () => ({ usePathname: () => '/discover' }));

describe('MobileNavigation', () => {
  it('renders every nav destination with a real accessible name', () => {
    render(<MobileNavigation />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Discover' })).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    render(<MobileNavigation />);
    expect(screen.getByRole('link', { name: 'Discover' })).toHaveAttribute('aria-current', 'page');
  });

  it('is phone-only (hidden from tablet width up) — regression for the tablet/phone nav-sharing bug', () => {
    render(<MobileNavigation />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav.className).toContain('tablet:hidden');
    expect(nav.className).not.toContain('desktop:hidden');
  });
});
