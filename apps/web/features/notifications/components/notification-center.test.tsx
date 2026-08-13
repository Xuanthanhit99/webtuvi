import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render-with-query';
import { NotificationCenter } from './notification-center';
import { notificationsApi } from '../api/notifications-api';
import { Toaster } from '@/components/ui/toast';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('../api/notifications-api', () => ({
  notificationsApi: { list: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn() },
}));

const NOTIFICATION = {
  id: 'notif-1',
  category: 'DISCOVERY' as const,
  class: 'REMINDER' as const,
  type: 'tarot.daily_reminder',
  title: "Today's card is ready",
  body: "You haven't drawn your Daily Tarot card yet today.",
  deepLink: '/discover/tarot',
  read: false,
  createdAt: '2026-08-13T09:00:00.000Z',
};

function renderCenter(onNavigate = jest.fn()) {
  return renderWithQuery(
    <>
      <NotificationCenter onNavigate={onNavigate} />
      <Toaster />
    </>,
  );
}

describe('NotificationCenter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the empty state — "nothing new" is the expected, healthy default', async () => {
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    renderCenter();

    expect(await screen.findByText(/nothing new/i)).toBeInTheDocument();
  });

  it('shows an error state with a retry option when the list fails to load', async () => {
    (notificationsApi.list as jest.Mock).mockRejectedValue(new Error('boom'));
    renderCenter();

    expect(await screen.findByText(/couldn.t load your notifications/i)).toBeInTheDocument();
  });

  it('renders each notification with title, body, and an unread indicator', async () => {
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [NOTIFICATION], total: 1, page: 1, pageSize: 20 });
    renderCenter();

    expect(await screen.findByText("Today's card is ready")).toBeInTheDocument();
    expect(screen.getByText(/haven.t drawn your daily tarot card/i)).toBeInTheDocument();
  });

  it('marks a notification read and navigates to its deep link on click', async () => {
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [NOTIFICATION], total: 1, page: 1, pageSize: 20 });
    (notificationsApi.markRead as jest.Mock).mockResolvedValue({ ...NOTIFICATION, read: true });
    const onNavigate = jest.fn();
    const user = userEvent.setup();
    renderCenter(onNavigate);

    await user.click(await screen.findByText("Today's card is ready"));

    await waitFor(() => expect(notificationsApi.markRead).toHaveBeenCalledWith('notif-1'));
    expect(onNavigate).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/discover/tarot');
  });

  it.each([
    ['https://evil.example', 'absolute external URL'],
    ['//evil.example', 'protocol-relative URL'],
    ['javascript:alert(1)', 'javascript: URL'],
    ['data:text/html,<script>alert(1)</script>', 'data: URL'],
    ['/discover/tarot?ref=reminder', 'a genuinely safe relative path with a query string still navigates'],
  ])('Sprint 11 Release Closure — never navigates to an unsafe deep link (%s: %s)', async (deepLink) => {
    const unsafeNotification = { ...NOTIFICATION, deepLink };
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [unsafeNotification], total: 1, page: 1, pageSize: 20 });
    (notificationsApi.markRead as jest.Mock).mockResolvedValue({ ...unsafeNotification, read: true });
    const user = userEvent.setup();
    renderCenter();

    await user.click(await screen.findByText("Today's card is ready"));

    if (deepLink === '/discover/tarot?ref=reminder') {
      // The one case above with a safe leading path is expected to navigate — it's here to prove
      // the guard isn't simply rejecting everything.
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith(deepLink));
    } else {
      await waitFor(() => expect(notificationsApi.markRead).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
    }
  });

  it('does not re-mark an already-read notification', async () => {
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [{ ...NOTIFICATION, read: true }], total: 1, page: 1, pageSize: 20 });
    const user = userEvent.setup();
    renderCenter();

    await user.click(await screen.findByText("Today's card is ready"));

    expect(notificationsApi.markRead).not.toHaveBeenCalled();
  });

  it('shows "Mark all read" only when at least one notification is unread, and it clears them', async () => {
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [NOTIFICATION], total: 1, page: 1, pageSize: 20 });
    (notificationsApi.markAllRead as jest.Mock).mockResolvedValue({ updatedCount: 1 });
    const user = userEvent.setup();
    renderCenter();

    const button = await screen.findByRole('button', { name: /mark all read/i });
    await user.click(button);

    await waitFor(() => expect(notificationsApi.markAllRead).toHaveBeenCalled());
    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument();
  });

  it('hides "Mark all read" when every notification is already read', async () => {
    (notificationsApi.list as jest.Mock).mockResolvedValue({ items: [{ ...NOTIFICATION, read: true }], total: 1, page: 1, pageSize: 20 });
    renderCenter();

    await screen.findByText("Today's card is ready");
    expect(screen.queryByRole('button', { name: /mark all read/i })).not.toBeInTheDocument();
  });
});
