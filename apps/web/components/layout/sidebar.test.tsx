import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { Sidebar } from './sidebar';
import { premiumApi } from '@/features/premium/api/premium-api';
import { useAuth } from '@/providers/auth-provider';

const mockUsePathname = jest.fn(() => '/');
jest.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));

jest.mock('@/features/premium/api/premium-api', () => ({
  premiumApi: {
    status: jest.fn().mockResolvedValue({
      isPremium: false,
      status: 'NONE',
      expiresAt: null,
      priceVnd: 0,
      currency: 'VND',
      isMvpTestPrice: false,
      paymentsEnabled: false,
    }),
  },
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    // Sidebar now renders for guests too (no more separate top-nav guest landing page), so its
    // premium-status query is gated on a real user — most of these tests exercise the
    // authenticated shell, matching their existing intent.
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1', displayName: 'Thành' }, isLoading: false });
  });

  it('renders every nav destination with a real accessible name, even at the icon-rail width', () => {
    renderWithQuery(<Sidebar />);
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
    renderWithQuery(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Tarot' })).not.toHaveAttribute('aria-current');
  });

  it('marks exactly one nav item as current on a nested route, never also "Hôm nay" (regression — every href used to match "/" via a bare startsWith)', () => {
    mockUsePathname.mockReturnValue('/discover/tu-vi');
    renderWithQuery(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Lá số Tử Vi' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Hôm nay' })).not.toHaveAttribute('aria-current');
    mockUsePathname.mockReturnValue('/');
  });

  it('renders at the tablet breakpoint (768px), not only desktop — regression for the tablet/phone nav-sharing bug', () => {
    renderWithQuery(<Sidebar />);
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    expect(nav.className).toContain('tablet:flex');
    expect(nav.className).not.toContain('desktop:flex');
  });

  it('gives the logo link a real accessible name independent of the icon/wordmark responsive swap', () => {
    renderWithQuery(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Mệnh Vi' })).toBeInTheDocument();
  });

  it('shows the Premium upsell only once real status data confirms the user is not premium and payments are enabled', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValueOnce({
      isPremium: false,
      status: 'NONE',
      expiresAt: null,
      priceVnd: 99000,
      currency: 'VND',
      isMvpTestPrice: false,
      paymentsEnabled: true,
    });
    renderWithQuery(<Sidebar />);
    expect(await screen.findByRole('link', { name: /Nâng cấp ngay/ })).toBeInTheDocument();
  });

  it('does not show the Premium upsell for a user who is already premium', async () => {
    (premiumApi.status as jest.Mock).mockResolvedValueOnce({
      isPremium: true,
      status: 'ACTIVE',
      expiresAt: '2027-01-01T00:00:00.000Z',
      priceVnd: 99000,
      currency: 'VND',
      isMvpTestPrice: false,
      paymentsEnabled: true,
    });
    renderWithQuery(<Sidebar />);
    await screen.findByRole('link', { name: 'Hôm nay' });
    expect(screen.queryByRole('link', { name: /Nâng cấp ngay/ })).not.toBeInTheDocument();
  });

  it('renders for a guest without calling the premium-status API (no auth cookie to check against)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });
    (premiumApi.status as jest.Mock).mockClear();
    renderWithQuery(<Sidebar />);
    await screen.findByRole('link', { name: 'Hôm nay' });
    expect(premiumApi.status).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: /Nâng cấp ngay/ })).not.toBeInTheDocument();
  });
});
