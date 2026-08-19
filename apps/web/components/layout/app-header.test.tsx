import { screen } from '@testing-library/react';
import { renderWithQuery } from '@/test/render-with-query';
import { AppHeader } from './app-header';
import { useAuth } from '@/providers/auth-provider';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: jest.fn(),
  useInvalidateAuth: () => jest.fn(),
}));

jest.mock('@/features/notifications/api/notifications-api', () => ({
  notificationsApi: { unreadCount: jest.fn().mockResolvedValue({ count: 0 }), list: jest.fn().mockResolvedValue({ items: [] }) },
}));

/** Interim Sprint — Admin Operator Tooling. Frontend visibility is not the security boundary
 * (AdminGuard on the API is) — this test only proves the UI-convenience link renders/hides
 * correctly, mirroring docs/audit/admin-operator-tooling-pre-implementation-audit.md §17's own
 * framing of what this layer is and isn't responsible for. */
describe('AppHeader — Operator Tools link visibility', () => {
  function mockUser(role: 'USER' | 'ADMIN') {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'u1', email: 'a@x.com', displayName: 'A', role, emailVerifiedAt: null, onboardingCompletedAt: null, createdAt: '' },
      isLoading: false,
      refetch: jest.fn(),
    });
  }

  it('renders the Operator Tools link for an ADMIN user', () => {
    mockUser('ADMIN');
    renderWithQuery(<AppHeader />);
    expect(screen.getByRole('link', { name: 'Operator Tools' })).toBeInTheDocument();
  });

  it('does not render the Operator Tools link for a plain USER', () => {
    mockUser('USER');
    renderWithQuery(<AppHeader />);
    expect(screen.queryByRole('link', { name: 'Operator Tools' })).not.toBeInTheDocument();
  });

  it('does not render the Operator Tools link while the session is still loading (user is null)', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: true, refetch: jest.fn() });
    renderWithQuery(<AppHeader />);
    expect(screen.queryByRole('link', { name: 'Operator Tools' })).not.toBeInTheDocument();
  });
});
