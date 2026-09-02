import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { NotificationBell } from './notification-bell';
import { notificationsApi } from '../api/notifications-api';
import { useAuth } from '@/providers/auth-provider';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock('../api/notifications-api', () => ({
  notificationsApi: { unreadCount: jest.fn(), list: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn() },
}));

jest.mock('@/providers/auth-provider', () => ({
  useAuth: jest.fn(),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    // NotificationBell renders for guests too (AppHeader is now shared by the whole Home shell),
    // so its unread-count query is gated on a real user — these tests exercise the authenticated
    // bell, matching their existing intent.
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1', displayName: 'Thành' }, isLoading: false });
  });

  it('renders no badge when there are zero unread notifications', async () => {
    (notificationsApi.unreadCount as jest.Mock).mockResolvedValue({ count: 0 });
    renderWithQuery(<NotificationBell />);

    await waitFor(() => expect(notificationsApi.unreadCount).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByText(/unread/)).not.toBeInTheDocument();
  });

  it('shows the real unread count in the badge and the accessible label', async () => {
    (notificationsApi.unreadCount as jest.Mock).mockResolvedValue({ count: 3 });
    renderWithQuery(<NotificationBell />);

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
  });

  it('caps the displayed badge at "9+" without hiding the real count from the accessible label', async () => {
    (notificationsApi.unreadCount as jest.Mock).mockResolvedValue({ count: 42 });
    renderWithQuery(<NotificationBell />);

    expect(await screen.findByText('9+')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications, 42 unread' })).toBeInTheDocument();
  });

  it('opens the Notification Center dialog on click', async () => {
    (notificationsApi.unreadCount as jest.Mock).mockResolvedValue({ count: 0 });
    const user = userEvent.setup();
    renderWithQuery(<NotificationBell />);

    await user.click(await screen.findByRole('button', { name: 'Notifications' }));

    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('renders for a guest without calling the unread-count API (no auth cookie to check against)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });
    renderWithQuery(<NotificationBell />);

    expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(notificationsApi.unreadCount).not.toHaveBeenCalled();
  });
});
